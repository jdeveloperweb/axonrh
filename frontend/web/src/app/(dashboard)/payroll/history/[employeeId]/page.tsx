'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    ChevronLeft,
    Search,
    Filter,
    Download,
    History,
    FileText,
    TrendingDown,
    TrendingUp,
    Calendar,
    CreditCard,
    ArrowRight,
    ChevronRight
} from 'lucide-react';
import { payrollApi, Payroll } from '@/lib/api/payroll';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function EmployeePayrollHistoryPage() {
    const params = useParams();
    const employeeId = params.employeeId as string;
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<Payroll[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await payrollApi.getEmployeeHistory(employeeId);
                setHistory(data);
            } catch (error) {
                console.error('Error fetching employee history:', error);
            } finally {
                setLoading(false);
            }
        };
        if (employeeId) fetchData();
    }, [employeeId]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/employees">
                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Histórico de Pagamentos</h1>
                    <p className="text-[var(--color-text-secondary)]">Todas as folhas processadas para este colaborador</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="card overflow-hidden">
                    <div className="p-4 border-b bg-[var(--color-surface-variant)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <History className="w-5 h-5 text-[var(--color-primary)]" />
                            <span className="font-bold">Evolução Salarial</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-[var(--color-text-tertiary)] font-bold uppercase text-[10px] tracking-widest">
                                <tr>
                                    <th className="px-6 py-4 text-left">Competência</th>
                                    <th className="px-6 py-4 text-right">Total Bruto</th>
                                    <th className="px-6 py-4 text-right">Total Descontos</th>
                                    <th className="px-6 py-4 text-right">Líquido</th>
                                    <th className="px-6 py-4 text-center">Data Proc.</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={7} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                                        </tr>
                                    ))
                                ) : history.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center text-[var(--color-text-tertiary)]">
                                            Nenhum registro encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    history.map((record) => (
                                        <tr key={record.id} className="hover:bg-[var(--color-surface-variant)]/50 transition-colors">
                                            <td className="px-6 py-4 font-bold">{record.month < 10 ? `0${record.month}` : record.month}/{record.year}</td>
                                            <td className="px-6 py-4 text-right text-blue-600 font-medium">{formatCurrency(record.totalEarnings)}</td>
                                            <td className="px-6 py-4 text-right text-red-600 font-medium">{formatCurrency(record.totalDeductions)}</td>
                                            <td className="px-6 py-4 text-right font-black">{formatCurrency(record.netValue)}</td>
                                            <td className="px-6 py-4 text-center text-[var(--color-text-tertiary)]">{new Date(record.calculatedAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                    record.status === 'CLOSED' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                                )}>
                                                    {record.statusLabel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/payroll/${record.id}`}>
                                                    <Button variant="ghost" size="sm" className="gap-2 text-[var(--color-primary)]">
                                                        Holerite
                                                        <ChevronRight className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
