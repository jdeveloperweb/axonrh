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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
      PENDING: { label: 'Pendente', variant: 'warning' as const, icon: Clock },
      APPROVED: { label: 'Aprovada', variant: 'success' as const, icon: CheckCircle },
      REJECTED: { label: 'Rejeitada', variant: 'destructive' as const, icon: XCircle },
      CANCELLED: { label: 'Cancelada', variant: 'secondary' as const, icon: XCircle },
      SCHEDULED: { label: 'Agendada', variant: 'default' as const, icon: Calendar },
      IN_PROGRESS: { label: 'Em Andamento', variant: 'default' as const, icon: Sun },
      COMPLETED: { label: 'Concluída', variant: 'secondary' as const, icon: CheckCircle },
    };
    const { label, variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getPeriodStatusBadge = (period: VacationPeriod) => {
    if (period.isExpired) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    if (period.isExpiringSoon) {
      return <Badge variant="warning">Expirando em breve</Badge>;
    }
    if (period.status === 'COMPLETED') {
      return <Badge variant="secondary">Concluído</Badge>;
    }
    return <Badge variant="default">{period.statusLabel}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateTimeStr: string) => {
    return new Date(dateTimeStr).toLocaleString('pt-BR');
  };

  // Find active period (most recent open)
  const activePeriod = periods.find(
    (p) => p.status === 'OPEN' || p.status === 'SCHEDULED' || p.status === 'PARTIALLY_USED'
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Férias</h1>
          <p className="text-muted-foreground">Gerencie suas férias e períodos aquisitivos</p>
        </div>
        <Button onClick={() => router.push('/vacation/request')}>
          <Plus className="mr-2 h-4 w-4" />
          Solicitar Férias
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => router.push('/vacation/approvals')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes Aprovação</p>
                <p className="text-2xl font-bold">{statistics.pendingRequests}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Períodos Expirando</p>
                <p className="text-2xl font-bold text-red-600">{statistics.expiringPeriods}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Férias Hoje</p>
                <p className="text-2xl font-bold text-green-600">{statistics.employeesOnVacation}</p>
              </div>
              <Sun className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => router.push('/vacation/calendar')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Próximas Férias</p>
                <p className="text-2xl font-bold">{statistics.upcomingVacations}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Period Card */}
      {activePeriod && (
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Período Aquisitivo Atual
            </CardTitle>
            <CardDescription>
              {formatDate(activePeriod.acquisitionStartDate)} a{' '}
              {formatDate(activePeriod.acquisitionEndDate)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Direito Total</p>
                <p className="text-2xl font-bold">{activePeriod.totalDays} dias</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Utilizados</p>
                <p className="text-2xl font-bold">{activePeriod.usedDays} dias</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendidos (Abono)</p>
                <p className="text-2xl font-bold">{activePeriod.soldDays} dias</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Disponíveis</p>
                <p className="text-2xl font-bold text-primary">{activePeriod.remainingDays} dias</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uso do Período</span>
                <span>
                  {Math.round(
                    ((activePeriod.usedDays + activePeriod.soldDays) / activePeriod.totalDays) * 100
                  )}
                  %
                </span>
              </div>
              <Progress
                value={
                  ((activePeriod.usedDays + activePeriod.soldDays) / activePeriod.totalDays) * 100
                }
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-sm">
                <span className="text-muted-foreground">Período Concessivo: </span>
                <span className="font-medium">
                  {formatDate(activePeriod.concessionStartDate)} a{' '}
                  {formatDate(activePeriod.concessionEndDate)}
                </span>
              </div>
              {getPeriodStatusBadge(activePeriod)}
            </div>

            {activePeriod.isExpiringSoon && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Atenção! Este período expira em {activePeriod.daysUntilExpiration} dias. Agende
                  suas férias para não perder o direito.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Minhas Solicitações</TabsTrigger>
          <TabsTrigger value="periods">Períodos Aquisitivos</TabsTrigger>
        </TabsList>

        {/* Requests Tab */}
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações de Férias</CardTitle>
              <CardDescription>Histórico das suas solicitações</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Você não possui solicitações de férias</p>
                  <Button className="mt-4" onClick={() => router.push('/vacation/request')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Solicitar Férias
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead>Dias</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Solicitado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {formatDate(request.startDate)} - {formatDate(request.endDate)}
                            </div>
                            {request.sellDays && request.soldDaysCount > 0 && (
                              <div className="text-xs text-muted-foreground">
                                + {request.soldDaysCount} dias de abono
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{request.daysCount} dias</TableCell>
                        <TableCell>
                          <Badge variant="outline">{request.requestTypeLabel}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(request.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/vacation/requests/${request.id}`)}
                          >
                            Detalhes
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Periods Tab */}
        <TabsContent value="periods">
          <Card>
            <CardHeader>
              <CardTitle>Períodos Aquisitivos</CardTitle>
              <CardDescription>Histórico dos seus períodos de direito a férias</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : periods.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum período aquisitivo encontrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {periods.map((period) => (
                    <div key={period.id} className="p-4 rounded-lg border">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">
                            Período {formatDate(period.acquisitionStartDate)} a{' '}
                            {formatDate(period.acquisitionEndDate)}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Concessivo até {formatDate(period.concessionEndDate)}
                          </div>
                        </div>
                        {getPeriodStatusBadge(period)}
                      </div>
                      <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total:</span>{' '}
                          <span className="font-medium">{period.totalDays} dias</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Usados:</span>{' '}
                          <span className="font-medium">{period.usedDays} dias</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Vendidos:</span>{' '}
                          <span className="font-medium">{period.soldDays} dias</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Restantes:</span>{' '}
                          <span className="font-medium text-primary">
                            {period.remainingDays} dias
                          </span>
                        </div>
                      </div>
                      <Progress
                        value={((period.usedDays + period.soldDays) / period.totalDays) * 100}
                        className="mt-3"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => router.push('/vacation/simulator')}
        >
          <CardContent className="pt-6 text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <h3 className="font-medium">Simulador de Valores</h3>
            <p className="text-sm text-muted-foreground">Calcule quanto vai receber</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => router.push('/vacation/calendar')}
        >
          <CardContent className="pt-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <h3 className="font-medium">Calendário da Equipe</h3>
            <p className="text-sm text-muted-foreground">Veja férias do time</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => router.push('/vacation/documents')}
        >
          <CardContent className="pt-6 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <h3 className="font-medium">Documentos</h3>
            <p className="text-sm text-muted-foreground">Avisos e recibos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
