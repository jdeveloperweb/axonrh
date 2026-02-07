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
} from 'lucide-react';
import Link from 'next/link';
import { cyclesApi, EvaluationCycle, CycleStatus, CycleType, EvaluationType } from '@/lib/api/performance';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';

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
            DRAFT: { label: 'Rascunho', className: 'bg-slate-100 text-slate-700 border-slate-200' },
            ACTIVE: { label: 'Ativo', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            EVALUATION: { label: 'Em Avaliação', className: 'bg-sky-50 text-sky-700 border-sky-200' },
            CALIBRATION: { label: 'Calibração', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
            COMPLETED: { label: 'Concluído', className: 'bg-blue-50 text-blue-700 border-blue-200' },
            CANCELLED: { label: 'Cancelado', className: 'bg-red-50 text-red-700 border-red-200' },
        };
        const c = config[status] || config.DRAFT;
        return <Badge variant="outline" className={`${c.className} font-semibold px-3 py-1`}>{c.label}</Badge>;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-4">
                    <Link href="/performance" className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors group">
                        <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                        Voltar para Performance
                    </Link>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Gerenciar Ciclos
                        </h1>
                        <p className="text-lg text-muted-foreground mt-2">
                            Configure e acompanhe os períodos de avaliação de desempenho organizacional.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={loadCycles} className="border-2 hover:bg-slate-50">
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-11 px-6 font-bold shadow-xl shadow-primary/10 transition-all hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0">
                                <Plus className="h-5 w-5 mr-2" />
                                Novo Ciclo
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-none shadow-2xl">
                            <DialogHeader className="pb-4 border-b">
                                <DialogTitle className="text-2xl font-black">Criar Novo Ciclo</DialogTitle>
                                <DialogDescription className="text-base italic">
                                    Defina o cronograma e as regras para o novo ciclo de performance.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="name" className="text-sm font-bold flex items-center gap-1.5">
                                            Nome do Ciclo <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Ex: Ciclo Anual de Performance 2026"
                                            className="h-11 border-2 focus-visible:ring-primary"
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="desc" className="text-sm font-bold">Descrição</Label>
                                        <Textarea
                                            id="desc"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Descreva os objetivos principais deste ciclo..."
                                            className="min-h-[100px] border-2 focus-visible:ring-primary resize-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold">Tipo de Ciclo</Label>
                                        <Select value={cycleType} onValueChange={(v) => setCycleType(v as CycleType)}>
                                            <SelectTrigger className="h-11 border-2">
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
                                        <Label className="text-sm font-bold flex items-center gap-1.5 text-primary/80">
                                            <Calendar className="h-4 w-4" /> Data de Início <span className="text-red-500">*</span>
                                        </Label>
                                        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11 border-2" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold flex items-center gap-1.5 text-primary/80">
                                            <Calendar className="h-4 w-4" /> Data de Fim <span className="text-red-500">*</span>
                                        </Label>
                                        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-11 border-2" />
                                    </div>

                                    <div className="col-span-2 bg-primary/5 p-4 rounded-xl border border-primary/10 mt-2">
                                        <h4 className="text-sm font-black text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4" /> Período de Avaliação (Questionários)
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase text-muted-foreground">Início das Avaliações</Label>
                                                <Input type="date" value={evaluationStartDate} onChange={(e) => setEvaluationStartDate(e.target.value)} className="h-10 bg-white" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase text-muted-foreground">Fim das Avaliações</Label>
                                                <Input type="date" value={evaluationEndDate} onChange={(e) => setEvaluationEndDate(e.target.value)} className="h-10 bg-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t">
                                    <h4 className="text-sm font-black text-foreground uppercase tracking-wider mb-4">Configurações de Modalidade</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center justify-between p-4 rounded-xl border-2 transition-colors hover:border-primary/30 group">
                                            <div className="space-y-0.5">
                                                <Label className="font-bold cursor-pointer">Autoavaliação</Label>
                                                <p className="text-xs text-muted-foreground">O colaborador reflete sobre sua atuação</p>
                                            </div>
                                            <Switch checked={allowSelfEvaluation} onCheckedChange={setAllowSelfEvaluation} />
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-xl border-2 transition-colors hover:border-primary/30 group">
                                            <div className="space-y-0.5">
                                                <Label className="font-bold cursor-pointer">Avaliação por Pares</Label>
                                                <p className="text-xs text-muted-foreground">Troca de feedback entre colegas horizontais</p>
                                            </div>
                                            <Switch checked={allowPeerEvaluation} onCheckedChange={setAllowPeerEvaluation} />
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-xl border-2 transition-colors hover:border-primary/30 group col-span-1 md:col-span-2">
                                            <div className="space-y-0.5">
                                                <Label className="font-bold cursor-pointer">Visão 360° Completa</Label>
                                                <p className="text-xs text-muted-foreground">Inclui avaliações de liderados diretos e múltiplas perspectivas</p>
                                            </div>
                                            <Switch checked={allow360Evaluation} onCheckedChange={setAllow360Evaluation} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="pt-6 border-t gap-3">
                                <Button variant="ghost" onClick={() => setCreateDialogOpen(false)} className="font-bold">Cancelar</Button>
                                <Button onClick={handleCreateCycle} disabled={submitting} className="min-w-[140px] font-bold">
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                    Criar Ciclo
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Dialog */}
                    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-none shadow-2xl">
                            <DialogHeader className="pb-4 border-b">
                                <DialogTitle className="text-2xl font-black">Editar Ciclo</DialogTitle>
                                <DialogDescription className="text-base italic">
                                    Atualize as informações do ciclo de performance.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="edit-name" className="text-sm font-bold flex items-center gap-1.5">
                                            Nome do Ciclo <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="edit-name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Ex: Ciclo Anual de Performance 2026"
                                            className="h-11 border-2 focus-visible:ring-primary"
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="edit-desc" className="text-sm font-bold">Descrição</Label>
                                        <Textarea
                                            id="edit-desc"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Descreva os objetivos principais deste ciclo..."
                                            className="min-h-[100px] border-2 focus-visible:ring-primary resize-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold">Tipo de Ciclo</Label>
                                        <Select value={cycleType} onValueChange={(v) => setCycleType(v as CycleType)}>
                                            <SelectTrigger className="h-11 border-2">
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
                                        <Label className="text-sm font-bold flex items-center gap-1.5 text-primary/80">
                                            <Calendar className="h-4 w-4" /> Data de Início <span className="text-red-500">*</span>
                                        </Label>
                                        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11 border-2" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold flex items-center gap-1.5 text-primary/80">
                                            <Calendar className="h-4 w-4" /> Data de Fim <span className="text-red-500">*</span>
                                        </Label>
                                        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-11 border-2" />
                                    </div>

                                    <div className="col-span-2 bg-primary/5 p-4 rounded-xl border border-primary/10 mt-2">
                                        <h4 className="text-sm font-black text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4" /> Período de Avaliação (Questionários)
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase text-muted-foreground">Início das Avaliações</Label>
                                                <Input type="date" value={evaluationStartDate} onChange={(e) => setEvaluationStartDate(e.target.value)} className="h-10 bg-white" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase text-muted-foreground">Fim das Avaliações</Label>
                                                <Input type="date" value={evaluationEndDate} onChange={(e) => setEvaluationEndDate(e.target.value)} className="h-10 bg-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t">
                                    <h4 className="text-sm font-black text-foreground uppercase tracking-wider mb-4">Configurações de Modalidade</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center justify-between p-4 rounded-xl border-2 transition-colors hover:border-primary/30 group">
                                            <div className="space-y-0.5">
                                                <Label className="font-bold cursor-pointer">Autoavaliação</Label>
                                                <p className="text-xs text-muted-foreground">O colaborador reflete sobre sua atuação</p>
                                            </div>
                                            <Switch checked={allowSelfEvaluation} onCheckedChange={setAllowSelfEvaluation} />
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-xl border-2 transition-colors hover:border-primary/30 group">
                                            <div className="space-y-0.5">
                                                <Label className="font-bold cursor-pointer">Avaliação por Pares</Label>
                                                <p className="text-xs text-muted-foreground">Troca de feedback entre colegas horizontais</p>
                                            </div>
                                            <Switch checked={allowPeerEvaluation} onCheckedChange={setAllowPeerEvaluation} />
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-xl border-2 transition-colors hover:border-primary/30 group col-span-1 md:col-span-2">
                                            <div className="space-y-0.5">
                                                <Label className="font-bold cursor-pointer">Visão 360° Completa</Label>
                                                <p className="text-xs text-muted-foreground">Inclui avaliações de liderados diretos e múltiplas perspectivas</p>
                                            </div>
                                            <Switch checked={allow360Evaluation} onCheckedChange={setAllow360Evaluation} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="pt-6 border-t gap-3">
                                <Button variant="ghost" onClick={() => { setEditDialogOpen(false); setEditingCycle(null); resetForm(); }} className="font-bold">Cancelar</Button>
                                <Button onClick={handleUpdateCycle} disabled={submitting} className="min-w-[140px] font-bold">
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                    Salvar Alterações
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Delete Confirmation Dialog */}
                    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <DialogContent className="max-w-md border-none shadow-2xl">
                            <DialogHeader className="pb-4">
                                <DialogTitle className="text-2xl font-black text-red-600 flex items-center gap-2">
                                    <Trash2 className="h-6 w-6" />
                                    Confirmar Exclusão
                                </DialogTitle>
                                <DialogDescription className="text-base pt-2">
                                    Tem certeza que deseja excluir este ciclo? Esta ação não pode ser desfeita e todas as avaliações vinculadas serão perdidas.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="pt-6 gap-3">
                                <Button variant="ghost" onClick={() => { setDeleteDialogOpen(false); setDeletingCycleId(null); }} className="font-bold">Cancelar</Button>
                                <Button
                                    onClick={handleDeleteCycle}
                                    disabled={submitting}
                                    className="min-w-[140px] font-bold bg-red-600 hover:bg-red-700"
                                >
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                    Excluir Ciclo
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Cycles List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
                    <p className="text-muted-foreground font-medium animate-pulse">Carregando ciclos disponíveis...</p>
                </div>
            ) : cycles.length === 0 ? (
                <div className="bg-slate-50/50 border-2 border-dashed rounded-3xl p-16 text-center shadow-inner animate-in zoom-in-95 duration-500">
                    <div className="relative inline-block mb-6">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse-slow"></div>
                        <div className="relative bg-white p-6 rounded-2xl shadow-xl border-2 border-primary/10">
                            <Calendar className="h-16 w-16 text-primary" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black text-foreground mb-3">Nenhum ciclo ativo encontrado</h3>
                    <p className="text-muted-foreground text-lg mb-10 max-w-md mx-auto">
                        Inicie o processo de gestão de desempenho criando seu primeiro ciclo de avaliações.
                    </p>
                    <Button
                        size="lg"
                        onClick={() => setCreateDialogOpen(true)}
                        className="h-14 px-10 rounded-2xl font-black text-lg shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-transform"
                    >
                        Criar Primeiro Ciclo
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {cycles.map((cycle) => (
                        <Card key={cycle.id} className="group relative border-2 transition-all hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 rounded-2xl overflow-hidden hover:-translate-y-1">
                            <div className={`absolute top-0 left-0 w-1.5 h-full ${cycle.status === 'ACTIVE' ? 'bg-emerald-500' :
                                cycle.status === 'DRAFT' ? 'bg-slate-300' : 'bg-primary'
                                }`} />
                            <CardHeader className="pb-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="p-2 bg-slate-50 rounded-lg border-2 border-slate-100 group-hover:border-primary/10 transition-colors">
                                        <Calendar className="h-6 w-6 text-primary/70" />
                                    </div>
                                    {getStatusBadge(cycle.status)}
                                </div>
                                <div>
                                    <h3 className="font-black text-xl leading-tight group-hover:text-primary transition-colors">{cycle.name}</h3>
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                        {cycle.cycleType === 'ANNUAL' ? 'Anual' :
                                            cycle.cycleType === 'SEMI_ANNUAL' ? 'Semestral' :
                                                cycle.cycleType === 'QUARTERLY' ? 'Trimestral' :
                                                    cycle.cycleType === 'PROBATION' ? 'Experiência' : 'Projeto'}
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border-2 border-slate-100/50 text-sm">
                                    <div className="space-y-1.5">
                                        <p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> Início
                                        </p>
                                        <p className="font-extrabold text-slate-700">{formatDate(cycle.startDate)}</p>
                                    </div>
                                    <div className="space-y-1.5 border-l pl-6">
                                        <p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> Conclusão
                                        </p>
                                        <p className="font-extrabold text-slate-700">{formatDate(cycle.endDate)}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2 flex-wrap">
                                    {cycle.includeSelfEvaluation && (
                                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] uppercase font-bold px-2 py-0.5">
                                            Autoavaliação
                                        </Badge>
                                    )}
                                    {cycle.includePeerEvaluation && (
                                        <Badge variant="secondary" className="bg-sky-50 text-sky-700 border-sky-100 text-[10px] uppercase font-bold px-2 py-0.5">
                                            Pares
                                        </Badge>
                                    )}
                                    {cycle.includeSubordinateEvaluation && (
                                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[10px] uppercase font-bold px-2 py-0.5">
                                            360°
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50/50 border-t p-5 flex justify-between gap-3 items-center">
                                <div className="flex gap-2">
                                    {cycle.status === 'DRAFT' && (
                                        <Button
                                            size="sm"
                                            onClick={() => handleActivateCycle(cycle.id)}
                                            className="font-bold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/10"
                                        >
                                            <Play className="h-3.5 w-3.5 mr-1.5 fill-current" /> Ativar
                                        </Button>
                                    )}
                                    {cycle.status === 'ACTIVE' && (
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            onClick={() => handleCompleteCycle(cycle.id)}
                                            className="font-bold"
                                        >
                                            <StopCircle className="h-3.5 w-3.5 mr-1.5" /> Encerrar
                                        </Button>
                                    )}
                                </div>
                                <div className="flex gap-1.5">
                                    <Link href={`/performance/cycles/${cycle.id}/dashboard`}>
                                        <Button size="icon" variant="ghost" className="h-9 w-9 border-2 border-transparent hover:border-primary/20 hover:text-primary transition-all">
                                            <BarChart3 className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-9 w-9 border-2 border-transparent hover:border-blue-200 hover:text-blue-600 transition-all"
                                        onClick={() => handleOpenEditDialog(cycle)}
                                        title="Editar ciclo"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-9 w-9 border-2 border-transparent hover:border-red-200 hover:text-red-600 transition-all"
                                        onClick={() => handleOpenDeleteDialog(cycle.id)}
                                        title="Excluir ciclo"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
