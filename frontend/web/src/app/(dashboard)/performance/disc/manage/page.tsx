'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BrainCircuit,
  Send,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  BarChart3,
  Eye,
  XCircle,
  Trash2,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import {
  discApi,
  DiscAssignment,
  DiscEvaluation,
  DiscStatistics,
  DiscAssessmentStatus,
} from '@/lib/api/performance';
import { employeesApi, Employee } from '@/lib/api/employees';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { RadialBarChart, RadialBar, PolarAngleAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

const statusColors: Record<DiscAssessmentStatus, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pendente' },
  IN_PROGRESS: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Em Andamento' },
  COMPLETED: { bg: 'bg-green-50', text: 'text-green-700', label: 'Concluido' },
  EXPIRED: { bg: 'bg-red-50', text: 'text-red-700', label: 'Expirado' },
  CANCELLED: { bg: 'bg-gray-50', text: 'text-gray-700', label: 'Cancelado' },
};

const profileColors = {
  DOMINANCE: '#ef4444',
  INFLUENCE: '#eab308',
  STEADINESS: '#22c55e',
  CONSCIENTIOUSNESS: '#3b82f6',
};

// Fallback employees when API is unavailable
const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'emp-001',
    registrationNumber: '001',
    cpf: '000.000.000-01',
    fullName: 'Ana Silva',
    email: 'ana.silva@empresa.com',
    hireDate: '2023-01-15',
    employmentType: 'CLT',
    status: 'ACTIVE',
    department: { id: 'dep-1', name: 'Tecnologia' },
    position: { id: 'pos-1', title: 'Desenvolvedora Senior' },
    createdAt: '2023-01-15',
    updatedAt: '2024-01-01',
  },
  {
    id: 'emp-002',
    registrationNumber: '002',
    cpf: '000.000.000-02',
    fullName: 'Carlos Santos',
    email: 'carlos.santos@empresa.com',
    hireDate: '2023-03-01',
    employmentType: 'CLT',
    status: 'ACTIVE',
    department: { id: 'dep-1', name: 'Tecnologia' },
    position: { id: 'pos-2', title: 'Tech Lead' },
    createdAt: '2023-03-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'emp-003',
    registrationNumber: '003',
    cpf: '000.000.000-03',
    fullName: 'Maria Oliveira',
    email: 'maria.oliveira@empresa.com',
    hireDate: '2022-06-10',
    employmentType: 'CLT',
    status: 'ACTIVE',
    department: { id: 'dep-2', name: 'Recursos Humanos' },
    position: { id: 'pos-3', title: 'Analista de RH' },
    createdAt: '2022-06-10',
    updatedAt: '2024-01-01',
  },
  {
    id: 'emp-004',
    registrationNumber: '004',
    cpf: '000.000.000-04',
    fullName: 'Pedro Costa',
    email: 'pedro.costa@empresa.com',
    hireDate: '2023-09-01',
    employmentType: 'CLT',
    status: 'ACTIVE',
    department: { id: 'dep-3', name: 'Comercial' },
    position: { id: 'pos-4', title: 'Gerente Comercial' },
    createdAt: '2023-09-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'emp-005',
    registrationNumber: '005',
    cpf: '000.000.000-05',
    fullName: 'Juliana Lima',
    email: 'juliana.lima@empresa.com',
    hireDate: '2024-01-15',
    employmentType: 'CLT',
    status: 'ACTIVE',
    department: { id: 'dep-1', name: 'Tecnologia' },
    position: { id: 'pos-5', title: 'Product Manager' },
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
  },
  {
    id: 'emp-006',
    registrationNumber: '006',
    cpf: '000.000.000-06',
    fullName: 'Roberto Almeida',
    email: 'roberto.almeida@empresa.com',
    hireDate: '2022-11-01',
    employmentType: 'CLT',
    status: 'ACTIVE',
    department: { id: 'dep-4', name: 'Financeiro' },
    position: { id: 'pos-6', title: 'Analista Financeiro' },
    createdAt: '2022-11-01',
    updatedAt: '2024-01-01',
  },
];

export default function DiscManagePage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<DiscStatistics | null>(null);
  const [assignments, setAssignments] = useState<DiscAssignment[]>([]);
  const [evaluations, setEvaluations] = useState<DiscEvaluation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogSearchTerm, setDialogSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [activeTab, setActiveTab] = useState<'assignments' | 'results'>('assignments');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load employees separately with fallback
      let loadedEmployees: Employee[] = [];
      try {
        const employeesRes = await employeesApi.list({ size: 1000 });
        loadedEmployees = employeesRes?.content || [];
      } catch (err) {
        console.warn('Failed to load employees from API, using fallback data:', err);
      }

      // Use mock data if API returned nothing
      if (loadedEmployees.length === 0) {
        loadedEmployees = MOCK_EMPLOYEES;
      }
      setEmployees(loadedEmployees);

      // Load DISC data separately
      try {
        const [statsRes, assignmentsRes, evaluationsRes] = await Promise.all([
          discApi.getStatistics(),
          discApi.listAssignments(0, 100),
          discApi.list(0, 100, undefined),
        ]);
        setStatistics(statsRes);
        setAssignments(assignmentsRes?.content || []);
        setEvaluations(evaluationsRes?.content || []);
      } catch (err) {
        console.warn('Failed to load DISC data from API:', err);
        // Set empty defaults so the page still renders
        setStatistics({
          totalEvaluations: 0,
          completedEvaluations: 0,
          pendingEvaluations: 0,
          overdueEvaluations: 0,
          dominanceCount: 0,
          influenceCount: 0,
          steadinessCount: 0,
          conscientiousnessCount: 0,
        });
        setAssignments([]);
        setEvaluations([]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados. Usando dados de demonstracao.',
        variant: 'destructive',
      });
      setEmployees(MOCK_EMPLOYEES);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAssign = async () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos um colaborador',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAssigning(true);
      const employeeNames: Record<string, string> = {};
      selectedEmployees.forEach(empId => {
        const emp = employees.find(e => e.id === empId);
        if (emp) employeeNames[empId] = emp.fullName;
      });

      await discApi.assignBulk({
        employeeIds: selectedEmployees,
        employeeNames,
        assignedBy: user?.id || '',
        assignedByName: user?.name || '',
        dueDate: dueDate || undefined,
      });

      toast({
        title: 'Sucesso',
        description: `Avaliacao DISC enviada para ${selectedEmployees.length} colaborador(es)`,
      });

      setAssignDialogOpen(false);
      setSelectedEmployees([]);
      setDueDate('');
      setDialogSearchTerm('');
      loadData();
    } catch (error: unknown) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao enviar avaliacao',
        variant: 'destructive',
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleCancelAssignment = async (assignmentId: string) => {
    const confirmed = await confirm({
      title: 'Cancelar Atribuicao',
      description: 'Tem certeza que deseja cancelar esta atribuicao? O colaborador nao podera mais iniciar o teste.',
      confirmLabel: 'Cancelar',
      variant: 'destructive'
    });

    if (!confirmed) return;

    try {
      await discApi.cancelAssignment(assignmentId);
      toast({ title: 'Sucesso', description: 'Atribuicao cancelada' });
      loadData();
    } catch {
      toast({
        title: 'Erro',
        description: 'Falha ao cancelar atribuicao',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    const confirmed = await confirm({
      title: 'Excluir Atribuicao',
      description: 'Tem certeza que deseja excluir esta atribuicao? Esta acao nao pode ser desfeita.',
      variant: 'destructive',
      confirmLabel: 'Excluir'
    });

    if (!confirmed) return;

    try {
      await discApi.deleteAssignment(assignmentId);
      toast({ title: 'Sucesso', description: 'Atribuicao excluida' });
      loadData();
    } catch {
      toast({
        title: 'Erro',
        description: 'Falha ao excluir atribuicao',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCancelled = async () => {
    const confirmed = await confirm({
      title: 'Limpar Cancelados',
      description: 'Tem certeza que deseja excluir todas as atribuicoes e avaliacoes canceladas? Esta acao limparia o banco de dados e nao pode ser desfeita.',
      variant: 'destructive',
      confirmLabel: 'Limpar Tudo'
    });

    if (!confirmed) return;

    try {
      await discApi.deleteCancelled();
      toast({ title: 'Sucesso', description: 'Registros cancelados excluidos com sucesso' });
      loadData();
    } catch (error) {
      console.error('Failed to clear cancelled:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao limpar registros cancelados',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEvaluation = async (evaluationId: string) => {
    const confirmed = await confirm({
      title: 'Excluir Avaliacao',
      description: 'Tem certeza que deseja excluir esta avaliacao DISC? Esta acao nao pode ser desfeita.',
      variant: 'destructive',
      confirmLabel: 'Excluir'
    });

    if (!confirmed) return;

    try {
      await discApi.deleteEvaluation(evaluationId);
      toast({ title: 'Sucesso', description: 'Avaliacao excluida com sucesso' });
      loadData();
    } catch (error) {
      console.error('Failed to delete evaluation:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir avaliacao',
        variant: 'destructive',
      });
    }
  };

  const handleSelectAll = () => {
    const filtered = employees.filter(emp =>
      emp.fullName.toLowerCase().includes(dialogSearchTerm.toLowerCase())
    );
    setSelectedEmployees(filtered.map(e => e.id));
  };

  const handleClearSelection = () => {
    setSelectedEmployees([]);
  };

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.employeeName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredEvaluations = evaluations.filter(e => {
    const matchesSearch = e.employeeName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredDialogEmployees = employees.filter(emp =>
    emp.fullName.toLowerCase().includes(dialogSearchTerm.toLowerCase())
  );

  const pieChartData = statistics ? [
    { name: 'Dominancia', value: statistics.dominanceCount, color: profileColors.DOMINANCE },
    { name: 'Influencia', value: statistics.influenceCount, color: profileColors.INFLUENCE },
    { name: 'Estabilidade', value: statistics.steadinessCount, color: profileColors.STEADINESS },
    { name: 'Conformidade', value: statistics.conscientiousnessCount, color: profileColors.CONSCIENTIOUSNESS },
  ].filter(d => d.value > 0) : [];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-lg" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Optimized Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-5">
          <Link href="/performance">
            <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-2 hover:bg-slate-50 transition-all hover:scale-105 shadow-sm">
              <ArrowLeft className="h-6 w-6 text-slate-600" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                Gestão de Avaliações DISC
              </h1>
            </div>
            <p className="text-muted-foreground font-medium">Controle e acompanhamento de perfis comportamentais</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" onClick={handleDeleteCancelled} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Cancelados
          </Button>
          <Dialog open={assignDialogOpen} onOpenChange={(open) => {
            setAssignDialogOpen(open);
            if (!open) {
              setDialogSearchTerm('');
              setSelectedEmployees([]);
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Enviar Avaliacao
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Enviar Avaliacao DISC</DialogTitle>
                <DialogDescription>
                  Selecione os colaboradores que devem responder a avaliacao DISC
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Prazo (opcional)</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Colaboradores ({employees.length} disponiveis)</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleSelectAll}>
                        Selecionar Todos
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleClearSelection}>
                        Limpar
                      </Button>
                    </div>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar colaboradores..."
                      value={dialogSearchTerm}
                      onChange={(e) => setDialogSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    {filteredDialogEmployees.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Nenhum colaborador encontrado para o filtro aplicado.
                      </div>
                    ) : (
                      filteredDialogEmployees.map(emp => (
                        <label
                          key={emp.id}
                          className={`flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b last:border-b-0 transition-colors ${selectedEmployees.includes(emp.id) ? 'bg-primary/5' : ''
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedEmployees.includes(emp.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEmployees([...selectedEmployees, emp.id]);
                              } else {
                                setSelectedEmployees(selectedEmployees.filter(id => id !== emp.id));
                              }
                            }}
                            className="rounded h-4 w-4"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{emp.fullName}</p>
                            <p className="text-xs text-muted-foreground">
                              {emp.department?.name || 'Sem departamento'} - {emp.position?.title || emp.position?.name || 'Sem cargo'}
                            </p>
                          </div>
                          {selectedEmployees.includes(emp.id) && (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedEmployees.length} colaborador(es) selecionado(s)
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAssign} disabled={assigning || selectedEmployees.length === 0}>
                  {assigning ? 'Enviando...' : `Enviar para ${selectedEmployees.length} colaborador(es)`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statistics.totalEvaluations}</p>
                  <p className="text-sm text-muted-foreground">Total de Avaliacoes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statistics.completedEvaluations}</p>
                  <p className="text-sm text-muted-foreground">Concluidas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statistics.pendingEvaluations}</p>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statistics.overdueEvaluations}</p>
                  <p className="text-sm text-muted-foreground">Atrasadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Profile Distribution Section - Innovative Version */}
      {pieChartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-4 border-none shadow-2xl bg-slate-900 text-white overflow-hidden rounded-[2.5rem] relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] -ml-32 -mb-32" />

            <CardHeader className="pb-0 pt-8 px-8 relative z-10">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-primary shadow-inner">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black uppercase tracking-tighter">
                    Mapa de Talentos da Equipe
                  </CardTitle>
                  <CardDescription className="text-slate-400 font-bold">
                    Análise holística da predominância comportamental
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-8 pt-0 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Visual Component: Radial Bar Chart */}
                <div className="h-[450px] relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="30%"
                      outerRadius="100%"
                      barSize={15}
                      data={pieChartData.map(d => ({ ...d, fill: d.color }))}
                      startAngle={180}
                      endAngle={-180}
                    >
                      <RadialBar
                        label={{ position: 'insideStart', fill: '#fff', fontSize: 10, fontWeight: 'bold' }}
                        background={{ fill: 'rgba(255,255,255,0.05)' }}
                        dataKey="value"
                        cornerRadius={20}
                      />
                      <PolarAngleAxis
                        type="number"
                        domain={[0, statistics?.completedEvaluations || 10]}
                        angleAxisId={0}
                        tick={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-800 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{data.name}</p>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
                                  <span className="text-2xl font-black">{data.value}</span>
                                  <span className="text-xs font-bold text-slate-500">Colaboradores</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>

                  {/* Central Statistics Display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Amostragem</p>
                    <span className="text-5xl font-black tracking-tighter">{statistics?.completedEvaluations || 0}</span>
                    <p className="text-[10px] font-black uppercase bg-primary/20 text-primary px-2 py-0.5 rounded-full">Perfis Mapeados</p>
                  </div>
                </div>

                {/* Info Panel: Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pieChartData.map((profile, idx) => (
                    <div key={idx} className="group p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                        <BarChart3 className="w-full h-full text-white rotate-12 translate-x-4 -translate-y-4" />
                      </div>

                      <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: profile.color }} />
                          <h4 className="text-sm font-black uppercase tracking-wider text-slate-400">{profile.name}</h4>
                        </div>
                        <span className="text-xs font-black bg-white/10 px-2 py-1 rounded-lg">
                          {statistics ? ((profile.value / statistics.completedEvaluations) * 100).toFixed(0) : 0}%
                        </span>
                      </div>

                      <div className="flex items-end justify-between relative z-10">
                        <div>
                          <p className="text-4xl font-black tracking-tighter mb-1">{profile.value}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Membros de Equipe</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10">
                          <Users className="h-5 w-5 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}



      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-2 px-1 font-medium transition-colors ${activeTab === 'assignments'
            ? 'border-b-2 border-primary text-primary'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          Atribuicoes
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`pb-2 px-1 font-medium transition-colors ${activeTab === 'results'
            ? 'border-b-2 border-primary text-primary'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          Resultados
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar colaborador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="PENDING">Pendente</SelectItem>
            <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
            <SelectItem value="COMPLETED">Concluido</SelectItem>
            <SelectItem value="EXPIRED">Expirado</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {activeTab === 'assignments' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Enviado por</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma atribuicao encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{assignment.employeeName}</TableCell>
                      <TableCell>{assignment.assignedByName}</TableCell>
                      <TableCell>
                        {assignment.dueDate ? formatDate(assignment.dueDate) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[assignment.status].bg} ${statusColors[assignment.status].text}`}>
                          {statusColors[assignment.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(assignment.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {assignment.status === 'PENDING' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelAssignment(assignment.id)}
                              title="Cancelar Atribuicao"
                            >
                              <XCircle className="h-4 w-4 text-orange-500" />
                            </Button>
                          )}

                          {(assignment.status === 'PENDING' || assignment.status === 'IN_PROGRESS' || assignment.status === 'EXPIRED' || assignment.status === 'CANCELLED') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAssignment(assignment.id)}
                              title="Excluir Registro"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}

                          {assignment.evaluationId && (
                            <>
                              <Link href={`/performance/disc/result/${assignment.evaluationId}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Visualizar Resultado"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAssignment(assignment.id)}
                                title="Excluir Avaliacao e Atribuicao"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Perfil Primario</TableHead>
                  <TableHead>D</TableHead>
                  <TableHead>I</TableHead>
                  <TableHead>S</TableHead>
                  <TableHead>C</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Concluido em</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvaluations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Nenhuma avaliacao encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvaluations.map((evaluation) => (
                    <TableRow key={evaluation.id}>
                      <TableCell className="font-medium">{evaluation.employeeName}</TableCell>
                      <TableCell>
                        {evaluation.primaryProfile && (
                          <Badge style={{ backgroundColor: profileColors[evaluation.primaryProfile] + '20', color: profileColors[evaluation.primaryProfile] }}>
                            {evaluation.primaryProfile === 'DOMINANCE' && 'Dominante'}
                            {evaluation.primaryProfile === 'INFLUENCE' && 'Influente'}
                            {evaluation.primaryProfile === 'STEADINESS' && 'Estavel'}
                            {evaluation.primaryProfile === 'CONSCIENTIOUSNESS' && 'Conforme'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{((evaluation as any).dScore ?? (evaluation as any).d_score) != null ? `${(evaluation as any).dScore ?? (evaluation as any).d_score}%` : '-'}</TableCell>
                      <TableCell>{((evaluation as any).iScore ?? (evaluation as any).i_score) != null ? `${(evaluation as any).iScore ?? (evaluation as any).i_score}%` : '-'}</TableCell>
                      <TableCell>{((evaluation as any).sScore ?? (evaluation as any).s_score) != null ? `${(evaluation as any).sScore ?? (evaluation as any).s_score}%` : '-'}</TableCell>
                      <TableCell>{((evaluation as any).cScore ?? (evaluation as any).c_score) != null ? `${(evaluation as any).cScore ?? (evaluation as any).c_score}%` : '-'}</TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[evaluation.status].bg} ${statusColors[evaluation.status].text}`}>
                          {statusColors[evaluation.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {evaluation.completedAt ? formatDate(evaluation.completedAt) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {evaluation.status === 'COMPLETED' && (
                            <Link href={`/performance/disc/result/${evaluation.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Visualizar Resultado"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEvaluation(evaluation.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
