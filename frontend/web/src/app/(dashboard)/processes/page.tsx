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
    ChevronUp,
    ChevronDown,
    Archive,
    FileDigit,
    Mail,
    FastForward,
    MessageSquare,
    XCircle,
    Sparkles,
    Eye,
    RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    processesApi,
    AdmissionProcess,
    AdmissionStatus,
    TerminationProcess,
    DigitalHiringProcess,
    DigitalHiringStatus,
} from '@/lib/api/processes';
import {
    digitalHiringApi,
    DigitalHiringCreateRequest,
    DigitalHiringStats,
    getDigitalHiringStatusLabel,
    getDigitalHiringStatusColor,
} from '@/lib/api/digital-hiring';
import { positionsApi, Position } from '@/lib/api/positions';
import { employeesApi, Department } from '@/lib/api/employees';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

// ==================== Status Maps ====================

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

const digitalHiringStatusIcons: Record<DigitalHiringStatus, React.ElementType> = {
    ADMISSION_PENDING: Clock,
    DOCUMENTS_PENDING: AlertCircle,
    DOCUMENTS_VALIDATING: Clock,
    SIGNATURE_PENDING: Clock,
    COMPLETED: CheckCircle2,
    CANCELLED: AlertCircle,
};

const terminationTypeLabels: Record<string, string> = {
    RESIGNATION: 'Pedido de Demissão',
    TERMINATION_WITHOUT_CAUSE: 'Sem Justa Causa',
    TERMINATION_WITH_CAUSE: 'Com Justa Causa',
    AGREEMENT: 'Acordo',
    RETIREMENT: 'Aposentadoria',
    DEATH: 'Falecimento',
    END_OF_CONTRACT: 'Término de Contrato'
};

const noticePeriodLabels: Record<string, string> = {
    WORKED: 'Trabalhado',
    PAID: 'Indenizado',
    WAIVED: 'Dispensado'
};

// ==================== Main Component ====================

export default function ProcessesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'admissions' | 'digitalHiring' | 'terminations' | 'archived'>('admissions');
    const [loading, setLoading] = useState(true);
    const [admissions, setAdmissions] = useState<AdmissionProcess[]>([]);
    const [terminations, setTerminations] = useState<TerminationProcess[]>([]);
    const [digitalHirings, setDigitalHirings] = useState<DigitalHiringProcess[]>([]);
    const [digitalHiringStats, setDigitalHiringStats] = useState<DigitalHiringStats | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [sortField, setSortField] = useState<string>('employeeName');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Modal state for new digital hiring
    const [showNewHiringModal, setShowNewHiringModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [positions, setPositions] = useState<Position[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [newHiringForm, setNewHiringForm] = useState<DigitalHiringCreateRequest>({
        candidateName: '',
        candidateEmail: '',
        candidateCpf: '',
        candidatePhone: '',
        departmentId: '',
        positionId: '',
        employmentType: 'CLT',
        expectedHireDate: '',
        notes: '',
    });

    // ==================== Data Fetching ====================

    const fetchAdmissions = useCallback(async () => {
        try {
            const response = await processesApi.admissions.list();
            setAdmissions(response.content);
        } catch (error) {
            console.error(error);
        }
    }, []);

    const fetchTerminations = useCallback(async () => {
        try {
            const data = await processesApi.terminations.list();
            setTerminations(data);
        } catch (error) {
            console.error(error);
        }
    }, []);

    const fetchDigitalHirings = useCallback(async () => {
        try {
            const params: Record<string, string> = {};
            if (statusFilter) params.status = statusFilter;
            if (search) params.search = search;
            const response = await digitalHiringApi.list(params);
            setDigitalHirings(response.content);
        } catch (error) {
            console.error(error);
        }
    }, [statusFilter, search]);

    const fetchDigitalHiringStats = useCallback(async () => {
        try {
            const stats = await digitalHiringApi.getStats();
            setDigitalHiringStats(stats);
        } catch {
            // Stats are optional
        }
    }, []);

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            await Promise.all([fetchAdmissions(), fetchTerminations(), fetchDigitalHirings(), fetchDigitalHiringStats()]);
            setLoading(false);
        };
        loadAll();
    }, [fetchAdmissions, fetchTerminations, fetchDigitalHirings, fetchDigitalHiringStats]);

    // Refetch digital hirings when filters change
    useEffect(() => {
        if (activeTab === 'digitalHiring') {
            fetchDigitalHirings();
        }
    }, [activeTab, statusFilter, search, fetchDigitalHirings]);

    // ==================== Filtered / Sorted Data ====================

    const filteredAdmissions = admissions.filter(a =>
        a.candidateName.toLowerCase().includes(search.toLowerCase()) ||
        a.candidateEmail.toLowerCase().includes(search.toLowerCase())
    );

    const filteredDigitalHirings = digitalHirings.filter(dh => {
        const matchSearch = !search ||
            dh.candidateName.toLowerCase().includes(search.toLowerCase()) ||
            dh.candidateEmail.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !statusFilter || dh.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const sortedTerminations = [...terminations]
        .filter(t => {
            if (activeTab === 'terminations') return t.status !== 'ARCHIVED';
            if (activeTab === 'archived') return t.status === 'ARCHIVED';
            return true;
        })
        .sort((a, b) => {
            let valA = a[sortField as keyof TerminationProcess] as any;
            let valB = b[sortField as keyof TerminationProcess] as any;
            if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = (valB || '').toLowerCase(); }
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

    // ==================== Handlers ====================

    const handleArchive = async (id: string, name: string) => {
        try {
            await processesApi.terminations.archive(id);
            toast({ title: 'Sucesso', description: `${name} arquivado com sucesso.` });
            fetchTerminations();
        } catch (error) {
            console.error(error);
            toast({ title: 'Erro', description: 'Falha ao arquivar processo', variant: 'destructive' });
        }
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (sortField !== field) return null;
        return sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 inline" /> : <ChevronDown className="w-3 h-3 ml-1 inline" />;
    };

    // Digital Hiring actions
    const handleOpenNewHiringModal = async () => {
        try {
            const [positionsData, departmentsData] = await Promise.all([
                positionsApi.getActivePositions(),
                employeesApi.getDepartments(),
            ]);
            setPositions(positionsData || []);
            setDepartments(departmentsData || []);
        } catch {
            // Silent - form will work without pre-loaded data
        }
        setNewHiringForm({
            candidateName: '', candidateEmail: '', candidateCpf: '', candidatePhone: '',
            departmentId: '', positionId: '', employmentType: 'CLT', expectedHireDate: '', notes: '',
        });
        setShowNewHiringModal(true);
    };

    const handleCreateDigitalHiring = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHiringForm.candidateName || !newHiringForm.candidateEmail) {
            toast({ title: 'Atenção', description: 'Preencha nome e e-mail do candidato', variant: 'destructive' });
            return;
        }
        try {
            setSubmitting(true);
            await digitalHiringApi.create(newHiringForm);
            toast({ title: 'Sucesso', description: 'Contratação digital iniciada! E-mail enviado ao candidato.' });
            setShowNewHiringModal(false);
            fetchDigitalHirings();
            fetchDigitalHiringStats();
        } catch (error) {
            console.error(error);
            toast({ title: 'Erro', description: 'Falha ao criar contratação digital', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleResendEmail = async (id: string) => {
        try {
            await digitalHiringApi.resendEmail(id);
            toast({ title: 'Sucesso', description: 'E-mail reenviado ao candidato' });
        } catch {
            toast({ title: 'Erro', description: 'Falha ao reenviar e-mail', variant: 'destructive' });
        }
    };

    const handleForceAdvance = async (id: string) => {
        try {
            await digitalHiringApi.forceAdvance(id);
            toast({ title: 'Sucesso', description: 'Processo avançado' });
            fetchDigitalHirings();
        } catch {
            toast({ title: 'Erro', description: 'Falha ao avançar processo', variant: 'destructive' });
        }
    };

    const handleCancelDigitalHiring = async (id: string) => {
        try {
            await digitalHiringApi.cancel(id, 'Cancelado pelo RH');
            toast({ title: 'Processo cancelado', description: 'A contratação digital foi cancelada' });
            fetchDigitalHirings();
            fetchDigitalHiringStats();
        } catch {
            toast({ title: 'Erro', description: 'Falha ao cancelar processo', variant: 'destructive' });
        }
    };

    // ==================== RENDER ====================

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
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
                        variant="outline"
                        onClick={() => router.push('/employees/new')}
                        className="flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Novo Colaborador
                    </Button>
                    <Button
                        onClick={handleOpenNewHiringModal}
                        className="flex items-center gap-2"
                    >
                        <FileDigit className="w-4 h-4" /> Nova Contratação Digital
                    </Button>
                </div>
            </div>

            {/* Stats Cards for Digital Hiring */}
            {digitalHiringStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {[
                        { label: 'Em Admissão', value: digitalHiringStats.admissionPending, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Aguard. Docs', value: digitalHiringStats.documentsPending, color: 'text-orange-600', bg: 'bg-orange-50' },
                        { label: 'Validando', value: digitalHiringStats.documentsValidating, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Aguard. Assinatura', value: digitalHiringStats.signaturePending, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Concluídos', value: digitalHiringStats.completed, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'Total', value: digitalHiringStats.total, color: 'text-gray-600', bg: 'bg-gray-50' },
                    ].map(stat => (
                        <Card key={stat.label} className={stat.bg}>
                            <CardContent className="p-3 text-center">
                                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                                <p className="text-xs text-gray-500">{stat.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => { setActiveTab('admissions'); setSearch(''); setStatusFilter(''); }}
                    className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'admissions'
                        ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Contratações ({admissions.length})
                </button>
                <button
                    onClick={() => { setActiveTab('digitalHiring'); setSearch(''); setStatusFilter(''); }}
                    className={`px-6 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'digitalHiring'
                        ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <FileDigit className="w-4 h-4" />
                    Contratações Digitais ({digitalHirings.length})
                </button>
                <button
                    onClick={() => { setActiveTab('terminations'); setSearch(''); setStatusFilter(''); }}
                    className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'terminations'
                        ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Desligamentos ({terminations.filter(t => t.status !== 'ARCHIVED').length})
                </button>
                <button
                    onClick={() => { setActiveTab('archived'); setSearch(''); setStatusFilter(''); }}
                    className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'archived'
                        ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Arquivados ({terminations.filter(t => t.status === 'ARCHIVED').length})
                </button>
            </div>

            {/* ==================== TAB: Admissions (existing) ==================== */}
            {activeTab === 'admissions' && (
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input placeholder="Buscar candidato..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                                </div>
                                <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
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
                                            [1, 2, 3].map(i => (<tr key={i} className="animate-pulse"><td colSpan={6} className="px-6 py-4 h-16 bg-gray-50/20" /></tr>))
                                        ) : filteredAdmissions.length === 0 ? (
                                            <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Nenhum processo de admissão encontrado.</td></tr>
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
                                                    <td className="px-6 py-4 text-sm text-gray-600">{process.expectedHireDate ? formatDate(process.expectedHireDate) : '-'}</td>
                                                    <td className="px-6 py-4">
                                                        <Badge className={admissionStatusMap[process.status]?.color + " shadow-none"}>
                                                            <span className="flex items-center gap-1">
                                                                {(() => { const Icon = admissionStatusMap[process.status]?.icon; return Icon ? <Icon className="w-3 h-3" /> : null; })()}
                                                                {admissionStatusMap[process.status]?.label}
                                                            </span>
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-[var(--color-primary)] rounded-full transition-all" style={{ width: `${process.progressPercent}%` }} />
                                                            </div>
                                                            <span className="text-xs font-medium text-gray-500">{process.progressPercent}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="bg-white border border-gray-200">
                                                                <DropdownMenuItem onClick={() => router.push(`/processes/admission/${process.id}`)}>Ver Detalhes</DropdownMenuItem>
                                                                <DropdownMenuItem>Reenviar Link</DropdownMenuItem>
                                                                <DropdownMenuItem className="text-red-600">Cancelar Processo</DropdownMenuItem>
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
            )}

            {/* ==================== TAB: Digital Hiring (NEW) ==================== */}
            {activeTab === 'digitalHiring' && (
                <div className="space-y-4">
                    {/* Search & Filters */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input placeholder="Buscar por nome ou e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Todos os status</option>
                                    <option value="ADMISSION_PENDING">Em Admissão</option>
                                    <option value="DOCUMENTS_PENDING">Aguardando Documentos</option>
                                    <option value="DOCUMENTS_VALIDATING">Em Validação</option>
                                    <option value="SIGNATURE_PENDING">Aguardando Assinatura</option>
                                    <option value="COMPLETED">Concluído</option>
                                    <option value="CANCELLED">Cancelado</option>
                                </select>
                                <Button variant="outline" size="icon" onClick={() => { fetchDigitalHirings(); fetchDigitalHiringStats(); }}>
                                    <RefreshCw className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Digital Hiring Table */}
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/50">
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidato</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cargo / Depto</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Progresso</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">IA</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Criado</th>
                                            <th className="px-6 py-4 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {loading ? (
                                            [1, 2, 3].map(i => (<tr key={i} className="animate-pulse"><td colSpan={7} className="px-6 py-4 h-16 bg-gray-50/20" /></tr>))
                                        ) : filteredDigitalHirings.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                                    <FileDigit className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                                    <p className="font-medium">Nenhuma contratação digital encontrada</p>
                                                    <p className="text-sm mt-1">Inicie uma nova contratação digital ou aguarde a aprovação de candidatos no recrutamento.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredDigitalHirings.map(dh => {
                                                const StatusIcon = digitalHiringStatusIcons[dh.status];
                                                return (
                                                    <tr key={dh.id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <p className="font-semibold text-gray-900">{dh.candidateName}</p>
                                                                <p className="text-sm text-gray-500">{dh.candidateEmail}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm">
                                                                <p className="font-medium text-gray-700">{dh.position?.title || 'Cargo não definido'}</p>
                                                                <p className="text-gray-500">{dh.department?.name || 'Depto não definido'}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <Badge className={getDigitalHiringStatusColor(dh.status) + " shadow-none"}>
                                                                <span className="flex items-center gap-1">
                                                                    {StatusIcon && <StatusIcon className="w-3 h-3" />}
                                                                    {getDigitalHiringStatusLabel(dh.status)}
                                                                </span>
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[80px]">
                                                                    <div className="h-full bg-[var(--color-primary)] rounded-full transition-all" style={{ width: `${dh.progressPercent}%` }} />
                                                                </div>
                                                                <span className="text-xs font-medium text-gray-500">{dh.progressPercent}%</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {dh.aiConsistencyScore !== undefined && dh.aiConsistencyScore !== null ? (
                                                                <Badge className={`shadow-none ${dh.aiConsistencyScore >= 80 ? 'bg-green-100 text-green-800' : dh.aiConsistencyScore >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                                    <Sparkles className="w-3 h-3 mr-1" />
                                                                    {dh.aiConsistencyScore}%
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-xs text-gray-400">-</span>
                                                            )}
                                                            {(dh.aiAlerts?.filter(a => !a.resolved)?.length || 0) > 0 && (
                                                                <Badge className="bg-amber-100 text-amber-800 shadow-none ml-1">
                                                                    <AlertCircle className="w-3 h-3 mr-1" />
                                                                    {dh.aiAlerts?.filter(a => !a.resolved).length}
                                                                </Badge>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">
                                                            {formatDate(dh.createdAt)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="bg-white border border-gray-200">
                                                                    <DropdownMenuItem onClick={() => router.push(`/processes/digital-hiring/${dh.id}`)}>
                                                                        <Eye className="w-4 h-4 mr-2" /> Ver Detalhes
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem onClick={() => handleResendEmail(dh.id)}>
                                                                        <Mail className="w-4 h-4 mr-2" /> Reenviar E-mail
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleForceAdvance(dh.id)}>
                                                                        <FastForward className="w-4 h-4 mr-2" /> Forçar Avanço
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem>
                                                                        <MessageSquare className="w-4 h-4 mr-2" /> Solicitar Correção
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem className="text-red-600" onClick={() => handleCancelDigitalHiring(dh.id)}>
                                                                        <XCircle className="w-4 h-4 mr-2" /> Cancelar Processo
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ==================== TAB: Terminations / Archived ==================== */}
            {(activeTab === 'terminations' || activeTab === 'archived') && (
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/50">
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('employeeName')}>
                                                <div className="flex items-center">Colaborador <SortIcon field="employeeName" /></div>
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('terminationType')}>
                                                <div className="flex items-center">Tipo / Aviso <SortIcon field="terminationType" /></div>
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('terminationDate')}>
                                                <div className="flex items-center">Último Dia / Rescisão <SortIcon field="terminationDate" /></div>
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('severancePayAmount')}>
                                                <div className="flex items-center">Financeiro <SortIcon field="severancePayAmount" /></div>
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('completedAt')}>
                                                <div className="flex items-center">Status <SortIcon field="completedAt" /></div>
                                            </th>
                                            <th className="px-6 py-4 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {loading ? (
                                            [1, 2, 3].map(i => (<tr key={i} className="animate-pulse"><td colSpan={6} className="px-6 py-4 h-16 bg-gray-50/20" /></tr>))
                                        ) : sortedTerminations.length === 0 ? (
                                            <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Nenhum processo de desligamento em aberto.</td></tr>
                                        ) : (
                                            sortedTerminations.map(proc => (
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
                                                        <p className="font-medium">{terminationTypeLabels[proc.terminationType] || proc.terminationType}</p>
                                                        <p className="text-xs text-gray-500">{noticePeriodLabels[proc.noticePeriod] || proc.noticePeriod}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        <p>Trab: {formatDate(proc.lastWorkDay)}</p>
                                                        <p className="text-xs">Desc: {formatDate(proc.terminationDate)}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                                                        {proc.severancePayAmount ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proc.severancePayAmount) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {proc.status === 'ARCHIVED' ? (
                                                            <Badge className="bg-gray-100 text-gray-700 shadow-none border-none"><Archive className="w-3 h-3 mr-1" /> Arquivado</Badge>
                                                        ) : !proc.completedAt ? (
                                                            <Badge className="bg-amber-100 text-amber-700 shadow-none border-none"><Clock className="w-3 h-3 mr-1" /> Em Processo</Badge>
                                                        ) : (
                                                            <Badge className="bg-green-100 text-green-700 shadow-none border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Finalizado</Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button variant="ghost" size="sm" onClick={() => router.push(`/employees/${proc.employeeId}?tab=termination`)}>Movimentar</Button>
                                                            {proc.status !== 'ARCHIVED' && (
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="bg-white border border-gray-200">
                                                                        <DropdownMenuItem onClick={() => handleArchive(proc.id, proc.employeeName)}>
                                                                            <Archive className="w-4 h-4 mr-2" /> Arquivar
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            )}
                                                        </div>
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

            {/* ==================== MODAL: New Digital Hiring ==================== */}
            {showNewHiringModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Nova Contratação Digital</h2>
                                <p className="text-sm text-gray-500">O candidato receberá um e-mail com o link do portal</p>
                            </div>
                            <button onClick={() => setShowNewHiringModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateDigitalHiring} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                                    <Input value={newHiringForm.candidateName} onChange={(e) => setNewHiringForm(prev => ({ ...prev, candidateName: e.target.value }))} placeholder="Nome do candidato" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                                    <Input type="email" value={newHiringForm.candidateEmail} onChange={(e) => setNewHiringForm(prev => ({ ...prev, candidateEmail: e.target.value }))} placeholder="email@exemplo.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                                    <Input value={newHiringForm.candidateCpf || ''} onChange={(e) => setNewHiringForm(prev => ({ ...prev, candidateCpf: e.target.value }))} placeholder="000.000.000-00" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                                    <Input value={newHiringForm.candidatePhone || ''} onChange={(e) => setNewHiringForm(prev => ({ ...prev, candidatePhone: e.target.value }))} placeholder="(00) 00000-0000" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contrato</label>
                                    <select value={newHiringForm.employmentType || 'CLT'} onChange={(e) => setNewHiringForm(prev => ({ ...prev, employmentType: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="CLT">CLT</option>
                                        <option value="PJ">PJ</option>
                                        <option value="ESTAGIARIO">Estágio</option>
                                        <option value="TEMPORARIO">Temporário</option>
                                        <option value="APRENDIZ">Aprendiz</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                                    <select value={newHiringForm.departmentId || ''} onChange={(e) => setNewHiringForm(prev => ({ ...prev, departmentId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="">Selecione</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                                    <select value={newHiringForm.positionId || ''} onChange={(e) => setNewHiringForm(prev => ({ ...prev, positionId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="">Selecione</option>
                                        {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Prevista de Início</label>
                                    <Input type="date" value={newHiringForm.expectedHireDate || ''} onChange={(e) => setNewHiringForm(prev => ({ ...prev, expectedHireDate: e.target.value }))} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                                    <textarea
                                        value={newHiringForm.notes || ''}
                                        onChange={(e) => setNewHiringForm(prev => ({ ...prev, notes: e.target.value }))}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Observações internas sobre esta contratação..."
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <Button type="button" variant="outline" onClick={() => setShowNewHiringModal(false)}>Cancelar</Button>
                                <Button type="submit" disabled={submitting} className="flex items-center gap-2">
                                    {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FileDigit className="w-4 h-4" />}
                                    Iniciar Contratação Digital
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
