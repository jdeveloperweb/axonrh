'use client';

import { useState, useEffect } from 'react';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { useRouter } from 'next/navigation';
import {
    timesheetApi,
    WorkSchedule,
    WorkScheduleRequest,
    ScheduleDay
} from '@/lib/api/timesheet';
import { digitalHiringApi } from '@/lib/api/digital-hiring';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Plus,
    Gavel,
    Clock,
    Calendar,
    ArrowLeft,
    Save,
    Trash2,
    Edit2,
    ChevronRight,
    Loader2,
    CheckCircle2,
    XCircle,
    FileText,
    Copy
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';

export default function LaborSettingsPage() {
    const { confirm } = useConfirm();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentSchedule, setCurrentSchedule] = useState<Partial<WorkScheduleRequest>>({
        name: '',
        description: '',
        scheduleType: 'FIXED',
        workRegime: 'PRESENCIAL',
        weeklyHoursMinutes: 2640,
        toleranceMinutes: 10,
        minBreakMinutes: 60,
        maxDailyOvertimeMinutes: 120,
        overtimeBankEnabled: true,
        overtimeBankExpirationMonths: 6,
        days: [
            { dayOfWeek: 'MONDAY', isWorkDay: true, entryTime: '08:00', exitTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
            { dayOfWeek: 'TUESDAY', isWorkDay: true, entryTime: '08:00', exitTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
            { dayOfWeek: 'WEDNESDAY', isWorkDay: true, entryTime: '08:00', exitTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
            { dayOfWeek: 'THURSDAY', isWorkDay: true, entryTime: '08:00', exitTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
            { dayOfWeek: 'FRIDAY', isWorkDay: true, entryTime: '08:00', exitTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
            { dayOfWeek: 'SATURDAY', isWorkDay: false },
            { dayOfWeek: 'SUNDAY', isWorkDay: false },
        ]
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [holidays, setHolidays] = useState<any[]>([]);
    const [importingHolidays, setImportingHolidays] = useState(false);
    const [loadingHolidays, setLoadingHolidays] = useState(false);

    // Contratos
    const [templates, setTemplates] = useState<any[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState<any>({
        name: '',
        contractType: 'CLT',
        templateContent: '',
        isDefault: true
    });


    useEffect(() => {
        loadData();
        loadHolidays();
        loadTemplates();
    }, []);


    const loadData = async () => {
        try {
            setLoading(true);
            const data = await timesheetApi.listSchedules();
            setSchedules(data);
        } catch (error) {
            console.error('Error loading schedules:', error);
            toast.error('Erro ao carregar escalas de trabalho');
        } finally {
            setLoading(false);
        }
    };

    const loadHolidays = async () => {
        try {
            setLoadingHolidays(true);
            const data = await timesheetApi.listHolidays();
            setHolidays(data);
        } catch (error) {
            console.error('Error loading holidays:', error);
        } finally {
            setLoadingHolidays(false);
        }
    };

    const handleImportHolidays = async () => {
        try {
            setImportingHolidays(true);
            const count = await timesheetApi.importHolidays(new Date().getFullYear());
            toast.success(`${count} feriados nacionais importados com sucesso`);
            loadHolidays();
        } catch (error) {
            console.error('Error importing holidays:', error);
            toast.error('Erro ao importar feriados');
        } finally {
            setImportingHolidays(false);
        }
    };

    const handleDeleteHoliday = async (id: string) => {
        if (!await confirm({
            title: 'Excluir Feriado',
            description: 'Deseja excluir este feriado?',
            variant: 'destructive',
            confirmLabel: 'Excluir'
        })) return;
        try {
            await timesheetApi.deleteHoliday(id);
            toast.success('Feriado excluído');
            loadHolidays();
        } catch (error) {
            toast.error('Erro ao excluir feriado');
        }
    };

    const loadTemplates = async () => {
        try {
            setLoadingTemplates(true);
            const data = await digitalHiringApi.listTemplates();
            setTemplates(data || []);
        } catch (error) {
            console.error('Error loading templates:', error);
        } finally {
            setLoadingTemplates(false);
        }
    };

    const handleSaveTemplate = async () => {
        if (!currentTemplate.name || !currentTemplate.templateContent) {
            toast.error('Preencha o nome e o conteúdo do template');
            return;
        }
        try {
            setSaving(true);
            await digitalHiringApi.saveTemplate(currentTemplate);
            toast.success('Template salvo com sucesso');
            setIsTemplateModalOpen(false);
            loadTemplates();
        } catch (error) {
            toast.error('Erro ao salvar template');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateTemplate = () => {
        setCurrentTemplate({
            name: 'Contrato Padrão CLT',
            contractType: 'CLT',
            templateContent: `<h2>CONTRATO INDIVIDUAL DE TRABALHO</h2>
<p><strong>EMPREGADOR:</strong> {{EMPRESA_NOME}}, inscrito no CNPJ sob o nº {{EMPRESA_CNPJ}}, com sede em {{EMPRESA_ENDERECO}}.</p>
<p><strong>EMPREGADO(A):</strong> {{NOME}}, portador(a) do CPF nº {{CPF}}.</p>
<p>As partes celebram este contrato para a função de <strong>{{CARGO}}</strong> com salário de <strong>{{SALARIO}}</strong>.</p>
<p>Início em: {{DATA_INICIO}}</p>`,
            isDefault: true
        });
        setIsTemplateModalOpen(true);
    };

    const handleEditTemplate = (template: any) => {
        setCurrentTemplate(template);
        setIsTemplateModalOpen(true);
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!await confirm({
            title: 'Excluir Template',
            description: 'Deseja excluir este template de contrato?',
            variant: 'destructive'
        })) return;
        try {
            await digitalHiringApi.deleteTemplate(id);
            toast.success('Template excluído');
            loadTemplates();
        } catch (error) {
            toast.error('Erro ao excluir template');
        }
    };


    const handleCreateNew = () => {
        setEditingId(null);
        setCurrentSchedule({
            name: '',
            description: '',
            scheduleType: 'FIXED',
            workRegime: 'PRESENCIAL',
            weeklyHoursMinutes: 2640,
            toleranceMinutes: 10,
            minBreakMinutes: 60,
            maxDailyOvertimeMinutes: 120,
            overtimeBankEnabled: true,
            overtimeBankExpirationMonths: 6,
            days: [
                { dayOfWeek: 'MONDAY', isWorkDay: true, entryTime: '08:00', exitTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                { dayOfWeek: 'TUESDAY', isWorkDay: true, entryTime: '08:00', exitTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                { dayOfWeek: 'WEDNESDAY', isWorkDay: true, entryTime: '08:00', exitTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                { dayOfWeek: 'THURSDAY', isWorkDay: true, entryTime: '08:00', exitTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                { dayOfWeek: 'FRIDAY', isWorkDay: true, entryTime: '08:00', exitTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                { dayOfWeek: 'SATURDAY', isWorkDay: false },
                { dayOfWeek: 'SUNDAY', isWorkDay: false },
            ]
        });
        setIsEditModalOpen(true);
    };

    const handleEdit = (schedule: WorkSchedule) => {
        setEditingId(schedule.id);
        setCurrentSchedule({
            name: schedule.name,
            description: schedule.description,
            scheduleType: schedule.scheduleType,
            weeklyHoursMinutes: schedule.weeklyHoursMinutes,
            toleranceMinutes: schedule.toleranceMinutes,
            minBreakMinutes: schedule.minBreakMinutes,
            maxDailyOvertimeMinutes: schedule.maxDailyOvertimeMinutes,
            overtimeBankEnabled: schedule.overtimeBankEnabled,
            overtimeBankExpirationMonths: schedule.overtimeBankExpirationMonths,
            workRegime: schedule.workRegime || 'PRESENCIAL',
            days: schedule.days.map(d => ({ ...d }))
        });
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!await confirm({
            title: 'Excluir Escala',
            description: 'Deseja realmente excluir esta escala?',
            variant: 'destructive',
            confirmLabel: 'Excluir'
        })) return;
        try {
            await timesheetApi.deleteSchedule(id);
            toast.success('Escala excluída com sucesso');
            loadData();
        } catch (error) {
            toast.error('Erro ao excluir escala');
        }
    };

    const handleSave = async () => {
        if (!currentSchedule.name) {
            toast.error('O nome da escala é obrigatório');
            return;
        }

        try {
            setSaving(true);

            // Helper para converter HH:mm para minutos
            const timeToMinutes = (time?: string) => {
                if (!time) return 0;
                const [hours, minutes] = time.split(':').map(Number);
                return (hours || 0) * 60 + (minutes || 0);
            };

            // Calcula minutes esperados para cada dia
            const processedDays = (currentSchedule.days || []).map(day => {
                if (!day.isWorkDay) return { ...day, expectedWorkMinutes: 0 };

                const entry = timeToMinutes(day.entryTime || '08:00');
                const exit = timeToMinutes(day.exitTime || '18:00');
                const breakStart = timeToMinutes(day.breakStartTime || '12:00');
                const breakEnd = timeToMinutes(day.breakEndTime || '13:00');

                let workMinutes = (exit - entry) - (breakEnd - breakStart);
                if (workMinutes < 0) workMinutes = 0;

                return {
                    ...day,
                    expectedWorkMinutes: workMinutes,
                    entryTime: day.entryTime || '08:00',
                    exitTime: day.exitTime || '18:00',
                    breakStartTime: day.breakStartTime || '12:00',
                    breakEndTime: day.breakEndTime || '13:00'
                };
            });

            const data = {
                ...currentSchedule,
                days: processedDays,
                // Garante que campos opcionais tenham valores padrão se vazios
                toleranceMinutes: currentSchedule.toleranceMinutes || 10,
                minBreakMinutes: currentSchedule.minBreakMinutes || 60,
                maxDailyOvertimeMinutes: currentSchedule.maxDailyOvertimeMinutes || 120,
            } as WorkScheduleRequest;

            if (editingId) {
                await timesheetApi.updateSchedule(editingId, data);
                toast.success('Escala atualizada com sucesso');
            } else {
                await timesheetApi.createSchedule(data);
                toast.success('Escala criada com sucesso');
            }
            setIsEditModalOpen(false);
            loadData();
        } catch (error) {
            console.error('Error saving schedule:', error);
            toast.error('Erro ao salvar escala');
        } finally {
            setSaving(false);
        }
    };

    const updateDay = (index: number, field: string, value: any) => {
        const newDays = [...(currentSchedule.days || [])];
        newDays[index] = { ...newDays[index], [field]: value };
        setCurrentSchedule({ ...currentSchedule, days: newDays });
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors mb-2"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para Configurações
                    </button>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Regras Trabalhistas</h1>
                    <p className="text-[var(--color-text-secondary)] mt-1">
                        Defina jornadas, horas extras, banco de horas e feriados.
                    </p>
                </div>
                <Button onClick={handleCreateNew} className="btn-primary">
                    <Plus className="w-4 h-4 mr-2" /> Nova Escala
                </Button>
            </div>

            <Tabs defaultValue="schedules" className="w-full">
                <TabsList className="bg-[var(--color-surface-variant)] p-1 rounded-xl mb-6">
                    <TabsTrigger value="schedules" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Clock className="w-4 h-4 mr-2" /> Jornadas de Trabalho
                    </TabsTrigger>
                    <TabsTrigger value="holidays" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Calendar className="w-4 h-4 mr-2" /> Feriados
                    </TabsTrigger>
                    <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Gavel className="w-4 h-4 mr-2" /> Regras Gerais
                    </TabsTrigger>
                    <TabsTrigger value="contracts" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <FileText className="w-4 h-4 mr-2" /> Contratos
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="schedules" className="space-y-4">
                    {schedules.length === 0 ? (
                        <Card className="border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-12">
                            <CardContent className="flex flex-col items-center justify-center text-center">
                                <div className="p-4 bg-[var(--color-surface-variant)] rounded-full mb-4">
                                    <Clock className="w-10 h-10 text-[var(--color-text-secondary)]" />
                                </div>
                                <h3 className="text-lg font-semibold">Nenhuma escala cadastrada</h3>
                                <p className="text-[var(--color-text-secondary)] max-w-sm mt-1">
                                    As escalas de trabalho definem os horários de entrada, saída e intervalos dos seus colaboradores.
                                </p>
                                <Button onClick={handleCreateNew} variant="outline" className="mt-6">
                                    Criar Primeira Escala
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {schedules.map((schedule) => (
                                <Card key={schedule.id} className="border-none shadow-md bg-[var(--color-surface)] group hover:shadow-xl transition-all duration-300">
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                                                    <Clock className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{schedule.name}</CardTitle>
                                                    <CardDescription>{schedule.scheduleTypeLabel} • {schedule.workRegimeLabel || (schedule.workRegime === 'REMOTO' ? 'Remoto' : schedule.workRegime === 'HIBRIDO' ? 'Híbrido' : 'Presencial')}</CardDescription>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => handleEdit(schedule)}>
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleDelete(schedule.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-y-3 text-sm">
                                            <div className="text-[var(--color-text-secondary)]">Carga Semanal:</div>
                                            <div className="font-semibold text-right">{schedule.weeklyHoursFormatted}</div>
                                            <div className="text-[var(--color-text-secondary)]">Tolerância:</div>
                                            <div className="font-semibold text-right">{schedule.toleranceMinutes} min</div>
                                            <div className="text-[var(--color-text-secondary)]">Banco de Horas:</div>
                                            <div className="font-semibold text-right flex items-center justify-end gap-1">
                                                {schedule.overtimeBankEnabled ? (
                                                    <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Ativo</>
                                                ) : (
                                                    <><XCircle className="w-3.5 h-3.5 text-slate-300" /> Inativo</>
                                                )}
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-[var(--color-border)] flex justify-between items-center">
                                            <span className="text-xs text-[var(--color-text-secondary)] uppercase font-bold tracking-wider">
                                                Visão Geral da Semana
                                            </span>
                                            <div className="flex gap-1">
                                                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => {
                                                    // Ajusta o índice para bater com domingo sendo 0 ou 6 dependendo da ordem salva
                                                    // Na nossa API os dias vêm na ordem MONDAY...SUNDAY
                                                    // Então: 0-Seg, 1-Ter, 2-Qua, 3-Qui, 4-Sex, 5-Sáb, 6-Dom
                                                    // O loop 'D S T Q Q S S' quer: Dom, Seg, Ter, Qua, Qui, Sex, Sáb
                                                    // Então se i=0 (Dom), pegar schedule.days[6]
                                                    // Se i=1-6 (Seg-Sáb), pegar schedule.days[i-1]
                                                    const dayIdx = i === 0 ? 6 : i - 1;
                                                    const isWorkDay = schedule.days[dayIdx]?.isWorkDay;
                                                    return (
                                                        <div key={i} className={`h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold ${isWorkDay ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                            {day}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="holidays">
                    <Card className="border-none shadow-lg bg-[var(--color-surface)]">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle>Feriados e Datas Especiais</CardTitle>
                                <CardDescription>Configure os feriados que serão considerados no cálculo do ponto.</CardDescription>
                            </div>
                            <Button
                                onClick={handleImportHolidays}
                                disabled={importingHolidays}
                                className="btn-primary"
                            >
                                {importingHolidays ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4 mr-2" />
                                )}
                                Importar Feriados
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {loadingHolidays ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                </div>
                            ) : holidays.length === 0 ? (
                                <div className="p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <h3 className="font-semibold text-slate-600">Nenhum feriado cadastrado</h3>
                                    <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2">
                                        Clique no botão acima para importar os feriados nacionais automaticamente baseados no endereço da sua empresa.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-xl border border-slate-100 shadow-sm">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-4">Data</th>
                                                <th className="px-6 py-4">Nome</th>
                                                <th className="px-6 py-4">Tipo</th>
                                                <th className="px-6 py-4 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {holidays.sort((a, b) => a.date.localeCompare(b.date)).map((holiday) => (
                                                <tr key={holiday.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-slate-700">
                                                        {new Date(holiday.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">{holiday.name}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${holiday.type === 'NATIONAL' ? 'bg-blue-100 text-blue-700' :
                                                            holiday.type === 'STATE' ? 'bg-orange-100 text-orange-700' :
                                                                'bg-emerald-100 text-emerald-700'
                                                            }`}>
                                                            {holiday.type === 'NATIONAL' ? 'Nacional' :
                                                                holiday.type === 'STATE' ? 'Estadual' : 'Municipal'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDeleteHoliday(holiday.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>


                <TabsContent value="general">
                    <Card className="border-none shadow-lg bg-[var(--color-surface)]">
                        <CardHeader>
                            <CardTitle>Regras Gerais do Sistema</CardTitle>
                            <CardDescription>Configurações globais que afetam todos os cálculos trabalhistas.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-surface-variant)]/50 border border-[var(--color-border)]">
                                <div className="space-y-0.5">
                                    <h4 className="font-semibold">Sincronização com eSocial</h4>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Enviar eventos trabalhistas automaticamente.</p>
                                </div>
                                <Switch disabled />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Fechamento de Ponto (Dia do mês)</Label>
                                    <Input type="number" defaultValue={25} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Limite Mensal Banco de Horas (hrs)</Label>
                                    <Input type="number" defaultValue={44} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="contracts" className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-semibold">Templates de Contrato</h3>
                            <p className="text-sm text-muted-foreground">Configure os modelos de contrato para a contratação digital.</p>
                        </div>
                        <Button onClick={handleCreateTemplate} variant="outline" size="sm">
                            <Plus className="w-4 h-4 mr-2" /> Novo Template
                        </Button>
                    </div>

                    {loadingTemplates ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                    ) : templates.length === 0 ? (
                        <Card className="p-8 text-center border-dashed">
                            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                            <p className="text-muted-foreground">Nenhum template customizado encontrado.</p>
                            <Button onClick={handleCreateTemplate} variant="link">Criar primeiro agora</Button>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {templates.map(t => (
                                <Card key={t.id} className="p-4 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold flex items-center gap-2">
                                                {t.name}
                                                {t.isDefault && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">PADRÃO</span>}
                                            </h4>
                                            <p className="text-xs text-muted-foreground mt-1">Tipo: {t.contractType}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditTemplate(t)}>
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeleteTemplate(t.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mt-6">
                        <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-2">
                            <Copy className="w-4 h-4" /> Variáveis Disponíveis
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {['{{NOME}}', '{{CPF}}', '{{CARGO}}', '{{DEPARTAMENTO}}', '{{SALARIO}}', '{{DATA_INICIO}}', '{{TIPO_CONTRATO}}', '{{EMPRESA_NOME}}', '{{EMPRESA_CNPJ}}', '{{EMPRESA_ENDERECO}}'].map(v => (
                                <code key={v} className="bg-white border border-blue-200 px-2 py-1 rounded text-[10px] text-blue-700 font-mono">{v}</code>
                            ))}
                        </div>
                        <p className="text-[10px] text-blue-600 mt-3 pt-2 border-t border-blue-200/50">
                            Use estas variáveis no seu template HTML para que elas sejam preenchidas automaticamente com os dados do candidato e da empresa.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Modal Template Contrato */}
            <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Template de Contrato</DialogTitle>
                        <DialogDescription>Edite o conteúdo em HTML do seu contrato de trabalho.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nome do Template</Label>
                                <Input
                                    value={currentTemplate.name}
                                    onChange={e => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
                                    placeholder="Ex: Contrato de Trabalho CLT"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo de Contrato</Label>
                                <Select
                                    value={currentTemplate.contractType}
                                    onValueChange={v => setCurrentTemplate({ ...currentTemplate, contractType: v })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CLT">CLT</SelectItem>
                                        <SelectItem value="ESTAGIO">Estágio</SelectItem>
                                        <SelectItem value="TEMPORARIO">Temporário</SelectItem>
                                        <SelectItem value="AUTONOMO">Autônomo / PJ</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Conteúdo (HTML)</Label>
                            <Textarea
                                className="min-h-[400px] font-mono text-sm p-4 bg-slate-50 border-slate-200 focus:bg-white"
                                value={currentTemplate.templateContent}
                                onChange={e => setCurrentTemplate({ ...currentTemplate, templateContent: e.target.value })}
                                placeholder="Coloque aqui o HTML do seu contrato..."
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={currentTemplate.isDefault}
                                onCheckedChange={v => setCurrentTemplate({ ...currentTemplate, isDefault: v })}
                            />
                            <Label>Definir como template padrão para este tipo</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTemplateModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveTemplate} disabled={saving} className="btn-primary">
                            {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                            Salvar Template
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Edição/Criação */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Editar Escala' : 'Nova Escala de Trabalho'}</DialogTitle>
                        <DialogDescription>Preencha os dados abaixo para configurar a jornada de trabalho.</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="schedule-name">Nome da Escala *</Label>
                                <Input
                                    id="schedule-name"
                                    value={currentSchedule.name}
                                    onChange={(e) => setCurrentSchedule({ ...currentSchedule, name: e.target.value })}
                                    placeholder="Ex: Comercial 44h"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="schedule-type">Tipo de Jornada</Label>
                                <Select
                                    value={currentSchedule.scheduleType}
                                    onValueChange={(v) => setCurrentSchedule({ ...currentSchedule, scheduleType: v as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="FIXED">Fixo (Entrada/Saída Definidos)</SelectItem>
                                        <SelectItem value="FLEXIBLE">Flexível (Banco de Horas)</SelectItem>
                                        <SelectItem value="SHIFT">Turnos / Revezamento</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="work-regime">Regime de Trabalho</Label>
                                <Select
                                    value={currentSchedule.workRegime}
                                    onValueChange={(v) => setCurrentSchedule({ ...currentSchedule, workRegime: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                                        <SelectItem value="REMOTO">Remoto (Home Office)</SelectItem>
                                        <SelectItem value="HIBRIDO">Híbrido</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Horas Semanais</Label>
                                    <Input
                                        type="number"
                                        value={currentSchedule.weeklyHoursMinutes ? currentSchedule.weeklyHoursMinutes / 60 : 44}
                                        onChange={(e) => setCurrentSchedule({ ...currentSchedule, weeklyHoursMinutes: parseInt(e.target.value) * 60 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tolerância (min)</Label>
                                    <Input
                                        type="number"
                                        value={currentSchedule.toleranceMinutes}
                                        onChange={(e) => setCurrentSchedule({ ...currentSchedule, toleranceMinutes: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-500">Banco de Horas</h4>
                                <div className="flex items-center justify-between">
                                    <Label>Habilitar Banco de Horas</Label>
                                    <Switch
                                        checked={currentSchedule.overtimeBankEnabled}
                                        onCheckedChange={(v) => setCurrentSchedule({ ...currentSchedule, overtimeBankEnabled: v })}
                                    />
                                </div>
                                {currentSchedule.overtimeBankEnabled && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2">
                                        <Label>Validade (meses)</Label>
                                        <Input
                                            type="number"
                                            value={currentSchedule.overtimeBankExpirationMonths}
                                            onChange={(e) => setCurrentSchedule({ ...currentSchedule, overtimeBankExpirationMonths: parseInt(e.target.value) })}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-sm font-bold uppercase tracking-wider">Horários p/ Dia da Semana</Label>
                            <div className="space-y-2 border rounded-xl p-3 bg-slate-50/50">
                                {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Dom'].map((label, idx) => {
                                    const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
                                    const dayName = dayOrder[idx];

                                    let dayIdx = (currentSchedule.days || []).findIndex(d => d.dayOfWeek === dayName);
                                    if (dayIdx === -1) dayIdx = idx;

                                    const dayData = currentSchedule.days?.[dayIdx];
                                    if (!dayData) return null;

                                    return (
                                        <div key={dayName} className="flex flex-col gap-2 p-3 rounded-lg bg-white border shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <div className="w-20 font-bold text-xs uppercase text-slate-500">{label}</div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-400 font-medium">{dayData.isWorkDay ? 'DIA ÚTIL' : 'FOLGA'}</span>
                                                    <Switch
                                                        checked={dayData.isWorkDay}
                                                        onCheckedChange={(v) => updateDay(dayIdx, 'isWorkDay', v)}
                                                    />
                                                </div>
                                            </div>

                                            {dayData.isWorkDay && (
                                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mt-1">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] text-slate-400">Jornada</Label>
                                                        <div className="flex items-center gap-1.5">
                                                            <Input
                                                                type="time"
                                                                className="h-8 text-xs bg-slate-50 px-2 flex-1"
                                                                value={dayData.entryTime || '08:00'}
                                                                onChange={(e) => updateDay(dayIdx, 'entryTime', e.target.value)}
                                                            />
                                                            <span className="text-[10px] text-slate-300">às</span>
                                                            <Input
                                                                type="time"
                                                                className="h-8 text-xs bg-slate-50 px-2 flex-1"
                                                                value={dayData.exitTime || '18:00'}
                                                                onChange={(e) => updateDay(dayIdx, 'exitTime', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] text-slate-400">Almoço</Label>
                                                        <div className="flex items-center gap-1.5">
                                                            <Input
                                                                type="time"
                                                                className="h-8 text-xs bg-orange-50/30 px-2 border-orange-100 flex-1"
                                                                value={dayData.breakStartTime || '12:00'}
                                                                onChange={(e) => updateDay(dayIdx, 'breakStartTime', e.target.value)}
                                                            />
                                                            <span className="text-[10px] text-slate-300">às</span>
                                                            <Input
                                                                type="time"
                                                                className="h-8 text-xs bg-orange-50/30 px-2 border-orange-100 flex-1"
                                                                value={dayData.breakEndTime || '13:00'}
                                                                onChange={(e) => updateDay(dayIdx, 'breakEndTime', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="bg-slate-50 p-6 -m-6 mt-6 rounded-b-lg border-t">
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving} className="btn-primary min-w-[150px]">
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Salvar Escala
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
