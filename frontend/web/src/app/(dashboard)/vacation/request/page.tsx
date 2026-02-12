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
    PlaneLanding,
    Umbrella,
    Calculator,
    CalendarDays,
    Banknote,
    MessageCircle,
    Check,
    ArrowRight,
    Star,
    Sparkles
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
            <div className="flex flex-col justify-center items-center h-[70vh] gap-6">
                <div className="relative">
                    <Loader2 className="h-16 w-16 animate-spin text-primary opacity-20" />
                    <Umbrella className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-slate-800">Preparando seu descanso...</h3>
                    <p className="text-muted-foreground animate-pulse">Consultando seus períodos aquisitivos</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full px-6 lg:px-10 py-10 space-y-12 animate-in fade-in zoom-in-95 duration-700">

            {/* Design System Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.back()}
                        className="h-14 w-14 rounded-full border-slate-100 bg-white shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center p-0"
                    >
                        <ArrowLeft className="h-6 w-6 text-slate-600" />
                    </Button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Gestão de Pessoas</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight tracking-tighter">
                            Nova Solicitação de <span className="text-primary italic">Férias</span>
                        </h1>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
                <div className="xl:col-span-8 space-y-16">

                    {/* Welcome Banner Light */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 p-10 shadow-sm">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Umbrella className="h-64 w-64" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                            <div className="space-y-6 flex-1">
                                <h2 className="text-3xl font-black text-slate-900 leading-none">Planeje seu <span className="text-primary italic">descanso</span>.</h2>
                                <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-xl">
                                    Escolha o período ideal para renovar as energias. O sistema valida automaticamente as regras para você.
                                </p>
                                <div className="flex items-center gap-6">
                                    <div className="flex -space-x-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-12 w-12 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-slate-300">
                                                <CalendarDays className="h-5 w-5" />
                                            </div>
                                        ))}
                                        <div className="h-12 w-12 rounded-full border-4 border-white bg-primary flex items-center justify-center text-white text-[10px] font-black">
                                            +15
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">Equipe ativa no planejamento</p>
                                </div>
                            </div>

                            <div className="relative w-full md:w-[320px]">
                                <Card className="bg-slate-900 border-none rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-10">
                                        <Star className="h-32 w-32" />
                                    </div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Saldo Atual</p>
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-8xl font-black tracking-tighter tabular-nums leading-none">
                                            {selectedPeriod?.remainingDays || 0}
                                        </span>
                                        <span className="text-2xl font-black opacity-30 tracking-widest uppercase">dias</span>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>

                    {/* Step 1: Period Selection */}
                    <section className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-base shadow-lg shadow-slate-900/10">1</div>
                            <h3 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Qual período utilizar?</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {periods.map((period) => (
                                <button
                                    key={period.id}
                                    onClick={() => {
                                        form.setValue('vacationPeriodId', period.id);
                                        setSelectedPeriod(period);
                                    }}
                                    className={cn(
                                        "w-full text-left group relative p-8 rounded-xl border transition-all duration-300",
                                        selectedPeriod?.id === period.id
                                            ? "border-primary bg-white shadow-lg ring-4 ring-primary/5"
                                            : "border-slate-100 bg-white hover:border-slate-200 shadow-sm"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Referência do Ciclo</p>
                                            <p className="text-2xl font-black text-slate-900 tracking-tighter">
                                                {format(new Date(period.acquisitionStartDate), 'dd/MM/yy')} <span className="text-slate-200">/</span> {format(new Date(period.acquisitionEndDate), 'dd/MM/yy')}
                                            </p>
                                        </div>
                                        <div className={cn(
                                            "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                                            selectedPeriod?.id === period.id ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" : "bg-slate-50 text-slate-200 group-hover:scale-110"
                                        )}>
                                            <Check className="h-6 w-6 stroke-[3px]" />
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{period.remainingDays} DIAS DISPONÍVEIS</span>
                                        </div>
                                        <div className="h-5 bg-slate-50 rounded-full p-1.5 shadow-inner border border-slate-100/50">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full transition-all duration-1000 shadow-lg shadow-primary/10"
                                                style={{ width: `${Math.max(10, (period.remainingDays / period.totalDays) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Step 2: Date Selection */}
                    <section className={cn("space-y-8 transition-all duration-700", !selectedPeriod && "opacity-20 pointer-events-none")}>
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-base shadow-lg shadow-slate-900/10">2</div>
                            <h3 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Escolha suas datas</h3>
                        </div>

                        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x border-slate-50">
                                {/* FIXED CALENDAR CONTAINER FOR V9 */}
                                <div className="lg:col-span-7 p-8 lg:p-12 flex justify-center bg-slate-50/20">
                                    <div className="w-full max-w-sm rd-v9-fix">
                                        <Calendar
                                            mode="range"
                                            selected={watchDateRange || undefined}
                                            onSelect={(range: any) => form.setValue('dateRange', range)}
                                            disabled={(date) => date < addDays(new Date(), 30)}
                                            locale={ptBR}
                                            className="w-full"
                                            classNames={{
                                                month_grid: "w-full border-separate border-spacing-1",
                                                weekdays: "flex justify-between mb-2",
                                                weekday: "text-slate-400 font-bold text-[10px] uppercase tracking-widest w-10 text-center",
                                                weeks: "space-y-1",
                                                week: "flex justify-between w-full",
                                                day: "h-10 w-10 p-0 font-bold text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-all flex items-center justify-center cursor-pointer",
                                                day_button: "h-full w-full flex items-center justify-center rounded-lg",
                                                selected: "bg-primary text-white rounded-lg hover:bg-primary hover:text-white shadow-md shadow-primary/20",
                                                range_start: "bg-primary text-white rounded-lg",
                                                range_end: "bg-primary text-white rounded-lg",
                                                range_middle: "bg-primary/10 text-primary rounded-none",
                                                today: "bg-slate-100 text-slate-900",
                                                outside: "opacity-20",
                                                caption_label: "text-lg font-black tracking-tight text-slate-900 mb-4 block text-center uppercase",
                                                nav: "flex items-center justify-between absolute w-full px-2 top-0 left-0",
                                                month_caption: "relative flex justify-center items-center h-10 mb-6"
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="lg:col-span-5 p-8 lg:p-10 flex flex-col justify-between space-y-10">
                                    <div className="space-y-10">
                                        <div className="space-y-6">
                                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">Regras AxonRH</h4>
                                            <div className="space-y-4">
                                                <div className="flex gap-4 group">
                                                    <div className="h-6 w-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm border border-emerald-100 transition-all">
                                                        <Check className="h-3 w-3 stroke-[3px]" />
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-500 leading-snug">Solicite com <span className="text-slate-900 font-black">30 dias</span> de antecedência.</p>
                                                </div>
                                                <div className="flex gap-4 group">
                                                    <div className="h-6 w-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm border border-emerald-100 transition-all">
                                                        <Check className="h-3 w-3 stroke-[3px]" />
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-500 leading-snug">Evite inícios aos finais de semana ou feriados.</p>
                                                </div>
                                            </div>
                                        </div>

                                        {watchDateRange?.from && watchDateRange?.to ? (
                                            <div className="p-8 bg-slate-900 rounded-2xl text-white space-y-8 animate-in zoom-in duration-500 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-6 opacity-5">
                                                    <Umbrella className="h-32 w-32" />
                                                </div>
                                                <div className="flex justify-between items-center relative z-10">
                                                    <Badge className="bg-primary text-white border-none text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Selecionado</Badge>
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className="text-5xl font-black tabular-nums">{daysSelected}</span>
                                                        <span className="text-[10px] font-black opacity-30 tracking-[0.2em]">DIAS</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6 relative z-10">
                                                    <div className="flex-1 space-y-1">
                                                        <p className="text-[8px] font-black opacity-30 uppercase tracking-[0.3em]">Embarque</p>
                                                        <p className="text-2xl font-black tracking-tight uppercase leading-none">{format(watchDateRange.from, 'dd MMM', { locale: ptBR })}</p>
                                                    </div>
                                                    <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                        <ArrowRight className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div className="flex-1 text-right space-y-1">
                                                        <p className="text-[8px] font-black opacity-30 uppercase tracking-[0.3em]">Retorno</p>
                                                        <p className="text-2xl font-black tracking-tight uppercase leading-none">{format(watchDateRange.to, 'dd MMM', { locale: ptBR })}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-48 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-slate-50/30 group">
                                                <div className="h-16 w-16 rounded-xl bg-white shadow-md flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                                                    <CalendarIcon className="h-6 w-6 text-primary opacity-20" />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] leading-loose">
                                                    Defina as datas <br /> no calendário
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[8px] font-black text-slate-300 text-center uppercase tracking-[0.4em]">
                                        Contagem automática via CLT
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="xl:col-span-4 xl:sticky xl:top-10 space-y-8">
                    <Card className="rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden bg-white">
                        <CardHeader className="p-10 pb-8 border-b border-slate-50">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-black tracking-tighter text-slate-900 leading-none uppercase">Resumo</h3>
                                <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-[9px] px-3 py-1 uppercase tracking-widest">Verificado</Badge>
                            </div>
                            <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-xl border border-slate-100/50 shadow-inner">
                                <div className="h-12 w-12 rounded-lg bg-white flex items-center justify-center shadow-md">
                                    <Umbrella className="h-6 w-6 text-primary" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-sm font-black text-slate-900 leading-none">Cálculo Automático</p>
                                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Base contratual ativa</p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-10 pt-10 space-y-10">
                            <div className="space-y-8">
                                <div className="flex justify-between items-center group">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-slate-900 transition-colors">Gozo de Férias</span>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-3xl font-black text-slate-900 tabular-nums leading-none">{daysSelected}</span>
                                        <span className="text-[9px] font-black text-slate-300 uppercase italic">dias</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-slate-900 transition-colors">Abono (Venda)</span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-3xl font-black text-slate-900 tabular-nums leading-none">{watchSellDays ? 10 : 0}</span>
                                            <span className="text-[9px] font-black text-slate-300 uppercase italic">dias</span>
                                        </div>
                                        <Switch
                                            checked={watchSellDays}
                                            onCheckedChange={(checked) => form.setValue('sellDays', checked)}
                                            disabled={!selectedPeriod || selectedPeriod.remainingDays < 10}
                                            className="data-[state=checked]:bg-primary h-6 w-11"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-slate-900 transition-colors">Adiantar 13º</span>
                                    </div>
                                    <Switch
                                        checked={form.watch('advance13thSalary')}
                                        onCheckedChange={(checked) => form.setValue('advance13thSalary', checked)}
                                        className="data-[state=checked]:bg-primary h-6 w-11"
                                    />
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50 rounded-2xl space-y-8 border border-slate-100 shadow-inner">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Utilização</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className={cn(
                                            "text-5xl font-black tracking-tighter tabular-nums leading-none",
                                            selectedPeriod && totalDaysUsed > selectedPeriod.remainingDays ? "text-red-500" : "text-slate-900"
                                        )}>
                                            {totalDaysUsed}
                                        </span>
                                        <span className="text-lg font-black text-slate-200 italic">/ {selectedPeriod?.remainingDays || 30}d</span>
                                    </div>
                                </div>
                                <div className="h-3 w-full bg-white rounded-full p-0.5 shadow-sm border border-slate-100">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-1000",
                                            selectedPeriod && totalDaysUsed > selectedPeriod.remainingDays
                                                ? "bg-red-500"
                                                : "bg-primary"
                                        )}
                                        style={{ width: `${Math.min(100, (totalDaysUsed / (selectedPeriod?.remainingDays || 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-6 pt-4">
                                {selectedPeriod && totalDaysUsed > selectedPeriod.remainingDays && (
                                    <Alert variant="destructive" className="rounded-xl border-none bg-red-50 text-red-900 px-6 py-4 animate-in shake duration-500">
                                        <div className="flex gap-4">
                                            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                                            <div className="space-y-1">
                                                <AlertTitle className="font-black text-sm uppercase tracking-tight leading-none">Saldo Excedido!</AlertTitle>
                                                <AlertDescription className="text-[10px] font-bold opacity-60 leading-relaxed uppercase tracking-widest">
                                                    Ajuste seus dias para prosseguir.
                                                </AlertDescription>
                                            </div>
                                        </div>
                                    </Alert>
                                )}

                                <Button
                                    size="xl"
                                    onClick={form.handleSubmit(onSubmit)}
                                    disabled={submitting || !selectedPeriod || (selectedPeriod && totalDaysUsed > selectedPeriod.remainingDays) || totalDaysUsed === 0}
                                    className="w-full h-20 rounded-xl font-black text-lg uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all group bg-[#FF7A00]"
                                >
                                    {submitting ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            Solicitar Férias
                                            <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-500" />
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
