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
    Eye,
    EyeOff
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
import { useAuthStore } from '@/stores/auth-store';
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

export default function CycleDashboardPage() {
    const params = useParams();
    const id = params?.id as string;
    const { toast } = useToast();
    const { user } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [cycle, setCycle] = useState<EvaluationCycle | null>(null);
    const [stats, setStats] = useState<EvaluationStatistics | null>(null);
    const [viewAsManager, setViewAsManager] = useState(true);

    // Verifica se o usuário tem perfil de gestão
    const isManager = user?.roles?.some(role =>
        ['MANAGER', 'GESTOR', 'ADMIN', 'RH'].includes(role.toUpperCase())
    ) || false;

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
            <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-700">
                {/* Header */}
                <div className="space-y-8">
                    <Link
                        href="/performance/cycles/manage"
                        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600 transition-all duration-300 group px-4 py-2 rounded-xl hover:bg-white/80 backdrop-blur-sm"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-2 duration-300" />
                        Voltar para Gestão de Ciclos
                    </Link>

                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-4 flex-wrap">
                                <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-900 bg-clip-text text-transparent leading-tight">
                                    {cycle.name}
                                </h1>
                                <Badge
                                    variant="outline"
                                    className={`font-bold border-2 px-5 py-2 text-sm rounded-full shadow-lg backdrop-blur-sm ${cycle.status === 'ACTIVE'
                                        ? 'bg-gradient-to-r from-emerald-400/20 to-emerald-500/20 text-emerald-700 border-emerald-400/50 shadow-emerald-200/50'
                                        : cycle.status === 'COMPLETED'
                                            ? 'bg-gradient-to-r from-blue-400/20 to-blue-500/20 text-blue-700 border-blue-400/50 shadow-blue-200/50'
                                            : 'bg-gradient-to-r from-slate-400/20 to-slate-500/20 text-slate-700 border-slate-400/50 shadow-slate-200/50'
                                        }`}
                                >
                                    {cycle.status === 'ACTIVE' ? '● EM ANDAMENTO' :
                                        cycle.status === 'DRAFT' ? '○ RASCUNHO' :
                                            cycle.status === 'COMPLETED' ? '✓ CONCLUÍDO' : cycle.status}
                                </Badge>
                            </div>
                            <p className="text-base md:text-lg text-slate-600 max-w-3xl leading-relaxed font-medium">
                                {cycle.description || 'Acompanhamento detalhado do ciclo de avaliação de desempenho.'}
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 lg:min-w-[380px]">
                            {/* Botão de alternância de visualização */}
                            {isManager && (
                                <Button
                                    variant="outline"
                                    onClick={() => setViewAsManager(!viewAsManager)}
                                    className="group relative overflow-hidden border-2 bg-white/80 backdrop-blur-md hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl px-6 py-6 h-auto rounded-2xl"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="relative flex items-center justify-center gap-3">
                                        {viewAsManager ? (
                                            <>
                                                <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-lg shadow-indigo-500/30">
                                                    <Eye className="h-5 w-5 text-white" />
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modo Atual</span>
                                                    <span className="font-bold text-slate-800 text-base">Visualização de Gestor</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="p-2 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl shadow-lg shadow-slate-500/30">
                                                    <EyeOff className="h-5 w-5 text-white" />
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modo Atual</span>
                                                    <span className="font-bold text-slate-800 text-base">Visualização de Colaborador</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </Button>
                            )}

                            {/* Datas do ciclo */}
                            <div className="flex items-stretch gap-3 bg-white/80 backdrop-blur-md p-4 rounded-2xl border-2 border-slate-200/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                                <div className="flex items-center gap-3 px-4 py-3 flex-1 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50">
                                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
                                        <Calendar className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Início</span>
                                        <span className="text-base font-black text-slate-800">{formatDate(cycle.startDate)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-3 flex-1 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50">
                                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30">
                                        <Calendar className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wider">Fim</span>
                                        <span className="text-base font-black text-slate-800">{formatDate(cycle.endDate)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="group border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <CardContent className="p-8 relative">
                            <div className="flex items-start justify-between mb-6">
                                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/40 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                    <Users className="h-8 w-8" />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-extrabold text-blue-600 uppercase tracking-widest mb-2">Total</p>
                                    <h3 className="text-5xl font-black bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 bg-clip-text text-transparent">{stats?.total || 0}</h3>
                                </div>
                            </div>
                            <p className="text-sm font-bold text-slate-700">Avaliações no Ciclo</p>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                        </CardContent>
                    </Card>

                    <Card className="group border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <CardContent className="p-8 relative">
                            <div className="flex items-start justify-between mb-6">
                                <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-500/40 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                    <CheckCircle2 className="h-8 w-8" />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest mb-2">Concluídas</p>
                                    <h3 className="text-5xl font-black bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-700 bg-clip-text text-transparent">{stats?.completed || 0}</h3>
                                </div>
                            </div>
                            <p className="text-sm font-bold text-slate-700">Avaliações Finalizadas</p>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-green-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                        </CardContent>
                    </Card>

                    <Card className="group border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <CardContent className="p-8 relative">
                            <div className="flex items-start justify-between mb-6">
                                <div className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl shadow-xl shadow-amber-500/40 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                    <Clock className="h-8 w-8" />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-extrabold text-amber-600 uppercase tracking-widest mb-2">Pendentes</p>
                                    <h3 className="text-5xl font-black bg-gradient-to-br from-amber-600 via-amber-700 to-orange-700 bg-clip-text text-transparent">{stats?.pending || 0}</h3>
                                </div>
                            </div>
                            <p className="text-sm font-bold text-slate-700">Aguardando Início</p>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                        </CardContent>
                    </Card>

                    <Card className="group border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <CardContent className="p-8 relative">
                            <div className="flex items-start justify-between mb-6">
                                <div className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-500/40 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                    <Target className="h-8 w-8" />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest mb-2">Taxa</p>
                                    <h3 className="text-5xl font-black bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 bg-clip-text text-transparent">{Math.round(stats?.completionRate || 0)}%</h3>
                                </div>
                            </div>
                            <p className="text-sm font-bold text-slate-700">Taxa de Conclusão</p>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Completion Status Chart */}
                    <Card className="col-span-1 border-0 shadow-2xl bg-white/95 backdrop-blur-sm hover:shadow-3xl transition-all duration-500 overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <CardHeader className="pb-6 relative">
                            <CardTitle className="font-black flex items-center gap-3 text-xl">
                                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl shadow-lg shadow-purple-500/30">
                                    <PieChart className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="text-xl font-black text-slate-900">Status das Avaliações</div>
                                    <div className="text-xs font-semibold text-slate-500 mt-1">Distribuição atual do progresso</div>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center p-8 pt-0 relative">
                            <div className="h-[300px] w-full max-w-[340px]">
                                {stats?.total === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center">
                                        <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl mb-4 shadow-inner">
                                            <AlertCircle className="h-14 w-14 text-slate-300" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-600">Sem dados para exibir</p>
                                        <p className="text-xs text-slate-400 mt-2">Aguardando avaliações</p>
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
                                                        padding: 18,
                                                        font: { size: 13, weight: 700 }
                                                    }
                                                }
                                            },
                                            maintainAspectRatio: false,
                                            cutout: '70%'
                                        }}
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Progress Timeline */}
                    <Card className="col-span-1 lg:col-span-2 border-0 shadow-2xl bg-white/95 backdrop-blur-sm hover:shadow-3xl transition-all duration-500 overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <CardHeader className="pb-6 relative">
                            <CardTitle className="font-black flex items-center gap-3 text-xl">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/30">
                                    <TrendingUp className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="text-xl font-black text-slate-900">Progresso Global</div>
                                    <div className="text-xs font-semibold text-slate-500 mt-1">Acompanhamento da taxa de adesão e conclusão</div>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-10 p-8 pt-0 relative">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Progresso Geral</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                            {Math.round(stats?.completionRate || 0)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <Progress
                                        value={stats?.completionRate || 0}
                                        className="h-8 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 shadow-inner border-2 border-slate-200/50"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xs font-black text-slate-700 drop-shadow-sm">
                                            {stats?.completed || 0} de {stats?.total || 0} concluídas
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6 pt-8 border-t-2 border-slate-100">
                                <div className="space-y-3 p-5 rounded-2xl bg-gradient-to-br from-indigo-50 via-indigo-50/50 to-white border-2 border-indigo-100/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                    <span className="text-xs uppercase font-extrabold text-indigo-600 tracking-widest">Em Calibração</span>
                                    <div className="flex items-center gap-3">
                                        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-xl shadow-indigo-500/40" />
                                        <span className="text-3xl font-black text-indigo-700">{stats?.calibrated || 0}</span>
                                    </div>
                                </div>
                                <div className="space-y-3 p-5 rounded-2xl bg-gradient-to-br from-blue-50 via-blue-50/50 to-white border-2 border-blue-100/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                    <span className="text-xs uppercase font-extrabold text-blue-600 tracking-widest">Em Andamento</span>
                                    <div className="flex items-center gap-3">
                                        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl shadow-blue-500/40" />
                                        <span className="text-3xl font-black text-blue-700">{stats?.inProgress || 0}</span>
                                    </div>
                                </div>
                                <div className="space-y-3 p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-amber-50/50 to-white border-2 border-amber-100/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                    <span className="text-xs uppercase font-extrabold text-amber-600 tracking-widest">Não Iniciadas</span>
                                    <div className="flex items-center gap-3">
                                        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shadow-xl shadow-amber-500/40" />
                                        <span className="text-3xl font-black text-amber-700">{stats?.pending || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
