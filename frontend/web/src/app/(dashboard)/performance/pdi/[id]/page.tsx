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
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
} from 'lucide-react';
import Link from 'next/link';
import { pdisApi, PDI, PDIAction, PDIActionType } from '@/lib/api/performance';

const ACTION_TYPES: { value: PDIActionType; label: string; icon: React.ReactNode }[] = [
  { value: 'TRAINING', label: 'Treinamento', icon: <BookOpen className="h-4 w-4" /> },
  { value: 'COURSE', label: 'Curso', icon: <GraduationCap className="h-4 w-4" /> },
  { value: 'CERTIFICATION', label: 'Certificacao', icon: <Target className="h-4 w-4" /> },
  { value: 'MENTORING', label: 'Mentoria', icon: <Users className="h-4 w-4" /> },
  { value: 'COACHING', label: 'Coaching', icon: <Users className="h-4 w-4" /> },
  { value: 'PROJECT', label: 'Projeto', icon: <Briefcase className="h-4 w-4" /> },
  { value: 'JOB_ROTATION', label: 'Job Rotation', icon: <TrendingUp className="h-4 w-4" /> },
  { value: 'READING', label: 'Leitura', icon: <BookOpen className="h-4 w-4" /> },
  { value: 'WORKSHOP', label: 'Workshop', icon: <GraduationCap className="h-4 w-4" /> },
  { value: 'OTHER', label: 'Outro', icon: <Target className="h-4 w-4" /> },
];

export default function PDIDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pdiId = params.id as string;

  const [pdi, setPDI] = useState<PDI | null>(null);
  const [loading, setLoading] = useState(true);
  const [newActionOpen, setNewActionOpen] = useState(false);
  const [completeActionOpen, setCompleteActionOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<PDIAction | null>(null);

  const loadPDI = useCallback(async () => {
    try {
      setLoading(true);
      const data = await pdisApi.get(pdiId);
      setPDI(data.data);
    } catch (error) {
      console.error('Erro ao carregar PDI:', error);
    } finally {
      setLoading(false);
    }
  }, [pdiId]);

  useEffect(() => {
    loadPDI();
  }, [pdiId, loadPDI]);

  const handleStartAction = async (actionId: string) => {
    try {
      await pdisApi.startAction(pdiId, actionId);
      loadPDI();
    } catch (error) {
      console.error('Erro ao iniciar acao:', error);
    }
  };

  const handleCompleteAction = async (notes: string, hoursSpent: number) => {
    if (!selectedAction?.id) return;
    try {
      await pdisApi.completeAction(pdiId, selectedAction.id, { notes, hoursSpent });
      setCompleteActionOpen(false);
      setSelectedAction(null);
      loadPDI();
    } catch (error) {
      console.error('Erro ao concluir acao:', error);
    }
  };

  const handleRemoveAction = async (actionId: string) => {
    try {
      await pdisApi.removeAction(pdiId, actionId);
      loadPDI();
    } catch (error) {
      console.error('Erro ao remover acao:', error);
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      await pdisApi.submitForApproval(pdiId);
      loadPDI();
    } catch (error) {
      console.error('Erro ao submeter para aprovacao:', error);
    }
  };

  const handleActivate = async () => {
    try {
      await pdisApi.activate(pdiId);
      loadPDI();
    } catch (error) {
      console.error('Erro ao ativar:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      DRAFT: { label: 'Rascunho', variant: 'secondary' },
      PENDING_APPROVAL: { label: 'Aguardando Aprovacao', variant: 'default' },
      ACTIVE: { label: 'Ativo', variant: 'outline' },
      COMPLETED: { label: 'Concluido', variant: 'outline' },
    };
    const c = config[status] || { label: status, variant: 'secondary' };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getActionStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PENDING: { label: 'Pendente', variant: 'secondary' },
      IN_PROGRESS: { label: 'Em Andamento', variant: 'default' },
      COMPLETED: { label: 'Concluida', variant: 'outline' },
    };
    const c = config[status] || { label: status, variant: 'secondary' };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getActionIcon = (type: PDIActionType) => {
    const found = ACTION_TYPES.find((t) => t.value === type);
    return found?.icon || <Target className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!pdi) {
    return (
      <div className="text-center py-8">
        <p>PDI nao encontrado</p>
        <Link href="/performance/pdi">
          <Button variant="primary">Voltar</Button>
        </Link>
      </div>
    );
  }

  const completedActions = pdi.actions.filter((a) => a.status === 'COMPLETED').length;
  const isEditable = pdi.status === 'DRAFT' || pdi.status === 'ACTIVE';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/performance/pdi">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{pdi.title}</h1>
          <p className="text-muted-foreground">{pdi.employeeName}</p>
        </div>
        {getStatusBadge(pdi.status)}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Colaborador</p>
                <p className="font-semibold">{pdi.employeeName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gestor</p>
                <p className="font-semibold">{pdi.managerName || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prazo</p>
                <p className="font-semibold">
                  {pdi.endDate ? new Date(pdi.endDate).toLocaleDateString('pt-BR') : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progresso */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{pdi.overallProgress}%</span>
              <span className="text-muted-foreground">
                {completedActions} de {pdi.actions.length} acoes concluidas
              </span>
            </div>
            <Progress value={pdi.overallProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Descricao e Objetivos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pdi.description && (
          <Card>
            <CardHeader>
              <CardTitle>Descricao</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{pdi.description}</p>
            </CardContent>
          </Card>
        )}

        {pdi.objectives && (
          <Card>
            <CardHeader>
              <CardTitle>Objetivos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line">{pdi.objectives}</p>
            </CardContent>
          </Card>
        )}

        {pdi.focusAreas && (
          <Card>
            <CardHeader>
              <CardTitle>Areas de Foco</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{pdi.focusAreas}</p>
            </CardContent>
          </Card>
        )}

        {pdi.expectedOutcomes && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados Esperados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{pdi.expectedOutcomes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Acoes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Acoes de Desenvolvimento</CardTitle>
            <CardDescription>
              Atividades planejadas para o desenvolvimento
            </CardDescription>
          </div>
          {isEditable && (
            <Button onClick={() => setNewActionOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Acao
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {pdi.actions.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma acao cadastrada</p>
              {isEditable && (
                <Button variant="primary" onClick={() => setNewActionOpen(true)}>
                  Adicionar primeira acao
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {pdi.actions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {getActionIcon(action.actionType)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-medium">{action.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {ACTION_TYPES.find((t) => t.value === action.actionType)?.label}
                        </p>
                      </div>
                      {getActionStatusBadge(action.status)}
                    </div>

                    {action.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {action.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      {action.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(action.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {action.estimatedHours && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {action.estimatedHours}h estimadas
                        </span>
                      )}
                      {action.resourceUrl && (
                        <a
                          href={action.resourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {action.resourceName || 'Recurso'}
                        </a>
                      )}
                    </div>

                    {action.status !== 'COMPLETED' && isEditable && (
                      <div className="flex gap-2 mt-3">
                        {action.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartAction(action.id!)}
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
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Concluir
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover Acao</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover esta acao?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveAction(action.id!)}
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}

                    {action.completionNotes && (
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <p className="text-sm font-medium text-green-700 dark:text-green-300">
                          Notas de Conclusao:
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {action.completionNotes}
                        </p>
                        {action.actualHours && (
                          <p className="text-xs text-green-500 mt-1">
                            Tempo investido: {action.actualHours}h
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acoes do PDI */}
      {pdi.status === 'DRAFT' && (
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={handleActivate}>
            Ativar Diretamente
          </Button>
          <Button onClick={handleSubmitForApproval}>
            Submeter para Aprovacao
          </Button>
        </div>
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

// Dialog Nova Acao
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [actionType, setActionType] = useState<PDIActionType>('TRAINING');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      await pdisApi.addAction(pdiId, {
        title,
        description,
        actionType,
        dueDate: dueDate || undefined,
        estimatedHours: estimatedHours ? parseInt(estimatedHours) : undefined,
        resourceUrl: resourceUrl || undefined,
        resourceName: resourceName || undefined,
      });
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
    } catch (error) {
      console.error('Erro ao criar acao:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Acao de Desenvolvimento</DialogTitle>
          <DialogDescription>
            Adicione uma nova acao ao PDI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titulo *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Curso de Lideranca"
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
              placeholder="Detalhes sobre a acao..."
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
              />
            </div>
          </div>

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
              placeholder="Ex: Udemy, Alura, etc"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!title || saving}>
            {saving ? 'Salvando...' : 'Adicionar Acao'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Dialog Concluir Acao
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
          <DialogTitle>Concluir Acao</DialogTitle>
          <DialogDescription>
            Registre a conclusao da acao "{action?.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notas de Conclusao</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="O que foi aprendido? Como foi a experiencia?"
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
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Concluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
