'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { differenceInDays, addDays, format, isWeekend, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { vacationApi, VacationPeriod } from '@/lib/api/vacation';
import {
    CalendarIcon,
    ArrowLeft,
    Loader2,
    AlertTriangle,
    Info,
    CheckCircle2,
    Umbrella,
    Calculator,
    CalendarDays,
    Banknote,
    Check,
    ArrowRight,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
    vacationPeriodId: z.string().min(1, 'Selecione um período aquisitivo'),
    dateRange: z.object({
        from: z.date({ required_error: 'Início é obrigatório' }),
        to: z.date({ required_error: 'Fim é obrigatório' }),
    }).nullable().refine((data) => data && data.from && data.to, {
        message: 'Selecione o período completo',
    }),
    sellDays: z.boolean().default(false),
    advance13thSalary: z.boolean().default(false),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function VacationRequestPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [periods, setPeriods] = useState<VacationPeriod[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<VacationPeriod | null>(null);

    // Load periods
    useEffect(() => {
        const loadPeriods = async () => {
            try {
                const data = await vacationApi.getMyPeriods();
                const available = data.filter(p => p.status === 'OPEN' || p.status === 'PARTIALLY_USED');
                setPeriods(available);
                if (available.length > 0) {
                    setSelectedPeriod(available[0]);
                    form.setValue('vacationPeriodId', available[0].id);
                }
            } catch (error) {
                console.error('Error loading periods:', error);
                toast({
                    title: 'Erro',
                    description: 'Não foi possível carregar os períodos aquisitivos.',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };
        loadPeriods();
    }, [toast]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            vacationPeriodId: '',
            dateRange: null,
            sellDays: false,
            advance13thSalary: false,
            notes: '',
        },
    });

    const watchDateRange = form.watch('dateRange');
    const watchSellDays = form.watch('sellDays');

    const daysSelected = watchDateRange?.from && watchDateRange?.to
        ? differenceInDays(watchDateRange.to, watchDateRange.from) + 1
        : 0;

    const totalDaysUsed = daysSelected + (watchSellDays ? 10 : 0);

    const onSubmit = async (values: FormValues) => {
        try {
            setSubmitting(true);

            if (!selectedPeriod) return;

            if (totalDaysUsed > selectedPeriod.remainingDays) {
                toast({
                    title: 'Dias insuficientes',
                    description: `Você tem apenas ${selectedPeriod.remainingDays} dias disponíveis.`,
                    variant: 'destructive',
                });
                return;
            }

            await vacationApi.createRequest({
                vacationPeriodId: values.vacationPeriodId,
                startDate: format(values.dateRange!.from, 'yyyy-MM-dd'),
                endDate: format(values.dateRange!.to, 'yyyy-MM-dd'),
                sellDays: values.sellDays,
                soldDaysCount: values.sellDays ? 10 : 0,
                advance13thSalary: values.advance13thSalary,
                notes: values.notes,
                fractioned: selectedPeriod.usedDays > 0,
            });

            toast({
                title: 'Sucesso!',
                description: 'Sua solicitação de férias foi enviada para aprovação.',
            });

            router.push('/vacation');
        } catch (error: any) {
            toast({
                title: 'Erro na solicitação',
                description: error.response?.data?.message || 'Ocorreu um erro ao processar sua solicitação.',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
                <p className="text-sm text-gray-500">Consultando períodos aquisitivos...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">

            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Nova Solicitação de Férias</h1>
                        <p className="text-[var(--color-text-secondary)]">
                            Escolha o período ideal para renovar as energias.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-8 space-y-6">

                    {/* Step 1: Period Selection */}
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm">1</div>
                                <CardTitle className="text-lg font-bold">Qual período utilizar?</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {periods.map((period) => (
                                    <button
                                        key={period.id}
                                        onClick={() => {
                                            form.setValue('vacationPeriodId', period.id);
                                            setSelectedPeriod(period);
                                        }}
                                        className={cn(
                                            "w-full text-left p-5 rounded-lg border transition-all",
                                            selectedPeriod?.id === period.id
                                                ? "border-[var(--color-primary)] bg-blue-50/50 shadow-sm ring-2 ring-[var(--color-primary)]/20"
                                                : "border-gray-200 bg-white hover:border-gray-300"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-xs text-gray-400 font-medium mb-1">Referência do Ciclo</p>
                                                <p className="text-sm font-bold text-gray-900">
                                                    {format(new Date(period.acquisitionStartDate), 'dd/MM/yy')} a {format(new Date(period.acquisitionEndDate), 'dd/MM/yy')}
                                                </p>
                                            </div>
                                            <div className={cn(
                                                "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                                                selectedPeriod?.id === period.id ? "bg-[var(--color-primary)] text-white" : "bg-gray-100 text-gray-300"
                                            )}>
                                                <Check className="h-4 w-4" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-500 font-medium">{period.remainingDays} dias disponíveis</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.max(10, (period.remainingDays / period.totalDays) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Step 2: Date Selection */}
                    <Card className={cn("border-none shadow-sm bg-white transition-all", !selectedPeriod && "opacity-40 pointer-events-none")}>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm">2</div>
                                <CardTitle className="text-lg font-bold">Escolha suas datas</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-7 flex justify-center">
                                    <div className="w-full max-w-sm">
                                        <Calendar
                                            mode="range"
                                            selected={watchDateRange || undefined}
                                            onSelect={(range: any) => form.setValue('dateRange', range)}
                                            disabled={(date) => date < addDays(new Date(), 30)}
                                            locale={ptBR}
                                            className="w-full rounded-lg border border-gray-200 p-4"
                                        />
                                    </div>
                                </div>
                                <div className="lg:col-span-5 space-y-6">
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Regras</h4>
                                        <div className="space-y-3">
                                            <div className="flex gap-3">
                                                <div className="h-5 w-5 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                                    <Check className="h-3 w-3" />
                                                </div>
                                                <p className="text-sm text-gray-600">Solicite com <span className="font-bold text-gray-900">30 dias</span> de antecedência.</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="h-5 w-5 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                                    <Check className="h-3 w-3" />
                                                </div>
                                                <p className="text-sm text-gray-600">Evite inícios aos finais de semana ou feriados.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {watchDateRange?.from && watchDateRange?.to ? (
                                        <div className="p-5 bg-gray-900 rounded-lg text-white space-y-4 animate-in fade-in duration-300">
                                            <div className="flex justify-between items-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[var(--color-primary)] text-white">Selecionado</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-bold tabular-nums">{daysSelected}</span>
                                                    <span className="text-xs text-gray-400">dias</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1">
                                                    <p className="text-[10px] text-gray-500 uppercase font-medium mb-1">Início</p>
                                                    <p className="text-lg font-bold">{format(watchDateRange.from, 'dd MMM', { locale: ptBR })}</p>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-gray-500" />
                                                <div className="flex-1 text-right">
                                                    <p className="text-[10px] text-gray-500 uppercase font-medium mb-1">Fim</p>
                                                    <p className="text-lg font-bold">{format(watchDateRange.to, 'dd MMM', { locale: ptBR })}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-40 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-center p-6">
                                            <CalendarIcon className="h-8 w-8 text-gray-200 mb-3" />
                                            <p className="text-sm text-gray-400">Defina as datas no calendário</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Summary Sidebar */}
                <div className="xl:col-span-4 xl:sticky xl:top-10 space-y-6">
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="pb-4 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-bold">Resumo</CardTitle>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">Verificado</span>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-5">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Gozo de Férias</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-gray-900 tabular-nums">{daysSelected}</span>
                                        <span className="text-xs text-gray-400">dias</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Abono (Venda)</span>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold text-gray-900 tabular-nums">{watchSellDays ? 10 : 0}</span>
                                            <span className="text-xs text-gray-400">dias</span>
                                        </div>
                                        <Switch
                                            checked={watchSellDays}
                                            onCheckedChange={(checked) => form.setValue('sellDays', checked)}
                                            disabled={!selectedPeriod || selectedPeriod.remainingDays < 10}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Adiantar 13º</span>
                                    <Switch
                                        checked={form.watch('advance13thSalary')}
                                        onCheckedChange={(checked) => form.setValue('advance13thSalary', checked)}
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-xs text-gray-400 font-medium">Utilização Total</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className={cn(
                                            "text-3xl font-bold tabular-nums",
                                            selectedPeriod && totalDaysUsed > selectedPeriod.remainingDays ? "text-red-500" : "text-gray-900"
                                        )}>
                                            {totalDaysUsed}
                                        </span>
                                        <span className="text-sm text-gray-300">/ {selectedPeriod?.remainingDays || 30}d</span>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-white rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-500",
                                            selectedPeriod && totalDaysUsed > selectedPeriod.remainingDays
                                                ? "bg-red-500"
                                                : "bg-[var(--color-primary)]"
                                        )}
                                        style={{ width: `${Math.min(100, (totalDaysUsed / (selectedPeriod?.remainingDays || 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                {selectedPeriod && totalDaysUsed > selectedPeriod.remainingDays && (
                                    <Alert variant="destructive" className="rounded-lg">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle className="font-bold text-sm">Saldo Excedido</AlertTitle>
                                        <AlertDescription className="text-xs">Ajuste seus dias para prosseguir.</AlertDescription>
                                    </Alert>
                                )}

                                <Button
                                    onClick={form.handleSubmit(onSubmit)}
                                    disabled={submitting || !selectedPeriod || (selectedPeriod && totalDaysUsed > selectedPeriod.remainingDays) || totalDaysUsed === 0}
                                    className="w-full h-12 rounded-lg font-bold text-sm bg-[var(--color-primary)] hover:opacity-90 transition-opacity"
                                >
                                    {submitting ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            Solicitar Férias
                                            <ArrowRight className="h-4 w-4" />
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
