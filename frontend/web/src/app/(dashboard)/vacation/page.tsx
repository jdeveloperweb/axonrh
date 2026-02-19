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
  Brain,
  Filter
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterDay, setFilterDay] = useState<string>('');
  const [filterMonthStart, setFilterMonthStart] = useState<string>('ALL');
  const [filterMonthEnd, setFilterMonthEnd] = useState<string>('ALL');
  const [filterSector, setFilterSector] = useState<string>('ALL');

  const [departments, setDepartments] = useState<any[]>([]);
  const [employeesMap, setEmployeesMap] = useState<Record<string, any>>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Persistence logic for filters
  useEffect(() => {
    const savedType = localStorage.getItem('vacation_filter_type');
    const savedStatus = localStorage.getItem('vacation_filter_status');
    const savedDay = localStorage.getItem('vacation_filter_day');
    const savedMonthStart = localStorage.getItem('vacation_filter_month_start');
    const savedMonthEnd = localStorage.getItem('vacation_filter_month_end');
    const savedSector = localStorage.getItem('vacation_filter_sector');

    if (savedType) setFilterType(savedType);
    if (savedStatus) setFilterStatus(savedStatus);
    if (savedDay) setFilterDay(savedDay);
    if (savedMonthStart) setFilterMonthStart(savedMonthStart);
    if (savedMonthEnd) setFilterMonthEnd(savedMonthEnd);
    if (savedSector) setFilterSector(savedSector);
  }, []);

  useEffect(() => {
    localStorage.setItem('vacation_filter_type', filterType);
    localStorage.setItem('vacation_filter_status', filterStatus);
    localStorage.setItem('vacation_filter_day', filterDay);
    localStorage.setItem('vacation_filter_month_start', filterMonthStart);
    localStorage.setItem('vacation_filter_month_end', filterMonthEnd);
    localStorage.setItem('vacation_filter_sector', filterSector);
  }, [filterType, filterStatus, filterDay, filterMonthStart, filterMonthEnd, filterSector]);

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

      // Dynamic imports to avoid issues if files are not ready
      const { employeesApi } = await import('@/lib/api/employees');

      const [
        periodsData,
        vacRequestsData,
        leavesData,
        myVacRequests,
        myLeavesData,
        statsData,
        activeData,
        expiringData,
        deptsData,
        emplsData
      ] = await Promise.all([
        vacationApi.getMyPeriods().catch(() => []),
        (isRH || isAdmin || isManager) ? vacationApi.getPendingRequests(0, 100).then(r => r.content).catch(() => []) : Promise.resolve([]),
        (isRH || isAdmin || isManager) ? leavesApi.getLeaves().catch(() => []) : Promise.resolve([]),
        vacationApi.getMyRequests().catch(() => []),
        (user?.employeeId || user?.id) ? leavesApi.getMyLeaves(user?.employeeId || user?.id || '').catch(() => []) : Promise.resolve([]),
        vacationApi.getStatistics().catch(() => ({})),
        leavesApi.getActiveLeaves().catch(() => []),
        (isRH || isAdmin || isManager) ? vacationApi.getExpiringPeriods(90).catch(() => []) : Promise.resolve([]),
        (isRH || isAdmin || isManager) ? employeesApi.getDepartments().catch(() => []) : Promise.resolve([]),
        (isRH || isAdmin || isManager) ? employeesApi.list({ page: 0, size: 2000 }).then(r => r.content).catch(() => []) : Promise.resolve([])
      ]);

      setPeriods(periodsData);
      setDepartments(deptsData);

      const eMap: Record<string, any> = {};
      emplsData?.forEach((e: any) => {
        eMap[e.id] = e;
      });
      setEmployeesMap(eMap);

      // Merge all for management
      const mergedAll = [
        ...vacRequestsData.map((r: any) => ({ ...r, type: r.type || 'VACATION' })),
        ...leavesData.map((r: any) => ({ ...r, type: r.type || 'LEAVE' })) // Ensure fallback
      ].map((r: any) => {
        // Enriquecer com dados do setor se disponível
        const emp = eMap[r.employeeId];
        return {
          ...r,
          employeeDepartmentId: emp?.department?.id,
          employeeDepartmentName: emp?.department?.name
        };
      }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

      setRequests(mergedAll);

      // Merge personal
      const mergedMine = [
        ...myVacRequests.map((r: any) => ({ ...r, type: r.type || 'VACATION' })),
        ...myLeavesData.map((r: any) => ({ ...r, type: r.type || 'LEAVE' }))
      ].map((r: any) => {
        const emp = eMap[r.employeeId];
        return {
          ...r,
          employeeDepartmentId: emp?.department?.id,
          employeeDepartmentName: emp?.department?.name
        };
      }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

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

  const applyFilters = useCallback((reqs: any[]) => {
    return reqs.filter(r => {
      const matchesType = filterType === 'ALL' || r.type === filterType;
      const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;

      const startDate = new Date(r.startDate + 'T00:00:00');
      const endDate = new Date(r.endDate + 'T00:00:00');

      const matchesMonthStart = filterMonthStart === 'ALL' || (startDate.getMonth() + 1).toString() === filterMonthStart;
      const matchesMonthEnd = filterMonthEnd === 'ALL' || (endDate.getMonth() + 1).toString() === filterMonthEnd;

      let matchesDay = true;
      if (filterDay) {
        const filterDate = new Date(filterDay + 'T00:00:00');
        matchesDay = filterDate >= startDate && filterDate <= endDate;
      }

      const matchesSector = filterSector === 'ALL' || r.employeeDepartmentId === filterSector;

      return matchesType && matchesStatus && matchesMonthStart && matchesMonthEnd && matchesDay && matchesSector;
    });
  }, [filterType, filterStatus, filterDay, filterMonthStart, filterMonthEnd, filterSector]);

  const clearFilters = () => {
    setFilterType('ALL');
    setFilterStatus('ALL');
    setFilterDay('');
    setFilterMonthStart('ALL');
    setFilterMonthEnd('ALL');
    setFilterSector('ALL');
  };

  const isFilterActive = filterType !== 'ALL' || filterStatus !== 'ALL' || filterDay !== '' || filterMonthStart !== 'ALL' || filterMonthEnd !== 'ALL' || filterSector !== 'ALL';

  const getStatusBadge = (status: string) => {
    const config: any = {
      PENDING: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      MANAGER_APPROVED: { label: 'Aprov. Gestor', className: 'bg-blue-100 text-blue-800', icon: CheckCircle2 },
      APPROVED: { label: 'Aprovada', className: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      REJECTED: { label: 'Rejeitada', className: 'bg-red-100 text-red-800', icon: XCircle },
      CANCELLED: { label: 'Cancelada', className: 'bg-gray-100 text-gray-800', icon: XCircle },
      SCHEDULED: { label: 'Agendada', className: 'bg-purple-100 text-purple-800', icon: CalendarCheck2 },
      IN_PROGRESS: { label: 'Em Andamento', className: 'bg-indigo-100 text-indigo-800', icon: Plane },
      COMPLETED: { label: 'Concluída', className: 'bg-slate-100 text-slate-800', icon: CheckCircle2 },
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
      BEREAVEMENT: { label: 'Licença Nojo', className: 'bg-slate-100 text-slate-700', icon: Heart },
      MARRIAGE: { label: 'Licença Gala', className: 'bg-pink-100 text-pink-700', icon: Heart },
      MILITARY: { label: 'Serviço Militar', className: 'bg-slate-100 text-slate-700', icon: Briefcase },
      UNPAID: { label: 'Não Remunerada', className: 'bg-gray-100 text-gray-700', icon: DollarSign },
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
    <div className="p-6 space-y-8 animate-in fade-in duration-500 w-full font-inter">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Licenças e Afastamentos</h1>
          <p className="text-slate-500 font-medium">
            Controle unificado de férias, licenças médicas e outros afastamentos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => router.push('/vacation/request')}
            className="flex items-center gap-2 px-6 bg-[var(--color-secondary)] text-white rounded-xl hover:opacity-90 transition-all shadow-lg active:scale-95 border-none font-bold"
          >
            <Umbrella className="w-4 h-4" />
            Nova Férias
          </Button>

          <Button
            onClick={() => router.push('/vacation/leave-request')}
            className="flex items-center gap-2 px-6 bg-[var(--color-primary)] text-white rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[var(--color-primary)]/10 active:scale-95 border-none font-bold"
          >
            <Plus className="w-4 h-4" />
            Nova Licença
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push('/vacation/approvals')}
            className="flex items-center gap-2 border-[var(--color-border)] rounded-xl hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] font-bold px-6"
          >
            <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />
            Aprovações
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">

          {/* Active Absences Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-[var(--color-text-primary)] flex items-center gap-2">
              <Users className="h-5 w-5 text-[var(--color-primary)]" />
              Quem está afastado hoje
              <Badge variant="secondary" className="ml-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-none font-bold">
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
                  <Card key={leaf.id} className="border-none shadow-sm bg-white hover:shadow-md transition-all overflow-hidden group rounded-2xl">
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
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-black">Histórico e Gerenciamento</CardTitle>
                    <CardDescription className="font-medium">Visualize e controle todas as solicitações</CardDescription>
                  </div>
                  <div className="flex gap-2 items-center">
                    {isFilterActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 font-bold gap-2 rounded-xl transition-all h-9 px-4"
                      >
                        <XCircle className="h-4 w-4" />
                        Limpar Filtros
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className={cn(
                        "rounded-xl h-9 px-4 font-bold gap-2",
                        showAdvancedFilters ? "bg-blue-50 text-blue-600" : "text-slate-500"
                      )}
                    >
                      <Filter className="h-4 w-4" />
                      Filtros
                    </Button>

                    <Button variant="ghost" size="sm" onClick={loadData} className="rounded-xl h-9 w-9 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100" title="Atualizar">
                      <History className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {showAdvancedFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 px-1">Status</label>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="bg-white border-slate-200 rounded-xl h-10 text-xs font-bold font-inter">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl overflow-hidden">
                          <SelectItem value="ALL" className="font-bold text-xs py-2.5">Todos os Status</SelectItem>
                          <SelectItem value="PENDING" className="font-bold text-xs py-2.5">Pendente</SelectItem>
                          <SelectItem value="MANAGER_APPROVED" className="font-bold text-xs py-2.5">Aprov. Gestor</SelectItem>
                          <SelectItem value="APPROVED" className="font-bold text-xs py-2.5">Aprovada</SelectItem>
                          <SelectItem value="SCHEDULED" className="font-bold text-xs py-2.5">Agendada</SelectItem>
                          <SelectItem value="IN_PROGRESS" className="font-bold text-xs py-2.5">Em Andamento</SelectItem>
                          <SelectItem value="COMPLETED" className="font-bold text-xs py-2.5">Concluída</SelectItem>
                          <SelectItem value="REJECTED" className="font-bold text-xs py-2.5">Rejeitada</SelectItem>
                          <SelectItem value="CANCELLED" className="font-bold text-xs py-2.5">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 px-1">Tipo</label>
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="bg-white border-slate-200 rounded-xl h-10 text-xs font-bold font-inter">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl overflow-hidden">
                          <SelectItem value="ALL" className="font-bold text-xs py-2.5">Todos os Tipos</SelectItem>
                          <SelectItem value="VACATION" className="font-bold text-xs py-2.5">Férias</SelectItem>
                          <SelectItem value="MEDICAL" className="font-bold text-xs py-2.5">Licença Médica</SelectItem>
                          <SelectItem value="MATERNITY" className="font-bold text-xs py-2.5">Maternidade</SelectItem>
                          <SelectItem value="PATERNITY" className="font-bold text-xs py-2.5">Paternidade</SelectItem>
                          <SelectItem value="BEREAVEMENT" className="font-bold text-xs py-2.5">Luto / Óbito</SelectItem>
                          <SelectItem value="MARRIAGE" className="font-bold text-xs py-2.5">Casamento</SelectItem>
                          <SelectItem value="MILITARY" className="font-bold text-xs py-2.5">Serviço Militar</SelectItem>
                          <SelectItem value="UNPAID" className="font-bold text-xs py-2.5">Não Remunerada</SelectItem>
                          <SelectItem value="OTHER" className="font-bold text-xs py-2.5">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 px-1">Setor / Departamento</label>
                      <Select value={filterSector} onValueChange={setFilterSector}>
                        <SelectTrigger className="bg-white border-slate-200 rounded-xl h-10 text-xs font-bold font-inter">
                          <SelectValue placeholder="Setor" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl overflow-hidden">
                          <SelectItem value="ALL" className="font-bold text-xs py-2.5">Todos os Setores</SelectItem>
                          {departments.map(d => (
                            <SelectItem key={d.id} value={d.id} className="font-bold text-xs py-2.5">{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 px-1">Dia Específico</label>
                      <input
                        type="date"
                        value={filterDay}
                        onChange={(e) => setFilterDay(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl h-10 px-3 text-xs font-bold font-inter focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 px-1">Mês Início</label>
                      <Select value={filterMonthStart} onValueChange={setFilterMonthStart}>
                        <SelectTrigger className="bg-white border-slate-200 rounded-xl h-10 text-xs font-bold font-inter">
                          <SelectValue placeholder="Mês Início" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl overflow-hidden">
                          <SelectItem value="ALL" className="font-bold text-xs py-2.5">Qualquer Mês</SelectItem>
                          {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (
                            <SelectItem key={m} value={(i + 1).toString()} className="font-bold text-xs py-2.5">{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 px-1">Mês Término</label>
                      <Select value={filterMonthEnd} onValueChange={setFilterMonthEnd}>
                        <SelectTrigger className="bg-white border-slate-200 rounded-xl h-10 text-xs font-bold font-inter">
                          <SelectValue placeholder="Mês Término" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl overflow-hidden">
                          <SelectItem value="ALL" className="font-bold text-xs py-2.5">Qualquer Mês</SelectItem>
                          {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (
                            <SelectItem key={m} value={(i + 1).toString()} className="font-bold text-xs py-2.5">{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue={isRH || isAdmin || isManager ? "all" : "mine"} className="w-full">
                <div className="px-8 pt-4">
                  <TabsList className="bg-slate-100 rounded-xl p-1 h-12">
                    <TabsTrigger value="mine" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-bold transition-all">Minhas Solicitações</TabsTrigger>
                    {(isRH || isAdmin || isManager) && (
                      <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-bold transition-all">Gestão da Empresa</TabsTrigger>
                    )}
                  </TabsList>
                </div>

                <TabsContent value="mine" className="mt-4">
                  <LeaveTable
                    requests={applyFilters(myRequests)}
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
                      requests={applyFilters(requests)}
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
          <Card className="border-none shadow-lg bg-gradient-to-br from-[var(--color-secondary-dark)] to-[var(--color-secondary)] text-white rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-black flex items-center gap-2 text-white">
                <Umbrella className="h-5 w-5 text-[var(--color-primary-light)]" />
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
          {(isAdmin || isRH) && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest px-1">Indicadores Rápidos</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-[var(--color-border)]">
                  <p className="text-[10px] font-black text-[var(--color-warning)] mb-1">PENDENTES</p>
                  <p className="text-2xl font-black text-[var(--color-text-primary)]">{statistics.pendingRequests}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-[var(--color-border)]">
                  <p className="text-[10px] font-black text-[var(--color-primary)] mb-1">AGENDADOS</p>
                  <p className="text-2xl font-black text-[var(--color-text-primary)]">{statistics.upcomingVacations}</p>
                </div>
              </div>
            </div>
          )}

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
                  <Button variant="ghost" className="text-xs text-slate-400 hover:text-red-500 font-bold p-0" onClick={() => router.push('/vacation/admin')}>
                    Ver todos os {expiringPeriods.length} períodos em risco <ArrowRight className="ml-1 w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <Card className="border-none shadow-sm bg-[var(--color-primary)] text-white rounded-3xl p-2">
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
                className="w-full bg-white text-[var(--color-primary)] hover:bg-white/90 font-black rounded-xl border-none shadow-lg active:scale-95 transition-all"
                onClick={() => router.push('/vacation/leave-request')}
              >
                Subir Documento
              </Button>
              {isAdmin && (
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
              )}
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

  const isAdmin = user?.roles?.some((r: string) => r.includes('ADMIN')) || false;

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

                  {((request.status === 'APPROVED' ? isAdmin : (canDelete || (request.status === 'PENDING' && request.employeeId === user?.id)))) && (
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
