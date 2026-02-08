'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ArrowLeft,
    Send,
    Users,
    TrendingUp,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
    Search,
    Filter,
    Trash2,
    Plus,
    Target,
    Calendar,
    Briefcase,
    BookOpen,
    GraduationCap,
    MoreHorizontal,
    ChevronRight,
    BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { pdisApi, PDI, PDIAction, PDIActionType } from '@/lib/api/performance';
import { employeesApi, Employee } from '@/lib/api/employees';
import { useAuthStore } from '@/stores/auth-store';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { cn } from '@/lib/utils';


const ACTION_TYPES: { value: PDIActionType; label: string; icon: React.ReactNode }[] = [
    { value: 'TRAINING', label: 'Treinamento', icon: <BookOpen className="h-4 w-4" /> },
    { value: 'COURSE', label: 'Curso', icon: <GraduationCap className="h-4 w-4" /> },
    { value: 'CERTIFICATION', label: 'Certificação', icon: <Target className="h-4 w-4" /> },
    { value: 'MENTORING', label: 'Mentoria', icon: <Users className="h-4 w-4" /> },
    { value: 'COACHING', label: 'Coaching', icon: <Users className="h-4 w-4" /> },
    { value: 'PROJECT', label: 'Projeto', icon: <Briefcase className="h-4 w-4" /> },
    { value: 'READING', label: 'Leitura', icon: <BookOpen className="h-4 w-4" /> },
    { value: 'WORKSHOP', label: 'Workshop', icon: <GraduationCap className="h-4 w-4" /> },
    { value: 'OTHER', label: 'Outro', icon: <Target className="h-4 w-4" /> },
];

const MOCK_EMPLOYEES: Employee[] = [
    {
        id: 'emp-001', registrationNumber: '001', cpf: '000.000.000-01',
        fullName: 'Ana Silva', email: 'ana.silva@empresa.com',
        hireDate: '2023-01-15', employmentType: 'CLT', status: 'ACTIVE',
        department: { id: 'dep-1', name: 'Tecnologia' },
        position: { id: 'pos-1', title: 'Desenvolvedora Senior' },
        createdAt: '2023-01-15', updatedAt: '2024-01-01',
    },
    {
        id: 'emp-002', registrationNumber: '002', cpf: '000.000.000-02',
        fullName: 'Carlos Santos', email: 'carlos.santos@empresa.com',
        hireDate: '2023-03-01', employmentType: 'CLT', status: 'ACTIVE',
        department: { id: 'dep-1', name: 'Tecnologia' },
        position: { id: 'pos-2', title: 'Tech Lead' },
        createdAt: '2023-03-01', updatedAt: '2024-01-01',
    },
];

function StatCard({ title, value, icon, colorClass, desc }: any) {
    return (
        <Card className="border shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden relative group">
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-current", colorClass.split(' ')[0])}></div>
            <CardHeader className="pb-2 relative z-10">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        {title}
                    </CardTitle>
                    <div className={cn("p-2 rounded-lg transition-transform duration-300 group-hover:scale-110", colorClass)}>
                        {icon}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                    {value}
                </div>
                {desc && (
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                        {desc}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

export default function ManagePDIPage() {
    const { toast } = useToast();
    const { user } = useAuthStore();
    const { confirm } = useConfirm();
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [pdis, setPdis] = useState<PDI[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sendDialogOpen, setSendDialogOpen] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [objectives, setObjectives] = useState('');
    const [focusAreas, setFocusAreas] = useState('');
    const [endDate, setEndDate] = useState('');
    const [actions, setActions] = useState<PDIAction[]>([]);
    const [actionTitle, setActionTitle] = useState('');
    const [actionType, setActionType] = useState<PDIActionType>('TRAINING');
    const [sending, setSending] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            // Load employees with fallback
            let loadedEmployees: Employee[] = [];
            try {
                const employeesRes = await employeesApi.list({ status: 'ACTIVE', size: 1000 });
                loadedEmployees = employeesRes?.content || [];
            } catch (err) {
                console.warn('Failed to load employees from API:', err);
            }
            if (loadedEmployees.length === 0) {
                loadedEmployees = MOCK_EMPLOYEES;
            }
            setEmployees(loadedEmployees);

            // Load PDIs
            try {
                const pdisRes = await pdisApi.list(0, 100);
                setPdis(pdisRes?.content || []);
            } catch (err) {
                console.warn('Failed to load PDIs from API:', err);
                setPdis([]);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            setEmployees(MOCK_EMPLOYEES);
            toast({
                title: 'Erro de Conexão',
                description: 'Não foi possível carregar os dados. Verifique sua conexão.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSend = async () => {
        if (selectedEmployees.length === 0) {
            toast({
                title: 'Seleção Necessária',
                description: 'Por favor, selecione ao menos um colaborador.',
                variant: 'destructive',
            });
            return;
        }

        if (!title || !endDate) {
            toast({
                title: 'Campos Obrigatórios',
                description: 'Preencha o título e a data limite.',
                variant: 'destructive',
            });
            return;
        }

        try {
            setSending(true);

            const promises = selectedEmployees.map(async (employeeId) => {
                const employee = employees.find((e) => e.id === employeeId);
                if (!employee) return;

                const pdiPayload = {
                    employeeId,
                    employeeName: employee.fullName,
                    managerId: employee.manager?.id,
                    managerName: employee.manager?.name || employee.manager?.fullName,
                    title,
                    description,
                    objectives,
                    focusAreas,
                    startDate: new Date().toISOString().split('T')[0],
                    endDate,
                    status: 'ACTIVE' as const,
                    actions: actions.map(a => ({
                        ...a,
                        status: 'PENDING' as const
                    }))
                };

                return pdisApi.create(pdiPayload);
            });

            await Promise.all(promises);

            toast({
                title: 'PDI Enviado!',
                description: `O PDI foi atribuído com sucesso para ${selectedEmployees.length} colaborador(es).`,
            });

            // Reset form
            setSelectedEmployees([]);
            setTitle('');
            setDescription('');
            setObjectives('');
            setFocusAreas('');
            setEndDate('');
            setActions([]);
            setSendDialogOpen(false);
            loadData();
        } catch (error) {
            console.error('Failed to send PDI:', error);
            toast({
                title: 'Erro no Envio',
                description: 'Ocorreu um erro ao enviar o PDI. Tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setSending(false);
        }
    };

    const handleDeletePDI = async (id: string, title?: string) => {
        const confirmed = await confirm({
            title: 'Excluir PDI Permanentemente?',
            description: `Você está prestes a excluir o PDI "${title || ''}". Esta ação não poderá ser desfeita.`,
            variant: 'destructive',
            confirmLabel: 'Sim, Excluir',
            cancelLabel: 'Cancelar'
        });

        if (!confirmed) return;

        try {
            await pdisApi.delete(id);
            toast({
                title: 'PDI Excluído',
                description: 'O PDI foi removido do sistema.',
            });
            loadData();
        } catch (error) {
            console.error('Failed to delete PDI:', error);
            toast({
                title: 'Erro ao Excluir',
                description: 'Não foi possível excluir o PDI.',
                variant: 'destructive',
            });
        }
    };

    const filteredEmployees = employees.filter((emp) =>
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleEmployee = (employeeId: string) => {
        setSelectedEmployees((prev) =>
            prev.includes(employeeId)
                ? prev.filter((id) => id !== employeeId)
                : [...prev, employeeId]
        );
    };

    const selectAll = () => {
        setSelectedEmployees(filteredEmployees.map((e) => e.id));
    };

    const clearSelection = () => {
        setSelectedEmployees([]);
    };

    const filteredPdis = pdis.filter(pdi => {
        if (statusFilter !== 'ALL' && pdi.status !== statusFilter) return false;
        if (searchTerm && !pdi.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !pdi.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) return false;

        return true;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                <p className="text-muted-foreground animate-pulse">Carregando PDIs...</p>
            </div>
        );
    }

    const stats = {
        total: pdis.length,
        active: pdis.filter((p) => p.status === 'ACTIVE').length,
        pending: pdis.filter((p) => p.status === 'PENDING_APPROVAL').length,
        completed: pdis.filter((p) => p.status === 'COMPLETED').length,
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/performance">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                            <ArrowLeft className="h-5 w-5 text-slate-500" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Gerenciar PDIs</h1>
                        <p className="text-slate-500 mt-1">
                            Acompanhe e gerencie os planos de desenvolvimento da sua equipe
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => setSendDialogOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 font-bold px-6 h-11"
                >
                    <Send className="h-4 w-4 mr-2" />
                    Novo Envio em Massa
                </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="Total de PDIs"
                    value={stats.total}
                    icon={<BarChart3 className="w-6 h-6 text-indigo-600" />}
                    colorClass="bg-indigo-50 text-indigo-700 border-indigo-100"
                    desc="Registrados no sistema"
                />
                <StatCard
                    title="Ativos"
                    value={stats.active}
                    icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
                    colorClass="bg-emerald-50 text-emerald-700 border-emerald-100"
                    desc="Em desenvolvimento"
                />
                <StatCard
                    title="Aguardando"
                    value={stats.pending}
                    icon={<Clock className="w-6 h-6 text-amber-600" />}
                    colorClass="bg-amber-50 text-amber-700 border-amber-100"
                    desc="Pendente aprovação"
                />
                <StatCard
                    title="Concluídos"
                    value={stats.completed}
                    icon={<CheckCircle2 className="w-6 h-6 text-blue-600" />}
                    colorClass="bg-blue-50 text-blue-700 border-blue-100"
                    desc="Objetivos alcançados"
                />
            </div>

            {/* Main Content Area */}
            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <CardTitle className="text-lg font-bold">PDIs Enviados</CardTitle>
                        </div>
                        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Buscar PDI..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-white border-slate-200"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-[180px] bg-white border-slate-200">
                                    <Filter className="w-4 h-4 mr-2 text-slate-500" />
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos os Status</SelectItem>
                                    <SelectItem value="DRAFT">Rascunho</SelectItem>
                                    <SelectItem value="PENDING_APPROVAL">Aguardando</SelectItem>
                                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                                    <SelectItem value="COMPLETED">Concluído</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredPdis.length === 0 ? (
                        <div className="text-center py-16 flex flex-col items-center">
                            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Target className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">Nenhum PDI encontrado</h3>
                            <p className="text-slate-500 max-w-sm mt-1">
                                Não encontramos nenhum Plano de Desenvolvimento com os filtros atuais.
                            </p>
                            <Button
                                variant="outline"
                                className="mt-6"
                                onClick={() => {
                                    setStatusFilter('ALL');
                                    setSearchTerm('');
                                }}
                            >
                                Limpar Filtros
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filteredPdis.map((pdi) => (
                                <Link key={pdi.id} href={`/performance/pdi/${pdi.id}`}>
                                    <div className="group relative flex flex-col md:flex-row md:items-center justify-between p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-300 cursor-pointer">

                                        {/* Status Line */}
                                        <div className={cn(
                                            "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-colors",
                                            pdi.status === 'ACTIVE' ? "bg-emerald-500" :
                                                pdi.status === 'COMPLETED' ? "bg-blue-500" :
                                                    pdi.status === 'PENDING_APPROVAL' ? "bg-amber-500" : "bg-slate-300"
                                        )}></div>

                                        <div className="flex items-center gap-4 w-full md:w-1/3 pl-3">
                                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm ring-2 ring-indigo-50">
                                                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">
                                                    {pdi.employeeName?.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors text-base">
                                                    {pdi.title}
                                                </p>
                                                <p className="text-sm text-slate-500 flex items-center gap-1">
                                                    {pdi.employeeName}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 md:mt-0 w-full md:w-1/3 flex flex-col justify-center px-0 md:px-8">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progresso do Plano</span>
                                                <span className="text-sm font-black text-slate-900 dark:text-white">{pdi.overallProgress}%</span>
                                            </div>
                                            <Progress value={pdi.overallProgress} className="h-2 bg-slate-100 dark:bg-slate-800"
                                                indicatorClassName={cn(
                                                    "transition-all duration-1000",
                                                    pdi.overallProgress === 100 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-gradient-to-r from-indigo-600 to-blue-500"
                                                )}
                                            />
                                        </div>

                                        <div className="mt-4 md:mt-0 flex items-center justify-between md:justify-end gap-3 w-full md:w-1/3">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "px-3 py-1 font-bold text-xs capitalize border",
                                                    pdi.status === 'ACTIVE' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                                                    pdi.status === 'COMPLETED' && "bg-blue-50 text-blue-700 border-blue-200",
                                                    pdi.status === 'PENDING_APPROVAL' && "bg-amber-50 text-amber-700 border-amber-200",
                                                    pdi.status === 'DRAFT' && "bg-slate-50 text-slate-700 border-slate-200"
                                                )}
                                            >
                                                {pdi.status === 'ACTIVE' ? 'Ativo' :
                                                    pdi.status === 'COMPLETED' ? 'Concluído' :
                                                        pdi.status === 'PENDING_APPROVAL' ? 'Aguardando' : 'Rascunho'}
                                            </Badge>

                                            <div className="flex items-center gap-1 pl-2 border-l border-slate-100">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleDeletePDI(pdi.id, pdi.title);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-colors group-hover:translate-x-1 duration-300" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Send PDI Dialog */}
            <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2 font-bold">
                            <Send className="w-5 h-5 text-indigo-600" />
                            Enviar PDI em Massa
                        </DialogTitle>
                        <DialogDescription>
                            Configure e envie Planos de Desenvolvimento Individual para múltiplos colaboradores.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-4">
                        {/* Left: Employee Selection */}
                        <div className="lg:col-span-1 space-y-4 border-r pr-0 lg:pr-6">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold text-slate-700">
                                    Colaboradores ({selectedEmployees.length})
                                </Label>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" onClick={selectAll} className="h-6 text-xs text-indigo-600 px-2">
                                        Todos
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={clearSelection} className="h-6 text-xs text-slate-500 px-2">
                                        Limpar
                                    </Button>
                                </div>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-9 text-sm"
                                />
                            </div>

                            <div className="border rounded-xl h-[400px] overflow-y-auto bg-slate-50/50 p-2 space-y-1 custom-scrollbar">
                                {filteredEmployees.map((employee) => (
                                    <div
                                        key={employee.id}
                                        onClick={() => toggleEmployee(employee.id)}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border",
                                            selectedEmployees.includes(employee.id)
                                                ? "bg-indigo-50 border-indigo-200 shadow-sm"
                                                : "bg-white border-transparent hover:border-slate-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded border flex items-center justify-center transition-colors shadow-sm",
                                            selectedEmployees.includes(employee.id)
                                                ? "bg-indigo-600 border-indigo-600"
                                                : "border-slate-300 bg-white"
                                        )}>
                                            {selectedEmployees.includes(employee.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-semibold text-sm truncate text-slate-800">{employee.fullName}</p>
                                            <p className="text-xs text-slate-500 truncate">
                                                {employee.position?.title || 'Sem cargo'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: PDI Form */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label className="font-semibold text-slate-700">Título do PDI <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Ex: Programa de Liderança 2024"
                                        className="font-medium h-10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-semibold text-slate-700">Áreas de Foco</Label>
                                    <Input
                                        value={focusAreas}
                                        onChange={(e) => setFocusAreas(e.target.value)}
                                        placeholder="Ex: Gestão, Comunicação"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-semibold text-slate-700">Data Limite <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label className="font-semibold text-slate-700">Descrição</Label>
                                    <Textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Contexto e propósito do PDI..."
                                        rows={2}
                                        className="resize-none"
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label className="font-semibold text-slate-700">Objetivos</Label>
                                    <Textarea
                                        value={objectives}
                                        onChange={(e) => setObjectives(e.target.value)}
                                        placeholder="Resultados esperados..."
                                        rows={2}
                                        className="resize-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 pt-6 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <Label className="font-bold flex items-center gap-2 text-base text-slate-800">
                                        <Target className="w-5 h-5 text-indigo-600" />
                                        Ações de Desenvolvimento
                                    </Label>
                                    <Badge variant="secondary" className="px-3">{actions.length} ações</Badge>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex gap-3 items-end mb-3">
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-xs font-semibold text-slate-500">Ação</Label>
                                            <Input
                                                value={actionTitle}
                                                onChange={(e) => setActionTitle(e.target.value)}
                                                placeholder="Ex: Curso de ..."
                                                className="h-9 bg-white"
                                            />
                                        </div>
                                        <div className="w-[140px] space-y-1">
                                            <Label className="text-xs font-semibold text-slate-500">Tipo</Label>
                                            <Select value={actionType} onValueChange={(v) => setActionType(v as PDIActionType)}>
                                                <SelectTrigger className="h-9 bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ACTION_TYPES.map(t => (
                                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                if (!actionTitle) return;
                                                setActions([...actions, {
                                                    title: actionTitle,
                                                    actionType,
                                                    status: 'PENDING',
                                                    dueDate: endDate
                                                } as PDIAction]);
                                                setActionTitle('');
                                            }}
                                            className="h-9 w-9 p-0 bg-slate-900 text-white hover:bg-slate-800"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {actions.length > 0 && (
                                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                                            {actions.map((action, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-slate-200 text-sm shadow-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                            {ACTION_TYPES.find(t => t.value === action.actionType)?.icon}
                                                        </div>
                                                        <span className="font-medium text-slate-700">{action.title}</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-slate-400 hover:text-red-500"
                                                        onClick={() => setActions(actions.filter((_, i) => i !== index))}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="py-4 border-t px-6 bg-slate-50 -mx-6 -mb-6">
                        <Button variant="ghost" onClick={() => setSendDialogOpen(false)} className="hover:bg-slate-200">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSend}
                            disabled={sending || selectedEmployees.length === 0 || !title || !endDate}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-10 shadow-lg shadow-indigo-200"
                        >
                            {sending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Confirmar Envio ({selectedEmployees.length})
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

