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

    if (!loading && periods.length === 0) {
        return (
            <div className="container max-w-4xl py-16 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-[70vh] flex flex-col justify-center">
                <div className="flex flex-col items-center text-center space-y-8">
                    <div className="relative">
                        <div className="bg-orange-100 p-10 rounded-full ring-8 ring-orange-50 animate-pulse">
                            <AlertTriangle className="h-20 w-20 text-orange-500" />
                        </div>
                    </div>

                    <div className="space-y-3 max-w-xl">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Nenhum Período Disponível</h1>
                        <p className="text-muted-foreground text-xl">
                            No momento, não encontramos períodos de férias disponíveis para você solicitar.
                        </p>
                    </div>

                    <Card className="w-full max-w-lg border-2 border-dashed bg-slate-50/50 backdrop-blur-sm rounded-3xl overflow-hidden">
                        <CardHeader className="bg-white/50 border-b">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Info className="h-5 w-5 text-blue-500" />
                                Entenda o motivo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ul className="text-sm text-left space-y-4 text-slate-600">
                                <li className="flex gap-4 items-start group">
                                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                        <Check className="h-3 w-3" />
                                    </div>
                                    <span className="leading-relaxed">Seus períodos anteriores já foram totalmente utilizados ou agendados.</span>
                                </li>
                                <li className="flex gap-4 items-start group">
                                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                        <Check className="h-3 w-3" />
                                    </div>
                                    <span className="leading-relaxed">Você pode ainda não ter completado os 12 meses do período aquisitivo atual.</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col sm:flex-row gap-4 pt-6 w-full max-w-md">
                        <Button
                            variant="outline"
                            size="xl"
                            onClick={() => router.push('/vacation')}
                            className="flex-1 rounded-2xl border-2 gap-2 h-14"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            Ver Histórico
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full px-6 lg:px-10 py-10 space-y-10 animate-in fade-in zoom-in-95 duration-500">
            {/* Premium Header Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 flex flex-col justify-center space-y-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-[10px] uppercase tracking-widest animate-in slide-in-from-left-4">
                            <Sparkles className="h-3.5 w-3.5 fill-current" />
                            Nova Solicitação
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tighter">
                            Planeje o seu <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500 italic">merecido descanso.</span>
                        </h1>
                        <p className="text-xl text-slate-500 max-w-2xl leading-relaxed font-medium">
                            Acompanhe seu saldo e escolha as melhores datas para renovar as energias.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 pt-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-12 w-12 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-slate-300">
                                    <CalendarDays className="h-5 w-5" />
                                </div>
                            ))}
                            <div className="h-12 w-12 rounded-full border-4 border-white bg-primary flex items-center justify-center text-white text-[10px] font-black">
                                +15
                            </div>
                        </div>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest leading-snug">
                            <span className="text-slate-900">18 colaboradores</span> <br /> planejando férias este mês.
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-4 flex items-center">
                    <div className="w-full relative group">
                        <div className="absolute -inset-4 bg-primary/10 rounded-[3rem] blur-2xl group-hover:bg-primary/20 transition-all duration-1000" />
                        <Card className="relative bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-2xl overflow-hidden">
                            <div className="bg-slate-900 p-10 text-white relative h-56 flex flex-col justify-end overflow-hidden">
                                <div className="absolute top-[-20%] right-[-10%] opacity-10">
                                    <Sparkles className="h-64 w-64" />
                                </div>
                                <div className="relative z-10 space-y-2">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Saldo Disponível</p>
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-8xl font-black tracking-tighter tabular-nums leading-none">
                                            {selectedPeriod?.remainingDays || 0}
                                        </span>
                                        <span className="text-2xl font-black opacity-30 tracking-widest">dias</span>
                                    </div>
                                </div>
                            </div>
                            <CardContent className="p-10 flex items-center gap-6">
                                <div className="bg-slate-50 p-4 rounded-2xl shrink-0 border-2 border-white shadow-sm">
                                    <Calculator className="h-6 w-6 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Início do Ciclo</p>
                                    <p className="text-sm text-slate-500 font-bold">
                                        {selectedPeriod ? format(new Date(selectedPeriod.acquisitionStartDate), 'dd/MM/yy') : '--/--/--'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Separator className="opacity-50" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                <div className="lg:col-span-8 space-y-12">
                    {/* Step 1: Period Selection */}
                    <section className="space-y-8">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 rounded-[2rem] bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-2xl shadow-slate-900/20">1</div>
                            <h2 className="text-4xl font-black tracking-tight text-slate-900">Qual período utilizar?</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {periods.map((period) => (
                                <button
                                    key={period.id}
                                    onClick={() => {
                                        form.setValue('vacationPeriodId', period.id);
                                        setSelectedPeriod(period);
                                    }}
                                    className={cn(
                                        "w-full text-left group relative p-8 rounded-[2.5rem] border-2 transition-all duration-500",
                                        selectedPeriod?.id === period.id
                                            ? "border-primary bg-white shadow-2xl shadow-primary/10 ring-[12px] ring-primary/5"
                                            : "border-slate-100 bg-white hover:border-slate-200 shadow-sm"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Referência do Período</p>
                                            <p className="text-xl font-black text-slate-900 tracking-tight">
                                                {format(new Date(period.acquisitionStartDate), 'dd/MM/yy')} — {format(new Date(period.acquisitionEndDate), 'dd/MM/yy')}
                                            </p>
                                        </div>
                                        <div className={cn(
                                            "h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-500",
                                            selectedPeriod?.id === period.id ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" : "bg-slate-50 text-slate-300 group-hover:scale-110"
                                        )}>
                                            <Check className="h-5 w-5 stroke-[3px]" />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{period.remainingDays} DIAS DISPONÍVEIS</span>
                                        </div>
                                        <div className="h-4 bg-slate-50 rounded-full p-1 shadow-inner border border-slate-100/50">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full transition-all duration-1000 shadow-lg shadow-primary/10"
                                                style={{ width: `${Math.max(10, (period.remainingDays / period.totalDays) * 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                        <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Prazo Limite:</span>
                                        <span className={cn(
                                            "text-xs font-black px-3 py-1 rounded-lg",
                                            period.isExpiringSoon ? "bg-red-50 text-red-500" : "bg-slate-50 text-slate-700"
                                        )}>
                                            {format(new Date(period.concessionEndDate), 'dd/MM/yyyy')}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Step 2: Date Selection */}
                    <section className={cn("space-y-8 transition-all duration-700", !selectedPeriod && "opacity-20 pointer-events-none")}>
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 rounded-[2rem] bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-2xl shadow-slate-900/20">2</div>
                            <h2 className="text-4xl font-black tracking-tight text-slate-900">Escolha suas datas</h2>
                        </div>

                        <div className="bg-white border-2 border-slate-100 rounded-[3rem] p-1 shadow-2xl shadow-slate-200/40 overflow-hidden">
                            <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x border-slate-50">
                                <div className="lg:col-span-3 p-10 lg:p-14 flex justify-center bg-slate-50/20">
                                    <Calendar
                                        mode="range"
                                        selected={watchDateRange || undefined}
                                        onSelect={(range: any) => form.setValue('dateRange', range)}
                                        disabled={(date) => date < addDays(new Date(), 30)}
                                        locale={ptBR}
                                        className="h-full w-full"
                                        classNames={{
                                            months: "w-full",
                                            month: "w-full space-y-8",
                                            caption_label: "text-2xl font-black tracking-tight text-slate-900",
                                            head_cell: "text-slate-400 font-black text-[10px] uppercase tracking-widest p-4",
                                            cell: "p-0 min-h-[64px] min-w-[64px] relative",
                                            day: "h-14 w-14 p-0 font-black text-lg text-slate-600 hover:bg-slate-100 rounded-2xl transition-all aria-selected:opacity-100 m-auto flex items-center justify-center",
                                            day_range_start: "bg-primary text-white rounded-2xl hover:bg-primary hover:text-white shadow-xl shadow-primary/30",
                                            day_range_end: "bg-primary text-white rounded-2xl hover:bg-primary hover:text-white shadow-xl shadow-primary/30",
                                            day_range_middle: "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary rounded-none",
                                            day_selected: "bg-primary text-white rounded-2xl hover:bg-primary hover:text-white",
                                            day_today: "bg-slate-200/50 text-slate-900",
                                            nav_button: "border-2 border-slate-100 hover:bg-slate-50 rounded-xl h-10 w-10"
                                        }}
                                    />
                                </div>
                                <div className="lg:col-span-2 p-10 lg:p-14 flex flex-col justify-between space-y-12">
                                    <div className="space-y-10">
                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Regras de Solicitação</h4>
                                            <div className="space-y-5">
                                                <div className="flex gap-5 group">
                                                    <div className="h-7 w-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                                                        <Check className="h-4 w-4 stroke-[3px]" />
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-500 leading-snug">Solicite com <span className="text-slate-900 font-black">30 dias</span> de antecedência.</p>
                                                </div>
                                                <div className="flex gap-5 group">
                                                    <div className="h-7 w-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                                                        <Check className="h-4 w-4 stroke-[3px]" />
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-500 leading-snug">Evite inícios aos finais de semana ou feriados.</p>
                                                </div>
                                            </div>
                                        </div>

                                        {watchDateRange?.from && watchDateRange?.to ? (
                                            <div className="p-10 bg-slate-900 rounded-[2.5rem] text-white space-y-8 animate-in zoom-in duration-500 shadow-2xl shadow-slate-900/40 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                                    <UMbrella className="h-32 w-32" />
                                                </div>
                                                <div className="flex justify-between items-center relative z-10">
                                                    <Badge className="bg-primary text-white border-none text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-primary/20">SELECIONADO</Badge>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-5xl font-black italic tabular-nums">{daysSelected}</span>
                                                        <span className="text-sm font-black opacity-30">DIAS</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6 relative z-10">
                                                    <div className="flex-1 space-y-2">
                                                        <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em]">EMBARQUE</p>
                                                        <p className="text-2xl font-black tracking-tight">{format(watchDateRange.from, 'dd MMM', { locale: ptBR })}</p>
                                                    </div>
                                                    <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                        <ArrowRight className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="flex-1 text-right space-y-2">
                                                        <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em]">RETORNO</p>
                                                        <p className="text-2xl font-black tracking-tight">{format(watchDateRange.to, 'dd MMM', { locale: ptBR })}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-64 border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-10 bg-slate-50/30">
                                                <div className="h-20 w-20 rounded-full bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center mb-6">
                                                    <CalendarIcon className="h-8 w-8 text-primary/30" />
                                                </div>
                                                <p className="text-sm font-black text-slate-300 uppercase tracking-widest leading-loose">
                                                    Toque no calendário <br /> para definir as datas
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[9px] font-black text-slate-300 text-center uppercase tracking-[0.3em]">
                                        Confirme as datas de ida e volta
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column: Sticky Summary */}
                <div className="lg:col-span-4 lg:sticky lg:top-10 space-y-8">
                    <Card className="rounded-[3rem] border-2 border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden bg-white">
                        <CardHeader className="p-12 pb-8 border-b border-slate-50">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-3xl font-black tracking-tighter text-slate-900 leading-none">Resumo</h3>
                                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black text-[10px] px-3 py-1 uppercase tracking-widest">Verificado</Badge>
                            </div>
                            <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border-2 border-white">
                                <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-slate-200/50">
                                    <Umbrella className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 leading-none mb-1">Cálculo de Férias</p>
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Base CLT / Convenção</p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-12 pt-10 space-y-12">
                            <div className="space-y-8">
                                <div className="flex justify-between items-center group">
                                    <span className="text-sm font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Período de Gozo</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-slate-900 tabular-nums">{daysSelected}</span>
                                        <span className="text-[10px] font-black text-slate-300 uppercase">dias</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <div className="space-y-0.5">
                                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Venda de Saldo</span>
                                        <p className="text-[9px] font-bold text-slate-300 uppercase">Abono Pecuniário</p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-slate-900 tabular-nums">{watchSellDays ? 10 : 0}</span>
                                            <span className="text-[10px] font-black text-slate-300 uppercase">dias</span>
                                        </div>
                                        <Switch
                                            checked={watchSellDays}
                                            onCheckedChange={(checked) => form.setValue('sellDays', checked)}
                                            disabled={!selectedPeriod || selectedPeriod.remainingDays < 10}
                                            className="data-[state=checked]:bg-primary h-8 w-14"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <div className="space-y-0.5">
                                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Adiantar 13º</span>
                                        <p className="text-[9px] font-bold text-slate-300 uppercase">Primeira Parcela</p>
                                    </div>
                                    <Switch
                                        checked={form.watch('advance13thSalary')}
                                        onCheckedChange={(checked) => form.setValue('advance13thSalary', checked)}
                                        className="data-[state=checked]:bg-primary h-8 w-14"
                                    />
                                </div>
                            </div>

                            <div className="p-10 bg-slate-50 rounded-[2.5rem] space-y-8 border-2 border-white shadow-inner">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Consumo de Saldo</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className={cn(
                                            "text-6xl font-black tracking-tighter tabular-nums leading-none",
                                            selectedPeriod && totalDaysUsed > selectedPeriod.remainingDays ? "text-red-500" : "text-slate-900"
                                        )}>
                                            {totalDaysUsed}
                                        </span>
                                        <span className="text-lg font-black text-slate-300 italic">/ {selectedPeriod?.remainingDays || 30}d</span>
                                    </div>
                                </div>
                                <div className="h-4 w-full bg-white rounded-full p-1.5 shadow-sm border border-slate-100">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-1000 shadow-lg",
                                            selectedPeriod && totalDaysUsed > selectedPeriod.remainingDays
                                                ? "bg-gradient-to-r from-red-500 to-rose-600 shadow-red-200"
                                                : "bg-gradient-to-r from-primary to-orange-500 shadow-primary/20"
                                        )}
                                        style={{ width: `${Math.min(100, (totalDaysUsed / (selectedPeriod?.remainingDays || 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-3 ml-2">
                                    <MessageCircle className="h-4 w-4 text-primary" />
                                    <Label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Observações Adicionais</Label>
                                </div>
                                <Textarea
                                    {...form.register('notes')}
                                    placeholder="Deseja deixar algum recado para seu gestor?"
                                    className="bg-slate-50 border-2 border-transparent focus-visible:border-primary/20 focus-visible:bg-white rounded-[2rem] p-8 min-h-[160px] shadow-inner resize-none transition-all font-medium text-slate-600 placeholder:text-slate-300"
                                />
                            </div>

                            <div className="space-y-6 pt-6">
                                {selectedPeriod && totalDaysUsed > selectedPeriod.remainingDays && (
                                    <Alert variant="destructive" className="rounded-3xl border-none bg-red-50 text-red-900 p-8 shadow-xl shadow-red-900/5 animate-in shake duration-500">
                                        <div className="flex gap-6">
                                            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                                                <AlertTriangle className="h-6 w-6 text-red-500" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <AlertTitle className="font-black text-base italic uppercase tracking-tight">Saldo Insuficiente!</AlertTitle>
                                                <AlertDescription className="text-xs font-bold opacity-70 leading-relaxed uppercase tracking-widest">
                                                    Você tem {selectedPeriod.remainingDays} dias, mas solicitou {totalDaysUsed}. Ajuste as datas ou abono.
                                                </AlertDescription>
                                            </div>
                                        </div>
                                    </Alert>
                                )}

                                <Button
                                    size="xl"
                                    onClick={form.handleSubmit(onSubmit)}
                                    disabled={submitting || !selectedPeriod || (selectedPeriod && totalDaysUsed > selectedPeriod.remainingDays) || totalDaysUsed === 0}
                                    className="w-full h-24 rounded-[2rem] font-black text-2xl uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all group py-0"
                                >
                                    {submitting ? (
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            Solicitar Agora
                                            <ArrowRight className="h-8 w-8 group-hover:translate-x-3 transition-transform duration-500" />
                                        </div>
                                    )}
                                </Button>
                                <p className="text-[9px] text-center font-black text-slate-300 uppercase tracking-widest px-10 leading-relaxed group hover:text-slate-500 transition-colors">
                                    Ao confirmar, uma notificação será enviada ao seu gestor e ao RH para análise técnica.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-12 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-[-20%] right-[-10%] opacity-5 group-hover:scale-110 transition-transform duration-1000 rotate-12">
                            <PlaneLanding className="h-64 w-64" />
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div className="h-16 w-16 rounded-[1.5rem] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                                <Info className="h-8 w-8 text-primary" />
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-2xl font-black tracking-tight leading-tight uppercase italic">Dica de Bem-Estar</h4>
                                <p className="text-base text-slate-400 font-medium leading-relaxed">
                                    Desconectar é fundamental. Planeje suas férias para que não precise checar e-mails. O time cuida de tudo por aqui!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function UMbrella(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 2v1" />
            <path d="M15.5 3.5 14.8 4.2" />
            <path d="M21 7h-1" />
            <path d="M22 12h-1" />
            <path d="M18.5 15.5 17.8 14.8" />
            <path d="M12 22v-1" />
            <path d="M12 12V2" />
            <path d="M12 12l8.5 8.5" />
            <path d="M12 12l-8.5 8.5" />
            <path d="m11 21 .5 1a.5.5 0 0 0 .5 0l.5-1" />
            <path d="M22 12a10 10 0 0 0-20 0" />
        </svg>
    )
}
