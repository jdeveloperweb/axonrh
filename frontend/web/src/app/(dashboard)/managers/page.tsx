'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Search,
    Plus,
    UserCog,
    MoreHorizontal,
    Mail,
    Building2,
    Trash2,
} from 'lucide-react';
import Image from "next/image";
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { employeesApi, Employee, Department } from '@/lib/api/employees';
import { departmentsApi } from '@/lib/api/departments';
import { getPhotoUrl } from '@/lib/utils';

interface Manager {
    id: string;
    name: string;
    email: string;
    phone?: string;
    photoUrl?: string;
    department: string;
    departmentId: string;
    subordinatesCount: number;
}

export default function ManagersPage() {
    const { toast } = useToast();

    // State
    const [managers, setManagers] = useState<Manager[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [formData, setFormData] = useState({ employeeId: '', departmentId: '' });

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [depts, emps] = await Promise.all([
                employeesApi.getDepartments(),
                employeesApi.list({ size: 100 }),
            ]);

            setDepartments(depts);
            setEmployees(emps.content);

            // Extract managers from departments
            const managersData: Manager[] = depts
                .filter(d => d.manager?.id || d.managerId)
                .map(d => {
                    const managerId = d.manager?.id || d.managerId!;
                    const emp = emps.content.find(e => e.id === managerId);
                    return {
                        id: managerId,
                        name: emp?.fullName || d.manager?.fullName || d.managerName || 'Desconhecido',
                        email: emp?.email || d.manager?.email || '',
                        phone: emp?.phone,
                        photoUrl: emp?.photoUrl,
                        department: d.name,
                        departmentId: d.id,
                        subordinatesCount: d.employeeCount || 0,
                    };
                });

            setManagers(managersData);
        } catch (error) {
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

    const filteredManagers = managers.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.department.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpenModal = () => {
        setFormData({ employeeId: '', departmentId: '' });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setFormData({ employeeId: '', departmentId: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!formData.departmentId || !formData.employeeId) {
                toast({
                    title: 'Erro',
                    description: 'Selecione o departamento e o colaborador',
                    variant: 'destructive',
                });
                return;
            }

            await departmentsApi.assignManager(formData.departmentId, formData.employeeId);

            toast({
                title: 'Sucesso',
                description: 'Gestor atribuído com sucesso',
            });
            handleCloseModal();
            fetchData();
        } catch (error) {
            console.error(error);
            toast({
                title: 'Erro',
                description: 'Falha ao atribuir gestor',
                variant: 'destructive',
            });
        }
    };

    const handleRemove = async (departmentId: string, name: string, department: string) => {
        if (!confirm(`Remover ${name} como gestor do departamento ${department}?`)) return;

        try {
            await departmentsApi.removeManager(departmentId);

            toast({
                title: 'Sucesso',
                description: 'Gestor removido com sucesso',
            });
            fetchData();
        } catch (error) {
            console.error(error);
            toast({
                title: 'Erro',
                description: 'Falha ao remover gestor',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">Gestores</h1>
                    <p className="text-[var(--color-text-secondary)]">
                        Gerencie os gestores dos departamentos
                    </p>
                </div>
                <button
                    onClick={handleOpenModal}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                    <Plus className="w-4 h-4" />
                    Atribuir Gestor
                </button>
            </div>

            {/* Stats Card */}
            <Card>
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                        <UserCog className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm text-[var(--color-text-secondary)]">Total de Gestores</p>
                        <p className="text-2xl font-bold text-[var(--color-text)]">{managers.length}</p>
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
                            placeholder="Buscar gestores ou departamentos..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Managers Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                        <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                                        <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
                                        <div className="w-40 h-3 bg-gray-200 rounded animate-pulse" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : filteredManagers.length === 0 ? (
                    <div className="col-span-full">
                        <Card>
                            <CardContent className="p-12 text-center">
                                <UserCog className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-secondary)] opacity-50" />
                                <p className="text-lg font-medium text-[var(--color-text)]">Nenhum gestor encontrado</p>
                                <p className="text-sm text-[var(--color-text-secondary)]">
                                    Atribua um gestor a um departamento para começar
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    filteredManagers.map((manager) => (
                        <Card key={`${manager.id}-${manager.department}`} className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    {manager.photoUrl ? (
                                        <Image
                                            src={getPhotoUrl(manager.photoUrl) || ''}
                                            alt={manager.name}
                                            width={48}
                                            height={48}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-medium text-lg">
                                            {manager.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-[var(--color-text)] truncate">{manager.name}</h3>
                                        <div className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] mt-1">
                                            <Building2 className="w-3 h-3" />
                                            <span className="truncate">{manager.department}</span>
                                        </div>
                                        {manager.email && (
                                            <div className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] mt-1">
                                                <Mail className="w-3 h-3" />
                                                <span className="truncate">{manager.email}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative group">
                                        <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                            <MoreHorizontal className="w-4 h-4 text-[var(--color-text-secondary)]" />
                                        </button>
                                        <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                            <button
                                                onClick={() => handleRemove(manager.departmentId, manager.name, manager.department)}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 text-red-600 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Remover
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-[var(--color-text-secondary)]">Subordinados</span>
                                        <span className="font-medium text-[var(--color-text)]">{manager.subordinatesCount}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-[var(--color-text)]">
                                Atribuir Gestor
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Departamento *
                                </label>
                                <select
                                    value={formData.departmentId}
                                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                >
                                    <option value="">Selecione um departamento</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Colaborador *
                                </label>
                                <select
                                    value={formData.employeeId}
                                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                >
                                    <option value="">Selecione um colaborador</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.fullName}
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
                                    Atribuir
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
