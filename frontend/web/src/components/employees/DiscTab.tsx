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

const profileDescriptions: Record<string, { title: string; shortTitle: string; subtitle: string; description: string; color: string; strengths: string[]; tips: string[] }> = {
  DOMINANCE: {
    title: 'Dominante',
    shortTitle: 'D',
    subtitle: 'Foco em Resultados e Controle',
    description: 'Focado em resultados, direto e assertivo. Gosta de desafios e de assumir o controle das situacoes.',
    color: '#ef4444',
    strengths: ['Tomada de decisao rapida', 'Visao orientada a metas', 'Disposicao para assumir riscos', 'Capacidade de liderar sob pressao'],
    tips: ['Pratique ouvir mais os outros', 'Seja paciente com processos detalhados', 'Delegue e confie na equipe', 'Celebre os pequenos progressos'],
  },
  INFLUENCE: {
    title: 'Influente',
    shortTitle: 'I',
    subtitle: 'Foco em Pessoas e Persuasão',
    description: 'Comunicativo, entusiasta e persuasivo. Gosta de interagir com pessoas e criar um ambiente positivo.',
    color: '#eab308',
    strengths: ['Otimismo e entusiasmo', 'Facilidade em persuadir', 'Criatividade na solucao de problemas', 'Habilidade de networking'],
    tips: ['Foque nos detalhes e follow-up', 'Gerencie melhor seu tempo', 'Conclua projetos antes de iniciar novos', 'Documente decisoes importantes'],
  },
  STEADINESS: {
    title: 'Estável',
    shortTitle: 'S',
    subtitle: 'Foco em Colaboração e Ritmo',
    description: 'Calmo, paciente e leal. Valoriza a cooperacao e a estabilidade no ambiente de trabalho.',
    color: '#22c55e',
    strengths: ['Excelente ouvinte', 'Persistencia e consistencia', 'Habilidade conciliadora', 'Confiavel e leal'],
    tips: ['Aceite mudancas com mais abertura', 'Expresse suas opinioes com mais frequencia', 'Nao evite conflitos necessarios', 'Busque novos desafios'],
  },
  CONSCIENTIOUSNESS: {
    title: 'Conforme',
    shortTitle: 'C',
    subtitle: 'Foco em Detalhes e Qualidade',
    description: 'Analitico, preciso e detalhista. Valoriza a qualidade, regras e procedimentos.',
    color: '#3b82f6',
    strengths: ['Analise profunda', 'Padroes elevados de qualidade', 'Planejamento sistematico', 'Atencao aos detalhes'],
    tips: ['Nao busque a perfeicao absoluta', 'Tome decisoes com informacoes suficientes', 'Foque no quadro geral', 'Seja mais flexivel com processos'],
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

  // Load history and latest result
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
      } catch (error) {
        // No evaluations found - this is ok (404 expected if no result)
        console.log('Sem resultados DISC anteriores:', error);
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
      if (!user?.id) {
        toast({
          title: 'Erro',
          description: 'Sua sessão expirou. Por favor, faça login novamente.',
          variant: 'destructive',
        });
        return;
      }

      setSending(true);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // 7 days from now

      await discApi.assignBulk({
        employeeIds: [employeeId],
        employeeNames: { [employeeId]: employeeName },
        assignedBy: user.id,
        assignedByName: user.name || user.email || 'Admin',
        dueDate: dueDate.toISOString().split('T')[0],
      });

      toast({
        title: 'Sucesso',
        description: 'Avaliação DISC enviada para o colaborador',
      });
      loadData();
    } catch (error: any) {
      console.error('Erro ao atribuir DISC:', error);
      toast({
        title: 'Erro',
        description: error?.response?.data?.message || error.message || 'Falha ao enviar avaliação',
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
            <div className="p-4 bg-amber-100 rounded-full animate-pulse">
              <BrainCircuit className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-900">Avaliação DISC Pendente</h3>
              <p className="text-amber-700">
                O colaborador tem uma avaliação DISC pendente enviada em {formatDate(pending.createdAt)}.
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
            <div className="p-4 bg-slate-100 rounded-full">
              <BrainCircuit className="h-8 w-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Nenhuma Avaliação DISC</h3>
              <p className="text-muted-foreground">
                Este colaborador ainda não completou uma avaliação DISC.
              </p>
            </div>
            <Button onClick={handleSendEvaluation} disabled={sending} className="bg-orange-500 hover:bg-orange-600 text-white border-none shadow-md">
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Enviando...' : 'Enviar Avaliação DISC'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show result
  const profileInfo = profileDescriptions[latestResult.primaryProfile] || profileDescriptions['DOMINANCE'];
  const chartData = [
    { subject: 'DOMINÂNCIA', A: latestResult.dScore, fullMark: 100 },
    { subject: 'INFLUÊNCIA', A: latestResult.iScore, fullMark: 100 },
    { subject: 'ESTABILIDADE', A: latestResult.sScore, fullMark: 100 },
    { subject: 'CONFORMIDADE', A: latestResult.cScore, fullMark: 100 },
  ];

  return (
    <div className="space-y-6">
      {/* Main Result Card */}
      <Card className="overflow-hidden border-none shadow-2xl bg-slate-950 text-white rounded-[2.5rem] relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-10 flex flex-col justify-center space-y-6">
              <div className="space-y-4">
                <Badge className="text-[10px] font-black uppercase tracking-widest bg-primary hover:bg-primary border-none text-white px-3 py-1">
                  Perfil Predominante
                </Badge>
                <h2 className="text-5xl font-black tracking-tighter uppercase leading-[0.85]">
                  {profileInfo.title}
                  <span className="block text-primary text-2xl mt-2 font-black opacity-90 tracking-normal italic leading-none lowercase">
                    ({profileInfo.shortTitle.toLowerCase()})
                  </span>
                </h2>
              </div>

              <div className="space-y-4">
                <p className="text-xl font-bold text-slate-100 leading-tight border-l-4 border-primary pl-4">
                  "{profileInfo.description}"
                </p>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                  Avaliação concluída em {formatDate(latestResult.completedAt)}
                </p>
              </div>

              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={handleSendEvaluation} disabled={sending} className="text-white border-white/20 hover:bg-white/10 h-10 rounded-xl font-bold">
                  <Send className="h-4 w-4 mr-2" />
                  Solicitar Nova Avaliação
                </Button>
              </div>
            </div>

            <div className="bg-[#020617] p-8 flex items-center justify-center border-l border-white/5 relative overflow-hidden min-h-[350px]">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-primary/20 blur-[80px] rounded-full animate-pulse pointer-events-none" />

              <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="#1e293b" strokeWidth={1} />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#64748b', fontWeight: '900', fontSize: 9, letterSpacing: '0.1em' }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    name="Perfil"
                    dataKey="A"
                    stroke={profileInfo.color}
                    strokeWidth={4}
                    fill={profileInfo.color}
                    fillOpacity={0.4}
                    dot={{ r: 5, fill: '#fff', strokeWidth: 2, fillOpacity: 1, stroke: profileInfo.color }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-none shadow-xl bg-white rounded-[2rem]">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 border-b pb-3">Scores Detalhados</h4>
          <div className="space-y-6">
            {[
              { label: 'DOMINÂNCIA (D)', value: latestResult.dScore, color: '#ef4444' },
              { label: 'INFLUÊNCIA (I)', value: latestResult.iScore, color: '#eab308' },
              { label: 'ESTABILIDADE (S)', value: latestResult.sScore, color: '#22c55e' },
              { label: 'CONFORMIDADE (C)', value: latestResult.cScore, color: '#3b82f6' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between items-end mb-1.5">
                  <span className="font-black text-slate-900 text-[10px] tracking-tight">{item.label}</span>
                  <span className="font-black text-lg tabular-nums leading-none" style={{ color: item.color }}>{item.value}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${item.value}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 border-none shadow-xl bg-emerald-50/30 border border-emerald-100/50 rounded-[2rem]">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 mb-6 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Principais Pontos Fortes
          </h4>
          <div className="space-y-3">
            {profileInfo.strengths.slice(0, 4).map((strength, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-emerald-100 shadow-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="font-bold text-slate-700 text-xs">{strength}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* History Toggle */}
      {
        history.length > 1 && (
          <Button
            variant="ghost"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full"
          >
            <History className="h-4 w-4 mr-2" />
            {showHistory ? 'Ocultar Historico' : `Ver Historico (${history.length - 1} anteriores)`}
            <ArrowRight className={`h-4 w-4 ml-2 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
          </Button>
        )
      }

      {/* History */}
      {
        showHistory && history.length > 1 && (
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
        )
      }
    </div>
  );
}
