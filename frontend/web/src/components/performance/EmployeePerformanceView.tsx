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
    Clock,
    Sparkles
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
import { employeesApi, Employee } from '@/lib/api/employees';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { AxonIATip } from './AxonIATip';

const profileLabels: Record<string, { title: string; letter: string; color: string; traits: string[] }> = {
    DOMINANCE: { title: 'Dominante', letter: 'D', color: '#ff5a5a', traits: ['Decisivo', 'Assertivo', 'Orientado a resultados', 'Competitivo'] },
    INFLUENCE: { title: 'Influente', letter: 'I', color: '#ffcc33', traits: ['Comunicativo', 'Persuasivo', 'Otimista', 'Entusiasta'] },
    STEADINESS: { title: 'Estavel', letter: 'S', color: '#4ade80', traits: ['Paciente', 'Confiavel', 'Leal', 'Cooperativo'] },
    CONSCIENTIOUSNESS: { title: 'Conforme', letter: 'C', color: '#60a5fa', traits: ['Analitico', 'Preciso', 'Sistematico', 'Detalhista'] },
};

export function EmployeePerformanceView() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activePDIs, setActivePDIs] = useState<PDI[]>([]);
    const [employeeId, setEmployeeId] = useState<string | null>(null);
    const [employeeName, setEmployeeName] = useState<string | null>(null);
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
                console.warn('AXON_DEBUG: Colaborador não encontrado para este usuário.');
                setLoading(false);
                return;
            }

            const empId = employee.id;
            setEmployeeId(empId);
            setEmployeeName(employee.fullName);
            console.log('AXON_DEBUG: Employee ID:', empId);
            console.log('AXON_DEBUG: Employee Name:', employee.fullName);

            const [pdis, pendingEvals, historyEvals, discAssignments, latestDiscRes, goals] = await Promise.all([
                pdisApi.getByEmployee(empId).then(res => {
                    console.log('AXON_DEBUG: PDIs fetched:', res);
                    return res;
                }).catch(err => {
                    console.error('AXON_DEBUG: Error fetching PDIs:', err);
                    return [];
                }),
                evaluationsApi.getPending(user!.id).catch(() => []),
                evaluationsApi.getByEmployee(empId).catch(() => []),
                discApi.getPendingForEmployee(empId).catch(() => []),
                discApi.getLatest(empId).catch(() => null),
                goalsApi.getByEmployee(empId).catch(() => [])
            ]);

            // Filter to show relevant PDIs (Active, Draft, Pending Approval)
            const allPDIs = Array.isArray(pdis) ? pdis : [];
            console.log('AXON_DEBUG: Setting Active PDIs:', allPDIs);
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
                                onClick={() => router.push(`/performance/disc?take=true`)}
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

                        {activePDIs.filter(p => p.status === 'ACTIVE').length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {activePDIs.filter(p => p.status === 'ACTIVE').map(pdi => (
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
                    <Card className="border-none shadow-2xl overflow-hidden bg-[#0f172a] text-white relative group">
                        {/* Efeito de brilho no fundo */}
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500"></div>

                        <CardHeader className="relative pb-2">
                            <CardTitle className="flex items-center gap-3 text-xl font-black text-white">
                                <div className="p-2.5 bg-amber-500/20 rounded-xl shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/20">
                                    <BrainCircuit className="h-6 w-6 text-amber-400" />
                                </div>
                                <span className="tracking-tight">Perfil DISC</span>
                            </CardTitle>
                            <CardDescription className="text-slate-300 font-medium ml-12 -mt-2.5">
                                Seu mapeamento comportamental pela AxonIA
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="relative space-y-6">
                            {pendingDisc.length > 0 ? (
                                <div className="flex flex-col gap-6 py-4">
                                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                        <p className="text-sm text-slate-300 leading-relaxed">
                                            Você tem uma avaliação DISC pendente. Descubra seus motivadores, medos e estilo de comunicação para evoluir em sua carreira.
                                        </p>
                                    </div>
                                    <Link href="/performance/disc?take=true">
                                        <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold shadow-lg shadow-amber-500/20 py-6 transition-all transform hover:scale-[1.02]">
                                            Começar Teste Agora
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            ) : latestDisc ? (
                                <div className="space-y-6">
                                    {/* Visualização Central Revisitada */}
                                    <div className="flex items-center justify-around py-2">
                                        <div className="relative w-36 h-36 flex items-center justify-center">
                                            {/* Rings decorativos com animação de pulso suave */}
                                            <div className="absolute inset-0 border-[3px] rounded-full opacity-30 animate-pulse" style={{ borderColor: profileLabels[latestDisc.primaryProfile]?.color || '#eab308' }}></div>
                                            <div className="absolute inset-2 border-2 rounded-full opacity-50 bg-white/5" style={{ borderColor: (profileLabels[latestDisc.primaryProfile]?.color || '#eab308') + 'aa' }}></div>

                                            {/* Semicírculo de progresso */}
                                            <div className="absolute inset-0">
                                                <svg className="w-full h-full -rotate-90">
                                                    <circle
                                                        cx="72"
                                                        cy="72"
                                                        r="68"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                        className="text-slate-800"
                                                    />
                                                    <circle
                                                        cx="72"
                                                        cy="72"
                                                        r="68"
                                                        fill="none"
                                                        stroke={profileLabels[latestDisc.primaryProfile]?.color || '#eab308'}
                                                        strokeWidth="4"
                                                        strokeDasharray={2 * Math.PI * 68}
                                                        strokeDashoffset={2 * Math.PI * 68 * (1 - (latestDisc[latestDisc.primaryProfile === 'DOMINANCE' ? 'dScore' : latestDisc.primaryProfile === 'INFLUENCE' ? 'iScore' : latestDisc.primaryProfile === 'STEADINESS' ? 'sScore' : 'cScore'] || 75) / 100)}
                                                        strokeLinecap="round"
                                                        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                                                    />
                                                </svg>
                                            </div>

                                            <div className="text-center z-10 bg-[#0f172a]/80 backdrop-blur-sm p-4 rounded-3xl border border-white/5 shadow-2xl">
                                                <span className="text-6xl font-black" style={{ color: profileLabels[latestDisc.primaryProfile]?.color || '#eab308', filter: `drop-shadow(0 0 15px ${profileLabels[latestDisc.primaryProfile]?.color || '#eab308'}60)` }}>
                                                    {profileLabels[latestDisc.primaryProfile]?.letter || 'I'}
                                                </span>
                                                <div className="mt-2">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90">
                                                        {profileLabels[latestDisc.primaryProfile]?.title || 'Influente'}
                                                    </p>
                                                    <p className="text-2xl font-black text-white mt-1">
                                                        {latestDisc[latestDisc.primaryProfile === 'DOMINANCE' ? 'dScore' : latestDisc.primaryProfile === 'INFLUENCE' ? 'iScore' : latestDisc.primaryProfile === 'STEADINESS' ? 'sScore' : 'cScore'] || 0}%
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mini Estatísticas ao lado */}
                                        <div className="hidden sm:flex flex-col gap-3">
                                            {Object.entries(profileLabels).map(([key, label]) => {
                                                const score = latestDisc[key === 'DOMINANCE' ? 'dScore' : key === 'INFLUENCE' ? 'iScore' : key === 'STEADINESS' ? 'sScore' : 'cScore'] || 0;
                                                return (
                                                    <div key={key} className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: label.color, boxShadow: `0 0 8px ${label.color}80` }}></div>
                                                        <span className="text-[11px] font-black text-white w-3">{label.letter}</span>
                                                        <span className="text-xs font-bold text-slate-200 tabular-nums">{score}%</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="bg-slate-800/60 rounded-[2rem] p-6 border border-white/5 shadow-inner">
                                        <p className="text-[10px] font-black text-amber-400/80 uppercase tracking-[0.2em] mb-4 text-center">Principais Características</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            {(profileLabels[latestDisc.primaryProfile]?.traits || []).map((trait, i) => (
                                                <div key={i} className="flex items-center gap-3 group/trait">
                                                    <div className="p-1.5 rounded-lg bg-slate-900/80 border border-white/10 group-hover/trait:border-amber-500/50 transition-all shadow-sm">
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-amber-500/70 group-hover/trait:text-amber-400 transition-all group-hover/trait:scale-110" />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-100 group-hover/trait:text-white transition-colors leading-tight">
                                                        {trait}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 pt-2">
                                        <Link href="/performance/disc/profile" className="w-full">
                                            <Button className="w-full bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white border border-white/10 transition-all py-7 font-black uppercase tracking-widest text-xs shadow-2xl rounded-2xl">
                                                Ver Relatório Completo
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Link href="/performance/disc?take=true" className="w-full text-center">
                                            <button className="text-slate-400 hover:text-amber-400 transition-all py-2 font-bold text-[10px] uppercase tracking-[0.2em]">
                                                Refazer Teste DISC
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-6 py-4">
                                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                        <p className="text-sm text-slate-300 leading-relaxed text-center">
                                            Descubra seu perfil comportamental DISC e entenda melhor como você interage com o time.
                                        </p>
                                    </div>
                                    <Link href="/performance/disc?take=true">
                                        <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold shadow-lg shadow-amber-500/20">
                                            Realizar Teste DISC
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Card de Insight da IA Revisitado */}
                    <AxonIATip latestDisc={latestDisc} />

                </div>
            </div>
        </div>
    );
}
