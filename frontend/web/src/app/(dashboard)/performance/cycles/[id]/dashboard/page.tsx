'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
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
    User,
    BarChart3,
    CalendarDays
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
import { Doughnut } from 'react-chartjs-2';
import { Separator } from '@/components/ui/separator';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
);

export default function CycleDashboardPage() {
    const params = useParams();
    const id = params?.id as string;
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [cycle, setCycle] = useState<EvaluationCycle | null>(null);
    const [stats, setStats] = useState<EvaluationStatistics | null>(null);
    const [viewMode, setViewMode] = useState<'manager' | 'employee'>('manager');

    const loadData = useCallback(async () => {
        if (!id) return;

        try {
            setLoading(true);
            const [cycleData, statsData] = await Promise.all([
                cyclesApi.get(id),
                cyclesApi.getStatistics(id).catch(() => null)
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
            <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50/50 min-h-screen">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div>
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-96 rounded-xl col-span-1" />
                    <Skeleton className="h-96 rounded-xl col-span-2" />
                </div>
            </div>
        );
    }

    if (!cycle) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="bg-slate-100 p-6 rounded-full mb-6">
                    <AlertCircle className="h-12 w-12 text-slate-400" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Ciclo não encontrado</h1>
                <p className="text-slate-500 mb-8 max-w-md">
                    Não conseguimos localizar as informações deste ciclo. Ele pode ter sido removido ou você não tem permissão para visualizá-lo.
                </p>
                <Link href="/performance/cycles/manage">
                    <Button className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar para Ciclos
                    </Button>
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
                    '#10b981', // Emerald 500
                    '#3b82f6', // Blue 500
                    '#f59e0b', // Amber 500
                    '#6366f1', // Indigo 500
                ],
                hoverBackgroundColor: [
                    '#059669', // Emerald 600
                    '#2563eb', // Blue 600
                    '#d97706', // Amber 600
                    '#4f46e5', // Indigo 600
                ],
                borderWidth: 0,
            },
        ],
    };

    return (
        <div className="min-h-screen bg-slate-50/50">
            <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
                {/* Header Section */}
                <div className="flex flex-col space-y-6">
                    <Link
                        href="/performance/cycles/manage"
                        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors w-fit"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1.5" />
                        Voltar para Gestão
                    </Link>

                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-4 flex-wrap">
                                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                                    {cycle.name}
                                </h1>
                                <Badge
                                    className={`px-3 py-1 text-sm font-semibold rounded-full border-0 ${cycle.status === 'ACTIVE'
                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                        : cycle.status === 'COMPLETED'
                                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-100'
                                        }`}
                                >
                                    {cycle.status === 'ACTIVE' ? 'EM ANDAMENTO' :
                                        cycle.status === 'DRAFT' ? 'RASCUNHO' :
                                            cycle.status === 'COMPLETED' ? 'CONCLUÍDO' : cycle.status}
                                </Badge>
                            </div>
                            <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
                                {cycle.description || 'Acompanhamento detalhado do progresso e métricas do ciclo de avaliação de desempenho.'}
                            </p>
                        </div>

                        {/* Dates Card */}
                        <div className="flex flex-col sm:flex-row bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                            <div className="p-4 flex items-center gap-4 min-w-[200px]">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                    <CalendarDays className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Início</p>
                                    <p className="font-bold text-slate-900">{formatDate(cycle.startDate)}</p>
                                </div>
                            </div>
                            <div className="p-4 flex items-center gap-4 min-w-[200px]">
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                                    <Target className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Término</p>
                                    <p className="font-bold text-slate-900">{formatDate(cycle.endDate)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator className="bg-slate-200" />

                {/* View Mode Toggle */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${viewMode === 'manager' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {viewMode === 'manager' ? <BarChart3 className="h-5 w-5" /> : <UserCog className="h-5 w-5" />}
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            {viewMode === 'manager' ? 'Visão Geral do Ciclo' : 'Minha Performance'}
                        </h2>
                    </div>

                    <div className="bg-slate-100 p-1 rounded-xl flex items-center shadow-inner">
                        <button
                            onClick={() => setViewMode('manager')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${viewMode === 'manager'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                                }`}
                        >
                            <Users className="h-4 w-4" />
                            Visão Gestor
                        </button>
                        <button
                            onClick={() => setViewMode('employee')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${viewMode === 'employee'
                                ? 'bg-white text-emerald-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                                }`}
                        >
                            <User className="h-4 w-4" />
                            Visão Colaborador
                        </button>
                    </div>
                </div>

                {/* Manager Dashboard */}
                {viewMode === 'manager' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white group">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                                            <Users className="h-6 w-6" />
                                        </div>
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 group-hover:bg-blue-100 ml-auto">
                                            Total
                                        </Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-4xl font-black text-slate-900">{stats?.total || 0}</h3>
                                        <p className="text-sm font-medium text-slate-500">Avaliações totais</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white group">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                                            <CheckCircle2 className="h-6 w-6" />
                                        </div>
                                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 ml-auto">
                                            Concluídas
                                        </Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-4xl font-black text-slate-900">{stats?.completed || 0}</h3>
                                        <p className="text-sm font-medium text-slate-500">
                                            {stats?.total && stats.total > 0
                                                ? Math.round(((stats.completed || 0) / stats.total) * 100)
                                                : 0}% finalizadas
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white group">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                                            <Clock className="h-6 w-6" />
                                        </div>
                                        <Badge variant="secondary" className="bg-amber-50 text-amber-700 group-hover:bg-amber-100 ml-auto">
                                            Pendentes
                                        </Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-4xl font-black text-slate-900">{stats?.pending || 0}</h3>
                                        <p className="text-sm font-medium text-slate-500">Aguardando início</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white group overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500" />
                                <CardContent className="p-6 relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                                            <Target className="h-6 w-6" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <h3 className="text-4xl font-black text-slate-900">{Math.round(stats?.completionRate || 0)}%</h3>
                                            <p className="text-sm font-medium text-slate-500">Taxa de Adesão</p>
                                        </div>
                                        <Progress value={stats?.completionRate || 0} className="h-2 bg-indigo-100" indicatorClassName="bg-indigo-600" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Distribution Chart */}
                            <Card className="col-span-1 border-0 shadow-md">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold text-slate-800">Status das Avaliações</CardTitle>
                                    <CardDescription>Distribuição por fase atual</CardDescription>
                                </CardHeader>
                                <CardContent className="flex items-center justify-center p-6 h-[350px]">
                                    {stats?.total === 0 ? (
                                        <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-2xl w-full h-full">
                                            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                                <PieChart className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <h4 className="font-semibold text-slate-600">Sem dados</h4>
                                            <p className="text-sm text-slate-400 mt-1">Nenhuma avaliação iniciada ainda.</p>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full relative">
                                            <Doughnut
                                                data={completionData}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: {
                                                            position: 'bottom',
                                                            labels: {
                                                                usePointStyle: true,
                                                                pointStyle: 'circle',
                                                                padding: 20,
                                                                font: { size: 12, family: "'Inter', sans-serif" }
                                                            }
                                                        },
                                                        tooltip: {
                                                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                                            padding: 12,
                                                            cornerRadius: 8,
                                                            displayColors: true,
                                                            usePointStyle: true,
                                                        }
                                                    },
                                                    cutout: '65%'
                                                }}
                                            />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                                <span className="text-3xl font-bold text-slate-800">{stats?.total || 0}</span>
                                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total</span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Detailed Progress */}
                            <Card className="col-span-1 lg:col-span-2 border-0 shadow-md flex flex-col">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold text-slate-800">Acompanhamento de Progresso</CardTitle>
                                    <CardDescription>Visão detalhada do andamento em tempo real</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 p-6 sm:p-8 space-y-10">
                                    {/* Main Progress Bar */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-500 mb-1">Progresso Geral</p>
                                                <h3 className="text-3xl font-bold text-slate-900">{Math.round(stats?.completionRate || 0)}%</h3>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                <span>{stats?.completed || 0} / {stats?.total || 0} concluídas</span>
                                            </div>
                                        </div>
                                        <Progress value={stats?.completionRate || 0} className="h-6 rounded-full bg-slate-100" indicatorClassName="bg-gradient-to-r from-blue-500 to-indigo-600" />
                                    </div>

                                    {/* Breakdown Stats */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                                        <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-indigo-500" />
                                                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Calibração</span>
                                            </div>
                                            <p className="text-2xl font-bold text-slate-900">{stats?.calibrated || 0}</p>
                                            <p className="text-xs text-slate-500">avaliações em análise</p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Em Andamento</span>
                                            </div>
                                            <p className="text-2xl font-bold text-slate-900">{stats?.inProgress || 0}</p>
                                            <p className="text-xs text-slate-500">preenchimento iniciado</p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-amber-500" />
                                                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Não Iniciadas</span>
                                            </div>
                                            <p className="text-2xl font-bold text-slate-900">{stats?.pending || 0}</p>
                                            <p className="text-xs text-slate-500">aguardando ação</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Employee Dashboard */}
                {viewMode === 'employee' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <Card className="border-0 shadow-md">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-base font-semibold text-slate-700">Minhas Avaliações</CardTitle>
                                    <div className="p-2 bg-emerald-100 rounded-lg">
                                        <Target className="h-5 w-5 text-emerald-600" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-slate-900">{stats?.completed || 0}</div>
                                    <p className="text-sm text-slate-500 mt-1">Concluídas por você</p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-md">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-base font-semibold text-slate-700">Pendentes</CardTitle>
                                    <div className="p-2 bg-amber-100 rounded-lg">
                                        <Clock className="h-5 w-5 text-amber-600" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-slate-900">{stats?.pending || 0}</div>
                                    <p className="text-sm text-slate-500 mt-1">Aguardando sua ação</p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-md bg-gradient-to-br from-white to-blue-50/50">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-base font-semibold text-slate-700">Taxa de Conclusão</CardTitle>
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <TrendingUp className="h-5 w-5 text-blue-600" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-slate-900">{Math.round(stats?.completionRate || 0)}%</div>
                                    <Progress value={stats?.completionRate || 0} className="h-2 mt-3 bg-blue-100" indicatorClassName="bg-blue-600" />
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-0 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold text-slate-900">Suas Atividades</CardTitle>
                                <CardDescription>Lista de avaliações atribuídas a você neste ciclo</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Aqui entraria a lista de avaliações do colaborador */}
                                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                    <div className="bg-white p-3 rounded-full mb-3 shadow-sm">
                                        <UserCog className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900">Você está em dia!</h3>
                                    <p className="text-slate-500 max-w-sm mt-1">
                                        Nenhuma avaliação pendente encontrada para este ciclo no momento.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
