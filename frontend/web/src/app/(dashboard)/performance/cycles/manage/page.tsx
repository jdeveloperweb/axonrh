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
} from 'lucide-react';
import Link from 'next/link';
import { cyclesApi, EvaluationCycle, CycleStatus, CycleType } from '@/lib/api/performance';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';

export default function CyclesManagePage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

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
            await cyclesApi.create({
                name,
                description,
                cycleType,
                startDate,
                endDate,
                evaluationStartDate: evaluationStartDate || undefined,
                evaluationEndDate: evaluationEndDate || undefined,
                allowSelfEvaluation,
                allowPeerEvaluation,
                allow360Evaluation,
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
                description: 'Falha ao criar ciclo',
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
        const config: Record<CycleStatus, { label: string; color: string }> = {
            DRAFT: { label: 'Rascunho', color: 'bg-slate-100 text-slate-700' },
            ACTIVE: { label: 'Ativo', color: 'bg-green-100 text-green-700' },
            EVALUATION: { label: 'Em Avaliação', color: 'bg-blue-100 text-blue-700' },
            CALIBRATION: { label: 'Calibração', color: 'bg-purple-100 text-purple-700' },
            COMPLETED: { label: 'Concluído', color: 'bg-blue-50 text-blue-600 border-blue-200' },
            CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
        };
        const c = config[status] || config.DRAFT;
        return <Badge className={c.color}>{c.label}</Badge>;
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/performance">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Gerenciar Ciclos</h1>
                        <p className="text-muted-foreground">Configure os períodos de avaliação de desempenho</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadCycles}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar
                    </Button>
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="font-bold shadow-lg shadow-primary/20">
                                <Plus className="h-4 w-4 mr-2" />
                                Novo Ciclo
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Criar Novo Ciclo de Avaliação</DialogTitle>
                                <DialogDescription>
                                    Defina os parâmetros do novo ciclo de performance
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="name">Nome do Ciclo *</Label>
                                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Ciclo Anual 2024" />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="desc">Descrição</Label>
                                        <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Objetivos do ciclo..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Tipo de Ciclo</Label>
                                        <Select value={cycleType} onValueChange={(v) => setCycleType(v as CycleType)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ANNUAL">Anual</SelectItem>
                                                <SelectItem value="SEMI_ANNUAL">Semestral</SelectItem>
                                                <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                                                <SelectItem value="PROBATION">Experiência</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        {/* Placeholder for spacer */}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Data de Início *</Label>
                                        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Data de Fim *</Label>
                                        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                    </div>
                                    <div className="space-y-2 border-t pt-4 col-span-2">
                                        <Label className="text-primary font-bold">Período de Avaliação (Questionários)</Label>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Início das Avaliações</Label>
                                        <Input type="date" value={evaluationStartDate} onChange={(e) => setEvaluationStartDate(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Fim das Avaliações</Label>
                                        <Input type="date" value={evaluationEndDate} onChange={(e) => setEvaluationEndDate(e.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-4 border-t pt-4">
                                    <Label>Configurações de Modalidade</Label>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Permitir Autoavaliação</Label>
                                            <p className="text-xs text-muted-foreground">O colaborador avalia a si mesmo</p>
                                        </div>
                                        <Switch checked={allowSelfEvaluation} onCheckedChange={setAllowSelfEvaluation} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Permitir Avaliação por Pares</Label>
                                            <p className="text-xs text-muted-foreground">Colegas do mesmo nível se avaliam</p>
                                        </div>
                                        <Switch checked={allowPeerEvaluation} onCheckedChange={setAllowPeerEvaluation} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Permitir Avaliação 360°</Label>
                                            <p className="text-xs text-muted-foreground">Inclui liderados e visão completa</p>
                                        </div>
                                        <Switch checked={allow360Evaluation} onCheckedChange={setAllow360Evaluation} />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleCreateCycle} disabled={submitting}>
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                    Criar Ciclo
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Cycles List */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : cycles.length === 0 ? (
                <Card className="border-dashed border-2 py-12 text-center">
                    <CardContent>
                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                        <h3 className="text-lg font-bold">Nenhum ciclo encontrado</h3>
                        <p className="text-muted-foreground mb-6">Comece criando um novo ciclo de avaliação para sua empresa.</p>
                        <Button onClick={() => setCreateDialogOpen(true)}>
                            Criar Primeiro Ciclo
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cycles.map((cycle) => (
                        <Card key={cycle.id} className="group overflow-hidden">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg">{cycle.name}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {cycle.cycleType === 'ANNUAL' ? 'Anual' : cycle.cycleType}
                                        </p>
                                    </div>
                                    {getStatusBadge(cycle.status)}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> Início
                                        </p>
                                        <p className="font-medium">{formatDate(cycle.startDate)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> Fim
                                        </p>
                                        <p className="font-medium">{formatDate(cycle.endDate)}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2 flex-wrap">
                                    {cycle.allowSelfEvaluation && <Badge variant="secondary" className="text-[10px]">Autoavaliação</Badge>}
                                    {cycle.allowPeerEvaluation && <Badge variant="secondary" className="text-[10px]">Pares</Badge>}
                                    {cycle.allow360Evaluation && <Badge variant="secondary" className="text-[10px]">360°</Badge>}
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50/50 border-t p-4 flex justify-between gap-2">
                                <div className="flex gap-2">
                                    {cycle.status === 'DRAFT' && (
                                        <Button size="sm" onClick={() => handleActivateCycle(cycle.id)}>
                                            <Play className="h-3.5 w-3.5 mr-1" /> Ativar
                                        </Button>
                                    )}
                                    {cycle.status === 'ACTIVE' && (
                                        <Button size="sm" variant="outline" onClick={() => handleCompleteCycle(cycle.id)}>
                                            <StopCircle className="h-3.5 w-3.5 mr-1 text-red-500" /> Encerrar
                                        </Button>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Link href={`/performance/cycles/${cycle.id}/dashboard`}>
                                        <Button size="sm" variant="ghost">
                                            <BarChart3 className="h-3.5 w-3.5" />
                                        </Button>
                                    </Link>
                                    <Button size="sm" variant="ghost">
                                        <Settings2 className="h-3.5 w-3.5" />
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
