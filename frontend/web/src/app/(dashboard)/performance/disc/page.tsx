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
    DiscQuestion,
    DiscProfileType
} from '@/lib/api/performance';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/use-toast';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

const profileDescriptions: Record<string, { title: string; description: string; color: string; strengths: string[] }> = {
    DOMINANCE: {
        title: 'Dominante (D)',
        description: 'Você é focado em resultados, direto e assertivo. Gosta de desafios e de assumir o controle das situações.',
        color: '#ef4444',
        strengths: ['Tomada de decisão rápida', 'Visão orientada a metas', 'Disposição para assumir riscos', 'Capacidade de liderar sob pressão'],
    },
    INFLUENCE: {
        title: 'Influente (I)',
        description: 'Você é comunicativo, entusiasta e persuasivo. Gosta de interagir com pessoas e criar um ambiente positivo.',
        color: '#eab308',
        strengths: ['Otimismo e entusiasmo', 'Facilidade em persuadir', 'Criatividade na solução de problemas', 'Habilidade de networking'],
    },
    STEADINESS: {
        title: 'Estável (S)',
        description: 'Você é calmo, paciente e leal. Valoriza a cooperação e a estabilidade no ambiente de trabalho.',
        color: '#22c55e',
        strengths: ['Excelente ouvinte', 'Persistência e consistência', 'Habilidade conciliadora', 'Confiável e leal'],
    },
    CONSCIENTIOUSNESS: {
        title: 'Conforme (C)',
        description: 'Você é analítico, preciso e detalhista. Valoriza a qualidade, regras e procedimentos.',
        color: '#3b82f6',
        strengths: ['Análise profunda', 'Padrões elevados de qualidade', 'Planejamento sistemático', 'Atenção aos detalhes'],
    },
};

// Mock questions when backend is not available
const MOCK_QUESTIONS: DiscQuestion[] = [
    {
        id: "1",
        text: "Quando estou em um grupo, eu costumo...",
        order: 1,
        options: [
            { id: "1a", text: "Assumir a liderança e definir o rumo", value: "D" },
            { id: "1b", text: "Conversar e animar o ambiente", value: "I" },
            { id: "1c", text: "Ouvir e apoiar os outros", value: "S" },
            { id: "1d", text: "Observar e analisar os detalhes", value: "C" }
        ]
    },
    {
        id: "2",
        text: "Diante de um conflito, minha reação é...",
        order: 2,
        options: [
            { id: "2a", text: "Enfrentar e resolver logo", value: "D" },
            { id: "2b", text: "Tentar persuadir e apaziguar", value: "I" },
            { id: "2c", text: "Evitar e buscar a harmonia", value: "S" },
            { id: "2d", text: "Analisar os fatos logicamente", value: "C" }
        ]
    },
    {
        id: "3",
        text: "No trabalho, valorizo mais...",
        order: 3,
        options: [
            { id: "3a", text: "Resultados e desafios", value: "D" },
            { id: "3b", text: "Reconhecimento e interação", value: "I" },
            { id: "3c", text: "Segurança e estabilidade", value: "S" },
            { id: "3d", text: "Precisão e qualidade", value: "C" }
        ]
    },
    {
        id: "4",
        text: "Minha forma de comunicação é...",
        order: 4,
        options: [
            { id: "4a", text: "Direta e assertiva", value: "D" },
            { id: "4b", text: "Entusiasta e persuasiva", value: "I" },
            { id: "4c", text: "Calma e atenciosa", value: "S" },
            { id: "4d", text: "Detalhada e específica", value: "C" }
        ]
    },
    {
        id: '5',
        text: "Quando preciso tomar uma decisão importante, eu...",
        order: 5,
        options: [
            { id: "5a", text: "Decido rapidamente e sigo em frente", value: "D" },
            { id: "5b", text: "Consulto outras pessoas e busco consenso", value: "I" },
            { id: "5c", text: "Penso bem antes de agir", value: "S" },
            { id: "5d", text: "Analiso todas as opções detalhadamente", value: "C" }
        ]
    },
    {
        id: '6',
        text: "Em relação a mudanças, eu geralmente...",
        order: 6,
        options: [
            { id: "6a", text: "Abraço as mudanças e lidero a transição", value: "D" },
            { id: "6b", text: "Vejo o lado positivo e motivo os outros", value: "I" },
            { id: "6c", text: "Preciso de tempo para me adaptar", value: "S" },
            { id: "6d", text: "Questiono e avalio os riscos", value: "C" }
        ]
    },
    {
        id: '7',
        text: "Minha abordagem para resolver problemas é...",
        order: 7,
        options: [
            { id: "7a", text: "Ir direto ao ponto e agir rapidamente", value: "D" },
            { id: "7b", text: "Fazer um brainstorm com a equipe", value: "I" },
            { id: "7c", text: "Buscar soluções que funcionaram antes", value: "S" },
            { id: "7d", text: "Pesquisar e analisar todas as opções", value: "C" }
        ]
    },
    {
        id: '8',
        text: "Quando trabalho em equipe, eu prefiro...",
        order: 8,
        options: [
            { id: "8a", text: "Liderar e direcionar as ações", value: "D" },
            { id: "8b", text: "Colaborar e manter o clima positivo", value: "I" },
            { id: "8c", text: "Apoiar e garantir a harmonia", value: "S" },
            { id: "8d", text: "Garantir a qualidade e os padrões", value: "C" }
        ]
    },
    {
        id: '9',
        text: "Sob pressão, eu tendo a...",
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
        text: "Minha maior motivação no trabalho é...",
        order: 10,
        options: [
            { id: "10a", text: "Alcançar metas e obter resultados", value: "D" },
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

            // Load questions
            try {
                const questionsRes = await discApi.getQuestions();
                setQuestions(questionsRes.length > 0 ? questionsRes : MOCK_QUESTIONS);
            } catch {
                console.log('Using mock questions');
                setQuestions(MOCK_QUESTIONS);
            }

            // Load latest result and history
            try {
                const res = await discApi.getLatest(user.id);
                setResult(res);

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
            if (!user?.id || !user?.name) throw new Error("Usuário não autenticado");

            try {
                const res = await discApi.submit(user.id, user.name, answers);
                setResult(res);
                toast({ title: 'Sucesso', description: 'Avaliação DISC concluída!' });
            } catch (error) {
                console.log('API failed, calculating locally', error);
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
                toast({ title: 'Avaliação concluída', description: 'Seu perfil DISC foi calculado localmente.' });
            }

            setIsTakingAssessment(false);
            loadData();
        } catch (error) {
            console.error("Submit failed:", error);
            toast({ title: 'Erro', description: 'Falha ao enviar avaliação', variant: 'destructive' });
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
            <div className="max-w-3xl mx-auto space-y-8 py-12">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-400">Avaliação Comportamental</h2>
                    <h1 className="text-4xl font-black">Mapeando seu Perfil</h1>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                        <span>Questão {currentQuestionIndex + 1} de {questions.length}</span>
                        <span className="text-primary">{Math.round(progress)}% Concluído</span>
                    </div>
                    <Progress value={progress} className="h-3 rounded-full shadow-inner" />
                </div>

                <Card className="border-none shadow-2xl bg-white overflow-hidden">
                    <div className="h-2 bg-primary" />
                    <CardHeader className="pb-8 pt-10 px-10">
                        <CardTitle className="text-2xl font-black leading-tight text-slate-900">{currentQ.text}</CardTitle>
                        <CardDescription className="text-lg">Escolha a alternativa que mais ressoa com sua forma natural de agir:</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 px-10 pb-12">
                        {currentQ.options.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => handleAnswer(currentQ.id.toString(), opt.value)}
                                className={`w-full text-left p-6 border-2 rounded-2xl transition-all duration-300 flex items-center gap-4 group ${answers[currentQ.id.toString()] === opt.value
                                    ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10'
                                    : 'hover:border-slate-300 hover:bg-slate-50 border-slate-100'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold transition-all ${answers[currentQ.id.toString()] === opt.value
                                    ? 'bg-primary border-primary text-white scale-110'
                                    : 'border-slate-200 text-slate-400 group-hover:border-slate-300'
                                    }`}>
                                    {answers[currentQ.id.toString()] === opt.value && <CheckCircle2 className="h-5 w-5" />}
                                </div>
                                <span className={`text-lg font-bold transition-all ${answers[currentQ.id.toString()] === opt.value ? 'text-primary' : 'text-slate-600'}`}>
                                    {opt.text}
                                </span>
                            </button>
                        ))}
                    </CardContent>
                </Card>

                <div className="flex justify-between items-center px-4">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                        className="font-bold text-slate-500 hover:text-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Anterior
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={!answers[currentQ.id.toString()] || submitting}
                        className="h-14 px-10 text-lg font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                    >
                        {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {currentQuestionIndex === questions.length - 1
                            ? (submitting ? 'Analisando perfil...' : 'Finalizar Análise')
                            : 'Próxima Questão'}
                        {!submitting && <ArrowRight className="ml-2 h-5 w-5" />}
                    </Button>
                </div>
            </div>
        );
    }

    // Result Dashboard
    if (result) {
        const profileInfo = profileDescriptions[result.primaryProfile] || profileDescriptions['DOMINANCE'];
        const chartData = [
            { subject: 'D', A: result.dScore, fullMark: 100 },
            { subject: 'I', A: result.iScore, fullMark: 100 },
            { subject: 'S', A: result.sScore, fullMark: 100 },
            { subject: 'C', A: result.cScore, fullMark: 100 },
        ];

        return (
            <div className="space-y-8 pb-12">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                <BrainCircuit className="h-8 w-8" />
                            </div>
                            Seu Perfil Comportamental
                        </h1>
                        <p className="text-muted-foreground text-lg italic mt-1">Análise clínica baseada na metodologia Marston</p>
                    </div>
                    <div className="flex gap-2">
                        {isAdmin && (
                            <Link href="/performance/disc/manage">
                                <Button variant="outline" className="h-11 font-bold border-2">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Gerenciar
                                </Button>
                            </Link>
                        )}
                        <Button variant="outline" className="h-11 font-bold border-2" onClick={handleStart}>Refazer Análise</Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Result Card - Premium Version */}
                    <Card className="md:col-span-3 overflow-hidden border-none shadow-2xl bg-slate-900 text-white">
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 lg:grid-cols-2">
                                <div className="p-10 flex flex-col justify-center space-y-6">
                                    <div className="space-y-2">
                                        <Badge className="text-xs font-black uppercase tracking-widest bg-primary hover:bg-primary border-none text-white px-3 py-1">
                                            Perfil Predominante
                                        </Badge>
                                        <h2 className="text-5xl font-black tracking-tighter uppercase">{profileInfo.title}</h2>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-300 leading-tight">
                                        {profileInfo.description}
                                    </p>
                                    <p className="text-lg text-slate-400 font-medium leading-relaxed">
                                        Este diagnóstico identifica suas tendências naturais de comportamento sob pressão, em equipe e na tomada de decisões.
                                    </p>
                                    <div className="pt-4 flex gap-4">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex-1">
                                            <p className="text-[10px] uppercase font-black text-slate-500 mb-1">Concluído em</p>
                                            <p className="font-bold text-slate-200">{formatDate(result.completedAt)}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex-1">
                                            <p className="text-[10px] uppercase font-black text-slate-500 mb-1">Precisão Estimada</p>
                                            <p className="font-bold text-primary">Alta (Clínica)</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 p-10 flex items-center justify-center border-l border-white/5 min-h-[400px]">
                                    <ResponsiveContainer width="100%" height="300">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                            <PolarGrid stroke="#475569" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontWeight: 'black', fontSize: 16 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} stroke="#475569" />
                                            <Radar
                                                name="Perfil"
                                                dataKey="A"
                                                stroke={profileInfo.color}
                                                fill={profileInfo.color}
                                                fillOpacity={0.6}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Score Details */}
                    <Card className="border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="font-black uppercase tracking-tight text-slate-400 text-sm">Detalhamento de Scores</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-slate-700">Dominância (D)</span>
                                    <span className="font-black text-primary">{result.dScore}%</span>
                                </div>
                                <Progress value={result.dScore} className="h-2" />
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-slate-700">Influência (I)</span>
                                    <span className="font-black text-primary">{result.iScore}%</span>
                                </div>
                                <Progress value={result.iScore} className="h-2" />
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-slate-700">Estabilidade (S)</span>
                                    <span className="font-black text-primary">{result.sScore}%</span>
                                </div>
                                <Progress value={result.sScore} className="h-2" />
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-slate-700">Conformidade (C)</span>
                                    <span className="font-black text-primary">{result.cScore}%</span>
                                </div>
                                <Progress value={result.cScore} className="h-2" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Strengths */}
                    <Card className="border-none shadow-xl md:col-span-2">
                        <CardHeader>
                            <CardTitle className="font-black uppercase tracking-tight text-slate-400 text-sm">Pontos Fortes do seu Perfil</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {profileInfo.strengths.map((strength, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <div className="p-2 rounded-full bg-green-100 text-green-600">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <span className="font-bold text-slate-700">{strength}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* History Section */}
                {history.length > 1 && (
                    <div className="space-y-4">
                        <Button
                            variant="ghost"
                            onClick={() => setShowHistory(!showHistory)}
                            className="w-full h-14 font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all"
                        >
                            <History className="h-5 w-5 mr-3" />
                            {showHistory ? 'Ocultar Histórico' : `Ver Histórico (${history.length - 1} avaliações anteriores)`}
                            <ArrowRight className={`h-5 w-5 ml-3 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
                        </Button>

                        {showHistory && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {history.slice(1).map((evaluation) => {
                                    const evalProfile = profileDescriptions[evaluation.primaryProfile] || profileDescriptions['DOMINANCE'];
                                    return (
                                        <Card key={evaluation.id} className="border-none shadow-lg overflow-hidden group hover:shadow-xl transition-all">
                                            <div className="h-1" style={{ backgroundColor: evalProfile.color }} />
                                            <CardContent className="p-6">
                                                <div className="flex justify-between items-start mb-4">
                                                    <Badge style={{ backgroundColor: evalProfile.color + '20', color: evalProfile.color }} className="font-black">
                                                        {evalProfile.title}
                                                    </Badge>
                                                    <span className="text-xs font-bold text-slate-400">
                                                        {formatDate(evaluation.completedAt)}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-4 gap-2 text-center">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400">D</p>
                                                        <p className="font-bold text-slate-700">{evaluation.dScore}%</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400">I</p>
                                                        <p className="font-bold text-slate-700">{evaluation.iScore}%</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400">S</p>
                                                        <p className="font-bold text-slate-700">{evaluation.sScore}%</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400">C</p>
                                                        <p className="font-bold text-slate-700">{evaluation.cScore}%</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Initial Screen
    return (
        <div className="space-y-8 max-w-5xl mx-auto py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                    <h1 className="text-4xl font-black tracking-tight flex items-center justify-center md:justify-start gap-4">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                            <BrainCircuit className="h-10 w-10" />
                        </div>
                        Avaliação DISC
                    </h1>
                    <p className="text-muted-foreground text-xl mt-2">Mapeie seu perfil comportamental profissional</p>
                </div>
                {isAdmin && (
                    <Link href="/performance/disc/manage">
                        <Button variant="outline" className="h-12 px-6 font-bold border-2">
                            <Settings className="h-5 w-5 mr-2" />
                            Gerenciar Avaliações
                        </Button>
                    </Link>
                )}
            </div>

            <Card className="border-none shadow-2xl overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary to-blue-600" />
                <CardContent className="pt-12 pb-16 px-10">
                    <div className="flex flex-col items-center text-center space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:scale-105 transition-all">
                                <div className="font-black text-primary mb-2 uppercase tracking-widest text-xs">Dominância</div>
                                <p className="text-sm text-slate-600 font-medium">Como você lida com problemas e desafios.</p>
                            </div>
                            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:scale-105 transition-all">
                                <div className="font-black text-yellow-500 mb-2 uppercase tracking-widest text-xs">Influência</div>
                                <p className="text-sm text-slate-600 font-medium">Como você lida com pessoas e as influencia.</p>
                            </div>
                            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:scale-105 transition-all">
                                <div className="font-black text-green-500 mb-2 uppercase tracking-widest text-xs">Estabilidade</div>
                                <p className="text-sm text-slate-600 font-medium">Como você lida com o ritmo e mudanças.</p>
                            </div>
                            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:scale-105 transition-all">
                                <div className="font-black text-blue-500 mb-2 uppercase tracking-widest text-xs">Conformidade</div>
                                <p className="text-sm text-slate-600 font-medium">Como você lida com regras e procedimentos.</p>
                            </div>
                        </div>

                        <div className="space-y-4 max-w-2xl">
                            <h2 className="text-3xl font-black text-slate-900">Pronto para começar?</h2>
                            <p className="text-lg text-slate-500 font-medium leading-relaxed">
                                Leva cerca de 5-10 minutos. Tente ser o mais honesto possível, respondendo com base em como você realmente age, não como gostaria de agir.
                            </p>
                        </div>

                        <Button
                            size="lg"
                            onClick={handleStart}
                            className="h-16 px-12 text-xl font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-110 transition-all"
                            disabled={questions.length === 0}
                        >
                            Iniciar Avaliação Agora
                            <ArrowRight className="ml-3 h-6 w-6" />
                        </Button>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                            {questions.length} Perguntas • Feedback Instantâneo
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
