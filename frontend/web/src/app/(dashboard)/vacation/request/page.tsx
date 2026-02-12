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
        <div className="container max-w-7xl py-10 space-y-10 animate-in fade-in zoom-in-95 duration-500">
            {/* Premium Header Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 flex flex-col justify-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest animate-in slide-in-from-left-4">
                        <Star className="h-3 w-3 fill-current" />
                        Portal do Colaborador
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter">
                            Planeje o seu <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">merecido descanso.</span>
                        </h1>
                        <p className="text-xl text-slate-500 max-w-2xl leading-relaxed">
                            Acompanhe seu saldo e escolha as melhores datas para renovar as energias.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 pt-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-200" />
                            ))}
                            <div className="h-10 w-10 rounded-full border-2 border-white bg-primary flex items-center justify-center text-white text-[10px] font-bold">
                                +15
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">
                            <span className="text-slate-900 font-bold">18 colaboradores</span> da sua equipe <br /> também estão planejando férias.
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-4 flex items-center">
                    <div className="w-full relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-orange-500 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                        <Card className="relative bg-white border-2 rounded-[2rem] shadow-2xl overflow-hidden">
                            <div className="bg-slate-900 p-8 text-white relative h-48 flex flex-col justify-end overflow-hidden">
                                <div className="absolute top-[-20%] right-[-10%] opacity-10">
                                    <Sparkles className="h-48 w-48" />
                                </div>
                                <div className="relative z-10">
                                    <Badge className="bg-primary/20 text-primary border-none mb-3">Saldo Disponível</Badge>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-6xl font-black tracking-tighter tabular-nums">
                                            {selectedPeriod?.remainingDays || 0}
                                        </span>
                                        <span className="text-xl font-bold opacity-60">dias</span>
                                    </div>
                                </div>
                            </div>
                            <CardContent className="p-8">
                                <div className="flex items-start gap-4">
                                    <div className="bg-orange-100 p-3 rounded-2xl shrink-0">
                                        <Calculator className="h-6 w-6 text-orange-600" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-slate-900">Período Aquisitivo Atual</p>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                            {selectedPeriod ? (
                                                <>De {format(new Date(selectedPeriod.acquisitionStartDate), 'dd/MM/yy')} até <br /> {format(new Date(selectedPeriod.acquisitionEndDate), 'dd/MM/yy')}</>
                                            ) : 'Carregando...'}
                                        </p>
                                    </div>
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
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-slate-900/10">1</div>
                                <h2 className="text-3xl font-black tracking-tight">Qual período utilizar?</h2>
                            </div>
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
                                        "w-full text-left group relative p-6 rounded-[2rem] border-2 transition-all duration-500",
                                        selectedPeriod?.id === period.id
                                            ? "border-primary bg-primary/5 shadow-2xl shadow-primary/10 ring-8 ring-primary/5"
                                            : "border-slate-100 bg-white hover:border-slate-300 shadow-sm"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Período Aquisitivo</p>
                                            <p className="text-lg font-black text-slate-900">
                                                {format(new Date(period.acquisitionStartDate), 'dd/MM/yy')} — {format(new Date(period.acquisitionEndDate), 'dd/MM/yy')}
                                            </p>
                                        </div>
                                        <div className={cn(
                                            "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-500",
                                            selectedPeriod?.id === period.id ? "bg-primary text-white scale-110" : "bg-slate-100 text-slate-400 group-hover:scale-110"
                                        )}>
                                            <Check className="h-4 w-4 stroke-[3px]" />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black">
                                            {period.remainingDays} DIAS DISPONÍVEIS
                                        </div>
                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-1000"
                                                style={{ width: `${Math.max(10, (period.remainingDays / period.totalDays) * 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center justify-between text-[10px] font-black tracking-widest text-slate-400">
                                        <span>PRAZO LIMITE (RH):</span>
                                        <span className={cn(
                                            period.isExpiringSoon ? "text-red-500" : "text-slate-900"
                                        )}>
                                            {format(new Date(period.concessionEndDate), 'dd/MM/yyyy')}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Step 2: Date Selection */}
                    <section className={cn("space-y-6 transition-all duration-700 delay-100", !selectedPeriod && "opacity-20 pointer-events-none")}>
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-slate-900/10">2</div>
                            <h2 className="text-3xl font-black tracking-tight">Escolha suas datas</h2>
                        </div>

                        <div className="bg-white border-2 rounded-[2.5rem] p-1 shadow-2xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 divide-y md:divide-y-0 md:divide-x border-slate-100">
                                <div className="lg:col-span-3 p-8 flex justify-center bg-slate-50/30">
                                    <Calendar
                                        mode="range"
                                        selected={watchDateRange || undefined}
                                        onSelect={(range: any) => form.setValue('dateRange', range)}
                                        disabled={(date) => date < addDays(new Date(), 30)}
                                        locale={ptBR}
                                        className="h-full w-full max-w-sm"
                                        classNames={{
                                            months: "w-full",
                                            month: "w-full space-y-6",
                                            caption_label: "text-lg font-black tracking-tight",
                                            head_cell: "text-slate-400 font-black text-xs uppercase p-4",
                                            cell: "p-0 h-14 w-14 relative",
                                            day: "h-12 w-12 p-0 font-bold text-slate-700 hover:bg-slate-100 rounded-2xl transition-all aria-selected:opacity-100",
                                            day_range_start: "bg-primary text-white rounded-2xl hover:bg-primary hover:text-white",
                                            day_range_end: "bg-primary text-white rounded-2xl hover:bg-primary hover:text-white",
                                            day_range_middle: "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary rounded-none",
                                            day_selected: "bg-primary text-white rounded-2xl hover:bg-primary hover:text-white",
                                            day_today: "bg-slate-200 text-slate-800",
                                            nav_button: "border-none hover:bg-slate-100 rounded-xl"
                                        }}
                                    />
                                </div>
                                <div className="lg:col-span-2 p-10 flex flex-col justify-between space-y-10">
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Confira as Regras</h4>
                                            <div className="space-y-4">
                                                <div className="flex gap-4 group">
                                                    <div className="h-6 w-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                        <Check className="h-3 w-3" />
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-600 leading-snug">Solicite com pelo menos <span className="text-slate-900">30 dias</span> de antecedência.</p>
                                                </div>
                                                <div className="flex gap-4 group">
                                                    <div className="h-6 w-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                        <Check className="h-3 w-3" />
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-600 leading-snug">Evite inícios aos sábados, domingos ou feriados.</p>
                                                </div>
                                            </div>
                                        </div>

                                        {watchDateRange?.from && watchDateRange?.to ? (
                                            <div className="p-8 bg-slate-900 rounded-[2rem] text-white space-y-6 animate-in zoom-in duration-500">
                                                <div className="flex justify-between items-center">
                                                    <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black">PERÍODO SELECIONADO</Badge>
                                                    <span className="text-3xl font-black">{daysSelected}d</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">INÍCIO</p>
                                                        <p className="text-lg font-black">{format(watchDateRange.from, 'dd MMM')}</p>
                                                    </div>
                                                    <div className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center">
                                                        <ArrowRight className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div className="flex-1 text-right">
                                                        <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">RETORNO</p>
                                                        <p className="text-lg font-black">{format(watchDateRange.to, 'dd MMM')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-48 border-4 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-center p-8">
                                                <CalendarIcon className="h-10 w-10 text-slate-200 mb-4" />
                                                <p className="text-sm font-bold text-slate-300 tracking-tight">Toque no calendário <br />para escolher seu período</p>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">
                                        Selecione a data de ida e a data de volta
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column: Sticky Summary */}
                <div className="lg:col-span-4 lg:sticky lg:top-10 space-y-8">
                    <Card className="rounded-[2.5rem] border-2 shadow-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
                        <CardHeader className="p-10 pb-6 border-b border-slate-50">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-black tracking-tighter">Resumo</h3>
                                <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-[10px]">VERIFICADO</Badge>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                <div className="p-2 bg-white rounded-xl shadow-sm">
                                    <Umbrella className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-900">Configuração de Férias</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Aguardando aprovação</p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-10 pt-8 space-y-10">
                            <div className="space-y-6">
                                <div className="flex justify-between border-b border-slate-50 pb-4">
                                    <span className="text-sm font-bold text-slate-500">Dias de descanso</span>
                                    <span className="text-lg font-black">{daysSelected}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-4">
                                    <span className="text-sm font-bold text-slate-500">Abono Pecuniário</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-black">{watchSellDays ? 10 : 0}</span>
                                        <Switch
                                            checked={watchSellDays}
                                            onCheckedChange={(checked) => form.setValue('sellDays', checked)}
                                            disabled={!selectedPeriod || selectedPeriod.remainingDays < 10}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm font-bold text-slate-500">Adiantar 13º</span>
                                    <Switch
                                        checked={form.watch('advance13thSalary')}
                                        onCheckedChange={(checked) => form.setValue('advance13thSalary', checked)}
                                    />
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50 rounded-[2rem] space-y-6">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Utilização Total</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className={cn(
                                            "text-4xl font-black tracking-tighter tabular-nums",
                                            selectedPeriod && totalDaysUsed > selectedPeriod.remainingDays ? "text-red-500" : "text-slate-900"
                                        )}>
                                            {totalDaysUsed}
                                        </span>
                                        <span className="text-sm font-black text-slate-400">/ {selectedPeriod?.remainingDays || 0}d</span>
                                    </div>
                                </div>
                                <div className="h-3 w-full bg-white rounded-full p-1 shadow-inner">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-1000",
                                            selectedPeriod && totalDaysUsed > selectedPeriod.remainingDays ? "bg-red-500" : "bg-primary"
                                        )}
                                        style={{ width: `${Math.min(100, (totalDaysUsed / (selectedPeriod?.remainingDays || 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Observações</Label>
                                <Textarea
                                    {...form.register('notes')}
                                    placeholder="Explique algo para o seu gestor..."
                                    className="bg-slate-50 border-none rounded-2xl p-6 min-h-[120px] shadow-inner resize-none focus-visible:ring-primary/20"
                                />
                            </div>

                            <div className="space-y-4 pt-4">
                                {selectedPeriod && totalDaysUsed > selectedPeriod.remainingDays && (
                                    <Alert variant="destructive" className="rounded-2xl border-none bg-red-50 text-red-900 p-6">
                                        <div className="flex gap-4">
                                            <AlertTriangle className="h-6 w-6 shrink-0" />
                                            <div className="space-y-1">
                                                <AlertTitle className="font-black text-sm">Saldo Insuficiente</AlertTitle>
                                                <AlertDescription className="text-xs font-medium opacity-80 leading-relaxed">
                                                    Você está tentando usar {totalDaysUsed} dias, mas seu saldo atual é de {selectedPeriod.remainingDays} dias.
                                                </AlertDescription>
                                            </div>
                                        </div>
                                    </Alert>
                                )}

                                <Button
                                    size="xl"
                                    onClick={form.handleSubmit(onSubmit)}
                                    disabled={submitting || !selectedPeriod || (selectedPeriod && totalDaysUsed > selectedPeriod.remainingDays) || totalDaysUsed === 0}
                                    className="w-full h-20 rounded-[1.5rem] font-black text-xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group"
                                >
                                    {submitting ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        <>
                                            Solicitar Agora
                                            <ArrowRight className="h-6 w-6 ml-3 group-hover:translate-x-2 transition-transform" />
                                        </>
                                    )}
                                </Button>
                                <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest px-8">
                                    Sua solicitação será analisada pelo RH e seu gestor direto.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-10 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-[-20%] right-[-10%] opacity-10 group-hover:scale-110 transition-transform duration-1000">
                            <Sparkles className="h-48 w-48" />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                                <Info className="h-6 w-6 text-primary" />
                            </div>
                            <h4 className="text-xl font-black tracking-tight">Dica de Especialista</h4>
                            <p className="text-sm text-slate-300 font-medium leading-relaxed">
                                Planeje suas férias com antecedência para garantir a melhor data e evitar sobrecarga na sua equipe. O descanso faz parte da sua produtividade!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

