'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { processesApi, TerminationProcess, TerminationType, NoticePeriod } from '@/lib/api/processes';
import { formatDate } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, XCircle, Info, Calendar, ShieldCheck, Laptop, Mouse, Keyboard, Headphones, CreditCard, Key } from 'lucide-react';

interface TerminationTabProps {
    employeeId: string;
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

export function TerminationTab({ employeeId }: TerminationTabProps) {
    const [process, setProcess] = useState<TerminationProcess | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProcess() {
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
        loadProcess();
    }, [employeeId]);

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

    const ChecklistItem = ({ checked, label, icon: Icon }: { checked: boolean, label: string, icon: any }) => (
        <div className={`flex items-center gap-3 p-3 rounded-xl border ${checked ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
            <div className={`p-2 rounded-lg ${checked ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                <Icon className="w-4 h-4" />
            </div>
            <span className="flex-1 text-xs font-bold uppercase tracking-wider">{label}</span>
            {checked ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-slate-300" />}
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
                        {process.completedAt && (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-tighter">
                                Processo Finalizado
                            </span>
                        )}
                    </div>
                    <CardContent className="p-6">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Devolução de Equipamentos */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                            <Laptop className="w-4 h-4 text-indigo-500" />
                            Checklist de Equipamentos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <ChecklistItem checked={process.returnedLaptop} label="Notebook" icon={Laptop} />
                        <ChecklistItem checked={process.returnedMouse} label="Mouse" icon={Mouse} />
                        <ChecklistItem checked={process.returnedKeyboard} label="Teclado" icon={Keyboard} />
                        <ChecklistItem checked={process.returnedHeadset} label="Headset" icon={Headphones} />
                        <ChecklistItem checked={process.returnedBadge} label="Crachá" icon={CreditCard} />
                        <ChecklistItem checked={process.returnedToken} label="Token/Acesso" icon={Key} />
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
                            Checklist de Processos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <ChecklistItem checked={process.accountDeactivated} label="Inativação de Acessos (Sistemas)" icon={Key} />
                        <ChecklistItem checked={process.emailDeactivated} label="Desativação de E-mail" icon={Laptop} />
                        <ChecklistItem checked={process.exitInterviewDone} label="Entrevista de Desligamento" icon={Info} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
