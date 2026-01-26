'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Sun,
  Moon,
  Coffee,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { timesheetApi, DailySummary, PeriodTotals } from '@/lib/api/timesheet';
import { employeesApi, Employee } from '@/lib/api/employees';

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
        if (!selectedEmployee && response.content.length > 0) {
          // If no employee selected and user is a manager, select first employee
          // Otherwise, API will return current user's data
        }
      } catch (error) {
        console.error('Erro ao carregar colaboradores:', error);
      }
    };
    loadEmployees();
  }, []);

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

      // If no employee selected, API returns current user's timesheet
      const employeeId = selectedEmployee || 'me';

      const [timesheetData, totalsData] = await Promise.all([
        timesheetApi.getTimesheet(employeeId, startDate, endDate),
        timesheetApi.getPeriodTotals(employeeId, startDate, endDate),
      ]);

      setTimesheet(timesheetData);
      setTotals(totalsData);
    } catch (error) {
      console.error('Erro ao carregar espelho de ponto:', error);
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

      // Call export endpoint
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
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
    } finally {
      setExporting(false);
    }
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month, 1).toLocaleDateString('pt-BR', { month: 'long' });
  };

  const formatMinutes = (minutes: number | undefined) => {
    if (!minutes) return '-';
    const hours = Math.floor(Math.abs(minutes) / 60);
    const mins = Math.abs(minutes) % 60;
    const sign = minutes < 0 ? '-' : '';
    return `${sign}${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (balance < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getDayStatusIcon = (day: DailySummary) => {
    if (day.isHoliday) {
      return <Sun className="h-4 w-4 text-yellow-500" />;
    }
    if (day.isAbsent) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (day.hasPendingRecords) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    if (day.hasMissingRecords) {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }
    if (day.workedMinutes > 0) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return null;
  };

  const isWeekend = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Espelho de Ponto</h1>
          <p className="text-muted-foreground">
            Visualize e exporte seu histórico de marcações
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleExport('excel')} disabled={exporting}>
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')} disabled={exporting}>
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Employee Selector (for managers) */}
            {employees.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={selectedEmployee || 'me'}
                  onValueChange={(value) => setSelectedEmployee(value === 'me' ? null : value)}
                >
                  <SelectTrigger className="w-[250px]">
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
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md min-w-[180px] justify-center">
                <Calendar className="h-4 w-4" />
                <span className="font-medium capitalize">
                  {getMonthName(selectedMonth)} {selectedYear}
                </span>
              </div>
              <Button
                variant="outline"
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totals.workedFormatted}</div>
              <p className="text-xs text-muted-foreground">Horas Trabalhadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                +{totals.overtimeFormatted}
              </div>
              <p className="text-xs text-muted-foreground">Horas Extras</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                -{totals.deficitFormatted}
              </div>
              <p className="text-xs text-muted-foreground">Horas Devidas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">
                {totals.nightShiftFormatted}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Moon className="h-3 w-3" /> Adicional Noturno
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">
                {totals.lateArrivalFormatted}
              </div>
              <p className="text-xs text-muted-foreground">Atrasos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{totals.absences}</div>
              <p className="text-xs text-muted-foreground">Faltas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Timesheet Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento Diário</CardTitle>
          <CardDescription>
            Clique em um dia para ver os registros detalhados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : timesheet.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Nenhum registro encontrado para o período selecionado.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Data</TableHead>
                    <TableHead className="w-[100px]">Dia</TableHead>
                    <TableHead className="text-center">Entrada</TableHead>
                    <TableHead className="text-center">Início Int.</TableHead>
                    <TableHead className="text-center">Fim Int.</TableHead>
                    <TableHead className="text-center">Saída</TableHead>
                    <TableHead className="text-center">Trabalhado</TableHead>
                    <TableHead className="text-center">Extra/Devida</TableHead>
                    <TableHead className="text-center">Status</TableHead>
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
                          className={`
                            cursor-pointer hover:bg-muted/50
                            ${weekend ? 'bg-muted/30' : ''}
                            ${day.isHoliday ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}
                            ${day.isAbsent ? 'bg-red-50 dark:bg-red-950/20' : ''}
                          `}
                        >
                          <TableCell className="font-medium">
                            {new Date(day.summaryDate + 'T00:00:00').toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </TableCell>
                          <TableCell className="capitalize text-muted-foreground">
                            {day.dayOfWeek.substring(0, 3)}
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {day.firstEntry || '-'}
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {day.breakStart || '-'}
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {day.breakEnd || '-'}
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {day.lastExit || '-'}
                          </TableCell>
                          <TableCell className="text-center font-mono font-medium">
                            {day.workedFormatted}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {getBalanceIcon(balance)}
                              <span
                                className={`font-mono ${
                                  balance > 0
                                    ? 'text-green-600'
                                    : balance < 0
                                    ? 'text-red-600'
                                    : ''
                                }`}
                              >
                                {day.balanceFormatted}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Tooltip>
                              <TooltipTrigger>
                                {getDayStatusIcon(day)}
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
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Dia OK</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span>Pendente</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span>Incompleto</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>Falta</span>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-yellow-500" />
              <span>Feriado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-muted/30 rounded" />
              <span>Final de semana</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
