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
  Plane,
  ArrowRight,
  Info,
  CalendarCheck2,
  Stethoscope,
  Heart
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
  const isAdmin = roles.some(r => r.includes('ADMIN'));
  const isRH = roles.some(r => r.includes('RH') || r.includes('GESTOR_RH') || r.includes('ANALISTA_DP'));
  const isManager = roles.some(r => r.includes('GESTOR') || r.includes('LIDER') || r.includes('MANAGER'));
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
      PENDING: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      MANAGER_APPROVED: { label: 'Aprovado Gestor', className: 'bg-indigo-100 text-indigo-800', icon: CheckCircle2 },
      APPROVED: { label: 'Aprovada', className: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      REJECTED: { label: 'Rejeitada', className: 'bg-red-100 text-red-800', icon: XCircle },
      CANCELLED: { label: 'Cancelada', className: 'bg-gray-100 text-gray-800', icon: XCircle },
      SCHEDULED: { label: 'Agendada', className: 'bg-blue-100 text-blue-800', icon: Calendar },
      IN_PROGRESS: { label: 'Em Andamento', className: 'bg-orange-100 text-orange-800', icon: Sun },
      COMPLETED: { label: 'Concluída', className: 'bg-slate-100 text-slate-800', icon: CheckCircle2 },
    };
    const { label, className, icon: Icon } = config[status] || { label: status, className: 'bg-gray-100', icon: Clock };

    return (
      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", className)}>
        <Icon className="h-3 w-3" />
        {label}
      </span>
    );
  };

  const getPeriodStatusBadge = (period: VacationPeriod) => {
    if (period.isExpired) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-800">Expirado</span>;
    }
    if (period.isExpiringSoon) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">Vencendo em Breve</span>;
    }
    if (period.status === 'COMPLETED') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600">Concluído</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800">Disponível</span>;
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
      <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
        <p className="text-sm text-gray-500">Carregando dados de férias...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Gestão de Férias</h1>
          <p className="text-[var(--color-text-secondary)]">
            Planeje suas férias, acompanhe o saldo e gerencie solicitações.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push('/vacation/request')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Umbrella className="w-4 h-4" />
            Nova Férias
          </Button>

          <Button
            onClick={() => router.push('/vacation/leave-request')}
            variant="outline"
            className="flex items-center gap-2 px-4 py-2 border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-all font-bold"
          >
            <Stethoscope className="w-4 h-4" />
            Outros Afastamentos
          </Button>

          {(isManager || isRH || isAdmin) && (
            <Button
              variant="outline"
              onClick={() => router.push('/vacation/approvals')}
              className="flex items-center gap-2 border-gray-200 hover:bg-gray-50 text-gray-700"
            >
              <CheckCircle2 className="w-4 h-4" />
              Aprovações
            </Button>
          )}

          {(isAdmin || isRH) && (
            <Button
              variant="outline"
              onClick={() => router.push('/vacation/admin')}
              className="flex items-center gap-2 border-gray-200 hover:bg-gray-50"
            >
              <Users className="w-4 h-4" />
              Administração RH
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Clock,
            label: 'Pendentes',
            value: statistics.pendingRequests,
            desc: 'Aguardando aprovação',
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-500',
            path: (isManager || isRH || isAdmin) && statistics.pendingRequests > 0 ? '/vacation/approvals' : undefined
          },
          { icon: CalendarCheck2, label: 'Agendadas', value: statistics.upcomingVacations, desc: 'Próximas férias', iconBg: 'bg-blue-50', iconColor: 'text-blue-500' },
          { icon: AlertTriangle, label: 'A Vencer', value: statistics.expiringPeriods, desc: 'Atenção aos prazos', iconBg: 'bg-red-50', iconColor: 'text-red-500' },
          { icon: Sun, label: 'Em Férias', value: statistics.employeesOnVacation, desc: 'Equipe em descanso', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
        ].map((stat, i) => (
          <Card
            key={i}
            className={cn(
              "border-none shadow-sm bg-white transition-all",
              stat.path ? "cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]" : "hover:shadow-md"
            )}
            onClick={() => stat.path && router.push(stat.path)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.desc}</p>
              </div>
              <div className={cn("p-3 rounded-lg", stat.iconBg)}>
                <stat.icon className={cn("w-5 h-5", stat.iconColor)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Active Period Card */}
          {activePeriod && (
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <div className="w-2 h-6 bg-[var(--color-primary)] rounded-full" />
                      Ciclo Aquisitivo Atual
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      {formatDate(activePeriod.acquisitionStartDate)} a {formatDate(activePeriod.acquisitionEndDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">{activePeriod.remainingDays}</p>
                    <p className="text-xs text-gray-400">dias disponíveis</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-500 font-medium">Consumo de Dias</span>
                    <span className="font-bold text-gray-900">{Math.round(((activePeriod.usedDays + activePeriod.soldDays) / activePeriod.totalDays) * 100)}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-1000"
                      style={{ width: `${Math.round(((activePeriod.usedDays + activePeriod.soldDays) / activePeriod.totalDays) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Total', val: activePeriod.totalDays, color: 'text-gray-900' },
                    { label: 'Usado', val: activePeriod.usedDays, color: 'text-emerald-600' },
                    { label: 'Venda', val: activePeriod.soldDays, color: 'text-amber-600' },
                    { label: 'Saldo', val: activePeriod.remainingDays, color: 'text-[var(--color-primary)]' },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                      <p className={cn("text-lg font-bold tabular-nums", item.color)}>{item.val}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <CalendarCheck2 className="h-5 w-5 text-[var(--color-primary)]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Data Limite de Concessão</p>
                    <p className="text-sm font-bold text-gray-900">{formatDate(activePeriod.concessionEndDate)}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">Regular</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Records & History */}
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <div className="w-2 h-6 bg-gray-900 rounded-full" />
                Histórico
              </CardTitle>
              <CardDescription>Rastreabilidade das suas solicitações e períodos.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="requests" className="w-full">
                <TabsList className="bg-gray-100 p-1 rounded-lg mb-6 h-auto w-full max-w-md flex">
                  <TabsTrigger value="requests" className="flex-1 py-2.5 rounded-md text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[var(--color-primary)] transition-all">Solicitações</TabsTrigger>
                  <TabsTrigger value="periods" className="flex-1 py-2.5 rounded-md text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[var(--color-primary)] transition-all">Períodos Aquisitivos</TabsTrigger>
                </TabsList>

                <TabsContent value="requests" className="animate-in fade-in duration-300">
                  {requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileText className="h-10 w-10 text-gray-200 mb-3" />
                      <p className="text-gray-400 text-sm">Nenhuma solicitação registrada.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50/50">
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Período</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Dias</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {requests.map((request) => (
                            <tr key={request.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                    <Plane className="h-4 w-4 text-gray-400" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-gray-900">{formatDate(request.startDate)} — {formatDate(request.endDate)}</p>
                                    <p className="text-xs text-[var(--color-primary)] font-medium">{request.requestTypeLabel}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-lg text-sm font-bold text-gray-700 tabular-nums">
                                  {request.daysCount} dias
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {getStatusBadge(request.status)}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                  onClick={() => router.push(`/vacation/requests/${request.id}`)}
                                >
                                  <ArrowRight className="h-4 w-4 text-gray-400" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="periods" className="animate-in fade-in duration-300">
                  <div className="grid gap-4 md:grid-cols-2">
                    {periods.map((period) => (
                      <div key={period.id} className={cn(
                        "relative p-5 rounded-lg border transition-all",
                        period.isExpired ? "opacity-60 bg-gray-50 border-gray-200" : "bg-white border-gray-200 hover:shadow-md"
                      )}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-xs text-gray-400 font-medium mb-1">Aquisitivo</p>
                            <p className="text-sm font-bold text-gray-900">{formatDate(period.acquisitionStartDate)} a {formatDate(period.acquisitionEndDate)}</p>
                          </div>
                          {getPeriodStatusBadge(period)}
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400">Expira em</span>
                            <span className="text-red-600 font-bold">{formatDate(period.concessionEndDate)}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-1000"
                              style={{ width: `${Math.round(((period.usedDays + period.soldDays) / period.totalDays) * 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: 'Total', val: period.totalDays, color: 'text-gray-500' },
                            { label: 'Uso', val: period.usedDays, color: 'text-emerald-600' },
                            { label: 'Venda', val: period.soldDays, color: 'text-amber-600' },
                            { label: 'Saldo', val: period.remainingDays, color: 'text-[var(--color-primary)]' },
                          ].map((item, idx) => (
                            <div key={idx} className="p-2 rounded-lg text-center bg-gray-50">
                              <p className="text-[10px] text-gray-400 font-medium">{item.label}</p>
                              <p className={cn("text-sm font-bold tabular-nums", item.color)}>{item.val}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="xl:col-span-1 space-y-6">
          {/* Shortcuts */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Atalhos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                ...(isManager || isRH || isAdmin ? [{
                  icon: CheckCircle2,
                  label: 'Aprovações',
                  desc: 'Gerenciar solicitações',
                  path: '/vacation/approvals',
                  color: 'text-orange-600',
                  bg: 'bg-orange-50'
                }] : []),
                { icon: DollarSign, label: 'Simulador', desc: 'Cálculos de férias', path: '/vacation/simulator', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { icon: Users, label: 'Escala Equipe', desc: 'Ausências de colegas', path: '/vacation/team', color: 'text-blue-600', bg: 'bg-blue-50' },
                { icon: Heart, label: 'Outras Licenças', desc: 'Saúde, Gala, Luto, etc', path: '/vacation/leave-request', color: 'text-pink-600', bg: 'bg-pink-50' },
                { icon: FileText, label: 'Políticas', desc: 'Regras de férias', path: '#', color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => router.push(item.path)}
                  className="group w-full flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
                >
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", item.bg)}>
                    <item.icon className={cn("h-5 w-5", item.color)} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[var(--color-primary)] transition-colors" />
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Dica: Abono Pecuniário</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Você pode vender até 10 dias e receber um dinheiro extra. Use o simulador para calcular.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/vacation/simulator')}
                className="w-full rounded-lg border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-medium"
              >
                Abrir Simulador
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
