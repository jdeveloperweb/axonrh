'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    ChevronLeft,
    Download,
    Printer,
    RefreshCw,
    User,
    Calendar,
    Building2,
    Briefcase,
    TrendingDown,
    TrendingUp,
    Wallet,
    Clock,
    ArrowRight
} from 'lucide-react';
import { payrollApi, Payroll, PayslipResponse } from '@/lib/api/payroll';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PayrollDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [loading, setLoading] = useState(true);
    const [payroll, setPayroll] = useState<Payroll | null>(null);
    const [payslip, setPayslip] = useState<PayslipResponse | null>(null);
    const [downloading, setDownloading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pData, psData] = await Promise.all([
                payrollApi.getPayroll(id),
                payrollApi.getPayslip(id)
            ]);
            setPayroll(pData);
            setPayslip(psData);
        } catch (error) {
            console.error('Error fetching payroll details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        setDownloading(true);
        try {
            await payrollApi.downloadPayslipPdf(id);
        } catch (error) {
            console.error('Error downloading PDF:', error);
        } finally {
            setDownloading(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!payroll || !payslip) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-bold">Folha não encontrada</h2>
                <Link href="/payroll">
                    <Button variant="ghost">Voltar para listagem</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/payroll">
                        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">{payroll.employeeName}</h1>
                        <p className="text-[var(--color-text-secondary)]">Competência {payroll.month}/{payroll.year}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                        <Printer className="w-4 h-4" />
                        Imprimir
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2 min-w-[130px]"
                        onClick={handleDownloadPdf}
                        disabled={downloading}
                    >
                        {downloading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        {downloading ? 'Gerando...' : 'Baixar PDF'}
                    </Button>
                    <Button
                        className="gap-2 bg-[var(--color-primary)] text-white"
                        onClick={fetchData}
                    >
                        <RefreshCw className="w-4 h-4" />
                        Recalcular
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Employee Info Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card p-6">
                        <h3 className="text-sm font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-4 border-b pb-2">
                            Informações Gerais
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <User className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--color-text-secondary)]">Matrícula</p>
                                    <p className="font-medium">{payslip.registrationNumber || '-'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                    <Briefcase className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--color-text-secondary)]">Cargo</p>
                                    <p className="font-medium">{payslip.employeeRole || 'Não informado'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                    <Building2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--color-text-secondary)]">Departamento</p>
                                    <p className="font-medium">{payslip.employeeDepartment || 'Geral'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6">
                        <h3 className="text-sm font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-4 border-b pb-2">
                            Bases de Cálculo
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-[var(--color-text-secondary)]">Salário Base:</span>
                                <span className="font-medium">{formatCurrency(payslip.baseSalary)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-[var(--color-text-secondary)]">Base INSS:</span>
                                <span className="font-medium">{formatCurrency(payslip.inssBase)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-[var(--color-text-secondary)]">Base IRRF:</span>
                                <span className="font-medium">{formatCurrency(payslip.irrfBase)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-[var(--color-text-secondary)]">Base FGTS:</span>
                                <span className="font-medium">{formatCurrency(payslip.fgtsBase)}</span>
                            </div>
                            <div className="pt-2 border-t mt-2 flex justify-between items-center text-sm">
                                <span className="text-[var(--color-text-secondary)] font-bold">FGTS do Mês:</span>
                                <span className="font-bold text-blue-600">{formatCurrency(payslip.fgtsMonth)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-[var(--color-primary)] text-white p-6 shadow-xl relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-[var(--color-text-on-primary)]/80 text-sm font-medium">SALÁRIO LÍQUIDO</p>
                            <h2 className="text-4xl font-black mt-1">{formatCurrency(payroll.netValue)}</h2>
                            <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between text-xs">
                                <span>Versão do Cálculo: #{payroll.calculationVersion}</span>
                                <span>{new Date(payroll.calculatedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <Wallet className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
                    </div>
                </div>

                {/* Items Table */}
                <div className="lg:col-span-2">
                    <div className="card overflow-hidden h-full">
                        <div className="p-4 border-b bg-[var(--color-surface-variant)] flex items-center justify-between">
                            <h3 className="font-bold text-[var(--color-text-primary)]">Demonstrativo Detalhado</h3>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    <span className="text-[var(--color-text-secondary)]">Proventos</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    <span className="text-[var(--color-text-secondary)]">Descontos</span>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[var(--color-surface)] border-b text-[var(--color-text-tertiary)] uppercase text-[10px] font-bold tracking-widest">
                                        <th className="px-6 py-4 text-left">Ref.</th>
                                        <th className="px-6 py-4 text-left">Descrição</th>
                                        <th className="px-6 py-4 text-right">Referência</th>
                                        <th className="px-6 py-4 text-right">Proventos</th>
                                        <th className="px-6 py-4 text-right">Descontos</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {payroll.items.map((item) => (
                                        <tr key={item.id} className="hover:bg-[var(--color-surface-variant)]/50 transition-colors group">
                                            <td className="px-6 py-4 text-[var(--color-text-tertiary)] font-mono">{item.code}</td>
                                            <td className="px-6 py-4 font-medium">{item.name}</td>
                                            <td className="px-6 py-4 text-right text-[var(--color-text-secondary)]">
                                                {item.referenceValue ? (
                                                    <span>{item.referenceValue}{item.multiplier ? ` x ${item.multiplier}%` : ''}</span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right text-blue-600 font-medium">
                                                {item.type === 'EARNING' ? formatCurrency(item.calculatedValue) : ''}
                                            </td>
                                            <td className="px-6 py-4 text-right text-red-600 font-medium">
                                                {item.type === 'DEDUCTION' ? formatCurrency(item.calculatedValue) : ''}
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Summary Rows */}
                                    <tr className="bg-blue-50/30">
                                        <td colSpan={3} className="px-6 py-4 text-right font-bold text-blue-700">TOTAIS DE PROVENTOS</td>
                                        <td className="px-6 py-4 text-right font-bold text-blue-700 text-lg">{formatCurrency(payroll.totalEarnings)}</td>
                                        <td className="px-6 py-4"></td>
                                    </tr>
                                    <tr className="bg-red-50/30">
                                        <td colSpan={3} className="px-6 py-4 text-right font-bold text-red-700">TOTAIS DE DESCONTOS</td>
                                        <td className="px-6 py-4"></td>
                                        <td className="px-6 py-4 text-right font-bold text-red-700 text-lg">{formatCurrency(payroll.totalDeductions)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-auto p-8 border-t bg-[var(--color-surface)]">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="max-w-md">
                                    <h4 className="font-bold mb-2 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-[var(--color-primary)]" />
                                        Observações do Cálculo
                                    </h4>
                                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                        Folha calculada automaticamente pelo motor de regras AxonRH.
                                        Considera dados integrados de Ponto (Timesheet), Férias e Desempenho.
                                        Os valores de INSS e IRRF seguem a tabela progressiva vigente na data base.
                                    </p>
                                </div>
                                <div className="bg-[var(--color-surface-variant)] p-4 rounded-xl border border-dashed border-[var(--color-border)] min-w-[200px] flex flex-col items-center justify-center">
                                    <div className="text-xs text-[var(--color-text-tertiary)] uppercase font-bold mb-1">Valor Líquido</div>
                                    <div className="text-2xl font-black text-[var(--color-text-primary)]">{formatCurrency(payroll.netValue)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
