'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    BrainCircuit,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Loader2,
    Download,
    User,
    Calendar,
} from 'lucide-react';
import {
    discApi,
    DiscEvaluation,
} from '@/lib/api/performance';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

const profileDescriptions: Record<string, { title: string; shortTitle: string; description: string; color: string; strengths: string[]; tips: string[] }> = {
    DOMINANCE: {
        title: 'Dominante (D)',
        shortTitle: 'D',
        description: 'Focado em resultados, direto e assertivo. Gosta de desafios e de assumir o controle das situacoes.',
        color: '#ef4444',
        strengths: ['Tomada de decisao rapida', 'Visao orientada a metas', 'Disposicao para assumir riscos', 'Capacidade de liderar sob pressao'],
        tips: ['Pratique ouvir mais os outros', 'Seja paciente com processos detalhados', 'Delegue e confie na equipe', 'Celebre os pequenos progressos'],
    },
    INFLUENCE: {
        title: 'Influente (I)',
        shortTitle: 'I',
        description: 'Comunicativo, entusiasta e persuasivo. Gosta de interagir com pessoas e criar um ambiente positivo.',
        color: '#eab308',
        strengths: ['Otimismo e entusiasmo', 'Facilidade em persuadir', 'Criatividade na solucao de problemas', 'Habilidade de networking'],
        tips: ['Foque nos detalhes e follow-up', 'Gerencie melhor seu tempo', 'Conclua projetos antes de iniciar novos', 'Documente decisoes importantes'],
    },
    STEADINESS: {
        title: 'Estavel (S)',
        shortTitle: 'S',
        description: 'Calmo, paciente e leal. Valoriza a cooperacao e a estabilidade no ambiente de trabalho.',
        color: '#22c55e',
        strengths: ['Excelente ouvinte', 'Persistencia e consistencia', 'Habilidade conciliadora', 'Confiavel e leal'],
        tips: ['Aceite mudancas com mais abertura', 'Expresse suas opinioes com mais frequencia', 'Nao evite conflitos necessarios', 'Busque novos desafios'],
    },
    CONSCIENTIOUSNESS: {
        title: 'Conforme (C)',
        shortTitle: 'C',
        description: 'Analitico, preciso e detalhista. Valoriza a qualidade, regras e procedimentos.',
        color: '#3b82f6',
        strengths: ['Analise profunda', 'Padroes elevados de qualidade', 'Planejamento sistematico', 'Atencao aos detalhes'],
        tips: ['Nao busque a perfeicao absoluta', 'Tome decisoes com informacoes suficientes', 'Foque no quadro geral', 'Seja mais flexivel com processos'],
    },
};

export default function DiscResultPage() {
    const params = useParams();
    const id = params.id as string;
    const [result, setResult] = useState<DiscEvaluation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await discApi.getById(id);
            if (!res) throw new Error('Resultado nao encontrado');
            setResult(res);
        } catch (err) {
            console.error('Error loading DISC result:', err);
            setError('Nao foi possivel carregar o resultado desta avaliacao.');
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

    if (error || !result) {
        return (
            <div className="space-y-8 max-w-3xl mx-auto py-12">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Resultado DISC</h1>
                    </div>
                </div>

                <Card className="border-dashed border-2">
                    <CardContent className="py-16 flex flex-col items-center text-center">
                        <div className="p-4 bg-red-100 rounded-full mb-6">
                            <BrainCircuit className="h-12 w-12 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Erro ao carregar resultado</h2>
                        <p className="text-muted-foreground max-w-md mb-8">
                            {error || 'Ocorreu um erro inesperado.'}
                        </p>
                        <Button variant="outline" onClick={() => window.history.back()}>
                            Voltar
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const profileInfo = profileDescriptions[result.primaryProfile] || profileDescriptions['DOMINANCE'];

    // Ensure scores are numbers even if API returns them differently
    const dVal = (result as any).dScore ?? (result as any).d_score ?? 0;
    const iVal = (result as any).iScore ?? (result as any).i_score ?? 0;
    const sVal = (result as any).sScore ?? (result as any).s_score ?? 0;
    const cVal = (result as any).cScore ?? (result as any).c_score ?? 0;

    const chartData = [
        { subject: 'Dominancia', A: dVal, fullMark: 100 },
        { subject: 'Influencia', A: iVal, fullMark: 100 },
        { subject: 'Estabilidade', A: sVal, fullMark: 100 },
        { subject: 'Conformidade', A: cVal, fullMark: 100 },
    ];

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <BrainCircuit className="h-8 w-8 text-primary" />
                            Resultado da Avaliacao DISC
                        </h1>
                        <p className="text-muted-foreground">Perfil comportamental de {result.employeeName}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.print()} className="font-bold">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar PDF
                    </Button>
                </div>
            </div>

            {/* Employee Info Strip */}
            <div className="flex flex-wrap gap-4 px-2">
                <div className="flex items-center gap-2 text-sm bg-slate-100 px-4 py-2 rounded-full font-medium">
                    <User className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-500">Colaborador:</span>
                    <span className="text-slate-900">{result.employeeName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm bg-slate-100 px-4 py-2 rounded-full font-medium">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-500">Concluido em:</span>
                    <span className="text-slate-900">{formatDate(result.completedAt)}</span>
                </div>
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
                            <p className="text-slate-400">
                                Esta analise reflete o comportamento predominante observado nas respostas fornecidas pelo colaborador.
                            </p>
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
                            { label: 'Dominancia (D)', value: dVal, color: '#ef4444' },
                            { label: 'Influencia (I)', value: iVal, color: '#eab308' },
                            { label: 'Estabilidade (S)', value: sVal, color: '#22c55e' },
                            { label: 'Conformidade (C)', value: cVal, color: '#3b82f6' },
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
                        <CardTitle className="font-black uppercase tracking-tight text-slate-400 text-sm">Pontos Fortes Sugeridos</CardTitle>
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
                        <CardTitle className="font-black uppercase tracking-tight text-slate-400 text-sm">Sugestoes de Gestao</CardTitle>
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
        </div>
    );
}
