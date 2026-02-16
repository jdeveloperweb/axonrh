'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { processesApi, TerminationProcess, TerminationType, NoticePeriod } from '@/lib/api/processes';
import { Employee } from '@/lib/api/employees';
import { formatDate } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, XCircle, Info, Calendar, ShieldCheck, Laptop, Mouse, Keyboard, Headphones, CreditCard, Key, DollarSign, FileText, Activity, Edit, Play, RotateCcw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { TerminationModal } from './TerminationModal';

interface TerminationTabProps {
    employeeId: string;
    employee: Employee | null;
}

const terminationTypeLabels: Record<TerminationType, string> = {
    RESIGNATION: 'Pedido de Demissão',
    TERMINATION_WITHOUT_CAUSE: 'Dispensa sem Justa Causa',
    TERMINATION_WITH_CAUSE: 'Dispensa com Justa Causa',
    AGREEMENT: 'Acordo entre as Partes',
    RETIREMENT: 'Aposentadoria',
    DEATH: 'Falecimento',
    END_OF_CONTRACT: 'Término de Contrato'
};

const noticePeriodLabels: Record<NoticePeriod, string> = {
    WORKED: 'Trabalhado',
    PAID: 'Indenizado',
    WAIVED: 'Dispensado'
};

export function TerminationTab({ employeeId, employee }: TerminationTabProps) {
    const { toast } = useToast();
    const [process, setProcess] = useState<TerminationProcess | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [finishing, setFinishing] = useState(false);
    const [reopening, setReopening] = useState(false);

    const loadProcess = async () => {
        try {
            setLoading(true);
            const data = await processesApi.terminations.getByEmployeeId(employeeId);
            setProcess(data);
        } catch (error) {
            console.error('Failed to load termination process:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadProcess();
    }, [employeeId]);

    const handleFinalize = async () => {
        if (!process) return;
        const confirm = window.confirm('Deseja realmente FINALIZAR o desligamento? Esta ação irá inativar o colaborador no sistema.');
        if (!confirm) return;

        try {
            setFinishing(true);
            await processesApi.terminations.complete(process.id);
            toast({
                title: 'Sucesso',
                description: 'Desligamento finalizado com sucesso.',
            });
            await loadProcess();
            // Recarregar a página para atualizar status do employee
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast({
                title: 'Erro',
                description: 'Falha ao finalizar desligamento.',
                variant: 'destructive',
            });
        } finally {
            setFinishing(false);
        }
    };

    const handleToggleCheck = async (field: keyof TerminationProcess, value: boolean) => {
        if (!process || process.completedAt) return;

        // Armazena estado anterior para rollback se necessário
        const previousProcess = { ...process };

        // Update otimista
        setProcess({
            ...process,
            [field]: value
        } as TerminationProcess);

        try {
            await processesApi.terminations.initiate({
                ...process,
                [field]: value
            } as any);

            toast({
                title: '✓ Atualizado',
                description: 'Informação salva com sucesso.',
            });
        } catch (error) {
            console.error(error);
            // Rollback em caso de erro
            setProcess(previousProcess);
            toast({
                title: 'Erro',
                description: 'Falha ao salvar alteração.',
                variant: 'destructive',
            });
        }
    };

    const handleReopen = async () => {
        if (!process) return;
        const confirm = window.confirm('Deseja realmente REABRIR o desligamento? Isso permitirá novas edições e o colaborador voltará a ficar ativo no sistema.');
        if (!confirm) return;

        try {
            setReopening(true);
            await processesApi.terminations.reopen(process.id);
            toast({
                title: 'Sucesso',
                description: 'Desligamento reaberto com sucesso.',
            });
            await loadProcess();
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast({
                title: 'Erro',
                description: 'Falha ao reabrir desligamento.',
                variant: 'destructive',
            });
        } finally {
            setReopening(false);
        }
    };

    if (loading) {
        return (
            <div className="p-12 text-center animate-pulse space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-rose-100 border-t-rose-500 animate-spin mx-auto" />
                <p className="text-slate-400 font-medium">Carregando detalhes do desligamento...</p>
            </div>
        );
    }

    if (!process) {
        return (
            <div className="p-12 bg-white dark:bg-slate-900 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full w-fit mx-auto">
                    <Info className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Nenhum processo encontrado</h3>
                <p className="text-slate-500 max-w-sm mx-auto">Não foi possível recuperar os detalhes do processo de desligamento deste colaborador.</p>
            </div>
        );
    }

    const ChecklistItem = ({ checked, label, icon: Icon, field }: { checked: boolean, label: string, icon: any, field: keyof TerminationProcess }) => (
        <div
            onClick={() => !process?.completedAt && handleToggleCheck(field, !checked)}
            className={`group flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${checked
                ? 'bg-emerald-50/40 border-emerald-100/60 dark:bg-emerald-500/5 dark:border-emerald-500/20'
                : 'bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                } ${process?.completedAt ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}`}
        >
            <div className={`p-2.5 rounded-xl transition-colors duration-300 ${checked
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                }`}>
                <Icon className="w-4 h-4" />
            </div>
            <span className={`flex-1 text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${checked ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'
                }`}>
                {label}
            </span>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${checked
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 rotate-0'
                : 'border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 group-hover:border-slate-400'
                }`}>
                {checked && <CheckCircle2 className="w-4 h-4" />}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header com Status e Ações */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${process.completedAt ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10'}`}>
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                            Resumo do Desligamento
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            {!process.completedAt ? (
                                <span className="px-3 py-1 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-1.5 border border-amber-100 dark:border-amber-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    Em Processo
                                </span>
                            ) : (
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-1.5 border border-emerald-100 dark:border-emerald-500/20">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Processo Finalizado
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!process.completedAt ? (
                        <>
                            <Button
                                variant="outline"
                                className="h-10 px-4 text-xs font-black uppercase tracking-widest border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl gap-2 shadow-sm transition-all active:scale-95"
                                onClick={() => setIsEditModalOpen(true)}
                            >
                                <Edit className="w-3.5 h-3.5" /> Editar
                            </Button>
                            <Button
                                className="h-10 px-6 text-xs font-black uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white dark:bg-rose-500 dark:hover:bg-rose-600 rounded-xl gap-2 shadow-lg shadow-rose-200 dark:shadow-rose-900/20 transition-all active:scale-95"
                                onClick={handleFinalize}
                                disabled={finishing}
                            >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                {finishing ? 'Finalizando...' : 'Finalizar Processo'}
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="outline"
                            className="h-10 px-6 text-xs font-black uppercase tracking-widest border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl gap-2 transition-all active:scale-95"
                            onClick={handleReopen}
                            disabled={reopening}
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> Reabrir Processo
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 overflow-hidden border-rose-100/50 dark:border-rose-900/20 rounded-[32px] shadow-sm">
                    <CardContent className="p-8">
                        {!process.completedAt && (
                            <div className="mb-8 p-4 bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl flex items-start gap-3">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl">
                                    <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-tight">Processo em andamento</p>
                                    <p className="text-xs text-indigo-700/80 dark:text-indigo-400/80 mt-0.5 font-medium leading-relaxed">
                                        Os checklists de equipamentos e exames são atualizados em tempo real clicando diretamente nos itens.
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                            <div className="space-y-8">
                                <div className="group transition-all">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 group-hover:text-rose-500 transition-colors">Tipo de Desligamento</p>
                                    <p className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                                        {terminationTypeLabels[process.terminationType] || process.terminationType}
                                    </p>
                                </div>
                                <div className="group transition-all">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 group-hover:text-rose-500 transition-colors">Aviso Prévio</p>
                                    <p className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                                        {noticePeriodLabels[process.noticePeriod] || process.noticePeriod}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-8">
                                <div className="group transition-all">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 group-hover:text-rose-500 transition-colors">Último Dia Trabalhado</p>
                                    <div className="flex items-center gap-3 text-lg font-black text-slate-800 dark:text-white">
                                        <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg text-rose-500">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        {formatDate(process.lastWorkDay)}
                                    </div>
                                </div>
                                <div className="group transition-all">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 group-hover:text-rose-500 transition-colors">Data de Desligamento</p>
                                    <div className="flex items-center gap-3 text-lg font-black text-slate-800 dark:text-white">
                                        <div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-lg text-rose-600 dark:text-rose-400">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        {formatDate(process.terminationDate)}
                                    </div>
                                </div>
                            </div>
                            {process.reason && (
                                <div className="col-span-full pt-8 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Motivo / Observações</p>
                                    <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-3xl text-slate-600 dark:text-slate-400 text-sm font-medium italic border border-slate-100 dark:border-slate-800/50">
                                        "{process.reason}"
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    {/* Timeline do Processo */}
                    <Card className="rounded-[32px] border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Linha do Tempo</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-8 relative ml-2">
                                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800" />

                                <div className="relative flex gap-4">
                                    <div className="w-4 h-4 rounded-full bg-emerald-500 mt-1 z-10 border-4 border-white dark:border-slate-900 shadow-sm shadow-emerald-500/20" />
                                    <div>
                                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Iniciado</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight mt-0.5">{formatDate(process.createdAt)}</p>
                                    </div>
                                </div>

                                {process.completedAt && (
                                    <div className="relative flex gap-4">
                                        <div className="w-4 h-4 rounded-full bg-indigo-500 mt-1 z-10 border-4 border-white dark:border-slate-900 shadow-sm shadow-indigo-500/20" />
                                        <div>
                                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Finalizado</p>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight mt-0.5">{formatDate(process.completedAt)}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="relative flex gap-4">
                                    <div className={`w-4 h-4 rounded-full mt-1 z-10 border-4 border-white dark:border-slate-900 shadow-sm ${process.esocialSent ? 'bg-indigo-500 shadow-indigo-500/20' : 'bg-slate-200'}`} />
                                    <div>
                                        <p className={`text-xs font-black uppercase tracking-wider ${process.esocialSent ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>eSocial</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight mt-0.5">
                                            {process.esocialSent ? 'Enviado com sucesso' : 'Pendente de envio'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Informações Financeiras */}
                    <Card className="border-emerald-100 dark:border-emerald-900/20 rounded-[32px] shadow-sm overflow-hidden">
                        <CardHeader className="bg-emerald-50/50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-900/20">
                            <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
                                <DollarSign className="w-4 h-4" />
                                Financeiro (Rescisão)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-70">Valor Total Previsto</p>
                                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                    {process.severancePayAmount ? formatCurrency(process.severancePayAmount) : 'R$ 0,00'}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-5 border-t border-slate-100 dark:border-slate-800">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-70">Data Pagto.</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                        {process.severancePayDate ? formatDate(process.severancePayDate) : '--/--/----'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-70">Método</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                                        {process.severancePayMethod || 'Não informado'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Exames e Atividades */}
                <Card className="rounded-[32px] border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                            <Activity className="w-4 h-4 text-rose-500" />
                            Exames e Saída
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4 flex-1">
                        <ChecklistItem checked={process.dismissalExamDone} label="Exame Demissional" icon={Activity} field="dismissalExamDone" />
                        {process.dismissalExamDate && (
                            <div className="flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 group transition-all">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-rose-500 transition-colors">Data Realização</span>
                                <span className="text-xs font-black text-slate-700 dark:text-slate-200">{formatDate(process.dismissalExamDate)}</span>
                            </div>
                        )}
                        <ChecklistItem checked={process.exitInterviewDone} label="Entrevista de Saída" icon={Info} field="exitInterviewDone" />
                    </CardContent>
                </Card>

                {/* Devolução de Equipamentos */}
                <Card className="lg:col-span-2 rounded-[32px] border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                            <Laptop className="w-4 h-4 text-indigo-500" />
                            Checklist de Equipamentos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <ChecklistItem checked={process.returnedLaptop} label="Notebook" icon={Laptop} field="returnedLaptop" />
                            <ChecklistItem checked={process.returnedMouse} label="Mouse" icon={Mouse} field="returnedMouse" />
                            <ChecklistItem checked={process.returnedKeyboard} label="Teclado" icon={Keyboard} field="returnedKeyboard" />
                            <ChecklistItem checked={process.returnedHeadset} label="Headset" icon={Headphones} field="returnedHeadset" />
                            <ChecklistItem checked={process.returnedBadge} label="Crachá" icon={CreditCard} field="returnedBadge" />
                            <ChecklistItem checked={process.returnedToken} label="Token / Acesso" icon={Key} field="returnedToken" />
                        </div>
                        {process.otherEquipment && (
                            <div className="mt-6 flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 group transition-all">
                                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm group-hover:border-indigo-200 transition-colors">
                                    <Laptop className="w-3.5 h-3.5 text-indigo-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Outros Equipamentos</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{process.otherEquipment}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Inativação de Acessos */}
                <Card className="rounded-[32px] border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                            <ShieldCheck className="w-4 h-4 text-indigo-500" />
                            Checklist de Acessos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4 flex-1">
                        <ChecklistItem checked={process.accountDeactivated} label="Inativar ERP/Sistemas" icon={Key} field="accountDeactivated" />
                        <ChecklistItem checked={process.emailDeactivated} label="Desativar E-mail Corp." icon={Laptop} field="emailDeactivated" />
                    </CardContent>
                </Card>

                {process.generalNotes && (
                    <Card className="lg:col-span-2 rounded-[32px] border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                                <FileText className="w-4 h-4 text-slate-400" />
                                Observações Gerais
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[28px] text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed italic border border-slate-100 dark:border-slate-800/50">
                                "{process.generalNotes}"
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <TerminationModal
                employee={employee}
                initialData={process}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={loadProcess}
            />
        </div>
    );
}
