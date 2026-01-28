'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Minus,
  DollarSign,
  Timer,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { timesheetApi, OvertimeBankSummary, OvertimeBankMovement } from '@/lib/api/timesheet';
import { employeesApi, Employee } from '@/lib/api/employees';

export default function OvertimeBankPage() {
  const searchParams = useSearchParams();
  const employeeIdParam = searchParams.get('employee');

  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(employeeIdParam);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [summary, setSummary] = useState<OvertimeBankSummary | null>(null);
  const [movements, setMovements] = useState<OvertimeBankMovement[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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
  }, []);

  // Calculate date range
  const getDateRange = useCallback(() => {
    const startDate = `${selectedYear}-01-01`;
    const endDate = `${selectedYear}-12-31`;
    return { startDate, endDate };
  }, [selectedYear]);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const employeeId = selectedEmployee || 'me';
      const { startDate, endDate } = getDateRange();

      const [summaryData, movementsData] = await Promise.all([
        timesheetApi.getOvertimeSummary(employeeId, startDate, endDate),
        timesheetApi.getOvertimeMovements(employeeId, 0, 100),
      ]);

      setSummary(summaryData);
      setMovements(movementsData.content);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedEmployee, getDateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);



  const getTypeConfig = (type: OvertimeBankMovement['type']) => {
    const configs = {
      CREDIT: {
        label: 'Crédito',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: Plus,
      },
      DEBIT: {
        label: 'Débito',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        icon: Minus,
      },
      ADJUSTMENT: {
        label: 'Ajuste',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        icon: RefreshCw,
      },
      EXPIRATION: {
        label: 'Expiração',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: AlertTriangle,
      },
      PAYOUT: {
        label: 'Pagamento',
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        icon: DollarSign,
      },
    };
    return configs[type];
  };

  // Prepare chart data
  const getChartData = () => {
    const monthlyData: { [key: string]: { credit: number; debit: number; balance: number } } = {};
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
    ];

    months.forEach((month, index) => {
      monthlyData[month] = { credit: 0, debit: 0, balance: 0 };
    });

    movements.forEach((movement) => {
      const date = new Date(movement.referenceDate);
      const monthIndex = date.getMonth();
      const month = months[monthIndex];

      if (movement.type === 'CREDIT') {
        monthlyData[month].credit += movement.minutes;
      } else if (['DEBIT', 'PAYOUT', 'EXPIRATION'].includes(movement.type)) {
        monthlyData[month].debit += Math.abs(movement.minutes);
      }
    });

    let runningBalance = 0;
    return months.map((month) => {
      runningBalance += monthlyData[month].credit - monthlyData[month].debit;
      return {
        month,
        credit: Math.round(monthlyData[month].credit / 60 * 10) / 10, // Convert to hours
        debit: Math.round(monthlyData[month].debit / 60 * 10) / 10,
        balance: Math.round(runningBalance / 60 * 10) / 10,
      };
    });
  };

  const chartData = getChartData();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banco de Horas</h1>
          <p className="text-muted-foreground">
            Acompanhe seu saldo e movimentações
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Employee Selector */}
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
                    <SelectItem value="me">Meu banco de horas</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Year Navigation */}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedYear(selectedYear - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md min-w-[120px] justify-center">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">{selectedYear}</span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedYear(selectedYear + 1)}
                disabled={selectedYear >= new Date().getFullYear()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : summary ? (
        <>
          {/* Balance Card */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <p className="text-sm text-muted-foreground mb-1">Saldo Atual</p>
                  <div className="flex items-center gap-3">
                    <div
                      className={`text-5xl font-bold font-mono ${summary.isPositive ? 'text-green-600' : 'text-red-600'
                        }`}
                    >
                      {summary.currentBalanceFormatted}
                    </div>
                    {summary.isPositive ? (
                      <TrendingUp className="h-10 w-10 text-green-500" />
                    ) : (
                      <TrendingDown className="h-10 w-10 text-red-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {summary.isPositive
                      ? `Você tem ${summary.currentBalanceFormatted} de horas disponíveis`
                      : `Você deve ${summary.currentBalanceFormatted.replace('-', '')} de horas`}
                  </p>
                </div>

                {/* Expiring Warning */}
                {summary.expiringMinutes > 0 && (
                  <div className="p-4 bg-yellow-100 dark:bg-yellow-950/50 rounded-lg border border-yellow-200 dark:border-yellow-900">
                    <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">Horas a vencer</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mt-1">
                      {summary.expiringFormatted}
                    </p>
                    {summary.daysUntilNextExpiration && (
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        em {summary.daysUntilNextExpiration} dias
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Créditos</p>
                    <p className="text-2xl font-bold text-green-600">
                      +{summary.totalCreditFormatted}
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-full">
                    <ArrowUpRight className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Débitos</p>
                    <p className="text-2xl font-bold text-blue-600">
                      -{summary.totalDebitFormatted}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-full">
                    <ArrowDownRight className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Horas Expiradas</p>
                    <p className="text-2xl font-bold text-red-600">
                      {summary.totalExpiredFormatted}
                    </p>
                  </div>
                  <div className="p-2 bg-red-100 rounded-full">
                    <Timer className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">A Vencer</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {summary.expiringFormatted}
                    </p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Balance Evolution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Evolução do Saldo</CardTitle>
                <CardDescription>Acompanhamento mensal do banco de horas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number | undefined) => [value !== undefined ? `${value}h` : '0h', '']}
                        labelFormatter={(label) => `${label} ${selectedYear}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.2}
                        name="Saldo"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Credit vs Debit Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Créditos x Débitos</CardTitle>
                <CardDescription>Comparativo mensal de movimentações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number | undefined) => [value !== undefined ? `${value}h` : '0h', '']}
                        labelFormatter={(label) => `${label} ${selectedYear}`}
                      />
                      <Legend />
                      <Bar dataKey="credit" name="Créditos" fill="#22c55e" />
                      <Bar dataKey="debit" name="Débitos" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Movements Table */}
          <Card>
            <CardHeader>
              <CardTitle>Últimas Movimentações</CardTitle>
              <CardDescription>Histórico de créditos e débitos</CardDescription>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma movimentação encontrada</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Horas</TableHead>
                      <TableHead className="text-right">Saldo Após</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Validade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => {
                      const config = getTypeConfig(movement.type);
                      const Icon = config.icon;

                      return (
                        <TableRow key={movement.id}>
                          <TableCell>
                            {new Date(movement.referenceDate).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`p-1 rounded ${config.bgColor}`}>
                                <Icon className={`h-4 w-4 ${config.color}`} />
                              </div>
                              <span>{config.label}</span>
                            </div>
                          </TableCell>
                          <TableCell className={`text-right font-mono ${config.color}`}>
                            {movement.type === 'CREDIT' ? '+' : '-'}
                            {movement.minutesFormatted}
                            {movement.multiplier && movement.multiplier !== 1.0 && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({movement.multiplier}x)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {movement.balanceAfterFormatted}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate">
                            {movement.description || '-'}
                          </TableCell>
                          <TableCell>
                            {movement.expirationDate ? (
                              <span className="text-sm text-muted-foreground">
                                {new Date(movement.expirationDate).toLocaleDateString('pt-BR')}
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Não foi possível carregar os dados do banco de horas</p>
              <Button className="mt-4" onClick={loadData}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
