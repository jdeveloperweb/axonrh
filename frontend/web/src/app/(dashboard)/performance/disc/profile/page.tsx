'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    BrainCircuit,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    History,
    Loader2,
    FileEdit,
} from 'lucide-react';
import {
    discApi,
    DiscEvaluation,
    DiscProfileType
} from '@/lib/api/performance';
import { useAuthStore } from '@/stores/auth-store';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

const profileDescriptions: Record<string, { title: string; shortTitle: string; description: string; color: string; strengths: string[]; tips: string[] }> = {
    DOMINANCE: {
        title: 'Dominante (D)',
        shortTitle: 'D',
        description: 'Voce e focado em resultados, direto e assertivo. Gosta de desafios e de assumir o controle das situacoes.',
        color: '#ef4444',
        strengths: ['Tomada de decisao rapida', 'Visao orientada a metas', 'Disposicao para assumir riscos', 'Capacidade de liderar sob pressao'],
        tips: ['Pratique ouvir mais os outros', 'Seja paciente com processos detalhados', 'Delegue e confie na equipe', 'Celebre os pequenos progressos'],
    },
    INFLUENCE: {
        title: 'Influente (I)',
        shortTitle: 'I',
        description: 'Voce e comunicativo, entusiasta e persuasivo. Gosta de interagir com pessoas e criar um ambiente positivo.',
        color: '#eab308',
        strengths: ['Otimismo e entusiasmo', 'Facilidade em persuadir', 'Criatividade na solucao de problemas', 'Habilidade de networking'],
        tips: ['Foque nos detalhes e follow-up', 'Gerencie melhor seu tempo', 'Conclua projetos antes de iniciar novos', 'Documente decisoes importantes'],
    },
    STEADINESS: {
        title: 'Estavel (S)',
        shortTitle: 'S',
        description: 'Voce e calmo, paciente e leal. Valoriza a cooperacao e a estabilidade no ambiente de trabalho.',
        color: '#22c55e',
        strengths: ['Excelente ouvinte', 'Persistencia e consistencia', 'Habilidade conciliadora', 'Confiavel e leal'],
        tips: ['Aceite mudancas com mais abertura', 'Expresse suas opinioes com mais frequencia', 'Nao evite conflitos necessarios', 'Busque novos desafios'],
    },
    CONSCIENTIOUSNESS: {
        title: 'Conforme (C)',
        shortTitle: 'C',
        description: 'Voce e analitico, preciso e detalhista. Valoriza a qualidade, regras e procedimentos.',
        color: '#3b82f6',
        strengths: ['Analise profunda', 'Padroes elevados de qualidade', 'Planejamento sistematico', 'Atencao aos detalhes'],
        tips: ['Nao busque a perfeicao absoluta', 'Tome decisoes com informacoes suficientes', 'Foque no quadro geral', 'Seja mais flexivel com processos'],
    },
};

export default function DiscProfilePage() {
    const { user } = useAuthStore();
    const [result, setResult] = useState<DiscEvaluation | null>(null);
    const [history, setHistory] = useState<DiscEvaluation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        if (user?.id) {
            loadData();
        }
    }, [user?.id]);

    const loadData = async () => {
        try {
            setLoading(true);
            if (!user?.id) return;

            try {
                const res = await discApi.getLatest(user.id);
                setResult(res);
                const historyRes = await discApi.getHistory(user.id);
                setHistory(historyRes);
            } catch {
                setResult(null);
                setHistory([]);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // No result yet - prompt to take the test
    if (!result) {
        return (
            <div className="space-y-8 max-w-3xl mx-auto py-12">
                <div className="flex items-center gap-4">
                    <Link href="/performance">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Perfil Comportamental DISC</h1>
                        <p className="text-muted-foreground">Seu mapeamento comportamental ainda nao foi realizado</p>
                    </div>
                </div>

                <Card className="border-dashed border-2">
                    <CardContent className="py-16 flex flex-col items-center text-center">
                        <div className="p-4 bg-primary/10 rounded-full mb-6">
                            <BrainCircuit className="h-12 w-12 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Nenhuma avaliacao DISC encontrada</h2>
                        <p className="text-muted-foreground max-w-md mb-8">
                            Realize o teste DISC para descobrir seu perfil comportamental, pontos fortes e areas de desenvolvimento.
                        </p>
                        <Link href="/performance/disc">
                            <Button size="lg" className="font-bold">
                                <FileEdit className="h-5 w-5 mr-2" />
                                Realizar Teste DISC
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const profileInfo = profileDescriptions[result.primaryProfile] || profileDescriptions['DOMINANCE'];
    const chartData = [
        { subject: 'Dominancia', A: result.dScore, fullMark: 100 },
        { subject: 'Influencia', A: result.iScore, fullMark: 100 },
        { subject: 'Estabilidade', A: result.sScore, fullMark: 100 },
        { subject: 'Conformidade', A: result.cScore, fullMark: 100 },
    ];

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/performance">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <BrainCircuit className="h-8 w-8 text-primary" />
                            Meu Perfil Comportamental
                        </h1>
                        <p className="text-muted-foreground">Analise completa baseada na metodologia DISC</p>
                    </div>
                </div>
                <Link href="/performance/disc">
                    <Button variant="outline" className="font-bold">
                        <FileEdit className="h-4 w-4 mr-2" />
                        Refazer Teste
                    </Button>
                </Link>
            </div>

            {/* Main Profile Card */}
            <Card className="overflow-hidden border-none shadow-2xl bg-slate-900 text-white">
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
                            <div className="pt-4 flex gap-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex-1">
                                    <p className="text-[10px] uppercase font-black text-slate-500 mb-1">Concluido em</p>
                                    <p className="font-bold text-slate-200">{formatDate(result.completedAt)}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex-1">
                                    <p className="text-[10px] uppercase font-black text-slate-500 mb-1">Avaliacoes Realizadas</p>
                                    <p className="font-bold text-primary">{history.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-800/50 p-10 flex items-center justify-center border-l border-white/5 min-h-[400px]">
                            <ResponsiveContainer width="100%" height={300}>
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                    <PolarGrid stroke="#475569" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontWeight: 'bold', fontSize: 12 }} />
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

            {/* Score Details + Strengths */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-xl">
                    <CardHeader>
                        <CardTitle className="font-black uppercase tracking-tight text-slate-400 text-sm">Detalhamento de Scores</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {[
                            { label: 'Dominancia (D)', value: result.dScore, color: '#ef4444' },
                            { label: 'Influencia (I)', value: result.iScore, color: '#eab308' },
                            { label: 'Estabilidade (S)', value: result.sScore, color: '#22c55e' },
                            { label: 'Conformidade (C)', value: result.cScore, color: '#3b82f6' },
                        ].map((item) => (
                            <div key={item.label}>
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-slate-700">{item.label}</span>
                                    <span className="font-black" style={{ color: item.color }}>{item.value}%</span>
                                </div>
                                <Progress value={item.value} className="h-2" />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl">
                    <CardHeader>
                        <CardTitle className="font-black uppercase tracking-tight text-slate-400 text-sm">Pontos Fortes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {profileInfo.strengths.map((strength, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    <span className="font-medium text-slate-700">{strength}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl">
                    <CardHeader>
                        <CardTitle className="font-black uppercase tracking-tight text-slate-400 text-sm">Dicas de Desenvolvimento</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {profileInfo.tips.map((tip, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                                    <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm font-medium text-slate-700">{tip}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* How DISC Works */}
            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle>Como funciona o DISC?</CardTitle>
                    <CardDescription>Entenda os quatro perfis comportamentais</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {Object.entries(profileDescriptions).map(([key, profile]) => (
                            <div
                                key={key}
                                className={`p-4 rounded-xl border-2 transition-all ${
                                    result.primaryProfile === key ? 'border-primary bg-primary/5 shadow-md' : 'border-slate-100'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm"
                                        style={{ backgroundColor: profile.color }}
                                    >
                                        {profile.shortTitle}
                                    </div>
                                    <span className="font-bold text-sm">{profile.title}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{profile.description}</p>
                                {result.primaryProfile === key && (
                                    <Badge className="mt-2 bg-primary/10 text-primary border-none text-[10px]">Seu perfil</Badge>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* History */}
            {history.length > 1 && (
                <div className="space-y-4">
                    <Button
                        variant="ghost"
                        onClick={() => setShowHistory(!showHistory)}
                        className="w-full h-14 font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all"
                    >
                        <History className="h-5 w-5 mr-3" />
                        {showHistory ? 'Ocultar Historico' : `Ver Historico (${history.length - 1} avaliacoes anteriores)`}
                        <ArrowRight className={`h-5 w-5 ml-3 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
                    </Button>

                    {showHistory && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {history.slice(1).map((evaluation) => {
                                const evalProfile = profileDescriptions[evaluation.primaryProfile] || profileDescriptions['DOMINANCE'];
                                return (
                                    <Card key={evaluation.id} className="border-none shadow-lg overflow-hidden">
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
