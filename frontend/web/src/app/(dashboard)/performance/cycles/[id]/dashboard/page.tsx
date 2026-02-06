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
    Target
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

export default function CycleDashboardPage() {
    const params = useParams();
    const id = params?.id as string;
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [cycle, setCycle] = useState<EvaluationCycle | null>(null);
    const [stats, setStats] = useState<EvaluationStatistics | null>(null);

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
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="space-y-6">
                <Link
                    href="/performance/cycles/manage"
                    className="flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors w-fit group"
                >
                    <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                    Voltar para Gestão de Ciclos
                </Link>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-black tracking-tight text-foreground">
                                {cycle.name}
                            </h1>
                            <Badge variant="outline" className={`font-bold border-2 ${cycle.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    'bg-slate-50 text-slate-700 border-slate-200'
                                }`}>
                                {cycle.status === 'ACTIVE' ? 'EM ANDAMENTO' :
                                    cycle.status === 'DRAFT' ? 'RASCUNHO' :
                                        cycle.status === 'COMPLETED' ? 'CONCLUÍDO' : cycle.status}
                            </Badge>
                        </div>
                        <p className="text-lg text-muted-foreground max-w-3xl">
                            {cycle.description || 'Acompanhamento detalhado do ciclo de avaliação de desempenho.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border-2 border-slate-100">
                        <div className="flex items-center gap-2 px-3 py-1.5 border-r border-slate-200">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Início</span>
                                <span className="text-sm font-bold text-slate-700">{formatDate(cycle.startDate)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Fim</span>
                                <span className="text-sm font-bold text-slate-700">{formatDate(cycle.endDate)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-2 shadow-sm hover:border-primary/20 transition-all">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
                            <Users className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-muted-foreground uppercase">Total Avaliações</p>
                            <h3 className="text-3xl font-black text-foreground">{stats?.total || 0}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 shadow-sm hover:border-emerald/20 transition-all">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                            <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-muted-foreground uppercase">Concluídas</p>
                            <h3 className="text-3xl font-black text-foreground">{stats?.completed || 0}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 shadow-sm hover:border-amber/20 transition-all">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
                            <Clock className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-muted-foreground uppercase">Pendentes</p>
                            <h3 className="text-3xl font-black text-foreground">{stats?.pending || 0}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 shadow-sm hover:border-indigo/20 transition-all">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
                            <Target className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-muted-foreground uppercase">Taxa Conclusão</p>
                            <h3 className="text-3xl font-black text-foreground">{Math.round(stats?.completionRate || 0)}%</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Completion Status Chart */}
                <Card className="col-span-1 border-2 shadow-lg shadow-slate-200/50">
                    <CardHeader>
                        <CardTitle className="font-bold flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-primary" />
                            Status das Avaliações
                        </CardTitle>
                        <CardDescription>Distribuição atual do progresso</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center p-6">
                        <div className="h-[250px] w-full max-w-[300px]">
                            {stats?.total === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center">
                                    <AlertCircle className="h-10 w-10 mb-2 opacity-20" />
                                    <p className="text-sm font-medium">Sem dados para exibir</p>
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
                                                    font: { size: 11, weight: 'bold' }
                                                }
                                            }
                                        },
                                        maintainAspectRatio: false
                                    }}
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Progress Timeline (Mock for now, or could use real data if available) */}
                <Card className="col-span-1 lg:col-span-2 border-2 shadow-lg shadow-slate-200/50">
                    <CardHeader>
                        <CardTitle className="font-bold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Progresso Global
                        </CardTitle>
                        <CardDescription>Acompanhamento da taxa de adesão x tempo</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 p-8">
                        <div>
                            <div className="flex justify-between mb-2 text-sm font-bold">
                                <span>Progresso Geral</span>
                                <span>{Math.round(stats?.completionRate || 0)}%</span>
                            </div>
                            <Progress value={stats?.completionRate || 0} className="h-4 rounded-full" />
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100">
                            <div className="space-y-1">
                                <span className="text-xs uppercase font-bold text-muted-foreground">Em Calibração</span>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-indigo-500" />
                                    <span className="font-bold">{stats?.calibrated || 0}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs uppercase font-bold text-muted-foreground">Em Andamento</span>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                                    <span className="font-bold">{stats?.inProgress || 0}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs uppercase font-bold text-muted-foreground">Não Iniciadas</span>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                                    <span className="font-bold">{stats?.pending || 0}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
