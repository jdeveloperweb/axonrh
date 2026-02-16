'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    UserMinus,
    Search,
    Filter,
    Plus,
    MoreHorizontal,
    Clock,
    CheckCircle2,
    AlertCircle,
    UserX,
    TrendingDown,
    CalendarDays
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    processesApi,
    AdmissionProcess,
    AdmissionStatus,
    TerminationProcess
} from '@/lib/api/processes';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem
} from '@/components/ui/dropdown-menu';

const admissionStatusMap: Record<AdmissionStatus, { label: string, color: string, icon: React.ElementType }> = {
    LINK_GENERATED: { label: 'Link Enviado', color: 'bg-blue-100 text-blue-800', icon: Clock },
    DATA_FILLING: { label: 'Preenchendo Dados', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    DOCUMENTS_PENDING: { label: 'Doc. Pendentes', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
    DOCUMENTS_VALIDATING: { label: 'Validando Doc.', color: 'bg-purple-100 text-purple-800', icon: Clock },
    CONTRACT_PENDING: { label: 'Contrato Pendente', color: 'bg-blue-100 text-blue-800', icon: Clock },
    SIGNATURE_PENDING: { label: 'Assinatura Pendente', color: 'bg-indigo-100 text-indigo-800', icon: Clock },
    ESOCIAL_PENDING: { label: 'eSocial Pendente', color: 'bg-pink-100 text-pink-800', icon: Clock },
    COMPLETED: { label: 'Concluído', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: AlertCircle },
    EXPIRED: { label: 'Expirado', color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
    REJECTED: { label: 'Rejeitado', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

export default function ProcessesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'admissions' | 'terminations'>('admissions');
    const [loading, setLoading] = useState(true);
    const [admissions, setAdmissions] = useState<AdmissionProcess[]>([]);
    const [terminations, setTerminations] = useState<TerminationProcess[]>([]);
    const [search, setSearch] = useState('');

    const fetchAdmissions = useCallback(async () => {
        try {
            setLoading(true);
            const response = await processesApi.admissions.list();
            setAdmissions(response.content);
        } catch (error) {
            console.error(error);
            toast({
                title: 'Erro',
                description: 'Falha ao carregar processos de admissão',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const fetchTerminations = useCallback(async () => {
        try {
            setLoading(true);
            const data = await processesApi.terminations.list();
            setTerminations(data);
        } catch (error) {
            console.error(error);
            toast({
                title: 'Erro',
                description: 'Falha ao carregar processos de desligamento',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (activeTab === 'admissions') fetchAdmissions();
        else fetchTerminations();
    }, [activeTab, fetchAdmissions, fetchTerminations]);

    const filteredAdmissions = admissions.filter(a =>
        a.candidateName.toLowerCase().includes(search.toLowerCase()) ||
        a.candidateEmail.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">Processos de RH</h1>
                    <p className="text-[var(--color-text-secondary)]">
                        Acompanhe o fluxo de contratação e desligamento
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/employees')}
                        className="flex items-center gap-2"
                    >
                        <UserMinus className="w-4 h-4" /> Desligar Colaborador
                    </Button>
                    <Button
                        onClick={() => router.push('/employees/new')}
                        className="flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Nova Admissão
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('admissions')}
                    className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'admissions'
                        ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Contratações ({admissions.length})
                </button>
                <button
                    onClick={() => setActiveTab('terminations')}
                    className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'terminations'
                        ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Desligamentos ({terminations.length})
                </button>
            </div>

            {activeTab === 'admissions' ? (
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        placeholder="Buscar candidato..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Button variant="outline" size="icon">
                                    <Filter className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/50">
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidato</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vaga / Depto</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Início Previsto</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Progresso</th>
                                            <th className="px-6 py-4 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {loading ? (
                                            [1, 2, 3].map(i => (
                                                <tr key={i} className="animate-pulse">
                                                    <td colSpan={6} className="px-6 py-4 h-16 bg-gray-50/20" />
                                                </tr>
                                            ))
                                        ) : filteredAdmissions.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                    Nenhum processo de admissão encontrado.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAdmissions.map(process => (
                                                <tr key={process.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{process.candidateName}</p>
                                                            <p className="text-sm text-gray-500">{process.candidateEmail}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm">
                                                            <p className="font-medium text-gray-700">{process.position?.title || 'Cargo não definido'}</p>
                                                            <p className="text-gray-500">{process.department?.name || 'Depto não definido'}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {process.expectedHireDate ? formatDate(process.expectedHireDate) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge className={admissionStatusMap[process.status]?.color + " shadow-none"}>
                                                            <span className="flex items-center gap-1">
                                                                {(() => {
                                                                    const Icon = admissionStatusMap[process.status]?.icon;
                                                                    return Icon ? <Icon className="w-3 h-3" /> : null;
                                                                })()}
                                                                {admissionStatusMap[process.status]?.label}
                                                            </span>
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-[var(--color-primary)] rounded-full transition-all"
                                                                    style={{ width: `${process.progressPercent}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-medium text-gray-500">{process.progressPercent}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="bg-white border border-gray-200">
                                                                <DropdownMenuItem onClick={() => router.push(`/processes/admission/${process.id}`)}>
                                                                    Ver Detalhes
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem>
                                                                    Reenviar Link
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="text-red-600">
                                                                    Cancelar Processo
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/50">
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Colaborador</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo / Aviso</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Último Dia / Rescisão</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Financeiro</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {loading ? (
                                            [1, 2, 3].map(i => (
                                                <tr key={i} className="animate-pulse">
                                                    <td colSpan={6} className="px-6 py-4 h-16 bg-gray-50/20" />
                                                </tr>
                                            ))
                                        ) : terminations.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                    Nenhum processo de desligamento em aberto.
                                                </td>
                                            </tr>
                                        ) : (
                                            terminations.map(proc => (
                                                <tr key={proc.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0">
                                                                {proc.photoUrl ? (
                                                                    <img src={proc.photoUrl} alt={proc.employeeName} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    proc.employeeName.charAt(0)
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-900">{proc.employeeName}</p>
                                                                <div className="text-xs text-gray-500">
                                                                    <p>{proc.positionTitle || 'Cargo não definido'}</p>
                                                                    <p>{proc.departmentName || 'Depto não definido'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        <p className="font-medium">{proc.terminationType}</p>
                                                        <p className="text-xs text-gray-500">{proc.noticePeriod}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        <p>Trab: {formatDate(proc.lastWorkDay)}</p>
                                                        <p className="text-xs">Desc: {formatDate(proc.terminationDate)}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                                                        {proc.severancePayAmount ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proc.severancePayAmount) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {!proc.completedAt ? (
                                                            <Badge className="bg-amber-100 text-amber-700 shadow-none border-none">
                                                                <Clock className="w-3 h-3 mr-1" /> Em Processo
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-green-100 text-green-700 shadow-none border-none">
                                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Finalizado
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => router.push(`/employees/${proc.employeeId}?tab=termination`)}
                                                        >
                                                            Movimentar
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
