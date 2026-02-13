'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmployeeBenefit, EmployeeBenefitRequest, BenefitType } from '@/types/benefits';
import { benefitsApi } from '@/lib/api/benefits';
import { employeesApi, Employee } from '@/lib/api/employees';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface EmployeeBenefitDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    selectedBenefit: EmployeeBenefit | null;
    onSuccess: () => void;
    employeeInfo?: { id: string; name: string };
    benefitTypes: BenefitType[];
}

export function EmployeeBenefitDialog({
    isOpen,
    onOpenChange,
    selectedBenefit,
    onSuccess,
    employeeInfo,
    benefitTypes
}: EmployeeBenefitDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [formData, setFormData] = useState<EmployeeBenefitRequest>({
        employeeId: '',
        employeeName: '',
        benefitTypeId: '',
        fixedValue: 0,
        percentage: 0,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: '',
        notes: ''
    });

    const selectedType = benefitTypes.find(t => t.id === formData.benefitTypeId);

    useEffect(() => {
        if (selectedBenefit) {
            setFormData({
                employeeId: selectedBenefit.employeeId,
                employeeName: selectedBenefit.employeeName,
                benefitTypeId: selectedBenefit.benefitTypeId,
                fixedValue: selectedBenefit.fixedValue || 0,
                percentage: selectedBenefit.percentage || 0,
                startDate: selectedBenefit.startDate,
                endDate: selectedBenefit.endDate || '',
                notes: selectedBenefit.notes || ''
            });
        } else if (employeeInfo) {
            setFormData((prev: EmployeeBenefitRequest) => ({
                ...prev,
                employeeId: employeeInfo.id,
                employeeName: employeeInfo.name,
                benefitTypeId: '',
                fixedValue: 0,
                percentage: 0,
                startDate: format(new Date(), 'yyyy-MM-dd'),
                endDate: '',
                notes: ''
            }));
        } else {
            setFormData((prev: EmployeeBenefitRequest) => ({
                ...prev,
                employeeId: '',
                employeeName: '',
                benefitTypeId: '',
                fixedValue: 0,
                percentage: 0,
                startDate: format(new Date(), 'yyyy-MM-dd'),
                endDate: '',
                notes: ''
            }));
        }
    }, [selectedBenefit, employeeInfo, isOpen]);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const response = await employeesApi.list({ status: 'ACTIVE', size: 1000 });
                setEmployees(response.content || []);
            } catch (error) {
                console.error('Error fetching employees:', error);
            }
        };

        if (isOpen && !selectedBenefit && !employeeInfo) {
            fetchEmployees();
        }
    }, [isOpen, selectedBenefit, employeeInfo]);

    const handleTypeChange = (typeId: string) => {
        const type = benefitTypes.find(t => t.id === typeId);
        setFormData({
            ...formData,
            benefitTypeId: typeId,
            fixedValue: type?.defaultValue || 0,
            percentage: type?.defaultPercentage || 0
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (selectedBenefit) {
                await benefitsApi.updateEmployeeBenefit(selectedBenefit.id, formData);
            } else {
                await benefitsApi.assignBenefit(formData);
            }
            toast({
                title: 'Sucesso',
                description: `Benefício ${selectedBenefit ? 'atualizado' : 'atribuído'} com sucesso.`,
            });
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Error saving employee benefit:', error);
            toast({
                title: 'Erro',
                description: 'Houve um erro ao salvar o benefício do colaborador.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {selectedBenefit ? 'Editar Benefício' : 'Atribuir Novo Benefício'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Colaborador</Label>
                        {selectedBenefit || employeeInfo ? (
                            <Input value={formData.employeeName} disabled className="bg-slate-50" />
                        ) : (
                            <Select
                                value={formData.employeeId}
                                onValueChange={(id) => {
                                    const emp = employees.find(e => e.id === id);
                                    setFormData({ ...formData, employeeId: id, employeeName: emp?.fullName || emp?.socialName || '' });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um colaborador" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id}>
                                            {emp.fullName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="benefitType">Tipo de Benefício</Label>
                        <Select
                            value={formData.benefitTypeId}
                            onValueChange={handleTypeChange}
                        >
                            <SelectTrigger disabled={!!selectedBenefit}>
                                <SelectValue placeholder="Selecione um benefício" />
                            </SelectTrigger>
                            <SelectContent>
                                {benefitTypes.map(type => (
                                    <SelectItem key={type.id} value={type.id}>
                                        {type.name} ({type.category === 'EARNING' ? 'Provento' : 'Desconto'})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {selectedType?.calculationType === 'FIXED_VALUE' || (!selectedType && (formData.fixedValue || 0) > 0) ? (
                            <div className="space-y-2">
                                <Label htmlFor="fixedValue">Valor Mensal (R$)</Label>
                                <Input
                                    id="fixedValue"
                                    type="number"
                                    step="0.01"
                                    value={formData.fixedValue}
                                    onChange={e => setFormData({ ...formData, fixedValue: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>
                        ) : selectedType?.calculationType === 'SALARY_PERCENTAGE' ? (
                            <div className="space-y-2">
                                <Label htmlFor="percentage">Percentual (%)</Label>
                                <Input
                                    id="percentage"
                                    type="number"
                                    step="0.01"
                                    value={formData.percentage}
                                    onChange={e => setFormData({ ...formData, percentage: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>
                        ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Data de Início</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">Data de Fim (Opcional)</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Informações adicionais..."
                            className="resize-none h-20"
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="btn-primary" disabled={loading || !formData.benefitTypeId || !formData.employeeId}>
                            {loading ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

