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
  Info,
  CalendarCheck2
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
      PENDING: { label: 'Pendente', className: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
      APPROVED: { label: 'Aprovada', className: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
      REJECTED: { label: 'Rejeitada', className: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
      CANCELLED: { label: 'Cancelada', className: 'bg-gray-50 text-gray-700 border-gray-200', icon: XCircle },
      SCHEDULED: { label: 'Agendada', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: Calendar },
      IN_PROGRESS: { label: 'Em Andamento', className: 'bg-orange-50 text-orange-700 border-orange-200', icon: Sun },
      COMPLETED: { label: 'Concluída', className: 'bg-slate-50 text-slate-700 border-slate-200', icon: CheckCircle2 },
    };
    const { label, className, icon: Icon } = config[status] || { label: status, className: 'bg-gray-50', icon: Clock };

    return (
      <Badge variant="outline" className={cn("flex items-center gap-1.5 px-2.5 py-1 w-fit border shadow-sm", className)}>
        <Icon className="h-3.5 w-3.5" />
        <span className="font-bold">{label}</span>
      </Badge>
    );
  };

  const getPeriodStatusBadge = (period: VacationPeriod) => {
    if (period.isExpired) {
      return <Badge variant="destructive" className="bg-red-500 rounded-lg">Expirado</Badge>;
    }
    if (period.isExpiringSoon) {
      return <Badge className="bg-amber-500 text-white rounded-lg">Vencendo em Breve</Badge>;
    }
    if (period.status === 'COMPLETED') {
      return <Badge variant="secondary" className="bg-slate-100 text-slate-600 rounded-lg">Concluído</Badge>;
    }
    return <Badge className="bg-primary/10 text-primary border-primary/20 rounded-lg">Disponível</Badge>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

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
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Organizando seu descanso...</h3>
          <p className="text-slate-400 font-medium">Sincronizando dados com o servidor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 lg:px-10 py-10 space-y-10 animate-in fade-in duration-700">

      {/* New Professional Light Header */}
      <div className="relative group overflow-hidden rounded-3xl bg-white border border-slate-100 p-8 lg:p-10 shadow-sm">
        <div className="absolute top-0 right-0 p-8 text-primary/5 pointer-events-none">
          <Plane className="h-64 w-64 rotate-12" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
          <div className="space-y-8 flex-1">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Área do Colaborador</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
                Gestão de <span className="text-primary italic">Férias</span>
              </h1>
              <p className="text-lg text-slate-500 max-w-2xl font-medium leading-relaxed">
                Planeje suas próximas aventuras. Acompanhe seu saldo acumulado e gerencie suas datas de descanso de forma inteligente.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <Button
                onClick={() => router.push('/vacation/request')}
                size="xl"
                className="rounded-xl shadow-lg shadow-primary/10 group h-14 px-8 text-xs font-black uppercase tracking-widest"
              >
                Nova Solicitação
                <Plus className="ml-2 h-4 w-4 group-hover:rotate-90 transition-transform" />
              </Button>

              {(isAdmin || isRH) && (
                <Button
                  variant="outline"
                  size="xl"
                  onClick={() => router.push('/vacation/admin')}
                  className="rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50 h-14 px-8 text-xs font-black uppercase tracking-widest"
                >
                  <Users className="mr-2 h-4 w-4 text-primary" />
                  Administração RH
                </Button>
              )}
            </div>
          </div>

          {/* Quick Balance Card - Light Version */}
          <div className="relative lg:w-[360px]">
            <div className="absolute -inset-2 bg-primary/5 rounded-3xl blur-xl" />
            <div className="relative bg-white border border-slate-50 rounded-2xl p-8 shadow-sm flex flex-col items-center gap-6">
              <div className="space-y-1 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Saldo Disponível</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-6xl font-black tracking-tighter tabular-nums text-slate-900 leading-none">
                    {activePeriod?.remainingDays || 0}
                  </span>
                  <span className="text-lg font-black text-primary uppercase tracking-widest">dias</span>
                </div>
              </div>

              <div className="w-full grid grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                <div className="text-center space-y-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                  <p className="text-xl font-black text-slate-900 tabular-nums">{activePeriod?.totalDays || 30}</p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Gasto</p>
                  <p className="text-xl font-black text-emerald-500 tabular-nums">{activePeriod?.usedDays || 0}</p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Venda</p>
                  <p className="text-xl font-black text-amber-500 tabular-nums">{activePeriod?.soldDays || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Expanded Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { icon: Clock, label: 'Pendentes', value: statistics.pendingRequests, color: 'text-amber-500', bg: 'bg-amber-50', desc: 'Aguardando aprovação' },
          { icon: CalendarCheck2, label: 'Agendadas', value: statistics.upcomingVacations, color: 'text-primary', bg: 'bg-primary/5', desc: 'Próximos embarques' },
          { icon: AlertTriangle, label: 'A Vencer', value: statistics.expiringPeriods, color: 'text-rose-500', bg: 'bg-rose-50', desc: 'Atenção aos prazos' },
          { icon: Sun, label: 'Em Férias', value: statistics.employeesOnVacation, color: 'text-emerald-500', bg: 'bg-emerald-50', desc: 'Equipe em descanso' },
        ].map((stat, i) => (
          <Card key={i} className="group overflow-hidden bg-white rounded-2xl border border-slate-50 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500">
            <CardContent className="p-8 flex items-center gap-6">
              <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", stat.bg)}>
                <stat.icon className={cn("h-8 w-8", stat.color)} />
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900 tabular-nums">{stat.value}</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-[9px] font-medium text-slate-300 uppercase">{stat.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 space-y-10">
          {/* Active Period Card - Enhanced Wide Design */}
          {activePeriod && (
            <Card className="rounded-3xl border-none bg-slate-50/50 p-1 shadow-inner">
              <div className="bg-white rounded-[1.5rem] border border-slate-100 overflow-hidden shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-12">
                  <div className="md:col-span-7 p-10 lg:p-12 space-y-10 border-r border-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-primary font-black text-[10px] tracking-widest uppercase">
                          <Zap className="h-4 w-4 fill-current" />
                          Ciclo Aquisitivo Atual
                        </div>
                        <h4 className="text-3xl font-black text-slate-900 tracking-tight">
                          {formatDate(activePeriod.acquisitionStartDate)} <span className="text-slate-200">/</span> {formatDate(activePeriod.acquisitionEndDate)}
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Consumo de Dias</span>
                        <span className="text-xl font-black text-slate-900">{Math.round(((activePeriod.usedDays + activePeriod.soldDays) / activePeriod.totalDays) * 100)}%</span>
                      </div>
                      <div className="h-6 bg-slate-50 rounded-full p-1.5 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-primary via-orange-500 to-rose-500 rounded-full transition-all duration-1000 shadow-lg shadow-primary/20"
                          style={{ width: `${Math.round(((activePeriod.usedDays + activePeriod.soldDays) / activePeriod.totalDays) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        <span>Início do Ciclo</span>
                        <span>Fim do Ciclo</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-white group/banner">
                      <div className="h-14 w-14 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-slate-200/50 transition-transform group-hover/banner:scale-110">
                        <CalendarCheck2 className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data Limite de Concessão</p>
                        <p className="text-base font-black text-slate-800">{formatDate(activePeriod.concessionEndDate)}</p>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-tighter">
                        Regular
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-5 bg-slate-50/80 p-10 lg:p-12 flex flex-col justify-between items-center text-center space-y-10">
                    <div className="space-y-6">
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                        <div className="relative h-24 w-24 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center mx-auto ring-4 ring-white">
                          <Umbrella className="h-12 w-12 text-primary" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-xl font-black text-slate-900 tracking-tight">Tempo Restante</h5>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[200px] mx-auto">
                          Garanta seus <span className="text-primary font-black uppercase">{activePeriod.remainingDays} dias</span> de folga e recarregue as energias.
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => router.push('/vacation/request')}
                      size="xl"
                      className="w-full rounded-xl h-14 uppercase font-black tracking-widest text-[10px] shadow-lg shadow-primary/10 transition-transform active:scale-95 py-0"
                    >
                      Agendar Agora
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Records & History - Expanded width layout */}
          <Card className="bg-white border border-slate-100 rounded-3xl p-1 shadow-sm overflow-hidden">
            <div className="p-8 lg:p-12 space-y-10">
              <div className="flex items-center justify-between">
                <div className="space-y-1 text-left">
                  <h3 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Histórico Detalhado</h3>
                  <p className="text-sm font-medium text-slate-400">Rastreabilidade total das suas solicitações e períodos.</p>
                </div>
                <History className="h-8 w-8 text-slate-100" />
              </div>

              <Tabs defaultValue="requests" className="w-full">
                <TabsList className="bg-slate-50 p-1 rounded-2xl mb-8 h-auto w-full max-w-md mx-auto flex">
                  <TabsTrigger value="requests" className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all">Solicitações</TabsTrigger>
                  <TabsTrigger value="periods" className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all">Períodos Aquisitivos</TabsTrigger>
                </TabsList>

                <TabsContent value="requests" className="animate-in fade-in zoom-in-95 duration-500">
                  {requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                      <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center">
                        <FileText className="h-10 w-10 text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-bold max-w-xs uppercase text-[10px] tracking-widest leading-loose">Nenhuma solicitação ativa ou anterior registrada.</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-50 overflow-hidden bg-white">
                      <Table>
                        <TableHeader className="bg-slate-50/50 h-20 border-none">
                          <TableRow className="border-none hover:bg-transparent px-8">
                            <TableHead className="font-black text-[10px] uppercase tracking-widest px-10 text-slate-400">Período Selecionado</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-center text-slate-400">Total de Dias</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-center text-slate-400">Status Atual</TableHead>
                            <TableHead className="text-right px-10 text-slate-400"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {requests.map((request) => (
                            <TableRow key={request.id} className="h-24 hover:bg-slate-50/50 transition-all border-none group">
                              <TableCell className="px-10">
                                <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
                                    <Plane className="h-5 w-5 text-slate-300" />
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-base font-black text-slate-900">{formatDate(request.startDate)} — {formatDate(request.endDate)}</p>
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">{request.requestTypeLabel}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="inline-flex h-10 px-4 items-center bg-slate-50 rounded-xl font-black text-sm tabular-nums text-slate-700">
                                  {request.daysCount} dias
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex justify-center">
                                  {getStatusBadge(request.status)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right px-10">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                                  onClick={() => router.push(`/vacation/requests/${request.id}`)}
                                >
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="periods" className="animate-in fade-in zoom-in-95 duration-500">
                  <div className="grid gap-8 md:grid-cols-2">
                    {periods.map((period) => (
                      <div key={period.id} className={cn(
                        "relative group overflow-hidden rounded-2xl border transition-all p-6 flex flex-col gap-8",
                        period.isExpired ? "opacity-60 bg-slate-50 border-slate-100" : "bg-white border-slate-50 shadow-sm hover:shadow-xl hover:border-primary/20"
                      )}>
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aquisitivo</p>
                            <p className="text-xl font-black text-slate-900 leading-tight">{formatDate(period.acquisitionStartDate)}<br />{formatDate(period.acquisitionEndDate)}</p>
                          </div>
                          {getPeriodStatusBadge(period)}
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-400">Expira em</span>
                            <span className="text-rose-500 font-black">{formatDate(period.concessionEndDate)}</span>
                          </div>
                          <div className="h-3 bg-slate-50 rounded-full overflow-hidden shadow-inner border border-slate-100/50">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                              style={{ width: `${Math.round(((period.usedDays + period.soldDays) / period.totalDays) * 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                          {[
                            { label: 'Total', val: period.totalDays, color: 'text-slate-400' },
                            { label: 'Uso', val: period.usedDays, color: 'text-emerald-500' },
                            { label: 'Venda', val: period.soldDays, color: 'text-amber-500' },
                            { label: 'Saldo', val: period.remainingDays, color: 'text-primary', highlight: true },
                          ].map((item, idx) => (
                            <div key={idx} className={cn("p-4 rounded-2xl text-center space-y-1 transition-all", item.highlight && period.remainingDays > 0 ? "bg-primary/5 ring-1 ring-primary/20" : "bg-slate-50 border border-slate-100")}>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{item.label}</p>
                              <p className={cn("text-lg font-black tabular-nums leading-none", item.color)}>{item.val}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </Card>
        </div>

        {/* Right Sidebar - Better spacing and weight */}
        <div className="xl:col-span-1 space-y-10">
          <div className="space-y-8">
            <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase ml-4">Atalhos</h3>
            <div className="grid gap-6">
              {[
                { icon: DollarSign, label: 'Simulador', desc: 'Cálculos rápidos de ganhos', path: '/vacation/simulator', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { icon: Users, label: 'Escala Equipe', desc: 'Ausências de colegas', path: '/vacation/team', color: 'text-blue-600', bg: 'bg-blue-50' },
                { icon: FileText, label: 'Políticas', desc: 'Regras de férias AxonRH', path: '#', color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => router.push(item.path)}
                  className="group flex items-center gap-6 p-6 bg-white rounded-2xl border border-slate-50 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300"
                >
                  <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110 shadow-lg shadow-slate-200/50", item.bg)}>
                    <item.icon className={cn("h-7 w-7", item.color)} />
                  </div>
                  <div className="space-y-1.5 flex-1 pr-4">
                    <p className="text-lg font-black text-slate-900 tracking-tight leading-none">{item.label}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.desc}</p>
                  </div>
                  <div className="h-10 w-10 flex items-center justify-center bg-slate-50 rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* New Vibrant Info Component */}
          <div className="relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-orange-400 rounded-3xl shadow-xl shadow-primary/20" />
            <div className="absolute top-[-30%] right-[-10%] opacity-20 group-hover:rotate-12 group-hover:scale-110 transition-all duration-1000">
              <Briefcase className="h-80 w-80 text-white" />
            </div>

            <div className="relative z-10 p-10 space-y-8 flex flex-col h-full text-white">
              <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                <Info className="h-7 w-7 text-white" />
              </div>
              <div className="space-y-4">
                <h4 className="text-3xl font-black tracking-tight leading-tight">Dica para seu <br /><span className="italic underline decoration-white/30 underline-offset-8">Abono</span></h4>
                <p className="text-base font-medium text-white/80 leading-relaxed">
                  Sabia que você pode vender até 10 dias e receber um dinheiro extra? <br /><br /> Use nosso simulador para ver quanto você ganha!
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/vacation/simulator')}
                className="w-full h-14 rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20 uppercase tracking-widest text-[10px] font-black backdrop-blur-sm"
              >
                Abrir Simulador
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
