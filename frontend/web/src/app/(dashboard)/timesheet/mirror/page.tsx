'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Sun,
  Moon,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Filter,
  Clock,
  Briefcase,
  Hourglass,
  FileEdit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { timesheetApi, DailySummary, PeriodTotals } from '@/lib/api/timesheet';
import { employeesApi, Employee } from '@/lib/api/employees';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ... imports
import { useAuthStore } from '@/stores/auth-store';

// ... existing code ...

export default function TimesheetMirrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeIdParam = searchParams.get('employee');
  const user = useAuthStore(state => state.user);

  // Check permissions
  // Check permissions
  const canViewAll = user?.roles?.some(role =>
    ['ADMIN', 'RH', 'GESTOR_RH', 'ANALISTA_DP'].includes(role.toUpperCase())
  ) ?? false;

  const canViewTeam = !canViewAll && (user?.roles?.some(role =>
    ['MANAGER', 'GESTOR', 'LIDER'].includes(role.toUpperCase())
  ) ?? false);

  const canViewOthers = canViewAll || canViewTeam;

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(employeeIdParam);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timesheet, setTimesheet] = useState<DailySummary[]>([]);
  const [totals, setTotals] = useState<PeriodTotals | null>(null);

  // Load employees list (All for admins, Subordinates for managers)
  useEffect(() => {
    const loadEmployees = async () => {
      if (!canViewOthers) return;

      try {
        if (canViewAll) {
          const response = await employeesApi.list({ status: 'ACTIVE', size: 1000 });
          setEmployees(response.content);
        } else if (canViewTeam && user?.id) {
          const subs = await employeesApi.getSubordinates(user.id);
          setEmployees(subs);
        }
      } catch (error) {
        console.error('Erro ao carregar colaboradores:', error);
        toast.error('Erro ao carregar lista de colaboradores.');
      }
    };
    loadEmployees();
  }, [canViewOthers, canViewAll, canViewTeam, user?.id]);

  // Force selectedEmployee to 'me' if lacking permissions
  useEffect(() => {
    if (!canViewOthers && selectedEmployee !== 'me' && selectedEmployee !== user?.id) {
      setSelectedEmployee('me');
    }
  }, [canViewOthers, user, selectedEmployee]);

  // Calculate date range for selected month (Fix Timezone issues)
  const getDateRange = useCallback(() => {
    const start = new Date(selectedYear, selectedMonth, 1);
    const end = new Date(selectedYear, selectedMonth + 1, 0);

    // Adjust for timezone to ensure we send the correct YYYY-MM-DD
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      startDate: formatDate(start),
      endDate: formatDate(end),
    };
  }, [selectedMonth, selectedYear]);

  // Load timesheet data
  const loadTimesheet = useCallback(async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();
      const employeeId = selectedEmployee || 'me';

      const [timesheetData, totalsData] = await Promise.all([
        timesheetApi.getTimesheet(employeeId, startDate, endDate),
        timesheetApi.getPeriodTotals(employeeId, startDate, endDate),
      ]);

      setTimesheet(timesheetData);
      setTotals(totalsData);
    } catch (error) {
      console.error('Erro ao carregar espelho de ponto:', error);
      toast.error('Erro ao carregar dados do espelho.');
    } finally {
      setLoading(false);
    }
  }, [getDateRange, selectedEmployee]);

  useEffect(() => {
    loadTimesheet();
  }, [loadTimesheet]);

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel', isMass: boolean = false) => {
    try {
      setExporting(true);
      const { startDate, endDate } = getDateRange();
      const employeeId = selectedEmployee || 'me';

      // Se for exportação em massa e for apenas gestor (não admin/rh), filtra pelo ID do gestor
      const managerIdFilter = (isMass && canViewTeam && !canViewAll) ? user?.id : undefined;

      const blob = await (isMass
        ? timesheetApi.exportMassTimesheet(startDate, endDate, format, managerIdFilter)
        : timesheetApi.exportTimesheet(employeeId, startDate, endDate, format));

      if (blob) {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = isMass
          ? `espelho-ponto-massa-${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
          : `espelho-ponto-${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
        toast.success(`Exportação ${format.toUpperCase()} concluída.`);
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error("Erro ao realizar exportação.");
    } finally {
      setExporting(false);
    }
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month, 1).toLocaleDateString('pt-BR', { month: 'long' });
  };

  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (balance < 0) return <TrendingDown className="h-4 w-4 text-rose-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getDayStatusIcon = (day: DailySummary) => {
    if (day.isHoliday) return <Sun className="h-4 w-4 text-amber-500" />;
    if (day.isAbsent) return <XCircle className="h-4 w-4 text-rose-500" />;
    if (day.hasPendingRecords) return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    if (day.hasMissingRecords) return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    if (day.workedMinutes > 0) return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    return null;
  };

  const isWeekend = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 space-y-8 animate-in fade-in duration-500 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Espelho de Ponto</h1>
          <div className="flex items-center gap-2 mt-1">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <p className="text-muted-foreground capitalize">
              {getMonthName(selectedMonth)} de {selectedYear}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={() => (window.location.href = '/timesheet/adjustments?new=true')} className="flex-1 md:flex-none border-orange-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300">
            <Clock className="mr-2 h-4 w-4" />
            Solicitar Ajuste
          </Button>
          {canViewOthers && (
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf', true)} disabled={exporting} className="flex-1 md:flex-none">
              <Download className="mr-2 h-4 w-4" />
              Exportação em Massa (PDF)
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')} disabled={exporting} className="flex-1 md:flex-none">
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} disabled={exporting} className="flex-1 md:flex-none">
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filters & Navigation */}
      <Card className="border-none shadow-sm bg-muted/30">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Employee Selector (for managers) */}
            {canViewOthers && employees.length > 0 && (
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select
                  value={selectedEmployee || 'me'}
                  onValueChange={(value) => setSelectedEmployee(value === 'me' ? null : value)}
                >
                  <SelectTrigger className="w-full md:w-[280px] bg-background">
                    <SelectValue placeholder="Selecione o colaborador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="me">Meu espelho de ponto</SelectItem>
                    {employees
                      .filter((emp) => emp.id !== user?.id)
                      .map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.fullName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Month Navigation */}
            <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto justify-between md:justify-end bg-background p-1 rounded-lg border shadow-sm">
              <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 px-4">
                <span className="font-semibold capitalize min-w-[140px] text-center">
                  {getMonthName(selectedMonth)} {selectedYear}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                disabled={
                  selectedYear === new Date().getFullYear() &&
                  selectedMonth === new Date().getMonth()
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {totals && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Trabalhado</p>
                <Briefcase className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold">{totals.workedFormatted}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Horas Extras</p>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                +{totals.overtimeFormatted}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Horas Devidas</p>
                <TrendingDown className="h-4 w-4 text-rose-500" />
              </div>
              <div className="text-2xl font-bold text-rose-600">
                -{totals.deficitFormatted}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Noturno</p>
                <Moon className="h-4 w-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {totals.nightShiftFormatted}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Timesheet Table */}
      <Card className="border shadow-md overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4 border-b">
          <CardTitle>Detalhamento Diário</CardTitle>
          <CardDescription>
            Histórico detalhado de entradas e saídas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : timesheet.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground">Nenhum registro encontrado para este período.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[100px] font-semibold">Data</TableHead>
                    <TableHead className="w-[80px] font-semibold">Dia</TableHead>
                    <TableHead className="text-center font-semibold">1ª Entrada</TableHead>
                    <TableHead className="text-center font-semibold text-muted-foreground/50">Intervalo</TableHead>
                    <TableHead className="text-center font-semibold">1ª Saída</TableHead>
                    <TableHead className="text-center font-semibold text-primary">Saldo</TableHead>
                    <TableHead className="text-center font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TooltipProvider>
                    {timesheet.map((day) => {
                      const weekend = isWeekend(day.summaryDate);
                      const balance = day.overtimeMinutes - day.deficitMinutes;

                      return (
                        <TableRow
                          key={day.id}
                          className={cn(
                            "transition-colors group",
                            day.summaryDate === new Date().toISOString().split('T')[0] && "bg-primary/5 ring-1 ring-primary/20 ring-inset",
                            weekend ? 'bg-muted/20 hover:bg-muted/40' : 'hover:bg-muted/30',
                            (day.isHoliday || day.isAbsent) && "bg-muted/30"
                          )}
                        >
                          <TableCell className="font-medium">
                            {new Date(day.summaryDate + 'T00:00:00').toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </TableCell>
                          <TableCell className="capitalize text-muted-foreground text-xs">
                            {day.dayOfWeek.substring(0, 3)}
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            <div className="flex flex-col items-center">
                              <span className={cn(!day.firstEntry && "text-muted-foreground/30")}>
                                {day.firstEntry ? day.firstEntry.substring(0, 5) : '--:--'}
                              </span>
                              {day.scheduledEntry && (
                                <span className="text-[10px] text-muted-foreground/50 font-sans">
                                  exp. {day.scheduledEntry.substring(0, 5)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              {day.breakStart && day.breakEnd ? (
                                <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                  {day.breakStart.substring(0, 5)} - {day.breakEnd.substring(0, 5)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/30">--:--</span>
                              )}
                              {day.scheduledBreakStart && day.scheduledBreakEnd && (
                                <span className="text-[10px] text-muted-foreground/50 font-sans mt-0.5">
                                  exp. {day.scheduledBreakStart.substring(0, 5)} - {day.scheduledBreakEnd.substring(0, 5)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            <div className="flex flex-col items-center">
                              <span className={cn(!day.lastExit && "text-muted-foreground/30")}>
                                {day.lastExit ? day.lastExit.substring(0, 5) : '--:--'}
                              </span>
                              {day.scheduledExit && (
                                <span className="text-[10px] text-muted-foreground/50 font-sans">
                                  exp. {day.scheduledExit.substring(0, 5)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="flex items-center gap-1 font-mono font-medium">
                                {getBalanceIcon(balance)}
                                <span
                                  className={cn(
                                    balance > 0 ? "text-emerald-600" :
                                      balance < 0 ? "text-rose-600" : "text-muted-foreground"
                                  )}
                                >
                                  {balance < 0 ? '-' : balance > 0 ? '+' : ''}{day.balanceFormatted}
                                </span>
                              </div>
                              {day.expectedWorkMinutes > 0 && day.workedMinutes === 0 && !day.isAbsent && !day.isHoliday && (
                                <span className="text-[9px] text-rose-400 font-sans uppercase">Falta</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex justify-center cursor-pointer hover:bg-muted p-1 rounded-full w-8 h-8 items-center mx-auto transition-colors">
                                  {getDayStatusIcon(day)}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {day.isHoliday && day.holidayName}
                                {day.isAbsent && (day.absenceType || 'Falta')}
                                {day.hasPendingRecords && 'Registros pendentes de aprovação'}
                                {day.hasMissingRecords && 'Registros incompletos'}
                                {!day.isHoliday &&
                                  !day.isAbsent &&
                                  !day.hasPendingRecords &&
                                  !day.hasMissingRecords &&
                                  day.workedMinutes > 0 &&
                                  'Dia OK'}
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-right">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                  onClick={() => {
                                    // Redireciona para a página de ajustes com os parâmetros pré-preenchidos
                                    const empId = selectedEmployee || 'me';
                                    router.push(`/timesheet/adjustments?employee=${empId}&date=${day.summaryDate}`);
                                  }}
                                >
                                  <FileEdit className="h-4 w-4 mr-1" />
                                  Ajustar
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Solicitar ajuste para este dia
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TooltipProvider>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="border-none shadow-sm bg-muted/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Dia OK</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>Hoje</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span>Pendente/Ajuste</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-400" />
              <span>Falta / Ausência</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-400/50" />
              <span>Feriado</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
