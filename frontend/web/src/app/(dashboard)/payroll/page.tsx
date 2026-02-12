'use client';

import { useState, useEffect } from 'react';
import {
    Calculator,
    FileText,
    Users,
    Settings,
    Search,
    ChevronRight,
    Download,
    CheckCircle2,
    AlertCircle,
    Clock,
    Filter,
    ArrowRight
} from 'lucide-react';
import { payrollApi, Payroll } from '@/lib/api/payroll';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PayrollPage() {
    const [loading, setLoading] = useState(true);
    const [competency, setCompetency] = useState(() => {
        const today = new Date();
        return { month: today.getMonth() + 1, year: today.getFullYear() };
    });
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);
    const [stats, setStats] = useState({
        totalEmployees: 0,
        totalGross: 0,
        totalNet: 0,
        status: 'OPEN' as 'OPEN' | 'CLOSED',
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await payrollApi.getCompetencyPayrolls(competency.month, competency.year);
            setPayrolls(data);

            const totalGross = data.reduce((acc, p) => acc + p.totalEarnings, 0);
            const totalNet = data.reduce((acc, p) => acc + p.netValue, 0);

            setStats({
                totalEmployees: data.length,
                totalGross,
                totalNet,
                status: data.every(p => p.status === 'CLOSED') && data.length > 0 ? 'CLOSED' : 'OPEN',
            });
        } catch (error) {
            console.error('Error fetching payrolls:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [competency]);

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Folha de Pagamento</h1>
                    <p className="text-[var(--color-text-secondary)]">Gestão mensal de proventos e descontos</p>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/payroll/tax-brackets">
                        <Button variant="outline" className="gap-2">
                            <Settings className="w-4 h-4" />
                            Tabelas
                        </Button>
                    </Link>
                    <Link href="/payroll/process">
                        <Button className="gap-2 bg-[var(--color-primary)] text-white">
                            <Calculator className="w-4 h-4" />
                            Processar Lote
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Competency Selector & Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="card p-6 flex flex-col justify-between">
                    <div>
                        <label className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2 block">
                            Competência
                        </label>
                        <div className="flex flex-col gap-2">
                            <select
                                value={competency.month}
                                onChange={(e) => setCompetency(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                                className="input"
                            >
                                {months.map((m, i) => (
                                    <option key={i} value={i + 1}>{m}</option>
                                ))}
                            </select>
                            <select
                                value={competency.year}
                                onChange={(e) => setCompetency(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                                className="input"
                            >
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--color-text-secondary)]">Status:</span>
                            <span className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-medium",
                                stats.status === 'CLOSED'
                                    ? "bg-green-100 text-green-700"
                                    : "bg-blue-100 text-blue-700"
                            )}>
                                {stats.status === 'CLOSED' ? 'Encerrada' : 'Aberta'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-[var(--color-text-secondary)]">Colaboradores</span>
                    </div>
                    <p className="text-2xl font-bold">{stats.totalEmployees}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Processados neste mês</p>
                </div>

                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                            <Calculator className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-[var(--color-text-secondary)]">Total Bruto</span>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(stats.totalGross)}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Soma de proventos</p>
                </div>

                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-[var(--color-text-secondary)]">Total Líquido</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalNet)}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Valor a pagar</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="card overflow-hidden">
                <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
                        <input
                            type="text"
                            placeholder="Buscar colaborador..."
                            className="input pl-10 w-full"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Filter className="w-4 h-4" />
                            Filtrar
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Download className="w-4 h-4" />
                            Relatório
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[var(--color-surface-variant)] text-[var(--color-text-secondary)] font-medium">
                            <tr>
                                <th className="px-6 py-3">Colaborador</th>
                                <th className="px-6 py-3 text-right">Proventos</th>
                                <th className="px-6 py-3 text-right">Descontos</th>
                                <th className="px-6 py-3 text-right">Líquido</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div></td>
                                        <td className="px-6 py-4"></td>
                                    </tr>
                                ))
                            ) : payrolls.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-[var(--color-text-tertiary)]">
                                            <FileText className="w-12 h-12 opacity-20" />
                                            <p>Nenhuma folha encontrada para esta competência.</p>
                                            <Link href="/payroll/process">
                                                <Button variant="ghost" className="text-[var(--color-primary)]">
                                                    Clique aqui para iniciar o processamento
                                                </Button>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                payrolls.map((payroll) => (
                                    <tr key={payroll.id} className="hover:bg-[var(--color-surface-variant)] transition-colors">
                                        <td className="px-6 py-4 font-medium">{payroll.employeeName}</td>
                                        <td className="px-6 py-4 text-right text-blue-600">{formatCurrency(payroll.totalEarnings)}</td>
                                        <td className="px-6 py-4 text-right text-red-600">{formatCurrency(payroll.totalDeductions)}</td>
                                        <td className="px-6 py-4 text-right font-bold">{formatCurrency(payroll.netValue)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                payroll.status === 'CLOSED' ? "bg-green-100 text-green-700" :
                                                    payroll.status === 'DRAFT' ? "bg-yellow-100 text-yellow-700" :
                                                        "bg-blue-100 text-blue-700"
                                            )}>
                                                {payroll.statusLabel || payroll.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/payroll/${payroll.id}`}>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
    );
}
