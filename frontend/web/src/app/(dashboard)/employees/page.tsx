'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Building2,
  Users,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Coins,
  Clock,
  Calendar
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { employeesApi, Employee, EmployeeStatus, EmployeeListParams, Department, WorkRegime, EmployeeStats } from '@/lib/api/employees';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatCpf, getPhotoUrl, formatCurrency } from '@/lib/utils';
import { TerminationModal } from '@/components/employees/TerminationModal';


const statusColors: Record<EmployeeStatus, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ativo' },
  INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inativo' },
  ON_LEAVE: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Afastado' },
  TERMINATED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Desligado' },
  PENDING: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Pendente' },
};

const workRegimeLabels: Record<WorkRegime, string> = {
  PRESENCIAL: 'Presencial',
  REMOTO: 'Remoto',
  HIBRIDO: 'Híbrido',
};

const weekDays = [
  { value: 'MONDAY', label: 'Segunda' },
  { value: 'TUESDAY', label: 'Terça' },
  { value: 'WEDNESDAY', label: 'Quarta' },
  { value: 'THURSDAY', label: 'Quinta' },
  { value: 'FRIDAY', label: 'Sexta' },
  { value: 'SATURDAY', label: 'Sábado' },
  { value: 'SUNDAY', label: 'Domingo' },
];

export default function EmployeesPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | ''>('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [workRegimeFilter, setWorkRegimeFilter] = useState<WorkRegime | ''>('');
  const [hybridDayFilter, setHybridDayFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Reference data
  const [departments, setDepartments] = useState<Department[]>([]);

  // Termination modal state
  const [terminationModalOpen, setTerminationModalOpen] = useState(false);
  const [selectedEmployeeForTermination, setSelectedEmployeeForTermination] = useState<Employee | null>(null);


  // Stats
  const [stats, setStats] = useState<EmployeeStats>({
    total: 0,
    active: 0,
    onLeave: 0,
    terminated: 0,
    pending: 0,
    presencial: 0,
    remoto: 0,
    hibrido: 0,
    totalMonthlySalary: 0,
    averageSalary: 0,
    byDepartment: {}
  });

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      const params: EmployeeListParams = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (departmentFilter) params.departmentId = departmentFilter;
      if (workRegimeFilter) params.workRegime = workRegimeFilter;
      if (hybridDayFilter) params.hybridDay = hybridDayFilter;

      const data = await employeesApi.getStats(params);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, [search, statusFilter, departmentFilter, workRegimeFilter, hybridDayFilter]);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const params: EmployeeListParams = {
        page: currentPage,
        size: pageSize,
        sort: 'fullName,asc',
      };

      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (departmentFilter) params.departmentId = departmentFilter;
      if (workRegimeFilter) params.workRegime = workRegimeFilter;
      if (hybridDayFilter) params.hybridDay = hybridDayFilter;

      const response = await employeesApi.list(params);
      setEmployees(response.content);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);

      // Also update stats
      fetchStats();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar colaboradores',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, search, statusFilter, departmentFilter, workRegimeFilter, hybridDayFilter, toast, fetchStats]);

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    try {
      const data = await employeesApi.getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    fetchEmployees();
  };

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    try {
      const blob = await employeesApi.export(format, {
        search,
        status: statusFilter || undefined,
        departmentId: departmentFilter || undefined,
        workRegime: workRegimeFilter || undefined,
        hybridDay: hybridDayFilter || undefined,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_colaboradores_${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Sucesso',
        description: 'Relatório gerado com sucesso',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: 'Falha ao exportar arquivo',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir ${name}?`)) return;

    try {
      await employeesApi.delete(id);
      toast({
        title: 'Sucesso',
        description: 'Colaborador excluído com sucesso',
      });
      fetchEmployees();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir colaborador',
        variant: 'destructive',
      });
    }
  };

  const handleTerminateClick = (employee: Employee) => {
    setSelectedEmployeeForTermination(employee);
    setTerminationModalOpen(true);
  };


  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setDepartmentFilter('');
    setWorkRegimeFilter('');
    setHybridDayFilter('');
    setCurrentPage(0);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Colaboradores</h1>
          <p className="text-[var(--color-text-secondary)]">
            Gerencie todos os colaboradores da empresa
          </p>
        </div>
        <button
          onClick={() => router.push('/employees/new')}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Novo Colaborador
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total & Active */}
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Colaboradores</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-green-600 font-medium">{stats.active} ativos</p>
              </div>
            </div>
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg shadow-blue-200">
              <Users className="w-6 h-6 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Home Office vs Presencial */}
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Regime de Trabalho</p>
              <div className="flex flex-col">
                <p className="text-sm font-medium text-gray-700">{stats.presencial} Presencial</p>
                <p className="text-sm font-medium text-gray-700">{stats.remoto + stats.hibrido} Remoto/Híbrido</p>
              </div>
            </div>
            <div className="p-3 bg-purple-500 rounded-xl shadow-lg shadow-purple-200">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Payroll Summary */}
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Folha Mensal (Base)</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalMonthlySalary)}</p>
              <p className="text-[10px] text-gray-500 italic">Média: {formatCurrency(stats.averageSalary)}</p>
            </div>
            <div className="p-3 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-200">
              <Coins className="w-6 h-6 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Department Stats */}
        <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Maior Departamento</p>
              {Object.entries(stats.byDepartment).length > 0 ? (
                <>
                  <p className="text-lg font-bold text-gray-900 truncate max-w-[150px]">
                    {Object.entries(stats.byDepartment).reduce((a, b) => a[1] > b[1] ? a : b)[0]}
                  </p>
                  <p className="text-xs text-gray-500">{Object.entries(stats.byDepartment).reduce((a, b) => a[1] > b[1] ? a : b)[1]} profissionais</p>
                </>
              ) : (
                <p className="text-lg font-bold text-gray-400">N/A</p>
              )}
            </div>
            <div className="p-3 bg-orange-500 rounded-xl shadow-lg shadow-orange-200">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
                <input
                  type="text"
                  placeholder="Buscar por nome, CPF ou matrícula..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                />
              </div>
            </form>

            <div className="flex items-center gap-2">
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all ${showFilters ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-md shadow-orange-100' : 'border-gray-200 hover:bg-gray-50'
                  }`}
              >
                <Filter className="w-4 h-4" />
                Filtros
                {(statusFilter || departmentFilter || workRegimeFilter || hybridDayFilter) && (
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>

              {/* Export Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-1">
                  <button
                    onClick={() => handleExport('xlsx')}
                    className="w-full px-4 py-2.5 text-sm text-left hover:bg-orange-50 hover:text-[var(--color-primary)] rounded-lg transition-colors flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full px-4 py-2.5 text-sm text-left hover:bg-orange-50 hover:text-[var(--color-primary)] rounded-lg transition-colors flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    CSV (.csv)
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full px-4 py-2.5 text-sm text-left hover:bg-orange-50 hover:text-[var(--color-primary)] rounded-lg transition-colors flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    PDF (.pdf)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as EmployeeStatus | '')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                >
                  <option value="">Todos</option>
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo</option>
                  <option value="ON_LEAVE">Afastado</option>
                  <option value="TERMINATED">Desligado</option>
                  <option value="PENDING">Pendente</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Departamento
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                >
                  <option value="">Todos</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Regime
                </label>
                <select
                  value={workRegimeFilter}
                  onChange={(e) => setWorkRegimeFilter(e.target.value as WorkRegime | '')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                >
                  <option value="">Todos</option>
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="REMOTO">Remoto</option>
                  <option value="HIBRIDO">Híbrido</option>
                </select>
              </div>

              {workRegimeFilter === 'HIBRIDO' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                    Dia Presencial
                  </label>
                  <select
                    value={hybridDayFilter}
                    onChange={(e) => setHybridDayFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                  >
                    <option value="">Qualquer dia</option>
                    {weekDays.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="lg:col-span-4 flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400">
                  Total filtrado: <span className="font-bold text-gray-600">{totalElements}</span> colaboradores
                </p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar filtros
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employees Table/Cards */}
      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Colaborador
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    CPF
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Departamento
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Cargo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-100 rounded-full" /><div className="space-y-2"><div className="w-32 h-4 bg-gray-100 rounded" /><div className="w-20 h-3 bg-gray-100 rounded" /></div></div></td>
                      <td className="px-6 py-4"><div className="w-24 h-4 bg-gray-100 rounded" /></td>
                      <td className="px-6 py-4"><div className="w-24 h-4 bg-gray-100 rounded" /></td>
                      <td className="px-6 py-4"><div className="w-32 h-4 bg-gray-100 rounded" /></td>
                      <td className="px-6 py-4"><div className="w-16 h-6 bg-gray-100 rounded-full" /></td>
                      <td className="px-6 py-4"><div className="w-8 h-8 bg-gray-100 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      Nenhum colaborador encontrado
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/employees/${employee.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold overflow-hidden border border-white shadow-sm">
                            {employee.photoUrl ? (
                              <img
                                src={getPhotoUrl(employee.photoUrl, employee.updatedAt) || ''}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              employee.fullName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 leading-none mb-1">
                              {employee.socialName || employee.fullName}
                            </p>
                            <p className="text-xs text-gray-500">
                              Mat: {employee.registrationNumber}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatCpf(employee.cpf)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {employee.department?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {employee.position?.title || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[employee.status].bg} ${statusColors[employee.status].text}`}>
                          {statusColors[employee.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                              <MoreHorizontal className="w-4 h-4 text-gray-400" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => router.push(`/employees/${employee.id}`)}>
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/employees/${employee.id}/edit`)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(employee.id, employee.fullName)}
                            >
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 space-y-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <div className="w-1/2 h-4 bg-gray-100 rounded" />
                      <div className="w-1/3 h-3 bg-gray-100 rounded" />
                    </div>
                  </div>
                </div>
              ))
            ) : employees.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                Nenhum colaborador encontrado
              </div>
            ) : (
              employees.map((employee) => (
                <div
                  key={employee.id}
                  className="p-4 active:bg-gray-50 transition-colors"
                  onClick={() => router.push(`/employees/${employee.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold overflow-hidden border-2 border-white shadow-md">
                        {employee.photoUrl ? (
                          <img
                            src={getPhotoUrl(employee.photoUrl, employee.updatedAt) || ''}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          employee.fullName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {employee.socialName || employee.fullName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Mat: {employee.registrationNumber}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[employee.status].bg} ${statusColors[employee.status].text}`}>
                      {statusColors[employee.status].label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <div>
                      <p className="text-gray-400 mb-0.5">Departamento</p>
                      <p className="font-medium text-gray-700">{employee.department?.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-0.5">Cargo</p>
                      <p className="font-medium text-gray-700">{employee.position?.title || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-0.5">CPF</p>
                      <p className="font-medium text-gray-700">{formatCpf(employee.cpf)}</p>
                    </div>
                    <div className="flex justify-end pt-1" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 px-2 border rounded-md text-gray-500 flex items-center gap-1">
                            Ações <MoreHorizontal className="w-3 h-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/employees/${employee.id}`)}>Visualizar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/employees/${employee.id}/edit`)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(employee.id, employee.fullName)}>Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>


      {/* Pagination */}
      {!loading && totalPages > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Mostrando {currentPage * pageSize + 1} a {Math.min((currentPage + 1) * pageSize, totalElements)} de {totalElements} resultados
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const page = currentPage < 3 ? i : currentPage - 2 + i;
              if (page >= totalPages) return null;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === currentPage
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'hover:bg-gray-50'
                    }`}
                >
                  {page + 1}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <TerminationModal
        isOpen={terminationModalOpen}
        onClose={() => setTerminationModalOpen(false)}
        employee={selectedEmployeeForTermination}
        onSuccess={fetchEmployees}
      />
    </div>
  );
}
