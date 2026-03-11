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
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import {
    Tooltip as UITooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { wellbeingApi, WellbeingStats, EapRequest } from '@/lib/api/wellbeing';
import { eventsApi, Event as AppEvent } from '@/lib/api/events';
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
    const { success, error: toastError } = useToast();
    const [statsData, setStatsData] = useState<WellbeingStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'HANDLED'>('ALL');
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

    // Registration States
    const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);
    const [isNewGuideModalOpen, setIsNewGuideModalOpen] = useState(false);
    const [newCampaign, setNewCampaign] = useState<Partial<AppEvent>>({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        status: 'UPCOMING',
        category: 'WELLBEING'
    });
    const [newGuide, setNewGuide] = useState<Partial<AppEvent>>({
        title: '',
        description: '',
        url: '',
        category: 'WELLBEING_GUIDE',
        date: new Date().toISOString()
    });

    const isManagement = user?.roles?.some(r => ['ADMIN', 'RH', 'GESTOR_RH', 'HEALTH_PROFESSIONAL'].includes(r));

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

    const handleSaveCampaign = async () => {
        try {
            if (!newCampaign.title || !newCampaign.date) return;
            await eventsApi.save(newCampaign);
            success('Campanha salva!', 'A campanha foi criada com sucesso.');
            setIsNewCampaignModalOpen(false);
            setNewCampaign({
                title: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                location: '',
                status: 'UPCOMING',
                category: 'WELLBEING'
            });
            await loadStats();
        } catch (error) {
            console.error('Error saving campaign:', error);
        }
    };

    const handleDeleteCampaign = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Deseja excluir esta campanha?')) return;
        try {
            await eventsApi.delete(id);
            success('Campanha excluída', 'A campanha foi removida.');
            await loadStats();
        } catch (error) {
            console.error('Error deleting campaign:', error);
        }
    };

    const handleSaveGuide = async () => {
        try {
            if (!newGuide.title || !newGuide.url) return;
            await eventsApi.save(newGuide);
            success('Material salvo!', 'O material de prevenção foi registrado.');
            setIsNewGuideModalOpen(false);
            setNewGuide({
                title: '',
                description: '',
                url: '',
                category: 'WELLBEING_GUIDE',
                date: new Date().toISOString()
            });
            await loadStats();
        } catch (error) {
            console.error('Error saving guide:', error);
        }
    };

    const handleDeleteGuide = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Deseja excluir este recurso?')) return;
        try {
            await eventsApi.delete(id);
            success('Material excluído', 'O recurso foi removido.');
            await loadStats();
        } catch (error) {
            console.error('Error deleting resource:', error);
        }
    };

    const handleRegister = async (id: string) => {
        try {
            await eventsApi.register(id);
            await loadStats();
        } catch (error) {
            console.error('Error registering:', error);
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
            value: Math.max(30, (((statsData?.sentimentDistribution && statsData.sentimentDistribution['POSITIVE']) || 0) / (totalCheckins || 1)) * 100),
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
                            <Activity className="w-3 h-3 text-primary" />
                            Dados Analisados Hoje
                        </span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <Heart className="w-8 h-8 text-primary fill-primary/10" />
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
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-700 text-white rounded-xl font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95">
                        <MessageCircle className="w-4 h-4" />
                        Gerar Relatório Completo
                    </button>
                    {isManagement && (
                        <button
                            onClick={() => setIsNewCampaignModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-primary text-primary rounded-xl font-bold shadow-sm hover:bg-primary/5 transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            Novo Evento
                        </button>
                    )}
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
                                <h3 className="text-4xl font-black text-primary mt-2">
                                    {statsData?.eapRequests.filter(r => !r.handled).length || 0}
                                </h3>
                                <p className="text-xs font-medium text-gray-400 mt-1">Pendentes de triagem</p>
                            </div>
                            <div className="p-3.5 bg-primary/10 text-primary rounded-2xl group-hover:scale-110 transition-transform shadow-sm shadow-primary/5">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <Card className="border-none overflow-hidden flex flex-col h-[650px] group/card relative" style={{background: 'linear-gradient(145deg, #060e1c, #0a1628 40%, #060d1b)', boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.04)'}}>
                    {/* Background texture */}
                    <div className="absolute inset-0 pointer-events-none" style={{backgroundImage: 'radial-gradient(ellipse 70% 55% at 25% 60%, rgba(59,130,246,0.08) 0%, transparent 65%), radial-gradient(ellipse 40% 40% at 75% 20%, rgba(139,92,246,0.05) 0%, transparent 60%), linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize: 'auto, auto, 52px 52px, 52px 52px'}} />
                    {/* Top edge highlight */}
                    <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), rgba(139,92,246,0.2), transparent)'}} />
                    {/* Header */}
                    <div className="p-6 flex items-center justify-between relative z-10" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.22)'}}>
                                <Sparkles className="w-5 h-5" style={{color: '#60a5fa'}} />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-black tracking-tight" style={{color: '#e2e8f0'}}>Ecossistema de Vitalidade</CardTitle>
                                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase mt-0.5" style={{color: 'rgba(96,165,250,0.5)'}}>Pulso em tempo real da saúde biopsicossocial</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)'}}>
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background: '#60a5fa', boxShadow: '0 0 6px #3b82f6'}} />
                            <span className="text-[9px] font-black tracking-[0.15em] uppercase" style={{color: 'rgba(96,165,250,0.85)'}}>Análise IA Ativa</span>
                        </div>
                    </div>
                    {/* Content */}
                    <CardContent className="flex-1 p-0 flex flex-col lg:flex-row overflow-hidden relative z-10">
                        {/* Radar SVG */}
                        <div className="relative flex-1 flex items-center justify-center">
                            <svg viewBox="0 0 520 440" className="w-full h-full" aria-label="Ecossistema de Vitalidade">
                                <defs>
                                    <linearGradient id="radarAreaFill" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.32" />
                                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.08" />
                                    </linearGradient>
                                    <filter id="dotGlowFilter" x="-100%" y="-100%" width="300%" height="300%">
                                        <feGaussianBlur stdDeviation="3" result="blur" />
                                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                    </filter>
                                    <filter id="polygonGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                    </filter>
                                </defs>

                                {/* Ambient glow */}
                                <circle cx="260" cy="220" r="100" fill="rgba(59,130,246,0.04)" />
                                <circle cx="260" cy="220" r="65" fill="rgba(59,130,246,0.04)" />

                                {/* Grid polygons */}
                                {[0.25, 0.50, 0.75, 1.0].map((level, li) => {
                                    const pts = Array.from({ length: 5 }, (_, i) => {
                                        const a = (i * 2 * Math.PI / 5) - Math.PI / 2;
                                        const r = level * 130;
                                        return `${260 + r * Math.cos(a)},${220 + r * Math.sin(a)}`;
                                    }).join(' ');
                                    return (
                                        <polygon
                                            key={li}
                                            points={pts}
                                            fill={li === 3 ? 'rgba(255,255,255,0.012)' : 'none'}
                                            stroke={li === 3 ? 'rgba(255,255,255,0.14)' : li === 2 ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)'}
                                            strokeWidth={li === 3 ? 1.5 : 1}
                                            strokeDasharray={li === 0 ? '2,6' : undefined}
                                        />
                                    );
                                })}

                                {/* Axis lines */}
                                {radarData.map((_, i) => {
                                    const a = (i * 2 * Math.PI / 5) - Math.PI / 2;
                                    return (
                                        <line key={i} x1="260" y1="220"
                                            x2={260 + 130 * Math.cos(a)}
                                            y2={220 + 130 * Math.sin(a)}
                                            stroke="rgba(255,255,255,0.05)" strokeWidth="1"
                                        />
                                    );
                                })}

                                {/* Scale labels */}
                                <text x="264" y={220 - 65 + 4} fontSize="7" fill="rgba(255,255,255,0.18)" fontWeight="500">50%</text>
                                <text x="264" y={220 - 32 + 4} fontSize="7" fill="rgba(255,255,255,0.12)" fontWeight="500">25%</text>

                                {/* Data polygon */}
                                <polygon
                                    points={radarData.map((item, i) => {
                                        const a = (i * 2 * Math.PI / 5) - Math.PI / 2;
                                        const r = (item.value / 100) * 130;
                                        return `${260 + r * Math.cos(a)},${220 + r * Math.sin(a)}`;
                                    }).join(' ')}
                                    fill="url(#radarAreaFill)"
                                    stroke="rgba(96,165,250,0.75)"
                                    strokeWidth="2"
                                    strokeLinejoin="round"
                                    filter="url(#polygonGlowFilter)"
                                />

                                {/* Data dots */}
                                {radarData.map((item, i) => {
                                    const a = (i * 2 * Math.PI / 5) - Math.PI / 2;
                                    const r = (item.value / 100) * 130;
                                    const px = 260 + r * Math.cos(a);
                                    const py = 220 + r * Math.sin(a);
                                    const isHov = hoveredIdx === i;
                                    const dotColor = item.value < 40 ? '#ff3a6e' : item.value < 60 ? '#fbbf24' : '#22d3ee';
                                    return (
                                        <g key={i}
                                            onMouseEnter={() => setHoveredIdx(i)}
                                            onMouseLeave={() => setHoveredIdx(null)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <circle cx={px} cy={py} r={isHov ? 18 : 11} fill={dotColor} fillOpacity={isHov ? 0.18 : 0.1} />
                                            <circle cx={px} cy={py} r={isHov ? 7 : 5} fill={dotColor} stroke="rgba(6,14,28,0.9)" strokeWidth="2" filter="url(#dotGlowFilter)" />
                                            {isHov && (
                                                <g>
                                                    <rect x={px - 28} y={py - 44} width="56" height="22" rx="5" fill={dotColor} fillOpacity="0.95" />
                                                    <text x={px} y={py - 29} textAnchor="middle" fontSize="12" fontWeight="800" fill="white">{Math.round(item.value)}%</text>
                                                    <polygon points={`${px-5},${py-22} ${px+5},${py-22} ${px},${py-13}`} fill={dotColor} fillOpacity="0.95" />
                                                </g>
                                            )}
                                        </g>
                                    );
                                })}

                                {/* Pulse rings */}
                                <circle cx="260" cy="220" r="55" fill="none" stroke="rgba(96,165,250,0.08)" strokeWidth="1">
                                    <animate attributeName="r" values="52;78;52" dur="4s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.6;0;0.6" dur="4s" repeatCount="indefinite" />
                                </circle>
                                <circle cx="260" cy="220" r="55" fill="none" stroke="rgba(96,165,250,0.05)" strokeWidth="1">
                                    <animate attributeName="r" values="52;78;52" dur="4s" begin="2s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.5;0;0.5" dur="4s" begin="2s" repeatCount="indefinite" />
                                </circle>

                                {/* Center bg */}
                                <circle cx="260" cy="220" r="55" fill="#060e1c" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                                {/* Score ring track */}
                                <circle cx="260" cy="220" r="48" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
                                {/* Score ring fill */}
                                {(() => {
                                    const circumference = 2 * Math.PI * 48;
                                    const score = statsData?.averageScore || 0;
                                    const progress = Math.min(score / 5, 1);
                                    const dashFill = progress * circumference;
                                    const dashEmpty = circumference - dashFill;
                                    const ringColor = score >= 4 ? '#10b981' : score >= 3 ? '#3b82f6' : '#ff3a6e';
                                    return (
                                        <circle
                                            cx="260" cy="220" r="48"
                                            fill="none"
                                            stroke={ringColor}
                                            strokeWidth="7"
                                            strokeDasharray={`${dashFill} ${dashEmpty}`}
                                            strokeLinecap="round"
                                            transform="rotate(-90, 260, 220)"
                                            style={{filter: `drop-shadow(0 0 8px ${ringColor})`}}
                                        />
                                    );
                                })()}

                                {/* Inner circle */}
                                <circle cx="260" cy="220" r="39" fill="#060e1c" />
                                {/* Score value */}
                                <text x="256" y="217" textAnchor="end" fontSize="22" fontWeight="900" fill="white" letterSpacing="-0.5">
                                    {statsData?.averageScore ? statsData.averageScore.toFixed(1) : '3.5'}
                                </text>
                                <text x="258" y="212" textAnchor="start" fontSize="9" fontWeight="700" fill="rgba(255,255,255,0.35)">/5</text>
                                <text x="260" y="227" textAnchor="middle" fontSize="7" fontWeight="800" fill="rgba(255,255,255,0.3)" letterSpacing="2">VITALIDADE</text>

                                {/* Status badge */}
                                {(() => {
                                    const score = statsData?.averageScore || 0;
                                    const label = score >= 4 ? 'ALTA' : score >= 3 ? 'MÉDIA' : 'BAIXA';
                                    const badgeColor = score >= 4 ? '#10b981' : score >= 3 ? '#3b82f6' : '#ff3a6e';
                                    return (
                                        <>
                                            <rect x="238" y="231" width="44" height="12" rx="6" fill={badgeColor} fillOpacity="0.15" />
                                            <text x="260" y="240.5" textAnchor="middle" fontSize="7" fontWeight="900" fill={badgeColor} letterSpacing="1.5">{label}</text>
                                        </>
                                    );
                                })()}

                                {/* Axis Labels */}
                                {/* i=0: TOP — Saúde Mental */}
                                <text textAnchor="middle" fill="rgba(226,232,240,0.5)" fontWeight="700" fontSize="9" letterSpacing="0.8">
                                    <tspan x="260" y="46">SAÚDE</tspan>
                                    <tspan x="260" dy="12">MENTAL</tspan>
                                </text>
                                {(() => { const v = Math.round(radarData[0].value); const c = v < 40 ? '#ff3a6e' : v < 60 ? '#fbbf24' : '#22d3ee'; return (<><rect x="244" y="64" width="32" height="12" rx="6" fill={c} fillOpacity="0.15" /><text x="260" y="73.5" textAnchor="middle" fontSize="8" fontWeight="700" fill={c}>{v}%</text></>); })()}

                                {/* i=1: UPPER RIGHT — Equilíbrio de Carga */}
                                <text textAnchor="start" fill="rgba(226,232,240,0.5)" fontWeight="700" fontSize="9" letterSpacing="0.8">
                                    <tspan x="402" y="154">EQUILÍBRIO</tspan>
                                    <tspan x="402" dy="12">DE CARGA</tspan>
                                </text>
                                {(() => { const v = Math.round(radarData[1].value); const c = v < 40 ? '#ff3a6e' : v < 60 ? '#fbbf24' : '#22d3ee'; return (<><rect x="402" y="172" width="32" height="12" rx="6" fill={c} fillOpacity="0.15" /><text x="418" y="181.5" textAnchor="middle" fontSize="8" fontWeight="700" fill={c}>{v}%</text></>); })()}

                                {/* i=2: LOWER RIGHT — Segurança Psicológica */}
                                <text textAnchor="middle" fill="rgba(226,232,240,0.5)" fontWeight="700" fontSize="9" letterSpacing="0.8">
                                    <tspan x="352" y="370">SEGURANÇA</tspan>
                                    <tspan x="352" dy="12">PSICOLÓGICA</tspan>
                                </text>
                                {(() => { const v = Math.round(radarData[2].value); const c = v < 40 ? '#ff3a6e' : v < 60 ? '#fbbf24' : '#22d3ee'; return (<><rect x="336" y="388" width="32" height="12" rx="6" fill={c} fillOpacity="0.15" /><text x="352" y="397.5" textAnchor="middle" fontSize="8" fontWeight="700" fill={c}>{v}%</text></>); })()}

                                {/* i=3: LOWER LEFT — Clima Organizacional */}
                                <text textAnchor="middle" fill="rgba(226,232,240,0.5)" fontWeight="700" fontSize="9" letterSpacing="0.8">
                                    <tspan x="168" y="370">CLIMA</tspan>
                                    <tspan x="168" dy="12">ORGANIZACIONAL</tspan>
                                </text>
                                {(() => { const v = Math.round(radarData[3].value); const c = v < 40 ? '#ff3a6e' : v < 60 ? '#fbbf24' : '#22d3ee'; return (<><rect x="152" y="388" width="32" height="12" rx="6" fill={c} fillOpacity="0.15" /><text x="168" y="397.5" textAnchor="middle" fontSize="8" fontWeight="700" fill={c}>{v}%</text></>); })()}

                                {/* i=4: UPPER LEFT — Engajamento e Vitalidade */}
                                <text textAnchor="end" fill="rgba(226,232,240,0.5)" fontWeight="700" fontSize="9" letterSpacing="0.8">
                                    <tspan x="118" y="154">ENGAJAMENTO</tspan>
                                    <tspan x="118" dy="12">E VITALIDADE</tspan>
                                </text>
                                {(() => { const v = Math.round(radarData[4].value); const c = v < 40 ? '#ff3a6e' : v < 60 ? '#fbbf24' : '#22d3ee'; return (<><rect x="80" y="172" width="32" height="12" rx="6" fill={c} fillOpacity="0.15" /><text x="96" y="181.5" textAnchor="middle" fontSize="8" fontWeight="700" fill={c}>{v}%</text></>); })()}
                            </svg>
                        </div>

                        {/* Right Panel */}
                        <div className="w-full lg:w-[260px] flex flex-col justify-center gap-4 p-5" style={{borderLeft: '1px solid rgba(255,255,255,0.05)'}}>
                            {/* AI Insights */}
                            <div className="rounded-2xl p-4 relative overflow-hidden" style={{background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)'}}>
                                <div className="absolute top-0 left-0 right-0 h-px" style={{background: 'linear-gradient(90deg, transparent, rgba(96,165,250,0.4), transparent)'}} />
                                <p className="text-[9px] font-black tracking-[0.2em] uppercase mb-2 flex items-center gap-1.5" style={{color: 'rgba(96,165,250,0.75)'}}>
                                    <Brain className="w-3 h-3" />
                                    IA Insights
                                </p>
                                <p className="text-[12px] leading-relaxed" style={{color: 'rgba(203,213,225,0.7)', fontWeight: 500}}>
                                    {statsData && statsData.averageScore >= 3
                                        ? "Ecossistema resiliente detectado. Foco em manutenção preventiva."
                                        : "Vulnerabilidade sistêmica. Recomendado intervenção focada em segurança psicológica."}
                                </p>
                            </div>

                            {/* Metrics */}
                            <div className="space-y-2">
                                {radarData.map((item, idx) => {
                                    const isHovered = hoveredIdx === idx;
                                    const dotColor = item.value < 40 ? '#ff3a6e' : item.value < 60 ? '#fbbf24' : '#22d3ee';
                                    const barGrad = item.value < 40
                                        ? 'linear-gradient(90deg, #ff3a6e, #ff6b35)'
                                        : item.value < 60
                                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                        : 'linear-gradient(90deg, #0ea5e9, #22d3ee)';
                                    return (
                                        <div
                                            key={idx}
                                            className="rounded-xl p-3 cursor-default transition-all duration-200"
                                            style={{
                                                background: isHovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.025)',
                                                border: `1px solid ${isHovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
                                                transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                                            }}
                                            onMouseEnter={() => setHoveredIdx(idx)}
                                            onMouseLeave={() => setHoveredIdx(null)}
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <div style={{color: dotColor}}>
                                                        {React.cloneElement(item.icon as React.ReactElement<any>, { className: 'w-3.5 h-3.5' })}
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-tight" style={{color: 'rgba(203,213,225,0.45)'}}>
                                                        {item.subject}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-black" style={{color: dotColor}}>
                                                    {Math.round(item.value)}%
                                                </span>
                                            </div>
                                            <div className="w-full rounded-full overflow-hidden" style={{height: '3px', background: 'rgba(255,255,255,0.06)'}}>
                                                <div className="h-full rounded-full" style={{width: `${item.value}%`, backgroundImage: barGrad}} />
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
                            className="border-none shadow-lg bg-white border border-primary/20 group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative"
                            onClick={() => setIsCampaignModalOpen(true)}
                        >
                            <div className="absolute top-0 right-0 p-4">
                                <Lightbulb className="w-12 h-12 text-yellow-500/10 group-hover:text-yellow-500/20 transition-colors" />
                            </div>
                            <CardContent className="p-6 flex flex-col justify-between h-full relative z-10">
                                <Smile className="w-8 h-8 text-primary" />
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
                                <div className="flex items-center gap-2 text-sm font-bold text-primary mt-4">
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
                            className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all", filter === 'ALL' ? "bg-white text-primary shadow-md" : "text-gray-500 hover:text-gray-700")}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFilter('PENDING')}
                            className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all", filter === 'PENDING' ? "bg-white text-primary shadow-md" : "text-gray-500 hover:text-gray-700")}
                        >
                            Pendentes
                        </button>
                        <button
                            onClick={() => setFilter('HANDLED')}
                            className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all", filter === 'HANDLED' ? "bg-white text-primary shadow-md" : "text-gray-500 hover:text-gray-700")}
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
                                    <div key={idx} className={`flex flex-col p-6 rounded-2xl border transition-all hover:shadow-lg ${isHandled ? 'bg-white opacity-70 grayscale-[0.2]' : 'bg-white border-primary/20 shadow-md border-l-[6px] border-l-primary scale-[1.01]'}`}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative group">
                                                    {req.employeePhotoUrl ? (
                                                        <img src={req.employeePhotoUrl} alt={req.employeeName} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary/10" />
                                                    ) : (
                                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center text-primary font-bold text-lg uppercase shadow-inner">
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
                                                    className="px-4 py-2.5 text-xs font-bold bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-xl transition-all flex items-center gap-2 group shadow-sm active:scale-95"
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
                                            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:rotate-12 transition-transform">
                                                    <Brain className="w-8 h-8 text-primary" />
                                                </div>
                                                <p className="text-[10px] text-primary-700 uppercase font-black tracking-widest mb-2">Relato do Colaborador</p>
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
                    <div className="bg-gradient-to-r from-primary to-primary-700 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Calendar className="w-32 h-32" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black flex items-center gap-3 text-white">
                                <Sparkles className="w-6 h-6 text-yellow-300" />
                                Agenda de Campanhas e Workshops
                            </DialogTitle>
                            <DialogDescription className="text-white opacity-80 text-lg mt-2">
                                Fique por dentro de todas as ações de saúde mental da AxonRH.
                            </DialogDescription>
                            {isManagement && (
                                <Button
                                    className="mt-4 bg-white/20 hover:bg-white/30 text-white border-white/30"
                                    onClick={() => setIsNewCampaignModalOpen(true)}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Cadastrar Nova Campanha
                                </Button>
                            )}
                        </DialogHeader>
                    </div>
                    <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 bg-gray-50/30">
                        {statsData?.activeCampaigns && statsData.activeCampaigns.length > 0 ? (
                            statsData.activeCampaigns.map((camp) => (
                                <div key={camp.id} className="flex flex-col md:flex-row gap-4 p-5 bg-white rounded-2xl border border-primary/10 hover:shadow-md transition-all group">
                                    <div className="w-full md:w-32 h-32 md:h-24 bg-primary/5 rounded-xl flex flex-col items-center justify-center text-primary border border-primary/10 shrink-0">
                                        <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">
                                            {camp.date ? new Date(camp.date).toLocaleDateString('pt-BR', { month: 'short' }) : '---'}
                                        </span>
                                        <span className="text-3xl font-black">
                                            {camp.date ? new Date(camp.date).getDate() : '--'}
                                        </span>
                                        <span className="text-[10px] font-bold">
                                            {camp.date ? new Date(camp.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                        </span>
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="flex items-center justify-between mb-1">
                                            <h5 className="font-extrabold text-gray-900 group-hover:text-primary transition-colors">{camp.title}</h5>
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
                                    <div className="flex items-center gap-2 self-center">
                                        <button
                                            onClick={() => handleRegister(camp.id)}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                                camp.isUserRegistered
                                                    ? "bg-green-100 text-green-600 border border-green-200"
                                                    : "bg-primary text-white shadow-lg shadow-primary/10 hover:scale-105"
                                            )}
                                        >
                                            {camp.isUserRegistered ? 'Inscrito' : 'Participar'}
                                        </button>
                                        {isManagement && (
                                            <button
                                                className="p-3 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all"
                                                onClick={(e) => handleDeleteCampaign(camp.id, e)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button className="p-3 bg-gray-50 hover:bg-purple-100 text-gray-400 hover:text-purple-600 rounded-xl transition-all">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
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
                    <div className="bg-gradient-to-r from-primary-700 to-primary-900 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Brain className="w-32 h-32" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black flex items-center gap-3 text-white">
                                <Brain className="w-6 h-6 text-primary-300" />
                                Guia de Prevenção e Recursos
                            </DialogTitle>
                            <DialogDescription className="text-white opacity-80 text-lg mt-2">
                                Materiais educativos para apoiar gestores e colaboradores.
                            </DialogDescription>
                            {isManagement && (
                                <Button
                                    className="mt-4 bg-white/20 hover:bg-white/30 text-white border-white/30"
                                    onClick={() => setIsNewGuideModalOpen(true)}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Cadastrar Novo Material
                                </Button>
                            )}
                        </DialogHeader>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/30">
                        {statsData?.preventionGuides && statsData.preventionGuides.length > 0 ? (
                            statsData.preventionGuides.map((guide) => (
                                <div
                                    key={guide.id}
                                    className="p-5 bg-white rounded-2xl border border-primary/10 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
                                    onClick={() => guide.url && window.open(guide.url, '_blank')}
                                >
                                    <div>
                                        <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <ShieldCheck className="w-6 h-6" />
                                        </div>
                                        <h5 className="font-extrabold text-gray-900 mb-2 group-hover:text-primary transition-colors uppercase text-xs tracking-wide">{guide.title}</h5>
                                        <p className="text-xs text-gray-500 leading-relaxed mb-4">{guide.description}</p>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-primary-600 uppercase tracking-widest">
                                            Ver Material
                                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                        {isManagement && (
                                            <button
                                                className="p-1.5 text-red-300 hover:text-red-500 transition-colors"
                                                onClick={(e) => handleDeleteGuide(guide.id, e)}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
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

            {/* New Campaign Modal */}
            <Dialog open={isNewCampaignModalOpen} onOpenChange={setIsNewCampaignModalOpen}>
                <DialogContent className="max-w-md bg-white rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Cadastrar Novo Evento</DialogTitle>
                        <DialogDescription>Preencha os detalhes do workshop ou campanha de saúde.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Título</label>
                            <Input
                                placeholder="Ex: Workshop de Mindfulness"
                                value={newCampaign.title}
                                onChange={e => setNewCampaign({ ...newCampaign, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Descrição</label>
                            <Textarea
                                placeholder="Descreva o evento..."
                                value={newCampaign.description}
                                onChange={e => setNewCampaign({ ...newCampaign, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Data e Hora</label>
                                <Input
                                    type="datetime-local"
                                    value={newCampaign.date}
                                    onChange={e => setNewCampaign({ ...newCampaign, date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Localização</label>
                                <Input
                                    placeholder="Teams / Auditório"
                                    value={newCampaign.location}
                                    onChange={e => setNewCampaign({ ...newCampaign, location: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsNewCampaignModalOpen(false)}>Cancelar</Button>
                        <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveCampaign}>Salvar Evento</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* New Guide Modal */}
            <Dialog open={isNewGuideModalOpen} onOpenChange={setIsNewGuideModalOpen}>
                <DialogContent className="max-w-md bg-white rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Cadastrar Novo Material</DialogTitle>
                        <DialogDescription>Adicione guias, vídeos ou artigos de prevenção.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Título</label>
                            <Input
                                placeholder="Ex: Cartilha de Boas Práticas"
                                value={newGuide.title}
                                onChange={e => setNewGuide({ ...newGuide, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Descrição</label>
                            <Textarea
                                placeholder="O que é este material?"
                                value={newGuide.description}
                                onChange={e => setNewGuide({ ...newGuide, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">URL do Material</label>
                            <Input
                                placeholder="https://..."
                                value={newGuide.url}
                                onChange={e => setNewGuide({ ...newGuide, url: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsNewGuideModalOpen(false)}>Cancelar</Button>
                        <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveGuide}>Salvar Material</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
