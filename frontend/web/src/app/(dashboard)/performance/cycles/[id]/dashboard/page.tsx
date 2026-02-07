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
import { Doughnut } from 'react-chartjs-2';


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
                    '#10b981', // Emerald 500
                    '#3b82f6', // Blue 500
                    '#f59e0b', // Amber 500
                    '#6366f1', // Indigo 500
                ],
                borderWidth: 0,
            },
        ],
    };

    return (
        <div className="min-h-screen bg-slate-50/50">
            <div className="p-8 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="space-y-6">
                    <Link
                        href="/performance/cycles/manage"
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar para Gestão de Ciclos
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                                    {cycle.name}
                                </h1>
                                <Badge
                                    variant="secondary"
                                    className={`font-semibold ${cycle.status === 'ACTIVE'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : cycle.status === 'COMPLETED'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-slate-100 text-slate-700'
                                        }`}
                                >
                                    {cycle.status === 'ACTIVE' ? 'EM ANDAMENTO' :
                                        cycle.status === 'DRAFT' ? 'RASCUNHO' :
                                            cycle.status === 'COMPLETED' ? 'CONCLUÍDO' : cycle.status}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground max-w-2xl">
                                {cycle.description || 'Acompanhamento detalhado do ciclo de avaliação de desempenho.'}
                            </p>
                        </div>

                        <div className="flex gap-4 text-sm bg-white p-4 rounded-lg border shadow-sm">
                            <div className="flex flex-col border-r pr-4">
                                <span className="text-xs uppercase font-semibold text-muted-foreground mb-1">Início</span>
                                <span className="font-medium flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    {formatDate(cycle.startDate)}
                                </span>
                            </div>
                            <div className="flex flex-col pl-2">
                                <span className="text-xs uppercase font-semibold text-muted-foreground mb-1">Fim</span>
                                <span className="font-medium flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    {formatDate(cycle.endDate)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col space-y-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold text-slate-900">
                                {viewMode === 'manager' ? 'Painel de Gestão (RH)' : 'Minha Performance'}
                            </h2>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('manager')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'manager'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                <UserCog className="h-4 w-4" />
                                Visão Gestor/RH
                            </button>
                            <button
                                onClick={() => setViewMode('employee')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'employee'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                <User className="h-4 w-4" />
                                Visão Colaborador
                            </button>
                        </div>
                    </div>

                    {viewMode === 'manager' && (
                        <div className="space-y-6 animate-in fade-in-50 duration-300">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Total de Avaliações</CardTitle>
                                        <Users className="h-4 w-4 text-blue-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats?.total || 0}</div>
                                        <p className="text-xs text-muted-foreground">Avaliações neste ciclo</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Concluídas</CardTitle>
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats?.completed || 0}</div>
                                        <p className="text-xs text-muted-foreground">
                                            {stats?.total ? Math.round(((stats.completed || 0) / stats.total) * 100) : 0}% do total
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
                                        <Clock className="h-4 w-4 text-amber-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats?.pending || 0}</div>
                                        <p className="text-xs text-muted-foreground">Aguardando início</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Conclusão</CardTitle>
                                        <Target className="h-4 w-4 text-indigo-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{Math.round(stats?.completionRate || 0)}%</div>
                                        <Progress value={stats?.completionRate || 0} className="h-2 mt-2" />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Charts Area */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <Card className="col-span-1">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                            <PieChart className="h-5 w-5 text-purple-500" />
                                            Status das Avaliações
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-[300px] flex items-center justify-center">
                                        {stats?.total === 0 ? (
                                            <div className="flex flex-col items-center justify-center text-muted-foreground text-center">
                                                <AlertCircle className="h-10 w-10 text-slate-200 mb-2" />
                                                <p className="text-sm">Sem dados para exibir</p>
                                            </div>
                                        ) : (
                                            <Doughnut
                                                data={completionData}
                                                options={{
                                                    plugins: {
                                                        legend: { position: 'bottom' }
                                                    },
                                                    maintainAspectRatio: false,
                                                    cutout: '70%'
                                                }}
                                            />
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="col-span-1 lg:col-span-2">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-blue-500" />
                                            Progresso Detalhado
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-sm font-medium">
                                                <span>Progresso Geral</span>
                                                <span className="text-blue-600">{Math.round(stats?.completionRate || 0)}%</span>
                                            </div>
                                            <Progress value={stats?.completionRate || 0} className="h-4" />
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground uppercase font-semibold">Em Calibração</span>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-2xl font-bold text-indigo-600">{stats?.calibrated || 0}</span>
                                                    <span className="text-xs text-muted-foreground">avaliações</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground uppercase font-semibold">Em Andamento</span>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-2xl font-bold text-blue-600">{stats?.inProgress || 0}</span>
                                                    <span className="text-xs text-muted-foreground">avaliações</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground uppercase font-semibold">Não Iniciadas</span>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-2xl font-bold text-amber-600">{stats?.pending || 0}</span>
                                                    <span className="text-xs text-muted-foreground">avaliações</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {viewMode === 'employee' && (
                        <div className="space-y-6 animate-in fade-in-50 duration-300">
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Minhas Avaliações</CardTitle>
                                        <Target className="h-4 w-4 text-emerald-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats?.completed || 0}</div>
                                        <p className="text-xs text-muted-foreground">Concluídas por você</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                                        <Clock className="h-4 w-4 text-amber-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats?.pending || 0}</div>
                                        <p className="text-xs text-muted-foreground">Aguardando sua ação</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Seu Progresso</CardTitle>
                                    <CardDescription>Acompanhamento das suas atividades neste ciclo</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-medium">Progresso Geral</span>
                                            <span className="font-bold">{Math.round(stats?.completionRate || 0)}%</span>
                                        </div>
                                        <Progress value={stats?.completionRate || 0} className="h-3" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
