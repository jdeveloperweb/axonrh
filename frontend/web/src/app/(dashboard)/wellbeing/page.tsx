'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Clock,
    Search,
    Filter
} from 'lucide-react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, Tooltip, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
    Heart,
    Brain,
    Smile,
    ShieldCheck,
    ArrowRight,
    Sparkles,
    Lightbulb,
    MessageCircle,
    Activity,
    Calendar,
    ChevronRight
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { wellbeingApi, WellbeingStats, EapRequest } from '@/lib/api/wellbeing';
import { cn } from '@/lib/utils'; // Assuming this exists based on sidebar import

// ==================== Types ====================

const TRANSLATIONS: Record<string, string> = {
    'HIGH': 'Alto Risco',
    'MEDIUM': 'Médio Risco',
    'LOW': 'Baixo Risco'
};

const translate = (key: string) => TRANSLATIONS[key] || key;

export default function WellbeingPage() {
    const { user } = useAuthStore();
    const [statsData, setStatsData] = useState<WellbeingStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'HANDLED'>('ALL');

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        try {
            setLoading(true);
            const data = await wellbeingApi.getStats();
            setStatsData(data);
        } catch (error) {
            console.error('Error loading wellbeing stats:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleMarkAsHandled = async (id: string) => {
        try {
            await wellbeingApi.markAsHandled(id);
            await loadStats(); // Refresh
        } catch (error) {
            console.error('Error marking request as handled:', error);
        }
    };

    if (loading && !statsData) {
        return (
            <div className="flex h-96 items-center justify-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></div>
                Carregando dados de saúde mental...
            </div>
        );
    }

    // --- Data Prep ---
    const totalCheckins = statsData?.totalCheckins || 1;

    // Improved Radar Data with calculated or fallback values
    const radarData = [
        { subject: 'Saúde Mental', value: Math.max(30, ((statsData?.sentimentDistribution['POSITIVE'] || 0) / totalCheckins) * 100), fullMark: 100 },
        { subject: 'Equilíbrio de Carga', value: Math.max(25, 85 - (statsData?.highRiskCount || 0) * 3), fullMark: 100 },
        { subject: 'Segurança Psicológica', value: Math.max(30, 65 + (statsData?.averageScore || 0) * 3), fullMark: 100 },
        { subject: 'Clima Organizacional', value: Math.max(40, ((statsData?.averageScore || 0) / 5) * 100), fullMark: 100 },
        { subject: 'Engajamento e Vitalidade', value: Math.max(30, 70 + (totalCheckins > 0 ? (statsData?.averageScore || 0) * 2 : 0)), fullMark: 100 },
    ];

    const sentimentDataArr = [
        { name: 'Positivo', value: statsData?.sentimentDistribution['POSITIVE'] || 0, color: '#10b981' },
        { name: 'Neutro', value: statsData?.sentimentDistribution['NEUTRAL'] || 0, color: '#94a3b8' },
        { name: 'Negativo', value: statsData?.sentimentDistribution['NEGATIVE'] || 0, color: '#ef4444' },
    ].filter(d => d.value > 0);

    // If all are 0, add a placeholder
    const displaySentimentData = sentimentDataArr.length > 0 ? sentimentDataArr : [{ name: 'Sem dados', value: 1, color: '#e2e8f0' }];

    const filteredRequests = (statsData?.eapRequests || []).filter(req => {
        if (filter === 'PENDING') return !req.handled;
        if (filter === 'HANDLED') return req.handled;
        return true;
    });

    return (
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full uppercase tracking-wider">Módulo de IA</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            Atualizado hoje
                        </span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <Heart className="w-8 h-8 text-purple-600 fill-purple-100" />
                        Saúde Mental e Bem-Estar
                    </h1>
                    <p className="text-gray-500 text-lg">Monitoramento inteligente de clima organizacional e suporte preventivo aos colaboradores.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex flex-col items-end mr-4">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Status Geral</p>
                        <p className="text-sm font-semibold text-green-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Clima Estável
                        </p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-purple-200 hover:shadow-purple-300 transition-all active:scale-95">
                        <MessageCircle className="w-4 h-4" />
                        Gerar Relatório Completo
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm bg-white hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Users className="w-16 h-16" />
                    </div>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Check-ins Totais</p>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <h3 className="text-4xl font-black text-gray-900">{statsData?.totalCheckins || 0}</h3>
                                    <span className="text-xs font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">+12%</span>
                                </div>
                            </div>
                            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Smile className="w-16 h-16" />
                    </div>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Média de Humor</p>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <h3 className="text-4xl font-black text-gray-900">
                                        {statsData?.averageScore ? statsData.averageScore.toFixed(1) : '0.0'}
                                    </h3>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase">/ 5.0</span>
                                </div>
                            </div>
                            <div className={`p-3.5 rounded-2xl group-hover:scale-110 transition-transform ${statsData && statsData.averageScore >= 4 ? 'bg-green-50 text-green-600' :
                                statsData && statsData.averageScore <= 2 ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                                }`}>
                                <TrendingUp className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white hover:shadow-xl transition-all group overflow-hidden relative border-t-4 border-t-red-400">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <AlertCircle className="w-16 h-16" />
                    </div>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Em Alerta</p>
                                    <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
                                </div>
                                <h3 className="text-4xl font-black text-red-600 mt-2">{statsData?.highRiskCount || 0}</h3>
                                <p className="text-xs font-medium text-gray-400 mt-1">Colaboradores em risco</p>
                            </div>
                            <div className="p-3.5 bg-red-50 text-red-600 rounded-2xl group-hover:scale-110 transition-transform shadow-sm shadow-red-100">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShieldCheck className="w-16 h-16" />
                    </div>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Apoio EAP</p>
                                <h3 className="text-4xl font-black text-purple-600 mt-2">
                                    {statsData?.eapRequests.filter(r => !r.handled).length || 0}
                                </h3>
                                <p className="text-xs font-medium text-gray-400 mt-1">Pendentes de triagem</p>
                            </div>
                            <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform shadow-sm shadow-purple-100">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Dynamic Wellbeing Ecosystem */}
                <Card className="border-none shadow-lg bg-white overflow-hidden flex flex-col h-[600px] border border-gray-100">
                    <div className="p-6 flex items-center justify-between border-b border-gray-100 bg-gray-50/30">
                        <div>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-500" />
                                Ecossistema de Vitalidade Corporativa
                            </CardTitle>
                            <p className="text-sm text-gray-500">Representação viva da energia e saúde da organização</p>
                        </div>
                        <div className="px-3 py-1 bg-purple-50 rounded-lg">
                            <span className="text-xs font-bold text-purple-700">IA Monitor</span>
                        </div>
                    </div>
                    <CardContent className="flex-1 p-6 flex flex-col lg:flex-row gap-10 items-center justify-center relative bg-gradient-to-b from-white to-purple-50/20 px-10">
                        {/* Organic Ecosystem Visual Area */}
                        <div className="relative w-full h-[400px] flex items-center justify-center">
                            {/* Decorative Grid/Lines for Depth */}
                            <div className="absolute inset-0 opacity-20 pointer-events-none">
                                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-300 to-transparent" />
                                <div className="absolute top-0 left-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-purple-300 to-transparent" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-purple-200 rounded-full border-dashed animate-[spin_60s_linear_infinite]" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] border border-purple-100 rounded-full border-dashed animate-[spin_40s_linear_infinite_reverse]" />
                            </div>

                            {/* Center Heart Orb */}
                            <div
                                className="relative z-20 group"
                                style={{ transform: `scale(${0.8 + (statsData?.averageScore || 2.5) / 10})` }}
                            >
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-[0_0_50px_rgba(139,92,246,0.4)] animate-orb-pulse flex flex-col items-center justify-center text-white relative cursor-help transition-all duration-500 hover:scale-105 active:scale-95 overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                                    <Sparkles className="w-6 h-6 mb-1 drop-shadow-md" />
                                    <span className="text-2xl font-black">{statsData?.averageScore ? statsData.averageScore.toFixed(1) : '3.5'}</span>
                                    <span className="text-[10px] uppercase font-bold tracking-tighter opacity-80">Vitalidade</span>
                                </div>
                                <div className="absolute -inset-4 bg-purple-400/20 rounded-full blur-2xl animate-pulse -z-10" />
                            </div>

                            {/* Satellite Orbs */}
                            {radarData.map((item, idx) => {
                                // Positions based on index (pentagon-like layout)
                                const angle = (idx * 360 / 5) - 90;
                                const radius = 160;
                                const x = Math.cos(angle * Math.PI / 180) * radius;
                                const y = Math.sin(angle * Math.PI / 180) * radius;

                                const orbSize = 65 + (item.value / 100) * 35;
                                const floatClass = idx % 2 === 0 ? 'animate-orb-float-1' : 'animate-orb-float-2';

                                // Color logic
                                const isWarning = item.value < 40;
                                const isHealthy = item.value > 70;

                                const colorClass = isWarning
                                    ? 'from-red-400 to-rose-500 border-red-200 shadow-red-200'
                                    : isHealthy
                                        ? 'from-emerald-400 to-teal-500 border-emerald-200 shadow-emerald-200'
                                        : 'from-blue-400 to-indigo-500 border-blue-200 shadow-indigo-200';

                                return (
                                    <div
                                        key={idx}
                                        className={`absolute z-30 flex flex-col items-center gap-2 group transition-all duration-700 hover:scale-110 ${floatClass}`}
                                        style={{
                                            left: `calc(50% + ${x}px)`,
                                            top: `calc(50% + ${y}px)`,
                                            transform: 'translate(-50%, -50%)',
                                            animationDelay: `${idx * 0.5}s`
                                        }}
                                    >
                                        <div
                                            className={`rounded-3xl bg-gradient-to-br ${colorClass} shadow-lg border-2 flex flex-col items-center justify-center p-4 relative cursor-pointer`}
                                            style={{ width: `${orbSize}px`, height: `${orbSize}px` }}
                                        >
                                            <span className="text-white font-black text-lg drop-shadow-sm">{Math.round(item.value)}%</span>
                                            <div className="absolute inset-0 rounded-3xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity backdrop-brightness-110" />
                                        </div>
                                        <div className="glass px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-2 group-hover:translate-y-0 shadow-lg">
                                            <span className="text-[10px] font-bold text-gray-800 whitespace-nowrap">{item.subject}</span>
                                        </div>

                                        {/* Connector line effect */}
                                        <div
                                            className="absolute top-1/2 left-1/2 w-[1px] bg-gradient-to-r from-purple-200 to-transparent -z-10 origin-left"
                                            style={{
                                                width: `${radius}px`,
                                                transform: `rotate(${angle + 180}deg) scaleX(${0.5})`,
                                                opacity: 0.3
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Sidebar Legend/Info */}
                        <div className="w-full lg:w-64 space-y-6 shrink-0 relative z-40">
                            <div className="p-5 bg-white/60 backdrop-blur-md rounded-2xl border border-purple-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:rotate-12 transition-transform">
                                    <Sparkles className="w-8 h-8 text-purple-500" />
                                </div>
                                <p className="text-[10px] text-purple-600 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <Brain className="w-3 h-3" />
                                    Insight da IA Axon
                                </p>
                                <p className="text-sm text-gray-700 leading-relaxed italic font-medium">
                                    "{statsData && statsData.averageScore >= 3
                                        ? "O ecossistema apresenta uma tendência expansiva. Foco em manter o equilíbrio de carga."
                                        : "Atenção: Percebemos contração nas esferas de vitalidade. Recomenda-se ações imediatas de acolhimento."}"
                                </p>
                            </div>

                            <div className="space-y-4">
                                {radarData.map((item, idx) => (
                                    <div key={idx} className="group cursor-default">
                                        <div className="flex items-center justify-between mb-1.5 px-1">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${item.value < 40 ? 'bg-red-400' : item.value > 70 ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                                                <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">{item.subject}</span>
                                            </div>
                                            <span className="text-xs font-black text-gray-900">{Math.round(item.value)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden p-[1px] border border-gray-50">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${item.value < 40 ? 'bg-gradient-to-r from-red-400 to-rose-500' :
                                                    item.value > 70 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
                                                        'bg-gradient-to-r from-purple-500 to-indigo-600'
                                                    }`}
                                                style={{ width: `${item.value}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>


                {/* Sentiment Distribution and Resources */}
                <div className="space-y-8 flex flex-col h-[600px]">
                    <Card className="border-none shadow-lg bg-white overflow-hidden border border-gray-100 flex-1">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/30">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-500" />
                                Distribuição de Sentimentos
                            </CardTitle>
                        </div>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full pt-4">
                                <div className="h-[230px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={displaySentimentData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={8}
                                                dataKey="value"
                                            >
                                                {displaySentimentData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-3 rounded-xl bg-green-50 border border-green-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-green-500" />
                                            <span className="text-sm font-semibold text-green-700">Positivo</span>
                                        </div>
                                        <span className="text-sm font-black text-green-700">{statsData?.sentimentDistribution['POSITIVE'] || 0}</span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-gray-400" />
                                            <span className="text-sm font-semibold text-gray-600">Neutro</span>
                                        </div>
                                        <span className="text-sm font-black text-gray-600">{statsData?.sentimentDistribution['NEUTRAL'] || 0}</span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-red-500" />
                                            <span className="text-sm font-semibold text-red-700">Alerta IA</span>
                                        </div>
                                        <span className="text-sm font-black text-red-700">{statsData?.sentimentDistribution['NEGATIVE'] || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[250px]">
                        <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-600 to-purple-700 text-white group cursor-pointer hover:scale-[1.02] transition-transform">
                            <CardContent className="p-6 flex flex-col justify-between h-full">
                                <Brain className="w-8 h-8 opacity-80" />
                                <div>
                                    <h4 className="text-lg font-bold">Guia de Prevenção</h4>
                                    <p className="text-white/70 text-sm mt-1">Materiais para gestores sobre saúde mental.</p>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-bold mt-4">
                                    Acessar Agora
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-lg bg-white border border-purple-100 group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4">
                                <Lightbulb className="w-12 h-12 text-yellow-500/10 group-hover:text-yellow-500/20 transition-colors" />
                            </div>
                            <CardContent className="p-6 flex flex-col justify-between h-full relative z-10">
                                <Smile className="w-8 h-8 text-purple-600" />
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900">Campanhas</h4>
                                    <p className="text-gray-500 text-sm mt-1">Próximo workshop: "Mindfulness no Trabalho".</p>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-bold text-purple-600 mt-4">
                                    Ver Agenda
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Requests List */}
            <Card className="border-none shadow-xl bg-white min-h-[500px] flex flex-col border border-gray-100 overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-4 bg-gray-50/50 border-b border-gray-100">
                    <div>
                        <CardTitle className="text-xl font-black text-gray-900 tracking-tight">Solicitações de Apoio (EAP)</CardTitle>
                        <p className="text-sm text-gray-500">Triagem inteligente de pedidos de suporte emocional</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-200/50 p-1.5 rounded-xl border border-gray-200 shadow-inner">
                        <button
                            onClick={() => setFilter('ALL')}
                            className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all", filter === 'ALL' ? "bg-white text-purple-600 shadow-md" : "text-gray-500 hover:text-gray-700")}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFilter('PENDING')}
                            className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all", filter === 'PENDING' ? "bg-white text-purple-600 shadow-md" : "text-gray-500 hover:text-gray-700")}
                        >
                            Pendentes
                        </button>
                        <button
                            onClick={() => setFilter('HANDLED')}
                            className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all", filter === 'HANDLED' ? "bg-white text-purple-600 shadow-md" : "text-gray-500 hover:text-gray-700")}
                        >
                            Atendidos
                        </button>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-6 bg-gray-50/20">
                    {filteredRequests.length > 0 ? (
                        <div className="space-y-4">
                            {filteredRequests.map((req, idx) => {
                                const isHandled = req.handled;
                                return (
                                    <div key={idx} className={`flex flex-col p-6 rounded-2xl border transition-all hover:shadow-lg ${isHandled ? 'bg-white opacity-70 grayscale-[0.2]' : 'bg-white border-purple-100 shadow-md border-l-[6px] border-l-purple-500 scale-[1.01]'}`}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative group">
                                                    {req.employeePhotoUrl ? (
                                                        <img src={req.employeePhotoUrl} alt={req.employeeName} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-100" />
                                                    ) : (
                                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-purple-600 font-bold text-lg uppercase shadow-inner">
                                                            {req.employeeName?.substring(0, 2) || '?'}
                                                        </div>
                                                    )}
                                                    {!isHandled && (
                                                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full border-4 border-white animate-pulse" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-lg font-extrabold text-gray-900 leading-none">{req.employeeName || 'Desconhecido'}</p>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(req.createdAt).toLocaleDateString()} às {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                        {isHandled && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider">Atendido</span>}
                                                        {!isHandled && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider">Urgente</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            {!isHandled && (
                                                <button
                                                    onClick={() => handleMarkAsHandled(req.id)}
                                                    className="px-4 py-2.5 text-xs font-bold bg-white border-2 border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white rounded-xl transition-all flex items-center gap-2 group shadow-sm active:scale-95"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Finalizar Atendimento
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group-hover:bg-white transition-colors">
                                                <div>
                                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Score de Humor</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="flex gap-1">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <div key={s} className={`w-3 h-5 rounded-md shadow-sm ${s <= req.score ? (req.score <= 2 ? 'bg-red-500' : req.score >= 4 ? 'bg-green-500' : 'bg-yellow-500') : 'bg-gray-200'}`} />
                                                            ))}
                                                        </div>
                                                        <span className="text-sm font-black text-gray-700 ml-1">{req.score}.0</span>
                                                    </div>
                                                </div>
                                                <div className={`p-2 rounded-lg ${req.score <= 2 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                    {req.score <= 2 ? <AlertCircle className="w-5 h-5" /> : <Smile className="w-5 h-5" />}
                                                </div>
                                            </div>
                                            <div className="px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-white transition-colors">
                                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Análise da IA Axon</p>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-2 h-2 rounded-full ${req.sentiment === 'POSITIVE' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                        <span className={`text-xs font-bold ${req.sentiment === 'POSITIVE' ? 'text-green-600' : req.sentiment === 'NEGATIVE' ? 'text-red-600' : 'text-gray-600'}`}>
                                                            {req.sentiment === 'POSITIVE' ? 'Harmonioso' : req.sentiment === 'NEGATIVE' ? 'Sinal Crítico' : 'Neutro'}
                                                        </span>
                                                    </div>
                                                    <span className="text-gray-300">|</span>
                                                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider ${req.riskLevel === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {translate(req.riskLevel)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {req.notes && (
                                            <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:rotate-12 transition-transform">
                                                    <Brain className="w-8 h-8 text-indigo-500" />
                                                </div>
                                                <p className="text-[10px] text-indigo-400 uppercase font-black tracking-widest mb-2">Relato do Colaborador</p>
                                                <p className="text-sm text-gray-700 italic leading-relaxed relative z-10 font-medium whitespace-pre-wrap">
                                                    "{req.notes}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Clock className="w-16 h-16 text-gray-200 mb-4" />
                            <p className="text-xl font-bold text-gray-500">Nenhum registro encontrado</p>
                            <p className="text-sm text-gray-400">Não há solicitações para os filtros selecionados.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
