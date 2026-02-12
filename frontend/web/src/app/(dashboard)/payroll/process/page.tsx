'use client';

import { useState, useEffect } from 'react';
import {
    Calculator,
    ChevronLeft,
    CheckCircle2,
    AlertCircle,
    Users,
    Building2,
    Calendar,
    Loader2,
    ArrowRight
} from 'lucide-react';
import { payrollApi, PayrollRun } from '@/lib/api/payroll';
import { departmentsApi, Department } from '@/lib/api/departments';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProcessBatchPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingDepts, setLoadingDepts] = useState(true);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        departmentIds: [] as string[],
        strategy: 'ALL' as 'ALL' | 'DEPARTMENT' | 'SPECIFIC'
    });
    const [processingResult, setProcessingResult] = useState<PayrollRun | null>(null);

    useEffect(() => {
        const fetchDepts = async () => {
            try {
                const data = await departmentsApi.list();
                setDepartments(data);
            } catch (error) {
                console.error('Error fetching departments:', error);
            } finally {
                setLoadingDepts(false);
            }
        };
        fetchDepts();
    }, []);

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - 1 + i);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const result = await payrollApi.processBatch({
                month: formData.month,
                year: formData.year,
                departmentIds: formData.strategy === 'DEPARTMENT' ? formData.departmentIds : undefined,
            });
            setProcessingResult(result);
            setStep(3);
        } catch (error: any) {
            console.error('Error processing payroll:', error);
            alert('Erro ao processar folha: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const toggleDepartment = (id: string) => {
        setFormData(prev => ({
            ...prev,
            departmentIds: prev.departmentIds.includes(id)
                ? prev.departmentIds.filter(d => d !== id)
                : [...prev.departmentIds, id]
        }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/payroll">
                    <Button variant="ghost" size="sm">
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Voltar
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Processar Folha</h1>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center">
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
                            step === s ? "bg-[var(--color-primary)] text-white shadow-lg scale-110" :
                                step > s ? "bg-green-500 text-white" : "bg-[var(--color-surface-variant)] text-[var(--color-text-tertiary)]"
                        )}>
                            {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
                        </div>
                        {s < 3 && (
                            <div className={cn(
                                "w-20 h-1 mx-2 rounded-full",
                                step > s ? "bg-green-500" : "bg-[var(--color-surface-variant)]"
                            )} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step Contents */}
            <div className="card p-8">
                {step === 1 && (
                    <div className="space-y-6 animate-fade-in text-center max-w-md mx-auto">
                        <div className="p-4 bg-blue-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto text-blue-600 mb-4">
                            <Calendar className="w-10 h-10" />
                        </div>
                        <h2 className="text-xl font-bold">Selecione a Competência</h2>
                        <p className="text-[var(--color-text-secondary)]">Informe o mês e ano que deseja processar os cálculos.</p>

                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <div className="text-left">
                                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block">Mês</label>
                                <select
                                    value={formData.month}
                                    onChange={(e) => setFormData(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                                    className="input w-full"
                                >
                                    {months.map((m, i) => (
                                        <option key={i} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="text-left">
                                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block">Ano</label>
                                <select
                                    value={formData.year}
                                    onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                                    className="input w-full"
                                >
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <Button
                            className="w-full mt-8 bg-[var(--color-primary)] text-white gap-2"
                            onClick={() => setStep(2)}
                        >
                            Próximo Passo
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center max-w-md mx-auto mb-8">
                            <h2 className="text-xl font-bold">Estratégia de Cálculo</h2>
                            <p className="text-[var(--color-text-secondary)]">Deseja processar todos ou grupos específicos?</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div
                                className={cn(
                                    "p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md flex flex-col items-center gap-4 text-center",
                                    formData.strategy === 'ALL' ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-[var(--color-border)] opacity-60"
                                )}
                                onClick={() => setFormData(prev => ({ ...prev, strategy: 'ALL' }))}
                            >
                                <Users className="w-8 h-8 text-[var(--color-primary)]" />
                                <div>
                                    <h3 className="font-bold">Todos os Colaboradores</h3>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Processar toda a empresa de uma vez.</p>
                                </div>
                            </div>

                            <div
                                className={cn(
                                    "p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md flex flex-col items-center gap-4 text-center",
                                    formData.strategy === 'DEPARTMENT' ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-[var(--color-border)] opacity-60"
                                )}
                                onClick={() => setFormData(prev => ({ ...prev, strategy: 'DEPARTMENT' }))}
                            >
                                <Building2 className="w-8 h-8 text-[var(--color-primary)]" />
                                <div>
                                    <h3 className="font-bold">Por Departamento</h3>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Selecionar setores específicos.</p>
                                </div>
                            </div>
                        </div>

                        {formData.strategy === 'DEPARTMENT' && (
                            <div className="mt-8 p-4 border rounded-lg max-h-60 overflow-y-auto grid grid-cols-2 gap-2">
                                {loadingDepts ? (
                                    <div className="col-span-2 text-center py-4">Carregando setores...</div>
                                ) : (
                                    departments.map(dept => (
                                        <label key={dept.id} className="flex items-center gap-3 p-2 hover:bg-[var(--color-surface-variant)] rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.departmentIds.includes(dept.id)}
                                                onChange={() => toggleDepartment(dept.id)}
                                                className="w-4 h-4 accent-[var(--color-primary)]"
                                            />
                                            <span className="text-sm">{dept.name}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        )}

                        <div className="flex gap-4 mt-8 pt-6 border-t">
                            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Voltar</Button>
                            <Button
                                className="flex-[2] bg-[var(--color-primary)] text-white gap-2"
                                disabled={loading || (formData.strategy === 'DEPARTMENT' && formData.departmentIds.length === 0)}
                                onClick={handleSubmit}
                            >
                                {loading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
                                ) : (
                                    <><Calculator className="w-4 h-4" /> Iniciar Processamento</>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && processingResult && (
                    <div className="space-y-6 animate-fade-in text-center max-w-md mx-auto">
                        <div className="p-4 bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto text-green-600 mb-4 shadown-sm">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h2 className="text-xl font-bold text-green-600">Calculado com Sucesso!</h2>
                        <p className="text-[var(--color-text-secondary)]">O processamento da folha foi finalizado.</p>

                        <div className="grid grid-cols-2 gap-4 mt-8 text-left bg-[var(--color-surface-variant)] p-4 rounded-lg border border-[var(--color-border)]">
                            <div>
                                <span className="text-xs text-[var(--color-text-tertiary)] uppercase">Colaboradores</span>
                                <p className="text-xl font-bold">{processingResult.totalEmployees}</p>
                            </div>
                            <div>
                                <span className="text-xs text-[var(--color-text-tertiary)] uppercase">Total Líquido</span>
                                <p className="text-xl font-bold">{formatCurrency(processingResult.totalNetValue)}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 mt-8">
                            <Link href="/payroll">
                                <Button className="w-full bg-[var(--color-primary)] text-white">
                                    Ver Resultados
                                </Button>
                            </Link>
                            <Button variant="outline" className="w-full" onClick={() => {
                                setStep(1);
                                setProcessingResult(null);
                            }}>
                                Processar Outro
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
