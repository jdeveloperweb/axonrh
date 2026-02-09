'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    BrainCircuit,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Loader2,
    Download,
    User,
    Calendar,
    Target,
    Zap,
    MessageSquare,
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
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">Gerando Relatório...</p>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="space-y-8 max-w-3xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4">
                    <Link href="/performance/disc/manage">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Resultado DISC</h1>
                    </div>
                </div>

                <Card className="border-dashed border-2 rounded-[2rem]">
                    <CardContent className="py-20 flex flex-col items-center text-center">
                        <div className="p-5 bg-red-100 rounded-2xl mb-6">
                            <BrainCircuit className="h-12 w-12 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-black mb-2 uppercase">Erro ao carregar</h2>
                        <p className="text-muted-foreground max-w-md mb-8 font-medium">
                            {error || 'Ocorreu um erro ao processar os dados do perfil.'}
                        </p>
                        <Link href="/performance/disc/manage">
                            <Button variant="outline" className="h-12 px-8 rounded-2xl border-2 font-bold hover:bg-slate-50">
                                Voltar para Gestão
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const profileInfo = profileDescriptions[result.primaryProfile] || profileDescriptions['DOMINANCE'];

    const dVal = (result as any).dScore ?? (result as any).d_score ?? 0;
    const iVal = (result as any).iScore ?? (result as any).i_score ?? 0;
    const sVal = (result as any).sScore ?? (result as any).s_score ?? 0;
    const cVal = (result as any).cScore ?? (result as any).c_score ?? 0;

    const chartData = [
        { subject: 'DOMINÂNCIA', A: dVal, fullMark: 100 },
        { subject: 'INFLUÊNCIA', A: iVal, fullMark: 100 },
        { subject: 'ESTABILIDADE', A: sVal, fullMark: 100 },
        { subject: 'CONFORMIDADE', A: cVal, fullMark: 100 },
    ];

    return (
        <div className="space-y-8 pb-24 animate-in fade-in duration-700">
            {/* Optimized Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-6">
                    <Link href="/performance/disc/manage">
                        <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-2 hover:bg-slate-50 transition-all hover:scale-105 shadow-sm">
                            <ArrowLeft className="h-6 w-6 text-slate-600" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                <BrainCircuit className="h-5 w-5" />
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                                Relatório Comportamental
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                                <User className="h-3 w-3" />
                                {result.employeeName}
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-l pl-4">
                                <Calendar className="h-3 w-3" />
                                {formatDate(result.completedAt)}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => window.print()} className="h-14 px-8 rounded-2xl font-black border-2 hover:bg-slate-50 shadow-sm uppercase tracking-widest text-xs">
                        <Download className="h-4 w-4 mr-3" />
                        Exportar PDF
                    </Button>
                </div>
            </div>

            {/* Main Result Hero - Dark Mode Premium */}
            <Card className="overflow-hidden border-none shadow-3xl bg-slate-950 text-white rounded-[3rem] relative">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
                <CardContent className="p-0">
                    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
                        <div className="lg:col-span-6 p-12 lg:p-20 flex flex-col justify-center space-y-10 relative z-10">
                            <div className="space-y-4">
                                <Badge className="text-[10px] font-black uppercase tracking-[0.3em] bg-primary hover:bg-primary border-none text-white px-5 py-2 rounded-full shadow-2xl shadow-primary/40">
                                    Perfil Comportamental
                                </Badge>
                                <h2 className="text-7xl font-black tracking-tighter uppercase leading-[0.85]">
                                    {profileInfo.title.split(' (')[0]}
                                    <span className="block text-primary text-4xl mt-3 font-black opacity-90 tracking-normal italic leading-none lowercase">
                                        ({profileInfo.shortTitle})
                                    </span>
                                </h2>
                            </div>

                            <div className="space-y-6">
                                <p className="text-3xl font-bold text-slate-100 leading-tight border-l-4 border-primary pl-6">
                                    "{profileInfo.description}"
                                </p>
                                <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-xl">
                                    Padrão baseado na metodologia DISC, identificando as tendências naturais de resposta a desafios, pessoas, ritmo e regras.
                                </p>
                            </div>

                            <div className="pt-6 flex gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                        <Zap className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest leading-none">Status</p>
                                        <p className="font-bold text-slate-200">Finalizado</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                        <Target className="h-5 w-5 text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest leading-none">Precisão</p>
                                        <p className="font-bold text-slate-200">Alta Performance</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-6 bg-[#020617] p-10 lg:p-20 flex items-center justify-center border-l border-white/5 relative overflow-hidden">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/20 blur-[120px] rounded-full animate-pulse pointer-events-none" />

                            <ResponsiveContainer width="100%" height={450}>
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                    <PolarGrid stroke="#1e293b" strokeWidth={1.5} />
                                    <PolarAngleAxis
                                        dataKey="subject"
                                        tick={{ fill: '#64748b', fontWeight: '900', fontSize: 10, letterSpacing: '0.2em' }}
                                    />
                                    <PolarRadiusAxis
                                        angle={30}
                                        domain={[0, 100]}
                                        tick={false}
                                        axisLine={false}
                                    />
                                    <Radar
                                        name="Perfil"
                                        dataKey="A"
                                        stroke={profileInfo.color}
                                        strokeWidth={5}
                                        fill={profileInfo.color}
                                        fillOpacity={0.4}
                                        dot={{ r: 7, fill: '#fff', strokeWidth: 3, fillOpacity: 1, stroke: profileInfo.color }}
                                        activeDot={{ r: 10, fill: '#fff', strokeWidth: 4 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', fontWeight: '900', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)', padding: '15px' }}
                                        itemStyle={{ color: '#fff', fontSize: '14px' }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Score Details + Insights Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Detailed Scores */}
                <Card className="lg:col-span-4 border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50/50 pb-8 pt-10 px-10 border-b border-slate-100 flex flex-row items-center justify-between">
                        <CardTitle className="font-black uppercase tracking-[0.2em] text-slate-400 text-[10px]">Scores Detalhados</CardTitle>
                        <Badge variant="outline" className="rounded-lg font-black text-[9px] px-2 py-0 border-slate-200">100% TOTAL</Badge>
                    </CardHeader>
                    <CardContent className="space-y-10 pt-10 px-10 pb-12">
                        {[
                            { label: 'Dominância (D)', value: dVal, color: '#ef4444', desc: 'Diretividade e resultados' },
                            { label: 'Influência (I)', value: iVal, color: '#eab308', desc: 'Comunicação e entusiasmo' },
                            { label: 'Estabilidade (S)', value: sVal, color: '#22c55e', desc: 'Paciência e harmonia' },
                            { label: 'Conformidade (C)', value: cVal, color: '#3b82f6', desc: 'Precisão e regras' },
                        ].map((item) => (
                            <div key={item.label} className="group cursor-default">
                                <div className="flex justify-between items-end mb-3">
                                    <div>
                                        <p className="font-black text-slate-900 uppercase text-sm tracking-tight group-hover:text-primary transition-colors">{item.label}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{item.desc}</p>
                                    </div>
                                    <span className="font-black text-2xl tabular-nums leading-none" style={{ color: item.color }}>{item.value}%</span>
                                </div>
                                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner relative">
                                    <div
                                        className="h-full rounded-full shadow-lg transition-all duration-1000 ease-out relative z-10"
                                        style={{ width: `${item.value}%`, backgroundColor: item.color }}
                                    />
                                    <div className="absolute top-1/2 right-1 -translate-y-1/2 h-1 w-1 bg-slate-300 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Strengths & Tips */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Strengths */}
                    <Card className="border-none shadow-2xl rounded-[2.5rem] bg-emerald-50/30 border border-emerald-100/50">
                        <CardHeader className="pt-10 px-10 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <CardTitle className="font-black uppercase tracking-[0.15em] text-emerald-800/60 text-[10px]">Pontos Fortes Sugeridos</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="px-10 pb-12">
                            <div className="space-y-4">
                                {profileInfo.strengths.map((strength, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-emerald-100 shadow-sm group hover:scale-[1.02] transition-all">
                                        <div className="h-2 w-2 rounded-full bg-emerald-400 group-hover:scale-150 transition-all" />
                                        <span className="font-bold text-slate-700 leading-tight">{strength}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Management Tips */}
                    <Card className="border-none shadow-2xl rounded-[2.5rem] bg-blue-50/30 border border-blue-100/50">
                        <CardHeader className="pt-10 px-10 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                                    <MessageSquare className="h-5 w-5" />
                                </div>
                                <CardTitle className="font-black uppercase tracking-[0.15em] text-blue-800/60 text-[10px]">Dicas para Desenvolvimento</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="px-10 pb-12">
                            <div className="space-y-4">
                                {profileInfo.tips.map((tip, idx) => (
                                    <div key={idx} className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-blue-100 shadow-sm group hover:scale-[1.02] transition-all">
                                        <ArrowRight className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0 group-hover:translate-x-1 transition-all" />
                                        <span className="font-bold text-slate-700 leading-tight">{tip}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
