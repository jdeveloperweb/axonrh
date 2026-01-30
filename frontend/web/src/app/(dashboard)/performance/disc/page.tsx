'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    BrainCircuit,
    PieChart,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    BarChart,
} from 'lucide-react';
import {
    discApi,
    DiscEvaluation,
    DiscQuestion
} from '@/lib/api/performance';
import { useAuthStore } from '@/stores/auth-store';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// Mock questions for fallback if API fails or for demo
const MOCK_QUESTIONS: DiscQuestion[] = [
    {
        id: 1,
        text: "Quando estou em um grupo, eu costumo...",
        options: [
            { id: "1a", text: "Assumir a lideranca e definir o rumo", value: "D" },
            { id: "1b", text: "Conversar e animar o ambiente", value: "I" },
            { id: "1c", text: "Ouvir e apoiar os outros", value: "S" },
            { id: "1d", text: "Observar e analisar os detalhes", value: "C" }
        ]
    },
    {
        id: 2,
        text: "Diante de um conflito, minha reacao e...",
        options: [
            { id: "2a", text: "Enfrentar e resolver logo", value: "D" },
            { id: "2b", text: "Tentar persuadir e apaziguar", value: "I" },
            { id: "2c", text: "Evitar e buscar a harmonia", value: "S" },
            { id: "2d", text: "Analisar os fatos logicamente", value: "C" }
        ]
    },
    {
        id: 3,
        text: "No trabalho, valorizo mais...",
        options: [
            { id: "3a", text: "Resultados e desafios", value: "D" },
            { id: "3b", text: "Reconhecimento e interacao", value: "I" },
            { id: "3c", text: "Seguranca e estabilidade", value: "S" },
            { id: "3d", text: "Precisao e qualidade", value: "C" }
        ]
    },
    {
        id: 4,
        text: "Minha forma de comunicacao e...",
        options: [
            { id: "4a", text: "Direta e assertiva", value: "D" },
            { id: "4b", text: "Entusiasta e persuasiva", value: "I" },
            { id: "4c", text: "Calma e atenciosa", value: "S" },
            { id: "4d", text: "Detalhada e especifica", value: "C" }
        ]
    }
    // Adicionar mais questoes em producao
];

export default function DiscPage() {
    const { user } = useAuthStore();
    const [result, setResult] = useState<DiscEvaluation | null>(null);
    const [loading, setLoading] = useState(true);
    const [isTakingAssessment, setIsTakingAssessment] = useState(false);
    const [questions, setQuestions] = useState<DiscQuestion[]>(MOCK_QUESTIONS);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user?.id) {
            loadData();
        }
    }, [user?.id]);

    const loadData = async () => {
        try {
            setLoading(true);
            if (!user?.id) return;

            const res = await discApi.getLatest(user.id);
            setResult(res);

            // Load questions if needed (not implemented in mock api yet)
            // const qs = await discApi.getQuestions();
            // setQuestions(qs);
        } catch (error) {
            console.log('Nenhum resultado DISC encontrado ou erro na API');
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

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            const res = await discApi.submit(answers);
            setResult(res);
            setIsTakingAssessment(false);
        } catch (error) {
            // Mock fallback logic if API fails for demo
            console.error("API submit failed, using mock calculation", error);

            // Calculate mock result
            const counts: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 };
            Object.values(answers).forEach(val => {
                if (counts[val] !== undefined) counts[val]++;
            });

            // Find primary
            let max = 0;
            let primary = 'Dominance';
            if (counts.D > max) { max = counts.D; primary = 'Dominance'; }
            if (counts.I > max) { max = counts.I; primary = 'Influence'; }
            if (counts.S > max) { max = counts.S; primary = 'Steadiness'; }
            if (counts.C > max) { max = counts.C; primary = 'Conscientiousness'; }

            const mockResult: DiscEvaluation = {
                id: 'mock-id',
                employeeId: user?.id || 'emp',
                dScore: (counts.D / questions.length) * 100,
                iScore: (counts.I / questions.length) * 100,
                sScore: (counts.S / questions.length) * 100,
                cScore: (counts.C / questions.length) * 100,
                primaryProfile: primary,
                profileDescription: getDescription(primary),
                completedAt: new Date().toISOString()
            };

            setResult(mockResult);
            setIsTakingAssessment(false);
        } finally {
            setSubmitting(false);
        }
    };

    const getDescription = (profile: string) => {
        switch (profile.toUpperCase()) {
            case 'DOMINANCE': return "Voce e focado em resultados, direto e assertivo. Gosta de desafios.";
            case 'INFLUENCE': return "Voce e comunicativo, entusiasta e persuasivo. Gosta de interagir com pessoas.";
            case 'STEADINESS': return "Voce e calmo, paciente e leal. Valoriza a cooperacao e a estabilidade.";
            case 'CONSCIENTIOUSNESS': return "Voce e analitico, preciso e detalhista. Valoriza a qualidade e regras.";
            default: return "";
        }
    };

    if (loading) return <div>Carregando...</div>;

    // Tela do Questionario
    if (isTakingAssessment) {
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
                        <CardTitle>{currentQ.text}</CardTitle>
                        <CardDescription>Selecione a opcao que melhor descreve voce</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {currentQ.options.map((opt) => (
                            <div
                                key={opt.id}
                                onClick={() => handleAnswer(currentQ.id.toString(), opt.value)}
                                className={`p-4 border rounded-lg cursor-pointer transition-all ${answers[currentQ.id.toString()] === opt.value
                                        ? 'bg-primary/10 border-primary ring-1 ring-primary'
                                        : 'hover:bg-muted'
                                    }`}
                            >
                                {opt.text}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                    >
                        Anterior
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={!answers[currentQ.id.toString()] || submitting}
                    >
                        {currentQuestionIndex === questions.length - 1 ? (submitting ? 'Calculando...' : 'Finalizar') : 'Proximo'}
                    </Button>
                </div>
            </div>
        );
    }

    // Tela de Resultado Dashboard
    if (result) {
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
                    <Button variant="outline" onClick={handleStart}>Refazer Teste</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Resultado Principal */}
                    <Card className="md:col-span-2 bg-gradient-to-br from-primary/5 to-background border-primary/20">
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="text-center md:text-left flex-1">
                                    <Badge className="mb-2 text-lg py-1 px-4">{result.primaryProfile}</Badge>
                                    <h2 className="text-2xl font-bold mb-4">
                                        {getDescription(result.primaryProfile)}
                                    </h2>
                                    <p className="text-muted-foreground">
                                        Este perfil indica suas tendencias naturais de comportamento. Use essas informacoes para melhorar sua comunicacao, lideranca e trabalho em equipe.
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
                                                stroke="#8884d8"
                                                fill="#8884d8"
                                                fillOpacity={0.6}
                                            />
                                            <Tooltip />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Detalhamento das 4 Dimensoes */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalhamento</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="font-medium text-red-500">Dominancia (D)</span>
                                    <span>{result.dScore.toFixed(0)}%</span>
                                </div>
                                <Progress value={result.dScore} className="bg-red-100" />
                                <p className="text-xs text-muted-foreground mt-1">Foco em resultados, assertividade e controle.</p>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="font-medium text-yellow-500">Influencia (I)</span>
                                    <span>{result.iScore.toFixed(0)}%</span>
                                </div>
                                <Progress value={result.iScore} className="bg-yellow-100" />
                                <p className="text-xs text-muted-foreground mt-1">Foco em pessoas, comunicacao e otimismo.</p>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="font-medium text-green-500">Estabilidade (S)</span>
                                    <span>{result.sScore.toFixed(0)}%</span>
                                </div>
                                <Progress value={result.sScore} className="bg-green-100" />
                                <p className="text-xs text-muted-foreground mt-1">Foco em cooperacao, paciencia e lealdade.</p>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="font-medium text-blue-500">Conformidade (C)</span>
                                    <span>{result.cScore.toFixed(0)}%</span>
                                </div>
                                <Progress value={result.cScore} className="bg-blue-100" />
                                <p className="text-xs text-muted-foreground mt-1">Foco em qualidade, precisao e regras.</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dicas */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pontos Fortes do Perfil</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {result.primaryProfile === 'DOMINANCE' && (
                                    <>
                                        <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-1" /> Tomada de decisao rapida</li>
                                        <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-1" /> Visao orientada a metas</li>
                                        <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-1" /> Disposicao para assumir riscos</li>
                                    </>
                                )}
                                {result.primaryProfile === 'INFLUENCE' && (
                                    <>
                                        <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-1" /> Otimismo e entusiasmo</li>
                                        <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-1" /> Facilidade em persuadir</li>
                                        <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-1" /> Criatividade na solucao de problemas</li>
                                    </>
                                )}
                                {result.primaryProfile === 'STEADINESS' && (
                                    <>
                                        <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-1" /> Otimos ouvintes</li>
                                        <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-1" /> Persistencia e consistencia</li>
                                        <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-1" /> Habilidade conciliadora</li>
                                    </>
                                )}
                                {result.primaryProfile === 'CONSCIENTIOUSNESS' && (
                                    <>
                                        <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-1" /> Analise aprofundada</li>
                                        <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-1" /> Padroes elevados de qualidade</li>
                                        <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-1" /> Planejamento sistematico</li>
                                    </>
                                )}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Tela Inicial (Sem Resultado)
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-2xl mx-auto">
            <div className="bg-primary/10 p-6 rounded-full mb-6">
                <BrainCircuit className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Descubra seu Perfil Comportamental</h1>
            <p className="text-xl text-muted-foreground mb-8">
                O teste DISC ajuda a entender suas tendencias de comportamento,
                como voce reage a desafios, influencia pessoas, lida com mudancas e segue regras.
            </p>

            <div className="grid grid-cols-2 gap-4 w-full mb-8 text-left">
                <Card>
                    <CardContent className="pt-6">
                        <div className="font-bold text-lg mb-1">Autoconhecimento</div>
                        <p className="text-sm text-muted-foreground">Entenda seus pontos fortes e areas de desenvolvimento.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="font-bold text-lg mb-1">Comunicacao</div>
                        <p className="text-sm text-muted-foreground">Melhore como voce se relaciona com colegas e clientes.</p>
                    </CardContent>
                </Card>
            </div>

            <Button size="lg" onClick={handleStart} className="px-8 text-lg h-12">
                <ArrowRight className="mr-2 h-5 w-5" />
                Iniciar Avaliacao
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">
                Tempo estimado: 5 minutos • 4 Perguntas Rapidas
            </p>
        </div>
    );
}
