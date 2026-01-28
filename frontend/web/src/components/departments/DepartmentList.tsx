'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Building2 } from 'lucide-react';
import { departmentsApi, DepartmentDTO } from '@/lib/api/departments';
import { Button } from '@/components/ui/button';
import { DepartmentForm } from './DepartmentForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export function DepartmentList() {
    const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDepartment, setSelectedDepartment] = useState<DepartmentDTO | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [departmentToDelete, setDepartmentToDelete] = useState<DepartmentDTO | null>(null);

    useEffect(() => {
        loadDepartments();
    }, []);

    const loadDepartments = async () => {
        try {
            setLoading(true);
            const data = await departmentsApi.list();
            setDepartments(data);
        } catch (error) {
            console.error('Erro ao carregar departamentos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedDepartment(null);
        setShowForm(true);
    };

    const handleEdit = (department: DepartmentDTO) => {
        setSelectedDepartment(department);
        setShowForm(true);
    };

    const handleDelete = (department: DepartmentDTO) => {
        setDepartmentToDelete(department);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (!departmentToDelete) return;

        try {
            await departmentsApi.delete(departmentToDelete.id);
            await loadDepartments();
            setShowDeleteDialog(false);
            setDepartmentToDelete(null);
        } catch (error) {
            console.error('Erro ao excluir departamento:', error);
        }
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setSelectedDepartment(null);
        loadDepartments();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Carregando departamentos...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Departamentos</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie os departamentos da organização
                    </p>
                </div>
                <Button onClick={handleCreate} leftIcon={<Plus className="w-4 h-4" />}>
                    Novo Departamento
                </Button>
            </div>

            {/* Department Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((department) => (
                    <div
                        key={department.id}
                        className="card p-6 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">{department.name}</h3>
                                    <p className="text-sm text-muted-foreground">{department.code}</p>
                                </div>
                            </div>
                        </div>

                        {department.description && (
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                {department.description}
                            </p>
                        )}

                        {/* Info */}
                        <div className="space-y-2 mb-4">
                            {department.parent && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                        Subordinado a: <span className="text-foreground">{department.parent.name}</span>
                                    </span>
                                </div>
                            )}

                            {department.manager && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                        Gestor: <span className="text-foreground">{department.manager.fullName}</span>
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground">
                                    <span className="font-semibold text-foreground">{department.employeeCount}</span> funcionários
                                </span>
                                <span className="text-muted-foreground">
                                    <span className="font-semibold text-foreground">{department.subdepartmentCount}</span> subdepartamentos
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-4 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(department)}
                                leftIcon={<Edit className="w-4 h-4" />}
                                className="flex-1"
                            >
                                Editar
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(department)}
                                leftIcon={<Trash2 className="w-4 h-4" />}
                                className="flex-1"
                            >
                                Excluir
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {departments.length === 0 && (
                <div className="text-center py-12">
                    <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum departamento cadastrado</h3>
                    <p className="text-muted-foreground mb-4">
                        Comece criando o primeiro departamento da organização
                    </p>
                    <Button onClick={handleCreate} leftIcon={<Plus className="w-4 h-4" />}>
                        Criar Departamento
                    </Button>
                </div>
            )}

            {/* Form Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedDepartment ? 'Editar Departamento' : 'Novo Departamento'}
                        </DialogTitle>
                    </DialogHeader>
                    <DepartmentForm
                        department={selectedDepartment}
                        onSuccess={handleFormSuccess}
                        onCancel={() => setShowForm(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Exclusão</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir o departamento <strong>{departmentToDelete?.name}</strong>?
                            Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancelar
                        </Button>
                        <Button variant="danger" onClick={confirmDelete}>
                            Excluir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
