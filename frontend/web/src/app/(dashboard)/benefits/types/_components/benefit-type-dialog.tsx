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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BenefitType, BenefitTypeRequest } from '@/types/benefits';
import { benefitsApi } from '@/lib/api/benefits';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, FileText, Settings2 } from 'lucide-react';

interface BenefitTypeDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    selectedType: BenefitType | null;
    onSuccess: () => void;
}

export function BenefitTypeDialog({
    isOpen,
    onOpenChange,
    selectedType,
    onSuccess
}: BenefitTypeDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<BenefitTypeRequest>({
        name: '',
        description: '',
        category: 'EARNING',
        calculationType: 'FIXED_VALUE',
        defaultValue: 0,
        defaultPercentage: 0,
        payrollCode: '',
        payrollNature: 'EARNING',
        incidenceInss: false,
        incidenceFgts: false,
        incidenceIrrf: false,
        externalProvider: 'NONE',
        integrationConfig: ''
    });

    useEffect(() => {
        if (selectedType) {
            setFormData({
                name: selectedType.name,
                description: selectedType.description || '',
                category: selectedType.category,
                calculationType: selectedType.calculationType,
                defaultValue: selectedType.defaultValue || 0,
                defaultPercentage: selectedType.defaultPercentage || 0,
                payrollCode: selectedType.payrollCode || '',
                payrollNature: selectedType.payrollNature || selectedType.category,
                incidenceInss: selectedType.incidenceInss || false,
                incidenceFgts: selectedType.incidenceFgts || false,
                incidenceIrrf: selectedType.incidenceIrrf || false,
                externalProvider: selectedType.externalProvider || 'NONE',
                integrationConfig: selectedType.integrationConfig || ''
            });
        } else {
            setFormData({
                name: '',
                description: '',
                category: 'EARNING',
                calculationType: 'FIXED_VALUE',
                defaultValue: 0,
                defaultPercentage: 0,
                payrollCode: '',
                payrollNature: 'EARNING',
                incidenceInss: false,
                incidenceFgts: false,
                incidenceIrrf: false,
                externalProvider: 'NONE',
                integrationConfig: ''
            });
        }
    }, [selectedType, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (selectedType) {
                await benefitsApi.updateType(selectedType.id, formData);
            } else {
                await benefitsApi.createType(formData);
            }
            toast({
                title: 'Sucesso',
                description: `Benefício ${selectedType ? 'atualizado' : 'criado'} com sucesso.`,
            });
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Error saving benefit type:', error);
            toast({
                title: 'Erro',
                description: 'Houve um erro ao salvar o benefício.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {selectedType ? 'Editar Tipo de Benefício' : 'Novo Tipo de Benefício'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-[var(--color-surface-variant)]/50">
                            <TabsTrigger value="basic" className="gap-2">
                                <Settings2 className="w-4 h-4" /> Básico
                            </TabsTrigger>
                            <TabsTrigger value="payroll" className="gap-2">
                                <FileText className="w-4 h-4" /> Folha
                            </TabsTrigger>
                            <TabsTrigger value="integration" className="gap-2">
                                <CreditCard className="w-4 h-4" /> Integr.
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4 pt-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome do Benefício</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ex: Vale Alimentação"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Descrição</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Breve descrição sobre o benefício..."
                                        className="resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Categoria</Label>
                                        <Select
                                            value={formData.category}
                                            onValueChange={(val: any) => setFormData({ ...formData, category: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="EARNING">Provento</SelectItem>
                                                <SelectItem value="DEDUCTION">Desconto</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="calcType">Tipo de Cálculo</Label>
                                        <Select
                                            value={formData.calculationType}
                                            onValueChange={(val: any) => setFormData({ ...formData, calculationType: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="FIXED_VALUE">Valor Fixo</SelectItem>
                                                <SelectItem value="SALARY_PERCENTAGE">Percentual do Salário</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {formData.calculationType === 'FIXED_VALUE' ? (
                                        <div className="space-y-2">
                                            <Label htmlFor="defaultValue">Valor Padrão (R$)</Label>
                                            <Input
                                                id="defaultValue"
                                                type="number"
                                                step="0.01"
                                                value={formData.defaultValue}
                                                onChange={e => setFormData({ ...formData, defaultValue: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label htmlFor="defaultPercentage">Percentual Padrão (%)</Label>
                                            <Input
                                                id="defaultPercentage"
                                                type="number"
                                                step="0.01"
                                                value={formData.defaultPercentage}
                                                onChange={e => setFormData({ ...formData, defaultPercentage: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="payroll" className="space-y-4 pt-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="payrollCode">Código da Rubrica (Folha)</Label>
                                    <Input
                                        id="payrollCode"
                                        value={formData.payrollCode}
                                        onChange={e => setFormData({ ...formData, payrollCode: e.target.value })}
                                        placeholder="Ex: 0050 ou VALE_REFEICAO"
                                    />
                                </div>

                                <div className="space-y-3 pt-2">
                                    <Label>Incidências de Impostos</Label>
                                    <div className="grid grid-cols-1 gap-4 bg-[var(--color-surface-variant)]/30 p-4 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="inss" checked={formData.incidenceInss} onCheckedChange={(val: boolean) => setFormData({ ...formData, incidenceInss: val })} />
                                            <label htmlFor="inss" className="text-sm font-medium leading-none cursor-pointer">Incidência INSS</label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="fgts" checked={formData.incidenceFgts} onCheckedChange={(val: boolean) => setFormData({ ...formData, incidenceFgts: val })} />
                                            <label htmlFor="fgts" className="text-sm font-medium leading-none cursor-pointer">Incidência FGTS</label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="irrf" checked={formData.incidenceIrrf} onCheckedChange={(val: boolean) => setFormData({ ...formData, incidenceIrrf: val })} />
                                            <label htmlFor="irrf" className="text-sm font-medium leading-none cursor-pointer">Incidência IRRF</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="integration" className="space-y-4 pt-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="provider">Provedor Externo</Label>
                                    <Select
                                        value={formData.externalProvider}
                                        onValueChange={(val: string) => setFormData({ ...formData, externalProvider: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NONE">Nenhum</SelectItem>
                                            <SelectItem value="IFOOD">iFood Benefícios</SelectItem>
                                            <SelectItem value="FLASH">Flash</SelectItem>
                                            <SelectItem value="CAJU">Caju</SelectItem>
                                            <SelectItem value="SODEXO">Sodexo / Pluxee</SelectItem>
                                            <SelectItem value="ALELO">Alelo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.externalProvider !== 'NONE' && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                                            As configurações de API e sincronização automática para este provedor serão realizadas após o salvamento deste tipo de benefício.
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="config">Configurações Base (JSON)</Label>
                                            <Textarea
                                                id="config"
                                                value={formData.integrationConfig}
                                                onChange={e => setFormData({ ...formData, integrationConfig: e.target.value })}
                                                placeholder='{"clientId": "...", "apiKey": "..."}'
                                                className="font-mono text-xs"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
