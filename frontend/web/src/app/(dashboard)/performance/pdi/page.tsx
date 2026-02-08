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
  Briefcase,
  BarChart3,
  BookOpen,
  GraduationCap
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
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
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Meus Planos</h1>
            <p className="text-slate-500 mt-1">
              Visualize seu progresso e alcance seus objetivos profissionais
            </p>
          </div>
        </div>
        <Button onClick={() => setNewPDIOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 font-bold h-11 px-6">
          <Plus className="h-4 w-4 mr-2" />
          Novo PDI
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="PDIs Ativos"
          value={stats?.active || 0}
          desc="Em desenvolvimento"
          icon={<Target className="h-6 w-6 text-emerald-600" />}
          colorClass="bg-emerald-50 text-emerald-700 border-emerald-100"
        />
        <StatCard
          title="Progresso Médio"
          value={`${stats?.averageProgress?.toFixed(0) || 0}%`}
          desc="Geral da equipe"
          icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
          colorClass="bg-blue-50 text-blue-700 border-blue-100"
          isProgress
        />
        <StatCard
          title="Pendentes"
          value={stats?.pendingApproval || 0}
          desc="Aguardando aprovação"
          icon={<Clock className="h-6 w-6 text-amber-600" />}
          colorClass="bg-amber-50 text-amber-700 border-amber-100"
        />
        <StatCard
          title="Atrasados"
          value={stats?.overdue || 0}
          desc="Prazo expirado"
          icon={<AlertCircle className="h-6 w-6 text-red-600" />}
          colorClass="bg-red-50 text-red-700 border-red-100"
        />
      </div>

      {/* Search & Filters */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar por título, colaborador ou objetivo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-indigo-500 text-base shadow-sm"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="my" className="w-full">
        <TabsList className="w-full justify-start border-b border-slate-200 dark:border-slate-800 bg-transparent p-0 h-auto rounded-none mb-8">
          <TabTrigger value="my" icon={<User className="h-4 w-4" />} label={`Meus PDIs (${myPDIs.length})`} />
          {isManager && (
            <>
              <TabTrigger value="team" icon={<Users className="h-4 w-4" />} label={`Equipe (${teamPDIs.length})`} />
              <TabTrigger value="approval" icon={<CheckCircle2 className="h-4 w-4" />} label={`Aprovação (${pendingApproval.length})`} count={pendingApproval.length} />
            </>
          )}
        </TabsList>

        <TabsContent value="my" className="mt-0 space-y-6">
          <PDIList
            pdis={filteredMyPDIs}
            emptyMessage="Você ainda não possui nenhum PDI criado."
            showEmployee={false}
          />
        </TabsContent>

        {isManager && (
          <>
            <TabsContent value="team" className="mt-0 space-y-6">
              <PDIList
                pdis={filteredTeamPDIs}
                emptyMessage="Nenhum PDI encontrado para sua equipe."
                showEmployee={true}
              />
            </TabsContent>

            <TabsContent value="approval" className="mt-0 space-y-6">
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

function StatCard({ title, value, desc, icon, colorClass, isProgress }: any) {
  return (
    <Card className="border shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden relative group bg-white dark:bg-slate-950">
      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-current", colorClass && colorClass.split(' ')[0])}></div>
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
        <div className="text-3xl font-black text-slate-900 dark:text-white">{value}</div>
        {isProgress && typeof value === 'string' && (
          <div className="mt-3 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden w-full">
            <div
              className="h-full bg-indigo-600 rounded-full"
              style={{ width: value }}
            ></div>
          </div>
        )}
        {!isProgress && (
          <p className="text-xs mt-1 text-slate-400 font-medium">{desc}</p>
        )}
      </CardContent>
    </Card>
  );
}

function TabTrigger({ value, icon, label, count }: any) {
  return (
    <TabsTrigger
      value={value}
      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none rounded-none px-6 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-all text-sm font-medium"
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
  if (pdis.length === 0) {
    return (
      <Card className="border-dashed bg-slate-50/50 shadow-none">
        <CardContent className="py-16 text-center flex flex-col items-center">
          <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">Nenhum PDI encontrado</h3>
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {pdis.map((pdi) => (
        <Link key={pdi.id} href={`/performance/pdi/${pdi.id}`}>
          <div className="group relative flex flex-col md:flex-row md:items-center justify-between p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-300 cursor-pointer">

            {/* Status Indicator Line */}
            <div className={cn(
              "absolute left-0 top-6 bottom-6 w-1 rounded-r-full transition-colors",
              pdi.status === 'ACTIVE' ? "bg-emerald-500" :
                pdi.status === 'COMPLETED' ? "bg-blue-500" :
                  pdi.status === 'PENDING_APPROVAL' ? "bg-amber-500" : "bg-slate-300"
            )}></div>

            <div className="flex-1 pl-4">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className={cn(
                  "px-2.5 py-0.5 text-xs font-bold capitalize border",
                  pdi.status === 'ACTIVE' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                  pdi.status === 'COMPLETED' && "bg-blue-50 text-blue-700 border-blue-200",
                  pdi.status === 'PENDING_APPROVAL' && "bg-amber-50 text-amber-700 border-amber-200",
                  pdi.status === 'DRAFT' && "bg-slate-50 text-slate-700 border-slate-200"
                )}>
                  {pdi.status === 'ACTIVE' ? 'Ativo' :
                    pdi.status === 'COMPLETED' ? 'Concluído' :
                      pdi.status === 'PENDING_APPROVAL' ? 'Aguardando' : 'Rascunho'}
                </Badge>
                {pdi.endDate && (
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full">
                    <Calendar className="w-3 h-3" />
                    {new Date(pdi.endDate).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">
                {pdi.title}
              </h3>

              {showEmployee ? (
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-700 font-bold">
                      {pdi.employeeName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium text-slate-600">{pdi.employeeName}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 line-clamp-1 max-w-lg">
                  {pdi.description || 'Sem descrição definida.'}
                </p>
              )}
            </div>

            <div className="flex flex-col md:items-end gap-1 mt-4 md:mt-0 min-w-[200px] border-l md:border-l-0 md:pl-0 pl-4 border-slate-100">
              <div className="flex justify-between md:justify-end w-full gap-4 mb-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progresso</span>
                <span className="text-sm font-black text-slate-900">{pdi.overallProgress}%</span>
              </div>
              <Progress value={pdi.overallProgress} className="h-2 w-full md:w-48 bg-slate-100" indicatorClassName={cn(
                pdi.overallProgress === 100 ? "bg-emerald-500" : "bg-indigo-600"
              )} />
              <div className="flex gap-3 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {pdi.actions.length} ações</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {pdi.actions.filter(a => a.status === 'COMPLETED').length} concluídas</span>
              </div>
            </div>

            <div className="hidden md:flex items-center pl-6">
              <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform group-hover:bg-indigo-50 group-hover:text-indigo-600">
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600" />
              </Button>
            </div>
          </div>
        </Link>
      ))}
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
      <Card className="bg-slate-50/50 border-dashed shadow-none">
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
        <Card key={pdi.id} className="border-l-4 border-l-amber-400 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5 px-2.5 py-0.5 font-bold">
                    <Clock className="w-3 h-3" />
                    Aguardando Aprovação
                  </Badge>
                  <span className="text-xs text-slate-400 font-medium">Criado em {new Date(pdi.createdAt).toLocaleDateString()}</span>
                </div>

                <div>
                  <h3 className="font-bold text-xl text-slate-900">{pdi.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[9px] bg-slate-100">{pdi.employeeName?.[0]}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium text-slate-700">{pdi.employeeName}</p>
                  </div>
                </div>

                {pdi.focusAreas && (
                  <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-100/50">
                    <span className="font-semibold text-slate-800">Áreas de Foco:</span> {pdi.focusAreas}
                  </div>
                )}

                <div className="flex gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1"><Target className="w-3 h-3 text-indigo-500" /> {pdi.actions.length} ações planejadas</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-indigo-500" /> Até {pdi.endDate ? new Date(pdi.endDate).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>

              <div className="flex md:flex-col gap-3 justify-center md:border-l md:pl-6 md:w-48">
                <Button
                  onClick={() => handleApprove(pdi.id)}
                  disabled={approving === pdi.id}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 w-full font-bold"
                >
                  {approving === pdi.id ? 'Aprovando...' : 'Aprovar Plano'}
                </Button>
                <Link href={`/performance/pdi/${pdi.id}`} className="w-full">
                  <Button variant="outline" className="w-full hover:bg-slate-50 text-slate-600 font-medium border-slate-300">Revisar Detalhes</Button>
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
              <Label className="font-semibold text-slate-700">Título do Plano <span className="text-red-500">*</span></Label>
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
              <Label className="font-semibold text-slate-700">Data Limite (Meta) <span className="text-red-500">*</span></Label>
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
                  <Label className="text-xs font-semibold text-slate-500">O que fazer?</Label>
                  <Input
                    value={actionTitle}
                    onChange={(e) => setActionTitle(e.target.value)}
                    placeholder="Ex: Realizar curso de Gestão de Tempo"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500">Tipo de Ação</Label>
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
              <div className="space-y-2 bg-white rounded-lg border border-slate-100 p-2 shadow-sm">
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
