'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';
import Link from 'next/link';
import {
  pdisApi,
  PDI,
  PDIStatistics,
} from '@/lib/api/performance';
import { useAuthStore } from '@/stores/auth-store';



export default function PDIListPage() {
  const [myPDIs, setMyPDIs] = useState<PDI[]>([]);
  const [teamPDIs, setTeamPDIs] = useState<PDI[]>([]);
  const [pendingApproval, setPendingApproval] = useState<PDI[]>([]);
  const [stats, setStats] = useState<PDIStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newPDIOpen, setNewPDIOpen] = useState(false);

  const { user } = useAuthStore();
  const currentUserId = user?.id || '';
  const isManager = user?.roles?.includes('MANAGER') || user?.roles?.includes('ADMIN');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [my, team, pending, statistics] = await Promise.all([
        pdisApi.getByEmployee(currentUserId),
        isManager ? pdisApi.getByTeam(currentUserId) : Promise.resolve([]),
        isManager ? pdisApi.getPendingApproval(currentUserId) : Promise.resolve([]),
        pdisApi.getManagerStatistics(currentUserId),
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
  }, [currentUserId, isManager]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/performance">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Planos de Desenvolvimento Individual</h1>
          <p className="text-muted-foreground">
            Gerencie PDIs e acompanhe o desenvolvimento
          </p>
        </div>
        <Button onClick={() => setNewPDIOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo PDI
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              PDIs Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aguardando Aprovacao
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {stats?.pendingApproval || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Progresso Medio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageProgress?.toFixed(0) || 0}%</div>
            <Progress value={stats?.averageProgress || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Atrasados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats?.overdue || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar PDIs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="my">
        <TabsList>
          <TabsTrigger value="my">
            <User className="h-4 w-4 mr-2" />
            Meus PDIs ({myPDIs.length})
          </TabsTrigger>
          {isManager && (
            <>
              <TabsTrigger value="team">
                <Users className="h-4 w-4 mr-2" />
                Equipe ({teamPDIs.length})
              </TabsTrigger>
              <TabsTrigger value="approval">
                <Clock className="h-4 w-4 mr-2" />
                Aprovar ({pendingApproval.length})
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="my" className="mt-4">
          <PDIList
            pdis={filteredMyPDIs}
            emptyMessage="Voce nao possui PDIs"
            showEmployee={false}
          />
        </TabsContent>

        {isManager && (
          <>
            <TabsContent value="team" className="mt-4">
              <PDIList
                pdis={filteredTeamPDIs}
                emptyMessage="Nenhum PDI na equipe"
                showEmployee={true}
              />
            </TabsContent>

            <TabsContent value="approval" className="mt-4">
              <PDIApprovalList pdis={pendingApproval} onApprove={loadData} currentUserId={currentUserId} />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Dialog Novo PDI */}
      <NewPDIDialog open={newPDIOpen} onOpenChange={setNewPDIOpen} onSuccess={loadData} currentUserId={currentUserId} userName={user?.name || ''} />
    </div>
  );
}

// Componente de Lista de PDIs
function PDIList({
  pdis,
  emptyMessage,
  showEmployee,
}: {
  pdis: PDI[];
  emptyMessage: string;
  showEmployee: boolean;
}) {
  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      DRAFT: { label: 'Rascunho', variant: 'secondary' },
      PENDING_APPROVAL: { label: 'Aguardando', variant: 'default' },
      ACTIVE: { label: 'Ativo', variant: 'outline' },
      COMPLETED: { label: 'Concluido', variant: 'outline' },
    };
    const c = config[status] || { label: status, variant: 'secondary' };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  if (pdis.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pdis.map((pdi) => (
        <Link key={pdi.id} href={`/performance/pdi/${pdi.id}`}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{pdi.title}</h3>
                    {showEmployee && (
                      <p className="text-sm text-muted-foreground">{pdi.employeeName}</p>
                    )}
                  </div>
                </div>
                {getStatusBadge(pdi.status)}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">{pdi.overallProgress}%</span>
                </div>
                <Progress value={pdi.overallProgress} />
              </div>

              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    {pdi.actions.length} acoes
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    {pdi.actions.filter((a) => a.status === 'COMPLETED').length} concluidas
                  </span>
                </div>
                {pdi.endDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(pdi.endDate).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

// Componente de Lista de Aprovacao
function PDIApprovalList({
  pdis,
  onApprove,
  currentUserId,
}: {
  pdis: PDI[];
  onApprove: () => void;
  currentUserId: string;
}) {
  const [approving, setApproving] = useState<string | null>(null);

  const handleApprove = async (pdiId: string) => {
    try {
      setApproving(pdiId);
      await pdisApi.approve(pdiId, currentUserId);
      onApprove();
    } catch (error: unknown) {
      console.error('Erro ao aprovar:', error);
    } finally {
      setApproving(null);
    }
  };

  if (pdis.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <p className="text-muted-foreground">Nenhum PDI aguardando aprovacao</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pdis.map((pdi) => (
        <Card key={pdi.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{pdi.title}</h3>
                  <p className="text-sm text-muted-foreground">{pdi.employeeName}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/performance/pdi/${pdi.id}`}>
                  <Button variant="outline" size="sm">Ver Detalhes</Button>
                </Link>
                <Button
                  size="sm"
                  onClick={() => handleApprove(pdi.id)}
                  disabled={approving === pdi.id}
                >
                  {approving === pdi.id ? 'Aprovando...' : 'Aprovar'}
                </Button>
              </div>
            </div>

            {pdi.focusAreas && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Areas de Foco:</p>
                <p className="text-sm text-muted-foreground">{pdi.focusAreas}</p>
              </div>
            )}

            <div className="mt-4 text-sm text-muted-foreground">
              {pdi.actions.length} acoes planejadas
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Dialog de Novo PDI
function NewPDIDialog({
  open,
  onOpenChange,
  onSuccess,
  currentUserId,
  userName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  currentUserId: string;
  userName: string;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [objectives, setObjectives] = useState('');
  const [focusAreas, setFocusAreas] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      await pdisApi.create({
        title,
        description,
        objectives,
        focusAreas,
        endDate,
        employeeId: currentUserId,
        employeeName: userName || 'Usuário Atual',
      });
      onOpenChange(false);
      onSuccess();
      // Reset form
      setTitle('');
      setDescription('');
      setObjectives('');
      setFocusAreas('');
      setEndDate('');
    } catch (error: unknown) {
      console.error('Erro ao criar PDI:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo PDI</DialogTitle>
          <DialogDescription>
            Crie um novo Plano de Desenvolvimento Individual
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titulo</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Desenvolvimento de Lideranca"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descricao</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo geral do PDI..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objectives">Objetivos</Label>
            <Textarea
              id="objectives"
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="Liste os objetivos especificos..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="focusAreas">Areas de Foco</Label>
            <Input
              id="focusAreas"
              value={focusAreas}
              onChange={(e) => setFocusAreas(e.target.value)}
              placeholder="Ex: Comunicacao, Gestao de Projetos"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Data Limite</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!title || saving}>
            {saving ? 'Criando...' : 'Criar PDI'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
