'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
    BarChart3,
    BrainCircuit,
    TrendingUp,
    Award,
    HelpCircle,
    Loader2
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { discApi, pdisApi, DiscStatistics, PDI } from '@/lib/api/performance';
import { employeesApi } from '@/lib/api/employees';

export function PerformanceAnalytics() {
    const [loading, setLoading] = useState(true);
    const [discStats, setDiscStats] = useState<DiscStatistics | null>(null);
    const [pdiStats, setPdiStats] = useState<{ active: number; total: number; percentage: number } | null>(null);
    const [totalEmployees, setTotalEmployees] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [discStatsRes, pdisRes, employeesRes] = await Promise.all([
                discApi.getStatistics(),
                pdisApi.list(0, 500), // Buscar volume razoável para estatísticas
                employeesApi.list({ size: 1 }) // Apenas para pegar o total elements
            ]);

            setDiscStats(discStatsRes);

            // PDI Stats calculation
            const pdis = pdisRes.content;
            const activePdis = pdis.filter(p => p.status === 'ACTIVE').length;
            const totalPdis = pdis.length;

            setPdiStats({
                active: activePdis,
                total: totalPdis,
                percentage: totalEmployees > 0 ? (activePdis / totalEmployees) * 100 : 0
            });

            setTotalEmployees(employeesRes.totalElements);

        } catch (error) {
            console.error('Failed to load analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Cálculos de porcentagem
    const discPercentage = totalEmployees > 0 && discStats ? (discStats.completedEvaluations / totalEmployees) * 100 : 0;
    const pdiPercentage = totalEmployees > 0 && pdiStats ? (pdiStats.active / totalEmployees) * 100 : 0;

    return (
        <TooltipProvider>
            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Indicadores da Organização
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5 ml-2">
                                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Visão geral da adesão aos programas de desempenho na empresa (Dados Reais)</p>
                            </TooltipContent>
                        </Tooltip>
                    </CardTitle>
                    <CardDescription>
                        Acompanhe a adesão e progresso dos colaboradores
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* DISC Adhesion */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold flex items-center gap-2">
                                        <BrainCircuit className="h-4 w-4 text-red-500" />
                                        Adesão ao DISC
                                    </h4>
                                    <p className="text-xs text-muted-foreground">Colaboradores mapeados</p>
                                </div>
                                <span className="text-2xl font-black text-red-500">{Math.round(discPercentage)}%</span>
                            </div>
                            <Progress value={discPercentage} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{discStats?.completedEvaluations || 0}/{totalEmployees} Colaboradores</span>
                            </div>
                        </div>

                        {/* PDI Active */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                        PDIs Ativos
                                    </h4>
                                    <p className="text-xs text-muted-foreground">Planos em andamento</p>
                                </div>
                                <span className="text-2xl font-black text-green-500">{Math.round(pdiPercentage)}%</span>
                            </div>
                            <Progress value={pdiPercentage} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{pdiStats?.active || 0}/{totalEmployees} Colaboradores</span>
                            </div>
                        </div>

                        {/* High Potentials (Mantendo mockado por enquanto ou ocultando se não tiver endpoint de 9box) */}
                        {/* Se não temos dados reais de 9box ainda, vamos mostrar um card de 'Próximo Ciclo' ou algo real */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold flex items-center gap-2">
                                        <Award className="h-4 w-4 text-purple-500" />
                                        Avaliações Pendentes
                                    </h4>
                                    <p className="text-xs text-muted-foreground">Ciclo Atual</p>
                                </div>
                                <span className="text-2xl font-black text-purple-500">
                                    {discStats?.pendingEvaluations || 0}
                                </span>
                            </div>
                            <Progress value={discStats && discStats.totalEvaluations > 0 ? (discStats.pendingEvaluations / discStats.totalEvaluations * 100) : 0} className="h-2" />

                            <div className="text-xs text-muted-foreground pt-1">
                                Avaliações DISC pendentes de conclusão
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TooltipProvider>
    );
}
