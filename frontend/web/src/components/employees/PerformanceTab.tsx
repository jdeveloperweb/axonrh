'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    TrendingUp,
    Award,
    Calendar,
    ArrowRight,
    Loader2,
} from 'lucide-react';
import Link from 'next/link';
import {
    pdisApi,
    evaluationsApi,
    PDI,
    Evaluation
} from '@/lib/api/performance';

interface PerformanceTabProps {
    employeeId: string;
    employeeName: string;
}

export function PerformanceTab({ employeeId, employeeName }: PerformanceTabProps) {
    const [loading, setLoading] = useState(true);
    const [activePDI, setActivePDI] = useState<PDI | null>(null);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

    useEffect(() => {
        loadPerformanceData();
    }, [employeeId]);

    const loadPerformanceData = async () => {
        try {
            setLoading(true);
            const [pdisData, evaluationsData] = await Promise.all([
                pdisApi.getActive(employeeId),
                evaluationsApi.getByEmployee(employeeId)
            ]);

            // Get the first active PDI if exists
            if (Array.isArray(pdisData) && pdisData.length > 0) {
                setActivePDI(pdisData[0]);
            } else {
                setActivePDI(null);
            }

            // Set evaluations
            if (Array.isArray(evaluationsData)) {
                setEvaluations(evaluationsData);
            } else {
                setEvaluations([]);
            }

        } catch (error) {
            console.error('Failed to load performance data:', error);
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

    const lastEvaluation = evaluations.length > 0 ? evaluations[0] : null;

    return (
        <div className="space-y-6">
            <Tabs defaultValue="pdi" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="pdi">PDI</TabsTrigger>
                    <TabsTrigger value="evaluations">Avaliações</TabsTrigger>
                </TabsList>

                {/* PDI Tab Content */}
                <TabsContent value="pdi" className="space-y-4 mt-4">
                    <Card className="border-none shadow-lg bg-gradient-to-br from-primary/5 to-transparent">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                Plano de Desenvolvimento Individual
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {activePDI ? (
                                <div className="space-y-4">
                                    <div>
                                        <p className="font-bold text-lg mb-2">{activePDI.title}</p>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {activePDI.startDate ? new Date(activePDI.startDate).toLocaleDateString('pt-BR') : 'Sem data'} - {activePDI.endDate ? new Date(activePDI.endDate).toLocaleDateString('pt-BR') : 'Sem data'}
                                            </span>
                                            <Badge variant={activePDI.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                                {activePDI.status === 'ACTIVE' ? 'Ativo' : activePDI.status}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-bold">Progresso Geral</span>
                                            <span className="text-sm font-bold text-primary">{activePDI.overallProgress || 0}%</span>
                                        </div>
                                        <Progress value={activePDI.overallProgress || 0} className="h-3 progress-bar" />
                                    </div>

                                    {activePDI.description && (
                                        <div className="text-sm text-slate-600 bg-white/50 p-3 rounded-lg">
                                            <p className="font-semibold mb-1">Descrição</p>
                                            {activePDI.description}
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-3 border-t">
                                        <Link href={`/performance/pdi/${activePDI.id}`}>
                                            <Button size="sm">
                                                Ver Detalhes do PDI
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <TrendingUp className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                    <p className="text-slate-500 mb-4">Nenhum PDI ativo no momento</p>
                                    <Link href="/performance/pdi">
                                        <Button size="sm" variant="outline">
                                            Ir para Meus PDIs
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Evaluations Tab Content */}
                <TabsContent value="evaluations" className="space-y-4 mt-4">
                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="w-5 h-5 text-primary" />
                                Histórico de Avaliações
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {evaluations.length > 0 ? (
                                <div className="space-y-4">
                                    {/* Mostrar apenas a última avaliação em destaque */}
                                    <div className="p-4 border rounded-lg bg-slate-50">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <Badge variant="outline" className="mb-2">Última Avaliação</Badge>
                                                <p className="font-bold text-lg">{lastEvaluation?.cycleName || 'Avaliação de Desempenho'}</p>
                                                <p className="text-sm text-slate-500">{lastEvaluation?.evaluationType || 'Geral'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-slate-500">Pontuação Final</p>
                                                <div className="flex items-baseline gap-1 justify-end">
                                                    <span className="text-3xl font-black text-primary">{lastEvaluation?.finalScore || lastEvaluation?.performanceScore || 0}</span>
                                                    <span className="text-slate-400 font-bold">/100</span>
                                                </div>
                                            </div>
                                        </div>

                                        <Progress value={lastEvaluation?.finalScore || lastEvaluation?.performanceScore || 0} className="h-3 mb-2" />

                                        <div className="flex justify-end mt-4">
                                            <Link href={`/performance/evaluations/${lastEvaluation?.id}`}>
                                                <Button size="sm" variant="secondary">
                                                    Ver Resultado Completo
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Lista de avaliações anteriores (simplificada) */}
                                    {evaluations.length > 1 && (
                                        <div className="pt-4 border-t">
                                            <h4 className="text-sm font-bold mb-3 text-slate-500">Anteriores</h4>
                                            <div className="space-y-2">
                                                {evaluations.slice(1).map(evaluation => (
                                                    <div key={evaluation.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border">
                                                        <div className="flex items-center gap-3">
                                                            <Calendar className="w-4 h-4 text-slate-400" />
                                                            <div>
                                                                <p className="text-sm font-medium">{evaluation.cycleName}</p>
                                                                <p className="text-xs text-slate-500">{new Date(evaluation.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <span className="font-bold">{evaluation.finalScore || '-'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Award className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                    <p className="text-slate-500 mb-4">Nenhuma avaliação encontrada</p>
                                    <Link href="/performance/evaluations">
                                        <Button size="sm" variant="ghost">
                                            Verificar Ciclos
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
