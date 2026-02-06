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
<<<<<<< HEAD
        id: "1",
=======
        id: '1',
>>>>>>> cca4f92d96e90c8735e1b014c0ac7c97668353df
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
<<<<<<< HEAD
        id: "2",
=======
        id: '2',
>>>>>>> cca4f92d96e90c8735e1b014c0ac7c97668353df
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
<<<<<<< HEAD
        id: "3",
=======
        id: '3',
>>>>>>> cca4f92d96e90c8735e1b014c0ac7c97668353df
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
<<<<<<< HEAD
        id: "4",
=======
        id: '4',
>>>>>>> cca4f92d96e90c8735e1b014c0ac7c97668353df
        text: "Minha forma de comunicacao e...",
        order: 4,
        options: [
            { id: "4a", text: "Direta e assertiva", value: "D" },
            { id: "4b", text: "Entusiasta e persuasiva", value: "I" },
            { id: "4c", text: "Calma e atenciosa", value: "S" },
            { id: "4d", text: "Detalhada e especifica", value: "C" }
        ]
<<<<<<< HEAD
    }
=======
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
>>>>>>> cca4f92d96e90c8735e1b014c0ac7c97668353df
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

<<<<<<< HEAD
            // Fetch real questions
            const qs = await discApi.getQuestions();
            if (qs && qs.length > 0) {
                setQuestions(qs);
=======
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
>>>>>>> cca4f92d96e90c8735e1b014c0ac7c97668353df
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
<<<<<<< HEAD
            if (!user?.id) throw new Error("Usuário não autenticado");

            const res = await discApi.submit(user.id, user.name, answers);
            setResult(res);
=======
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

>>>>>>> cca4f92d96e90c8735e1b014c0ac7c97668353df
            setIsTakingAssessment(false);
            loadData();
        } catch (error) {
<<<<<<< HEAD
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
=======
            console.error("Submit failed:", error);
            toast({ title: 'Erro', description: 'Falha ao enviar avaliacao', variant: 'destructive' });
>>>>>>> cca4f92d96e90c8735e1b014c0ac7c97668353df
        } finally {
            setSubmitting(false);
        }
    };

<<<<<<< HEAD
    const getDescription = (profile: string) => {
        switch (profile.toUpperCase()) {
            case 'DOMINANCE': return "Dominância: Focado em resultados, direto e assertivo. Gosta de desafios e de assumir o controle de situações complexas.";
            case 'INFLUENCE': return "Influência: Comunicativo, entusiasta e persuasivo. Gosta de interagir com pessoas e criar um ambiente positivo e motivador.";
            case 'STEADINESS': return "Estabilidade: Calmo, paciente e leal. Valoriza a cooperação, a segurança e o trabalho em equipe estruturado.";
            case 'CONSCIENTIOUSNESS': return "Conformidade: Analítico, preciso e detalhista. Valoriza a qualidade, a lógica e o cumprimento de processos rigorosos.";
            default: return "";
        }
    };
=======
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
>>>>>>> cca4f92d96e90c8735e1b014c0ac7c97668353df

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

<<<<<<< HEAD
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
=======
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">{currentQ.text}</CardTitle>
                        <CardDescription>Selecione a opcao que melhor descreve voce</CardDescription>
>>>>>>> cca4f92d96e90c8735e1b014c0ac7c97668353df
                    </CardHeader>
                    <CardContent className="space-y-4 px-10 pb-12">
                        {currentQ.options.map((opt) => (
                            <button
                                key={opt.id}
<<<<<<< HEAD
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
=======
                                onClick={() => handleAnswer(currentQ.id, opt.value)}
                                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                    answers[currentQ.id] === opt.value
                                        ? 'bg-primary/10 border-primary ring-2 ring-primary'
                                        : 'hover:bg-muted hover:border-primary/30'
                                }`}
                            >
                                <p className="font-medium">{opt.text}</p>
                            </div>
>>>>>>> cca4f92d96e90c8735e1b014c0ac7c97668353df
                        ))}
                    </CardContent>
                </Card>

                <div className="flex justify-between items-center px-4">
                    <Button
<<<<<<< HEAD
                        variant="ghost"
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
=======
                        variant="outline"
                        onClick={handlePrevious}
>>>>>>> cca4f92d96e90c8735e1b014c0ac7c97668353df
                        disabled={currentQuestionIndex === 0}
                        className="font-bold text-slate-500 hover:text-slate-900"
                    >
<<<<<<< HEAD
                        Voltar para questão anterior
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={!answers[currentQ.id.toString()] || submitting}
                        className="h-14 px-10 text-lg font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                    >
                        {currentQuestionIndex === questions.length - 1 ? (submitting ? 'Analisando perfil...' : 'Finalizar Análise') : 'Próxima Questão'}
                        <ArrowRight className="ml-2 h-5 w-5" />
=======
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
>>>>>>> cca4f92d96e90c8735e1b014c0ac7c97668353df
                    </Button>
                </div>
            </div>
        );
    }

    // Result Dashboard
    if (result) {
<<<<<<< HEAD
        const profileColors: Record<string, string> = {
            DOMINANCE: '#ef4444',
            INFLUENCE: '#eab308',
            STEADINESS: '#22c55e',
            CONSCIENTIOUSNESS: '#3b82f6'
        };

=======
        const profileInfo = profileDescriptions[result.primaryProfile];
>>>>>>> cca4f92d96e90c8735e1b014c0ac7c97668353df
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
<<<<<<< HEAD
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
=======
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
>>>>>>> cca4f92d96e90c8735e1b014c0ac7c97668353df
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
<<<<<<< HEAD
                                                stroke={profileColors[result.primaryProfile]}
                                                fill={profileColors[result.primaryProfile]}
                                                fillOpacity={0.6}
=======
                                                stroke={profileInfo?.color}
                                                fill={profileInfo?.color}
                                                fillOpacity={0.5}
>>>>>>> cca4f92d96e90c8735e1b014c0ac7c97668353df
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
