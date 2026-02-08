'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Plus,
  Search,
  TrendingUp,
  Clock,
  CheckCircle2,
  User,
  Users,
  Calendar,
  Target,
  Trash2,
  ChevronRight,
  AlertCircle,
  MoreHorizontal,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';
import {
  pdisApi,
  PDI,
  PDIAction,
  PDIActionType,
  PDIStatistics,
} from '@/lib/api/performance';
import { useAuthStore } from '@/stores/auth-store';
import { employeesApi, Employee } from '@/lib/api/employees';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

export default function PDIListPage() {
  const { toast } = useToast();
  const [myPDIs, setMyPDIs] = useState<PDI[]>([]);
  const [teamPDIs, setTeamPDIs] = useState<PDI[]>([]);
  const [pendingApproval, setPendingApproval] = useState<PDI[]>([]);
  const [stats, setStats] = useState<PDIStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newPDIOpen, setNewPDIOpen] = useState(false);

  const { user } = useAuthStore();
  const currentUserId = user?.id || '';
  const isManager = user?.roles?.some(role => ['ADMIN', 'RH', 'GESTOR_RH', 'ANALISTA_DP', 'MANAGER', 'GESTOR', 'LIDER'].includes(role));

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // BUSCAR O ID DO COLABORADOR
      const employee = await employeesApi.getMe().catch(() => null);
      if (!employee) {
        console.warn('Colaborador não encontrado para este usuário.');
        setLoading(false);
        return;
      }

      const employeeId = employee.id;

      const [my, team, pending, statistics] = await Promise.all([
        pdisApi.getByEmployee(employeeId),
        isManager ? pdisApi.getByTeam(employeeId) : Promise.resolve([]),
        isManager ? pdisApi.getPendingApproval(employeeId) : Promise.resolve([]),
        pdisApi.getManagerStatistics(employeeId).catch(() => ({
          pendingApproval: 0,
          active: 0,
          completed: 0,
          overdue: 0,
          averageProgress: 0,
        })),
      ]);

      setMyPDIs(my);
      setTeamPDIs(Array.isArray(team) ? team : team);
      setPendingApproval(Array.isArray(pending) ? pending : pending);
      setStats(statistics);
    } catch (error: unknown) {
      console.error('Erro ao carregar PDIs:', error);
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  const filteredMyPDIs = myPDIs.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTeamPDIs = teamPDIs.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/performance">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5 text-slate-500" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Planos de Desenvolvimento</h1>
            <p className="text-muted-foreground text-sm">
              Gerencie PDIs e acompanhe o desenvolvimento profissional
            </p>
          </div>
        </div>
        <Button onClick={() => setNewPDIOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20">
          <Plus className="h-4 w-4 mr-2" />
          Novo PDI
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="PDIs Ativos"
          value={stats?.active || 0}
          subtitle="Em desenvolvimento"
          icon={<Target className="h-6 w-6 text-white" />}
          gradient="from-indigo-500 to-blue-600"
        />
        <StatCard
          title="Progresso Médio"
          value={`${stats?.averageProgress?.toFixed(0) || 0}%`}
          subtitle="Geral da equipe"
          icon={<TrendingUp className="h-6 w-6 text-white" />}
          gradient="from-emerald-500 to-green-600"
          isProgress
        />
        <StatCard
          title="Pendentes"
          value={stats?.pendingApproval || 0}
          subtitle="Aguardando aprovação"
          icon={<Clock className="h-6 w-6 text-white" />}
          gradient="from-amber-400 to-orange-500"
        />
        <StatCard
          title="Atrasados"
          value={stats?.overdue || 0}
          subtitle="Prazo expirado"
          icon={<AlertCircle className="h-6 w-6 text-white" />}
          gradient="from-red-500 to-rose-600"
        />
      </div>

      {/* Search & Filters */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar por título, colaborador ou objetivo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-indigo-500"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="my" className="w-full">
        <TabsList className="w-full justify-start border-b border-slate-200 dark:border-slate-800 bg-transparent p-0 h-auto rounded-none mb-6">
          <TabTrigger value="my" icon={<User className="h-4 w-4" />} label={`Meus PDIs (${myPDIs.length})`} />
          {isManager && (
            <>
              <TabTrigger value="team" icon={<Users className="h-4 w-4" />} label={`Equipe (${teamPDIs.length})`} />
              <TabTrigger value="approval" icon={<CheckCircle2 className="h-4 w-4" />} label={`Aprovação (${pendingApproval.length})`} count={pendingApproval.length} />
            </>
          )}
        </TabsList>

        <TabsContent value="my" className="mt-0">
          <PDIList
            pdis={filteredMyPDIs}
            emptyMessage="Você ainda não possui nenhum PDI criado."
            showEmployee={false}
          />
        </TabsContent>

        {isManager && (
          <>
            <TabsContent value="team" className="mt-0">
              <PDIList
                pdis={filteredTeamPDIs}
                emptyMessage="Nenhum PDI encontrado para sua equipe."
                showEmployee={true}
              />
            </TabsContent>

            <TabsContent value="approval" className="mt-0">
              <PDIApprovalList pdis={pendingApproval} onApprove={loadData} />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Dialog Novo PDI */}
      <NewPDIDialog
        open={newPDIOpen}
        onOpenChange={setNewPDIOpen}
        onSuccess={loadData}
        currentUserName={user?.name || ''}
        isManager={!!isManager}
      />
    </div>
  );
}

// ----------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------

function StatCard({ title, value, subtitle, icon, gradient, isProgress }: any) {
  return (
    <Card className={`border-none shadow-lg bg-gradient-to-br ${gradient} text-white overflow-hidden relative group hover:scale-[1.02] transition-transform duration-300`}>
      <div className="absolute -right-6 -bottom-6 opacity-20 rotate-12 group-hover:rotate-0 transition-transform duration-500">
        <div className="p-4 bg-white/20 rounded-full h-32 w-32 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <CardHeader className="pb-2 relative z-10">
        <CardTitle className="text-xs font-black uppercase tracking-widest opacity-80">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-4xl font-black">{value}</div>
        {isProgress ? (
          <div className="mt-3 bg-black/20 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-white opacity-90" style={{ width: String(value).replace('%', '') + '%' }}></div>
          </div>
        ) : (
          <p className="text-xs mt-1 opacity-80 font-medium">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function TabTrigger({ value, icon, label, count }: any) {
  return (
    <TabsTrigger
      value={value}
      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none rounded-none px-6 py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 transition-all"
    >
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
        {count > 0 && (
          <span className="ml-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
    </TabsTrigger>
  );
}

function PDIList({ pdis, emptyMessage, showEmployee }: { pdis: PDI[]; emptyMessage: string; showEmployee: boolean; }) {
  const getStatusConfig = (status: string) => {
    const config: Record<string, { label: string; className: string; icon: any }> = {
      DRAFT: { label: 'Rascunho', className: 'bg-slate-100 text-slate-600 border-slate-200', icon: Briefcase },
      PENDING_APPROVAL: { label: 'Aguardando', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
      ACTIVE: { label: 'Em Andamento', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: TrendingUp },
      COMPLETED: { label: 'Concluído', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle2 },
      CANCELLED: { label: 'Cancelado', className: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
    };
    return config[status] || config['DRAFT'];
  };

  if (pdis.length === 0) {
    return (
      <Card className="border-dashed bg-slate-50/50">
        <CardContent className="py-16 text-center flex flex-col items-center">
          <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">Lista Vazia</h3>
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {pdis.map((pdi) => {
        const status = getStatusConfig(pdi.status);
        const StatusIcon = status.icon;

        return (
          <Link key={pdi.id} href={`/performance/pdi/${pdi.id}`}>
            <Card className="group hover:shadow-lg transition-all border-l-4 overflow-hidden" style={{ borderLeftColor: pdi.status === 'ACTIVE' ? '#10b981' : pdi.status === 'PENDING_APPROVAL' ? '#f59e0b' : '#cbd5e1' }}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                  {/* Left Section: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className={cn("font-medium border gap-1.5", status.className)}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </Badge>
                      {pdi.endDate && (
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(pdi.endDate).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">
                      {pdi.title}
                    </h3>

                    {showEmployee && (
                      <div className="flex items-center gap-2 mt-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[9px] bg-slate-100">
                            {pdi.employeeName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-sm text-slate-600">{pdi.employeeName}</p>
                      </div>
                    )}

                    {!showEmployee && (
                      <p className="text-sm text-slate-500 line-clamp-1 mt-1">
                        {pdi.description || 'Sem descrição definida.'}
                      </p>
                    )}
                  </div>

                  {/* Right Section: Progress & Actions */}
                  <div className="flex flex-row md:flex-col items-center md:items-end gap-6 md:gap-2 min-w-[200px]">
                    <div className="w-full md:text-right">
                      <div className="flex items-center justify-between md:justify-end gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-500">PROGRESSO</span>
                        <span className="text-sm font-black text-slate-900">{pdi.overallProgress}%</span>
                      </div>
                      <Progress value={pdi.overallProgress} className="h-2 w-full md:w-48 bg-slate-100" />
                    </div>

                    <div className="hidden md:flex items-center gap-4 text-xs text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" /> {pdi.actions.length} ações
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {pdi.actions.filter(a => a.status === 'COMPLETED').length} concluídas
                      </span>
                    </div>
                  </div>

                  <div className="md:border-l md:pl-6 flex items-center">
                    <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function PDIApprovalList({ pdis, onApprove }: { pdis: PDI[]; onApprove: () => void; }) {
  const [approving, setApproving] = useState<string | null>(null);

  const handleApprove = async (pdiId: string) => {
    try {
      setApproving(pdiId);
      const employee = await employeesApi.getMe().catch(() => null);
      if (!employee) throw new Error('Aprovador não encontrado');
      await pdisApi.approve(pdiId, employee.id);
      onApprove();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
    } finally {
      setApproving(null);
    }
  };

  if (pdis.length === 0) {
    return (
      <Card className="bg-slate-50/50 border-dashed">
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-4 opacity-50" />
          <p className="text-muted-foreground font-medium">Tudo em dia!</p>
          <p className="text-sm text-slate-400">Nenhum PDI aguardando sua aprovação.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {pdis.map((pdi) => (
        <Card key={pdi.id} className="border-l-4 border-l-amber-400 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5">
                    <Clock className="w-3 h-3" />
                    Aguardando Aprovação
                  </Badge>
                  <span className="text-xs text-slate-400">Criado em {new Date(pdi.createdAt).toLocaleDateString()}</span>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-slate-900">{pdi.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-slate-400" />
                    <p className="text-sm font-medium text-slate-700">{pdi.employeeName}</p>
                  </div>
                </div>

                {pdi.focusAreas && (
                  <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-100">
                    <span className="font-semibold text-slate-800">Áreas de Foco:</span> {pdi.focusAreas}
                  </div>
                )}

                <div className="flex gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {pdi.actions.length} ações planejadas</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Até {pdi.endDate ? new Date(pdi.endDate).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>

              <div className="flex md:flex-col gap-3 justify-center md:border-l md:pl-6">
                <Button
                  onClick={() => handleApprove(pdi.id)}
                  disabled={approving === pdi.id}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm w-full md:w-auto"
                >
                  {approving === pdi.id ? 'Aprovando...' : 'Aprovar Plano'}
                </Button>
                <Link href={`/performance/pdi/${pdi.id}`} className="w-full md:w-auto">
                  <Button variant="outline" className="w-full">Revisar Detalhes</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function NewPDIDialog({ open, onOpenChange, onSuccess, currentUserName, isManager }: any) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [objectives, setObjectives] = useState('');
  const [focusAreas, setFocusAreas] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actions, setActions] = useState<PDIAction[]>([]);

  // Action form state
  const [actionTitle, setActionTitle] = useState('');
  const [actionType, setActionType] = useState<PDIActionType>('TRAINING');

  // Employee Selection (Manager Only)
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('self');
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && isManager) {
      setLoadingEmployees(true);
      employeesApi.list({ size: 100, status: 'ACTIVE' })
        .then(res => setEmployees(res.content))
        .catch(err => console.error(err))
        .finally(() => setLoadingEmployees(false));
    }
  }, [open, isManager]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const currentUser = await employeesApi.getMe().catch(() => null);
      if (!currentUser) throw new Error('Usuario atual não identificado');

      let targetEmployeeId = currentUser.id;
      let targetEmployeeName = currentUserName;

      // Se for gestor e selecionou outro colaborador
      if (isManager && selectedEmployeeId !== 'self') {
        const selected = employees.find(e => e.id === selectedEmployeeId);
        if (selected) {
          targetEmployeeId = selected.id;
          targetEmployeeName = selected.fullName;
        }
      }

      await pdisApi.create({
        title,
        description,
        objectives,
        focusAreas,
        endDate,
        employeeId: targetEmployeeId,
        employeeName: targetEmployeeName,
        managerId: isManager ? currentUser.id : undefined, // Define o criador como gestor se aplicável (simplificação)
        actions: actions.map(a => ({
          ...a,
          status: 'PENDING'
        }))
      });
      onOpenChange(false);
      onSuccess();
      toast({
        title: 'PDI Criado com Sucesso',
        description: `O PDI foi atribuído para ${targetEmployeeName}.`,
        variant: 'default'
      });

      // Reset
      setTitle('');
      setDescription('');
      setObjectives('');
      setFocusAreas('');
      setEndDate('');
      setActions([]);
      setSelectedEmployeeId('self');
    } catch (error) {
      console.error('Erro ao criar PDI:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            Novo Plano de Desenvolvimento
          </DialogTitle>
          <DialogDescription>
            Defina objetivos e ações claras para o desenvolvimento profissional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">

          {/* Employee Selector (Manager Only) */}
          {isManager && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <Label className="mb-2 block text-slate-700 font-semibold">Para quem é este PDI?</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecione o colaborador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Eu mesmo ({currentUserName})</SelectItem>
                  {employees.filter(e => e.fullName !== currentUserName).map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.fullName} - {emp.position?.title || 'Sem cargo'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-2">
                Selecione um membro da sua equipe para criar um PDI para ele.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Título do Plano</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Desenvolvimento de Liderança 2026"
                className="font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label>Áreas de Foco</Label>
              <Input
                value={focusAreas}
                onChange={(e) => setFocusAreas(e.target.value)}
                placeholder="Ex: Comunicação, Gestão"
              />
            </div>

            <div className="space-y-2">
              <Label>Data Limite (Meta)</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Descrição / Contexto</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o propósito deste PDI..."
                rows={2}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Objetivos Esperados</Label>
              <Textarea
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                placeholder="Quais resultados devem ser alcançados?"
                rows={2}
              />
            </div>
          </div>

          {/* Actions Builder */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-bold text-slate-800">Plano de Ação</Label>
              <Badge variant="outline" className="font-normal">{actions.length} ações adicionadas</Badge>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs">O que fazer?</Label>
                  <Input
                    value={actionTitle}
                    onChange={(e) => setActionTitle(e.target.value)}
                    placeholder="Ex: Realizar curso de Gestão de Tempo"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Tipo de Ação</Label>
                  <Select value={actionType} onValueChange={(v) => setActionType(v as PDIActionType)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRAINING">Treinamento</SelectItem>
                      <SelectItem value="COURSE">Curso</SelectItem>
                      <SelectItem value="MENTORING">Mentoria</SelectItem>
                      <SelectItem value="PROJECT">Projeto Prático</SelectItem>
                      <SelectItem value="READING">Leitura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => {
                    if (!actionTitle) return;
                    setActions([...actions, { title: actionTitle, actionType, status: 'PENDING', dueDate: endDate } as PDIAction]);
                    setActionTitle('');
                  }}
                  className="bg-slate-800 text-white hover:bg-slate-700"
                >
                  <Plus className="w-4 h-4 mr-2" /> Adicionar
                </Button>
              </div>
            </div>

            {actions.length > 0 ? (
              <div className="space-y-2 bg-white rounded-lg border border-slate-100 p-2">
                {actions.map((act, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 animate-in slide-in-from-bottom-2 fade-in duration-300">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-900">{act.title}</p>
                        <p className="text-[10px] bg-white border px-1.5 rounded inline-block text-slate-500 uppercase font-semibold tracking-wider">
                          {act.actionType}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setActions(actions.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-sm italic">
                Nenhuma ação adicionada ainda.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={!title || saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
          >
            {saving ? 'Criando...' : 'Criar PDI'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
