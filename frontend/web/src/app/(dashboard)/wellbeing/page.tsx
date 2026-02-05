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
    ResponsiveContainer, Tooltip
} from 'recharts';

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
    const radarData = [
        { subject: 'Bem-estar', value: ((statsData?.sentimentDistribution['POSITIVE'] || 0) / totalCheckins) * 100, fullMark: 100 },
        { subject: 'Equilíbrio', value: ((statsData?.sentimentDistribution['NEUTRAL'] || 0) / totalCheckins) * 100, fullMark: 100 },
        { subject: 'Atenção', value: ((statsData?.sentimentDistribution['NEGATIVE'] || 0) / totalCheckins) * 100, fullMark: 100 },
        { subject: 'Satisfação', value: ((statsData?.averageScore || 0) / 5) * 100, fullMark: 100 },
        // Mocking engagement relative to checkins for now or just using raw checkin count normalized? 
        // Let's keep it simple or use 100 if we don't have total employees count here easily without calling another API
        // We can assume totalCheckins is accumulating, so maybe just use average score as proxy for now or 100
        { subject: 'Engajamento', value: 75, fullMark: 100 }, // Placeholder or need another metric
    ];

    const filteredRequests = (statsData?.eapRequests || []).filter(req => {
        if (filter === 'PENDING') return !req.handled;
        if (filter === 'HANDLED') return req.handled;
        return true;
    });

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Saúde Mental e Bem-Estar</h1>
                    <p className="text-gray-500">Gestão de solicitações e monitoramento de clima organizacional</p>
                </div>
                <div className="flex gap-2">
                    {/* Actions or filters could go here */}
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-white hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Check-ins Totais</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-1">{statsData?.totalCheckins || 0}</h3>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Média de Humor</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-1">
                                    {statsData?.averageScore ? statsData.averageScore.toFixed(1) : '0.0'}
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">Escala 1-5</p>
                            </div>
                            <div className={`p-3 rounded-xl ${statsData && statsData.averageScore >= 4 ? 'bg-green-50 text-green-600' :
                                    statsData && statsData.averageScore <= 2 ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                                }`}>
                                <TrendingUp className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Alto Risco</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-1">{statsData?.highRiskCount || 0}</h3>
                                <p className="text-xs text-gray-400 mt-1">Colaboradores em alerta</p>
                            </div>
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Solicitações Pendentes</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-1">
                                    {statsData?.eapRequests.filter(r => !r.handled).length || 0}
                                </h3>
                            </div>
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Radar Chart */}
                <Card className="border-none shadow-sm lg:col-span-1 h-[500px]">
                    <CardHeader>
                        <CardTitle>Estrela de Sentimentos</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Nível"
                                    dataKey="value"
                                    stroke="#4F46E5"
                                    fill="#4F46E5"
                                    fillOpacity={0.4}
                                />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Requests List */}
                <Card className="border-none shadow-sm lg:col-span-2 h-[500px] flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle>Solicitações de Ajuda (EAP)</CardTitle>
                            <p className="text-sm text-gray-500">Histórico de pedidos de contato</p>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setFilter('ALL')}
                                className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all", filter === 'ALL' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setFilter('PENDING')}
                                className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all", filter === 'PENDING' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                            >
                                Pendentes
                            </button>
                            <button
                                onClick={() => setFilter('HANDLED')}
                                className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all", filter === 'HANDLED' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                            >
                                Atendidos
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto pr-2">
                        {filteredRequests.length > 0 ? (
                            <div className="space-y-3">
                                {filteredRequests.map((req, idx) => {
                                    const isHandled = req.handled;
                                    return (
                                        <div key={idx} className={`flex flex-col p-4 rounded-xl border transition-all ${isHandled ? 'bg-gray-50/50 border-gray-100' : 'bg-white border-purple-100 shadow-sm border-l-4 border-l-purple-500'}`}>
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        {req.employeePhotoUrl ? (
                                                            <img src={req.employeePhotoUrl} alt={req.employeeName} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold uppercase">
                                                                {req.employeeName?.substring(0, 2) || '?'}
                                                            </div>
                                                        )}
                                                        {!isHandled && (
                                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 leading-none">{req.employeeName || 'Desconhecido'}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <p className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString()} às {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                            {isHandled && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Finalizado</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                {!isHandled && (
                                                    <button
                                                        onClick={() => handleMarkAsHandled(req.id)}
                                                        className="px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1.5"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        Marcar como Atendido
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                <div className="px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Humor</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <div className="flex gap-0.5">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <div key={s} className={`w-1.5 h-2.5 rounded-sm ${s <= req.score ? (req.score <= 2 ? 'bg-red-400' : req.score >= 4 ? 'bg-green-400' : 'bg-yellow-400') : 'bg-gray-200'}`} />
                                                            ))}
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-700">{req.score}/5</span>
                                                    </div>
                                                </div>
                                                <div className="px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Análise IA</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className={`text-xs font-bold ${req.sentiment === 'POSITIVE' ? 'text-green-600' : req.sentiment === 'NEGATIVE' ? 'text-red-600' : 'text-gray-600'}`}>
                                                            {req.sentiment === 'POSITIVE' ? 'Positivo' : req.sentiment === 'NEGATIVE' ? 'Negativo' : 'Neutro'}
                                                        </span>
                                                        <span className="text-gray-300">|</span>
                                                        <span className={`text-[10px] font-bold uppercase ${req.riskLevel === 'HIGH' ? 'text-red-500' : 'text-blue-500'}`}>
                                                            {translate(req.riskLevel)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {req.notes && (
                                                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                                    <p className="text-[10px] text-blue-400 uppercase font-bold mb-1">Relato</p>
                                                    <p className="text-sm text-gray-700 italic leading-relaxed">"{req.notes}"</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Clock className="w-12 h-12 text-gray-300 mb-2" />
                                <p className="font-medium text-gray-500">Nenhum registro encontrado</p>
                                <p className="text-sm">Não há solicitações com este filtro.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
