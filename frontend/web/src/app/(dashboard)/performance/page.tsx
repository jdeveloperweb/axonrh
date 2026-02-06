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
  Plus,
  MessageCircle,
  User,
} from 'lucide-react';
import Link from 'next/link';
import {
  cyclesApi,
  evaluationsApi,
  goalsApi,
  pdisApi,
  discApi,
  EvaluationCycle,
  Evaluation,
  Goal,
  PDI,
  DiscEvaluation,
  DiscProfileType,
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
  const [latestDisc, setLatestDisc] = useState<DiscEvaluation | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock user ID - em producao viria do contexto de autenticacao
  const currentUserId = 'current-user-id';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [cycles, evaluations, goals, pdis, gStats, pStats, disc] = await Promise.all([
        cyclesApi.getActive(),
        evaluationsApi.getPending(currentUserId),
        goalsApi.getByEmployee(currentUserId),
        pdisApi.getActive(currentUserId),
        goalsApi.getStatistics(currentUserId),
        pdisApi.getManagerStatistics(currentUserId),
        discApi.getLatest(currentUserId).catch(() => null),
      ]);

      setActiveCycles(cycles);
      setPendingEvaluations(evaluations);
      setMyGoals(goals);
      setMyPDIs(pdis);
      setGoalStats(gStats);
      setPDIStats(pStats);
      setLatestDisc(disc);
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

  const getDiscInsight = (profile: string) => {
    switch (profile) {
      case 'DOMINANCE':
        return {
          title: 'Foco em Execução',
          tip: 'Você performa melhor em ambientes desafiadores. Tente delegar tarefas operacionais para focar na estratégia.',
          color: 'text-red-600',
          bg: 'bg-red-50'
        };
      case 'INFLUENCE':
        return {
          title: 'Poder de Colaboração',
          tip: 'Sua rede de contatos é seu maior ativo. Use sua influência para alinhar times em projetos complexos.',
          color: 'text-yellow-600',
          bg: 'bg-yellow-50'
        };
      case 'STEADINESS':
        return {
          title: 'Estabilidade e Entrega',
          tip: 'Sua consistência traz segurança ao time. Procure participar de planejamentos de longo prazo.',
          color: 'text-green-600',
          bg: 'bg-green-50'
        };
      case 'CONSCIENTIOUSNESS':
        return {
          title: 'Precisão Analítica',
          tip: 'Sua atenção aos detalhes garante a qualidade. Lidere processos de auditoria ou melhoria contínua.',
          color: 'text-blue-600',
          bg: 'bg-blue-50'
        };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const discInsight = latestDisc ? getDiscInsight(latestDisc.primaryProfile) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Gestão de Desempenho</h1>
          <p className="text-muted-foreground text-lg">
            Sua jornada de crescimento e performance na organização
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/performance/goals">
            <Button variant="outline" className="h-11 px-6 font-bold">
              <Target className="h-4 w-4 mr-2" />
              Minhas Metas
            </Button>
          </Link>
          <Link href="/performance/evaluations">
            <Button className="h-11 px-6 font-bold shadow-lg shadow-primary/20">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Avaliações
            </Button>
          </Link>
        </div>
      </div>

      {/* Career Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* main Career Insight */}
        <Card className="lg:col-span-2 overflow-hidden border-none shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-bold">
              <BrainCircuit className="h-6 w-6 text-primary-foreground" />
              Insights de Carreira
            </CardTitle>
            <CardDescription className="text-slate-400">
              Sugestões personalizadas baseadas em seu perfil e resultados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {discInsight && (
                <div className={`p-4 rounded-2xl ${discInsight.bg} ${discInsight.color} border border-white/10`}>
                  <h4 className="font-black uppercase text-xs tracking-widest mb-2 opacity-70">Perfil Comportamental</h4>
                  <p className="text-xl font-bold mb-1">{discInsight.title}</p>
                  <p className="text-sm opacity-90">{discInsight.tip}</p>
                </div>
              )}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <h4 className="font-black uppercase text-xs tracking-widest mb-2 text-primary">Próximo Passo</h4>
                <p className="text-xl font-bold mb-1">PDI em Foco</p>
                <p className="text-sm text-slate-300">
                  {myPDIs.length > 0
                    ? `Você tem ${myPDIs.length} plano(s) ativo(s). Foque nas ações desta semana.`
                    : 'Crie um novo PDI para acelerar suas promoções e desenvolvimento.'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-3xl font-black">{goalStats?.averageProgress?.toFixed(0) || 0}%</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Progresso das Metas</p>
                </div>
                <div className="h-12 w-[1px] bg-white/10" />
                <div className="text-center">
                  <p className="text-3xl font-black">{pendingEvaluations.length}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Pendências</p>
                </div>
              </div>
              <Link href="/performance/reports">
                <Button variant="ghost" className="text-white hover:bg-white/10 font-bold">
                  Ver Relatório Completo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Mini Stats Grid */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="hover:shadow-lg transition-all border-l-4 border-l-amber-500">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                Status das Metas
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-black">{goalStats?.inProgress || 0}</p>
                  <p className="text-xs text-muted-foreground font-medium">Ativas no período</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-destructive">{goalStats?.atRisk || 0}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Em Risco</p>
                </div>
              </div>
              <Progress value={goalStats?.averageProgress || 0} className="mt-4 h-2" />
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all border-l-4 border-l-primary">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                Desenvolvimento (PDI)
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 text-center">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    className="text-slate-100"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="34"
                    cx="40"
                    cy="40"
                  />
                  <circle
                    className="text-primary"
                    strokeWidth="8"
                    strokeDasharray={213.6}
                    strokeDashoffset={213.6 - (213.6 * (pdiStats?.averageProgress || 0)) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="34"
                    cx="40"
                    cy="40"
                  />
                </svg>
                <span className="absolute text-xl font-black">
                  {pdiStats?.active || 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">PDIs Ativos</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ciclos Ativos - Visual Update */}
      {activeCycles.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Cíclos de Avaliação
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeCycles.map((cycle) => (
              <Card key={cycle.id} className="group hover:border-primary/50 transition-all border-2">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                      <Star className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{cycle.name}</h3>
                      <p className="text-xs text-muted-foreground font-medium">
                        {new Date(cycle.startDate).toLocaleDateString('pt-BR')} até {new Date(cycle.endDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <Link href={`/performance/cycles/${cycle.id}`}>
                    <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
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
