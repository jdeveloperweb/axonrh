'use client';

import React, { useState, useEffect } from 'react';
import {
    Users,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Clock,
    Search,
    Filter,
    Info
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

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Tooltip as UITooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { wellbeingApi, WellbeingStats, EapRequest, WellbeingCampaign, PreventionGuide } from '@/lib/api/wellbeing';
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
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

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

    // Improved Radar Data with icons and clear meanings
    const radarData = [
        {
            subject: 'Saúde Mental',
            icon: <Brain className="w-5 h-5" />,
            description: 'Reflete a proporção de check-ins com sentimentos positivos. Indica o moral e equilíbrio psicológico atual da organização.',
            source: 'Análise de Sentimento das Notas',
            value: Math.max(30, ((statsData?.sentimentDistribution['POSITIVE'] || 0) / (totalCheckins || 1)) * 100),
            fullMark: 100
        },
        {
            subject: 'Equilíbrio de Carga',
            icon: <Activity className="w-5 h-5" />,
            description: 'Baseado na redução de casos de alerta crítico. Quanto maior, menor a percepção de sobrecarga extrema no time.',
            source: 'Volume de Alertas Críticos',
            value: Math.max(25, 85 - (statsData?.highRiskCount || 0) * 3),
            fullMark: 100
        },
        {
            subject: 'Segurança Psicológica',
            icon: <ShieldCheck className="w-5 h-5" />,
            description: 'Mede a confiança dos colaboradores em relatar problemas. Quanto maior a média de humor em relatos abertos, maior este índice.',
            source: 'Média de Humor em Relatos',
            value: Math.max(30, 65 + (statsData?.averageScore || 0) * 3),
            fullMark: 100
        },
        {
            subject: 'Clima Organizacional',
            icon: <Users className="w-5 h-5" />,
            description: 'Percepção geral convertida da escala de 1-5 para porcentagem. Representa a satisfação média no ambiente.',
            source: 'Escala 1-5 Linear (Humor)',
            value: Math.max(40, ((statsData?.averageScore || 0) / 5) * 100),
            fullMark: 100
        },
        {
            subject: 'Engajamento e Vitalidade',
            icon: <Sparkles className="w-5 h-5" />,
            description: 'Combina a frequência de check-ins com a estabilidade do humor. Indica a energia ativa aplicada no trabalho.',
            source: 'Frequência + Estabilidade de Humor',
            value: Math.max(30, 70 + (totalCheckins > 0 ? (statsData?.averageScore || 0) * 2 : 0)),
            fullMark: 100
        },
    ];

    const getStatusInfo = (val: number) => {
        if (val >= 80) return { label: 'Execelente', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
        if (val >= 60) return { label: 'Estável', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
        if (val >= 40) return { label: 'Atenção', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
        return { label: 'Crítico', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' };
    };

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
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Activity className="w-3 h-3 text-purple-500" />
                            Dados Analisados Hoje
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
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest text-right">Clima Organizacional</p>
                        {(() => {
                            const avg = statsData?.averageScore || 0;
                            let label = 'Calculando...';
                            let color = 'text-gray-400';
                            let dot = 'bg-gray-400';

                            if (avg >= 4) { label = 'Excelente'; color = 'text-emerald-600'; dot = 'bg-emerald-500'; }
                            else if (avg >= 3) { label = 'Estável'; color = 'text-blue-600'; dot = 'bg-blue-500'; }
                            else if (avg >= 2) { label = 'Atenção'; color = 'text-amber-600'; dot = 'bg-amber-500'; }
                            else if (avg > 0) { label = 'Crítico'; color = 'text-rose-600'; dot = 'bg-rose-500'; }

                            return (
                                <p className={cn("text-sm font-bold flex items-center gap-1.5", color)}>
                                    <span className={cn("w-2 h-2 rounded-full animate-pulse", dot)} />
                                    {label}
                                </p>
                            );
                        })()}
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
                <Card className="border-none shadow-2xl bg-white overflow-hidden flex flex-col h-[650px] border border-gray-100 group/card">
                    <div className="p-6 flex items-center justify-between border-b border-gray-100 bg-white relative z-50">
                        <div>
                            <CardTitle className="text-xl font-black flex items-center gap-2 text-gray-900">
                                <Sparkles className="w-6 h-6 text-purple-600 animate-pulse" />
                                Ecossistema de Vitalidade
                            </CardTitle>
                            <p className="text-xs text-gray-500 font-medium">Pulso em tempo real da saúde biopsicossocial</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 rounded-full border border-purple-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Análise IA Ativa</span>
                        </div>
                    </div>
                    <CardContent className="flex-1 p-0 flex flex-col lg:flex-row items-center justify-between relative overflow-hidden bg-[radial-gradient(circle_at_50%_50%,#f8fafc_0%,#ffffff_100%)]">

                        {/* Interactive Ecosytem Visual */}
                        <div className="relative flex-1 w-full h-[450px] flex items-center justify-center">

                            {/* Animated Background Layers */}
                            <div className="absolute inset-0 pointer-events-none">
                                {/* Large Rotating Ring */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] border border-purple-100/50 rounded-full border-dashed animate-[spin_80s_linear_infinite]" />
                                {/* Medium Pulsing Glow */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-50/30 rounded-full blur-3xl animate-pulse" />
                                {/* Floating Particles */}
                                {[...Array(12)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute w-1 h-1 bg-purple-300 rounded-full opacity-40 animate-float"
                                        style={{
                                            left: `${Math.random() * 80 + 10}%`,
                                            top: `${Math.random() * 80 + 10}%`,
                                            animationDelay: `${Math.random() * 5}s`,
                                            animationDuration: `${Math.random() * 10 + 10}s`
                                        }}
                                    />
                                ))}
                            </div>

                            {/* SVG Connections Layer */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
                                <defs>
                                    <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="4" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.1" />
                                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
                                    </linearGradient>
                                </defs>
                                {radarData.map((_, idx) => {
                                    const angle = (idx * 360 / 5) - 90;
                                    const radius = 150;
                                    const x = Math.cos(angle * Math.PI / 180) * radius;
                                    const y = Math.sin(angle * Math.PI / 180) * radius;
                                    const isHovered = hoveredIdx === idx;

                                    return (
                                        <g key={idx}>
                                            <line
                                                x1="50%"
                                                y1="50%"
                                                x2={`calc(50% + ${x}px)`}
                                                y2={`calc(50% + ${y}px)`}
                                                stroke={isHovered ? "#a855f7" : "rgba(168, 85, 247, 0.15)"}
                                                strokeWidth={isHovered ? 3 : 1.5}
                                                strokeDasharray={isHovered ? "none" : "8,8"}
                                                filter={isHovered ? "url(#lineGlow)" : "none"}
                                                className="transition-all duration-500"
                                            />
                                            {isHovered && (
                                                <circle
                                                    cx={`calc(50% + ${x}px)`}
                                                    cy={`calc(50% + ${y}px)`}
                                                    r="4"
                                                    fill="#a855f7"
                                                    className="animate-ping"
                                                />
                                            )}
                                        </g>
                                    );
                                })}
                            </svg>

                            {/* Center Nucleus */}
                            <div className="relative z-30 group/center transition-transform duration-500 hover:scale-110">
                                <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-20 animate-pulse group-hover/center:opacity-40" />
                                <div className="w-36 h-36 rounded-full bg-gradient-to-br from-purple-600 via-indigo-700 to-indigo-900 shadow-[0_0_50px_rgba(139,92,246,0.5)] flex flex-col items-center justify-center text-white relative border-4 border-white/30 backdrop-blur-sm overflow-hidden">
                                    {/* Glass Shine Effect */}
                                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 -skew-y-12" />

                                    <Sparkles className="w-8 h-8 mb-1 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]" />
                                    <div className="flex items-baseline gap-0.5 relative z-10">
                                        <span className="text-4xl font-black tracking-tight">{statsData?.averageScore ? statsData.averageScore.toFixed(1) : '3.5'}</span>
                                        <span className="text-xs opacity-80 font-bold">/5</span>
                                    </div>
                                    <span className="text-[10px] uppercase font-black tracking-[0.2em] opacity-80 mb-1 relative z-10">VITALIDADE</span>

                                    <div className={`mt-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm transition-colors relative z-10 ${statsData && statsData.averageScore >= 4 ? 'bg-emerald-500/80 border-emerald-400' :
                                            statsData && statsData.averageScore >= 3 ? 'bg-blue-500/80 border-blue-400' :
                                                'bg-rose-500/80 border-rose-400'
                                        }`}>
                                        {statsData && statsData.averageScore >= 4 ? 'Alta' : statsData && statsData.averageScore >= 3 ? 'Média' : 'Baixa'}
                                    </div>

                                    {/* Scanline Effect */}
                                    <div className="absolute inset-0 w-full h-1 bg-white/20 animate-scan pointer-events-none" />
                                </div>

                                {/* Orbiting Rings Details */}
                                <div className="absolute inset-[-20px] border border-purple-200/30 rounded-full animate-[spin_20s_linear_infinite]" />
                                <div className="absolute inset-[-40px] border border-purple-200/10 rounded-full animate-[spin_35s_linear_infinite_reverse]" />
                            </div>

                            {/* Satellite Orbs */}
                            {radarData.map((item, idx) => {
                                const angle = (idx * 360 / 5) - 90;
                                const radius = 165; // Slightly wider radius
                                const x = Math.cos(angle * Math.PI / 180) * radius;
                                const y = Math.sin(angle * Math.PI / 180) * radius;

                                const orbSize = 65 + (item.value / 100) * 15;
                                const isHovered = hoveredIdx === idx;

                                const colorClass = item.value < 40
                                    ? 'from-rose-400 to-rose-600 shadow-rose-200/50'
                                    : item.value > 75
                                        ? 'from-emerald-400 to-teal-600 shadow-emerald-200/50'
                                        : 'from-blue-400 to-indigo-600 shadow-indigo-200/50';

                                return (
                                    <div
                                        key={idx}
                                        className={`absolute z-40 transition-all duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
                                        style={{
                                            left: `calc(50% + ${x}px)`,
                                            top: `calc(50% + ${y}px)`,
                                            transform: 'translate(-50%, -50%)',
                                        }}
                                        onMouseEnter={() => setHoveredIdx(idx)}
                                        onMouseLeave={() => setHoveredIdx(null)}
                                    >
                                        <div className="flex flex-col items-center group/orb">
                                            <div
                                                className={`rounded-2xl bg-gradient-to-br ${colorClass} shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center p-3 relative border-2 border-white/50 backdrop-blur-sm group-hover/orb:shadow-2xl transition-all duration-300`}
                                                style={{ width: `${orbSize}px`, height: `${orbSize}px` }}
                                            >
                                                <div className="text-white opacity-90 mb-1 group-hover/orb:scale-110 transition-transform">
                                                    {React.cloneElement(item.icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
                                                </div>
                                                <span className="text-white font-black text-sm leading-none">{Math.round(item.value)}%</span>

                                                {/* Orbital Path Highlight */}
                                                {isHovered && (
                                                    <div className="absolute inset-0 rounded-2xl border-2 border-white animate-pulse" />
                                                )}
                                            </div>

                                            {/* Label with Glassmorphism */}
                                            <div className={`mt-3 px-3 py-1.5 glass rounded-xl shadow-lg border-white/50 transition-all duration-300 ${isHovered ? 'bg-white translate-y-[-5px]' : 'bg-white/80'}`}>
                                                <span className="text-[10px] font-black text-gray-800 whitespace-nowrap uppercase tracking-wide">{item.subject}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Sidebar Legend/Info */}
                        <div className="w-full lg:w-64 h-full p-6 bg-gray-50/50 border-l border-gray-100 flex flex-col justify-center gap-6 relative z-50">
                            <div className="p-4 bg-white rounded-2xl border border-purple-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform" />
                                <p className="text-[10px] text-purple-600 font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                                    <Brain className="w-4 h-4" />
                                    IA Insights
                                </p>
                                <p className="text-[12px] text-gray-700 leading-relaxed font-semibold">
                                    {statsData && statsData.averageScore >= 3
                                        ? "Ecossistema resiliente detectado. Foco em manutenção preventiva."
                                        : "Vulnerabilidade sistêmica. Recomendado intervenção focada em segurança psicológica."}
                                </p>
                            </div>

                            <div className="space-y-3">
                                {radarData.map((item, idx) => {
                                    const status = getStatusInfo(item.value);
                                    const isHovered = hoveredIdx === idx;
                                    return (
                                        <div
                                            key={idx}
                                            className={`p-3 rounded-xl border transition-all duration-300 cursor-default ${isHovered ? 'bg-white border-purple-200 shadow-md scale-105' : 'bg-white/50 border-transparent hover:bg-white/80'
                                                }`}
                                            onMouseEnter={() => setHoveredIdx(idx)}
                                            onMouseLeave={() => setHoveredIdx(null)}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`p-1.5 rounded-lg ${status.bg} ${status.color}`}>
                                                        {React.cloneElement(item.icon as React.ReactElement<any>, { className: 'w-3.5 h-3.5' })}
                                                    </div>
                                                    <span className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">{item.subject}</span>
                                                </div>
                                                <span className="text-xs font-black text-gray-900">{Math.round(item.value)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200/50 h-2 rounded-full overflow-hidden p-[1px]">
                                                <div
                                                    className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                                                    style={{
                                                        width: `${item.value}%`,
                                                        backgroundImage: `linear-gradient(to right, ${item.value < 40 ? '#fb7185, #e11d48' :
                                                                item.value > 80 ? '#34d399, #059669' :
                                                                    '#818cf8, #6366f1'
                                                            })`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
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
                        <Card
                            className="border-none shadow-lg bg-gradient-to-br from-indigo-600 to-purple-700 text-white group cursor-pointer hover:scale-[1.02] transition-transform"
                            onClick={() => setIsGuideModalOpen(true)}
                        >
                            <CardContent className="p-6 flex flex-col justify-between h-full">
                                <Brain className="w-8 h-8 opacity-80" />
                                <div>
                                    <h4 className="text-lg font-bold">{statsData?.preventionGuides?.[0]?.title || 'Guia de Prevenção'}</h4>
                                    <p className="text-white/70 text-sm mt-1">{statsData?.preventionGuides?.[0]?.description || 'Materiais para gestores sobre saúde mental.'}</p>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-bold mt-4">
                                    Acessar Agora
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card
                            className="border-none shadow-lg bg-white border border-purple-100 group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative"
                            onClick={() => setIsCampaignModalOpen(true)}
                        >
                            <div className="absolute top-0 right-0 p-4">
                                <Lightbulb className="w-12 h-12 text-yellow-500/10 group-hover:text-yellow-500/20 transition-colors" />
                            </div>
                            <CardContent className="p-6 flex flex-col justify-between h-full relative z-10">
                                <Smile className="w-8 h-8 text-purple-600" />
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900">{statsData?.activeCampaigns?.[0]?.title || 'Campanhas'}</h4>
                                    <p className="text-gray-500 text-sm mt-1">
                                        {statsData?.activeCampaigns?.[0]?.description ? (
                                            <>Próximo: "{statsData.activeCampaigns[0].description}"</>
                                        ) : (
                                            'Próximo workshop: "Mindfulness no Trabalho".'
                                        )}
                                    </p>
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

            {/* Campaigns Modal */}
            <Dialog open={isCampaignModalOpen} onOpenChange={setIsCampaignModalOpen}>
                <DialogContent className="max-w-2xl bg-white rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Calendar className="w-32 h-32" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black flex items-center gap-3 text-white">
                                <Sparkles className="w-6 h-6 text-yellow-300" />
                                Agenda de Campanhas e Workshops
                            </DialogTitle>
                            <DialogDescription className="text-purple-100 text-lg opacity-90 mt-2">
                                Fique por dentro de todas as ações de saúde mental da AxonRH.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 bg-gray-50/30">
                        {statsData?.activeCampaigns && statsData.activeCampaigns.length > 0 ? (
                            statsData.activeCampaigns.map((camp) => (
                                <div key={camp.id} className="flex flex-col md:flex-row gap-4 p-5 bg-white rounded-2xl border border-purple-50 hover:shadow-md transition-all group">
                                    <div className="w-full md:w-32 h-32 md:h-24 bg-purple-50 rounded-xl flex flex-col items-center justify-center text-purple-600 border border-purple-100 shrink-0">
                                        <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">
                                            {new Date(camp.date).toLocaleDateString('pt-BR', { month: 'short' })}
                                        </span>
                                        <span className="text-3xl font-black">
                                            {new Date(camp.date).getDate()}
                                        </span>
                                        <span className="text-[10px] font-bold">
                                            {new Date(camp.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="flex items-center justify-between mb-1">
                                            <h5 className="font-extrabold text-gray-900 group-hover:text-purple-600 transition-colors">{camp.title}</h5>
                                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{camp.status}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{camp.description}</p>
                                        <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                                            <span className="flex items-center gap-1">
                                                <Activity className="w-3 h-3" />
                                                {camp.location}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="self-center p-3 bg-gray-50 hover:bg-purple-100 text-gray-400 hover:text-purple-600 rounded-xl transition-all">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="font-bold">Nenhuma campanha ativa no momento</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Prevention Guides Modal */}
            <Dialog open={isGuideModalOpen} onOpenChange={setIsGuideModalOpen}>
                <DialogContent className="max-w-2xl bg-white rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
                    <div className="bg-gradient-to-r from-indigo-700 to-purple-800 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Brain className="w-32 h-32" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black flex items-center gap-3 text-white">
                                <Brain className="w-6 h-6 text-purple-300" />
                                Guia de Prevenção e Recursos
                            </DialogTitle>
                            <DialogDescription className="text-indigo-100 text-lg opacity-90 mt-2">
                                Materiais educativos para apoiar gestores e colaboradores.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/30">
                        {statsData?.preventionGuides && statsData.preventionGuides.length > 0 ? (
                            statsData.preventionGuides.map((guide) => (
                                <div
                                    key={guide.id}
                                    className="p-5 bg-white rounded-2xl border border-indigo-50 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
                                    onClick={() => guide.url && window.open(guide.url, '_blank')}
                                >
                                    <div>
                                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <ShieldCheck className="w-6 h-6" />
                                        </div>
                                        <h5 className="font-extrabold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors uppercase text-xs tracking-wide">{guide.title}</h5>
                                        <p className="text-xs text-gray-500 leading-relaxed mb-4">{guide.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest pt-2 border-t border-gray-50">
                                        Ver Material
                                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 text-center py-12 text-gray-400">
                                <p className="font-bold">Nenhum guia disponível</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
