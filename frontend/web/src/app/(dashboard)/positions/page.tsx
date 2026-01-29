'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Search,
    Plus,
    Briefcase,
    Edit,
    Trash2,
    MoreHorizontal
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { positionsApi, Position, CreatePositionData } from '@/lib/api/positions';
import { employeesApi, Department } from '@/lib/api/employees';

export default function PositionsPage() {
    const { toast } = useToast();

    // State
    const [positions, setPositions] = useState<Position[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingPosition, setEditingPosition] = useState<Position | null>(null);
    interface PositionFormData {
        code: string;
        title: string;
        description: string;
        responsibilities: string;
        cboCode: string;
        salaryRangeMin: string;
        salaryRangeMax: string;
        level: string;
        departmentId: string;
    }

    const [formData, setFormData] = useState<PositionFormData>({
        code: '',
        title: '',
        description: '',
        responsibilities: '',
        cboCode: '',
        salaryRangeMin: '',
        salaryRangeMax: '',
        level: '',
        departmentId: ''
    });

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [positionsData, departmentsData] = await Promise.all([
                positionsApi.getActivePositions(), // Or getPositions for paginated, currently using active list for simplicity
                employeesApi.getDepartments()
            ]);
            setPositions(positionsData);
            setDepartments(departmentsData);
        } catch {
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

    const filteredPositions = positions.filter(pos =>
        pos.title.toLowerCase().includes(search.toLowerCase()) ||
        pos.code.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpenModal = (position?: Position) => {
        if (position) {
            setEditingPosition(position);
            setFormData({
                code: position.code,
                title: position.title,
                description: position.description || '',
                responsibilities: position.responsibilities || '',
                cboCode: position.cboCode || '',
                salaryRangeMin: position.salaryRangeMin?.toString() || '',
                salaryRangeMax: position.salaryRangeMax?.toString() || '',
                level: position.level || '',
                departmentId: position.departmentId || ''
            });
        } else {
            setEditingPosition(null);
            setFormData({
                code: '',
                title: '',
                description: '',
                responsibilities: '',
                cboCode: '',
                salaryRangeMin: '',
                salaryRangeMax: '',
                level: '',
                departmentId: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingPosition(null);
        setFormData({
            code: '',
            title: '',
            description: '',
            responsibilities: '',
            cboCode: '',
            salaryRangeMin: '',
            salaryRangeMax: '',
            level: '',
            departmentId: ''
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data: CreatePositionData = {
                ...formData,
                salaryRangeMin: formData.salaryRangeMin ? Number(formData.salaryRangeMin) : undefined,
                salaryRangeMax: formData.salaryRangeMax ? Number(formData.salaryRangeMax) : undefined,
            };

            if (editingPosition) {
                await positionsApi.updatePosition(editingPosition.id, data);
                toast({ title: 'Sucesso', description: 'Cargo atualizado com sucesso' });
            } else {
                await positionsApi.createPosition(data);
                toast({ title: 'Sucesso', description: 'Cargo criado com sucesso' });
            }
            handleCloseModal();
            fetchData();
            fetchData();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast({
                title: 'Erro',
                description: err.response?.data?.message || 'Falha ao salvar cargo',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Tem certeza que deseja excluir o cargo ${title}?`)) return;

        try {
            await positionsApi.deletePosition(id);
            toast({ title: 'Sucesso', description: 'Cargo excluído com sucesso' });
            fetchData();
        } catch {
            toast({
                title: 'Erro',
                description: 'Falha ao excluir cargo',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">Cargos</h1>
                    <p className="text-[var(--color-text-secondary)]">
                        Gerencie os cargos e funções da empresa
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                    <Plus className="w-4 h-4" />
                    Novo Cargo
                </button>
            </div>

            {/* Stats Card */}
            <Card>
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                        <Briefcase className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm text-[var(--color-text-secondary)]">Total de Cargos</p>
                        <p className="text-2xl font-bold text-[var(--color-text)]">{positions.length}</p>
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
                            placeholder="Buscar cargos..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Positions Table Grouped by Department */}
            <div className="space-y-6">
                {loading ? (
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <tbody className="divide-y divide-gray-200">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i}>
                                                <td className="px-6 py-4"><div className="w-16 h-4 bg-gray-200 rounded animate-pulse" /></td>
                                                <td className="px-6 py-4"><div className="w-32 h-4 bg-gray-200 rounded animate-pulse" /></td>
                                                <td className="px-6 py-4"><div className="w-24 h-4 bg-gray-200 rounded animate-pulse" /></td>
                                                <td className="px-6 py-4"><div className="w-16 h-4 bg-gray-200 rounded animate-pulse" /></td>
                                                <td className="px-6 py-4"><div className="w-20 h-4 bg-gray-200 rounded animate-pulse" /></td>
                                                <td className="px-6 py-4"><div className="w-8 h-8 bg-gray-200 rounded animate-pulse ml-auto" /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                ) : filteredPositions.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center text-[var(--color-text-secondary)]">
                            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">Nenhum cargo encontrado</p>
                            <p className="text-sm">Crie um novo cargo para começar</p>
                        </CardContent>
                    </Card>
                ) : (
                    Object.entries(
                        filteredPositions.reduce((acc, pos) => {
                            const deptName = pos.departmentName || 'Sem Departamento';
                            if (!acc[deptName]) acc[deptName] = [];
                            acc[deptName].push(pos);
                            return acc;
                        }, {} as Record<string, Position[]>)
                    ).map(([deptName, deptPositions]) => (
                        <Card key={deptName}>
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                                    {deptName}
                                    <span className="text-xs font-normal text-[var(--color-text-secondary)] ml-2">
                                        ({deptPositions.length} {deptPositions.length === 1 ? 'cargo' : 'cargos'})
                                    </span>
                                </h3>
                            </div>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200 bg-white">
                                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider w-1/6">
                                                    Código
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider w-1/3">
                                                    Cargo
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider w-1/6">
                                                    Nível
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider w-1/4">
                                                    Salário (Faixa)
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider w-10">
                                                    Ações
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {deptPositions.map((pos) => (
                                                <tr key={pos.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-medium text-[var(--color-text-secondary)]">
                                                        {pos.code}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-[var(--color-text)]">
                                                        {pos.title}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                                                        {pos.level || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                                                        {pos.salaryRangeMin ? `R$ ${pos.salaryRangeMin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                                        {' - '}
                                                        {pos.salaryRangeMax ? `R$ ${pos.salaryRangeMax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="relative group inline-block">
                                                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                                                <MoreHorizontal className="w-4 h-4 text-[var(--color-text-secondary)]" />
                                                            </button>
                                                            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                                                <button
                                                                    onClick={() => handleOpenModal(pos)}
                                                                    className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                    Editar
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(pos.id, pos.title)}
                                                                    className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 text-red-600 last:rounded-b-lg"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                    Excluir
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-[var(--color-text)]">
                                {editingPosition ? 'Editar Cargo' : 'Novo Cargo'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                        Código *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                        Título do Cargo *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                        Departamento *
                                    </label>
                                    <select
                                        value={formData.departmentId}
                                        onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                                    >
                                        <option value="">Selecione...</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                        Nível
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.level}
                                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                        Código CBO
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.cboCode}
                                        onChange={(e) => setFormData({ ...formData, cboCode: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                        Faixa Salarial
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={formData.salaryRangeMin}
                                            onChange={(e) => setFormData({ ...formData, salaryRangeMin: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                        />
                                        <span>-</span>
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={formData.salaryRangeMax}
                                            onChange={(e) => setFormData({ ...formData, salaryRangeMax: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                        />
                                    </div>
                                </div>
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
                                    Responsabilidades
                                </label>
                                <textarea
                                    value={formData.responsibilities}
                                    onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white text-[var(--color-text)]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90"
                                >
                                    {editingPosition ? 'Atualizar' : 'Criar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

