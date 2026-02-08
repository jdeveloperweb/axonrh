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
    TrendingUp,
    BrainCircuit,
    ClipboardCheck,
    Target,
    ArrowRight,
    AlertCircle,
    Calendar,
    Award,
    Star,
    CheckCircle2,
    Clock
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    pdisApi,
    evaluationsApi,
    discApi,
    goalsApi,
    PDI,
    Evaluation,
    DiscAssignment,
    DiscEvaluation,
    Goal
} from '@/lib/api/performance';
import { employeesApi } from '@/lib/api/employees';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

const profileLabels: Record<string, { title: string; letter: string; color: string; traits: string[] }> = {
    DOMINANCE: { title: 'Dominante', letter: 'D', color: '#ef4444', traits: ['Decisivo', 'Assertivo', 'Orientado a resultados', 'Competitivo'] },
    INFLUENCE: { title: 'Influente', letter: 'I', color: '#eab308', traits: ['Comunicativo', 'Persuasivo', 'Otimista', 'Entusiasta'] },
    STEADINESS: { title: 'Estavel', letter: 'S', color: '#22c55e', traits: ['Paciente', 'Confiavel', 'Leal', 'Cooperativo'] },
    CONSCIENTIOUSNESS: { title: 'Conforme', letter: 'C', color: '#3b82f6', traits: ['Analitico', 'Preciso', 'Sistematico', 'Detalhista'] },
};

export function EmployeePerformanceView() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activePDIs, setActivePDIs] = useState<PDI[]>([]);
    const [pendingEvaluations, setPendingEvaluations] = useState<Evaluation[]>([]);
    const [latestEvaluation, setLatestEvaluation] = useState<Evaluation | null>(null);
    const [pendingDisc, setPendingDisc] = useState<DiscAssignment[]>([]);
    const [latestDisc, setLatestDisc] = useState<DiscEvaluation | null>(null);
    const [myGoals, setMyGoals] = useState<Goal[]>([]);

    useEffect(() => {
        if (user?.id) {
            loadData();
        }
    }, [user?.id]);

    const loadData = async () => {
        try {
            setLoading(true);

            // PRIMEIRO: buscar os dados do colaborador vinculado ao usuário logado
            // Isso é necessário porque o sistema de performance utiliza o ID do Colaborador, 
            // enquanto o auth store possui apenas o ID do Usuário.
            const employee = await employeesApi.getMe().catch(() => null);

            if (!employee) {
                console.warn('Colaborador não encontrado para este usuário.');
                setLoading(false);
                return;
            }

            const employeeId = employee.id;

            const [pdis, pendingEvals, historyEvals, discAssignments, latestDiscRes, goals] = await Promise.all([
                pdisApi.getByEmployee(employeeId).catch(() => []),
                evaluationsApi.getPending(employeeId).catch(() => []),
                evaluationsApi.getByEmployee(employeeId).catch(() => []),
                discApi.getPendingForEmployee(employeeId).catch(() => []),
                discApi.getLatest(employeeId).catch(() => null),
                goalsApi.getByEmployee(employeeId).catch(() => [])
            ]);

            // Filter to show relevant PDIs (Active, Draft, Pending Approval)
            const allPDIs = Array.isArray(pdis) ? pdis : [];
            // TEMPORARY DEBUG: Showing ALL PDIs to diagnose visibility issue
            // const relevantPDIs = allPDIs.filter(p =>
            //     ['ACTIVE', 'DRAFT', 'PENDING_APPROVAL'].includes(p.status)
            // );
            setActivePDIs(allPDIs);
            setPendingEvaluations(Array.isArray(pendingEvals) ? pendingEvals : []);
            setLatestEvaluation(Array.isArray(historyEvals) && historyEvals.length > 0 ? historyEvals[0] : null);
            setPendingDisc(Array.isArray(discAssignments) ? discAssignments : []);
            setLatestDisc(latestDiscRes || null);
            setMyGoals(Array.isArray(goals) ? goals : []);
        } catch (error) {
            console.error('Error loading employee performance data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 w-64 bg-slate-200 rounded"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-32 bg-slate-100 rounded-xl"></div>
                    <div className="h-32 bg-slate-100 rounded-xl"></div>
                    <div className="h-32 bg-slate-100 rounded-xl"></div>
                </div>
                <div className="h-96 bg-slate-50 rounded-2xl"></div>
            </div>
        );
    }

    const allPDIs = Array.isArray(activePDIs) ? activePDIs : [];
    const pendingPDIs = allPDIs.filter(p => ['DRAFT', 'PENDING_APPROVAL'].includes(p.status));
    const hasPendingItems = pendingEvaluations.length > 0 || pendingDisc.length > 0 || pendingPDIs.length > 0;

    return (
        <div className="space-y-8 pb-12">
            {/* Header com Resumo de Pendências */}
            {hasPendingItems && (
                <Card className="border-none bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 shadow-sm border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 text-amber-800 dark:text-amber-200">
                            <AlertCircle className="h-5 w-5" />
                            Ações Necessárias
                        </CardTitle>
                        <CardDescription className="text-amber-700/70 dark:text-amber-300/70">
                            Você tem tarefas pendentes que precisam da sua atenção.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4 pt-4">
                        {pendingEvaluations.map((evalItem) => (
                            <Button
                                key={evalItem.id}
                                variant="outline"
                                className="bg-white/50 backdrop-blur-sm border-amber-200 hover:bg-amber-100 transition-all text-amber-900"
                                onClick={() => router.push(`/performance/evaluations/${evalItem.id}`)}
                            >
                                <ClipboardCheck className="mr-2 h-4 w-4" />
                                Responder {evalItem.evaluatorType === 'SELF' ? 'Autoavaliação' : `Avaliação de ${evalItem.employeeName}`}
                            </Button>
                        ))}
                        {pendingPDIs.map((pdi) => (
                            <Button
                                key={pdi.id}
                                variant="outline"
                                className="bg-white/50 backdrop-blur-sm border-amber-200 hover:bg-amber-100 transition-all text-amber-900"
                                onClick={() => router.push(`/performance/pdi/${pdi.id}`)}
                            >
                                <TrendingUp className="mr-2 h-4 w-4" />
                                {pdi.status === 'DRAFT' ? 'Continuar PDI (Rascunho)' : 'Revisar PDI Pendente'}
                            </Button>
                        ))}
                        {pendingDisc.map((discItem) => (
                            <Button
                                key={discItem.id}
                                variant="outline"
                                className="bg-white/50 backdrop-blur-sm border-amber-200 hover:bg-amber-100 transition-all text-amber-900"
                                onClick={() => router.push(`/performance/disc`)}
                            >
                                <BrainCircuit className="mr-2 h-4 w-4" />
                                Realizar Teste DISC
                            </Button>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Grid Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Lado Esquerdo: Resumo de Performance e Metas */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Dashboard de Progresso */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-none shadow-premium overflow-hidden bg-white dark:bg-slate-900">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                    <Award className="h-4 w-4" />
                                    Último Desempenho
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {latestEvaluation ? (
                                    <div className="space-y-4">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-primary">
                                                {latestEvaluation.finalScore || latestEvaluation.performanceScore || 0}
                                            </span>
                                            <span className="text-slate-400 font-bold">/100</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 line-clamp-1">
                                            Ciclo: {latestEvaluation.cycleName}
                                        </p>
                                        <Progress value={latestEvaluation.finalScore || latestEvaluation.performanceScore || 0} className="h-2" />
                                        <Link href={`/performance/evaluations/${latestEvaluation.id}`}>
                                            <Button variant="ghost" size="sm" className="w-full text-xs font-bold text-primary hover:text-primary hover:bg-primary/5">
                                                Ver Feedback Completo <ArrowRight className="ml-2 h-3 w-3" />
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="py-6 text-center">
                                        <Star className="h-8 w-8 mx-auto text-slate-200 mb-2" />
                                        <p className="text-sm text-slate-400">Nenhuma avaliação concluída</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-premium overflow-hidden bg-white dark:bg-slate-900">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Metas Ativas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-emerald-500">
                                            {myGoals.filter(g => g.status === 'COMPLETED').length}
                                        </span>
                                        <span className="text-slate-400 font-bold">/ {myGoals.length}</span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                        {myGoals.length > 0 ? 'Progresso médio das metas' : 'Nenhuma meta atribuída'}
                                    </p>
                                    <Progress
                                        value={myGoals.length > 0 ? (myGoals.reduce((acc, g) => acc + g.progressPercentage, 0) / myGoals.length) : 0}
                                        className="h-2 bg-slate-100"
                                    />
                                    <Link href="/performance/goals">
                                        <Button variant="ghost" size="sm" className="w-full text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                                            Ver Todas as Metas <ArrowRight className="ml-2 h-3 w-3" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Seção de PDI */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-indigo-500" />
                                Meu PDI (Plano de Desenvolvimento)
                            </h3>
                            <Link href="/performance/pdi">
                                <Button variant="outline" size="sm">Ver Histórico</Button>
                            </Link>
                        </div>

                        {activePDIs.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {activePDIs.map(pdi => (
                                    <Card key={pdi.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden border-l-4 border-l-indigo-500">
                                        <CardContent className="p-6">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                                <div>
                                                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">{pdi.title}</h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none">
                                                            {pdi.status === 'ACTIVE' ? 'Em Andamento' : pdi.status}
                                                        </Badge>
                                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            Vence em: {pdi.endDate ? new Date(pdi.endDate).toLocaleDateString() : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-indigo-600">{pdi.overallProgress}%</p>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Concluído</p>
                                                </div>
                                            </div>

                                            <Progress value={pdi.overallProgress} className="h-3 mb-6 bg-slate-100" />

                                            <div className="space-y-3">
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Próximas Ações:</p>
                                                {pdi.actions.slice(0, 3).map((action, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                                        {action.status === 'COMPLETED' ? (
                                                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                        ) : (
                                                            <Clock className="h-5 w-5 text-slate-300" />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className={cn(
                                                                "text-sm font-medium line-clamp-1",
                                                                action.status === 'COMPLETED' ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"
                                                            )}>
                                                                {action.title}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 uppercase font-black">{action.actionType}</p>
                                                        </div>
                                                        <Link href={`/performance/pdi/${pdi.id}`}>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <ArrowRight className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                ))}
                                            </div>

                                            <Link href={`/performance/pdi/${pdi.id}`}>
                                                <Button className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white">Acessar PDI Completo</Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="border-dashed border-2 bg-slate-50/50 py-12">
                                <CardContent className="flex flex-col items-center justify-center text-center">
                                    <div className="p-4 bg-indigo-50 rounded-full mb-4">
                                        <TrendingUp className="h-8 w-8 text-indigo-300" />
                                    </div>
                                    <h4 className="font-bold text-slate-700">Nenhum PDI Ativo</h4>
                                    <p className="text-sm text-slate-500 max-w-xs mt-2 mb-6">
                                        Você ainda não tem um plano de desenvolvimento individual. Converse com seu gestor para criar um!
                                    </p>
                                    <Link href="/performance/pdi">
                                        <Button variant="outline">Ver Meus PDIs</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Lado Direito: Perfil Comportamental e Insights */}
                <div className="space-y-8">

                    {/* Card DISC */}
                    <Card className="border-none shadow-premium overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BrainCircuit className="h-5 w-5 text-amber-400" />
                                Perfil DISC
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Seu perfil comportamental mapeado
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pendingDisc.length > 0 ? (
                                <div className="flex flex-col gap-8 py-4">
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        Voce tem uma avaliacao DISC pendente. Descubra seus motivadores, medos e estilo de comunicacao.
                                    </p>
                                    <Link href="/performance/disc">
                                        <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">Comecar Teste Agora</Button>
                                    </Link>
                                </div>
                            ) : latestDisc ? (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-center py-4">
                                        <div className="relative w-32 h-32 flex items-center justify-center">
                                            <div className="absolute inset-0 border-4 rounded-full" style={{ borderColor: (profileLabels[latestDisc.primaryProfile]?.color || '#eab308') + '33' }}></div>
                                            <div className="absolute inset-0 border-4 rounded-full border-t-transparent -rotate-45" style={{ borderColor: profileLabels[latestDisc.primaryProfile]?.color || '#eab308' }}></div>
                                            <div className="text-center">
                                                <span className="text-4xl font-black" style={{ color: profileLabels[latestDisc.primaryProfile]?.color || '#eab308' }}>
                                                    {profileLabels[latestDisc.primaryProfile]?.letter || 'I'}
                                                </span>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                    {profileLabels[latestDisc.primaryProfile]?.title || 'Influente'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-sm font-medium text-slate-300">Principais caracteristicas:</p>
                                        <ul className="grid grid-cols-2 gap-2">
                                            {(profileLabels[latestDisc.primaryProfile]?.traits || []).map((trait, i) => (
                                                <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: profileLabels[latestDisc.primaryProfile]?.color || '#eab308' }}></div>
                                                    {trait}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <Link href="/performance/disc/profile">
                                        <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800 text-white">Ver Detalhes do Perfil</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-8 py-4">
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        Descubra seu perfil comportamental DISC e entenda seus pontos fortes e areas de desenvolvimento.
                                    </p>
                                    <Link href="/performance/disc">
                                        <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">Realizar Teste DISC</Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Card de Mentor/Gestor */}
                    <Card className="border-none shadow-sm bg-blue-50 dark:bg-blue-900/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Dica da AxonIA
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-blue-700/80 dark:text-blue-400/80 italic leading-relaxed">
                                "Baseado no seu perfil Influente, você se sai muito bem em atividades colaborativas. Tente focar um pouco mais nos detalhes técnicos da sua meta de 'Otimização de Processos' esta semana."
                            </p>
                        </CardContent>
                    </Card>

                </div>
            </div>
            <div className="mt-8 p-4 bg-slate-100 rounded text-xs font-mono text-slate-500">
                <p><strong>DEBUG INFO (Temporário):</strong></p>
                <p>User ID: {user?.id}</p>
                <p>PDIs Encontrados: {activePDIs.length}</p>
                <ul>
                    {activePDIs.map(p => (
                        <li key={p.id}>ID: {p.id} | Status: {p.status} | Title: {p.title} | EmpID: {p.employeeId}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
