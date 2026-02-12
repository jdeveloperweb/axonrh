'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import {
    FileText,
    Download,
    Printer,
    ChevronRight,
    Wallet,
    Calendar,
    History,
    AlertCircle
} from 'lucide-react';
import { payrollApi, Payroll } from '@/lib/api/payroll';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MyPayslipsPage() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.employeeId) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const data = await payrollApi.getEmployeeHistory(user.employeeId);
                setPayrolls(data);
            } catch (error) {
                console.error('Error fetching my payslips:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const displayPayrolls = payrolls.filter(p =>
        ['CLOSED', 'APPROVED', 'CALCULATED', 'RECALCULATED'].includes(p.status)
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Meus Holerites</h1>
                    <p className="text-[var(--color-text-secondary)]">Acompanhe seus comprovantes de pagamento</p>
                </div>
            </div>

            {!user?.employeeId && !loading && (
                <div className="card p-8 text-center text-[var(--color-text-tertiary)] flex flex-col items-center gap-4">
                    <AlertCircle className="w-12 h-12 opacity-20" />
                    <p>Seu usuário não está vinculado a um colaborador.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="card p-6 animate-pulse">
                            <div className="h-4 bg-gray-100 rounded w-1/2 mb-4"></div>
                            <div className="h-8 bg-gray-100 rounded w-3/4 mb-4"></div>
                            <div className="h-4 bg-gray-100 rounded w-full"></div>
                        </div>
                    ))
                ) : displayPayrolls.length === 0 ? (
                    <div className="col-span-full card p-20 text-center flex flex-col items-center gap-4">
                        <FileText className="w-16 h-16 opacity-10" />
                        <p className="text-[var(--color-text-secondary)]">Nenhum holerite disponível no momento.</p>
                    </div>
                ) : (
                    displayPayrolls.map((payroll) => (
                        <div key={payroll.id} className="card p-6 hover:shadow-lg transition-all group border-l-4 border-l-[var(--color-primary)]">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                                        {new Date(payroll.year, payroll.month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                    </span>
                                    <h3 className="text-xl font-black mt-1">Holerite Mensal</h3>
                                </div>
                                <div className="p-2 bg-[var(--color-surface-variant)] rounded-lg text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                                    <Wallet className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--color-text-secondary)]">Valor Líquido:</span>
                                    <span className="font-bold text-green-600">{formatCurrency(payroll.netValue)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--color-text-secondary)]">Data Pagamento:</span>
                                    <span>{payroll.calculatedAt ? new Date(payroll.calculatedAt).toLocaleDateString() : '—'}</span>
                                </div>
                            </div>

                            <Link href={`/payroll/${payroll.id}`}>
                                <Button className="w-full gap-2 group-hover:bg-[var(--color-primary)]">
                                    <FileText className="w-4 h-4" />
                                    Visualizar
                                </Button>
                            </Link>
                        </div>
                    ))
                )}
            </div>

            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex gap-4 items-center">
                <div className="p-4 bg-white rounded-full text-blue-600 shadow-sm">
                    <Calendar className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-bold text-blue-900">Programação de Pagamento</h4>
                    <p className="text-sm text-blue-700">Lembre-se que o pagamento é realizado até o 5º dia útil de cada mês subsequente ao trabalhado.</p>
                </div>
            </div>
        </div>
    );
}
