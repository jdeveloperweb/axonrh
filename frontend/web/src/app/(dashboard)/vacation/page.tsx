'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle,
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

export default function VacationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<VacationPeriod[]>([]);
  const [requests, setRequests] = useState<VacationRequest[]>([]);
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
      APPROVED: { label: 'Aprovada', className: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100', icon: CheckCircle },
      REJECTED: { label: 'Rejeitada', className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100', icon: XCircle },
      CANCELLED: { label: 'Cancelada', className: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100', icon: XCircle },
      SCHEDULED: { label: 'Agendada', className: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100', icon: Calendar },
      IN_PROGRESS: { label: 'Em Andamento', className: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100', icon: Sun },
      COMPLETED: { label: 'Concluída', className: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100', icon: CheckCircle },
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
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Carregando informações de férias...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8 space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestão de Férias</h1>
          <p className="text-muted-foreground mt-1">
            Planeje seu descanso, acompanhe prazos e gerencie solicitações.
          </p>
        </div>
        <Button
          onClick={() => router.push('/vacation/request')}
          size="lg"
          className="shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white border-0"
        >
          <Plus className="mr-2 h-5 w-5" />
          Nova Solicitação
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Column (Active Period & Stats) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Active Period Hero Card */}
          {activePeriod ? (
            <Card className="overflow-hidden border-none shadow-lg bg-white relative">
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-emerald-400 to-teal-500" />
              <div className="absolute top-[-20px] right-[-20px] opacity-[0.03] rotate-12 pointer-events-none">
                <Sun className="h-64 w-64 text-emerald-900" />
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-emerald-600" />
                      Período Aquisitivo Atual
                    </CardTitle>
                    <CardDescription className="text-base">
                      Referência: <strong>{formatDate(activePeriod.acquisitionStartDate)}</strong> até <strong>{formatDate(activePeriod.acquisitionEndDate)}</strong>
                    </CardDescription>
                  </div>
                  <div className="hidden sm:block">
                    {getPeriodStatusBadge(activePeriod)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Direito Total</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">{activePeriod.totalDays}</span>
                      <span className="text-sm text-muted-foreground">dias</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Utilizados</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-slate-600">{activePeriod.usedDays}</span>
                      <span className="text-sm text-muted-foreground">dias</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vendidos</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-amber-600">{activePeriod.soldDays}</span>
                      <span className="text-sm text-muted-foreground">dias</span>
                    </div>
                  </div>

                  <div className="space-y-1 bg-emerald-50 p-2 rounded-lg border border-emerald-100 -m-2 pl-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Disponíveis</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-emerald-600">{activePeriod.remainingDays}</span>
                      <span className="text-sm text-emerald-600 font-medium">dias</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm items-end">
                    <span className="font-medium text-muted-foreground">Progresso de uso</span>
                    <span className="font-bold text-foreground">
                      {Math.round(((activePeriod.usedDays + activePeriod.soldDays) / activePeriod.totalDays) * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={((activePeriod.usedDays + activePeriod.soldDays) / activePeriod.totalDays) * 100}
                    className="h-3 bg-slate-100 [&>div]:bg-gradient-to-r [&>div]:from-emerald-400 [&>div]:to-teal-500"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>Prazo para concessão: <strong>{formatDate(activePeriod.concessionEndDate)}</strong></span>
                    <span>{activePeriod.statusLabel}</span>
                  </div>
                </div>

                {activePeriod.isExpiringSoon && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Atenção ao Prazo</AlertTitle>
                    <AlertDescription className="text-red-700">
                      Este período expira em <strong>{activePeriod.daysUntilExpiration} dias</strong>. Agende suas férias o quanto antes.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white border-dashed border-2 p-8 text-center text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium">Nenhum período ativo encontrado</h3>
              <p>Entre em contato com o RH para verificar seus períodos aquisitivos.</p>
            </Card>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow border-none shadow-sm bg-white">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-2xl font-bold block">{statistics.pendingRequests}</span>
                  <span className="text-xs text-muted-foreground font-medium">Pendentes Aprovação</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-none shadow-sm bg-white">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-full">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-2xl font-bold block">{statistics.upcomingVacations}</span>
                  <span className="text-xs text-muted-foreground font-medium">Próximas Férias</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-none shadow-sm bg-white">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-full">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-2xl font-bold block text-orange-600">{statistics.expiringPeriods}</span>
                  <span className="text-xs text-muted-foreground font-medium">Períodos Expirando</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-none shadow-sm bg-white">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-full">
                  <Sun className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-2xl font-bold block text-emerald-600">{statistics.employeesOnVacation}</span>
                  <span className="text-xs text-muted-foreground font-medium">Em Férias Hoje</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column (Actions & Tools) */}
        <div className="space-y-6">

          {/* Quick Actions Panel */}
          <div className="grid gap-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Acesso Rápido
            </h3>

            <button
              onClick={() => router.push('/vacation/simulator')}
              className="group flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-transparent hover:border-primary/20 text-left"
            >
              <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors">
                <DollarSign className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <div className="font-semibold text-foreground">Simulador</div>
                <div className="text-xs text-muted-foreground">Calcule valores de venda e férias</div>
              </div>
              <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>

            <button
              onClick={() => router.push('/vacation/calendar')}
              className="group flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-transparent hover:border-primary/20 text-left"
            >
              <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Users className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <div className="font-semibold text-foreground">Calendário da Equipe</div>
                <div className="text-xs text-muted-foreground">Visualize quem está ausente</div>
              </div>
              <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>

            <button
              onClick={() => router.push('/vacation/documents')}
              className="group flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-transparent hover:border-primary/20 text-left"
            >
              <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                <FileText className="h-6 w-6 text-purple-700" />
              </div>
              <div>
                <div className="font-semibold text-foreground">Documentos</div>
                <div className="text-xs text-muted-foreground">Avisos e recibos assinados</div>
              </div>
              <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </div>

          {/* Manager / Admin Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-lg text-muted-foreground">Gestão</h3>

            <Card className="border shadow-none bg-slate-50 overflow-hidden">
              <div className="h-1 w-full bg-blue-500"></div>
              <CardContent className="p-0">
                <button
                  onClick={() => router.push('/vacation/approvals')}
                  className="w-full text-left p-4 hover:bg-slate-100 transition-colors flex items-center justify-between border-b"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm">Aprovações Pendentes</span>
                  </span>
                  {statistics.pendingRequests > 0 && (
                    <Badge variant="secondary" className="bg-blue-200 text-blue-800 hover:bg-blue-300">
                      {statistics.pendingRequests}
                    </Badge>
                  )}
                </button>
                <button
                  onClick={() => router.push('/vacation/admin')}
                  className="w-full text-left p-4 hover:bg-slate-100 transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-sm">Monitoramento (RH)</span>
                  </span>
                  {statistics.expiringPeriods > 0 && (
                    <Badge variant="secondary" className="bg-orange-200 text-orange-800 hover:bg-orange-300">
                      {statistics.expiringPeriods}
                    </Badge>
                  )}
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* History Tabs */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <Tabs defaultValue="requests" className="w-full">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                Histórico
              </h3>
              <p className="text-sm text-muted-foreground">Acompanhe seus registros anteriores</p>
            </div>
            <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
              <TabsTrigger value="requests">Minhas Solicitações</TabsTrigger>
              <TabsTrigger value="periods">Períodos Aquisitivos</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="requests" className="mt-0">
            {requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg bg-slate-50">
                <Calendar className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
                <p className="text-lg font-medium text-muted-foreground">Você ainda não possui solicitações</p>
                <Button variant="ghost" onClick={() => router.push('/vacation/request')} className="mt-2 text-primary hover:underline">
                  Criar a primeira solicitação agora
                </Button>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Período Solicitado</TableHead>
                      <TableHead>Qtd. Dias</TableHead>
                      <TableHead>Abono (Venda)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{formatDate(request.startDate)} - {formatDate(request.endDate)}</span>
                            <span className="text-xs text-muted-foreground">{request.requestTypeLabel}</span>
                          </div>
                        </TableCell>
                        <TableCell>{request.daysCount} dias</TableCell>
                        <TableCell>
                          {request.soldDaysCount > 0 ? (
                            <Badge variant="secondary" className="bg-green-50 text-green-700">
                              + {request.soldDaysCount} dias
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDateTime(request.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => router.push(`/vacation/requests/${request.id}`)}
                          >
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">Ver detalhes</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="periods" className="mt-0">
            {periods.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-slate-50">
                Sua empresa ainda não cadastrou seus períodos.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {periods.map((period) => (
                  <Card key={period.id} className={cn(
                    "transition-all hover:border-primary/50",
                    period.isExpired ? "opacity-70 bg-slate-50" : "bg-white"
                  )}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base font-medium">
                          {formatDate(period.acquisitionStartDate)} - {formatDate(period.acquisitionEndDate)}
                        </CardTitle>
                        {getPeriodStatusBadge(period)}
                      </div>
                      <CardDescription>
                        Concessivo até: {formatDate(period.concessionEndDate)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">{Math.round(((period.usedDays + period.soldDays) / period.totalDays) * 100)}%</span>
                      </div>
                      <Progress value={((period.usedDays + period.soldDays) / period.totalDays) * 100} className="h-2 mb-4" />

                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div className="bg-slate-50 p-2 rounded">
                          <div className="text-muted-foreground">Total</div>
                          <div className="font-bold">{period.totalDays}</div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded">
                          <div className="text-muted-foreground">Usados</div>
                          <div className="font-bold">{period.usedDays}</div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded">
                          <div className="text-muted-foreground">Vendidos</div>
                          <div className="font-bold">{period.soldDays}</div>
                        </div>
                        <div className={cn("p-2 rounded", period.remainingDays > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-muted-foreground")}>
                          <div className="opacity-80">Restantes</div>
                          <div className="font-bold">{period.remainingDays}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
