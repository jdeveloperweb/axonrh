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
import { pdisApi, evaluationsApi, cyclesApi, PDI, PDIStatistics, Evaluation, EvaluationCycle } from '@/lib/api/performance';
import { useAuthStore } from '@/stores/auth-store';
import { employeesApi } from '@/lib/api/employees';

export function ManagerTeamView() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [teamPDIs, setTeamPDIs] = useState<PDI[]>([]);
    const [managerStats, setManagerStats] = useState<PDIStatistics | null>(null);
    const [pendingApprovals, setPendingApprovals] = useState<PDI[]>([]);
    const [pendingEvaluations, setPendingEvaluations] = useState<Evaluation[]>([]);
    const [activeCycles, setActiveCycles] = useState<EvaluationCycle[]>([]);

    useEffect(() => {
        if (user?.id) {
            loadTeamData();
        }
    }, [user?.id]);

    const loadTeamData = async () => {
        try {
            setLoading(true);

            // BUSCAR O ID DO COLABORADOR (GESTOR)
            const employee = await employeesApi.getMe().catch(() => null);
            if (!employee) {
                setLoading(false);
                return;
            }

            const managerId = employee.id;

            const [pdis, stats, pending, evals, cycles] = await Promise.all([
                pdisApi.getByTeam(managerId).catch(() => []),
                pdisApi.getManagerStatistics(managerId).catch(() => null),
                pdisApi.getPendingApproval(managerId).catch(() => []),
                evaluationsApi.getPending(managerId).catch(() => []),
                cyclesApi.getActive().catch(() => [])
            ]);

            setTeamPDIs(Array.isArray(pdis) ? pdis : []);
            setManagerStats(stats);
            setPendingApprovals(Array.isArray(pending) ? pending : []);
            setPendingEvaluations(Array.isArray(evals) ? evals : []);
            setActiveCycles(Array.isArray(cycles) ? cycles : []);
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3 text-slate-800">
                        <Users className="h-8 w-8 text-indigo-600" />
                        Minha Equipe
                    </h2>
                    <p className="text-slate-500 font-medium">Acompanhe o desenvolvimento e performance dos seus liderados</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link href="/performance/cycles/manage">
                        <Button variant="outline" className="font-bold border-2">Ciclos</Button>
                    </Link>
                    <Link href="/performance/pdi/manage">
                        <Button className="font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">Gerenciar PDIs</Button>
                    </Link>
                </div>
            </div>

            {/* Estatísticas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp className="h-12 w-12 text-indigo-600" />
                    </div>
                    <CardContent className="pt-6">
                        <div className="flex flex-col relative z-10">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Progresso Médio</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-indigo-600">{managerStats?.averageProgress || 0}%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                        <Clock className="h-12 w-12 text-amber-600" />
                    </div>
                    <CardContent className="pt-6">
                        <div className="flex flex-col relative z-10">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Aprovações Pendentes</span>
                            <span className="text-3xl font-black text-amber-600">{pendingApprovals.length}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                        <ClipboardCheck className="h-12 w-12 text-emerald-600" />
                    </div>
                    <CardContent className="pt-6">
                        <div className="flex flex-col relative z-10">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Avaliações para Fazer</span>
                            <span className="text-3xl font-black text-emerald-600">{pendingEvaluations.length}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                        <AlertTriangle className="h-12 w-12 text-rose-600" />
                    </div>
                    <CardContent className="pt-6">
                        <div className="flex flex-col relative z-10">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Ações Atrasadas</span>
                            <span className="text-3xl font-black text-rose-600">{managerStats?.overdue || 0}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Grid de Atividades da Equipe */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Avaliações Pendentes */}
                <Card className="border-0 shadow-2xl lg:col-span-1 bg-white ring-1 ring-slate-100">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-black flex items-center gap-2 text-slate-800">
                                    <ClipboardCheck className="h-6 w-6 text-emerald-500" />
                                    Avaliações
                                </CardTitle>
                                <CardDescription className="font-medium text-slate-500">Avalie seus liderados</CardDescription>
                            </div>
                            {pendingEvaluations.length > 0 && (
                                <Badge className="bg-emerald-100 text-emerald-700 border-0 font-bold px-3 py-1">
                                    {pendingEvaluations.length} pendentes
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {pendingEvaluations.length > 0 ? (
                            <div className="space-y-3">
                                {pendingEvaluations.map(evalu => (
                                    <div key={evalu.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-emerald-200 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">
                                                {evalu.employeeName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 text-sm leading-tight">{evalu.employeeName}</p>
                                                <p className="text-xs text-slate-400 font-medium">Ciclo: {evalu.cycleName || 'Geral'}</p>
                                            </div>
                                        </div>
                                        <Link href={`/performance/evaluations/${evalu.id}`}>
                                            <Button size="sm" className="font-black rounded-lg bg-emerald-600 hover:bg-emerald-700 shadow-md">Avaliar</Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                                <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                                </div>
                                <p className="text-slate-400 font-bold text-sm">Nenhuma avaliação pendente!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* PDIs Pendentes de Aprovação */}
                <Card className="border-0 shadow-2xl lg:col-span-1 bg-white ring-1 ring-slate-100">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-black flex items-center gap-2 text-slate-800">
                                    <AlertTriangle className="h-6 w-6 text-amber-500" />
                                    Aprovações
                                </CardTitle>
                                <CardDescription className="font-medium text-slate-500">PDIs para aprovação</CardDescription>
                            </div>
                            {pendingApprovals.length > 0 && (
                                <Badge className="bg-amber-100 text-amber-700 border-0 font-bold px-3 py-1">
                                    {pendingApprovals.length}
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {pendingApprovals.length > 0 ? (
                            <div className="space-y-3">
                                {pendingApprovals.map(pdi => (
                                    <div key={pdi.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-amber-200 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">
                                                {pdi.employeeName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 text-sm leading-tight">{pdi.employeeName}</p>
                                                <p className="text-xs text-slate-400 font-medium truncate max-w-[120px]">{pdi.title}</p>
                                            </div>
                                        </div>
                                        <Link href={`/performance/pdi/${pdi.id}`}>
                                            <Button variant="secondary" size="sm" className="font-black rounded-lg">Analisar</Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                                <div className="h-12 w-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle2 className="h-6 w-6 text-amber-400" />
                                </div>
                                <p className="text-slate-400 font-bold text-sm">Nada para aprovar agora.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Evolução dos PDIs da Equipe */}
                <Card className="border-0 shadow-2xl lg:col-span-1 bg-white ring-1 ring-slate-100">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-black flex items-center gap-2 text-slate-800">
                                    <TrendingUp className="h-6 w-6 text-indigo-500" />
                                    Performance
                                </CardTitle>
                                <CardDescription className="font-medium text-slate-500">Progresso dos PDIs</CardDescription>
                            </div>
                            <Link href="/performance/pdi/manage">
                                <Button variant="ghost" size="sm" className="h-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-transparent">Ver Tudo</Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {teamPDIs.length > 0 ? (
                            <div className="space-y-5">
                                {teamPDIs.slice(0, 5).map(pdi => (
                                    <div key={pdi.id} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{pdi.employeeName}</span>
                                            <span className="text-xs font-black text-indigo-600">{pdi.overallProgress}%</span>
                                        </div>
                                        <Progress value={pdi.overallProgress} className="h-2 rounded-full bg-slate-100" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                                <p className="text-slate-400 font-bold text-sm">Sem PDIs ativos na equipe.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
