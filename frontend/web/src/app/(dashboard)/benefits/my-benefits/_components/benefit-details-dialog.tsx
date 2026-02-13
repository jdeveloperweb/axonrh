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
import { Badge } from '@/components/ui/badge';
import { EmployeeBenefit, BenefitType } from '@/types/benefits';
import { benefitsApi } from '@/lib/api/benefits';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heart, Calendar, CreditCard, Info, MapPin, Building2 } from 'lucide-react';

interface BenefitDetailsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    benefit: EmployeeBenefit | null;
}

export function BenefitDetailsDialog({
    isOpen,
    onOpenChange,
    benefit
}: BenefitDetailsDialogProps) {
    const [benefitType, setBenefitType] = useState<BenefitType | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchTypeDetails = async () => {
            if (benefit?.benefitTypeId) {
                setLoading(true);
                try {
                    const data = await benefitsApi.getTypeById(benefit.benefitTypeId);
                    setBenefitType(data);
                } catch (error) {
                    console.error('Error fetching benefit type details:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        if (isOpen && benefit) {
            fetchTypeDetails();
        } else {
            setBenefitType(null);
        }
    }, [isOpen, benefit]);

    if (!benefit) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[var(--color-primary)]/10 rounded-lg">
                            <Heart className="w-5 h-5 text-[var(--color-primary)]" />
                        </div>
                        <DialogTitle className="text-xl">{benefit.benefitTypeName}</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Status e Categoria */}
                    <div className="flex gap-2">
                        <Badge variant="success">ATIVO</Badge>
                        <Badge variant="outline">
                            {benefit.benefitCategory === 'EARNING' ? 'Provento' : 'Desconto'}
                        </Badge>
                    </div>

                    {/* Detalhes de Valor */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Valor / Base</p>
                            <p className="text-xl font-bold text-slate-900">
                                {benefit.calculationType === 'FIXED_VALUE'
                                    ? `R$ ${benefit.fixedValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                    : `${benefit.percentage}%`}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Início do Benefício</p>
                            <p className="text-sm font-medium">
                                {benefit.startDate ? format(new Date(benefit.startDate), 'dd MMMM yyyy', { locale: ptBR }) : '-'}
                            </p>
                        </div>
                    </div>

                    {/* Descrição do Benefício */}
                    {benefitType?.description && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-bold flex items-center gap-2">
                                <Info className="w-4 h-4 text-blue-500" />
                                Sobre o Benefício
                            </h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {benefitType.description}
                            </p>
                        </div>
                    )}

                    {/* Regras Específicas se houver */}
                    {benefitType?.rules && (
                        <div className="space-y-3 pt-2">
                            <h4 className="text-sm font-bold">Regras de Utilização</h4>
                            <div className="space-y-2">
                                {benefitType.rules.ruleType === 'TRANSPORT_VOUCHER' && (
                                    <div className="text-sm bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                        <p className="font-medium text-blue-900">Vale Transporte</p>
                                        <p className="text-blue-700 text-xs mt-1">
                                            O desconto é limitado a {benefitType.rules.percentage}% do salário base, conforme legislação vigente.
                                        </p>
                                    </div>
                                )}
                                {benefitType.rules.ruleType === 'HEALTH_PLAN' && (
                                    <div className="text-sm bg-green-50/50 p-3 rounded-lg border border-green-100">
                                        <p className="font-medium text-green-900">Plano de Saúde</p>
                                        <p className="text-green-700 text-xs mt-1">
                                            Coparticipação aplicada conforme utilização. Consultar tabela de custos para dependentes.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Informações Adicionais */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-start gap-3">
                            <CreditCard className="w-4 h-4 text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">Método de Disponibilização</p>
                                <p className="text-xs text-slate-500">Cartão de benefícios ou crédito direto em conta.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">Frequência</p>
                                <p className="text-xs text-slate-500">Crédito mensal até o 5º dia útil.</p>
                            </div>
                        </div>
                    </div>

                    {/* Observações */}
                    {benefit.notes && (
                        <div className="border-t pt-4">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Notas Internas</p>
                            <p className="text-sm text-slate-600 italic">"{benefit.notes}"</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                        Fechar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
