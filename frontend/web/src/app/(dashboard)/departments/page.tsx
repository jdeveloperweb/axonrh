'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Search,
    Plus,
    Building2,
    MoreHorizontal,
    Edit,
    Trash2,
    Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { departmentsApi, DepartmentDTO, CreateDepartmentDTO, UpdateDepartmentDTO } from '@/lib/api/departments';
import { employeesApi, Employee } from '@/lib/api/employees';

export default function DepartmentsPage() {
    const { toast } = useToast();

    // State
    const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
    const [managers, setManagers] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<DepartmentDTO | null>(null);
    const [formData, setFormData] = useState<CreateDepartmentDTO>({
        code: '',
        name: '',
        description: '',
        managerId: ''
    });

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [deptData, empResponse] = await Promise.all([
                departmentsApi.list(),
                employeesApi.list({ size: 100 }) // Fetch generic list of employees for manager selection
            ]);
            setDepartments(deptData);
            setManagers(empResponse.content);
        } catch (error: unknown) {
            console.error(error);
            toast({
                title: 'Erro',
                description: 'Falha ao carregar dados',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredDepartments = departments.filter(dept =>
        dept.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpenModal = (department?: DepartmentDTO) => {
        if (department) {
            setEditingDepartment(department);
            setFormData({
                code: department.code,
                name: department.name,
                description: department.description || '',
                managerId: department.manager?.id || '',
            });
        } else {
            setEditingDepartment(null);
            setFormData({ code: '', name: '', description: '', managerId: '' });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingDepartment(null);
        setFormData({ code: '', name: '', description: '', managerId: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingDepartment) {
                const updateData: UpdateDepartmentDTO = {
                    name: formData.name,
                    description: formData.description || undefined,
                    managerId: formData.managerId ? formData.managerId : undefined,
                };
                console.log('Atualizando departamento:', editingDepartment.id, updateData);
                const result = await departmentsApi.update(editingDepartment.id, updateData);
                console.log('Resultado da atualização:', result);
                toast({
                    title: 'Sucesso',
                    description: 'Departamento atualizado com sucesso',
                });
            } else {
                console.log('Criando departamento:', formData);
                const result = await departmentsApi.create(formData);
                console.log('Resultado da criação:', result);
                toast({
                    title: 'Sucesso',
                    description: 'Departamento criado com sucesso',
                });
            }
            handleCloseModal();
            await fetchData();
        } catch (error: unknown) {
            console.error('Erro ao salvar departamento:', error);
            toast({
                title: 'Erro',
                description: error instanceof Error ? error.message : 'Falha ao salvar departamento',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir o departamento ${name}?`)) return;

        try {
            await departmentsApi.delete(id);
            toast({
                title: 'Sucesso',
                description: 'Departamento excluído com sucesso',
            });
            fetchData();
        } catch (error: unknown) {
            console.error(error);
            toast({
                title: 'Erro',
                description: 'Falha ao excluir departamento',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">Departamentos</h1>
                    <p className="text-[var(--color-text-secondary)]">
                        Gerencie os departamentos da empresa
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                    <Plus className="w-4 h-4" />
                    Novo Departamento
                </button>
            </div>

            {/* Stats Card */}
            <Card>
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                        <Building2 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-sm text-[var(--color-text-secondary)]">Total de Departamentos</p>
                        <p className="text-2xl font-bold text-[var(--color-text)]">{departments.length}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
                        <input
                            type="text"
                            placeholder="Buscar departamentos..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Departments Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                        Código
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                        Departamento
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                        Descrição
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                        Gestor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                        Colaboradores
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-6 py-4">
                                                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-48 h-4 bg-gray-200 rounded animate-pulse" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse ml-auto" />
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredDepartments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-[var(--color-text-secondary)]">
                                            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p className="text-lg font-medium">Nenhum departamento encontrado</p>
                                            <p className="text-sm">Crie um novo departamento para começar</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDepartments.map((dept) => (
                                        <tr key={dept.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-[var(--color-text-secondary)]">
                                                {dept.code}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-purple-100 rounded-lg">
                                                        <Building2 className="w-4 h-4 text-purple-600" />
                                                    </div>
                                                    <span className="font-medium text-[var(--color-text)]">{dept.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[var(--color-text-secondary)]">
                                                {dept.description || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-[var(--color-text)]">
                                                {dept.manager?.fullName || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 text-[var(--color-text)]">
                                                    <Users className="w-4 h-4" />
                                                    {dept.employeeCount || 0}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="relative group inline-block">
                                                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                                        <MoreHorizontal className="w-4 h-4 text-[var(--color-text-secondary)]" />
                                                    </button>
                                                    <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                                        <button
                                                            onClick={() => handleOpenModal(dept)}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(dept.id, dept.name)}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 text-red-600 last:rounded-b-lg"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Excluir
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-[var(--color-text)]">
                                {editingDepartment ? 'Editar Departamento' : 'Novo Departamento'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Código *
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    required
                                    disabled={!!editingDepartment}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:bg-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Nome *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Descrição
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Gestor
                                </label>
                                <select
                                    value={formData.managerId}
                                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                >
                                    <option value="">Selecione um gestor</option>
                                    {managers.map((manager) => (
                                        <option key={manager.id} value={manager.id}>
                                            {manager.fullName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90"
                                >
                                    {editingDepartment ? 'Atualizar' : 'Criar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
