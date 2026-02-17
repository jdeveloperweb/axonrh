'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { useConfirm } from '@/components/providers/ConfirmProvider';
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
  Calendar,
  AlertCircle,
  Sparkles,
  CaseSensitive,
  LayoutList,
  ChevronDown,
  ChevronUp,
  ArrowUpAZ,
  ArrowDownAZ
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { ExpandablePhoto } from '@/components/ui/expandable-photo';
import { employeesApi, Employee, EmployeeStatus, EmployeeListParams, Department, WorkRegime, EmployeeStats } from '@/lib/api/employees';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatCpf, getPhotoUrl, formatCurrency } from '@/lib/utils';
import { TerminationModal } from '@/components/employees/TerminationModal';
import { ExtractDataModal } from '@/components/employees/ExtractDataModal';

// ... imports




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
  const { confirm } = useConfirm();
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
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | ''>('ACTIVE');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [workRegimeFilter, setWorkRegimeFilter] = useState<WorkRegime | ''>('');
  const [hybridDayFilter, setHybridDayFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'alphabetical' | 'department'>('alphabetical');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [collapsedDepts, setCollapsedDepts] = useState<Set<string>>(new Set());

  // Reference data
  const [departments, setDepartments] = useState<Department[]>([]);

  // Termination modal state
  const [terminationModalOpen, setTerminationModalOpen] = useState(false);
  const [selectedEmployeeForTermination, setSelectedEmployeeForTermination] = useState<Employee | null>(null);

  // AI Extraction modal state
  const [extractModalOpen, setExtractModalOpen] = useState(false);
  const [selectedEmployeeForExtraction, setSelectedEmployeeForExtraction] = useState<Employee | null>(null);


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
      const isDeptView = viewMode === 'department';
      const params: EmployeeListParams = {};
      if (search) params.search = search;

      // No modo departamento, queremos os totais gerais para os badges, 
      // mas mantemos o filtro se o usuário o alterou manualmente longe do padrão ACTIVE
      if (statusFilter && (!isDeptView || statusFilter !== 'ACTIVE')) {
        params.status = statusFilter;
      } else if (!isDeptView && statusFilter) {
        params.status = statusFilter;
      }

      if (departmentFilter) params.departmentId = departmentFilter;
      if (workRegimeFilter) params.workRegime = workRegimeFilter;
      if (hybridDayFilter) params.hybridDay = hybridDayFilter;

      const data = await employeesApi.getStats(params);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, [search, statusFilter, departmentFilter, workRegimeFilter, hybridDayFilter, viewMode]);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const isDeptView = viewMode === 'department';
      const params: EmployeeListParams = {
        page: isDeptView ? 0 : currentPage,
        size: isDeptView ? 1000 : pageSize, // Reduzido de 2000 para 1000 para ser mais aceitável por gateways
        sort: viewMode === 'alphabetical' ? `fullName,${sortDirection}` :
          viewMode === 'department' ? `department.name,asc,fullName,${sortDirection}` :
            `registrationNumber,${sortDirection}`,
      };

      if (search) params.search = search;

      // Se estiver no modo departamento e o filtro for o padrão (ACTIVE), 
      // trazemos todos para dar a visão completa da estrutura da empresa.
      if (statusFilter && (!isDeptView || statusFilter !== 'ACTIVE')) {
        params.status = statusFilter;
      }

      if (departmentFilter) params.departmentId = departmentFilter;
      if (workRegimeFilter) params.workRegime = workRegimeFilter;
      if (hybridDayFilter) params.hybridDay = hybridDayFilter;

      const response = await employeesApi.list(params);

      // Debug log (visível no console do navegador do usuário se necessário)
      console.log(`[Employees] Loaded ${response.content?.length} of ${response.totalElements} employees. Mode: ${viewMode}`);

      setEmployees(response.content || []);
      setTotalElements(response.totalElements || 0);
      setTotalPages(response.totalPages || 0);

      // Sincroniza os stats com os mesmos filtros
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
  }, [currentPage, pageSize, search, statusFilter, departmentFilter, workRegimeFilter, hybridDayFilter, viewMode, sortDirection, toast, fetchStats]);

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
    setCurrentPage(0);
  }, [viewMode]);

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
    if (!await confirm({
      title: 'Excluir Colaborador',
      description: `Tem certeza que deseja excluir ${name}?`,
      variant: 'destructive',
      confirmLabel: 'Excluir'
    })) return;

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

  const handleSmartFill = (employee: Employee, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEmployeeForExtraction(employee);
    setExtractModalOpen(true);
  };


  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setDepartmentFilter('');
    setWorkRegimeFilter('');
    setHybridDayFilter('');
    setCurrentPage(0);
  };

  const toggleDept = (deptName: string) => {
    setCollapsedDepts(prev => {
      const next = new Set(prev);
      if (next.has(deptName)) next.delete(deptName);
      else next.add(deptName);
      return next;
    });
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

              {/* View Selector */}
              <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-100">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewMode === 'list'
                    ? 'bg-white text-[var(--color-primary)] shadow-sm border border-gray-100'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                  title="Lista Corrida"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Corrida</span>
                </button>
                <button
                  onClick={() => setViewMode('alphabetical')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewMode === 'alphabetical'
                    ? 'bg-white text-[var(--color-primary)] shadow-sm border border-gray-100'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                  title="Alfabética"
                >
                  <CaseSensitive className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">A-Z</span>
                </button>
                <button
                  onClick={() => setViewMode('department')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewMode === 'department'
                    ? 'bg-white text-[var(--color-primary)] shadow-sm border border-gray-100'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                  title="Por Departamento"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Depto</span>
                </button>
              </div>

              {/* Sort Direction Toggle */}
              {viewMode !== 'department' && (
                <button
                  onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-xs font-semibold text-gray-600"
                  title={sortDirection === 'asc' ? 'Crescente' : 'Decrescente'}
                >
                  {sortDirection === 'asc' ? (
                    <>
                      <ArrowUpAZ className="w-4 h-4" />
                      <span className="hidden sm:inline">A-Z</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownAZ className="w-4 h-4" />
                      <span className="hidden sm:inline">Z-A</span>
                    </>
                  )}
                </button>
              )}
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
                ) : viewMode === 'department' ? (
                  (() => {
                    const deptsWithEmployees = Array.from(new Set((employees || []).map(e => e?.department?.name || 'Sem Departamento')));
                    const allDeptNames = Array.from(new Set([
                      ...(departments || []).map(d => d?.name),
                      ...deptsWithEmployees
                    ])).filter(Boolean).sort() as string[];

                    return allDeptNames.map(deptName => {
                      const deptEmployees = (employees || []).filter(e => (e?.department?.name || 'Sem Departamento') === deptName);
                      if (deptEmployees.length === 0 && !(departments || []).find(d => d?.name === deptName)) return null;

                      const isCollapsed = collapsedDepts.has(deptName);
                      return (
                        <Fragment key={deptName}>
                          <tr
                            className="bg-orange-50/20 cursor-pointer hover:bg-orange-100/30 transition-colors"
                            onClick={() => toggleDept(deptName)}
                          >
                            <td colSpan={6} className="px-6 py-2 border-l-4 border-[var(--color-primary)]">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {isCollapsed ? <ChevronRight className="w-4 h-4 text-[var(--color-primary)]" /> : <ChevronDown className="w-4 h-4 text-[var(--color-primary)]" />}
                                  <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
                                    <span className="text-sm font-black text-gray-800 uppercase tracking-tighter">
                                      {deptName}
                                    </span>
                                    <span className="flex items-center justify-center min-w-[28px] h-[20px] text-[10px] bg-[var(--color-primary)] text-white px-2 rounded-full font-black shadow-sm ring-2 ring-orange-100/50">
                                      {deptEmployees.length}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold text-[var(--color-primary)]/50 uppercase tracking-widest flex items-center gap-1">
                                  {isCollapsed ? 'Expandir' : 'Recolher'}
                                  {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </span>
                              </div>
                            </td>
                          </tr>
                          {!isCollapsed && (
                            <tr>
                              <td colSpan={6} className="p-4 bg-gray-50/5">
                                {deptEmployees.length === 0 ? (
                                  <div className="py-4 text-center text-[10px] text-gray-400 font-medium uppercase tracking-widest italic opacity-60">
                                    Nenhum colaborador encontrado neste setor
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                                    {deptEmployees
                                      .sort((a, b) => {
                                        const getRank = (e: any) => {
                                          const t = (e.position?.title || e.position?.name || '').toLowerCase();
                                          if (t.includes('diretor')) return 1;
                                          if (t.includes('gerente')) return 2;
                                          if (t.includes('coordenador')) return 3;
                                          if (t.includes('supervisor')) return 4;
                                          if (t.includes('líder') || t.includes('lider')) return 5;
                                          return 6;
                                        };
                                        const rankA = getRank(a);
                                        const rankB = getRank(b);
                                        if (rankA !== rankB) return rankA - rankB;
                                        return (a.fullName || '').localeCompare(b.fullName || '');
                                      })
                                      .map((employee) => (
                                        <div
                                          key={employee.id}
                                          className="bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md hover:border-[var(--color-primary)]/30 transition-all cursor-pointer group relative flex flex-col"
                                          onClick={() => router.push(`/employees/${employee.id}`)}
                                        >
                                          {/* Menu de Ações no Card */}
                                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors bg-white/80 backdrop-blur-sm border border-gray-100">
                                                  <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
                                                </button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuItem onClick={() => router.push(`/employees/${employee.id}`)}>
                                                  <Eye className="w-3.5 h-3.5 mr-2" /> Visualizar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => router.push(`/employees/${employee.id}/edit`)}>
                                                  <Edit className="w-3.5 h-3.5 mr-2" /> Editar
                                                </DropdownMenuItem>
                                                {employee.missingFields && employee.missingFields.length > 0 && (
                                                  <DropdownMenuItem
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleSmartFill(employee, e as any);
                                                    }}
                                                    className="text-purple-600 font-bold"
                                                  >
                                                    <Sparkles className="w-3.5 h-3.5 mr-2" /> Completar com IA
                                                  </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(employee.id, employee.fullName)}>
                                                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </div>

                                          <div className="flex items-start gap-3">
                                            <div className="relative">
                                              <ExpandablePhoto
                                                src={getPhotoUrl(employee.photoUrl, employee.updatedAt)}
                                                alt={employee.fullName}
                                                containerClassName="w-12 h-12 rounded-lg border border-gray-100 shadow-sm overflow-hidden"
                                                fallback={
                                                  <div className="w-full h-full bg-[var(--color-primary)]/5 text-[var(--color-primary)] flex items-center justify-center font-bold text-lg">
                                                    {employee.fullName.charAt(0).toUpperCase()}
                                                  </div>
                                                }
                                              />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-start justify-between pr-4">
                                                <h4 className="font-bold text-gray-900 truncate text-[11px] group-hover:text-[var(--color-primary)] transition-colors leading-tight">
                                                  {employee.fullName}
                                                </h4>
                                              </div>
                                              <p className="text-[9px] text-gray-500 font-medium truncate mt-0.5 uppercase tracking-tighter">
                                                {employee.position?.title || '-'}
                                              </p>
                                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                                <span className={`inline-flex px-1 py-0.5 rounded-full text-[7px] font-bold uppercase ${statusColors[employee.status]?.bg || 'bg-gray-100'} ${statusColors[employee.status]?.text || 'text-gray-800'}`}>
                                                  {statusColors[employee.status]?.label || employee.status}
                                                </span>
                                                <span className="text-[8px] text-gray-400 font-mono">
                                                  {formatCpf(employee.cpf)}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    });
                  })()
                ) : (
                  employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/employees/${employee.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10">
                            <ExpandablePhoto
                              src={getPhotoUrl(employee.photoUrl, employee.updatedAt)}
                              alt={employee.fullName}
                              containerClassName="w-10 h-10 rounded-full border border-white shadow-sm"
                              fallback={
                                <div className="w-full h-full rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold">
                                  {employee.fullName.charAt(0).toUpperCase()}
                                </div>
                              }
                            />
                          </div>
                          <div className="flex flex-col">
                            <p className="font-bold text-gray-900 leading-tight">
                              {employee.fullName}
                              {employee.missingFields && employee.missingFields.length > 0 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={(e) => handleSmartFill(employee, e)}
                                        className="inline-flex ml-2 cursor-pointer hover:bg-orange-50 p-1 rounded-full transition-colors group"
                                      >
                                        <AlertCircle className="w-4 h-4 text-orange-500 group-hover:text-orange-600" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="text-xs">
                                        <p className="font-bold mb-1">Dados pendentes:</p>
                                        <ul className="list-disc pl-4 mb-2">
                                          {employee.missingFields.map((field) => (
                                            <li key={field}>{field}</li>
                                          ))}
                                        </ul>
                                        <p className="text-[10px] text-purple-600 font-bold border-t border-gray-100 pt-1 mt-1 flex items-center gap-1">
                                          <TrendingUp className="w-3 h-3" /> Clique para completar com IA
                                        </p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </p>
                            {employee.socialName && (
                              <p className="text-xs text-gray-500 font-medium">
                                {employee.socialName}
                              </p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-0.5">
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[employee.status]?.bg || 'bg-gray-100'} ${statusColors[employee.status]?.text || 'text-gray-800'}`}>
                          {statusColors[employee.status]?.label || employee.status}
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
                              <Eye className="w-3.5 h-3.5 mr-2" /> Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/employees/${employee.id}/edit`)}>
                              <Edit className="w-3.5 h-3.5 mr-2" /> Editar
                            </DropdownMenuItem>
                            {employee.missingFields && employee.missingFields.length > 0 && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSmartFill(employee, e as any);
                                }}
                                className="text-purple-600 font-medium"
                              >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Completar com IA
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(employee.id, employee.fullName)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
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
            ) : viewMode === 'department' ? (
              (() => {
                const deptsWithEmployees = Array.from(new Set((employees || []).map(e => e?.department?.name || 'Sem Departamento')));
                const allDeptNames = Array.from(new Set([
                  ...(departments || []).map(d => d?.name),
                  ...deptsWithEmployees
                ])).filter(Boolean).sort() as string[];

                return allDeptNames.map(deptName => {
                  const deptEmployees = (employees || []).filter(e => (e?.department?.name || 'Sem Departamento') === deptName);
                  if (deptEmployees.length === 0 && !(departments || []).find(d => d?.name === deptName)) return null;

                  const isCollapsed = collapsedDepts.has(deptName);
                  return (
                    <Fragment key={deptName}>
                      <div
                        className="bg-orange-50/30 px-4 py-2 flex items-center justify-between border-y border-gray-100 first:border-t-0 cursor-pointer active:bg-orange-100/50"
                        onClick={() => toggleDept(deptName)}
                      >
                        <div className="flex items-center gap-2">
                          {isCollapsed ? <ChevronRight className="w-3 h-3 text-[var(--color-primary)]" /> : <ChevronDown className="w-3 h-3 text-[var(--color-primary)]" />}
                          <Building2 className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                          <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wider">
                            {deptName}
                          </span>
                          <span className="text-[10px] bg-orange-100 text-[var(--color-primary)] px-1.5 py-0.5 rounded-full font-bold">
                            {deptEmployees.length}
                          </span>
                        </div>
                      </div>
                      {!isCollapsed && (
                        <div className="p-3 bg-gray-50/10 grid grid-cols-2 gap-2">
                          {deptEmployees.length === 0 ? (
                            <div className="col-span-2 py-4 text-center text-[8px] text-gray-400 font-medium uppercase tracking-widest italic opacity-60">
                              Nenhum colaborador encontrado neste setor
                            </div>
                          ) : (
                            deptEmployees
                              .sort((a, b) => {
                                const getRank = (e: any) => {
                                  const t = (e.position?.title || e.position?.name || '').toLowerCase();
                                  if (t.includes('diretor')) return 1;
                                  if (t.includes('gerente')) return 2;
                                  if (t.includes('coordenador')) return 3;
                                  if (t.includes('supervisor')) return 4;
                                  if (t.includes('líder') || t.includes('lider')) return 5;
                                  return 6;
                                };
                                const rankA = getRank(a);
                                const rankB = getRank(b);
                                if (rankA !== rankB) return rankA - rankB;
                                return (a.fullName || '').localeCompare(b.fullName || '');
                              })
                              .map((employee) => (
                                <div
                                  key={employee.id}
                                  className="bg-white border border-gray-100 rounded-lg p-2 active:bg-gray-50 transition-colors flex flex-col items-center text-center relative group"
                                  onClick={() => router.push(`/employees/${employee.id}`)}
                                >
                                  {/* Menu de Ações Mobile no Card */}
                                  <div className="absolute top-1 right-1" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button className="p-1 hover:bg-gray-50 rounded-full">
                                          <MoreHorizontal className="w-3 h-3 text-gray-400" />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => router.push(`/employees/${employee.id}`)}>Visualizar</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push(`/employees/${employee.id}/edit`)}>Editar</DropdownMenuItem>
                                        {employee.missingFields && employee.missingFields.length > 0 && (
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleSmartFill(employee, e as any);
                                            }}
                                            className="text-purple-600 font-bold"
                                          >
                                            IA
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>

                                  <div className="relative mb-1.5">
                                    <ExpandablePhoto
                                      src={getPhotoUrl(employee.photoUrl, employee.updatedAt)}
                                      alt={employee.fullName}
                                      containerClassName="w-10 h-10 rounded-full border border-gray-100 shadow-sm"
                                      fallback={
                                        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/5 text-[var(--color-primary)] flex items-center justify-center font-bold text-sm">
                                          {employee.fullName.charAt(0).toUpperCase()}
                                        </div>
                                      }
                                    />
                                  </div>
                                  <p className="font-bold text-gray-900 text-[10px] line-clamp-1 leading-tight w-full">
                                    {employee.fullName}
                                  </p>
                                  <p className="text-[8px] text-gray-500 line-clamp-1 w-full mt-0.5 uppercase">
                                    {employee.position?.title || '-'}
                                  </p>
                                </div>
                              ))
                          )}
                        </div>
                      )}
                    </Fragment>
                  );
                });
              })()
            ) : (
              employees.map((employee) => (
                <div
                  key={employee.id}
                  className="p-4 active:bg-gray-50 transition-colors"
                  onClick={() => router.push(`/employees/${employee.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12">
                        <ExpandablePhoto
                          src={getPhotoUrl(employee.photoUrl, employee.updatedAt)}
                          alt={employee.fullName}
                          containerClassName="w-12 h-12 rounded-full border-2 border-white shadow-md"
                          fallback={
                            <div className="w-full h-full rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold">
                              {employee.fullName.charAt(0).toUpperCase()}
                            </div>
                          }
                        />
                      </div>
                      <div className="flex flex-col">
                        <p className="font-bold text-gray-900 leading-tight">
                          {employee.fullName}
                          {employee.missingFields && employee.missingFields.length > 0 && (
                            <button
                              onClick={(e) => handleSmartFill(employee, e)}
                              className="inline-flex ml-2 cursor-pointer p-1 rounded-full active:bg-orange-100"
                            >
                              <AlertCircle className="w-3 h-3 text-orange-500" />
                            </button>
                          )}
                        </p>
                        {employee.socialName && (
                          <p className="text-xs text-gray-500 font-medium">
                            {employee.socialName}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Mat: {employee.registrationNumber}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[employee.status]?.bg || 'bg-gray-100'} ${statusColors[employee.status]?.text || 'text-gray-800'}`}>
                      {statusColors[employee.status]?.label || employee.status}
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
                          <DropdownMenuItem onClick={() => router.push(`/employees/${employee.id}`)}>
                            <Eye className="w-3.5 h-3.5 mr-2" /> Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/employees/${employee.id}/edit`)}>
                            <Edit className="w-3.5 h-3.5 mr-2" /> Editar
                          </DropdownMenuItem>
                          {employee.missingFields && employee.missingFields.length > 0 && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSmartFill(employee, e as any);
                              }}
                              className="text-purple-600 font-bold"
                            >
                              <Sparkles className="w-3.5 h-3.5 mr-2" /> IA Completa
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(employee.id, employee.fullName)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent >
      </Card >


      {/* Pagination */}
      {
        !loading && totalPages > 0 && viewMode !== 'department' && (
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
        )
      }
      <TerminationModal
        isOpen={terminationModalOpen}
        onClose={() => setTerminationModalOpen(false)}
        employee={selectedEmployeeForTermination}
        onSuccess={fetchEmployees}
      />

      <ExtractDataModal
        isOpen={extractModalOpen}
        onClose={() => setExtractModalOpen(false)}
        employee={selectedEmployeeForExtraction}
        onSuccess={fetchEmployees}
      />
    </div >
  );
}
