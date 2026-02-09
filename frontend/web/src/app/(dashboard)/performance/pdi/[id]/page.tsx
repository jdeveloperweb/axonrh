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
import { employeesApi, Employee } from '@/lib/api/employees';
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

// ==================== Components ====================

function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  className
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'blue' | 'green' | 'amber' | 'red' | 'purple';
  className?: string
}) {
  const variants = {
    default: 'bg-slate-50 text-slate-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-violet-50 text-violet-600',
  };

  const iconStyles = {
    default: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-violet-100 text-violet-600',
  };

  return (
    <Card className={`border-none shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative group ${className}`}>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-current opacity-[0.03] rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700 ease-out ${variants[variant]}`} />
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4 relative z-10">
          <div className={`p-3 rounded-xl ${iconStyles[variant]} shadow-sm`}>
            {icon}
          </div>
          {variant === 'green' && <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
        </div>
        <div className="relative z-10">
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {value}
            </h3>
          </div>
          {subtitle && (
            <p className="text-xs font-medium text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PDIDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { confirm } = useConfirm();
  const pdiId = params.id as string;

  const [pdi, setPDI] = useState<PDI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newActionOpen, setNewActionOpen] = useState(false);
  const [completeActionOpen, setCompleteActionOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<PDIAction | null>(null);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);

  const handleDeletePDI = async () => {
    const confirmed = await confirm({
      title: 'Excluir PDI Permanentemente?',
      description: `AVISO DE RISCO: Você está prestes a excluir o PDI "${pdi?.title}" e todo o seu histórico. Esta ação é irreversível e não pode ser desfeita.`,
      variant: 'destructive',
      confirmLabel: 'Entendo o risco, Excluir',
      cancelLabel: 'Cancelar'
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
      setError(null);
      console.log('AXON - Carregando PDI ID:', pdiId);

      // BUSCAR O COLABORADOR LOGADO PARA CHECAGEM DE PERMISSÃO
      let emp = currentEmployee;
      if (!emp) {
        console.log('AXON - Buscando colaborador logado...');
        emp = await employeesApi.getMe().catch(() => null);
        setCurrentEmployee(emp);
      }

      console.log('AXON - Chamando pdisApi.get...');
      const data = await pdisApi.get(pdiId);
      console.log('AXON - Dados do PDI recebidos:', data);
      setPDI(data);
    } catch (err: any) {
      console.error('AXON - Erro detalhado ao carregar PDI:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Falha ao carregar PDI';
      setError(errorMessage);
      toast({
        title: 'Erro ao carregar PDI',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [pdiId, toast, currentEmployee]);

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

  const handleApprove = async () => {
    try {
      if (!currentEmployee) {
        toast({ title: 'Erro', description: 'Aprovador não identificado', variant: 'destructive' });
        return;
      }
      await pdisApi.approve(pdiId, currentEmployee.id);
      toast({ title: 'Sucesso', description: 'PDI aprovado com sucesso!' });
      loadPDI();
    } catch (error) {
      console.error('Erro ao aprovar PDI:', error);
      toast({ title: 'Erro', description: 'Falha ao aprovar PDI', variant: 'destructive' });
    }
  };

  const handleReject = async () => {
    // Para simplificar, vamos apenas usar o cancelamento como "Recusar" por enquanto, 
    // ou manter o status para revisão.
    try {
      await pdisApi.cancel(pdiId);
      toast({ title: 'PDI Recusado', description: 'O PDI foi retornado para rascunho/cancelado.' });
      loadPDI();
    } catch (error) {
      console.error('Erro ao recusar PDI:', error);
      toast({ title: 'Erro', description: 'Falha ao recusar PDI', variant: 'destructive' });
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
        <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
        <h2 className="text-xl font-bold">Não foi possível carregar o PDI</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {error || 'O PDI solicitado não foi encontrado ou você não tem permissão para acessá-lo.'}
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Button variant="outline" onClick={() => loadPDI()}>
            Tentar Novamente
          </Button>
          <Link href="/performance">
            <Button>Voltar para Lista</Button>
          </Link>
        </div>
        <p className="text-[10px] text-slate-300 mt-8">ID: {pdiId}</p>
      </div>
    );
  }

  const completedActions = pdi.actions?.filter((a) => a.status === 'COMPLETED').length || 0;
  const inProgressActions = pdi.actions?.filter((a) => a.status === 'IN_PROGRESS').length || 0;
  const pendingActions = pdi.actions?.filter((a) => a.status === 'PENDING').length || 0;
  const isEditable = pdi.status === 'DRAFT' || pdi.status === 'ACTIVE';
  const statusConfig = STATUS_CONFIG[pdi.status] || STATUS_CONFIG['DRAFT'];

  const filteredActions = actionFilter === 'all'
    ? pdi.actions
    : pdi.actions.filter(a => a.status === actionFilter);

  // Calculate days remaining
  const daysRemaining = pdi.endDate
    ? Math.ceil((new Date(pdi.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isOverdue = daysRemaining !== null && daysRemaining < 0;

  // Estimate total hours
  const totalEstimatedHours = pdi.actions?.reduce((acc, a) => acc + (a.estimatedHours || 0), 0) || 0;
  const totalActualHours = pdi.actions?.reduce((acc, a) => acc + (a.actualHours || 0), 0) || 0;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/performance/pdi">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5 text-slate-500" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} hover:${statusConfig.bgColor} px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide border-0`}>
                {statusConfig.label}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide bg-red-100 text-red-700 hover:bg-red-100 border-0">
                  Atrasado
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{pdi.title}</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
              <User className="h-4 w-4" /> {pdi.employeeName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Delete PDI button for Authorized Users */}
          {(user?.roles?.some(r => ['ADMIN', 'RH', 'GESTOR_RH', 'ANALISTA_DP', 'MANAGER', 'GESTOR', 'LIDER'].includes(r)) || pdi.employeeId === currentEmployee?.id) && (
            <Button
              variant="outline"
              className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 font-bold"
              onClick={handleDeletePDI}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Excluir PDI
            </Button>
          )}
          {isEditable && (
            <Button onClick={() => setNewActionOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-5 shadow-lg shadow-indigo-200">
              <Plus className="h-4 w-4 mr-2" />
              Nova Ação
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards - Premium Design */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Colaborador"
          value={pdi.employeeName?.split(' ')[0] || 'N/A'}
          subtitle="Responsável"
          icon={<User className="h-6 w-6" />}
          variant="blue"
        />

        <StatCard
          title="Gestor"
          value={pdi.managerName ? pdi.managerName.split(' ')[0] : 'N/A'}
          subtitle="Aprovador"
          icon={<Users className="h-6 w-6" />}
          variant="purple"
        />

        <StatCard
          title="Prazo Final"
          value={pdi.endDate ? new Date(pdi.endDate).toLocaleDateString('pt-BR') : 'Sem prazo'}
          subtitle={isOverdue ? `${Math.abs(daysRemaining || 0)} dias atrasado` : `${daysRemaining} dias restantes`}
          icon={<Calendar className="h-6 w-6" />}
          variant={isOverdue ? 'red' : 'amber'}
        />

        <StatCard
          title="Investimento"
          value={`${totalActualHours}h`}
          subtitle={`de ${totalEstimatedHours}h estimadas`}
          icon={<Clock className="h-6 w-6" />}
          variant="green"
        />
      </div>

      {/* Progress Section - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="col-span-1 md:col-span-4 border-none shadow-md overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800">
          <div className={`h-1.5 w-full bg-slate-100 dark:bg-slate-800`}>
            <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-1000 ease-out" style={{ width: `${pdi.overallProgress}%` }} />
          </div>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-indigo-500" />
                  Progresso Geral
                </CardTitle>
                <CardDescription>Acompanhe a evolução do seu plano</CardDescription>
              </div>
              <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {pdi.overallProgress}%
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={pdi.overallProgress} className="h-3 mb-8 bg-slate-100 dark:bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:via-indigo-500 [&>div]:to-purple-500" />

            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 transition-colors cursor-default group border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-center gap-2 mb-2 group-hover:scale-110 transition-transform">
                  <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full">
                    <CircleDot className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  </div>
                  <span className="text-2xl font-black text-slate-700 dark:text-slate-200">{pendingActions}</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pendentes</p>
              </div>

              <div className="text-center p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors cursor-default group border border-blue-100 dark:border-blue-900/20">
                <div className="flex items-center justify-center gap-2 mb-2 group-hover:scale-110 transition-transform">
                  <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-full">
                    <Play className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-2xl font-black text-blue-700 dark:text-blue-300">{inProgressActions}</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400">Em Andamento</p>
              </div>

              <div className="text-center p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-colors cursor-default group border border-emerald-100 dark:border-emerald-900/20">
                <div className="flex items-center justify-center gap-2 mb-2 group-hover:scale-110 transition-transform">
                  <div className="p-2 bg-emerald-200 dark:bg-emerald-800 rounded-full">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{completedActions}</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">Concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description, Objectives, Focus Areas combined */}
      {(pdi.description || pdi.objectives || pdi.focusAreas) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pdi.description && (
            <Card className="border-none shadow-sm h-full hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-200"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Descrição
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{pdi.description}</p>
              </CardContent>
            </Card>
          )}
          {pdi.objectives && (
            <Card className="border-none shadow-sm h-full hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-200"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                  <Target className="w-4 h-4" /> Objetivos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">{pdi.objectives}</p>
              </CardContent>
            </Card>
          )}
          {pdi.focusAreas && (
            <Card className="border-none shadow-sm h-full hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-200"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Áreas de Foco
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {pdi.focusAreas.split(',').map((area, idx) => (
                    <Badge key={idx} variant="secondary" className="font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 px-3 py-1">
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
      <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900 dark:text-white">
                <Target className="h-5 w-5 text-indigo-500" />
                Ações de Desenvolvimento
              </CardTitle>
              <CardDescription className="font-medium text-slate-500 mt-1">
                {pdi.actions.length} ações planejadas - {completedActions} concluídas
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[160px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 h-9">
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="PENDING">Pendentes</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                  <SelectItem value="COMPLETED">Concluídas</SelectItem>
                </SelectContent>
              </Select>
              {isEditable && (
                <Button onClick={() => setNewActionOpen(true)} size="sm" className="h-9 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Ação
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {pdi.actions.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20">
              <div className="bg-indigo-50 dark:bg-indigo-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">Nenhuma ação cadastrada</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
                Adicione ações de desenvolvimento para traçar o caminho até seus objetivos profissionais.
              </p>
              <div className="flex justify-center">
                <Button onClick={() => setNewActionOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-md shadow-indigo-200">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar primeira ação
                </Button>
              </div>
            </div>
          ) : filteredActions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground font-medium">Nenhuma ação com o filtro selecionado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActions.map((action) => {
                const actionStatus = ACTION_STATUS_CONFIG[action.status] || ACTION_STATUS_CONFIG['PENDING'];
                const isCompleted = action.status === 'COMPLETED';
                const isDue = action.dueDate && new Date(action.dueDate) < new Date() && !isCompleted;

                return (
                  <div
                    key={action.id}
                    className={`relative border rounded-2xl p-5 transition-all hover:shadow-md group ${isCompleted ? 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50' :
                      isDue ? 'bg-red-50/50 border-red-100 hover:bg-red-50' :
                        action.status === 'IN_PROGRESS' ? 'bg-blue-50/50 border-blue-100 hover:bg-blue-50' :
                          'bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800'
                      }`}
                  >
                    {/* Colored left border */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${getActionColor(action.actionType)} group-hover:w-2 transition-all duration-300`} />

                    <div className="flex items-start gap-4 pl-3">
                      <div className={`h-12 w-12 rounded-xl flex shadow-sm items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-emerald-100 text-emerald-600' : `${getActionColor(action.actionType)} bg-opacity-10 ${actionStatus.color}`}`}>
                        {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : getActionIcon(action.actionType)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className={`text-lg font-bold leading-tight ${isCompleted ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-900 dark:text-white'}`}>
                              {action.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide bg-white dark:bg-slate-800 ${getActionColor(action.actionType).replace('bg-', 'border-').replace('500', '200')} ${getActionColor(action.actionType).replace('bg-', 'text-').replace('500', '700')}`}>
                                {ACTION_TYPES.find((t) => t.value === action.actionType)?.label || action.actionType}
                              </Badge>
                              <span className={`text-xs font-bold flex items-center gap-1.5 ${actionStatus.color} bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full shadow-sm border border-slate-100 dark:border-slate-700`}>
                                {actionStatus.icon}
                                {actionStatus.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        {action.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                            {action.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-medium text-slate-500">
                          {action.dueDate && (
                            <span className={`flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700 ${isDue ? 'text-red-600 bg-red-50 border-red-100 font-bold' : ''}`}>
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(action.dueDate).toLocaleDateString('pt-BR')}
                              {isDue && ' (atrasada)'}
                            </span>
                          )}
                          {action.estimatedHours && (
                            <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700">
                              <Clock className="h-3.5 w-3.5" />
                              {action.actualHours ? `${action.actualHours}h / ` : ''}{action.estimatedHours}h
                            </span>
                          )}
                          {action.resourceUrl && (
                            <a
                              href={action.resourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              {action.resourceName || 'Recurso'}
                            </a>
                          )}
                          {action.mentorName && (
                            <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700">
                              <User className="h-3.5 w-3.5" />
                              Mentor: {action.mentorName}
                            </span>
                          )}
                        </div>

                        {/* Action Progress Slider */}
                        {!isCompleted && action.status === 'IN_PROGRESS' && isEditable && (
                          <div className="mt-5 space-y-2 max-w-sm bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-blue-700">
                              <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Progresso da Tarefa</span>
                              <span className="bg-white px-2 py-0.5 rounded shadow-sm text-blue-600">{action.progress || 0}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={action.progress || 0}
                              onChange={(e) => handleUpdateActionProgress(action.id!, parseInt(e.target.value))}
                              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-all"
                            />
                          </div>
                        )}
                        {/* Action buttons */}
                        {!isCompleted && isEditable && (
                          <div className="flex gap-2 mt-4 pt-3 border-t border-dashed border-slate-100">
                            {action.status === 'PENDING' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartAction(action.id!)}
                                className="h-8 text-xs font-bold border-slate-200 hover:bg-slate-50 hover:text-indigo-600"
                              >
                                <Play className="h-3 w-3 mr-1.5" />
                                Iniciar Tarefa
                              </Button>
                            )}
                            {action.status === 'IN_PROGRESS' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedAction(action);
                                  setCompleteActionOpen(true);
                                }}
                                className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1.5" />
                                Concluir Tarefa
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 ml-auto"
                              onClick={() => handleRemoveAction(action.id!)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}

                        {/* Completion notes */}
                        {action.completionNotes && (
                          <div className="mt-4 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/20">
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Notas de Conclusão:
                            </p>
                            <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">
                              {action.completionNotes}
                            </p>
                            {action.actualHours && (
                              <p className="text-xs text-emerald-600 mt-2 font-bold bg-white/50 inline-block px-2 py-1 rounded-md border border-emerald-100">
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
      {pdi.status === 'PENDING_APPROVAL' && (
        <Card className="border-none shadow-md bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-100 dark:ring-amber-900/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/20 rounded-full -mr-20 -mt-20 blur-3xl" />
          <CardContent className="py-8 relative z-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
                  <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-lg font-black text-amber-800 dark:text-amber-200">Aguardando sua Aprovação</p>
                  <p className="text-sm font-medium text-amber-700/80 dark:text-amber-300/80 mt-1 max-w-xl">
                    Este PDI foi submetido para sua revisão. Analise os objetivos, o prazo e as ações propostas.
                    Você pode aprovar para iniciar o desenvolvimento ou solicitar ajustes.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button variant="outline" className="flex-1 sm:flex-none border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800 font-bold bg-white" onClick={handleReject}>
                  Solicitar Ajustes
                </Button>
                <Button onClick={handleApprove} className="flex-1 sm:flex-none bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-lg shadow-amber-200 dark:shadow-amber-900/20">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aprovar PDI
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {pdi.status === 'DRAFT' && (
        <Card className="border-none shadow-md bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden relative">
          <CardContent className="py-8 relative z-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600">
                  <Briefcase className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <p className="text-lg font-black text-slate-800 dark:text-white">PDI em modo Rascunho</p>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                    Este plano ainda não está ativo. Finalize o planejamento das ações e envie para aprovação do gestor
                    ou ative-o diretamente se você tiver permissão.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button variant="outline" onClick={handleActivate} className="flex-1 sm:flex-none font-bold border-slate-300 text-slate-700">
                  Ativar Diretamente
                </Button>
                <Button onClick={handleSubmitForApproval} className="flex-1 sm:flex-none font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20">
                  <Play className="h-4 w-4 mr-2" />
                  Submeter para Aprovação
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {pdi.status === 'ACTIVE' && pdi.overallProgress === 100 && (
        <Card className="border-none shadow-md bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-100 dark:ring-emerald-900/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-200/20 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse" />
          <CardContent className="py-8 relative z-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-full shadow-sm animate-bounce">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xl font-black text-emerald-800 dark:text-emerald-200">Parabéns! Todas as ações concluídas!</p>
                  <p className="text-sm font-medium text-emerald-700/80 dark:text-emerald-300/80 mt-1">
                    Você atingiu 100% do progresso neste PDI. Marque-o como concluído para finalizar o ciclo.
                  </p>
                </div>
              </div>
              <Button onClick={handleCompletePDI} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-xl shadow-emerald-200 dark:shadow-emerald-900/20 px-8">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                CONCLUIR PDI
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
