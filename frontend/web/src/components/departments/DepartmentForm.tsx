'use client';

import { useState, useEffect } from 'react';
import { departmentsApi, DepartmentDTO, CreateDepartmentDTO, UpdateDepartmentDTO } from '@/lib/api/departments';
import { employeesApi, Employee, CostCenter } from '@/lib/api/employees';
import { Button } from '@/components/ui/button';

interface DepartmentFormProps {
    department?: DepartmentDTO | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export function DepartmentForm({ department, onSuccess, onCancel }: DepartmentFormProps) {
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);

    const [formData, setFormData] = useState({
        code: department?.code || '',
        name: department?.name || '',
        description: department?.description || '',
        parentId: department?.parent?.id || '',
        managerId: department?.manager?.id || '',
        costCenterId: department?.costCenter?.id || '',
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [depts, emps, costs] = await Promise.all([
                    departmentsApi.list(),
                    employeesApi.list({ size: 1000 }),
                    employeesApi.getCostCenters(),
                ]);

                setDepartments(depts.filter(d => d.id !== department?.id));
                setEmployees(emps.content || []);
                setCostCenters(costs);
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
            }
        };

        loadData();
    }, [department?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = {
                code: formData.code,
                name: formData.name,
                description: formData.description || undefined,
                parentId: formData.parentId || undefined,
                managerId: formData.managerId || undefined,
                costCenterId: formData.costCenterId || undefined,
            };

            if (department) {
                await departmentsApi.update(department.id, data as UpdateDepartmentDTO);
            } else {
                await departmentsApi.create(data as CreateDepartmentDTO);
            }

            onSuccess();
        } catch (error) {
            console.error('Erro ao salvar departamento:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                {/* Código */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Código <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        maxLength={20}
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="input w-full"
                        placeholder="Ex: TI"
                    />
                </div>

                {/* Nome */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Nome <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        maxLength={100}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input w-full"
                        placeholder="Ex: Tecnologia da Informação"
                    />
                </div>
            </div>

            {/* Descrição */}
            <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input w-full"
                    rows={3}
                    placeholder="Descrição do departamento..."
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Departamento Pai */}
                <div>
                    <label className="block text-sm font-medium mb-2">Departamento Pai</label>
                    <select
                        value={formData.parentId}
                        onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                        className="input w-full"
                    >
                        <option value="">Nenhum (departamento raiz)</option>
                        {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                                {dept.code} - {dept.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Gestor */}
                <div>
                    <label className="block text-sm font-medium mb-2">Gestor</label>
                    <select
                        value={formData.managerId}
                        onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                        className="input w-full"
                    >
                        <option value="">Selecione um gestor</option>
                        {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                                {emp.fullName} ({emp.registrationNumber})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Centro de Custo */}
            <div>
                <label className="block text-sm font-medium mb-2">Centro de Custo</label>
                <select
                    value={formData.costCenterId}
                    onChange={(e) => setFormData({ ...formData, costCenterId: e.target.value })}
                    className="input w-full"
                >
                    <option value="">Selecione um centro de custo</option>
                    {costCenters.map((cc) => (
                        <option key={cc.id} value={cc.id}>
                            {cc.code} - {cc.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                    Cancelar
                </Button>
                <Button type="submit" isLoading={loading}>
                    {department ? 'Atualizar' : 'Criar'} Departamento
                </Button>
            </div>
        </form>
    );
}
