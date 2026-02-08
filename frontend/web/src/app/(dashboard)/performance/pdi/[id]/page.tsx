'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Plus,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  Play,
  Target,
  BookOpen,
  GraduationCap,
  Users,
  Briefcase,
  TrendingUp,
  ExternalLink,
  Trash2,
  BarChart3,
  CircleDot,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { pdisApi, PDI, PDIAction, PDIActionType, PDIActionStatus } from '@/lib/api/performance';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/auth-store';
import { useConfirm } from '@/components/providers/ConfirmProvider';

const ACTION_TYPES: { value: PDIActionType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'TRAINING', label: 'Treinamento', icon: <BookOpen className="h-4 w-4" />, color: 'bg-blue-500' },
  { value: 'COURSE', label: 'Curso', icon: <GraduationCap className="h-4 w-4" />, color: 'bg-purple-500' },
  { value: 'CERTIFICATION', label: 'Certificacao', icon: <Target className="h-4 w-4" />, color: 'bg-amber-500' },
  { value: 'MENTORING', label: 'Mentoria', icon: <Users className="h-4 w-4" />, color: 'bg-green-500' },
  { value: 'COACHING', label: 'Coaching', icon: <Users className="h-4 w-4" />, color: 'bg-teal-500' },
  { value: 'PROJECT', label: 'Projeto', icon: <Briefcase className="h-4 w-4" />, color: 'bg-indigo-500' },
  { value: 'JOB_ROTATION', label: 'Job Rotation', icon: <TrendingUp className="h-4 w-4" />, color: 'bg-pink-500' },
  { value: 'READING', label: 'Leitura', icon: <BookOpen className="h-4 w-4" />, color: 'bg-cyan-500' },
  { value: 'WORKSHOP', label: 'Workshop', icon: <GraduationCap className="h-4 w-4" />, color: 'bg-orange-500' },
  { value: 'CONFERENCE', label: 'Conferencia', icon: <Users className="h-4 w-4" />, color: 'bg-rose-500' },
  { value: 'FEEDBACK', label: 'Feedback', icon: <Target className="h-4 w-4" />, color: 'bg-lime-500' },
  { value: 'OTHER', label: 'Outro', icon: <Target className="h-4 w-4" />, color: 'bg-slate-500' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; textColor: string }> = {
  DRAFT: { label: 'Rascunho', color: 'bg-slate-500', bgColor: 'bg-slate-50', textColor: 'text-slate-700' },
  PENDING_APPROVAL: { label: 'Aguardando Aprovacao', color: 'bg-amber-500', bgColor: 'bg-amber-50', textColor: 'text-amber-700' },
  ACTIVE: { label: 'Ativo', color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' },
  ON_HOLD: { label: 'Em Pausa', color: 'bg-orange-500', bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
  COMPLETED: { label: 'Concluido', color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' },
};

const ACTION_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: 'Pendente', color: 'text-slate-500', icon: <CircleDot className="h-4 w-4" /> },
  IN_PROGRESS: { label: 'Em Andamento', color: 'text-blue-500', icon: <Play className="h-4 w-4" /> },
  COMPLETED: { label: 'Concluida', color: 'text-green-500', icon: <CheckCircle2 className="h-4 w-4" /> },
  CANCELLED: { label: 'Cancelada', color: 'text-red-500', icon: <AlertCircle className="h-4 w-4" /> },
};

export default function PDIDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { confirm } = useConfirm();
  const pdiId = params.id as string;

  const [pdi, setPDI] = useState<PDI | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newActionOpen, setNewActionOpen] = useState(false);
  const [completeActionOpen, setCompleteActionOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<PDIAction | null>(null);
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const handleDeletePDI = async () => {
    const confirmed = await confirm({
      title: 'Excluir PDI',
      description: `Tem certeza que deseja excluir o PDI "${pdi?.title}"? Esta acao nao pode ser desfeita.`,
      variant: 'destructive',
      confirmLabel: 'Excluir'
    });

    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await pdisApi.delete(pdiId);
      toast({ title: 'Sucesso', description: 'PDI removido com sucesso' });
      router.push('/performance/pdi');
    } catch (error) {
      console.error('Erro ao remover PDI:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao remover PDI',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const loadPDI = useCallback(async () => {
    try {
      setLoading(true);
      const data = await pdisApi.get(pdiId);
      setPDI(data);
    } catch (error) {
      console.error('Erro ao carregar PDI:', error);
      toast({ title: 'Erro', description: 'Falha ao carregar PDI', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [pdiId, toast]);

  useEffect(() => {
    loadPDI();
  }, [pdiId, loadPDI]);

  const handleStartAction = async (actionId: string) => {
    try {
      await pdisApi.startAction(pdiId, actionId);
      toast({ title: 'Sucesso', description: 'Acao iniciada' });
      loadPDI();
    } catch (error) {
      console.error('Erro ao iniciar acao:', error);
      toast({ title: 'Erro', description: 'Falha ao iniciar acao', variant: 'destructive' });
    }
  };

  const handleCompleteAction = async (notes: string, hoursSpent: number) => {
    if (!selectedAction?.id) return;
    try {
      await pdisApi.completeAction(pdiId, selectedAction.id, { notes, hoursSpent });
      toast({ title: 'Sucesso', description: 'Acao concluida com sucesso!' });
      setCompleteActionOpen(false);
      setSelectedAction(null);
      loadPDI();
    } catch (error) {
      console.error('Erro ao concluir acao:', error);
      toast({ title: 'Erro', description: 'Falha ao concluir acao', variant: 'destructive' });
    }
  };

  const handleUpdateActionProgress = async (actionId: string, progress: number) => {
    try {
      await pdisApi.updateActionProgress(pdiId, actionId, progress);
      loadPDI();
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      toast({ title: 'Erro', description: 'Falha ao atualizar progresso', variant: 'destructive' });
    }
  };

  const handleRemoveAction = async (actionId: string) => {
    const actionToRemove = pdi?.actions.find(a => a.id === actionId);
    if (!actionToRemove) return;

    const confirmed = await confirm({
      title: 'Remover Acao',
      description: `Tem certeza que deseja remover a acao "${actionToRemove.title}"? Esta acao nao pode ser desfeita.`,
      variant: 'destructive',
      confirmLabel: 'Remover'
    });

    if (!confirmed) return;

    try {
      await pdisApi.removeAction(pdiId, actionId);
      toast({ title: 'Sucesso', description: 'Acao removida com sucesso' });
      loadPDI();
    } catch (error) {
      console.error('Erro ao remover acao:', error);
      toast({ title: 'Erro', description: 'Falha ao remover acao', variant: 'destructive' });
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      await pdisApi.submitForApproval(pdiId);
      toast({ title: 'Sucesso', description: 'PDI enviado para aprovacao' });
      loadPDI();
    } catch (error) {
      console.error('Erro ao submeter para aprovacao:', error);
      toast({ title: 'Erro', description: 'Falha ao enviar para aprovacao', variant: 'destructive' });
    }
  };

  const handleActivate = async () => {
    try {
      await pdisApi.activate(pdiId);
      toast({ title: 'Sucesso', description: 'PDI ativado' });
      loadPDI();
    } catch (error) {
      console.error('Erro ao ativar:', error);
      toast({ title: 'Erro', description: 'Falha ao ativar PDI', variant: 'destructive' });
    }
  };

  const handleCompletePDI = async () => {
    try {
      await pdisApi.complete(pdiId);
      toast({ title: 'Sucesso', description: 'PDI concluido!' });
      loadPDI();
    } catch (error) {
      console.error('Erro ao concluir PDI:', error);
      toast({ title: 'Erro', description: 'Falha ao concluir PDI', variant: 'destructive' });
    }
  };

  const getActionIcon = (type: PDIActionType) => {
    const found = ACTION_TYPES.find((t) => t.value === type);
    return found?.icon || <Target className="h-4 w-4" />;
  };

  const getActionColor = (type: PDIActionType) => {
    const found = ACTION_TYPES.find((t) => t.value === type);
    return found?.color || 'bg-slate-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pdi) {
    return (
      <div className="text-center py-12 space-y-4">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
        <p className="text-lg font-medium">PDI nao encontrado</p>
        <Link href="/performance/pdi">
          <Button>Voltar para PDIs</Button>
        </Link>
      </div>
    );
  }

  const completedActions = pdi.actions.filter((a) => a.status === 'COMPLETED').length;
  const inProgressActions = pdi.actions.filter((a) => a.status === 'IN_PROGRESS').length;
  const pendingActions = pdi.actions.filter((a) => a.status === 'PENDING').length;
  const isEditable = pdi.status === 'DRAFT' || pdi.status === 'ACTIVE';
  const statusConfig = STATUS_CONFIG[pdi.status] || STATUS_CONFIG['DRAFT'];

  const filteredActions = actionFilter === 'ALL'
    ? pdi.actions
    : pdi.actions.filter(a => a.status === actionFilter);

  // Calculate days remaining
  const daysRemaining = pdi.endDate
    ? Math.ceil((new Date(pdi.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isOverdue = daysRemaining !== null && daysRemaining < 0;

  // Estimate total hours
  const totalEstimatedHours = pdi.actions.reduce((acc, a) => acc + (a.estimatedHours || 0), 0);
  const totalActualHours = pdi.actions.reduce((acc, a) => acc + (a.actualHours || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/performance/pdi">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black tracking-tight">{pdi.title}</h1>
          <p className="text-muted-foreground">{pdi.employeeName}</p>
        </div>
        <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} px-3 py-1 text-sm font-bold`}>
          {statusConfig.label}
        </Badge>

        {/* Delete PDI button for Authorized Users */}
        {(user?.roles?.some(r => ['ADMIN', 'RH', 'GESTOR_RH', 'ANALISTA_DP', 'MANAGER', 'GESTOR', 'LIDER'].includes(r)) || pdi.employeeId === user?.id) &&
          (pdi.status === 'DRAFT' || pdi.status === 'ACTIVE') && (
            <Button
              variant="outline"
              size="icon"
              className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-100"
              onClick={handleDeletePDI}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-5 w-5" />}
            </Button>
          )}
      </div>

      {/* Info Cards - Redesigned */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Colaborador</p>
                <p className="font-bold text-sm">{pdi.employeeName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Gestor</p>
                <p className="font-bold text-sm">{pdi.managerName || 'Nao definido'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-none shadow-sm ${isOverdue ? 'ring-2 ring-red-200' : ''}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isOverdue ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                <Calendar className={`h-5 w-5 ${isOverdue ? 'text-red-500' : 'text-amber-500'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Prazo</p>
                <p className={`font-bold text-sm ${isOverdue ? 'text-red-600' : ''}`}>
                  {pdi.endDate ? new Date(pdi.endDate).toLocaleDateString('pt-BR') : 'Sem prazo'}
                </p>
                {daysRemaining !== null && (
                  <p className={`text-[10px] font-bold ${isOverdue ? 'text-red-500' : daysRemaining <= 7 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                    {isOverdue ? `${Math.abs(daysRemaining)} dias atrasado` : `${daysRemaining} dias restantes`}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Horas</p>
                <p className="font-bold text-sm">{totalActualHours}h / {totalEstimatedHours}h</p>
                <p className="text-[10px] text-muted-foreground font-bold">investidas / estimadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Section - Enhanced */}
      <Card className="border-none shadow-md overflow-hidden">
        <div className="h-1 bg-primary" style={{ width: `${pdi.overallProgress}%` }} />
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Progresso do PDI
            </CardTitle>
            <span className="text-3xl font-black text-primary">{pdi.overallProgress}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={pdi.overallProgress} className="h-4 mb-6" />

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-slate-50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CircleDot className="h-4 w-4 text-slate-400" />
                <span className="text-2xl font-black text-slate-600">{pendingActions}</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">Pendentes</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Play className="h-4 w-4 text-blue-500" />
                <span className="text-2xl font-black text-blue-600">{inProgressActions}</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">Em Andamento</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-black text-green-600">{completedActions}</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">Concluidas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description, Objectives, Focus Areas */}
      {(pdi.description || pdi.objectives || pdi.focusAreas) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pdi.description && (
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Descricao</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 leading-relaxed">{pdi.description}</p>
              </CardContent>
            </Card>
          )}
          {pdi.objectives && (
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Objetivos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{pdi.objectives}</p>
              </CardContent>
            </Card>
          )}
          {pdi.focusAreas && (
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Areas de Foco</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {pdi.focusAreas.split(',').map((area, idx) => (
                    <Badge key={idx} variant="secondary" className="font-medium">
                      {area.trim()}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Actions Section - Enhanced */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Acoes de Desenvolvimento
              </CardTitle>
              <CardDescription>
                {pdi.actions.length} acoes planejadas - {completedActions} concluidas
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  <SelectItem value="PENDING">Pendentes</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                  <SelectItem value="COMPLETED">Concluidas</SelectItem>
                </SelectContent>
              </Select>
              {isEditable && (
                <Button onClick={() => setNewActionOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Acao
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pdi.actions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">Nenhuma acao cadastrada</p>
              <p className="text-sm text-muted-foreground mb-6">Adicione acoes de desenvolvimento para acompanhar o progresso</p>
              {isEditable && (
                <Button onClick={() => setNewActionOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar primeira acao
                </Button>
              )}
            </div>
          ) : filteredActions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma acao com o filtro selecionado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActions.map((action) => {
                const actionStatus = ACTION_STATUS_CONFIG[action.status] || ACTION_STATUS_CONFIG['PENDING'];
                const isCompleted = action.status === 'COMPLETED';
                const isDue = action.dueDate && new Date(action.dueDate) < new Date() && !isCompleted;

                return (
                  <div
                    key={action.id}
                    className={`relative border rounded-xl p-4 transition-all hover:shadow-sm ${isCompleted ? 'bg-green-50/50 border-green-100' :
                      isDue ? 'bg-red-50/50 border-red-100' :
                        action.status === 'IN_PROGRESS' ? 'bg-blue-50/50 border-blue-100' :
                          'bg-white border-slate-100'
                      }`}
                  >
                    {/* Colored left border */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${getActionColor(action.actionType)}`} />

                    <div className="flex items-start gap-4 pl-2">
                      <div className={`h-10 w-10 rounded-lg ${getActionColor(action.actionType)} bg-opacity-10 flex items-center justify-center flex-shrink-0 ${actionStatus.color}`}>
                        {isCompleted ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : getActionIcon(action.actionType)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className={`font-bold ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                              {action.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px] font-bold">
                                {ACTION_TYPES.find((t) => t.value === action.actionType)?.label || action.actionType}
                              </Badge>
                              <span className={`text-xs font-bold flex items-center gap-1 ${actionStatus.color}`}>
                                {actionStatus.icon}
                                {actionStatus.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        {action.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {action.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                          {action.dueDate && (
                            <span className={`flex items-center gap-1 ${isDue ? 'text-red-500 font-bold' : ''}`}>
                              <Calendar className="h-3 w-3" />
                              {new Date(action.dueDate).toLocaleDateString('pt-BR')}
                              {isDue && ' (atrasada)'}
                            </span>
                          )}
                          {action.estimatedHours && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {action.actualHours ? `${action.actualHours}h / ` : ''}{action.estimatedHours}h
                            </span>
                          )}
                          {action.resourceUrl && (
                            <a
                              href={action.resourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline font-medium"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {action.resourceName || 'Recurso'}
                            </a>
                          )}
                          {action.mentorName && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Mentor: {action.mentorName}
                            </span>
                          )}
                        </div>

                        {/* Action Progress Slider */}
                        {!isCompleted && action.status === 'IN_PROGRESS' && isEditable && (
                          <div className="mt-4 space-y-2 max-w-xs">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-blue-600">
                              <span>Progresso da Tarefa</span>
                              <span className="bg-blue-100 px-1.5 py-0.5 rounded">{action.progress || 0}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={action.progress || 0}
                              onChange={(e) => handleUpdateActionProgress(action.id!, parseInt(e.target.value))}
                              className="w-full h-1.5 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-all"
                            />
                          </div>
                        )}
                        {/* Action buttons */}
                        {!isCompleted && isEditable && (
                          <div className="flex gap-2 mt-3">
                            {action.status === 'PENDING' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartAction(action.id!)}
                                className="h-8 text-xs font-bold"
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Iniciar
                              </Button>
                            )}
                            {action.status === 'IN_PROGRESS' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedAction(action);
                                  setCompleteActionOpen(true);
                                }}
                                className="h-8 text-xs font-bold bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Concluir
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemoveAction(action.id!)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}

                        {/* Completion notes */}
                        {action.completionNotes && (
                          <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-100">
                            <p className="text-xs font-bold text-green-700 dark:text-green-300 mb-1">
                              Notas de Conclusao:
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-400">
                              {action.completionNotes}
                            </p>
                            {action.actualHours && (
                              <p className="text-xs text-green-500 mt-1 font-medium">
                                Tempo investido: {action.actualHours}h
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDI Actions - Status-based */}
      {pdi.status === 'DRAFT' && (
        <Card className="border-none shadow-sm bg-slate-50">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-bold text-slate-700">PDI em modo Rascunho</p>
                <p className="text-sm text-muted-foreground">Ative o PDI ou envie para aprovacao do gestor</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleActivate}>
                  Ativar Diretamente
                </Button>
                <Button onClick={handleSubmitForApproval} className="font-bold">
                  Submeter para Aprovacao
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {pdi.status === 'ACTIVE' && pdi.overallProgress === 100 && (
        <Card className="border-none shadow-sm bg-green-50">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div>
                  <p className="font-bold text-green-800">Todas as acoes concluidas!</p>
                  <p className="text-sm text-green-600">Marque o PDI como concluido</p>
                </div>
              </div>
              <Button onClick={handleCompletePDI} className="bg-green-600 hover:bg-green-700 font-bold">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Concluir PDI
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog Nova Acao */}
      <NewActionDialog
        open={newActionOpen}
        onOpenChange={setNewActionOpen}
        pdiId={pdiId}
        onSuccess={loadPDI}
      />

      {/* Dialog Concluir Acao */}
      <CompleteActionDialog
        open={completeActionOpen}
        onOpenChange={setCompleteActionOpen}
        action={selectedAction}
        onComplete={handleCompleteAction}
      />
    </div>
  );
}

// Dialog Nova Acao - Enhanced
function NewActionDialog({
  open,
  onOpenChange,
  pdiId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdiId: string;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [actionType, setActionType] = useState<PDIActionType>('TRAINING');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [mentorName, setMentorName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: 'Erro', description: 'O titulo e obrigatorio', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      await pdisApi.addAction(pdiId, {
        title: title.trim(),
        description: description.trim() || undefined,
        actionType,
        status: 'PENDING',
        dueDate: dueDate || undefined,
        estimatedHours: estimatedHours ? parseInt(estimatedHours) : undefined,
        resourceUrl: resourceUrl.trim() || undefined,
        resourceName: resourceName.trim() || undefined,
        mentorName: mentorName.trim() || undefined,
      });
      toast({ title: 'Sucesso', description: 'Acao adicionada ao PDI' });
      onOpenChange(false);
      onSuccess();
      // Reset
      setTitle('');
      setDescription('');
      setActionType('TRAINING');
      setDueDate('');
      setEstimatedHours('');
      setResourceUrl('');
      setResourceName('');
      setMentorName('');
    } catch (error) {
      console.error('Erro ao criar acao:', error);
      toast({ title: 'Erro', description: 'Falha ao adicionar acao', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Acao de Desenvolvimento</DialogTitle>
          <DialogDescription>
            Adicione uma nova acao ao plano de desenvolvimento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titulo *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Curso de Lideranca Estrategica"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="actionType">Tipo de Acao</Label>
            <Select value={actionType} onValueChange={(v) => setActionType(v as PDIActionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center gap-2">
                      {type.icon}
                      {type.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descricao</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que sera feito, objetivos especificos e resultados esperados..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Data Limite</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Horas Estimadas</Label>
              <Input
                id="estimatedHours"
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="8"
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mentorName">Mentor / Responsavel</Label>
            <Input
              id="mentorName"
              value={mentorName}
              onChange={(e) => setMentorName(e.target.value)}
              placeholder="Nome do mentor ou responsavel"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resourceUrl">Link do Recurso</Label>
              <Input
                id="resourceUrl"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resourceName">Nome do Recurso</Label>
              <Input
                id="resourceName"
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                placeholder="Ex: Udemy, Alura"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Acao
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Dialog Concluir Acao - Enhanced
function CompleteActionDialog({
  open,
  onOpenChange,
  action,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: PDIAction | null;
  onComplete: (notes: string, hoursSpent: number) => void;
}) {
  const [notes, setNotes] = useState('');
  const [hoursSpent, setHoursSpent] = useState('');

  const handleSubmit = () => {
    onComplete(notes, parseInt(hoursSpent) || 0);
    setNotes('');
    setHoursSpent('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Concluir Acao
          </DialogTitle>
          <DialogDescription>
            Registre a conclusao da acao &quot;{action?.title}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">O que foi aprendido / realizado?</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descreva os aprendizados, resultados obtidos e como isso contribuiu para seu desenvolvimento..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hoursSpent">Horas Investidas</Label>
            <Input
              id="hoursSpent"
              type="number"
              value={hoursSpent}
              onChange={(e) => setHoursSpent(e.target.value)}
              placeholder={action?.estimatedHours?.toString() || '0'}
              min="0"
            />
            {action?.estimatedHours && (
              <p className="text-xs text-muted-foreground">
                Estimativa original: {action.estimatedHours}h
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Confirmar Conclusao
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
