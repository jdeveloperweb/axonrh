'use client';

import { useState, useEffect } from 'react';
import {
    Heart,
    Calendar,
    CreditCard,
    FileText,
    AlertCircle,
    Clock,
    ExternalLink
} from 'lucide-react';
import { BenefitDetailsDialog } from './_components/benefit-details-dialog';
import { EmployeeBenefit } from '@/types/benefits';
import { benefitsApi } from '@/lib/api/benefits';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MyBenefitsPage() {
    const { user } = useAuthStore();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [benefits, setBenefits] = useState<EmployeeBenefit[]>([]);
    const [selectedBenefit, setSelectedBenefit] = useState<EmployeeBenefit | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        async function loadMyBenefits() {
            const employeeId = user?.employeeId || user?.id;
            if (!employeeId) return;

            try {
                setLoading(true);
                const data = await benefitsApi.getActiveBenefitsByEmployee(employeeId);
                // Garantir que data seja um array antes de atualizar o estado
                setBenefits(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Error loading my benefits:', error);
                setBenefits([]);
            } finally {
                setLoading(false);
            }
        }
        loadMyBenefits();
    }, [user]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="animate-pulse border-[var(--color-border)]">
                            <div className="h-48 bg-[var(--color-surface-variant)]/20 rounded-xl" />
                        </Card>
                    ))
                ) : benefits.length === 0 ? (
                    <div className="col-span-full py-20 text-center space-y-4">
                        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 border-slate-100">
                            <Heart className="w-10 h-10 text-slate-300" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Nenhum benefício ativo</h3>
                            <p className="text-[var(--color-text-secondary)]">Você ainda não possui benefícios ativos atribuídos ao seu perfil.</p>
                        </div>
                    </div>
                ) : (
                    benefits.map((benefit) => (
                        <Card key={benefit.id} className="group hover:border-[var(--color-primary)] transition-all duration-300 overflow-hidden shadow-sm">
                            <CardHeader className="pb-4 bg-[var(--color-surface-variant)]/30 border-b border-[var(--color-border)] group-hover:bg-[var(--color-primary)]/5 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-[var(--color-border)] group-hover:border-[var(--color-primary)]/20 transition-colors">
                                        <Heart className="w-5 h-5 text-[var(--color-primary)]" />
                                    </div>
                                    <Badge variant="success">ATIVO</Badge>
                                </div>
                                <CardTitle className="text-xl pt-4 font-bold">{benefit.benefitTypeName}</CardTitle>
                                <p className="text-sm text-[var(--color-text-secondary)]">{benefit.benefitCategory === 'EARNING' ? 'Provento' : 'Desconto'}</p>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">Valor / Base</p>
                                        <p className="text-lg font-bold text-[var(--color-text-primary)]">
                                            {benefit.calculationType === 'FIXED_VALUE'
                                                ? `R$ ${benefit.fixedValue?.toFixed(2)}`
                                                : `${benefit.percentage}%`}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">Início em</p>
                                        <p className="text-sm font-medium">
                                            {benefit.startDate ? (() => {
                                                const date = new Date(benefit.startDate);
                                                return isNaN(date.getTime()) ? 'Data inválida' : format(date, 'dd MMM yyyy', { locale: ptBR });
                                            })() : '-'}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                                        <CreditCard className="w-4 h-4 text-blue-500" />
                                        <span>Cartão disponível no app</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                                        <Clock className="w-4 h-4 text-orange-500" />
                                        <span>Próximo crédito: {format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1), 'dd/MM/yyyy')}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setSelectedBenefit(benefit);
                                        setIsDialogOpen(true);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-primary)]/5 hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)] transition-all"
                                >
                                    Ver Detalhes <ExternalLink className="w-3 h-3" />
                                </button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <BenefitDetailsDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                benefit={selectedBenefit}
            />

            <Card className="bg-blue-50/50 border-blue-100 rounded-2xl p-6">
                <div className="flex gap-4 items-start">
                    <AlertCircle className="w-6 h-6 text-blue-500 shrink-0" />
                    <div className="space-y-1">
                        <h4 className="font-bold text-blue-900">Como funciona o cálculo?</h4>
                        <p className="text-sm text-blue-700 leading-relaxed">
                            Os benefícios são calculados e processados mensalmente junto com a folha de pagamento.
                            Descontos de benefícios como Vale Transporte seguem as regras de incidência permitidas por lei (ex: limite de 6% do salário base).
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
