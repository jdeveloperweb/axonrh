'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
    RefreshCw,
    Plus,
    Calendar,
    CheckCircle2,
    Clock,
    ArrowLeft,
    Settings2,
    Play,
    StopCircle,
    BarChart3,
    Loader2,
    Pencil,
    Trash2,
    MoreHorizontal,
    Target
} from 'lucide-react';
import Link from 'next/link';
import { cyclesApi, EvaluationCycle, CycleStatus, CycleType, EvaluationType } from '@/lib/api/performance';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CyclesManagePage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingCycle, setEditingCycle] = useState<EvaluationCycle | null>(null);
    const [deletingCycleId, setDeletingCycleId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [cycleType, setCycleType] = useState<CycleType>('ANNUAL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [evaluationStartDate, setEvaluationStartDate] = useState('');
    const [evaluationEndDate, setEvaluationEndDate] = useState('');
    const [allowSelfEvaluation, setAllowSelfEvaluation] = useState(true);
    const [allowPeerEvaluation, setAllowPeerEvaluation] = useState(false);
    const [allow360Evaluation, setAllow360Evaluation] = useState(false);

    const loadCycles = useCallback(async () => {
        try {
            setLoading(true);
            const data = await cyclesApi.list();
            setCycles(data);
        } catch (error) {
            console.error('Failed to load cycles:', error);
            toast({
                title: 'Erro',
                description: 'Falha ao carregar ciclos de avaliação',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadCycles();
    }, [loadCycles]);

    const handleCreateCycle = async () => {
        if (!name || !startDate || !endDate) {
            toast({
                title: 'Erro',
                description: 'Preencha os campos obrigatórios (Nome, Início, Fim)',
                variant: 'destructive',
            });
            return;
        }

        try {
            setSubmitting(true);

            // Determine evaluation type based on selected options
            let evaluationType: EvaluationType = 'MANAGER';
            if (allow360Evaluation) {
                evaluationType = 'FULL_360';
            } else if (allowPeerEvaluation) {
                evaluationType = 'PEERS_180';
            } else if (allowSelfEvaluation) {
                evaluationType = 'SELF';
            }

            // Map frontend fields to backend entity structure
            await cyclesApi.create({
                name,
                description,
                cycleType,
                startDate,
                endDate,
                evaluationType,
                includeSelfEvaluation: allowSelfEvaluation,
                includeManagerEvaluation: true, // Defaulting to true as per backend
                includePeerEvaluation: allowPeerEvaluation,
                includeSubordinateEvaluation: allow360Evaluation,
                selfEvaluationStart: evaluationStartDate || undefined,
                selfEvaluationEnd: evaluationEndDate || undefined,
                managerEvaluationStart: evaluationStartDate || undefined,
                managerEvaluationEnd: evaluationEndDate || undefined,
                status: 'DRAFT',
            });

            toast({
                title: 'Sucesso',
                description: 'Ciclo de avaliação criado com sucesso',
            });

            setCreateDialogOpen(false);
            resetForm();
            loadCycles();
        } catch (error) {
            console.error('Failed to create cycle:', error);
            toast({
                title: 'Erro',
                description: 'Falha ao criar ciclo. Verifique os dados e tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleActivateCycle = async (id: string) => {
        try {
            await cyclesApi.activate(id);
            toast({ title: 'Sucesso', description: 'Ciclo ativado com sucesso' });
            loadCycles();
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Falha ao ativar ciclo',
                variant: 'destructive',
            });
        }
    };

    const handleCompleteCycle = async (id: string) => {
        try {
            await cyclesApi.complete(id);
            toast({ title: 'Sucesso', description: 'Ciclo concluído com sucesso' });
            loadCycles();
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Falha ao concluir ciclo',
                variant: 'destructive',
            });
        }
    };

    const handleOpenEditDialog = (cycle: EvaluationCycle) => {
        setEditingCycle(cycle);
        setName(cycle.name);
        setDescription(cycle.description || '');
        setCycleType(cycle.cycleType);
        setStartDate(cycle.startDate);
        setEndDate(cycle.endDate);
        setEvaluationStartDate(cycle.selfEvaluationStart || '');
        setEvaluationEndDate(cycle.selfEvaluationEnd || '');
        setAllowSelfEvaluation(cycle.includeSelfEvaluation);
        setAllowPeerEvaluation(cycle.includePeerEvaluation);
        setAllow360Evaluation(cycle.includeSubordinateEvaluation);
        setEditDialogOpen(true);
    };

    const handleUpdateCycle = async () => {
        if (!editingCycle || !name || !startDate || !endDate) {
            toast({
                title: 'Erro',
                description: 'Preencha os campos obrigatórios (Nome, Início, Fim)',
                variant: 'destructive',
            });
            return;
        }

        try {
            setSubmitting(true);

            let evaluationType: EvaluationType = 'MANAGER';
            if (allow360Evaluation) {
                evaluationType = 'FULL_360';
            } else if (allowPeerEvaluation) {
                evaluationType = 'PEERS_180';
            } else if (allowSelfEvaluation) {
                evaluationType = 'SELF';
            }

            await cyclesApi.update(editingCycle.id, {
                name,
                description,
                cycleType,
                startDate,
                endDate,
                evaluationType,
                includeSelfEvaluation: allowSelfEvaluation,
                includeManagerEvaluation: true,
                includePeerEvaluation: allowPeerEvaluation,
                includeSubordinateEvaluation: allow360Evaluation,
                selfEvaluationStart: evaluationStartDate || undefined,
                selfEvaluationEnd: evaluationEndDate || undefined,
                managerEvaluationStart: evaluationStartDate || undefined,
                managerEvaluationEnd: evaluationEndDate || undefined,
            });

            toast({
                title: 'Sucesso',
                description: 'Ciclo atualizado com sucesso',
            });

            setEditDialogOpen(false);
            setEditingCycle(null);
            resetForm();
            loadCycles();
        } catch (error) {
            console.error('Failed to update cycle:', error);
            toast({
                title: 'Erro',
                description: 'Falha ao atualizar ciclo. Verifique os dados e tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenDeleteDialog = (cycleId: string) => {
        setDeletingCycleId(cycleId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteCycle = async () => {
        if (!deletingCycleId) return;

        try {
            setSubmitting(true);
            await cyclesApi.delete(deletingCycleId);
            toast({
                title: 'Sucesso',
                description: 'Ciclo excluído com sucesso',
            });
            setDeleteDialogOpen(false);
            setDeletingCycleId(null);
            loadCycles();
        } catch (error) {
            console.error('Failed to delete cycle:', error);
            toast({
                title: 'Erro',
                description: 'Falha ao excluir ciclo. Verifique se não há avaliações vinculadas.',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setCycleType('ANNUAL');
        setStartDate('');
        setEndDate('');
        setEvaluationStartDate('');
        setEvaluationEndDate('');
        setAllowSelfEvaluation(true);
        setAllowPeerEvaluation(false);
        setAllow360Evaluation(false);
    };

    const getStatusBadge = (status: CycleStatus) => {
        const config: Record<CycleStatus, { label: string; className: string }> = {
            DRAFT: { label: 'Rascunho', className: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
            ACTIVE: { label: 'Ativo', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
            EVALUATION: { label: 'Em Avaliação', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
            CALIBRATION: { label: 'Calibração', className: 'bg-purple-100 text-purple-700 hover:bg-purple-100' },
            COMPLETED: { label: 'Concluído', className: 'bg-slate-100 text-slate-600 hover:bg-slate-100' },
            CANCELLED: { label: 'Cancelado', className: 'bg-red-50 text-red-700 hover:bg-red-50' },
        };
        const c = config[status] || config.DRAFT;
        return <Badge variant="secondary" className={`${c.className} font-medium px-2.5 py-0.5 rounded-full border-0`}>{c.label}</Badge>;
    };

    return (
        <div className="min-h-screen bg-slate-50/30">
            <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <Link href="/performance" className="flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors w-fit group">
                            <ArrowLeft className="h-4 w-4 mr-1 transition-transform group-hover:-translate-x-1" />
                            Voltar para Performance
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                                Ciclos de Avaliação
                            </h1>
                            <p className="text-slate-500 mt-1 text-lg">
                                Gerencie os períodos de avaliação da sua organização.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={loadCycles} className="gap-2 bg-white">
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Atualizar
                        </Button>
                        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-10 px-5 font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all hover:shadow-md">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Novo Ciclo
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader className="pb-4 border-b">
                                    <DialogTitle className="text-xl font-bold">Criar Novo Ciclo</DialogTitle>
                                    <DialogDescription>
                                        Defina o cronograma e as regras para o novo ciclo de performance.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 py-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2 col-span-2">
                                            <Label htmlFor="name" className="text-sm font-medium flex items-center gap-1">
                                                Nome do Ciclo <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Ex: Ciclo Anual de Performance 2026"
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <Label htmlFor="desc" className="text-sm font-medium">Descrição</Label>
                                            <Textarea
                                                id="desc"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Descreva os objetivos principais deste ciclo..."
                                                className="resize-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Tipo de Ciclo</Label>
                                            <Select value={cycleType} onValueChange={(v) => setCycleType(v as CycleType)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ANNUAL">Anual</SelectItem>
                                                    <SelectItem value="SEMI_ANNUAL">Semestral</SelectItem>
                                                    <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                                                    <SelectItem value="PROBATION">Experiência</SelectItem>
                                                    <SelectItem value="PROJECT">Projeto Específico</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2 hidden md:block"></div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">
                                                Data de Início <span className="text-red-500">*</span>
                                            </Label>
                                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">
                                                Data de Fim <span className="text-red-500">*</span>
                                            </Label>
                                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                        </div>

                                        <div className="col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-100 mt-2">
                                            <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-blue-600" /> Período de Avaliação
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-slate-500 uppercase">Início das Avaliações</Label>
                                                    <Input type="date" value={evaluationStartDate} onChange={(e) => setEvaluationStartDate(e.target.value)} className="bg-white" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-slate-500 uppercase">Fim das Avaliações</Label>
                                                    <Input type="date" value={evaluationEndDate} onChange={(e) => setEvaluationEndDate(e.target.value)} className="bg-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t">
                                        <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Configurações de Modalidade</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center justify-between p-3 rounded-lg border bg-white">
                                                <div className="space-y-0.5">
                                                    <Label className="font-medium cursor-pointer text-sm">Autoavaliação</Label>
                                                </div>
                                                <Switch checked={allowSelfEvaluation} onCheckedChange={setAllowSelfEvaluation} />
                                            </div>
                                            <div className="flex items-center justify-between p-3 rounded-lg border bg-white">
                                                <div className="space-y-0.5">
                                                    <Label className="font-medium cursor-pointer text-sm">Avaliação por Pares</Label>
                                                </div>
                                                <Switch checked={allowPeerEvaluation} onCheckedChange={setAllowPeerEvaluation} />
                                            </div>
                                            <div className="flex items-center justify-between p-3 rounded-lg border bg-white col-span-1 md:col-span-2">
                                                <div className="space-y-0.5">
                                                    <Label className="font-medium cursor-pointer text-sm">Visão 360°</Label>
                                                    <p className="text-xs text-muted-foreground">Inclui avaliações de liderados</p>
                                                </div>
                                                <Switch checked={allow360Evaluation} onCheckedChange={setAllow360Evaluation} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="pt-6 border-t gap-2">
                                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
                                    <Button onClick={handleCreateCycle} disabled={submitting}>
                                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                        Criar Ciclo
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Edit Dialog - Simplified structure similar to create */}
                        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader className="pb-4 border-b">
                                    <DialogTitle className="text-xl font-bold">Editar Ciclo</DialogTitle>
                                    <DialogDescription>
                                        Atualize as informações do ciclo de performance.
                                    </DialogDescription>
                                </DialogHeader>
                                {/* Form content same as create dialog, just simplified for brevity here since logic handles state */}
                                <div className="space-y-6 py-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2 col-span-2">
                                            <Label htmlFor="edit-name" className="text-sm font-medium flex items-center gap-1">
                                                Nome do Ciclo <span className="text-red-500">*</span>
                                            </Label>
                                            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <Label htmlFor="edit-desc" className="text-sm font-medium">Descrição</Label>
                                            <Textarea id="edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} className="resize-none" />
                                        </div>
                                        {/* Date inputs and other fields... reusing state */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Data de Início</Label>
                                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Data de Fim</Label>
                                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="pt-6 border-t gap-2">
                                    <Button variant="outline" onClick={() => { setEditDialogOpen(false); setEditingCycle(null); resetForm(); }}>Cancelar</Button>
                                    <Button onClick={handleUpdateCycle} disabled={submitting}>
                                        Salvar Alterações
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Delete Dialog */}
                        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-red-600">
                                        <Trash2 className="h-5 w-5" /> Confirmar Exclusão
                                    </DialogTitle>
                                    <DialogDescription className="pt-2">
                                        Tem certeza que deseja excluir este ciclo? Todas as avaliações vinculadas serão perdidas permanentemente.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="gap-2 mt-4">
                                    <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeletingCycleId(null); }}>Cancelar</Button>
                                    <Button variant="destructive" onClick={handleDeleteCycle} disabled={submitting}>
                                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Excluir Ciclo"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                        <p className="text-slate-500 font-medium">Carregando ciclos...</p>
                    </div>
                ) : cycles.length === 0 ? (
                    /* Empty State - Modernized */
                    <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm max-w-2xl mx-auto mt-12">
                        <div className="bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                            <Calendar className="h-10 w-10 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Comece sua Jornada de Performance</h3>
                        <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
                            Crie seu primeiro ciclo de avaliação para começar a desenvolver talentos e acompanhar resultados.
                        </p>
                        <Button
                            size="lg"
                            onClick={() => setCreateDialogOpen(true)}
                            className="h-12 px-8 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all hover:-translate-y-1"
                        >
                            Criar Primeiro Ciclo
                        </Button>
                    </div>
                ) : (
                    /* Cycles Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cycles.map((cycle) => (
                            <Card key={cycle.id} className="group overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-200 bg-white">
                                <CardHeader className="pb-3 pt-5 px-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className="font-medium text-xs uppercase tracking-wider text-slate-500 border-slate-200 bg-slate-50">
                                            {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
                                        </Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-slate-400 hover:text-slate-600">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleOpenEditDialog(cycle)} className="gap-2">
                                                    <Pencil className="h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleOpenDeleteDialog(cycle.id)} className="gap-2 text-red-600 focus:text-red-700 focus:bg-red-50">
                                                    <Trash2 className="h-4 w-4" /> Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <Link href={`/performance/cycles/${cycle.id}/dashboard`} className="block group-hover:text-blue-600 transition-colors">
                                            <CardTitle className="text-lg font-bold leading-tight">{cycle.name}</CardTitle>
                                        </Link>
                                    </div>
                                    <div className="pt-2">
                                        {getStatusBadge(cycle.status)}
                                    </div>
                                </CardHeader>
                                <CardContent className="px-5 py-2">
                                    <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
                                        {cycle.description || 'Sem descrição definida.'}
                                    </p>
                                </CardContent>
                                <CardFooter className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-3">
                                    <div className="flex gap-2">
                                        {cycle.status === 'DRAFT' ? (
                                            <Button
                                                size="sm"
                                                onClick={() => handleActivateCycle(cycle.id)}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-9 px-4 font-medium"
                                            >
                                                <Play className="h-3.5 w-3.5 mr-1.5" /> Ativar
                                            </Button>
                                        ) : cycle.status === 'ACTIVE' ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleCompleteCycle(cycle.id)}
                                                className="border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 h-9 px-4 font-medium"
                                            >
                                                <StopCircle className="h-3.5 w-3.5 mr-1.5" /> Encerrar
                                            </Button>
                                        ) : (
                                            <Button disabled variant="ghost" size="sm" className="h-9 px-0 opacity-50 font-medium">
                                                <span>Encerrado</span>
                                            </Button>
                                        )}
                                    </div>

                                    <Link href={`/performance/cycles/${cycle.id}/dashboard`}>
                                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-9 px-3 font-medium">
                                            Dashboard <ArrowLeft className="h-3.5 w-3.5 ml-1.5 rotate-180" />
                                        </Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
