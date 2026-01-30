'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { differenceInDays, addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { vacationApi, VacationPeriod } from '@/lib/api/vacation';
import { CalendarIcon, ArrowLeft, Loader2, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
    vacationPeriodId: z.string().min(1, 'Selecione um período aquisitivo'),
    dateRange: z.object({
        from: z.date({ required_error: 'Início é obrigatório' }),
        to: z.date({ required_error: 'Fim é obrigatório' }),
    }),
    sellDays: z.boolean().default(false),
    advance13thSalary: z.boolean().default(false),
    notes: z.string().optional(),
});

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

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            sellDays: false,
            advance13thSalary: false,
        },
    });

    const watchDateRange = form.watch('dateRange');
    const watchSellDays = form.watch('sellDays');

    const daysSelected = watchDateRange?.from && watchDateRange?.to
        ? differenceInDays(watchDateRange.to, watchDateRange.from) + 1
        : 0;

    const totalDaysUsed = daysSelected + (watchSellDays ? 10 : 0);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setSubmitting(true);

            // Simple validation of remaining days
            if (selectedPeriod && totalDaysUsed > selectedPeriod.remainingDays) {
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
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container max-w-3xl py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Nova Solicitação de Férias</h1>
                    <p className="text-muted-foreground">Preencha os dados abaixo para solicitar suas férias</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detalhes da Solicitação</CardTitle>
                    <CardDescription>
                        Certifique-se de respeitar o prazo de antecedência mínima de 30 dias.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">

                        <div className="space-y-2">
                            <Label htmlFor="period">Período Aquisitivo</Label>
                            <Select
                                onValueChange={(val) => {
                                    form.setValue('vacationPeriodId', val);
                                    setSelectedPeriod(periods.find(p => p.id === val) || null);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um período..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {periods.map((period) => (
                                        <SelectItem key={period.id} value={period.id} disabled={period.remainingDays <= 0}>
                                            {format(new Date(period.acquisitionStartDate), 'dd/MM/yyyy')} a {format(new Date(period.acquisitionEndDate), 'dd/MM/yyyy')}
                                            {' '} — Restam {period.remainingDays} dias
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.formState.errors.vacationPeriodId && (
                                <p className="text-sm text-red-500">{form.formState.errors.vacationPeriodId.message}</p>
                            )}
                        </div>

                        {selectedPeriod && (
                            <div className="bg-blue-50 p-4 rounded-md flex gap-3 text-blue-800 text-sm">
                                <Info className="h-5 w-5 shrink-0" />
                                <div>
                                    <p className="font-medium">Resumo do Período</p>
                                    <p>Total: {selectedPeriod.totalDays} dias | Usados: {selectedPeriod.usedDays} dias | Restantes: {selectedPeriod.remainingDays} dias</p>
                                    <p className="mt-1">Prazo para concessão: {format(new Date(selectedPeriod.concessionEndDate), 'dd/MM/yyyy')}</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 flex flex-col">
                            <Label>Período de Férias</Label>
                            <div className="border rounded-md p-4 flex justify-center">
                                <Calendar
                                    mode="range"
                                    selected={watchDateRange}
                                    onSelect={(range: any) => form.setValue('dateRange', range)}
                                    disabled={(date) => date < addDays(new Date(), 29) || date.getDay() === 0 || date.getDay() === 6}
                                    initialFocus
                                    locale={ptBR}
                                    className="rounded-md border shadow"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                * Selecione a data de início e fim. O início não pode ser em sábados ou domingos.
                                Mínimo 30 dias de antecedência.
                            </p>
                            {form.formState.errors.dateRange && (
                                <p className="text-sm text-red-500">Selecione o período completo (início e fim).</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-md">
                            <div className="space-y-0.5">
                                <Label className="text-base">Abono Pecuniário</Label>
                                <p className="text-sm text-muted-foreground">
                                    Vender 10 dias de férias (converte em dinheiro)
                                </p>
                            </div>
                            <Switch
                                checked={watchSellDays}
                                onCheckedChange={(checked) => form.setValue('sellDays', checked)}
                                disabled={!selectedPeriod || selectedPeriod.remainingDays < 10}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-md">
                            <div className="space-y-0.5">
                                <Label className="text-base">Adiantar 13º Salário</Label>
                                <p className="text-sm text-muted-foreground">
                                    Receber a primeira parcela do 13º junto com as férias
                                </p>
                            </div>
                            <Switch
                                checked={form.watch('advance13thSalary')}
                                onCheckedChange={(checked) => form.setValue('advance13thSalary', checked)}
                            />
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg space-y-2 border">
                            <h3 className="font-medium flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4" /> Resumo
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>Dias de descanso: <span className="font-bold">{daysSelected}</span></div>
                                <div>Dias vendidos: <span className="font-bold">{watchSellDays ? 10 : 0}</span></div>
                                <div className="col-span-2 pt-2 border-t mt-1 text-base">
                                    Total a descontar do saldo: <span className="font-bold text-primary">{totalDaysUsed} dias</span>
                                </div>
                            </div>
                            {selectedPeriod && totalDaysUsed > selectedPeriod.remainingDays && (
                                <Alert variant="destructive" className="mt-2 py-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Saldo insuficiente!</AlertTitle>
                                    <AlertDescription>Você tem apenas {selectedPeriod.remainingDays} dias.</AlertDescription>
                                </Alert>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Observações</Label>
                            <Textarea
                                id="notes"
                                placeholder="Alguma observação para o seu gestor?"
                                className="resize-none"
                                {...form.register('notes')}
                            />
                        </div>

                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
                    <Button
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={submitting || (!!selectedPeriod && totalDaysUsed > selectedPeriod.remainingDays) || totalDaysUsed === 0}
                    >
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Enviar Solicitação'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
