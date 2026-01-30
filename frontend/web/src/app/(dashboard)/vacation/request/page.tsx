'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { differenceInDays, addDays, format, isWeekend } from 'date-fns';
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
    MessageCircle
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
    }).refine((data) => data.from && data.to, {
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
                // Filter only open or partially used periods
                const available = data.filter(p => p.status === 'OPEN' || p.status === 'PARTIALLY_USED' || p.status === 'SCHEDULED');
                setPeriods(available);
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

            if (!selectedPeriod) {
                toast({
                    title: 'Atenção',
                    description: 'Selecione um período aquisitivo.',
                    variant: 'destructive',
                });
                return;
            }

            // Simple validation of remaining days
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
                startDate: format(values.dateRange.from, 'yyyy-MM-dd'),
                endDate: format(values.dateRange.to, 'yyyy-MM-dd'),
                sellDays: values.sellDays,
                soldDaysCount: values.sellDays ? 10 : 0,
                advance13thSalary: values.advance13thSalary,
                notes: values.notes,
                fractioned: selectedPeriod ? selectedPeriod.usedDays > 0 : false,
            });

            toast({
                title: 'Sucesso!',
                description: 'Sua solicitação de férias foi enviada para aprovação.',
            });

            router.push('/vacation');
        } catch (error: any) {
            console.error(error);
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
            <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Preparando seu descanso...</p>
            </div>
        );
    }

    if (!loading && periods.length === 0) {
        return (
            <div className="container max-w-4xl py-16 animate-in fade-in duration-500 min-h-[60vh] flex flex-col justify-center">
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="bg-orange-50 p-6 rounded-full ring-8 ring-orange-50/50">
                        <AlertTriangle className="h-16 w-16 text-orange-500" />
                    </div>

                    <div className="space-y-2 max-w-lg">
                        <h1 className="text-2xl font-bold text-slate-900">Nenhum Período Aquisitivo Disponível</h1>
                        <p className="text-muted-foreground text-lg">
                            No momento, não encontramos períodos de férias disponíveis para você solicitar.
                        </p>
                    </div>

                    <Card className="w-full max-w-md bg-slate-50 border-dashed border-2 shadow-none">
                        <CardContent className="pt-6">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <Info className="h-4 w-4 text-blue-500" />
                                Por que isso acontece?
                            </h3>
                            <ul className="text-sm text-left space-y-3 text-slate-600">
                                <li className="flex gap-3 items-start">
                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                                    <span>Seus períodos anteriores já foram totalmente utilizados ou agendados.</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                                    <span>Você pode ainda não ter completado o período aquisitivo (12 meses).</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                                    <span>O RH ainda não processou a liberação do seu novo período.</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => router.back()}
                            className="min-w-[140px] gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Voltar
                        </Button>
                        <Button
                            size="lg"
                            className="min-w-[140px]"
                            onClick={() => router.push('/vacation')}
                        >
                            Ver Meus Históricos
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-6xl py-8 space-y-8 animate-in fade-in duration-500">
            {/* Header com Estilo Premium */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/90 to-primary p-8 text-white shadow-xl">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Umbrella className="h-32 w-32 rotate-12" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="bg-white/10 hover:bg-white/20 text-white rounded-full h-12 w-12"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Nova Solicitação de Férias</h1>
                            <p className="text-primary-foreground/80 mt-1">Planeje o seu merecido descanso com poucos cliques</p>
                        </div>
                    </div>
                    {selectedPeriod && (
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">Saldo Disponível</Badge>
                            </div>
                            <div className="text-3xl font-bold flex items-baseline gap-1">
                                {selectedPeriod.remainingDays}
                                <span className="text-sm font-normal text-primary-foreground/80">dias</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lado Esquerdo - Formulário */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Seção 1: Escolha do Período */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <CalendarDays className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold">1. Qual período você deseja usar?</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {periods.map((period) => (
                                <div
                                    key={period.id}
                                    onClick={() => {
                                        form.setValue('vacationPeriodId', period.id);
                                        setSelectedPeriod(period);
                                    }}
                                    className={cn(
                                        "cursor-pointer group relative overflow-hidden rounded-2xl border-2 p-5 transition-all duration-300 hover:shadow-lg",
                                        selectedPeriod?.id === period.id
                                            ? "border-primary bg-primary/5 shadow-md"
                                            : "border-border bg-card hover:border-primary/30"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Período Aquisitivo</p>
                                            <p className="text-base font-bold">
                                                {format(new Date(period.acquisitionStartDate), 'dd/MM/yyyy')} - {format(new Date(period.acquisitionEndDate), 'dd/MM/yyyy')}
                                            </p>
                                        </div>
                                        {selectedPeriod?.id === period.id && (
                                            <div className="bg-primary text-white p-1 rounded-full animate-in zoom-in">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="bg-background px-3 py-1.5 rounded-lg border">
                                            <span className="text-muted-foreground mr-1">T:</span>
                                            <span className="font-bold">{period.totalDays}d</span>
                                        </div>
                                        <div className="bg-background px-3 py-1.5 rounded-lg border">
                                            <span className="text-muted-foreground mr-1">U:</span>
                                            <span className="font-bold">{period.usedDays}d</span>
                                        </div>
                                        <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-bold">
                                            {period.remainingDays} dias restantes
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-dashed flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Prazo para concessão:</span>
                                        <span className={cn(
                                            "font-semibold",
                                            period.isExpiringSoon ? "text-orange-600" : "text-foreground"
                                        )}>
                                            {format(new Date(period.concessionEndDate), 'dd/MM/yyyy')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {form.formState.errors.vacationPeriodId && (
                            <p className="text-sm text-red-500 px-1 font-medium">{form.formState.errors.vacationPeriodId.message}</p>
                        )}
                    </section>

                    {/* Seção 2: Calendário */}
                    <section className={cn("space-y-4 transition-all duration-500", !selectedPeriod && "opacity-40 grayscale pointer-events-none")}>
                        <div className="flex items-center gap-2 px-1">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <PlaneLanding className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold">2. Quando você quer sair?</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-card border rounded-3xl p-6 shadow-sm">
                            <div className="flex justify-center flex-col items-center">
                                <Calendar
                                    mode="range"
                                    selected={watchDateRange}
                                    onSelect={(range: any) => form.setValue('dateRange', range)}
                                    disabled={(date) =>
                                        date < addDays(new Date(), 30)
                                    }
                                    initialFocus
                                    locale={ptBR}
                                    className="rounded-2xl border shadow-sm p-4 h-full"
                                    classNames={{
                                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                        day_range_middle: "bg-primary/10 text-primary",
                                        day_range_end: "bg-primary text-primary-foreground rounded-r-md",
                                        day_range_start: "bg-primary text-primary-foreground rounded-l-md",
                                    }}
                                />
                                <p className="text-[10px] text-muted-foreground mt-4 text-center">
                                    Dica: Para selecionar, clique na data de início e depois na data de fim.
                                </p>
                            </div>

                            <div className="space-y-6 flex flex-col justify-center">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-lg">Regras para Seleção</h3>
                                    <ul className="text-sm text-muted-foreground space-y-2">
                                        <li className="flex gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                            <span>Mínimo de 30 dias de antecedência.</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                            <span>Início não pode ser em sábados ou domingos.</span>
                                        </li>
                                    </ul>
                                </div>

                                {watchDateRange?.from && watchDateRange?.to ? (
                                    <div className="bg-primary/5 rounded-2xl p-4 border-2 border-primary/20 animate-in slide-in-from-right-4">
                                        <div className="flex justify-between items-center text-sm mb-2">
                                            <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Período Selecionado</span>
                                            <Badge variant="outline" className="bg-white">{daysSelected} dias</Badge>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground uppercase">De</p>
                                                <p className="font-bold">{format(watchDateRange.from, 'dd MMM', { locale: ptBR })}</p>
                                            </div>
                                            <div className="h-px flex-1 bg-border relative">
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border rounded-full p-1 text-primary">
                                                    <Calculator className="h-3 w-3" />
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground uppercase">Até</p>
                                                <p className="font-bold text-primary">{format(watchDateRange.to, 'dd MMM', { locale: ptBR })}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 border-2 border-dashed rounded-2xl p-8 text-center">
                                        <p className="text-muted-foreground text-sm">Selecione as datas no calendário</p>
                                    </div>
                                )}
                                {form.formState.errors.dateRange && (
                                    <p className="text-sm text-red-500 font-medium">{form.formState.errors.dateRange.message}</p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Seção 3: Opções Adicionais */}
                    <section className={cn("space-y-4 transition-all duration-500", !selectedPeriod && "opacity-40 grayscale pointer-events-none")}>
                        <div className="flex items-center gap-2 px-1">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <Banknote className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold">3. Opções e Detalhes</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={cn(
                                "flex items-center justify-between p-6 border rounded-2xl transition-all",
                                watchSellDays ? "bg-primary/5 border-primary shadow-sm" : "bg-card hover:bg-slate-50"
                            )}>
                                <div className="space-y-1 pr-4">
                                    <Label className="text-base font-bold">Abono Pecuniário</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Vender 10 dias de férias (converte em dinheiro)
                                    </p>
                                </div>
                                <Switch
                                    checked={watchSellDays}
                                    onCheckedChange={(checked) => form.setValue('sellDays', checked)}
                                    disabled={!selectedPeriod || selectedPeriod.remainingDays < 10}
                                />
                            </div>

                            <div className={cn(
                                "flex items-center justify-between p-6 border rounded-2xl transition-all",
                                form.watch('advance13thSalary') ? "bg-primary/5 border-primary shadow-sm" : "bg-card hover:bg-slate-50"
                            )}>
                                <div className="space-y-1 pr-4">
                                    <Label className="text-base font-bold">Adiantar 13º Salário</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Receber a 1ª parcela junto com as férias
                                    </p>
                                </div>
                                <Switch
                                    checked={form.watch('advance13thSalary')}
                                    onCheckedChange={(checked) => form.setValue('advance13thSalary', checked)}
                                />
                            </div>
                        </div>

                        <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-3">
                            <div className="flex items-center gap-2">
                                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                                <Label htmlFor="notes" className="font-bold">Observações para o gestor</Label>
                            </div>
                            <Textarea
                                id="notes"
                                placeholder="Alguma observação especial sobre este período? (Opcional)"
                                className="resize-none min-h-[100px] rounded-xl border-2 focus-visible:ring-primary"
                                {...form.register('notes')}
                            />
                        </div>
                    </section>
                </div>

                {/* Lado Direito - Resumo Sticky */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        <Card className="rounded-3xl border-2 shadow-xl overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Resumo da Solicitação</CardTitle>
                                    <Badge variant="outline" className="bg-white">Planejamento</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Dias de descanso</span>
                                        <span className="font-bold text-lg">{daysSelected}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Dias vendidos (Abono)</span>
                                        <span className="font-bold text-lg">{watchSellDays ? 10 : 0}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-base">Total a utilizar</span>
                                        <div className="text-right">
                                            <span className={cn(
                                                "text-2xl font-black",
                                                selectedPeriod && totalDaysUsed > selectedPeriod.remainingDays ? "text-red-500" : "text-primary"
                                            )}>
                                                {totalDaysUsed}
                                            </span>
                                            <span className="text-sm font-bold text-muted-foreground ml-1">dias</span>
                                        </div>
                                    </div>
                                </div>

                                {selectedPeriod && (
                                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                        <div className="text-[10px] text-muted-foreground uppercase font-black mb-2 tracking-widest">Saldo após solicitação</div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Novo Saldo Disponível</span>
                                            <span className="font-bold text-primary">{Math.max(0, selectedPeriod.remainingDays - totalDaysUsed)} dias</span>
                                        </div>
                                        <div className="mt-2 h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-1000"
                                                style={{ width: `${Math.max(0, ((selectedPeriod.remainingDays - totalDaysUsed) / selectedPeriod.totalDays) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {selectedPeriod && totalDaysUsed > selectedPeriod.remainingDays && (
                                    <Alert variant="destructive" className="rounded-2xl border-2">
                                        <AlertTriangle className="h-5 w-5" />
                                        <AlertTitle className="font-bold">Saldo Insuficiente</AlertTitle>
                                        <AlertDescription>
                                            Sua solicitação excede os {selectedPeriod.remainingDays} dias disponíveis.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="flex flex-col gap-3 pt-4">
                                    <Button
                                        size="lg"
                                        className="w-full rounded-2xl h-14 font-bold text-base shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        onClick={form.handleSubmit(onSubmit)}
                                        disabled={submitting || !selectedPeriod || (!!selectedPeriod && totalDaysUsed > selectedPeriod.remainingDays) || totalDaysUsed === 0}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Enviando...
                                            </>
                                        ) : (
                                            'Confirmar Solicitação'
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="w-full rounded-2xl h-14 font-bold text-muted-foreground"
                                        onClick={() => router.back()}
                                    >
                                        Cancelar
                                    </Button>
                                    <p className="text-[10px] text-center text-muted-foreground px-4">
                                        Ao confirmar, sua solicitação será enviada para aprovação do seu gestor imediato.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tip Widget */}
                        <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden group">
                            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <Info className="h-24 w-24" />
                            </div>
                            <h4 className="font-bold mb-2 flex items-center gap-2">
                                <Info className="h-4 w-4" /> Dica AxonRH
                            </h4>
                            <p className="text-sm text-blue-50/80 leading-relaxed">
                                Sabia que você pode vender até 10 dias de suas férias? Isso é chamado de Abono Pecuniário e é um direito seu!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
