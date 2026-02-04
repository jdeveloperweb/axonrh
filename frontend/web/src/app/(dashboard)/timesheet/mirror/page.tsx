'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Hourglass
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

export default function TimesheetMirrorPage() {
  const searchParams = useSearchParams();
  const employeeIdParam = searchParams.get('employee');

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(employeeIdParam);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timesheet, setTimesheet] = useState<DailySummary[]>([]);
  const [totals, setTotals] = useState<PeriodTotals | null>(null);

  // Load employees list
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const response = await employeesApi.list({ status: 'ACTIVE', size: 1000 });
        setEmployees(response.content);
      } catch (error) {
        console.error('Erro ao carregar colaboradores:', error);
      }
    };
    loadEmployees();
  }, [selectedEmployee]);

  // Calculate date range for selected month
  const getDateRange = useCallback(() => {
    const startDate = new Date(selectedYear, selectedMonth, 1);
    const endDate = new Date(selectedYear, selectedMonth + 1, 0);
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
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

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      setExporting(true);
      const { startDate, endDate } = getDateRange();
      const employeeId = selectedEmployee || 'me';

      const response = await fetch(
        `/api/v1/timesheet/timesheet/employee/${employeeId}/export?startDate=${startDate}&endDate=${endDate}&format=${format}`,
        { headers: { Accept: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `espelho-ponto-${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`Exportação ${format.toUpperCase()} concluída.`);
      } else {
        toast.error("Falha na exportação.");
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
            {employees.length > 0 && (
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
                    {employees.map((emp) => (
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
                            "transition-colors",
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
                            {day.firstEntry || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {day.breakStart && day.breakEnd ? (
                              <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                {day.breakStart} - {day.breakEnd}
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {day.lastExit || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1 font-mono font-medium">
                              {getBalanceIcon(balance)}
                              <span
                                className={cn(
                                  balance > 0 ? "text-emerald-600" :
                                    balance < 0 ? "text-rose-600" : "text-muted-foreground"
                                )}
                              >
                                {day.balanceFormatted}
                              </span>
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
              <span>Dia Completo</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span>Pendente/Ajuste</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span>Incompleto</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-rose-500" />
              <span>Falta</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
