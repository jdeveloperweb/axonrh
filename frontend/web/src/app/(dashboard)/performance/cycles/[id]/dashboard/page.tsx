'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
    BarChart3,
    PieChart,
    Users,
    CheckCircle2,
    Clock,
    Calendar,
    ArrowLeft,
    TrendingUp,
    AlertCircle,
    Target,
    UserCog,
    User
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cyclesApi, EvaluationStatistics, EvaluationCycle } from '@/lib/api/performance';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
);

type ViewMode = 'manager' | 'employee';

export default function CycleDashboardPage() {
    const params = useParams();
    const id = params?.id as string;
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [cycle, setCycle] = useState<EvaluationCycle | null>(null);
    const [stats, setStats] = useState<EvaluationStatistics | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('manager');

    const loadData = useCallback(async () => {
        if (!id) return;

        try {
            setLoading(true);
            const [cycleData, statsData] = await Promise.all([
                cyclesApi.get(id),
                cyclesApi.getStatistics(id).catch(() => null) // Fallback if stats fail
            ]);

            setCycle(cycleData);
            setStats(statsData || {
                total: 0,
                pending: 0,
                inProgress: 0,
                submitted: 0,
                calibrated: 0,
                completed: 0,
                completionRate: 0
            });

        } catch (error) {
            console.error('Failed to load cycle data:', error);
            toast({
                title: 'Erro',
                description: 'Falha ao carregar dados do ciclo',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [id, toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading) {
        return (
            <div className="p-8 max-w-7xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-8 w-64" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                </div>
                <Skeleton className="h-96 rounded-xl" />
            </div>
        );
    }

    if (!cycle) {
        return (
            <div className="p-8 max-w-7xl mx-auto text-center py-32">
                <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h1 className="text-2xl font-bold mb-2">Ciclo não encontrado</h1>
                <Link href="/performance/cycles/manage">
                    <Button variant="outline">Voltar para Ciclos</Button>
                </Link>
            </div>
        );
    }

    const completionData = {
        labels: ['Concluído', 'Em Andamento', 'Pendente', 'Calibração'],
        datasets: [
            {
                data: [
                    stats?.completed || 0,
                    (stats?.inProgress || 0) + (stats?.submitted || 0),
                    stats?.pending || 0,
                    stats?.calibrated || 0
                ],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)', // Emerald
                    'rgba(59, 130, 246, 0.8)', // Blue
                    'rgba(245, 158, 11, 0.8)', // Amber
                    'rgba(99, 102, 241, 0.8)', // Indigo
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(99, 102, 241, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
            <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <div className="space-y-6">
                    <Link
                        href="/performance/cycles/manage"
                        className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary transition-all duration-200 group"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                        Voltar para Gestão de Ciclos
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                                    {cycle.name}
                                </h1>
                                <Badge
                                    variant="outline"
                                    className={`font-bold border-2 px-4 py-1.5 text-sm ${cycle.status === 'ACTIVE'
                                        ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-300 shadow-sm shadow-emerald-200/50'
                                        : cycle.status === 'COMPLETED'
                                            ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-300 shadow-sm shadow-blue-200/50'
                                            : 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border-slate-300 shadow-sm shadow-slate-200/50'
                                        }`}
                                >
                                    {cycle.status === 'ACTIVE' ? '● EM ANDAMENTO' :
                                        cycle.status === 'DRAFT' ? '○ RASCUNHO' :
                                            cycle.status === 'COMPLETED' ? '✓ CONCLUÍDO' : cycle.status}
                                </Badge>
                            </div>
                            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
                                {cycle.description || 'Acompanhamento detalhado do ciclo de avaliação de desempenho.'}
                            </p>
                        </div>

                        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-lg shadow-slate-200/50">
                            <div className="flex items-center gap-3 px-4 py-2 border-r-2 border-slate-200">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Calendar className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Início</span>
                                    <span className="text-base font-bold text-slate-800">{formatDate(cycle.startDate)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <Calendar className="h-5 w-5 text-purple-600" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Fim</span>
                                    <span className="text-base font-bold text-slate-800">{formatDate(cycle.endDate)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center justify-center">
                        <div className="inline-flex items-center gap-2 p-1.5 bg-white rounded-2xl border-2 border-slate-200 shadow-xl shadow-slate-300/30">
                            <button
                                onClick={() => setViewMode('manager')}
                                className={`
                                    flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300
                                    ${viewMode === 'manager'
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/40 scale-105'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }
                                `}
                            >
                                <UserCog className={`h-5 w-5 transition-transform duration-300 ${viewMode === 'manager' ? 'rotate-12' : ''}`} />
                                Visão Gestor/RH
                            </button>
                            <button
                                onClick={() => setViewMode('employee')}
                                className={`
                                    flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300
                                    ${viewMode === 'employee'
                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/40 scale-105'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }
                                `}
                            >
                                <User className={`h-5 w-5 transition-transform duration-300 ${viewMode === 'employee' ? 'rotate-12' : ''}`} />
                                Visão Colaborador
                            </button>
                        </div>
                    </div>
                </div>

                {/* Manager View - Full Statistics */}
                {viewMode === 'manager' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Stats Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="border-0 shadow-lg shadow-blue-500/5 bg-gradient-to-br from-blue-50 via-white to-blue-50/50 hover:shadow-xl hover:shadow-blue-500/15 transition-all duration-500 hover:-translate-y-2 group overflow-hidden">
                                <CardContent className="p-7">
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="p-3.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/25 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                            <Users className="h-7 w-7" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1.5">Total</p>
                                            <h3 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{stats?.total || 0}</h3>
                                        </div>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-600">Avaliações no Ciclo</p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg shadow-emerald-500/5 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 hover:shadow-xl hover:shadow-emerald-500/15 transition-all duration-500 hover:-translate-y-2 group overflow-hidden">
                                <CardContent className="p-7">
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="p-3.5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/25 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                            <CheckCircle2 className="h-7 w-7" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1.5">Concluídas</p>
                                            <h3 className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">{stats?.completed || 0}</h3>
                                        </div>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-600">Avaliações Finalizadas</p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg shadow-amber-500/5 bg-gradient-to-br from-amber-50 via-white to-amber-50/50 hover:shadow-xl hover:shadow-amber-500/15 transition-all duration-500 hover:-translate-y-2 group overflow-hidden">
                                <CardContent className="p-7">
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="p-3.5 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl shadow-lg shadow-amber-500/25 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                            <Clock className="h-7 w-7" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1.5">Pendentes</p>
                                            <h3 className="text-4xl font-black bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent">{stats?.pending || 0}</h3>
                                        </div>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-600">Aguardando Início</p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg shadow-indigo-500/5 bg-gradient-to-br from-indigo-50 via-white to-indigo-50/50 hover:shadow-xl hover:shadow-indigo-500/15 transition-all duration-500 hover:-translate-y-2 group overflow-hidden">
                                <CardContent className="p-7">
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/25 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                            <Target className="h-7 w-7" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1.5">Taxa</p>
                                            <h3 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">{Math.round(stats?.completionRate || 0)}%</h3>
                                        </div>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-600">Taxa de Conclusão</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Completion Status Chart */}
                            <Card className="col-span-1 border-0 shadow-lg shadow-slate-200/40 bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-1 rounded-3xl overflow-hidden">
                                <CardHeader className="pb-4">
                                    <CardTitle className="font-bold flex items-center gap-2 text-xl">
                                        <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg">
                                            <PieChart className="h-5 w-5" />
                                        </div>
                                        Status das Avaliações
                                    </CardTitle>
                                    <CardDescription className="text-sm">Distribuição atual do progresso</CardDescription>
                                </CardHeader>
                                <CardContent className="flex items-center justify-center p-6 pt-2">
                                    <div className="h-[280px] w-full max-w-[320px]">
                                        {stats?.total === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center">
                                                <div className="p-4 bg-slate-50 rounded-full mb-3">
                                                    <AlertCircle className="h-12 w-12 text-slate-300" />
                                                </div>
                                                <p className="text-sm font-semibold text-slate-500">Sem dados para exibir</p>
                                                <p className="text-xs text-slate-400 mt-1">Aguardando avaliações</p>
                                            </div>
                                        ) : (
                                            <Doughnut
                                                data={completionData}
                                                options={{
                                                    plugins: {
                                                        legend: {
                                                            position: 'bottom',
                                                            labels: {
                                                                usePointStyle: true,
                                                                padding: 15,
                                                                font: { size: 12, weight: '600' }
                                                            }
                                                        }
                                                    },
                                                    maintainAspectRatio: false,
                                                    cutout: '65%'
                                                }}
                                            />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Progress Timeline */}
                            <Card className="col-span-1 lg:col-span-2 border-0 shadow-lg shadow-slate-200/40 bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-1 rounded-3xl overflow-hidden">
                                <CardHeader className="pb-4">
                                    <CardTitle className="font-bold flex items-center gap-2 text-xl">
                                        <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg">
                                            <TrendingUp className="h-5 w-5" />
                                        </div>
                                        Progresso Global
                                    </CardTitle>
                                    <CardDescription className="text-sm">Acompanhamento da taxa de adesão e conclusão</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-8 p-8 pt-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-700">Progresso Geral</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                                    {Math.round(stats?.completionRate || 0)}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <Progress
                                                value={stats?.completionRate || 0}
                                                className="h-6 rounded-full bg-slate-100 shadow-inner"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-xs font-bold text-slate-600">
                                                    {stats?.completed || 0} de {stats?.total || 0} concluídas
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-slate-100">
                                        <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200/50">
                                            <span className="text-xs uppercase font-bold text-indigo-600 tracking-wider">Em Calibração</span>
                                            <div className="flex items-center gap-3">
                                                <div className="h-4 w-4 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30" />
                                                <span className="text-2xl font-black text-indigo-700">{stats?.calibrated || 0}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50">
                                            <span className="text-xs uppercase font-bold text-blue-600 tracking-wider">Em Andamento</span>
                                            <div className="flex items-center gap-3">
                                                <div className="h-4 w-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30" />
                                                <span className="text-2xl font-black text-blue-700">{stats?.inProgress || 0}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50">
                                            <span className="text-xs uppercase font-bold text-amber-600 tracking-wider">Não Iniciadas</span>
                                            <div className="flex items-center gap-3">
                                                <div className="h-4 w-4 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/30" />
                                                <span className="text-2xl font-black text-amber-700">{stats?.pending || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Employee View - Simplified */}
                {viewMode === 'employee' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Simplified Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="border-0 shadow-xl shadow-emerald-500/10 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-1 group">
                                <CardContent className="p-8">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                                            <Target className="h-8 w-8" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Meu Status</p>
                                            <h3 className="text-5xl font-black bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                                                {stats?.completed || 0}
                                            </h3>
                                        </div>
                                    </div>
                                    <p className="text-base font-semibold text-slate-600">Avaliações Concluídas</p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-xl shadow-blue-500/10 bg-gradient-to-br from-blue-50 via-white to-blue-50/50 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 group">
                                <CardContent className="p-8">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                                            <Clock className="h-8 w-8" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Pendentes</p>
                                            <h3 className="text-5xl font-black bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                                                {stats?.pending || 0}
                                            </h3>
                                        </div>
                                    </div>
                                    <p className="text-base font-semibold text-slate-600">Aguardando Resposta</p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-xl shadow-purple-500/10 bg-gradient-to-br from-purple-50 via-white to-purple-50/50 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1 group">
                                <CardContent className="p-8">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                                            <TrendingUp className="h-8 w-8" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">Progresso</p>
                                            <h3 className="text-5xl font-black bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                                                {Math.round(stats?.completionRate || 0)}%
                                            </h3>
                                        </div>
                                    </div>
                                    <p className="text-base font-semibold text-slate-600">Taxa de Conclusão</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Employee Progress Card */}
                        <Card className="border-0 shadow-2xl shadow-slate-300/30 bg-white hover:shadow-2xl hover:shadow-slate-300/40 transition-all duration-300">
                            <CardHeader className="pb-4">
                                <CardTitle className="font-bold flex items-center gap-2 text-2xl">
                                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    Meu Progresso no Ciclo
                                </CardTitle>
                                <CardDescription className="text-base">Acompanhe seu desempenho e avaliações pendentes</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8 p-8 pt-4">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-base font-bold text-slate-700">Progresso Geral</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                                                {Math.round(stats?.completionRate || 0)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <Progress
                                            value={stats?.completionRate || 0}
                                            className="h-8 rounded-full bg-slate-100 shadow-inner"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-sm font-bold text-slate-600">
                                                {stats?.completed || 0} de {stats?.total || 0} concluídas
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 pt-6 border-t-2 border-slate-100">
                                    <div className="space-y-3 p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200/50">
                                        <span className="text-sm uppercase font-bold text-blue-600 tracking-wider">Em Andamento</span>
                                        <div className="flex items-center gap-3">
                                            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30" />
                                            <span className="text-3xl font-black text-blue-700">{stats?.inProgress || 0}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3 p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 border-2 border-amber-200/50">
                                        <span className="text-sm uppercase font-bold text-amber-600 tracking-wider">Não Iniciadas</span>
                                        <div className="flex items-center gap-3">
                                            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/30" />
                                            <span className="text-3xl font-black text-amber-700">{stats?.pending || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
