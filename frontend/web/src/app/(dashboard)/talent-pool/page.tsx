'use client';

import { useState, useEffect, useCallback } from 'react';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import {
    Search,
    Plus,
    Users,
    Briefcase,
    Eye,
    Edit,
    Trash2,
    MoreHorizontal,
    Play,
    Pause,
    XCircle,
    CheckCircle,
    Copy,
    ExternalLink,
    FileText,
    Star,
    Filter,
    TrendingUp,
    UserPlus,
    Clock,
    Award,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
    talentPoolApi,
    JobVacancy,
    TalentCandidate,
    TalentPoolStats,
    CreateVacancyData,
    VacancyStatus,
    CandidateStatus,
    getVacancyStatusLabel,
    getVacancyStatusColor,
    getCandidateStatusLabel,
    getCandidateStatusColor,
    getEmploymentTypeLabel,
    getWorkRegimeLabel,
} from '@/lib/api/talent-pool';
import { positionsApi, Position } from '@/lib/api/positions';
import { employeesApi, Department } from '@/lib/api/employees';
import { useAuthStore } from '@/stores/auth-store';

type Tab = 'vacancies' | 'candidates';

export default function TalentPoolPage() {
    const { confirm } = useConfirm();
    const { toast } = useToast();
    const { user } = useAuthStore();
    const currentTenantId = user?.tenantId;

    // State
    const [activeTab, setActiveTab] = useState<Tab>('vacancies');
    const [vacancies, setVacancies] = useState<JobVacancy[]>([]);
    const [candidates, setCandidates] = useState<TalentCandidate[]>([]);
    const [stats, setStats] = useState<TalentPoolStats | null>(null);
    const [positions, setPositions] = useState<Position[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [vacancyFilter, setVacancyFilter] = useState<string>('');
    const [actionLoading, setActionLoading] = useState(false);

    // Modals
    const [showVacancyModal, setShowVacancyModal] = useState(false);
    const [showCandidateModal, setShowCandidateModal] = useState(false);
    const [showCandidateDetail, setShowCandidateDetail] = useState(false);
    const [editingVacancy, setEditingVacancy] = useState<JobVacancy | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<TalentCandidate | null>(null);

    // Form Data
    const [vacancyForm, setVacancyForm] = useState<CreateVacancyData>({
        positionId: '',
        title: '',
        description: '',
        responsibilities: '',
        requirements: '',
        benefits: '',
        vacancyType: 'EXTERNAL',
        employmentType: 'CLT',
        workRegime: 'PRESENCIAL',
        location: '',
        salaryRangeMin: undefined,
        salaryRangeMax: undefined,
        hideSalary: false,
        maxCandidates: 0,
        deadline: '',
    });

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [vacanciesData, candidatesData, statsData, positionsData, departmentsData] = await Promise.all([
                talentPoolApi.getVacancies(),
                talentPoolApi.getCandidates(),
                talentPoolApi.getStats(),
                positionsApi.getActivePositions(),
                employeesApi.getDepartments(),
            ]);
            setVacancies(vacanciesData || []);
            setCandidates(candidatesData || []);
            setStats(statsData);
            setPositions(positionsData || []);
            setDepartments(departmentsData || []);

            if (!positionsData || positionsData.length === 0) {
                console.warn('⚠️ Nenhuma cargo ativo encontrado para este tenant.');
            }
        } catch {
            toast({
                title: 'Erro',
                description: 'Falha ao carregar dados',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filtros
    const filteredVacancies = vacancies.filter(v => {
        const matchSearch = v.title.toLowerCase().includes(search.toLowerCase()) ||
            v.positionTitle?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !statusFilter || v.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const filteredCandidates = candidates.filter(c => {
        const matchSearch = c.fullName.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !statusFilter || c.status === statusFilter;
        const matchVacancy = !vacancyFilter || c.vacancyId === vacancyFilter;
        return matchSearch && matchStatus && matchVacancy;
    });

    // Handlers - Vagas
    const handleOpenVacancyModal = async (vacancy?: JobVacancy) => {
        // Refresh positions to ensure we have the latest data
        try {
            const latestPositions = await positionsApi.getActivePositions();
            setPositions(latestPositions || []);
        } catch (error) {
            console.error('Falha ao atualizar cargos:', error);
        }

        if (vacancy) {
            setEditingVacancy(vacancy);
            setVacancyForm({
                positionId: vacancy.positionId,
                title: vacancy.title,
                description: vacancy.description || '',
                responsibilities: vacancy.responsibilities || '',
                requirements: vacancy.requirements || '',
                benefits: vacancy.benefits || '',
                vacancyType: vacancy.vacancyType || 'EXTERNAL',
                employmentType: vacancy.employmentType || 'CLT',
                workRegime: vacancy.workRegime || 'PRESENCIAL',
                location: vacancy.location || '',
                salaryRangeMin: vacancy.salaryRangeMin,
                salaryRangeMax: vacancy.salaryRangeMax,
                hideSalary: vacancy.hideSalary || false,
                maxCandidates: vacancy.maxCandidates || 0,
                deadline: vacancy.deadline || '',
            });
        } else {
            setEditingVacancy(null);
            setVacancyForm({
                positionId: '',
                title: '',
                description: '',
                responsibilities: '',
                requirements: '',
                benefits: '',
                vacancyType: 'EXTERNAL',
                employmentType: 'CLT',
                workRegime: 'PRESENCIAL',
                location: '',
                salaryRangeMin: undefined,
                salaryRangeMax: undefined,
                hideSalary: false,
                maxCandidates: 0,
                deadline: '',
            });
        }
        setShowVacancyModal(true);
    };

    const handleCloseVacancyModal = () => {
        setShowVacancyModal(false);
        setEditingVacancy(null);
    };

    const handlePositionChange = (positionId: string) => {
        const position = positions.find(p => p.id === positionId);
        if (position) {
            setVacancyForm({
                ...vacancyForm,
                positionId,
                title: position.title,
                description: position.description || '',
                responsibilities: position.responsibilities || '',
            });
        }
    };

    const handleSubmitVacancy = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validação manual
        if (!vacancyForm.positionId || vacancyForm.positionId.trim() === '') {
            toast({
                title: 'Erro de validação',
                description: 'Por favor, selecione um Cargo para a vaga.',
                variant: 'destructive',
            });
            return;
        }

        if (!vacancyForm.title || vacancyForm.title.trim() === '') {
            toast({
                title: 'Erro de validação',
                description: 'O título da vaga é obrigatório.',
                variant: 'destructive',
            });
            return;
        }

        // Preparar dados para envio - converter strings vazias para undefined
        const dataToSend: CreateVacancyData = {
            positionId: vacancyForm.positionId,
            title: vacancyForm.title.trim(),
            description: vacancyForm.description?.trim() || undefined,
            responsibilities: vacancyForm.responsibilities?.trim() || undefined,
            requirements: vacancyForm.requirements?.trim() || undefined,
            benefits: vacancyForm.benefits?.trim() || undefined,
            vacancyType: vacancyForm.vacancyType,
            employmentType: vacancyForm.employmentType,
            workRegime: vacancyForm.workRegime,
            location: vacancyForm.location?.trim() || undefined,
            salaryRangeMin: vacancyForm.salaryRangeMin,
            salaryRangeMax: vacancyForm.salaryRangeMax,
            hideSalary: vacancyForm.hideSalary,
            maxCandidates: vacancyForm.maxCandidates,
            deadline: vacancyForm.deadline || undefined,
        };

        try {
            setSubmitting(true);
            if (editingVacancy) {
                await talentPoolApi.updateVacancy(editingVacancy.id, dataToSend);
                toast({ title: 'Sucesso', description: 'Vaga atualizada com sucesso' });
            } else {
                await talentPoolApi.createVacancy(dataToSend);
                toast({ title: 'Sucesso', description: 'Vaga criada com sucesso' });
            }
            handleCloseVacancyModal();
            await fetchData();
        } catch (error: unknown) {
            console.error('Erro ao salvar vaga:', error);
            const err = error as Error & { response?: { data?: { message?: string; error?: string } } };
            const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Falha ao salvar vaga';
            toast({
                title: 'Erro',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleVacancyAction = async (vacancyId: string, action: 'publish' | 'pause' | 'reopen' | 'close' | 'delete') => {
        try {
            setActionLoading(true);

            // Para delete, confirma primeiro
            if (action === 'delete') {
                const confirmed = await confirm({
                    title: 'Excluir Vaga',
                    description: 'Tem certeza que deseja excluir esta vaga? A ação não pode ser desfeita.',
                    variant: 'destructive',
                    confirmLabel: 'Excluir'
                });

                if (!confirmed) {
                    setActionLoading(false);
                    return;
                }
            }

            // Executa a ação
            switch (action) {
                case 'publish':
                    await talentPoolApi.publishVacancy(vacancyId);
                    toast({
                        title: 'Vaga Publicada!',
                        description: 'A vaga está agora visível publicamente na internet e candidatos podem se inscrever.'
                    });
                    break;
                case 'pause':
                    await talentPoolApi.pauseVacancy(vacancyId);
                    toast({ title: 'Sucesso', description: 'Vaga pausada' });
                    break;
                case 'reopen':
                    await talentPoolApi.reopenVacancy(vacancyId);
                    toast({ title: 'Sucesso', description: 'Vaga reaberta' });
                    break;
                case 'close':
                    await talentPoolApi.closeVacancy(vacancyId);
                    toast({ title: 'Sucesso', description: 'Vaga fechada' });
                    break;
                case 'delete':
                    await talentPoolApi.deleteVacancy(vacancyId);
                    toast({ title: 'Sucesso', description: 'Vaga excluída' });
                    break;
            }

            await fetchData();
        } catch (error: unknown) {
            console.error('Erro ao executar ação:', error);
            const err = error as Error & { response?: { data?: { message?: string; error?: string } } };
            const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Falha ao executar ação';
            toast({
                title: 'Erro',
                description: errorMessage,
                variant: 'destructive'
            });
        } finally {
            setActionLoading(false);
        }
    };

    const copyPublicLink = (publicCode: string) => {
        const url = `${window.location.origin}/careers/${currentTenantId || 'default'}/${publicCode}`;
        navigator.clipboard.writeText(url);
        toast({ title: 'Link copiado!', description: 'Link da vaga copiado para a área de transferência' });
    };

    // Handlers - Candidatos
    const handleViewCandidate = (candidate: TalentCandidate) => {
        setSelectedCandidate(candidate);
        setShowCandidateDetail(true);
    };

    const handleUpdateCandidateStatus = async (candidateId: string, status: CandidateStatus, notes?: string) => {
        try {
            await talentPoolApi.updateCandidateStatus(candidateId, { status, notes });
            toast({ title: 'Sucesso', description: 'Status atualizado' });
            fetchData();
            if (selectedCandidate?.id === candidateId) {
                const updated = await talentPoolApi.getCandidate(candidateId);
                setSelectedCandidate(updated);
            }
        } catch {
            toast({ title: 'Erro', description: 'Falha ao atualizar status', variant: 'destructive' });
        }
    };

    const handleDeleteCandidate = async (candidateId: string) => {
        if (!await confirm({
            title: 'Excluir Candidato',
            description: 'Tem certeza que deseja excluir este candidato? A ação não pode ser desfeita.',
            variant: 'destructive',
            confirmLabel: 'Excluir'
        })) return;
        try {
            await talentPoolApi.deleteCandidate(candidateId);
            toast({ title: 'Sucesso', description: 'Candidato excluído' });
            fetchData();
            if (selectedCandidate?.id === candidateId) {
                setShowCandidateDetail(false);
                setSelectedCandidate(null);
            }
        } catch {
            toast({ title: 'Erro', description: 'Falha ao excluir', variant: 'destructive' });
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">Banco de Talentos</h1>
                    <p className="text-[var(--color-text-secondary)]">
                        Gerencie vagas e candidatos da empresa
                    </p>
                </div>
                <button
                    onClick={() => handleOpenVacancyModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                    <Plus className="w-4 h-4" />
                    Nova Vaga
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Briefcase className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--color-text-secondary)]">Vagas Abertas</p>
                                <p className="text-2xl font-bold text-[var(--color-text)]">{stats.openVacancies}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--color-text-secondary)]">Total Candidatos</p>
                                <p className="text-2xl font-bold text-[var(--color-text)]">{stats.totalCandidates}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <UserPlus className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--color-text-secondary)]">Novos</p>
                                <p className="text-2xl font-bold text-[var(--color-text)]">{stats.newCandidates}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-indigo-100 rounded-lg">
                                <Clock className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--color-text-secondary)]">Em Processo</p>
                                <p className="text-2xl font-bold text-[var(--color-text)]">{stats.inProcessCandidates}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Award className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--color-text-secondary)]">Contratados</p>
                                <p className="text-2xl font-bold text-[var(--color-text)]">{stats.hiredCandidates}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('vacancies')}
                    className={`pb-3 px-2 text-sm font-medium transition-colors relative ${activeTab === 'vacancies'
                        ? 'text-[var(--color-primary)]'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Vagas
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100">{vacancies.length}</span>
                    </div>
                    {activeTab === 'vacancies' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('candidates')}
                    className={`pb-3 px-2 text-sm font-medium transition-colors relative ${activeTab === 'candidates'
                        ? 'text-[var(--color-primary)]'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Candidatos
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100">{candidates.length}</span>
                    </div>
                    {activeTab === 'candidates' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]" />
                    )}
                </button>
            </div>

            {/* Search and Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
                            <input
                                type="text"
                                placeholder={activeTab === 'vacancies' ? 'Buscar vagas...' : 'Buscar candidatos...'}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                            >
                                <option value="">Todos os Status</option>
                                {activeTab === 'vacancies' ? (
                                    <>
                                        <option value="DRAFT">Rascunho</option>
                                        <option value="OPEN">Aberta</option>
                                        <option value="PAUSED">Pausada</option>
                                        <option value="CLOSED">Fechada</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="NEW">Novo</option>
                                        <option value="SCREENING">Em Triagem</option>
                                        <option value="INTERVIEW">Entrevista</option>
                                        <option value="APPROVED">Aprovado</option>
                                        <option value="REJECTED">Rejeitado</option>
                                        <option value="HIRED">Contratado</option>
                                    </>
                                )}
                            </select>
                            {activeTab === 'candidates' && (
                                <select
                                    value={vacancyFilter}
                                    onChange={(e) => setVacancyFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                                >
                                    <option value="">Todas as Vagas</option>
                                    {vacancies.map(v => (
                                        <option key={v.id} value={v.id}>{v.title}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Content */}
            {loading ? (
                <Card>
                    <CardContent className="p-8">
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
                        </div>
                    </CardContent>
                </Card>
            ) : activeTab === 'vacancies' ? (
                /* Vagas */
                <div className="space-y-4">
                    {filteredVacancies.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center text-[var(--color-text-secondary)]">
                                <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">Nenhuma vaga encontrada</p>
                                <p className="text-sm">Crie uma nova vaga para começar</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredVacancies.map(vacancy => (
                            <Card key={vacancy.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-[var(--color-text)]">
                                                    {vacancy.title}
                                                </h3>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getVacancyStatusColor(vacancy.status)}`}>
                                                    {getVacancyStatusLabel(vacancy.status)}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-text-secondary)] mb-3">
                                                <span className="flex items-center gap-1">
                                                    <Briefcase className="w-4 h-4" />
                                                    {vacancy.positionTitle}
                                                </span>
                                                {vacancy.departmentName && (
                                                    <span>{vacancy.departmentName}</span>
                                                )}
                                                {vacancy.location && (
                                                    <span>{vacancy.location}</span>
                                                )}
                                                {vacancy.employmentType && (
                                                    <span className="px-2 py-0.5 bg-gray-100 rounded">
                                                        {getEmploymentTypeLabel(vacancy.employmentType)}
                                                    </span>
                                                )}
                                                {vacancy.workRegime && (
                                                    <span className="px-2 py-0.5 bg-gray-100 rounded">
                                                        {getWorkRegimeLabel(vacancy.workRegime)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                                                    <Users className="w-4 h-4" />
                                                    {vacancy.candidateCount || 0} candidatos
                                                </span>
                                                {vacancy.publicCode && (
                                                    <button
                                                        onClick={() => copyPublicLink(vacancy.publicCode!)}
                                                        className="flex items-center gap-1 text-[var(--color-primary)] hover:underline"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                        Copiar link
                                                    </button>
                                                )}
                                                {vacancy.deadline && (
                                                    <span className="text-[var(--color-text-secondary)]">
                                                        Prazo: {new Date(vacancy.deadline).toLocaleDateString('pt-BR')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {vacancy.status === 'DRAFT' && (
                                                <button
                                                    onClick={() => handleVacancyAction(vacancy.id, 'publish')}
                                                    disabled={actionLoading}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Play className="w-4 h-4" />
                                                    {actionLoading ? 'Publicando...' : 'Publicar'}
                                                </button>
                                            )}
                                            {vacancy.status === 'OPEN' && (
                                                <button
                                                    onClick={() => handleVacancyAction(vacancy.id, 'pause')}
                                                    disabled={actionLoading}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm disabled:opacity-50"
                                                >
                                                    <Pause className="w-4 h-4" />
                                                    Pausar
                                                </button>
                                            )}
                                            {vacancy.status === 'PAUSED' && (
                                                <button
                                                    onClick={() => handleVacancyAction(vacancy.id, 'reopen')}
                                                    disabled={actionLoading}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                                                >
                                                    <Play className="w-4 h-4" />
                                                    Reabrir
                                                </button>
                                            )}
                                            {(vacancy.status === 'OPEN' || vacancy.status === 'PAUSED') && (
                                                <button
                                                    onClick={() => handleVacancyAction(vacancy.id, 'close')}
                                                    disabled={actionLoading}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Fechar
                                                </button>
                                            )}
                                            <div className="relative group">
                                                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                                    <MoreHorizontal className="w-5 h-5 text-[var(--color-text-secondary)]" />
                                                </button>
                                                <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                                    <button
                                                        onClick={() => handleOpenVacancyModal(vacancy)}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                        Editar
                                                    </button>
                                                    {vacancy.publicCode && (
                                                        <>
                                                            <a
                                                                href={`/careers/${currentTenantId || 'default'}/${vacancy.publicCode}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                                Ver Vaga Pública
                                                            </a>
                                                            <button
                                                                onClick={() => copyPublicLink(vacancy.publicCode!)}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50"
                                                            >
                                                                <Copy className="w-4 h-4" />
                                                                Copiar Link
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleVacancyAction(vacancy.id, 'delete')}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 text-red-600 last:rounded-b-lg"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Excluir
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            ) : (
                /* Candidatos */
                <Card>
                    <CardContent className="p-0">
                        {filteredCandidates.length === 0 ? (
                            <div className="p-12 text-center text-[var(--color-text-secondary)]">
                                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">Nenhum candidato encontrado</p>
                                <p className="text-sm">Os candidatos aparecerão aqui quando se inscreverem nas vagas</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50">
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                                                Candidato
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                                                Vaga
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                                                Data
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                                                Avaliação
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                                                Ações
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredCandidates.map(candidate => (
                                            <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-medium text-[var(--color-text)]">{candidate.fullName}</p>
                                                        <p className="text-sm text-[var(--color-text-secondary)]">{candidate.email}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                                                    {candidate.vacancyTitle || '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCandidateStatusColor(candidate.status)}`}>
                                                        {getCandidateStatusLabel(candidate.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                                                    {candidate.appliedAt ? new Date(candidate.appliedAt).toLocaleDateString('pt-BR') : '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1">
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <Star
                                                                key={star}
                                                                className={`w-4 h-4 ${candidate.rating && star <= candidate.rating
                                                                    ? 'text-yellow-400 fill-yellow-400'
                                                                    : 'text-gray-300'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleViewCandidate(candidate)}
                                                            className="p-2 hover:bg-gray-100 rounded-lg"
                                                            title="Ver detalhes"
                                                        >
                                                            <Eye className="w-4 h-4 text-[var(--color-text-secondary)]" />
                                                        </button>
                                                        {candidate.resumeFilePath && (
                                                            <a
                                                                href={`/api/v1/uploads/${candidate.resumeFilePath}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2 hover:bg-gray-100 rounded-lg"
                                                                title="Ver currículo"
                                                            >
                                                                <FileText className="w-4 h-4 text-[var(--color-text-secondary)]" />
                                                            </a>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteCandidate(candidate.id)}
                                                            className="p-2 hover:bg-gray-100 rounded-lg text-red-600"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Modal - Nova/Editar Vaga */}
            {showVacancyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-[var(--color-text)]">
                                {editingVacancy ? 'Editar Vaga' : 'Nova Vaga'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmitVacancy} className="p-6 space-y-6" noValidate>
                            {/* Cargo */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                        Cargo *
                                    </label>
                                    <select
                                        value={vacancyForm.positionId}
                                        onChange={(e) => handlePositionChange(e.target.value)}
                                        required
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                                    >
                                        <option value="">{positions.length === 0 ? 'Nenhum cargo cadastrado' : 'Selecione um cargo...'}</option>
                                        {positions.map(p => (
                                            <option key={p.id} value={p.id}>{p.title} ({p.code})</option>
                                        ))}
                                    </select>
                                    {positions.length === 0 && (
                                        <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                                            Crie cargos primeiro na seção de <a href="/positions" className="underline font-medium">Cargos</a>.
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                        Título da Vaga *
                                    </label>
                                    <input
                                        type="text"
                                        value={vacancyForm.title}
                                        onChange={(e) => setVacancyForm({ ...vacancyForm, title: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                    />
                                </div>
                            </div>

                            {/* Tipo e Regime */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                        Tipo da Vaga
                                    </label>
                                    <select
                                        value={vacancyForm.vacancyType}
                                        onChange={(e) => setVacancyForm({ ...vacancyForm, vacancyType: e.target.value as 'INTERNAL' | 'EXTERNAL' | 'BOTH' })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                                    >
                                        <option value="EXTERNAL">Externa</option>
                                        <option value="INTERNAL">Interna</option>
                                        <option value="BOTH">Ambas</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                        Tipo de Contratação
                                    </label>
                                    <select
                                        value={vacancyForm.employmentType}
                                        onChange={(e) => setVacancyForm({ ...vacancyForm, employmentType: e.target.value as 'CLT' | 'PJ' | 'ESTAGIARIO' | 'TEMPORARIO' | 'APRENDIZ' | 'AUTONOMO' | 'TERCEIRIZADO' })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                                    >
                                        <option value="CLT">CLT</option>
                                        <option value="PJ">PJ</option>
                                        <option value="ESTAGIARIO">Estágio</option>
                                        <option value="TEMPORARIO">Temporário</option>
                                        <option value="APRENDIZ">Aprendiz</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                        Regime de Trabalho
                                    </label>
                                    <select
                                        value={vacancyForm.workRegime}
                                        onChange={(e) => setVacancyForm({ ...vacancyForm, workRegime: e.target.value as 'PRESENCIAL' | 'REMOTO' | 'HIBRIDO' })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                                    >
                                        <option value="PRESENCIAL">Presencial</option>
                                        <option value="REMOTO">Remoto</option>
                                        <option value="HIBRIDO">Híbrido</option>
                                    </select>
                                </div>
                            </div>

                            {/* Localização e Prazo */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                        Localização
                                    </label>
                                    <input
                                        type="text"
                                        value={vacancyForm.location}
                                        onChange={(e) => setVacancyForm({ ...vacancyForm, location: e.target.value })}
                                        placeholder="Ex: São Paulo, SP"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                        Data Limite
                                    </label>
                                    <input
                                        type="date"
                                        value={vacancyForm.deadline}
                                        onChange={(e) => setVacancyForm({ ...vacancyForm, deadline: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                    />
                                </div>
                            </div>

                            {/* Salário */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                        Salário Mínimo
                                    </label>
                                    <input
                                        type="number"
                                        value={vacancyForm.salaryRangeMin || ''}
                                        onChange={(e) => setVacancyForm({ ...vacancyForm, salaryRangeMin: e.target.value ? Number(e.target.value) : undefined })}
                                        placeholder="R$ 0,00"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                        Salário Máximo
                                    </label>
                                    <input
                                        type="number"
                                        value={vacancyForm.salaryRangeMax || ''}
                                        onChange={(e) => setVacancyForm({ ...vacancyForm, salaryRangeMax: e.target.value ? Number(e.target.value) : undefined })}
                                        placeholder="R$ 0,00"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={vacancyForm.hideSalary}
                                            onChange={(e) => setVacancyForm({ ...vacancyForm, hideSalary: e.target.checked })}
                                            className="w-4 h-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                        />
                                        <span className="text-sm text-[var(--color-text)]">Ocultar salário na vaga pública</span>
                                    </label>
                                </div>
                            </div>

                            {/* Descrição */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Descrição da Vaga
                                </label>
                                <textarea
                                    value={vacancyForm.description}
                                    onChange={(e) => setVacancyForm({ ...vacancyForm, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                />
                            </div>

                            {/* Responsabilidades */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Responsabilidades
                                </label>
                                <textarea
                                    value={vacancyForm.responsibilities}
                                    onChange={(e) => setVacancyForm({ ...vacancyForm, responsibilities: e.target.value })}
                                    rows={3}
                                    placeholder="Liste as principais responsabilidades..."
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                />
                            </div>

                            {/* Requisitos */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Requisitos
                                </label>
                                <textarea
                                    value={vacancyForm.requirements}
                                    onChange={(e) => setVacancyForm({ ...vacancyForm, requirements: e.target.value })}
                                    rows={3}
                                    placeholder="Liste os requisitos necessários..."
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                />
                            </div>

                            {/* Benefícios */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Benefícios
                                </label>
                                <textarea
                                    value={vacancyForm.benefits}
                                    onChange={(e) => setVacancyForm({ ...vacancyForm, benefits: e.target.value })}
                                    rows={3}
                                    placeholder="Liste os benefícios oferecidos..."
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                />
                            </div>

                            {/* Botões */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={handleCloseVacancyModal}
                                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white text-[var(--color-text)]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {submitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                                    {editingVacancy ? 'Atualizar' : 'Criar Vaga'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal - Detalhes do Candidato */}
            {showCandidateDetail && selectedCandidate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                                    Detalhes do Candidato
                                </h2>
                                <button
                                    onClick={() => setShowCandidateDetail(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Info básica */}
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-2xl font-semibold">
                                    {selectedCandidate.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-[var(--color-text)]">{selectedCandidate.fullName}</h3>
                                    <p className="text-[var(--color-text-secondary)]">{selectedCandidate.email}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCandidateStatusColor(selectedCandidate.status)}`}>
                                            {getCandidateStatusLabel(selectedCandidate.status)}
                                        </span>
                                        <span className="text-sm text-[var(--color-text-secondary)]">
                                            Vaga: {selectedCandidate.vacancyTitle}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Atualizar Status */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                                    Atualizar Status
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {(['NEW', 'SCREENING', 'INTERVIEW', 'APPROVED', 'REJECTED', 'HIRED', 'WITHDRAWN'] as CandidateStatus[]).map(status => (
                                        <button
                                            key={status}
                                            onClick={() => handleUpdateCandidateStatus(selectedCandidate.id, status)}
                                            disabled={selectedCandidate.status === status}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${selectedCandidate.status === status
                                                ? `${getCandidateStatusColor(status)} cursor-default`
                                                : 'bg-white border border-gray-200 hover:bg-gray-100'
                                                }`}
                                        >
                                            {getCandidateStatusLabel(status)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Contato */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Telefone</label>
                                    <p className="text-[var(--color-text)]">{selectedCandidate.phone || selectedCandidate.mobile || '-'}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Localização</label>
                                    <p className="text-[var(--color-text)]">
                                        {selectedCandidate.city && selectedCandidate.state
                                            ? `${selectedCandidate.city}, ${selectedCandidate.state}`
                                            : '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Links */}
                            <div className="flex gap-4">
                                {selectedCandidate.linkedinUrl && (
                                    <a
                                        href={selectedCandidate.linkedinUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-blue-600 hover:underline"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        LinkedIn
                                    </a>
                                )}
                                {selectedCandidate.portfolioUrl && (
                                    <a
                                        href={selectedCandidate.portfolioUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-blue-600 hover:underline"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Portfólio
                                    </a>
                                )}
                            </div>

                            {/* Dados extraídos do currículo */}
                            {(selectedCandidate.skills || selectedCandidate.education || selectedCandidate.experienceSummary) && (
                                <div className="space-y-4">
                                    <h4 className="font-medium text-[var(--color-text)] flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        Dados do Currículo
                                    </h4>
                                    {selectedCandidate.skills && (
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Habilidades</label>
                                            <p className="text-sm text-[var(--color-text)]">{selectedCandidate.skills}</p>
                                        </div>
                                    )}
                                    {selectedCandidate.education && (
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Formação</label>
                                            <p className="text-sm text-[var(--color-text)]">{selectedCandidate.education}</p>
                                        </div>
                                    )}
                                    {selectedCandidate.experienceSummary && (
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Experiência</label>
                                            <p className="text-sm text-[var(--color-text)]">{selectedCandidate.experienceSummary}</p>
                                        </div>
                                    )}
                                    {selectedCandidate.certifications && (
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Certificações</label>
                                            <p className="text-sm text-[var(--color-text)]">{selectedCandidate.certifications}</p>
                                        </div>
                                    )}
                                    {selectedCandidate.languages && (
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Idiomas</label>
                                            <p className="text-sm text-[var(--color-text)]">{selectedCandidate.languages}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Notas */}
                            {selectedCandidate.notes && (
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Notas</label>
                                    <p className="text-sm text-[var(--color-text)]">{selectedCandidate.notes}</p>
                                </div>
                            )}

                            {/* Datas */}
                            <div className="grid grid-cols-2 gap-4 text-sm text-[var(--color-text-secondary)]">
                                <div>
                                    Candidatura: {selectedCandidate.appliedAt ? new Date(selectedCandidate.appliedAt).toLocaleString('pt-BR') : '-'}
                                </div>
                                <div>
                                    Última atualização: {selectedCandidate.lastStatusChange ? new Date(selectedCandidate.lastStatusChange).toLocaleString('pt-BR') : '-'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
