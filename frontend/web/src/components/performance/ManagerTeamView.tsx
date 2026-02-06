'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Users,
    TrendingUp,
    ClipboardCheck,
    ArrowRight,
    Search,
    CheckCircle2,
    Clock,
    AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import {
    pdisApi,
    evaluationsApi,
    PDI,
    PDIStatistics,
    Evaluation
} from '@/lib/api/performance';
import { useAuthStore } from '@/stores/auth-store';

export function ManagerTeamView() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [teamPDIs, setTeamPDIs] = useState<PDI[]>([]);
    const [managerStats, setManagerStats] = useState<PDIStatistics | null>(null);
    const [pendingApprovals, setPendingApprovals] = useState<PDI[]>([]);

    useEffect(() => {
        if (user?.id) {
            loadTeamData();
        }
    }, [user?.id]);

    const loadTeamData = async () => {
        try {
            setLoading(true);
            const managerId = user!.id;

            const [pdis, stats, pending] = await Promise.all([
                pdisApi.getByTeam(managerId).catch(() => []),
                pdisApi.getManagerStatistics(managerId).catch(() => null),
                pdisApi.getPendingApproval(managerId).catch(() => [])
            ]);

            setTeamPDIs(Array.isArray(pdis) ? pdis : []);
            setManagerStats(stats);
            setPendingApprovals(Array.isArray(pending) ? pending : []);
        } catch (error) {
            console.error('Error loading team performance data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 w-64 bg-slate-200 rounded"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="h-24 bg-slate-100 rounded-xl"></div>
                    <div className="h-24 bg-slate-100 rounded-xl"></div>
                    <div className="h-24 bg-slate-100 rounded-xl"></div>
                    <div className="h-24 bg-slate-100 rounded-xl"></div>
                </div>
                <div className="h-64 bg-slate-50 rounded-2xl"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary" />
                        Gestão da Equipe
                    </h2>
                    <p className="text-muted-foreground">Acompanhe o desenvolvimento e performance dos seus liderados</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/performance/cycles/manage">
                        <Button variant="outline" size="sm">Ciclos de Avaliação</Button>
                    </Link>
                    <Link href="/performance/pdi/manage">
                        <Button size="sm">Gerenciar Todos os PDIs</Button>
                    </Link>
                </div>
            </div>

            {/* Estatísticas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                    <CardContent className="pt-6">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-400 uppercase">PDIs Ativos</span>
                            <span className="text-2xl font-black mt-1">{managerStats?.active || 0}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 text-amber-600">
                    <CardContent className="pt-6">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-400 uppercase">Aguardando Aprovação</span>
                            <span className="text-2xl font-black mt-1">{pendingApprovals.length}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                    <CardContent className="pt-6">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-400 uppercase">Progresso Médio</span>
                            <span className="text-2xl font-black mt-1 text-primary">{managerStats?.averageProgress || 0}%</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 text-rose-500">
                    <CardContent className="pt-6">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-400 uppercase">Ações Atrasadas</span>
                            <span className="text-2xl font-black mt-1">{managerStats?.overdue || 0}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Grid de Atividades da Equipe */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* PDIs Pendentes de Aprovação */}
                <Card className="border-none shadow-premium">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    Aprovações Pendentes
                                </CardTitle>
                                <CardDescription>PDIs aguardando sua revisão e aprovação</CardDescription>
                            </div>
                            <Badge variant="outline">{pendingApprovals.length}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {pendingApprovals.length > 0 ? (
                            <div className="space-y-4">
                                {pendingApprovals.map(pdi => (
                                    <div key={pdi.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {pdi.employeeName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">{pdi.employeeName}</p>
                                                <p className="text-xs text-slate-400">{pdi.title}</p>
                                            </div>
                                        </div>
                                        <Link href={`/performance/pdi/${pdi.id}`}>
                                            <Button variant="secondary" size="sm">Analisar</Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 flex flex-col items-center">
                                <CheckCircle2 className="h-10 w-10 text-emerald-200 mb-2" />
                                <p className="text-slate-400 text-sm italic">Tudo em dia por aqui!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Evolução dos PDIs da Equipe */}
                <Card className="border-none shadow-premium">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-indigo-500" />
                                    PDIs em Andamento
                                </CardTitle>
                                <CardDescription>Progresso atual do desenvolvimento do time</CardDescription>
                            </div>
                            <Link href="/performance/pdi/manage">
                                <Button variant="ghost" size="sm">Ver todos <ArrowRight className="h-4 w-4 ml-1" /></Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {teamPDIs.slice(0, 5).map(pdi => (
                                <div key={pdi.id} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-slate-700">{pdi.employeeName}</span>
                                        <span className="text-sm font-black text-primary">{pdi.overallProgress}%</span>
                                    </div>
                                    <Progress value={pdi.overallProgress} className="h-1.5" />
                                </div>
                            ))}
                            {teamPDIs.length === 0 && (
                                <div className="text-center py-12 text-slate-400 italic text-sm">
                                    Nenhum PDI ativo na equipe no momento.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
