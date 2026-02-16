'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
    processesApi,
    TerminationType,
    NoticePeriod,
    TerminationRequest
} from '@/lib/api/processes';
import { Employee } from '@/lib/api/employees';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
    Laptop,
    Mouse,
    Keyboard,
    Headset,
    UserSquare,
    Key,
    MailX,
    ShieldAlert,
    ClipboardCheck,
    Building2,
    Home,
    DollarSign
} from 'lucide-react';

interface TerminationModalProps {
    employee: Employee | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function TerminationModal({ employee, isOpen, onClose, onSuccess }: TerminationModalProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<TerminationRequest>({
        employeeId: employee?.id || '',
        terminationType: 'TERMINATION_WITHOUT_CAUSE',
        noticePeriod: 'WORKED',
        lastWorkDay: format(new Date(), 'yyyy-MM-dd'),
        terminationDate: format(new Date(), 'yyyy-MM-dd'),
        reason: '',
        returnedLaptop: false,
        returnedMouse: false,
        returnedKeyboard: false,
        returnedHeadset: false,
        returnedBadge: false,
        returnedToken: false,
        accountDeactivated: false,
        emailDeactivated: false,
        exitInterviewDone: false,
        dismissalExamDone: false,
        dismissalExamDate: '',
        severancePayAmount: 0,
        severancePayDate: '',
        severancePayMethod: 'TRANSFERENCE',
        financialNotes: '',
        generalNotes: '',
    });

    const terminationTypeLabels: Record<string, string> = {
        'RESIGNATION': 'Pedido de Demissão',
        'TERMINATION_WITHOUT_CAUSE': 'Dispensa sem Justa Causa',
        'TERMINATION_WITH_CAUSE': 'Dispensa com Justa Causa',
        'AGREEMENT': 'Acordo (Reforma Trabalhista)',
        'END_OF_CONTRACT': 'Término de Contrato',
        'RETIREMENT': 'Aposentadoria',
        'DEATH': 'Falecimento'
    };

    const noticePeriodLabels: Record<string, string> = {
        'WORKED': 'Trabalhado',
        'PAID': 'Indenizado',
        'WAIVED': 'Dispensado / Não se aplica'
    };

    useEffect(() => {
        if (employee) {
            setFormData(prev => ({ ...prev, employeeId: employee.id }));
        }
    }, [employee]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employee) return;

        try {
            setLoading(true);
            const process = await processesApi.terminations.initiate(formData);

            // Se o usuário clicar em "Confirmar Desligamento", nós finalizamos.
            // Se mudarmos o botão para "Salvar Rascunho", poderíamos só iniciar.
            // Por enquanto, vamos seguir o que o usuário sugeriu: Ter um processo.
            // Para ser prático, se ele preencheu tudo aqui, finaliza.

            await processesApi.terminations.complete(process.id);

            toast({
                title: 'Sucesso',
                description: `Processo de desligamento de ${employee.fullName} concluído com sucesso.`,
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast({
                title: 'Erro',
                description: 'Falha ao processar desligamento.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    if (!employee) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-2xl rounded-xl p-0">
                <DialogHeader className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-red-600" />
                        Desligamento de Colaborador
                    </DialogTitle>
                    <p className="text-sm text-gray-500 mt-1">
                        Iniciando processo demissional para <strong>{employee.fullName}</strong>
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Dados Principais */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo de Desligamento</Label>
                            <Select
                                value={formData.terminationType}
                                onValueChange={(v) => setFormData({ ...formData, terminationType: v as TerminationType })}
                            >
                                <SelectTrigger className="bg-white border-gray-200">
                                    <SelectValue placeholder="Selecione o tipo">
                                        {terminationTypeLabels[formData.terminationType]}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-gray-200">
                                    <SelectItem value="RESIGNATION">Pedido de Demissão</SelectItem>
                                    <SelectItem value="TERMINATION_WITHOUT_CAUSE">Dispensa sem Justa Causa</SelectItem>
                                    <SelectItem value="TERMINATION_WITH_CAUSE">Dispensa com Justa Causa</SelectItem>
                                    <SelectItem value="AGREEMENT">Acordo (Reforma Trabalhista)</SelectItem>
                                    <SelectItem value="END_OF_CONTRACT">Término de Contrato</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Aviso Prévio</Label>
                            <Select
                                value={formData.noticePeriod}
                                onValueChange={(v) => setFormData({ ...formData, noticePeriod: v as NoticePeriod })}
                            >
                                <SelectTrigger className="bg-white border-gray-200">
                                    <SelectValue placeholder="Selecione o aviso">
                                        {noticePeriodLabels[formData.noticePeriod]}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-gray-200">
                                    <SelectItem value="WORKED">Trabalhado</SelectItem>
                                    <SelectItem value="PAID">Indenizado</SelectItem>
                                    <SelectItem value="WAIVED">Dispensado / Não se aplica</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Último Dia Trabalhado</Label>
                            <Input
                                type="date"
                                value={formData.lastWorkDay}
                                onChange={(e) => setFormData({ ...formData, lastWorkDay: e.target.value })}
                                className="bg-white border-gray-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Data de Desligamento (Rescisão)</Label>
                            <Input
                                type="date"
                                value={formData.terminationDate}
                                onChange={(e) => setFormData({ ...formData, terminationDate: e.target.value })}
                                className="bg-white border-gray-200"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Motivo do Desligamento</Label>
                        <Textarea
                            placeholder="Descreva brevemente o motivo..."
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="bg-white border-gray-200 min-h-[80px]"
                        />
                    </div>

                    {/* Regime de Trabalho Display */}
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex items-center gap-3">
                        {employee.workRegime === 'REMOTO' || employee.workRegime === 'HIBRIDO' ? (
                            <Home className="w-5 h-5 text-blue-600" />
                        ) : (
                            <Building2 className="w-5 h-5 text-blue-600" />
                        )}
                        <div>
                            <p className="text-sm font-semibold text-blue-900">
                                Regime de Trabalho: {employee.workRegime === 'REMOTO' ? 'Home Office' : employee.workRegime === 'HIBRIDO' ? 'Híbrido' : 'Presencial'}
                            </p>
                            <p className="text-xs text-blue-700">
                                {employee.workRegime === 'REMOTO' ? 'Certifique-se de agendar a coleta dos equipamentos via transportadora.' : 'O colaborador deve entregar os equipamentos pessoalmente no dia do desligamento.'}
                            </p>
                        </div>
                    </div>

                    {/* Checklist de Equipamentos */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Laptop className="w-4 h-4 text-gray-500" />
                            Devolução de Equipamentos
                        </h4>
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="laptop"
                                    checked={formData.returnedLaptop}
                                    onCheckedChange={(v: boolean) => setFormData({ ...formData, returnedLaptop: !!v })}
                                />
                                <Label htmlFor="laptop" className="flex items-center gap-2 cursor-pointer">
                                    <Laptop className="w-4 h-4" /> Notebook / PC
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="mouse"
                                    checked={formData.returnedMouse}
                                    onCheckedChange={(v: boolean) => setFormData({ ...formData, returnedMouse: !!v })}
                                />
                                <Label htmlFor="mouse" className="flex items-center gap-2 cursor-pointer">
                                    <Mouse className="w-4 h-4" /> Mouse
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="keyboard"
                                    checked={formData.returnedKeyboard}
                                    onCheckedChange={(v: boolean) => setFormData({ ...formData, returnedKeyboard: !!v })}
                                />
                                <Label htmlFor="keyboard" className="flex items-center gap-2 cursor-pointer">
                                    <Keyboard className="w-4 h-4" /> Teclado
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="headset"
                                    checked={formData.returnedHeadset}
                                    onCheckedChange={(v: boolean) => setFormData({ ...formData, returnedHeadset: !!v })}
                                />
                                <Label htmlFor="headset" className="flex items-center gap-2 cursor-pointer">
                                    <Headset className="w-4 h-4" /> Headset
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="badge"
                                    checked={formData.returnedBadge}
                                    onCheckedChange={(v: boolean) => setFormData({ ...formData, returnedBadge: !!v })}
                                />
                                <Label htmlFor="badge" className="flex items-center gap-2 cursor-pointer">
                                    <UserSquare className="w-4 h-4" /> Crachá
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="token"
                                    checked={formData.returnedToken}
                                    onCheckedChange={(v: boolean) => setFormData({ ...formData, returnedToken: !!v })}
                                />
                                <Label htmlFor="token" className="flex items-center gap-2 cursor-pointer">
                                    <Key className="w-4 h-4" /> Token / Chave
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Checklist de Processos */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            <ClipboardCheck className="w-4 h-4 text-gray-500" />
                            Checklist de Processos
                        </h4>
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="account"
                                    checked={formData.accountDeactivated}
                                    onCheckedChange={(v: boolean) => setFormData({ ...formData, accountDeactivated: !!v })}
                                />
                                <Label htmlFor="account" className="flex items-center gap-2 cursor-pointer">
                                    Inativar Acessos (Sistemas)
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="email"
                                    checked={formData.emailDeactivated}
                                    onCheckedChange={(v: boolean) => setFormData({ ...formData, emailDeactivated: !!v })}
                                />
                                <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
                                    <MailX className="w-4 h-4" /> Inativar E-mail
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="interview"
                                    checked={formData.exitInterviewDone}
                                    onCheckedChange={(v: boolean) => setFormData({ ...formData, exitInterviewDone: !!v })}
                                />
                                <Label htmlFor="interview" className="flex items-center gap-2 cursor-pointer">
                                    Entrevista de Desligamento
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Exames e Atividades */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            <ClipboardCheck className="w-4 h-4 text-gray-500" />
                            Exames e Atividades
                        </h4>
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="exam"
                                    checked={formData.dismissalExamDone}
                                    onCheckedChange={(v: boolean) => setFormData({ ...formData, dismissalExamDone: !!v })}
                                />
                                <Label htmlFor="exam" className="flex items-center gap-2 cursor-pointer">
                                    Exame Demissional Realizado
                                </Label>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Data do Exame</Label>
                                <Input
                                    type="date"
                                    value={formData.dismissalExamDate}
                                    onChange={(e) => setFormData({ ...formData, dismissalExamDate: e.target.value })}
                                    className="h-8 text-xs bg-white border-gray-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Financeiro */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                            Informações Financeiras
                        </h4>
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="space-y-1">
                                <Label className="text-xs">Valor da Rescisão (Previsto)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0,00"
                                    value={formData.severancePayAmount}
                                    onChange={(e) => setFormData({ ...formData, severancePayAmount: parseFloat(e.target.value) })}
                                    className="h-8 text-xs bg-white border-gray-200"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Data de Pagamento</Label>
                                <Input
                                    type="date"
                                    value={formData.severancePayDate}
                                    onChange={(e) => setFormData({ ...formData, severancePayDate: e.target.value })}
                                    className="h-8 text-xs bg-white border-gray-200"
                                />
                            </div>
                            <div className="space-y-1 col-span-2">
                                <Label className="text-xs">Método de Pagamento</Label>
                                <Input
                                    placeholder="Ex: Transferência Bancária, PIX, Cheque..."
                                    value={formData.severancePayMethod}
                                    onChange={(e) => setFormData({ ...formData, severancePayMethod: e.target.value })}
                                    className="h-8 text-xs bg-white border-gray-200"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Comentários Finais</Label>
                        <Textarea
                            placeholder="Observações gerais sobre o desligamento..."
                            value={formData.generalNotes}
                            onChange={(e) => setFormData({ ...formData, generalNotes: e.target.value })}
                            className="bg-white border-gray-200 min-h-[60px] text-sm"
                        />
                    </div>
                </form>

                <DialogFooter className="p-6 border-t border-gray-100 bg-gray-50/50">
                    <Button variant="ghost" onClick={onClose} disabled={loading} className="text-gray-600 hover:bg-gray-200">
                        Cancelar
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-8"
                    >
                        {loading ? 'Processando...' : 'Confirmar Desligamento'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
