'use client';

import { useState, useEffect } from 'react';
import { Users, Building2, ChevronRight } from 'lucide-react';
import { managersApi, ManagerDTO } from '@/lib/api/managers';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function ManagerList() {
    const [managers, setManagers] = useState<ManagerDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedManager, setSelectedManager] = useState<ManagerDTO | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        loadManagers();
    }, []);

    const loadManagers = async () => {
        try {
            setLoading(true);
            const data = await managersApi.list();
            setManagers(data);
        } catch (error) {
            console.error('Erro ao carregar gestores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (manager: ManagerDTO) => {
        setSelectedManager(manager);
        setShowDetails(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Carregando gestores...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Gestores</h1>
                <p className="text-muted-foreground mt-1">
                    Visualize gestores e seus departamentos
                </p>
            </div>

            {/* Managers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {managers.map((manager) => (
                    <div
                        key={manager.id}
                        className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => handleViewDetails(manager)}
                    >
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg">{manager.fullName}</h3>
                                <p className="text-sm text-muted-foreground">{manager.registrationNumber}</p>
                            </div>
                        </div>

                        {manager.positionName && (
                            <p className="text-sm text-muted-foreground mb-2">
                                <span className="font-medium">Cargo:</span> {manager.positionName}
                            </p>
                        )}

                        {manager.departmentName && (
                            <p className="text-sm text-muted-foreground mb-4">
                                <span className="font-medium">Departamento:</span> {manager.departmentName}
                            </p>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                                <div className="text-2xl font-bold text-primary">
                                    {manager.totalManagedDepartments}
                                </div>
                                <div className="text-xs text-muted-foreground">Departamentos</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-primary">
                                    {manager.totalSubordinates}
                                </div>
                                <div className="text-xs text-muted-foreground">Subordinados</div>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-4"
                            rightIcon={<ChevronRight className="w-4 h-4" />}
                        >
                            Ver Detalhes
                        </Button>
                    </div>
                ))}
            </div>

            {managers.length === 0 && (
                <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum gestor encontrado</h3>
                    <p className="text-muted-foreground">
                        Atribua gestores aos departamentos para vê-los aqui
                    </p>
                </div>
            )}

            {/* Details Dialog */}
            {selectedManager && (
                <Dialog open={showDetails} onOpenChange={setShowDetails}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Detalhes do Gestor</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Manager Info */}
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Users className="w-8 h-8 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold">{selectedManager.fullName}</h3>
                                    <p className="text-muted-foreground">{selectedManager.email}</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {selectedManager.positionName} • {selectedManager.registrationNumber}
                                    </p>
                                </div>
                            </div>

                            {/* Managed Departments */}
                            <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Building2 className="w-5 h-5" />
                                    Departamentos Gerenciados ({selectedManager.managedDepartments.length})
                                </h4>
                                <div className="space-y-2">
                                    {selectedManager.managedDepartments.map((dept) => (
                                        <div
                                            key={dept.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                        >
                                            <div>
                                                <div className="font-medium">{dept.name}</div>
                                                <div className="text-sm text-muted-foreground">{dept.code}</div>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {dept.employeeCount} funcionários
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-primary">
                                        {selectedManager.totalManagedDepartments}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Departamentos Gerenciados</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-primary">
                                        {selectedManager.totalSubordinates}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Subordinados Diretos</div>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
