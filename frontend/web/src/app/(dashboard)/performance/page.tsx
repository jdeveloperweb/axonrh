'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  ClipboardCheck,
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Star,
  BrainCircuit,
} from 'lucide-react';
import Link from 'next/link';
import {
  cyclesApi,
  evaluationsApi,
  goalsApi,
  pdisApi,
  EvaluationCycle,
  Evaluation,
  Goal,
  PDI,
  GoalStatistics,
  PDIStatistics,
} from '@/lib/api/performance';

export default function PerformanceDashboard() {
  const [activeCycles, setActiveCycles] = useState<EvaluationCycle[]>([]);
  const [pendingEvaluations, setPendingEvaluations] = useState<Evaluation[]>([]);
  const [myGoals, setMyGoals] = useState<Goal[]>([]);
  const [myPDIs, setMyPDIs] = useState<PDI[]>([]);
  const [goalStats, setGoalStats] = useState<GoalStatistics | null>(null);
  const [pdiStats, setPDIStats] = useState<PDIStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock user ID - em producao viria do contexto de autenticacao
  const currentUserId = 'current-user-id';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [cycles, evaluations, goals, pdis, gStats, pStats] = await Promise.all([
        cyclesApi.getActive(),
        evaluationsApi.getPending(currentUserId),
        goalsApi.getByEmployee(currentUserId),
        pdisApi.getActive(currentUserId),
        goalsApi.getStatistics(currentUserId),
        pdisApi.getManagerStatistics(currentUserId),
      ]);

      setActiveCycles(cycles);
      setPendingEvaluations(evaluations);
      setMyGoals(goals);
      setMyPDIs(pdis);
      setGoalStats(gStats);
      setPDIStats(pStats);
    } catch (error: unknown) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PENDING: { label: 'Pendente', variant: 'secondary' },
      IN_PROGRESS: { label: 'Em Andamento', variant: 'default' },
      COMPLETED: { label: 'Concluido', variant: 'outline' },
      AT_RISK: { label: 'Em Risco', variant: 'destructive' },
      ACTIVE: { label: 'Ativo', variant: 'default' },
    };
    const config = statusConfig[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestao de Desempenho</h1>
          <p className="text-muted-foreground">
            Acompanhe avaliacoes, metas e desenvolvimento
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/performance/goals">
            <Button variant="outline">
              <Target className="h-4 w-4 mr-2" />
              Minhas Metas
            </Button>
          </Link>
          <Link href="/performance/evaluations">
            <Button>
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Avaliacoes
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avaliacoes Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingEvaluations.length}</div>
            <p className="text-xs text-muted-foreground">
              para realizar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Metas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goalStats?.inProgress || 0}</div>
            <Progress value={goalStats?.averageProgress || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {goalStats?.averageProgress?.toFixed(0) || 0}% progresso medio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              PDIs Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pdiStats?.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              {pdiStats?.pendingApproval || 0} aguardando aprovacao
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Metas em Risco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {goalStats?.atRisk || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              requerem atencao
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ciclos Ativos */}
      {activeCycles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Ciclos de Avaliacao Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeCycles.map((cycle) => (
                <div
                  key={cycle.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-semibold">{cycle.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(cycle.startDate).toLocaleDateString('pt-BR')} -{' '}
                      {new Date(cycle.endDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(cycle.status)}
                    <Link href={`/performance/cycles/${cycle.id}`}>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs de Conteudo */}
      <Tabs defaultValue="evaluations">
        <TabsList>
          <TabsTrigger value="evaluations">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Avaliacoes Pendentes
          </TabsTrigger>
          <TabsTrigger value="goals">
            <Target className="h-4 w-4 mr-2" />
            Minhas Metas
          </TabsTrigger>
          <TabsTrigger value="pdis">
            <TrendingUp className="h-4 w-4 mr-2" />
            Meus PDIs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="evaluations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Avaliacoes para Realizar</CardTitle>
              <CardDescription>
                Avaliacoes pendentes que voce precisa completar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingEvaluations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>Nenhuma avaliacao pendente!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingEvaluations.map((evaluation) => (
                    <div
                      key={evaluation.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{evaluation.employeeName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {evaluation.evaluationType === 'SELF' ? 'Autoavaliacao' :
                              evaluation.evaluationType === 'MANAGER' ? 'Avaliacao de Gestor' :
                                evaluation.evaluationType === 'PEER' ? 'Avaliacao de Pares' :
                                  'Avaliacao 360'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {evaluation.dueDate && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(evaluation.dueDate).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                        {getStatusBadge(evaluation.status)}
                        <Link href={`/performance/evaluations/${evaluation.id}`}>
                          <Button size="sm">Avaliar</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Minhas Metas</CardTitle>
                <CardDescription>
                  Acompanhe o progresso das suas metas
                </CardDescription>
              </div>
              <Link href="/performance/goals/new">
                <Button size="sm">Nova Meta</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {myGoals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4" />
                  <p>Nenhuma meta definida</p>
                  <Link href="/performance/goals/new">
                    <Button variant="ghost">Criar primeira meta</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myGoals.slice(0, 5).map((goal) => (
                    <div
                      key={goal.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{goal.title}</h4>
                          {goal.status === 'AT_RISK' && (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                        {getStatusBadge(goal.status)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">{goal.progressPercentage.toFixed(0)}%</span>
                        </div>
                        <Progress value={goal.progressPercentage} />
                        {goal.dueDate && (
                          <p className="text-xs text-muted-foreground">
                            Prazo: {new Date(goal.dueDate).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {myGoals.length > 5 && (
                    <Link href="/performance/goals">
                      <Button variant="ghost" className="w-full">
                        Ver todas as {myGoals.length} metas
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pdis" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Meus PDIs</CardTitle>
                <CardDescription>
                  Planos de Desenvolvimento Individual
                </CardDescription>
              </div>
              <Link href="/performance/pdi">
                <Button size="sm">Ver Todos</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {myPDIs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                  <p>Nenhum PDI ativo</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myPDIs.map((pdi) => (
                    <div
                      key={pdi.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{pdi.title}</h4>
                        {getStatusBadge(pdi.status)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">{pdi.overallProgress}%</span>
                        </div>
                        <Progress value={pdi.overallProgress} />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{pdi.actions.length} acoes</span>
                          {pdi.endDate && (
                            <span>Prazo: {new Date(pdi.endDate).toLocaleDateString('pt-BR')}</span>
                          )}
                        </div>
                      </div>
                      <Link href={`/performance/pdi/${pdi.id}`}>
                        <Button variant="ghost" size="sm" className="mt-2">
                          Ver detalhes
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/performance/ninebox">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5" />
                Matriz 9Box
              </CardTitle>
              <CardDescription>
                Visualize o mapeamento de talentos
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/performance/calibration">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Calibracao
              </CardTitle>
              <CardDescription>
                Sessoes de calibracao de notas
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/performance/feedback">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Feedback Continuo
              </CardTitle>
              <CardDescription>
                Dar e receber feedback
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/performance/disc">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BrainCircuit className="h-5 w-5" />
                Perfil DISC
              </CardTitle>
              <CardDescription>
                Analise Comportamental
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
