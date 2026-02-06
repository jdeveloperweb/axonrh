'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
    Target,
    TrendingUp,
    Award,
    BrainCircuit,
    FileText,
    Calendar,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { discApi, DiscEvaluation } from '@/lib/api/performance';

interface PerformanceTabProps {
    employeeId: string;
    employeeName: string;
}

export function PerformanceTab({ employeeId, employeeName }: PerformanceTabProps) {
    const [loading, setLoading] = useState(true);
    const [discEvaluation, setDiscEvaluation] = useState<DiscEvaluation | null>(null);

    useEffect(() => {
        loadPerformanceData();
    }, [employeeId]);

    const loadPerformanceData = async () => {
        try {
            setLoading(true);
            // Buscar avaliação DISC do colaborador
            const discData = await discApi.getLatest(employeeId);
            setDiscEvaluation(discData);
        } catch (error) {
            console.error('Failed to load performance data:', error);
            // Não mostrar erro se não houver avaliação
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

    // Dados mockados para demonstração (substituir por dados reais da API)
    const mockPerformanceData = {
        lastEvaluation: {
            score: 85,
            date: '2025-12-15',
            type: 'Avaliação 360°',
        },
        activeGoals: [
            { id: '1', title: 'Melhorar comunicação com equipe', progress: 75, deadline: '2026-03-31' },
            { id: '2', title: 'Concluir certificação técnica', progress: 60, deadline: '2026-04-30' },
            { id: '3', title: 'Liderar projeto estratégico', progress: 90, deadline: '2026-02-28' },
        ],
        activePDI: {
            title: 'Desenvolvimento em Liderança Estratégica',
            startDate: '2026-01-01',
            endDate: '2026-06-30',
            progress: 45,
            actions: 5,
            completedActions: 2,
        },
    };

    const getProfileColor = (profile: string) => {
        const colors: Record<string, string> = {
            DOMINANCE: 'bg-red-500',
            INFLUENCE: 'bg-yellow-500',
            STEADINESS: 'bg-green-500',
            CONSCIENTIOUSNESS: 'bg-blue-500',
        };
        return colors[profile] || 'bg-gray-500';
    };

    const getProfileLabel = (profile: string) => {
        const labels: Record<string, string> = {
            DOMINANCE: 'Dominante',
            INFLUENCE: 'Influente',
            STEADINESS: 'Estável',
            CONSCIENTIOUSNESS: 'Consciente',
        };
        return labels[profile] || profile;
    };

    return (
        <div className="space-y-6">
            {/* Perfil DISC Resumido */}
            <Card className="border-none shadow-lg bg-gradient-to-br from-white to-slate-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-primary" />
                        Perfil Comportamental DISC
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {discEvaluation ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Perfil Primário</p>
                                    <div className="flex items-center gap-2">
                                        <Badge className={`${getProfileColor(discEvaluation.primaryProfile)} text-white font-bold`}>
                                            {getProfileLabel(discEvaluation.primaryProfile)}
                                        </Badge>
                                        {discEvaluation.secondaryProfile && (
                                            <>
                                                <span className="text-slate-400">+</span>
                                                <Badge variant="outline" className="font-bold">
                                                    {getProfileLabel(discEvaluation.secondaryProfile)}
                                                </Badge>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <Link href="/performance/disc">
                                    <Button variant="outline" size="sm">
                                        Ver Detalhes
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                            </div>

                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { label: 'D', value: discEvaluation.dScore, color: 'bg-red-500' },
                                    { label: 'I', value: discEvaluation.iScore, color: 'bg-yellow-500' },
                                    { label: 'S', value: discEvaluation.sScore, color: 'bg-green-500' },
                                    { label: 'C', value: discEvaluation.cScore, color: 'bg-blue-500' },
                                ].map((item) => (
                                    <div key={item.label} className="text-center">
                                        <div className="text-xs font-bold text-slate-500 mb-1">{item.label}</div>
                                        <div className="relative h-24 w-full bg-slate-100 rounded-lg overflow-hidden">
                                            <div
                                                className={`absolute bottom-0 w-full ${item.color} transition-all duration-500`}
                                                style={{ height: `${item.value}%` }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-lg font-black text-slate-700">{item.value}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="text-xs text-slate-500 text-center pt-2 border-t">
                                Avaliação realizada em {new Date(discEvaluation.completedAt || discEvaluation.createdAt || Date.now()).toLocaleDateString('pt-BR')}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <BrainCircuit className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p className="text-slate-500 mb-4">Nenhuma avaliação DISC realizada</p>
                            <Link href="/performance/disc">
                                <Button size="sm">
                                    Realizar Avaliação
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Última Avaliação de Desempenho */}
            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary" />
                        Última Avaliação de Desempenho
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-slate-500">Tipo de Avaliação</p>
                            <p className="font-bold text-lg">{mockPerformanceData.lastEvaluation.type}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500">Pontuação</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-primary">{mockPerformanceData.lastEvaluation.score}</span>
                                <span className="text-slate-400 font-bold">/100</span>
                            </div>
                        </div>
                    </div>

                    <Progress value={mockPerformanceData.lastEvaluation.score} className="h-3 mb-2" />

                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(mockPerformanceData.lastEvaluation.date).toLocaleDateString('pt-BR')}
                        </span>
                        <Link href="/performance/evaluations">
                            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                                Ver Histórico
                                <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Metas Ativas */}
            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Metas Ativas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {mockPerformanceData.activeGoals.map((goal) => (
                            <div key={goal.id} className="space-y-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="font-bold text-sm">{goal.title}</p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                            <Calendar className="w-3 h-3" />
                                            Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                    <Badge variant={goal.progress >= 75 ? 'default' : goal.progress >= 50 ? 'secondary' : 'destructive'}>
                                        {goal.progress}%
                                    </Badge>
                                </div>
                                <Progress value={goal.progress} className="h-2" />
                            </div>
                        ))}

                        <Link href="/performance">
                            <Button variant="outline" size="sm" className="w-full mt-4">
                                Ver Todas as Metas
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* PDI Ativo */}
            <Card className="border-none shadow-lg bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Plano de Desenvolvimento Individual (PDI)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {mockPerformanceData.activePDI ? (
                        <div className="space-y-4">
                            <div>
                                <p className="font-bold text-lg mb-2">{mockPerformanceData.activePDI.title}</p>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(mockPerformanceData.activePDI.startDate).toLocaleDateString('pt-BR')} - {new Date(mockPerformanceData.activePDI.endDate).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold">Progresso Geral</span>
                                    <span className="text-sm font-bold text-primary">{mockPerformanceData.activePDI.progress}%</span>
                                </div>
                                <Progress value={mockPerformanceData.activePDI.progress} className="h-3" />
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t">
                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-primary">{mockPerformanceData.activePDI.completedActions}</p>
                                        <p className="text-xs text-slate-500">Concluídas</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-slate-400">{mockPerformanceData.activePDI.actions - mockPerformanceData.activePDI.completedActions}</p>
                                        <p className="text-xs text-slate-500">Pendentes</p>
                                    </div>
                                </div>
                                <Link href="/performance/pdi">
                                    <Button size="sm">
                                        Ver PDI
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p className="text-slate-500 mb-4">Nenhum PDI ativo no momento</p>
                            <Button size="sm" variant="outline">
                                Solicitar PDI
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
