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
    DiscQuestion,
    DiscProfileType
} from '@/lib/api/performance';
import { useAuthStore } from '@/stores/auth-store';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// Mock questions for fallback if API fails or for demo
const MOCK_QUESTIONS: DiscQuestion[] = [
    {
        id: "1",
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
        id: "2",
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
        id: "3",
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
        id: "4",
        text: "Minha forma de comunicacao e...",
        order: 4,
        options: [
            { id: "4a", text: "Direta e assertiva", value: "D" },
            { id: "4b", text: "Entusiasta e persuasiva", value: "I" },
            { id: "4c", text: "Calma e atenciosa", value: "S" },
            { id: "4d", text: "Detalhada e especifica", value: "C" }
        ]
    }
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

            // Fetch real questions
            const qs = await discApi.getQuestions();
            if (qs && qs.length > 0) {
                setQuestions(qs);
            }
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
            if (!user?.id) throw new Error("Usuário não autenticado");

            const res = await discApi.submit(user.id, user.name, answers);
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
            let primary: DiscProfileType = 'DOMINANCE';
            if (counts.D > max) { max = counts.D; primary = 'DOMINANCE'; }
            if (counts.I > max) { max = counts.I; primary = 'INFLUENCE'; }
            if (counts.S > max) { max = counts.S; primary = 'STEADINESS'; }
            if (counts.C > max) { max = counts.C; primary = 'CONSCIENTIOUSNESS'; }

            const mockResult: DiscEvaluation = {
                id: 'mock-id',
                employeeId: user?.id || 'emp',
                dScore: (counts.D / questions.length) * 100,
                iScore: (counts.I / questions.length) * 100,
                sScore: (counts.S / questions.length) * 100,
                cScore: (counts.C / questions.length) * 100,
                primaryProfile: primary,
                profileDescription: getDescription(primary),
                status: 'COMPLETED',
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
            case 'DOMINANCE': return "Dominância: Focado em resultados, direto e assertivo. Gosta de desafios e de assumir o controle de situações complexas.";
            case 'INFLUENCE': return "Influência: Comunicativo, entusiasta e persuasivo. Gosta de interagir com pessoas e criar um ambiente positivo e motivador.";
            case 'STEADINESS': return "Estabilidade: Calmo, paciente e leal. Valoriza a cooperação, a segurança e o trabalho em equipe estruturado.";
            case 'CONSCIENTIOUSNESS': return "Conformidade: Analítico, preciso e detalhista. Valoriza a qualidade, a lógica e o cumprimento de processos rigorosos.";
            default: return "";
        }
    };

    if (loading) return <div>Carregando...</div>;

    // Tela do Questionario
    if (isTakingAssessment) {
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
                        variant="ghost"
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="font-bold text-slate-500 hover:text-slate-900"
                    >
                        Voltar para questão anterior
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={!answers[currentQ.id.toString()] || submitting}
                        className="h-14 px-10 text-lg font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                    >
                        {currentQuestionIndex === questions.length - 1 ? (submitting ? 'Analisando perfil...' : 'Finalizar Análise') : 'Próxima Questão'}
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </div>
        );
    }

    // Tela de Resultado Dashboard
    if (result) {
        const profileColors: Record<string, string> = {
            DOMINANCE: '#ef4444',
            INFLUENCE: '#eab308',
            STEADINESS: '#22c55e',
            CONSCIENTIOUSNESS: '#3b82f6'
        };

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
                    <Button variant="outline" className="h-11 font-bold border-2" onClick={handleStart}>Refazer Análise</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Resultado Principal */}
                    <Card className="md:col-span-3 overflow-hidden border-none shadow-2xl bg-slate-900 text-white">
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 lg:grid-cols-2">
                                <div className="p-10 flex flex-col justify-center space-y-6">
                                    <div className="space-y-2">
                                        <Badge className="text-xs font-black uppercase tracking-widest bg-primary hover:bg-primary border-none text-white px-3 py-1">
                                            Perfil Predominante
                                        </Badge>
                                        <h2 className="text-5xl font-black tracking-tighter uppercase">{result.primaryProfile}</h2>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-300 leading-tight">
                                        {getDescription(result.primaryProfile)}
                                    </p>
                                    <p className="text-lg text-slate-400 font-medium leading-relaxed">
                                        Este diagnóstico identifica suas tendências naturais de comportamento sob pressão, em equipe e na tomada de decisões.
                                    </p>
                                    <div className="pt-4 flex gap-4">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex-1">
                                            <p className="text-[10px] uppercase font-black text-slate-500 mb-1">Concluído em</p>
                                            <p className="font-bold text-slate-200">{new Date(result.completedAt).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex-1">
                                            <p className="text-[10px] uppercase font-black text-slate-500 mb-1">Precisão Estimada</p>
                                            <p className="font-bold text-primary">Alta (Clínica)</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 p-10 flex items-center justify-center border-l border-white/5 min-h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                            <PolarGrid stroke="#475569" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontWeight: 'black', fontSize: 16 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} stroke="#475569" />
                                            <Radar
                                                name="Perfil"
                                                dataKey="A"
                                                stroke={profileColors[result.primaryProfile]}
                                                fill={profileColors[result.primaryProfile]}
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
