'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Sun,
  DollarSign,
  FileText,
  Users,
  CalendarDays,
  ChevronRight,
  Briefcase,
  TrendingUp,
  History,
  Umbrella,
  Sparkles,
  Plane,
  ArrowRight,
  Star,
  Zap,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { vacationApi, VacationPeriod, VacationRequest } from '@/lib/api/vacation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export default function VacationPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<VacationPeriod[]>([]);
  const [requests, setRequests] = useState<VacationRequest[]>([]);

  const roles = user?.roles || [];
  const isAdmin = roles.includes('ADMIN');
  const isRH = roles.includes('RH') || roles.includes('GESTOR_RH') || roles.includes('ANALISTA_DP');
  const isManager = roles.includes('GESTOR') || roles.includes('LIDER') || roles.includes('MANAGER');
  const [statistics, setStatistics] = useState({
    pendingRequests: 0,
    expiringPeriods: 0,
    employeesOnVacation: 0,
    upcomingVacations: 0,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [periodsData, requestsData, statsData] = await Promise.all([
        vacationApi.getMyPeriods(),
        vacationApi.getMyRequests(),
        vacationApi.getStatistics(),
      ]);
      setPeriods(periodsData);
      setRequests(requestsData);
      setStatistics(statsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusBadge = (status: VacationRequest['status']) => {
    const config = {
      PENDING: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100', icon: Clock },
      APPROVED: { label: 'Aprovada', className: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100', icon: CheckCircle2 },
      REJECTED: { label: 'Rejeitada', className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100', icon: XCircle },
      CANCELLED: { label: 'Cancelada', className: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100', icon: XCircle },
      SCHEDULED: { label: 'Agendada', className: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100', icon: Calendar },
      IN_PROGRESS: { label: 'Em Andamento', className: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100', icon: Sun },
      COMPLETED: { label: 'Concluída', className: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100', icon: CheckCircle2 },
    };
    // Fallback for unknown status
    const { label, className, icon: Icon } = config[status] || { label: status, className: 'bg-gray-100', icon: Clock };

    return (
      <Badge variant="outline" className={cn("flex items-center gap-1.5 px-2.5 py-0.5 w-fit border", className)}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </Badge>
    );
  };

  const getPeriodStatusBadge = (period: VacationPeriod) => {
    if (period.isExpired) {
      return <Badge variant="destructive" className="bg-red-500 hover:bg-red-600">Expirado</Badge>;
    }
    if (period.isExpiringSoon) {
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Vencendo em Breve</Badge>;
    }
    if (period.status === 'COMPLETED') {
      return <Badge variant="secondary" className="bg-slate-200 text-slate-700">Concluído</Badge>;
    }
    return <Badge className="bg-emerald-500 hover:bg-emerald-600">Disponível</Badge>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateTimeStr: string) => {
    return new Date(dateTimeStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Find active period (most recent open)
  const activePeriod = periods.find(
    (p) => p.status === 'OPEN' || p.status === 'SCHEDULED' || p.status === 'PARTIALLY_USED'
  );

  if (loading && periods.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] gap-6">
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-primary opacity-20" />
          <Umbrella className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Organizando seu descanso...</h3>
          <p className="text-muted-foreground animate-pulse">Sincronizando dados com o servidor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-10 space-y-10 animate-in fade-in duration-700">

      {/* Premium Welcome Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-10 text-white shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Plane className="h-64 w-64 rotate-12" />
        </div>
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/20 blur-[100px]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-widest text-primary-foreground/80">
              <Star className="h-3 w-3 fill-current" />
              Portal do Colaborador
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl lg:text-5xl font-black tracking-tighter">
                Gestão de <span className="text-primary italic">Férias</span>
              </h1>
              <p className="text-lg text-slate-400 max-w-xl font-medium">
                Acompanhe seus períodos, planeje suas viagens e gerencie suas solicitações em um só lugar.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Button
                onClick={() => router.push('/vacation/request')}
                size="xl"
                className="rounded-2xl shadow-xl shadow-primary/20 group h-16 px-10"
              >
                Nova Solicitação
                <Plus className="ml-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
              </Button>

              {(isAdmin || isRH) && (
                <Button
                  variant="outline"
                  size="xl"
                  onClick={() => router.push('/vacation/admin')}
                  className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 h-16"
                >
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  Painel Administrativo
                </Button>
              )}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 min-w-[300px] flex flex-col justify-center gap-6">
            <div className="space-y-1 text-center">
              <p className="text-xs font-black text-primary uppercase tracking-widest">Saldo Disponível</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-7xl font-black tracking-tighter tabular-nums">
                  {activePeriod?.remainingDays || 0}
                </span>
                <span className="text-xl font-bold opacity-40 uppercase tracking-widest">dias</span>
              </div>
            </div>
            <Separator className="bg-white/10" />
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 tracking-widest uppercase px-2">
              <div className="flex flex-col gap-1 items-center">
                <span>Total</span>
                <span className="text-white text-base font-black">{activePeriod?.totalDays || 30}</span>
              </div>
              <div className="flex flex-col gap-1 items-center">
                <span>Usados</span>
                <span className="text-white text-base font-black">{activePeriod?.usedDays || 0}</span>
              </div>
              <div className="flex flex-col gap-1 items-center">
                <span>Vendidos</span>
                <span className="text-white text-base font-black">{activePeriod?.soldDays || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: Clock, label: 'Solicitações Pendentes', value: statistics.pendingRequests, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { icon: CalendarDays, label: 'Próximas Férias', value: statistics.upcomingVacations, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { icon: AlertTriangle, label: 'Períodos Expirando', value: statistics.expiringPeriods, color: 'text-rose-500', bg: 'bg-rose-500/10' },
          { icon: Sun, label: 'Em Férias Hoje', value: statistics.employeesOnVacation, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden bg-white rounded-3xl p-6 border-2 border-slate-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg)}>
                <stat.icon className={cn("h-7 w-7", stat.color)} />
              </div>
              <div className="space-y-0.5">
                <p className="text-3xl font-black text-slate-900 tabular-nums">{stat.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          {/* Active Period Card */}
          {activePeriod && (
            <section className="space-y-6">
              <div className="flex items-center gap-3 ml-2">
                <Zap className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase">Período Ativo</h3>
              </div>

              <div className="relative group overflow-hidden bg-white border-2 rounded-[2.5rem] p-1 shadow-sm transition-all hover:shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x border-slate-50">
                  <div className="md:col-span-8 p-10 space-y-10">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Referência do Período</p>
                        <h4 className="text-2xl font-black text-slate-900">
                          {formatDate(activePeriod.acquisitionStartDate)} — {formatDate(activePeriod.acquisitionEndDate)}
                        </h4>
                      </div>
                      <div className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase">
                        Vigente
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Utilização do Saldo</span>
                        <span className="text-lg font-black">{Math.round(((activePeriod.usedDays + activePeriod.soldDays) / activePeriod.totalDays) * 100)}%</span>
                      </div>
                      <div className="h-4 bg-slate-50 rounded-full p-1 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.round(((activePeriod.usedDays + activePeriod.soldDays) / activePeriod.totalDays) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border-2 border-white">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prazo Limite para Férias</span>
                        <span className="font-bold text-slate-900">{formatDate(activePeriod.concessionEndDate)}</span>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-4 p-10 flex flex-col justify-between bg-slate-50/50">
                    <div className="space-y-8 text-center pt-4">
                      <div className="h-20 w-20 rounded-3xl bg-white shadow-xl flex items-center justify-center mx-auto ring-8 ring-primary/5">
                        <Sun className="h-10 w-10 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-sm font-black text-slate-900 uppercase">Aproveite bem!</h5>
                        <p className="text-xs text-slate-400 font-medium">Você ainda tem <span className="text-primary font-black uppercase">{activePeriod.remainingDays} dias</span> para desfrutar seu descanso merecido.</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => router.push('/vacation/request')}
                      className="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest group"
                    >
                      Agendar Agora
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Detailed History */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 ml-2">
              <History className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase">Histórico e Registros</h3>
            </div>

            <Card className="bg-white border-2 rounded-[2.5rem] p-4 shadow-sm overflow-hidden min-h-[400px]">
              <Tabs defaultValue="requests" className="w-full">
                <TabsList className="bg-slate-50 p-1.5 rounded-[1.5rem] mb-8 h-auto">
                  <TabsTrigger value="requests" className="flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg">Solicitações</TabsTrigger>
                  <TabsTrigger value="periods" className="flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg">Meus Períodos</TabsTrigger>
                </TabsList>

                <TabsContent value="requests" className="animate-in fade-in slide-in-from-bottom-4">
                  {requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                      <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center">
                        <FileText className="h-10 w-10 text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-bold max-w-xs uppercase text-[10px] tracking-widest">Nenhuma solicitação encontrada em seu histórico.</p>
                    </div>
                  ) : (
                    <div className="rounded-[2rem] border-2 border-slate-50 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50/50 h-16 border-none">
                          <TableRow className="border-none hover:bg-transparent">
                            <TableHead className="font-black text-[10px] uppercase tracking-widest px-8">Período</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Dias</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                            <TableHead className="text-right px-8"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {requests.map((request) => (
                            <TableRow key={request.id} className="h-20 hover:bg-slate-50/30 transition-colors border-none">
                              <TableCell className="px-8">
                                <div className="space-y-1">
                                  <p className="font-black text-slate-900">{formatDate(request.startDate)} — {formatDate(request.endDate)}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{request.requestTypeLabel}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="rounded-lg h-8 px-3 border-slate-200 font-black text-xs tabular-nums text-slate-700">
                                  {request.daysCount}d
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center flex justify-center py-6">
                                {getStatusBadge(request.status)}
                              </TableCell>
                              <TableCell className="text-right px-8">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10 rounded-xl hover:bg-slate-100"
                                  onClick={() => router.push(`/vacation/requests/${request.id}`)}
                                >
                                  <ChevronRight className="h-5 w-5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="periods" className="animate-in fade-in slide-in-from-bottom-4">
                  <div className="grid gap-6 md:grid-cols-2">
                    {periods.map((period) => (
                      <Card key={period.id} className={cn(
                        "rounded-3xl border-2 transition-all p-6 space-y-6 hover:shadow-xl",
                        period.isExpired ? "opacity-60 bg-slate-50" : "bg-white border-slate-50 shadow-sm"
                      )}>
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aquisitivo</p>
                            <p className="font-black text-slate-900">{formatDate(period.acquisitionStartDate)} — {formatDate(period.acquisitionEndDate)}</p>
                          </div>
                          {getPeriodStatusBadge(period)}
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Concessivo até</span>
                            <span className="text-slate-900">{formatDate(period.concessionEndDate)}</span>
                          </div>
                          <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-1000"
                              style={{ width: `${Math.round(((period.usedDays + period.soldDays) / period.totalDays) * 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: 'T', val: period.totalDays },
                            { label: 'U', val: period.usedDays },
                            { label: 'V', val: period.soldDays },
                            { label: 'R', val: period.remainingDays, highlight: true },
                          ].map((item, idx) => (
                            <div key={idx} className={cn("p-2 rounded-xl text-center space-y-0.5 border", item.highlight && period.remainingDays > 0 ? "bg-primary/5 border-primary/20" : "bg-slate-50 border-slate-100")}>
                              <p className="text-[8px] font-black text-slate-400 tracking-tighter uppercase">{item.label}</p>
                              <p className={cn("text-sm font-black tabular-nums", item.highlight && period.remainingDays > 0 ? "text-primary" : "text-slate-700 font-bold")}>{item.val}</p>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-10">
          {/* Action Cards Panel */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 ml-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase">Recursos</h3>
            </div>

            <div className="grid gap-6">
              {[
                {
                  icon: DollarSign,
                  label: 'Simulador',
                  desc: 'Analise ganhos de abono e férias',
                  path: '/vacation/simulator',
                  color: 'text-emerald-600',
                  bg: 'bg-emerald-50'
                },
                {
                  icon: Users,
                  label: 'Escala da Equipe',
                  desc: 'Visualize ausências planejadas',
                  path: '/vacation/team',
                  color: 'text-blue-600',
                  bg: 'bg-blue-50'
                },
                {
                  icon: FileText,
                  label: 'Minhas Solicitações',
                  desc: 'Acompanhe seus pedidos em aberto',
                  path: '/vacation/request',
                  color: 'text-purple-600',
                  bg: 'bg-purple-50'
                },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => router.push(item.path)}
                  className="group flex items-center gap-5 p-6 bg-white rounded-[2rem] border-2 border-slate-50 shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all duration-300 text-left"
                >
                  <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", item.bg)}>
                    <item.icon className={cn("h-6 w-6", item.color)} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-slate-900 tracking-tight">{item.label}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{item.desc}</p>
                  </div>
                  <ChevronRight className="ml-auto h-5 w-5 text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>

          {/* Premium Knowledge / Info Panel */}
          <div className="p-10 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-[-20%] right-[-10%] opacity-10 group-hover:rotate-12 group-hover:scale-120 transition-all duration-1000">
              <Sun className="h-64 w-64" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center">
                <Info className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-black tracking-tight">Dica AxonRH</h4>
                <p className="text-sm font-medium text-slate-400 leading-relaxed">
                  Sabia que você pode vender até <span className="text-white font-black underline decoration-primary underline-offset-4">10 dias</span> do seu período aquisitivo? Isso é o Abono Pecuniário, um direito seu!
                </p>
              </div>
              <div className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/vacation/simulator')}
                  className="w-full h-14 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 uppercase tracking-widest text-[10px] font-black"
                >
                  Simular Abono
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
