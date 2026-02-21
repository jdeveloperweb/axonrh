'use client';

import { useState, useEffect } from 'react';
import {
    Clock,
    Calendar,
    BookOpen,
    MessageSquare,
    TrendingUp,
    CheckCircle,
    AlertCircle,
    PlayCircle,
    ArrowRight,
    FileText,
    HelpCircle,
    BrainCircuit,
    FileEdit,
    ClipboardCheck,
    Loader2,
    Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { timesheetApi, TimeRecord } from '@/lib/api/timesheet';
import { vacationApi, VacationPeriod } from '@/lib/api/vacation';
import { enrollmentsApi, Enrollment } from '@/lib/api/learning';
import { wellbeingApi, WellbeingStats } from '@/lib/api/wellbeing';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { pdisApi, PDI, discApi, DiscAssignment, DiscEvaluation, evaluationsApi, Evaluation } from '@/lib/api/performance';
import { employeesApi } from '@/lib/api/employees';
import { eventsApi, Event as AppEvent } from '@/lib/api/events';
import { AxonIATip } from '@/components/performance/AxonIATip';
import { useThemeStore } from '@/stores/theme-store';
import { useToast } from '@/hooks/use-toast';

interface CollaboratorDashboardProps {
    extraHeaderContent?: React.ReactNode;
}

export function CollaboratorDashboard({ extraHeaderContent }: CollaboratorDashboardProps) {
    const { user } = useAuthStore();
    const router = useRouter();
    const [todayRecords, setTodayRecords] = useState<TimeRecord[]>([]);
    const [vacationPeriods, setVacationPeriods] = useState<VacationPeriod[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [activePDIs, setActivePDIs] = useState<PDI[]>([]);
    const [pendingDisc, setPendingDisc] = useState<DiscAssignment[]>([]);
    const [latestDisc, setLatestDisc] = useState<DiscEvaluation | null>(null);
    const [pendingEvaluations, setPendingEvaluations] = useState<Evaluation[]>([]);
    const [wellbeingStats, setWellbeingStats] = useState<WellbeingStats | null>(null);
    const { toast } = useToast();
    const [allEvents, setAllEvents] = useState<AppEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [registeringId, setRegisteringId] = useState<string | null>(null);

    const roles = user?.roles || [];
    const isManagement = roles.includes('ADMIN') || roles.includes('RH') || roles.includes('GESTOR_RH') || roles.includes('ANALISTA_DP');

    const handleRegisterEvent = async (e: React.MouseEvent, eventId: string) => {
        e.stopPropagation();
        setRegisteringId(eventId);
        try {
            await eventsApi.register(eventId);
            toast({
                title: "Inscrição confirmada!",
                description: "Você foi inscrito no evento com sucesso.",
            });
            // Atualizar estado local
            setAllEvents(prev => prev.map(ev =>
                ev.id === eventId ? { ...ev, isUserRegistered: true, registrationCount: ev.registrationCount + 1 } : ev
            ));
        } catch (error) {
            toast({
                title: "Erro na inscrição",
                description: "Não foi possível realizar sua inscrição. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setRegisteringId(null);
        }
    };

    useEffect(() => {
        async function loadData() {
            try {
                // BUSCAR O ID DO COLABORADOR
                const employee = await employeesApi.getMe().catch(() => null);
                const employeeId = employee?.id;

                const [records, periods, allEnrollments, pdis, disc, latestDiscRes, pendingEvals, wellbeingData, eventsData] = await Promise.all([
                    timesheetApi.getTodayRecords().catch(() => [] as TimeRecord[]),
                    vacationApi.getMyPeriods().catch(() => [] as VacationPeriod[]),
                    employeeId ? enrollmentsApi.getByEmployee(employeeId).catch(() => [] as Enrollment[]) : Promise.resolve([] as Enrollment[]),
                    employeeId ? pdisApi.getByEmployee(employeeId).catch(() => [] as PDI[]) : Promise.resolve([] as PDI[]),
                    employeeId ? discApi.getPendingForEmployee(employeeId).catch(() => [] as DiscAssignment[]) : Promise.resolve([] as DiscAssignment[]),
                    employeeId ? discApi.getLatest(employeeId).catch(() => null) : Promise.resolve(null),
                    user?.id ? evaluationsApi.getPending(user.id).catch(() => [] as Evaluation[]) : Promise.resolve([] as Evaluation[]),
                    wellbeingApi.getStats().catch(() => null),
                    eventsApi.getAll().catch(() => [] as AppEvent[])
                ]);

                setTodayRecords(Array.isArray(records) ? records : []);
                setVacationPeriods(Array.isArray(periods) ? periods : []);
                setEnrollments(Array.isArray(allEnrollments) ? allEnrollments : []);
                setWellbeingStats(wellbeingData as WellbeingStats);
                setAllEvents(Array.isArray(eventsData) ? eventsData : []);

                // Filter PDIs
                const allPDIs = Array.isArray(pdis) ? pdis : [];
                const relevantPDIs = allPDIs.filter(p => ['ACTIVE', 'DRAFT', 'PENDING_APPROVAL'].includes(p.status));
                setActivePDIs(relevantPDIs);
                setPendingDisc(Array.isArray(disc) ? disc : []);
                setLatestDisc(latestDiscRes);
                setPendingEvaluations(Array.isArray(pendingEvals) ? pendingEvals : []);
            } catch (error) {
                console.error('Error loading collaborator dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [user?.id]);

    // Filter Enrollments
    const activeEnrollments = enrollments.filter(e => e.status === 'ENROLLED' || e.status === 'IN_PROGRESS');
    const completedEnrollments = enrollments.filter(e => e.status === 'COMPLETED');

    // Status de ponto do dia
    const lastRecord = todayRecords.length > 0 ? todayRecords[todayRecords.length - 1] : null;
    const isCheckedIn = lastRecord?.recordType === 'ENTRY' || lastRecord?.recordType === 'BREAK_END';

    // Férias disponíveis (soma de dias restantes de períodos abertos)
    const availableVacationDays = vacationPeriods
        .filter(p => p.status === 'OPEN' || p.status === 'PARTIALLY_USED')
        .reduce((acc, p) => acc + (p.remainingDays || 0), 0);

    if (loading) {
        return (
            <div className="flex flex-col gap-6 animate-pulse p-6">
                <div className="h-12 w-1/3 bg-gray-200 rounded-lg"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-32 bg-gray-200 rounded-xl"></div>
                    <div className="h-32 bg-gray-200 rounded-xl"></div>
                    <div className="h-32 bg-gray-200 rounded-xl"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 h-96 bg-gray-200 rounded-xl"></div>
                    <div className="h-96 bg-gray-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 p-1">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                        Olá, {user?.name?.split(' ')[0] || 'Colaborador'}!
                    </h1>
                    <p className="text-sm sm:text-base text-gray-500 mt-1">
                        Aqui está o que está acontecendo com você hoje.
                    </p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-3">
                    {extraHeaderContent}
                    <div className="grid grid-cols-2 md:grid-cols-3 items-center gap-3 w-full md:w-auto">
                        {useThemeStore.getState().tenantTheme?.modules?.moduleAiAssistant !== false && (
                            <Button
                                variant="outline"
                                className="border-gray-200 hover:bg-white hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all text-xs sm:text-sm"
                                onClick={() => router.push('/assistant')}
                            >
                                <MessageSquare className="w-4 h-4 mr-0 sm:mr-2 text-[var(--color-primary)]" />
                                <span className="hidden sm:inline">Falar com AxonIA</span>
                                <span className="sm:hidden">AxonIA</span>
                            </Button>
                        )}

                        {useThemeStore.getState().tenantTheme?.modules?.moduleTimesheet !== false && (
                            <Button
                                variant="outline"
                                className="border-gray-200 hover:bg-white text-gray-700 transition-all text-xs sm:text-sm"
                                onClick={() => router.push(`/timesheet/adjustments${isManagement ? '' : '?new=true'}`)}
                            >
                                <FileEdit className={`w-4 h-4 mr-0 sm:mr-2 ${isManagement ? 'text-indigo-500' : 'text-orange-500'}`} />
                                <span className="hidden sm:inline">{isManagement ? 'Ajustar Ponto' : 'Solicitar Correção'}</span>
                                <span className="sm:hidden">Ajustar</span>
                            </Button>
                        )}

                        {useThemeStore.getState().tenantTheme?.modules?.moduleTimesheet !== false && (
                            <Button
                                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 shadow-sm shadow-[var(--color-primary)]/20 text-white text-xs sm:text-sm col-span-2 md:col-span-1"
                                onClick={() => router.push('/timesheet/record')}
                            >
                                <Clock className="w-4 h-4 mr-0 sm:mr-2" />
                                <span className="hidden sm:inline">Registrar Ponto</span>
                                <span className="sm:hidden">Bater Ponto</span>
                            </Button>
                        )}
                    </div>
                </div>

            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Ponto Status */}
                {useThemeStore.getState().tenantTheme?.modules?.moduleTimesheet !== false && (
                    <Card className="border-none shadow-sm bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] overflow-hidden relative group">
                        <div className="absolute top-[-10px] right-[-10px] p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Clock className="w-24 h-24" />
                        </div>
                        <CardContent className="p-6">
                            <p className="text-sm font-semibold text-blue-600 mb-1 uppercase tracking-wider">Status de Hoje</p>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                {isCheckedIn ? 'Trabalhando' : 'Não iniciado'}
                            </h3>
                            {lastRecord && (
                                <p className="text-sm text-gray-600 mb-6 font-medium">
                                    Último registro: <span className="text-gray-900 font-bold">{lastRecord.recordTime}</span> ({lastRecord.recordTypeLabel})
                                </p>
                            )}
                            {!lastRecord && (
                                <p className="text-sm text-gray-600 mb-6 font-medium">Nenhum registro hoje ainda.</p>
                            )}
                            <button
                                className="p-0 text-blue-600 h-auto font-bold flex items-center group/btn hover:underline"
                                onClick={() => router.push('/timesheet/record')}
                            >
                                Ver folha de ponto <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </CardContent>
                    </Card>
                )}

                {/* Férias Status */}
                {useThemeStore.getState().tenantTheme?.modules?.moduleVacation !== false && (
                    <Card className="border-none shadow-sm bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] overflow-hidden relative group">
                        <div className="absolute top-[-10px] right-[-10px] p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Calendar className="w-24 h-24" />
                        </div>
                        <CardContent className="p-6">
                            <p className="text-sm font-semibold text-amber-600 mb-1 uppercase tracking-wider">Férias Disponíveis</p>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                {availableVacationDays} Dias
                            </h3>
                            <p className="text-sm text-gray-600 mb-6 font-medium">
                                {vacationPeriods.length > 0 ? 'Período aquisitivo ativo' : 'Aguardando concessão'}
                            </p>
                            <button
                                className="p-0 text-amber-600 h-auto font-bold flex items-center group/btn hover:underline"
                                onClick={() => router.push('/vacation')}
                            >
                                Solicitar férias <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </CardContent>
                    </Card>
                )}

                {/* Performance Status */}
                {useThemeStore.getState().tenantTheme?.modules?.modulePerformance !== false && (
                    <Card className="border-none shadow-sm bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] overflow-hidden relative group">
                        <div className="absolute top-[-10px] right-[-10px] p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ClipboardCheck className="w-24 h-24" />
                        </div>
                        <CardContent className="p-6">
                            <p className="text-sm font-semibold text-violet-600 mb-1 uppercase tracking-wider">Desempenho</p>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                {pendingEvaluations.length} {pendingEvaluations.length === 1 ? 'Avaliação' : 'Avaliações'}
                            </h3>
                            <p className="text-sm text-gray-600 mb-6 font-medium">
                                {pendingEvaluations.length > 0 ? 'Existem avaliações pendentes' : 'Nenhuma avaliação pendente'}
                            </p>
                            <button
                                className="p-0 text-violet-600 h-auto font-bold flex items-center group/btn hover:underline"
                                onClick={() => router.push('/performance')}
                            >
                                Ver desempenho <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </CardContent>
                    </Card>
                )}

                {/* Treinamentos Status */}
                {useThemeStore.getState().tenantTheme?.modules?.moduleLearning !== false && (
                    <Card className="border-none shadow-sm bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] overflow-hidden relative group">
                        <div className="absolute top-[-10px] right-[-10px] p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <BookOpen className="w-24 h-24" />
                        </div>
                        <CardContent className="p-6">
                            <p className="text-sm font-semibold text-emerald-600 mb-1 uppercase tracking-wider">Seu Aprendizado</p>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                {activeEnrollments.length} Em andamento
                            </h3>
                            <p className="text-sm text-gray-600 mb-6 font-medium">
                                {completedEnrollments.length} concluídos recentemente
                            </p>
                            <button
                                className="p-0 text-emerald-600 h-auto font-bold flex items-center group/btn hover:underline"
                                onClick={() => router.push('/learning')}
                            >
                                Continuar aprendendo <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </CardContent>
                    </Card>
                )}
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Próximas Atividades / Cursos */}
                <div className="lg:col-span-2 space-y-6">
                    {useThemeStore.getState().tenantTheme?.modules?.moduleLearning !== false && (
                        <>
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-[var(--color-primary)]" />
                                    Treinamentos em Destaque
                                </h2>
                                <Button variant="ghost" size="sm" className="text-[var(--color-primary)] font-bold hover:bg-transparent" onClick={() => router.push('/learning')}>
                                    Ver todos
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeEnrollments.slice(0, 4).map(enrollment => (
                                    <Card
                                        key={enrollment.id}
                                        className="border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-white"
                                        onClick={() => router.push(`/learning/course/${enrollment.courseId}`)}
                                    >
                                        <CardContent className="p-5 flex flex-col h-full">
                                            <div className="flex items-start gap-4 mb-5">
                                                <div className="w-14 h-14 rounded-xl bg-gray-50 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100">
                                                    {enrollment.courseThumbnail ? (
                                                        <img src={enrollment.courseThumbnail} alt={enrollment.courseName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <BookOpen className="w-7 h-7 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors leading-tight line-clamp-2">
                                                        {enrollment.courseName}
                                                    </h4>
                                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        Vence em {enrollment.dueDate ? new Date(enrollment.dueDate).toLocaleDateString() : 'Sem prazo'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-auto space-y-2">
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <span className="text-gray-500 font-medium">Progresso</span>
                                                    <span className="font-bold text-gray-900">{Math.round(enrollment.progressPercentage)}%</span>
                                                </div>
                                                <Progress value={enrollment.progressPercentage} className="h-2 bg-gray-100" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                {activeEnrollments.length === 0 && (
                                    <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                            <PlayCircle className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p className="font-medium text-gray-500">Nenhum treinamento em andamento</p>
                                        <p className="text-sm mt-1">Descubra novos cursos no catálogo do Axon Learning.</p>
                                        <Button variant="outline" size="sm" className="mt-6 border-gray-200" onClick={() => router.push('/learning')}>
                                            Explorar catálogo
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {useThemeStore.getState().tenantTheme?.modules?.modulePerformance !== false && (pendingDisc.length > 0 || activePDIs.length > 0 || pendingEvaluations.length > 0) && (
                        <div className="mt-10 space-y-4">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-blue-500" />
                                Notificações do RH
                            </h2>
                            <div className="space-y-4">
                                {pendingEvaluations.map((evaluation) => (
                                    <div key={evaluation.id} className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm border-l-4 border-l-blue-500 border-blue-100 hover:border-blue-200 transition-all cursor-pointer" onClick={() => router.push(`/performance/evaluations/${evaluation.id}`)}>
                                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                            <ClipboardCheck className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h5 className="font-bold text-blue-900 uppercase text-xs tracking-wider">Avaliação de Desempenho</h5>
                                                <span className="text-[10px] text-blue-400 font-medium bg-blue-50 px-2 py-0.5 rounded-full">Pendente</span>
                                            </div>
                                            <h4 className="font-bold text-gray-900 mb-1">
                                                {evaluation.evaluatorType === 'SELF' ? 'Sua Autoavaliação' : `Avaliação de ${evaluation.employeeName}`}
                                            </h4>
                                            <p className="text-sm text-gray-500 leading-relaxed">
                                                Um novo ciclo de avaliação iniciou. Clique para preencher os formulários de desempenho.
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {pendingDisc.map((disc) => (
                                    <div key={disc.id} className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm border-l-4 border-l-orange-500 border-orange-100 hover:border-orange-200 transition-all cursor-pointer" onClick={() => router.push(`/performance/disc?take=true`)}>
                                        <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
                                            <BrainCircuit className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h5 className="font-bold text-orange-900 uppercase text-xs tracking-wider">Mapeamento Comportamental</h5>
                                                <span className="text-[10px] text-orange-400 font-medium bg-orange-50 px-2 py-0.5 rounded-full">Pendente</span>
                                            </div>
                                            <h4 className="font-bold text-gray-900 mb-1">Realizar Teste DISC</h4>
                                            <p className="text-sm text-gray-500 leading-relaxed">
                                                Um novo teste DISC foi solicitado para você. Clique para iniciar o seu mapeamento de perfil comportamental.
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {activePDIs.map((pdi) => (
                                    <div key={pdi.id} className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm border-l-4 border-l-indigo-500 border-indigo-100 hover:border-indigo-200 transition-all cursor-pointer" onClick={() => router.push(`/performance/pdi/${pdi.id}`)}>
                                        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h5 className="font-bold text-indigo-900 uppercase text-xs tracking-wider">
                                                    {pdi.status === 'DRAFT' ? 'PDI em Rascunho' :
                                                        pdi.status === 'PENDING_APPROVAL' ? 'PDI Pendente' :
                                                            'Novo PDI Disponível'}
                                                </h5>
                                                <span className="text-[10px] text-indigo-400 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
                                                    {pdi.status === 'ACTIVE' ? 'Ativo' :
                                                        pdi.status === 'DRAFT' ? 'Rascunho' :
                                                            pdi.status === 'PENDING_APPROVAL' ? 'Aguardando' : pdi.status}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-gray-900 mb-1">{pdi.title}</h4>
                                            <p className="text-sm text-gray-500 leading-relaxed">
                                                {pdi.status === 'DRAFT' ? 'Continue editando seu plano de desenvolvimento.' :
                                                    pdi.status === 'PENDING_APPROVAL' ? 'Seu PDI está aguardando aprovação.' :
                                                        'Um novo plano de desenvolvimento foi criado para você. Clique para ver seus objetivos e ações.'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {allEvents.length > 0 && (
                        <div className="mt-10 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-purple-500" />
                                    Eventos e Palestras
                                </h2>
                                <Button variant="ghost" size="sm" className="text-purple-600 font-bold hover:bg-transparent" onClick={() => router.push('/events')}>
                                    Ver todos
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {allEvents.filter(e => e.status === 'UPCOMING').slice(0, 4).map((event) => (
                                    <Card
                                        key={event.id}
                                        className={cn(
                                            "border shadow-sm hover:shadow-lg transition-all group bg-white border-l-4 overflow-hidden",
                                            event.isUserRegistered ? "border-l-green-500" : "border-l-primary"
                                        )}
                                    >
                                        <CardContent className="p-0">
                                            <div className="p-5 flex items-start gap-4">
                                                <div className={cn(
                                                    "w-12 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border",
                                                    event.isUserRegistered ? "bg-green-50 text-green-600 border-green-100" : "bg-gray-50 text-gray-500 border-gray-100"
                                                )}>
                                                    <span className="text-[9px] font-black uppercase">{new Date(event.date).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                                                    <span className="text-xl font-black">{new Date(event.date).getDate()}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <h4 className="font-bold text-gray-900 truncate text-sm">{event.title}</h4>
                                                        {event.isUserRegistered && (
                                                            <Badge className="bg-green-500 text-white border-none text-[8px] font-black px-1.5 py-0">INSCRITO</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-gray-400 flex items-center gap-1 font-medium">
                                                        <Clock className="w-3 h-3 text-primary/60" />
                                                        {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {event.location}
                                                    </p>

                                                    <div className="mt-4 flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                            <Users className="w-3 h-3" />
                                                            {event.registrationCount} Participantes
                                                        </div>

                                                        {!event.isUserRegistered ? (
                                                            <Button
                                                                size="sm"
                                                                className="h-8 text-[10px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 rounded-lg px-4"
                                                                onClick={(e) => handleRegisterEvent(e, event.id)}
                                                                disabled={registeringId === event.id}
                                                            >
                                                                {registeringId === event.id ? (
                                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                                ) : (
                                                                    "Inscrever-se"
                                                                )}
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 text-[10px] font-black uppercase tracking-widest border-gray-200 text-gray-400 hover:bg-gray-50 rounded-lg px-4"
                                                                onClick={() => router.push('/events')}
                                                            >
                                                                Ver Evento
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar info */}
                <div className="space-y-6">
                    {useThemeStore.getState().tenantTheme?.modules?.moduleTimesheet !== false && (
                        <Card className="border-none shadow-sm bg-white overflow-hidden">
                            <CardHeader className="bg-gray-50/50 border-b border-gray-50 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-gray-400" />
                                    Registros de Hoje
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-5">
                                    {todayRecords.length > 0 ? (
                                        todayRecords.map((record, idx) => (
                                            <div key={idx} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${record.recordType === 'ENTRY' ? 'bg-emerald-500' :
                                                        record.recordType === 'EXIT' ? 'bg-rose-500' :
                                                            'bg-amber-500'
                                                        }`} />
                                                    <span className="text-sm font-semibold text-gray-700">{record.recordTypeLabel}</span>
                                                </div>
                                                <span className="text-sm font-black text-gray-900 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                                    {record.recordTime}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-12 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
                                            <Clock className="w-10 h-10 opacity-10 mb-2" />
                                            <p className="font-medium">Nenhum registro hoje.</p>
                                            <p className="text-xs">Não esqueça de registrar seu ponto!</p>
                                        </div>
                                    )}
                                    <Button className="w-full mt-4 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 shadow-sm font-bold" variant="outline" onClick={() => router.push('/timesheet/record')}>
                                        Ver histórico completo
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {useThemeStore.getState().tenantTheme?.modules?.moduleAiAssistant !== false && (
                        <>
                            <AxonIATip latestDisc={latestDisc} />

                            <Card className="border-none shadow-[0_20px_50px_rgba(37,99,235,0.15)] bg-[var(--color-primary)] text-white overflow-hidden relative border border-white/10">
                                <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
                                    <MessageSquare className="w-32 h-32" />
                                </div>
                                <CardContent className="p-8 relative z-10">
                                    <div className="flex flex-col items-center text-center space-y-6">
                                        <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-sm border border-white/20">
                                            <MessageSquare className="w-10 h-10 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-2xl leading-tight tracking-tight">Dúvidas sobre o RH?</h3>
                                            <p className="text-white/80 text-sm mt-3 leading-relaxed">
                                                Nossa assistente AxonIA utiliza IA para responder suas dúvidas sobre férias, holerites, benefícios e processos internos.
                                            </p>
                                        </div>
                                        <Button className="w-full bg-white text-[var(--color-primary)] hover:bg-white/90 shadow-xl font-bold py-6 rounded-2xl transition-all hover:scale-[1.02]" onClick={() => router.push('/assistant')}>
                                            Perguntar para AxonIA
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
