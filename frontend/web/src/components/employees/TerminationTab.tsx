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

        try {
            await processesApi.terminations.initiate({
                ...process,
                [field]: value
            } as any);

            // Local update for better UX
            setProcess({
                ...process,
                [field]: value
            } as TerminationProcess);

            toast({
                title: 'Atualizado',
                description: 'Informação salva com sucesso.',
            });
        } catch (error) {
            console.error(error);
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
        return <div className="p-12 text-center animate-pulse text-slate-400">Carregando detalhes do desligamento...</div>;
    }

    if (!process) {
        return (
            <div className="p-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4">
                <Info className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nenhum processo encontrado</h3>
                <p className="text-slate-500 max-w-sm mx-auto">Não foi possível recuperar os detalhes do processo de desligamento deste colaborador.</p>
            </div>
        );
    }

    const ChecklistItem = ({ checked, label, icon: Icon, field }: { checked: boolean, label: string, icon: any, field: keyof TerminationProcess }) => (
        <div
            onClick={() => !process?.completedAt && handleToggleCheck(field, !checked)}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${checked
                ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800'
                : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-300'
                } ${process?.completedAt ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
            <div className={`p-2 rounded-lg ${checked ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                <Icon className="w-4 h-4" />
            </div>
            <span className="flex-1 text-xs font-bold uppercase tracking-wider">{label}</span>
            {checked ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-200" />}
        </div>
    );
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Resumo do Desligamento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 overflow-hidden border-rose-100 dark:border-rose-900/30">
                    <div className="bg-rose-50 dark:bg-rose-950/20 px-6 py-4 flex items-center justify-between border-b border-rose-100 dark:border-rose-900/30">
                        <h3 className="font-black text-rose-800 dark:text-rose-400 uppercase tracking-widest text-xs flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Resumo do Desligamento
                        </h3>
                        <div className="flex gap-2">
                            {!process.completedAt ? (
                                <>
                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full uppercase tracking-tighter flex items-center gap-1">
                                        <Activity className="w-3 h-3" />
                                        Em Processo de Desligamento
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-[10px] font-black uppercase tracking-widest border-slate-200 bg-white"
                                        onClick={() => setIsEditModalOpen(true)}
                                    >
                                        <Edit className="w-3 h-3 mr-1" /> Editar
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-7 text-[10px] font-black uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white"
                                        onClick={handleFinalize}
                                        disabled={finishing}
                                    >
                                        <Play className="w-3 h-3 mr-1" /> Finalizar Desligamento
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-tighter">
                                        Processo Finalizado
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-[10px] font-black uppercase tracking-widest border-slate-200 bg-white"
                                        onClick={handleReopen}
                                        disabled={reopening}
                                    >
                                        <RotateCcw className="w-3 h-3 mr-1" /> Reabrir
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                    <CardContent className="p-6">
                        {!process.completedAt && (
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-blue-900">Processo em andamento</p>
                                    <p className="text-xs text-blue-700">Você pode atualizar os checklists de equipamentos e exames clicando diretamente nos itens abaixo. As alterações são salvas automaticamente.</p>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tipo de Desligamento</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                                        {terminationTypeLabels[process.terminationType] || process.terminationType}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aviso Prévio</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                                        {noticePeriodLabels[process.noticePeriod] || process.noticePeriod}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Último Dia Trabalhado</p>
                                    <div className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                                        <Calendar className="w-5 h-5 text-rose-500" />
                                        {formatDate(process.lastWorkDay)}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data de Desligamento</p>
                                    <div className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                                        <Calendar className="w-5 h-5 text-rose-600" />
                                        {formatDate(process.terminationDate)}
                                    </div>
                                </div>
                            </div>
                            {process.reason && (
                                <div className="col-span-full pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Motivo / Observações</p>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-slate-700 dark:text-slate-300 italic">
                                        "{process.reason}"
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Timeline do Processo */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase tracking-widest">Linha do Tempo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6 relative ml-2">
                            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800" />

                            <div className="relative flex gap-4">
                                <div className="w-4 h-4 rounded-full bg-emerald-500 mt-1 z-10 border-4 border-white dark:border-slate-900 shadow-sm" />
                                <div>
                                    <p className="text-xs font-black text-slate-900 dark:text-white">Iniciado</p>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">{formatDate(process.createdAt)}</p>
                                </div>
                            </div>

                            {process.completedAt && (
                                <div className="relative flex gap-4">
                                    <div className="w-4 h-4 rounded-full bg-indigo-500 mt-1 z-10 border-4 border-white dark:border-slate-900 shadow-sm" />
                                    <div>
                                        <p className="text-xs font-black text-slate-900 dark:text-white">Finalizado</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">{formatDate(process.completedAt)}</p>
                                    </div>
                                </div>
                            )}

                            <div className="relative flex gap-4">
                                <div className={`w-4 h-4 rounded-full mt-1 z-10 border-4 border-white dark:border-slate-900 shadow-sm ${process.esocialSent ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                                <div>
                                    <p className={`text-xs font-black ${process.esocialSent ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>eSocial</p>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">
                                        {process.esocialSent ? 'Enviado com sucesso' : 'Pendente de envio'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Informações Financeiras */}
                <Card className="md:col-span-1 border-emerald-100 dark:border-emerald-900/30">
                    <CardHeader className="bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/30">
                        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-400">
                            <DollarSign className="w-4 h-4" />
                            Financeiro (Rescisão)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Total Previsto</p>
                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {process.severancePayAmount ? formatCurrency(process.severancePayAmount) : 'R$ 0,00'}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data Pagto.</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                    {process.severancePayDate ? formatDate(process.severancePayDate) : '--/--/----'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Método</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                    {process.severancePayMethod || 'Não informado'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Exames e Atividades */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                            <Activity className="w-4 h-4 text-rose-500" />
                            Exames e Saída
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ChecklistItem checked={process.dismissalExamDone} label="Exame Demissional" icon={Activity} field="dismissalExamDone" />
                        {process.dismissalExamDate && (
                            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Data da Realização</span>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatDate(process.dismissalExamDate)}</span>
                            </div>
                        )}
                        <ChecklistItem checked={process.exitInterviewDone} label="Entrevista de Desligamento" icon={Info} field="exitInterviewDone" />
                    </CardContent>
                </Card>
                {/* Devolução de Equipamentos */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                            <Laptop className="w-4 h-4 text-indigo-500" />
                            Checklist de Equipamentos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <ChecklistItem checked={process.returnedLaptop} label="Notebook" icon={Laptop} field="returnedLaptop" />
                        <ChecklistItem checked={process.returnedMouse} label="Mouse" icon={Mouse} field="returnedMouse" />
                        <ChecklistItem checked={process.returnedKeyboard} label="Teclado" icon={Keyboard} field="returnedKeyboard" />
                        <ChecklistItem checked={process.returnedHeadset} label="Headset" icon={Headphones} field="returnedHeadset" />
                        <ChecklistItem checked={process.returnedBadge} label="Crachá" icon={CreditCard} field="returnedBadge" />
                        <ChecklistItem checked={process.returnedToken} label="Token/Acesso" icon={Key} field="returnedToken" />
                        {process.otherEquipment && (
                            <div className="col-span-full mt-2 text-xs font-bold text-slate-500 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                Outros: <span className="text-slate-700 dark:text-slate-300">{process.otherEquipment}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Inativação de Acessos */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                            <ShieldCheck className="w-4 h-4 text-indigo-500" />
                            Checklist de Acessos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <ChecklistItem checked={process.accountDeactivated} label="Inativação de Acesso (ERP/Sistemas)" icon={Key} field="accountDeactivated" />
                        <ChecklistItem checked={process.emailDeactivated} label="Desativação de E-mail Corp." icon={Laptop} field="emailDeactivated" />
                    </CardContent>
                </Card>
            </div>

            {process.generalNotes && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                            <FileText className="w-4 h-4 text-slate-500" />
                            Observações Gerais
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-slate-700 dark:text-slate-300">
                            {process.generalNotes}
                        </div>
                    </CardContent>
                </Card>
            )}

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
