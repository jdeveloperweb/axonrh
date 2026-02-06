'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    BrainCircuit,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    History,
    Loader2,
    Settings,
} from 'lucide-react';
import {
    discApi,
    DiscEvaluation,
    DiscQuestion
} from '@/lib/api/performance';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/use-toast';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

const profileDescriptions: Record<string, { title: string; description: string; color: string; strengths: string[] }> = {
    DOMINANCE: {
        title: 'Dominante (D)',
        description: 'Voce e focado em resultados, direto e assertivo. Gosta de desafios e de assumir o controle das situacoes.',
        color: '#ef4444',
        strengths: ['Tomada de decisao rapida', 'Visao orientada a metas', 'Disposicao para assumir riscos', 'Capacidade de liderar sob pressao'],
    },
    INFLUENCE: {
        title: 'Influente (I)',
        description: 'Voce e comunicativo, entusiasta e persuasivo. Gosta de interagir com pessoas e criar um ambiente positivo.',
        color: '#eab308',
        strengths: ['Otimismo e entusiasmo', 'Facilidade em persuadir', 'Criatividade na solucao de problemas', 'Habilidade de networking'],
    },
    STEADINESS: {
        title: 'Estavel (S)',
        description: 'Voce e calmo, paciente e leal. Valoriza a cooperacao e a estabilidade no ambiente de trabalho.',
        color: '#22c55e',
        strengths: ['Excelente ouvinte', 'Persistencia e consistencia', 'Habilidade conciliadora', 'Confiavel e leal'],
    },
    CONSCIENTIOUSNESS: {
        title: 'Conforme (C)',
        description: 'Voce e analitico, preciso e detalhista. Valoriza a qualidade, regras e procedimentos.',
        color: '#3b82f6',
        strengths: ['Analise profunda', 'Padroes elevados de qualidade', 'Planejamento sistematico', 'Atencao aos detalhes'],
    },
};

// Mock questions when backend is not available
const MOCK_QUESTIONS: DiscQuestion[] = [
    {
        id: '1',
        text: "Quando estou em um grupo, eu costumo...",
        order: 1,
        options: [
            { id: "1a", text: "Assumir a lideranca e definir o rumo", value: "D" },
            { id: "1b", text: "Conversar e animar o ambiente", value: "I" },
            { id: "1c", text: "Ouvir e apoiar os outros", value: "S" },
            { id: "1d", text: "Observar e analisar os detalhes", value: "C" }
        ]
    },
    {
        id: '2',
        text: "Diante de um conflito, minha reacao e...",
        order: 2,
        options: [
            { id: "2a", text: "Enfrentar e resolver logo", value: "D" },
            { id: "2b", text: "Tentar persuadir e apaziguar", value: "I" },
            { id: "2c", text: "Evitar e buscar a harmonia", value: "S" },
            { id: "2d", text: "Analisar os fatos logicamente", value: "C" }
        ]
    },
    {
        id: '3',
        text: "No trabalho, valorizo mais...",
        order: 3,
        options: [
            { id: "3a", text: "Resultados e desafios", value: "D" },
            { id: "3b", text: "Reconhecimento e interacao", value: "I" },
            { id: "3c", text: "Seguranca e estabilidade", value: "S" },
            { id: "3d", text: "Precisao e qualidade", value: "C" }
        ]
    },
    {
        id: '4',
        text: "Minha forma de comunicacao e...",
        order: 4,
        options: [
            { id: "4a", text: "Direta e assertiva", value: "D" },
            { id: "4b", text: "Entusiasta e persuasiva", value: "I" },
            { id: "4c", text: "Calma e atenciosa", value: "S" },
            { id: "4d", text: "Detalhada e especifica", value: "C" }
        ]
    },
    {
        id: '5',
        text: "Quando preciso tomar uma decisao importante, eu...",
        order: 5,
        options: [
            { id: "5a", text: "Decido rapidamente e sigo em frente", value: "D" },
            { id: "5b", text: "Consulto outras pessoas e busco consenso", value: "I" },
            { id: "5c", text: "Penso bem antes de agir", value: "S" },
            { id: "5d", text: "Analiso todas as opcoes detalhadamente", value: "C" }
        ]
    },
    {
        id: '6',
        text: "Em relacao a mudancas, eu geralmente...",
        order: 6,
        options: [
            { id: "6a", text: "Abraco as mudancas e lidero a transicao", value: "D" },
            { id: "6b", text: "Vejo o lado positivo e motivo os outros", value: "I" },
            { id: "6c", text: "Preciso de tempo para me adaptar", value: "S" },
            { id: "6d", text: "Questiono e avalio os riscos", value: "C" }
        ]
    },
    {
        id: '7',
        text: "Minha abordagem para resolver problemas e...",
        order: 7,
        options: [
            { id: "7a", text: "Ir direto ao ponto e agir rapidamente", value: "D" },
            { id: "7b", text: "Fazer um brainstorm com a equipe", value: "I" },
            { id: "7c", text: "Buscar solucoes que funcionaram antes", value: "S" },
            { id: "7d", text: "Pesquisar e analisar todas as opcoes", value: "C" }
        ]
    },
    {
        id: '8',
        text: "Quando trabalho em equipe, eu prefiro...",
        order: 8,
        options: [
            { id: "8a", text: "Liderar e direcionar as acoes", value: "D" },
            { id: "8b", text: "Colaborar e manter o clima positivo", value: "I" },
            { id: "8c", text: "Apoiar e garantir a harmonia", value: "S" },
            { id: "8d", text: "Garantir a qualidade e os padroes", value: "C" }
        ]
    },
    {
        id: '9',
        text: "Sob pressao, eu tendo a...",
        order: 9,
        options: [
            { id: "9a", text: "Ficar mais focado e determinado", value: "D" },
            { id: "9b", text: "Buscar apoio e compartilhar a carga", value: "I" },
            { id: "9c", text: "Manter a calma e seguir o plano", value: "S" },
            { id: "9d", text: "Verificar cada detalhe com mais cuidado", value: "C" }
        ]
    },
    {
        id: '10',
        text: "Minha maior motivacao no trabalho e...",
        order: 10,
        options: [
            { id: "10a", text: "Alcancar metas e obter resultados", value: "D" },
            { id: "10b", text: "Ser reconhecido e trabalhar com pessoas", value: "I" },
            { id: "10c", text: "Ter estabilidade e um bom ambiente", value: "S" },
            { id: "10d", text: "Fazer um trabalho de alta qualidade", value: "C" }
        ]
    },
];

export default function DiscPage() {
    const { user } = useAuthStore();
    const { toast } = useToast();
    const [result, setResult] = useState<DiscEvaluation | null>(null);
    const [history, setHistory] = useState<DiscEvaluation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTakingAssessment, setIsTakingAssessment] = useState(false);
    const [questions, setQuestions] = useState<DiscQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const isAdmin = user?.roles?.some((role: string) => ['ADMIN', 'RH'].includes(role));

    useEffect(() => {
        if (user?.id) {
            loadData();
        }
    }, [user?.id]);

    const loadData = async () => {
        try {
            setLoading(true);
            if (!user?.id) return;

            // Load questions from API or use mock
            try {
                const questionsRes = await discApi.getQuestions();
                setQuestions(questionsRes.length > 0 ? questionsRes : MOCK_QUESTIONS);
            } catch {
                console.log('Using mock questions');
                setQuestions(MOCK_QUESTIONS);
            }

            // Load latest result
            try {
                const res = await discApi.getLatest(user.id);
                setResult(res);

                // Load history
                const historyRes = await discApi.getHistory(user.id);
                setHistory(historyRes);
            } catch {
                console.log('Nenhum resultado DISC encontrado');
                setResult(null);
                setHistory([]);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStart = () => {
        setIsTakingAssessment(true);
        setCurrentQuestionIndex(0);
        setAnswers({});
    };

    const handleAnswer = (questionId: string, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const calculateLocalScores = () => {
        let d = 0, i = 0, s = 0, c = 0;
        const total = Object.keys(answers).length;

        Object.values(answers).forEach(value => {
            switch (value.toUpperCase()) {
                case 'D': d++; break;
                case 'I': i++; break;
                case 'S': s++; break;
                case 'C': c++; break;
            }
        });

        return {
            dScore: total > 0 ? Math.round((d / total) * 100) : 0,
            iScore: total > 0 ? Math.round((i / total) * 100) : 0,
            sScore: total > 0 ? Math.round((s / total) * 100) : 0,
            cScore: total > 0 ? Math.round((c / total) * 100) : 0,
        };
    };

    const determinePrimaryProfile = (scores: { dScore: number; iScore: number; sScore: number; cScore: number }) => {
        const max = Math.max(scores.dScore, scores.iScore, scores.sScore, scores.cScore);
        if (scores.dScore === max) return 'DOMINANCE';
        if (scores.iScore === max) return 'INFLUENCE';
        if (scores.sScore === max) return 'STEADINESS';
        return 'CONSCIENTIOUSNESS';
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            if (!user?.id || !user?.name) return;

            try {
                const res = await discApi.submit(user.id, user.name, answers);
                setResult(res);
                toast({ title: 'Sucesso', description: 'Avaliacao DISC concluida!' });
            } catch (error) {
                // If API fails, calculate locally
                console.log('API failed, calculating locally');
                const scores = calculateLocalScores();
                const primaryProfile = determinePrimaryProfile(scores);

                const localResult: DiscEvaluation = {
                    id: 'local-' + Date.now(),
                    employeeId: user.id,
                    employeeName: user.name,
                    ...scores,
                    primaryProfile: primaryProfile as any,
                    status: 'COMPLETED',
                    completedAt: new Date().toISOString(),
                };
                setResult(localResult);
                toast({ title: 'Avaliacao concluida', description: 'Seu perfil DISC foi calculado.' });
            }

            setIsTakingAssessment(false);
            loadData();
        } catch (error) {
            console.error("Submit failed:", error);
            toast({ title: 'Erro', description: 'Falha ao enviar avaliacao', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Assessment Screen
    if (isTakingAssessment && questions.length > 0) {
        const currentQ = questions[currentQuestionIndex];
        const progress = ((currentQuestionIndex) / questions.length) * 100;

        return (
            <div className="max-w-2xl mx-auto space-y-6 py-8">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Questao {currentQuestionIndex + 1} de {questions.length}</span>
                        <span>{Math.round(progress)}% concluido</span>
                    </div>
                    <Progress value={progress} />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">{currentQ.text}</CardTitle>
                        <CardDescription>Selecione a opcao que melhor descreve voce</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {currentQ.options.map((opt) => (
                            <div
                                key={opt.id}
                                onClick={() => handleAnswer(currentQ.id, opt.value)}
                                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                    answers[currentQ.id] === opt.value
                                        ? 'bg-primary/10 border-primary ring-2 ring-primary'
                                        : 'hover:bg-muted hover:border-primary/30'
                                }`}
                            >
                                <p className="font-medium">{opt.text}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Anterior
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={!answers[currentQ.id] || submitting}
                    >
                        {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {currentQuestionIndex === questions.length - 1
                            ? (submitting ? 'Calculando...' : 'Finalizar')
                            : 'Proximo'}
                        {!submitting && currentQuestionIndex < questions.length - 1 && (
                            <ArrowRight className="h-4 w-4 ml-2" />
                        )}
                    </Button>
                </div>
            </div>
        );
    }

    // Result Dashboard
    if (result) {
        const profileInfo = profileDescriptions[result.primaryProfile];
        const chartData = [
            { subject: 'Dominancia', A: result.dScore, fullMark: 100 },
            { subject: 'Influencia', A: result.iScore, fullMark: 100 },
            { subject: 'Estabilidade', A: result.sScore, fullMark: 100 },
            { subject: 'Conformidade', A: result.cScore, fullMark: 100 },
        ];

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <BrainCircuit className="h-8 w-8 text-primary" />
                            Seu Perfil DISC
                        </h1>
                        <p className="text-muted-foreground">Analise comportamental completa</p>
                    </div>
                    <div className="flex gap-2">
                        {isAdmin && (
                            <Link href="/performance/disc/manage">
                                <Button variant="outline">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Gerenciar Avaliacoes
                                </Button>
                            </Link>
                        )}
                        <Button variant="outline" onClick={handleStart}>
                            Refazer Teste
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Main Result Card */}
                    <Card className="md:col-span-2 bg-gradient-to-br from-primary/5 to-background border-primary/20">
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="text-center md:text-left flex-1">
                                    <Badge
                                        className="mb-2 text-lg py-1 px-4"
                                        style={{ backgroundColor: profileInfo?.color + '20', color: profileInfo?.color }}
                                    >
                                        {profileInfo?.title}
                                    </Badge>
                                    <h2 className="text-2xl font-bold mb-4">
                                        {profileInfo?.description}
                                    </h2>
                                    <p className="text-muted-foreground">
                                        Este perfil indica suas tendencias naturais de comportamento.
                                        Use essas informacoes para melhorar sua comunicacao, lideranca e trabalho em equipe.
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-4">
                                        Avaliacao realizada em {formatDate(result.completedAt)}
                                    </p>
                                </div>
                                <div className="w-full md:w-1/3 h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="subject" />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                            <Radar
                                                name="Voce"
                                                dataKey="A"
                                                stroke={profileInfo?.color}
                                                fill={profileInfo?.color}
                                                fillOpacity={0.5}
                                            />
                                            <Tooltip />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Score Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalhamento</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="font-medium" style={{ color: '#ef4444' }}>Dominancia (D)</span>
                                    <span className="font-bold">{result.dScore}%</span>
                                </div>
                                <Progress value={result.dScore} className="h-3" />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Foco em resultados, assertividade e controle.
                                </p>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="font-medium" style={{ color: '#eab308' }}>Influencia (I)</span>
                                    <span className="font-bold">{result.iScore}%</span>
                                </div>
                                <Progress value={result.iScore} className="h-3" />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Foco em pessoas, comunicacao e otimismo.
                                </p>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="font-medium" style={{ color: '#22c55e' }}>Estabilidade (S)</span>
                                    <span className="font-bold">{result.sScore}%</span>
                                </div>
                                <Progress value={result.sScore} className="h-3" />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Foco em cooperacao, paciencia e lealdade.
                                </p>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="font-medium" style={{ color: '#3b82f6' }}>Conformidade (C)</span>
                                    <span className="font-bold">{result.cScore}%</span>
                                </div>
                                <Progress value={result.cScore} className="h-3" />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Foco em qualidade, precisao e regras.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Strengths */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pontos Fortes do Perfil</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {profileInfo?.strengths.map((strength, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                        <span>{strength}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* History Section */}
                {history.length > 1 && (
                    <>
                        <Button
                            variant="ghost"
                            onClick={() => setShowHistory(!showHistory)}
                            className="w-full"
                        >
                            <History className="h-4 w-4 mr-2" />
                            {showHistory ? 'Ocultar Historico' : `Ver Historico (${history.length - 1} avaliacoes anteriores)`}
                            <ArrowRight className={`h-4 w-4 ml-2 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
                        </Button>

                        {showHistory && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Historico de Avaliacoes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {history.slice(1).map((evaluation) => {
                                            const evalProfile = profileDescriptions[evaluation.primaryProfile];
                                            return (
                                                <div
                                                    key={evaluation.id}
                                                    className="flex items-center justify-between p-4 border rounded-lg"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <Badge style={{ backgroundColor: evalProfile?.color + '20', color: evalProfile?.color }}>
                                                            {evalProfile?.title}
                                                        </Badge>
                                                        <div className="text-sm text-muted-foreground">
                                                            D: {evaluation.dScore}% | I: {evaluation.iScore}% | S: {evaluation.sScore}% | C: {evaluation.cScore}%
                                                        </div>
                                                    </div>
                                                    <span className="text-sm text-muted-foreground">
                                                        {formatDate(evaluation.completedAt)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        );
    }

    // Initial Screen (No Result)
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <BrainCircuit className="h-8 w-8 text-primary" />
                        Avaliacao DISC
                    </h1>
                    <p className="text-muted-foreground">Descubra seu perfil comportamental</p>
                </div>
                {isAdmin && (
                    <Link href="/performance/disc/manage">
                        <Button variant="outline">
                            <Settings className="h-4 w-4 mr-2" />
                            Gerenciar Avaliacoes
                        </Button>
                    </Link>
                )}
            </div>

            <Card className="max-w-3xl mx-auto">
                <CardContent className="pt-8">
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="bg-primary/10 p-6 rounded-full">
                            <BrainCircuit className="h-16 w-16 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">Descubra seu Perfil Comportamental</h2>
                            <p className="text-muted-foreground max-w-lg">
                                O teste DISC ajuda a entender suas tendencias de comportamento,
                                como voce reage a desafios, influencia pessoas, lida com mudancas e segue regras.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full max-w-md text-left">
                            <div className="p-4 border rounded-lg">
                                <div className="font-bold text-primary mb-1">Autoconhecimento</div>
                                <p className="text-sm text-muted-foreground">
                                    Entenda seus pontos fortes e areas de desenvolvimento.
                                </p>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <div className="font-bold text-primary mb-1">Comunicacao</div>
                                <p className="text-sm text-muted-foreground">
                                    Melhore como voce se relaciona com colegas.
                                </p>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <div className="font-bold text-primary mb-1">Trabalho em Equipe</div>
                                <p className="text-sm text-muted-foreground">
                                    Entenda como contribuir melhor em times.
                                </p>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <div className="font-bold text-primary mb-1">Lideranca</div>
                                <p className="text-sm text-muted-foreground">
                                    Identifique seu estilo de lideranca natural.
                                </p>
                            </div>
                        </div>

                        <Button
                            size="lg"
                            onClick={handleStart}
                            className="px-8 text-lg h-12"
                            disabled={questions.length === 0}
                        >
                            <ArrowRight className="mr-2 h-5 w-5" />
                            Iniciar Avaliacao
                        </Button>
                        <p className="text-sm text-muted-foreground">
                            Tempo estimado: 5-10 minutos | {questions.length} Perguntas
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
