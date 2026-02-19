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
  Heart,
  Brain
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
import { leavesApi } from '@/lib/api/leaves';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export default function VacationPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<VacationPeriod[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [activeLeaves, setActiveLeaves] = useState<any[]>([]);
  const [expiringPeriods, setExpiringPeriods] = useState<VacationPeriod[]>([]);

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
      const [
        periodsData,
        vacRequestsData,
        leavesData,
        myVacRequests,
        myLeavesData,
        statsData,
        activeData,
        expiringData
      ] = await Promise.all([
        vacationApi.getMyPeriods().catch(() => []),
        (isRH || isAdmin || isManager) ? vacationApi.getPendingRequests(0, 100).then(r => r.content).catch(() => []) : Promise.resolve([]),
        (isRH || isAdmin || isManager) ? leavesApi.getLeaves().catch(() => []) : Promise.resolve([]),
        vacationApi.getMyRequests().catch(() => []),
        user?.id ? leavesApi.getMyLeaves(user.id).catch(() => []) : Promise.resolve([]),
        vacationApi.getStatistics().catch(() => ({})),
        leavesApi.getActiveLeaves().catch(() => []),
        (isRH || isAdmin || isManager) ? vacationApi.getExpiringPeriods(90).catch(() => []) : Promise.resolve([])
      ]);

      setPeriods(periodsData);

      // Merge all for management
      const mergedAll = [
        ...vacRequestsData.map((r: any) => ({ ...r, type: r.type || 'VACATION' })),
        ...leavesData
      ].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

      setRequests(mergedAll);

      // Merge personal
      const mergedMine = [
        ...myVacRequests.map((r: any) => ({ ...r, type: r.type || 'VACATION' })),
        ...myLeavesData
      ].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

      setMyRequests(mergedMine);

      setStatistics((prev: any) => ({ ...prev, ...statsData }));
      setActiveLeaves(activeData);
      setExpiringPeriods(expiringData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateStatus = async (id: string, status: string, type: string) => {
    try {
      if (type === 'VACATION') {
        if (status === 'APPROVED') await vacationApi.approveRequest(id);
        else if (status === 'REJECTED') await vacationApi.rejectRequest(id, 'Rejeitado pelo gestor');
      } else {
        await leavesApi.updateStatus(id, status);
      }
      toast({ title: 'Status atualizado', description: `Solicitação ${status.toLowerCase()} com sucesso.` });
      loadData();
    } catch (error) {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    const config: any = {
      PENDING: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      APPROVED: { label: 'Aprovada', className: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      REJECTED: { label: 'Rejeitada', className: 'bg-red-100 text-red-800', icon: XCircle },
      CANCELLED: { label: 'Cancelada', className: 'bg-gray-100 text-gray-800', icon: XCircle },
    };
    const item = config[status] || { label: status, className: 'bg-gray-100', icon: Clock };
    const Icon = item.icon;

    return (
      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", item.className)}>
        <Icon className="h-3 w-3" />
        {item.label}
      </span>
    );
  };

  const getLeaveTypeBadge = (type: string) => {
    const config: any = {
      VACATION: { label: 'Férias', className: 'bg-blue-100 text-blue-700', icon: Umbrella },
      MEDICAL: { label: 'Médica', className: 'bg-red-100 text-red-700', icon: Stethoscope },
      MATERNITY: { label: 'Maternidade', className: 'bg-pink-100 text-pink-700', icon: Heart },
      PATERNITY: { label: 'Paternidade', className: 'bg-indigo-100 text-indigo-700', icon: Users },
      OTHER: { label: 'Outros', className: 'bg-slate-100 text-slate-700', icon: FileText },
    };
    const item = config[type] || { label: type, className: 'bg-gray-100', icon: FileText };
    const Icon = item.icon;
    return (
      <Badge variant="outline" className={cn("font-bold gap-1", item.className)}>
        <Icon className="h-3 w-3" /> {item.label}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Sincronizando licenças e afastamentos...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500 w-full">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Licenças e Afastamentos</h1>
          <p className="text-slate-500 font-medium font-inter">
            Controle unificado de férias, licenças médicas e outros afastamentos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => router.push('/vacation/request')}
            className="flex items-center gap-2 px-6 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            <Umbrella className="w-4 h-4" />
            Nova Férias
          </Button>

          <Button
            onClick={() => router.push('/vacation/leave-request')}
            className="flex items-center gap-2 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nova Licença
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push('/vacation/approvals')}
            className="flex items-center gap-2 border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-bold"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Aprovações
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">

          {/* Active Absences Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Quem está afastado hoje
              <Badge variant="secondary" className="ml-2 bg-blue-50 text-blue-600 border-none font-bold">
                {activeLeaves.length} pessoas
              </Badge>
            </h2>

            {activeLeaves.length === 0 ? (
              <div className="p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                <p className="text-slate-400 font-medium">Ninguém afastado no momento. Equipe completa!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeLeaves.map((leaf) => (
                  <Card key={leaf.id} className="border-none shadow-sm bg-white hover:shadow-md transition-all overflow-hidden group">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 group-hover:bg-blue-50 transition-colors">
                        {leaf.employeeName?.charAt(0) || 'E'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate">{leaf.employeeName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getLeaveTypeBadge(leaf.type)}
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Até {formatDate(leaf.endDate)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Unified Management List */}
          <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-slate-50 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black">Histórico e Gerenciamento</CardTitle>
                  <CardDescription className="font-medium">Visualize e controle todas as solicitações</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={loadData} className="rounded-lg h-8 w-8 p-0">
                    <History className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue={isRH || isAdmin || isManager ? "all" : "mine"} className="w-full">
                <div className="px-8 pt-4">
                  <TabsList className="bg-slate-100 rounded-xl p-1 h-12">
                    <TabsTrigger value="mine" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-bold">Minhas Solicitações</TabsTrigger>
                    {(isRH || isAdmin || isManager) && (
                      <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-bold">Gestão da Empresa</TabsTrigger>
                    )}
                  </TabsList>
                </div>

                <TabsContent value="mine" className="mt-4">
                  <LeaveTable
                    requests={myRequests}
                    handleUpdateStatus={handleUpdateStatus}
                    getStatusBadge={getStatusBadge}
                    getLeaveTypeBadge={getLeaveTypeBadge}
                    formatDate={formatDate}
                    canDelete={true}
                    loadData={loadData}
                  />
                </TabsContent>

                {(isRH || isAdmin || isManager) && (
                  <TabsContent value="all" className="mt-4">
                    <LeaveTable
                      requests={requests}
                      handleUpdateStatus={handleUpdateStatus}
                      getStatusBadge={getStatusBadge}
                      getLeaveTypeBadge={getLeaveTypeBadge}
                      formatDate={formatDate}
                      isRH={isRH || isAdmin || isManager}
                      canDelete={isRH || isAdmin}
                      showEmployee={true}
                      loadData={loadData}
                    />
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {/* Vacation Periods (CLT specific) */}
          <Card className="border-none shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-black flex items-center gap-2 text-white">
                <Umbrella className="h-5 w-5 text-blue-400" />
                Seu Saldo de Férias
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {periods.filter((p: any) => ['OPEN', 'PARTIALLY_USED', 'SCHEDULED'].includes(p.status)).length === 0 ? (
                <div className="py-8 text-center bg-white/5 rounded-2xl">
                  <p className="text-slate-400 text-xs font-medium">Nenhum saldo disponível no momento.</p>
                </div>
              ) : (
                periods.filter((p: any) => ['OPEN', 'PARTIALLY_USED', 'SCHEDULED'].includes(p.status)).map((period: any) => (
                  <div key={period.id} className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-blue-300 font-black uppercase tracking-widest mb-1">Aquisitivo Atual</p>
                        <p className="text-xs font-bold text-white/90">{formatDate(period.acquisitionStartDate)} — {formatDate(period.acquisitionEndDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black text-blue-400 leading-none">{period.remainingDays}</p>
                        <p className="text-[10px] font-bold text-blue-300/60 uppercase">dias restantes</p>
                      </div>
                    </div>

                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000"
                        style={{ width: `${Math.round(((period.usedDays + period.soldDays) / period.totalDays) * 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                      <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                      <p className="text-[10px] text-slate-300 leading-tight font-medium">
                        Concessão até <span className="text-white font-bold">{formatDate(period.concessionEndDate)}</span> para evitar multa CLT.
                      </p>
                    </div>
                  </div>
                ))
              )}

              <Button
                variant="outline"
                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white rounded-xl border-none font-bold"
                onClick={() => router.push('/vacation/request')}
              >
                Planejar Gozo de Férias
              </Button>
            </CardContent>
          </Card>

          {/* Indicators Hub */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest px-1">Indicadores Rápidos</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50">
                <p className="text-[10px] font-black text-amber-500 mb-1">PENDENTES</p>
                <p className="text-2xl font-black text-slate-900">{statistics.pendingRequests}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50">
                <p className="text-[10px] font-black text-blue-500 mb-1">AGENDADOS</p>
                <p className="text-2xl font-black text-slate-900">{statistics.upcomingVacations}</p>
              </div>
            </div>
          </div>

          {/* Expiring Vacations (RH/Manager only) */}
          {(isRH || isAdmin || isManager) && expiringPeriods.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-red-500 uppercase tracking-widest px-1 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Vencendo em breve
              </h3>
              <div className="space-y-3">
                {expiringPeriods.slice(0, 3).map((period) => (
                  <Card key={period.id} className="border-none shadow-sm bg-white overflow-hidden group">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{period.employeeName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Vence em {period.daysUntilExpiration} dias</p>
                        </div>
                        <Badge variant="destructive" className="bg-red-50 text-red-600 border-none text-[10px] font-black uppercase">Crítico</Badge>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-medium text-slate-500">
                        <span>Saldo: <strong>{period.remainingDays} dias</strong></span>
                        <span>Até {formatDate(period.concessionEndDate)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {expiringPeriods.length > 3 && (
                  <Button variant="ghost" className="text-xs text-slate-400 hover:text-red-500 font-bold p-0" onClick={() => router.push('/vacation/expiring')}>
                    Ver todos os {expiringPeriods.length} períodos em risco <ArrowRight className="ml-1 w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <Card className="border-none shadow-sm bg-blue-600 text-white rounded-3xl p-2">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <h4 className="font-bold">Analisar Atestado</h4>
              </div>
              <p className="text-xs text-blue-100 leading-relaxed font-medium">
                Use nossa IA para ler e validar atestados médicos instantaneamente.
              </p>
              <Button
                className="w-full bg-white text-blue-600 hover:bg-blue-50 font-black rounded-xl border-none shadow-lg active:scale-95 transition-all"
                onClick={() => router.push('/vacation/leave-request')}
              >
                Subir Documento
              </Button>
              <Button
                variant="ghost"
                className="w-full text-blue-100 hover:text-white hover:bg-white/10 text-[10px] font-bold"
                onClick={async () => {
                  if (confirm('Deseja iniciar a importação da base CID-10? Isso pode levar alguns segundos.')) {
                    try {
                      await leavesApi.importCids();
                      toast({ title: 'Importação Iniciada', description: 'A base CID-10 está sendo carregada no banco.' });
                    } catch (e) {
                      toast({ title: 'Erro ao importar', variant: 'destructive' });
                    }
                  }
                }}
              >
                Importar Base CID-10 (Admin)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Sub-componente para a tabela de licenças
function LeaveTable({ requests, handleUpdateStatus, getStatusBadge, getLeaveTypeBadge, formatDate, isRH, canDelete, showEmployee, loadData }: any) {
  const router = useRouter();
  const { user } = useAuthStore();

  return (
    <Table>
      <TableHeader className="bg-slate-50/50">
        <TableRow className="hover:bg-transparent border-none">
          {showEmployee && <TableHead className="px-8 font-black text-slate-500 uppercase text-[10px] tracking-wider">Colaborador</TableHead>}
          <TableHead className={cn("font-black text-slate-500 uppercase text-[10px] tracking-wider", !showEmployee && "px-8")}>Tipo</TableHead>
          <TableHead className="font-black text-slate-500 uppercase text-[10px] tracking-wider">Período</TableHead>
          <TableHead className="font-black text-slate-500 uppercase text-[10px] tracking-wider text-center">Dias</TableHead>
          <TableHead className="font-black text-slate-500 uppercase text-[10px] tracking-wider text-center">Status</TableHead>
          <TableHead className="px-8 font-black text-slate-500 uppercase text-[10px] tracking-wider text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showEmployee ? 6 : 5} className="h-32 text-center text-slate-400 font-medium">
              Nenhuma solicitação encontrada.
            </TableCell>
          </TableRow>
        ) : (
          requests.map((request: any) => (
            <TableRow key={request.id} className="hover:bg-slate-50/50 group transition-colors">
              {showEmployee && (
                <td className="px-8 py-4">
                  <p className="font-bold text-slate-900">{typeof request.employeeName === 'string' ? request.employeeName : 'Colaborador'}</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">ID: {request.id.toString().substring(0, 8)}</p>
                </td>
              )}
              <td className={cn("py-4", !showEmployee && "px-8")}>{getLeaveTypeBadge(request.type)}</td>
              <td className="py-4">
                <p className="text-sm font-bold text-slate-700">{formatDate(request.startDate)}</p>
                <div className="flex items-center gap-1">
                  <div className="h-[1px] flex-1 bg-slate-100" />
                  <span className="text-[8px] font-bold text-slate-300 uppercase">até</span>
                  <div className="h-[1px] flex-1 bg-slate-100" />
                </div>
                <p className="text-sm font-bold text-slate-700">{formatDate(request.endDate)}</p>
              </td>
              <td className="py-4 text-center">
                <span className="inline-flex items-center px-3 py-1 bg-slate-100 rounded-lg text-sm font-black text-slate-700 tabular-nums">
                  {request.daysCount} d
                </span>
              </td>
              <td className="py-4 text-center">{getStatusBadge(request.status)}</td>
              <td className="px-8 py-4 text-right">
                <div className="flex items-center justify-end gap-1 transition-opacity">
                  {request.status === 'PENDING' && isRH && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => handleUpdateStatus(request.id, 'APPROVED', request.type)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleUpdateStatus(request.id, 'REJECTED', request.type)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  {(canDelete || (request.status === 'PENDING' && request.employeeId === user?.id)) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={async () => {
                        if (confirm('Tem certeza que deseja remover esta solicitação?')) {
                          await leavesApi.deleteLeave(request.id);
                          loadData();
                        }
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900"
                    onClick={() => {
                      if (request.type === 'VACATION') {
                        router.push(`/vacation/requests/${request.id}`);
                      } else {
                        router.push(`/vacation/leave-request?id=${request.id}`);
                      }
                    }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
