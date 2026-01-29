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
  ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { employeesApi, Employee, EmployeeStatus, EmployeeListParams, Department } from '@/lib/api/employees';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatCpf } from '@/lib/utils';

const statusColors: Record<EmployeeStatus, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ativo' },
  INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inativo' },
  ON_LEAVE: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Afastado' },
  TERMINATED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Desligado' },
  PENDING: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Pendente' },
};

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
  const [showFilters, setShowFilters] = useState(false);

  // Reference data
  const [departments, setDepartments] = useState<Department[]>([]);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    onLeave: 0,
    terminated: 0,
  });

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

      const response = await employeesApi.list(params);
      setEmployees(response.content);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);

      // Calculate stats from first load (without filters)
      if (!search && !statusFilter && !departmentFilter && currentPage === 0) {
        setStats({
          total: response.totalElements,
          active: response.content.filter(e => e.status === 'ACTIVE').length,
          onLeave: response.content.filter(e => e.status === 'ON_LEAVE').length,
          terminated: response.content.filter(e => e.status === 'TERMINATED').length,
        });
      }
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
  }, [currentPage, pageSize, search, statusFilter, departmentFilter, toast]);

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
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `colaboradores.${format}`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Sucesso',
        description: 'Arquivo exportado com sucesso',
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

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setDepartmentFilter('');
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">Total</p>
              <p className="text-2xl font-bold text-[var(--color-text)]">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">Ativos</p>
              <p className="text-2xl font-bold text-[var(--color-text)]">{stats.active}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Building2 className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">Afastados</p>
              <p className="text-2xl font-bold text-[var(--color-text)]">{stats.onLeave}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <UserX className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">Desligados</p>
              <p className="text-2xl font-bold text-[var(--color-text)]">{stats.terminated}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
            </form>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${showFilters ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'border-gray-200 hover:bg-gray-50'
                }`}
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>

            {/* Export Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4" />
                Exportar
              </button>
              <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={() => handleExport('xlsx')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg"
                >
                  Excel (.xlsx)
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50"
                >
                  CSV (.csv)
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 last:rounded-b-lg"
                >
                  PDF (.pdf)
                </button>
              </div>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as EmployeeStatus | '')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Departamento
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">Todos</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card>
        <CardContent className="p-0 overflow-visible">
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Colaborador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                    CPF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Departamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Cargo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Admissão
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                          <div className="space-y-2">
                            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                            <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-28 h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[var(--color-text-secondary)]">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Nenhum colaborador encontrado</p>
                      <p className="text-sm">Tente ajustar os filtros ou adicione um novo colaborador</p>
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/employees/${employee.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {employee.photoUrl ? (
                            <Image
                              src={employee.photoUrl}
                              alt={employee.fullName}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-medium">
                              {employee.fullName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-[var(--color-text)]">
                              {employee.socialName || employee.fullName}
                            </p>
                            <p className="text-sm text-[var(--color-text-secondary)]">
                              {employee.registrationNumber}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[var(--color-text)]">
                        {formatCpf(employee.cpf)}
                      </td>
                      <td className="px-6 py-4 text-[var(--color-text)]">
                        {employee.department?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-[var(--color-text)]">
                        {employee.position?.title || employee.position?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-[var(--color-text)]">
                        {employee.admissionDate || employee.hireDate ? formatDate(employee.admissionDate || employee.hireDate) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[employee.status].bg} ${statusColors[employee.status].text}`}>
                          {statusColors[employee.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right sticky right-0 bg-white" onClick={(e) => e.stopPropagation()}>
                        <div onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                                <MoreHorizontal className="w-4 h-4 text-[var(--color-text-secondary)]" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                              <DropdownMenuItem
                                onClick={() => router.push(`/employees/${employee.id}`)}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/employees/${employee.id}/edit`)}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                              >
                                <Edit className="w-4 h-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(employee.id, employee.fullName)}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-red-600 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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
        </CardContent>
      </Card>
    </div>
  );
}
