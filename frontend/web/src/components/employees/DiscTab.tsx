'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BrainCircuit,
  Send,
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { discApi, DiscEvaluation, DiscAssignment } from '@/lib/api/performance';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface DiscTabProps {
  employeeId: string;
  employeeName: string;
}

const profileDescriptions: Record<string, { title: string; description: string; color: string }> = {
  DOMINANCE: {
    title: 'Dominante (D)',
    description: 'Focado em resultados, direto e assertivo. Gosta de desafios e de assumir o controle.',
    color: '#ef4444',
  },
  INFLUENCE: {
    title: 'Influente (I)',
    description: 'Comunicativo, entusiasta e persuasivo. Gosta de interagir com pessoas e criar ambiente positivo.',
    color: '#eab308',
  },
  STEADINESS: {
    title: 'Estavel (S)',
    description: 'Calmo, paciente e leal. Valoriza a cooperacao, estabilidade e trabalho em equipe.',
    color: '#22c55e',
  },
  CONSCIENTIOUSNESS: {
    title: 'Conforme (C)',
    description: 'Analitico, preciso e detalhista. Valoriza qualidade, regras e procedimentos.',
    color: '#3b82f6',
  },
};

export function DiscTab({ employeeId, employeeName }: DiscTabProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [latestResult, setLatestResult] = useState<DiscEvaluation | null>(null);
  const [history, setHistory] = useState<DiscEvaluation[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<DiscAssignment[]>([]);
  const [sending, setSending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [pendingRes] = await Promise.all([
        discApi.getPendingForEmployee(employeeId),
      ]);
      setPendingAssignments(pendingRes);

      try {
        const latestRes = await discApi.getLatest(employeeId);
        setLatestResult(latestRes);

        const historyRes = await discApi.getHistory(employeeId);
        setHistory(historyRes);
      } catch {
        // No evaluations found - this is ok
        setLatestResult(null);
        setHistory([]);
      }
    } catch (error) {
      console.error('Error loading DISC data:', error);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendEvaluation = async () => {
    try {
      setSending(true);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // 7 days from now

      await discApi.assign({
        employeeId,
        employeeName,
        assignedBy: user?.id || '',
        assignedByName: user?.name || '',
        dueDate: dueDate.toISOString().split('T')[0],
      });

      toast({
        title: 'Sucesso',
        description: 'Avaliacao DISC enviada para o colaborador',
      });
      loadData();
    } catch (error: unknown) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao enviar avaliacao',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  // Show pending assignment status
  if (pendingAssignments.length > 0) {
    const pending = pendingAssignments[0];
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-amber-100 rounded-full">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-900">Avaliacao DISC Pendente</h3>
              <p className="text-amber-700">
                O colaborador tem uma avaliacao DISC pendente enviada em {formatDate(pending.createdAt)}.
              </p>
              {pending.dueDate && (
                <p className="text-sm text-amber-600 mt-1">
                  Prazo: {formatDate(pending.dueDate)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No result yet
  if (!latestResult) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <BrainCircuit className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Nenhuma Avaliacao DISC</h3>
              <p className="text-muted-foreground">
                Este colaborador ainda nao completou uma avaliacao DISC.
              </p>
            </div>
            <Button onClick={handleSendEvaluation} disabled={sending}>
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Enviando...' : 'Enviar Avaliacao DISC'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show result
  const profileInfo = profileDescriptions[latestResult.primaryProfile];
  const chartData = [
    { subject: 'Dominancia', A: latestResult.dScore, fullMark: 100 },
    { subject: 'Influencia', A: latestResult.iScore, fullMark: 100 },
    { subject: 'Estabilidade', A: latestResult.sScore, fullMark: 100 },
    { subject: 'Conformidade', A: latestResult.cScore, fullMark: 100 },
  ];

  return (
    <div className="space-y-6">
      {/* Main Result Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5" />
                Perfil DISC
              </CardTitle>
              <CardDescription>
                Ultima avaliacao: {formatDate(latestResult.completedAt)}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleSendEvaluation} disabled={sending}>
              <Send className="h-4 w-4 mr-2" />
              Nova Avaliacao
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Badge */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: profileInfo?.color + '20' }}
                >
                  <BrainCircuit className="h-6 w-6" style={{ color: profileInfo?.color }} />
                </div>
                <div>
                  <Badge
                    className="mb-2"
                    style={{ backgroundColor: profileInfo?.color + '20', color: profileInfo?.color }}
                  >
                    {profileInfo?.title}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {profileInfo?.description}
                  </p>
                </div>
              </div>

              {latestResult.secondaryProfile && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Perfil Secundario</p>
                  <Badge variant="outline">
                    {profileDescriptions[latestResult.secondaryProfile]?.title}
                  </Badge>
                </div>
              )}

              {/* Score Bars */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium" style={{ color: '#ef4444' }}>Dominancia (D)</span>
                    <span>{latestResult.dScore}%</span>
                  </div>
                  <Progress value={latestResult.dScore} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium" style={{ color: '#eab308' }}>Influencia (I)</span>
                    <span>{latestResult.iScore}%</span>
                  </div>
                  <Progress value={latestResult.iScore} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium" style={{ color: '#22c55e' }}>Estabilidade (S)</span>
                    <span>{latestResult.sScore}%</span>
                  </div>
                  <Progress value={latestResult.sScore} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium" style={{ color: '#3b82f6' }}>Conformidade (C)</span>
                    <span>{latestResult.cScore}%</span>
                  </div>
                  <Progress value={latestResult.cScore} className="h-2" />
                </div>
              </div>
            </div>

            {/* Radar Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Perfil"
                    dataKey="A"
                    stroke={profileInfo?.color}
                    fill={profileInfo?.color}
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Toggle */}
      {history.length > 1 && (
        <Button
          variant="ghost"
          onClick={() => setShowHistory(!showHistory)}
          className="w-full"
        >
          <History className="h-4 w-4 mr-2" />
          {showHistory ? 'Ocultar Historico' : `Ver Historico (${history.length - 1} anteriores)`}
          <ArrowRight className={`h-4 w-4 ml-2 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
        </Button>
      )}

      {/* History */}
      {showHistory && history.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historico de Avaliacoes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.slice(1).map((evaluation) => {
                const evalProfile = profileDescriptions[evaluation.primaryProfile];
                return (
                  <div
                    key={evaluation.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Badge style={{ backgroundColor: evalProfile?.color + '20', color: evalProfile?.color }}>
                        {evalProfile?.title}
                      </Badge>
                      <div className="text-sm">
                        <span className="text-muted-foreground">D: {evaluation.dScore}%</span>
                        <span className="mx-2 text-muted-foreground">|</span>
                        <span className="text-muted-foreground">I: {evaluation.iScore}%</span>
                        <span className="mx-2 text-muted-foreground">|</span>
                        <span className="text-muted-foreground">S: {evaluation.sScore}%</span>
                        <span className="mx-2 text-muted-foreground">|</span>
                        <span className="text-muted-foreground">C: {evaluation.cScore}%</span>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(evaluation.completedAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
