'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Save,
  Send,
  User,
  Calendar,
  AlertCircle,
  Info,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { evaluationsApi, Evaluation, EvaluationAnswer } from '@/lib/api/performance';
import { getErrorMessage } from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

interface FormQuestion {
  id: string;
  text: string;
  section: string;
  type: 'SCALE' | 'TEXT';
  weight: number;
  required: boolean;
  answerId?: string;
  questionOrder?: number;
}

export default function EvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const { user } = useAuthStore();
  const evaluationId = params.id as string;

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, EvaluationAnswer>>({});
  const [feedback, setFeedback] = useState('');
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadEvaluation = async () => {
      try {
        setLoading(true);
        const data = await evaluationsApi.get(evaluationId);
        setEvaluation(data);

        if (data.answers && data.answers.length > 0) {
          const derivedQuestions: FormQuestion[] = data.answers.map(ans => ({
            id: ans.questionId,
            text: ans.questionText,
            section: ans.sectionName,
            type: ans.weight > 0 ? 'SCALE' : 'TEXT',
            weight: ans.weight,
            required: ans.weight > 0,
            answerId: ans.id,
            questionOrder: 0
          }));

          setQuestions(derivedQuestions);

          const existingAnswers: Record<string, EvaluationAnswer> = {};
          data.answers.forEach((answer) => {
            existingAnswers[answer.questionId] = answer;
          });
          setAnswers(existingAnswers);
        }

        setFeedback(data.overallFeedback || '');
        setStrengths(data.strengths || '');
        setImprovements(data.areasForImprovement || '');

        if (data.status === 'PENDING') {
          await evaluationsApi.start(evaluationId);
        }
      } catch (error: unknown) {
        console.error('Erro ao carregar avaliacao:', error);
        toast({
          title: 'Erro ao carregar avaliacao',
          description: getErrorMessage(error),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadEvaluation();
  }, [evaluationId, toast]);

  const handleScoreChange = (questionId: string, score: number) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        id: question.answerId,
        questionId,
        questionText: question.text,
        sectionName: question.section,
        score,
        weight: question.weight,
      },
    }));
  };

  const handleTextChange = (questionId: string, text: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        id: question.answerId,
        questionId,
        questionText: question.text,
        sectionName: question.section,
        textAnswer: text,
        weight: question.weight,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await evaluationsApi.saveAnswers(evaluationId, Object.values(answers));
      toast({
        title: 'Respostas salvas',
        description: 'A avaliação foi salva como rascunho.',
      });
    } catch (error: unknown) {
      toast({
        title: 'Erro ao salvar',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    const confirmed = await confirm({
      title: 'Finalizar Avaliação',
      description: 'Após submeter, os dados serão consolidados e não poderão mais ser alterados. Confirmar envio?',
      confirmLabel: 'Confirmar Submissão'
    });

    if (!confirmed) return;

    try {
      setSubmitting(true);
      await evaluationsApi.saveAnswers(evaluationId, Object.values(answers));
      await evaluationsApi.submit(evaluationId, {
        feedback,
        strengths,
        improvements,
      });
      toast({
        title: 'Avaliação submetida!',
        description: 'Seu feedback foi enviado com sucesso.',
      });
      router.push('/performance');
    } catch (error: unknown) {
      toast({
        title: 'Erro ao submeter',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const progress = useMemo(() => {
    if (questions.length === 0) return 0;
    const required = questions.filter((q) => q.required);
    if (required.length === 0) return 100;
    const answered = required.filter((q) => answers[q.id]?.score !== undefined || (answers[q.id]?.textAnswer && answers[q.id].textAnswer!.length > 5));
    return (answered.length / required.length) * 100;
  }, [questions, answers]);

  const groupedQuestions = useMemo(() => {
    return questions.reduce((acc, question) => {
      if (!acc[question.section]) {
        acc[question.section] = [];
      }
      acc[question.section].push(question);
      return acc;
    }, {} as Record<string, FormQuestion[]>);
  }, [questions]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 uppercase text-[10px] tracking-wider px-3 py-1">Pendente</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 uppercase text-[10px] tracking-wider px-3 py-1">Em Andamento</Badge>;
      case 'SUBMITTED':
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200 uppercase text-[10px] tracking-wider px-3 py-1">Submetida</Badge>;
      case 'CALIBRATED':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200 uppercase text-[10px] tracking-wider px-3 py-1">Calibrada</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 uppercase text-[10px] tracking-wider px-3 py-1">Concluída</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground text-sm font-medium">Carregando avaliação...</p>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] space-y-6 text-center">
        <div className="p-4 rounded-full bg-muted/50">
          <AlertCircle className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">Avaliação não encontrada</h2>
          <p className="text-muted-foreground max-w-[400px]">O link pode estar expirado ou você não tem permissão para acessá-lo.</p>
        </div>
        <Link href="/performance">
          <Button>Voltar para Dashboard</Button>
        </Link>
      </div>
    );
  }

  const isReadOnly = ['COMPLETED', 'SUBMITTED', 'CALIBRATED'].includes(evaluation.status);
  const isSelfEvaluation = evaluation.evaluatorType === 'SELF';

  return (
    <div className="w-full max-w-[1600px] mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500">

      {/* Top Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link href="/performance" className="hover:text-foreground transition-colors py-2 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Performance
        </Link>
      </div>

      {/* Hero Header Card */}
      <Card className="border-none shadow-md bg-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* User Info Section */}
            <div className="flex-1 p-8 flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-muted shadow-sm">
                <AvatarImage src={isSelfEvaluation ? user?.avatarUrl : undefined} />
                <AvatarFallback className="text-2xl font-bold bg-primary/5 text-primary">
                  {getInitials(evaluation.employeeName || 'Colaborador')}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="flex items-center gap-3 mb-1">
                  <Badge variant="secondary" className="text-xs font-normal">
                    {evaluation.evaluatorType === 'SELF' ? 'Autoavaliação' :
                      evaluation.evaluatorType === 'MANAGER' ? 'Avaliação do Gestor' : 'Avaliação de Pares'}
                  </Badge>
                  {getStatusBadge(evaluation.status)}
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {evaluation.employeeName}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-1">
                  <div className="flex items-center gap-1.5">
                    <Target className="h-4 w-4" />
                    <span>{evaluation.cycleName}</span>
                  </div>
                  {evaluation.dueDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>Prazo: {new Date(evaluation.dueDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Score/Status Section (Right Side) */}
            {(evaluation.status === 'COMPLETED' || evaluation.status === 'CALIBRATED') && evaluation.finalScore ? (
              <div className="w-full md:w-64 bg-primary/5 border-l border-primary/10 p-8 flex flex-col items-center justify-center text-center">
                <span className="text-xs uppercase font-bold tracking-widest text-primary/70 mb-1">Nota Final</span>
                <span className="text-5xl font-black text-primary">{evaluation.finalScore.toFixed(1)}</span>
                {evaluation.calibratedScore && (
                  <span className="text-xs font-medium text-muted-foreground mt-2 bg-white px-2 py-1 rounded-full shadow-sm">
                    Calibrada: {evaluation.calibratedScore.toFixed(1)}
                  </span>
                )}
              </div>
            ) : (
              <div className={cn(
                "w-full md:w-80 p-8 border-t md:border-t-0 md:border-l border-border bg-gray-50/50 flex flex-col justify-center",
                progress >= 100 ? "bg-emerald-50/50" : ""
              )}>
                <div className="flex justify-between items-end mb-2">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Progresso</h3>
                  <span className={cn("text-2xl font-bold", progress >= 100 ? "text-emerald-600" : "text-primary")}>
                    {progress.toFixed(0)}%
                  </span>
                </div>
                <Progress value={progress} className={cn("h-3", progress >= 100 ? "[&>div]:bg-emerald-500" : "")} />
                <p className="text-xs text-muted-foreground mt-3">
                  {progress < 100
                    ? `Responda ${questions.filter(q => q.required && !answers[q.id]?.score).length} perguntas obrigatórias para enviar.`
                    : "Todas as perguntas respondidas!"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-12 gap-8">

        {/* Main Content: Questions Form */}
        <div className="col-span-12 lg:col-span-9 space-y-8">

          <div className="space-y-8">
            {Object.entries(groupedQuestions).length > 0 ? (
              Object.entries(groupedQuestions).map(([section, sectionQuestions]) => (
                <div key={section} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-1 bg-primary rounded-full"></div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">{section}</h2>
                  </div>

                  <div className="grid gap-6">
                    {sectionQuestions.map((question) => (
                      <Card key={question.id} className={cn(
                        "shadow-sm transition-all duration-200 border-l-4",
                        answers[question.id]?.score !== undefined ? "border-l-primary" : "border-l-transparent hover:border-l-muted-foreground/30"
                      )}>
                        <CardHeader className="pb-4">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="space-y-2">
                              <CardTitle className="text-base font-semibold leading-relaxed text-foreground/90">
                                {question.text}
                                {question.required && <span className="text-destructive ml-1" title="Obrigatória">*</span>}
                              </CardTitle>

                              {question.type === 'SCALE' && (
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-[10px] font-normal opacity-70">
                                    Escala 0-5
                                  </Badge>
                                  {question.weight > 1 && (
                                    <Badge variant="outline" className="text-[10px] font-normal border-primary/20 text-primary">
                                      Peso x{question.weight}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-8">
                          {question.type === 'SCALE' ? (
                            <div className="space-y-6 max-w-3xl">
                              <Slider
                                value={[answers[question.id]?.score || 0]}
                                onValueChange={([value]) => !isReadOnly && handleScoreChange(question.id, value)}
                                max={5}
                                min={0}
                                step={1}
                                disabled={isReadOnly}
                                className="w-full py-4 cursor-pointer"
                              />

                              <div className="grid grid-cols-6 gap-2 sm:gap-4">
                                {[0, 1, 2, 3, 4, 5].map((val) => (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => !isReadOnly && handleScoreChange(question.id, val)}
                                    disabled={isReadOnly}
                                    className={cn(
                                      "group flex flex-col items-center gap-2 transition-all",
                                      isReadOnly ? "cursor-default" : "cursor-pointer"
                                    )}
                                  >
                                    <div className={cn(
                                      "h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all border-2",
                                      answers[question.id]?.score === val
                                        ? "bg-primary text-primary-foreground border-primary shadow-md scale-110"
                                        : "bg-white text-muted-foreground border-border group-hover:border-primary/50 group-hover:bg-primary/5"
                                    )}>
                                      {val}
                                    </div>
                                    <span className={cn(
                                      "text-[10px] uppercase font-bold tracking-wider transition-colors text-center hidden sm:block",
                                      answers[question.id]?.score === val ? "text-primary" : "text-muted-foreground/40"
                                    )}>
                                      {val === 0 ? "N/A" : val === 1 ? "Ruim" : val === 5 ? "Excel" : "-"}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Textarea
                                value={answers[question.id]?.textAnswer || ''}
                                onChange={(e) => handleTextChange(question.id, e.target.value)}
                                placeholder="Digite sua resposta detalhada aqui..."
                                className="min-h-[140px] resize-none text-base p-4 focus-visible:ring-primary/20"
                                disabled={isReadOnly}
                              />
                              <div className="flex justify-end text-xs text-muted-foreground font-medium">
                                {answers[question.id]?.textAnswer?.length || 0} caracteres
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
                <Info className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">Nenhuma pergunta encontrada</h3>
                <p className="text-sm text-muted-foreground/70">Este formulário não possui perguntas configuradas.</p>
              </div>
            )}
          </div>

          <Separator className="my-8" />

          {/* Qualitative Feedback Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-10 w-1 bg-primary rounded-full"></div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Feedback Qualitativo</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm border-l-4 border-l-emerald-500">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <span className="text-xl">🌟</span> Pontos Fortes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    placeholder="Liste as principais qualidades e entregas..."
                    className="min-h-[160px] resize-none focus-visible:ring-emerald-500/20"
                    disabled={isReadOnly}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-sm border-l-4 border-l-amber-500">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <span className="text-xl">📈</span> Oportunidades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                    placeholder="Áreas para desenvolvimento e melhoria..."
                    className="min-h-[160px] resize-none focus-visible:ring-amber-500/20"
                    disabled={isReadOnly}
                  />
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Considerações Finais</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Feedback geral sobre o desempenho..."
                  className="min-h-[120px] resize-none"
                  disabled={isReadOnly}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar Actions (Sticky) */}
        <div className="col-span-12 lg:col-span-3">
          <div className="sticky top-8 space-y-6">

            {!isReadOnly && (
              <Card className="shadow-lg border-primary/20 bg-card overflow-hidden">
                <div className="h-1 w-full bg-primary" />
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Ações</CardTitle>
                  <CardDescription className="text-xs">
                    Dados salvos como rascunho automaticamente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <Button
                    className="w-full h-12 text-base font-bold shadow-md hover:shadow-lg transition-all"
                    onClick={handleSubmit}
                    disabled={progress < 100 || submitting}
                  >
                    {submitting ? 'Enviando...' : 'Finalizar e Enviar'}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full h-10 border-muted-foreground/30 hover:bg-muted/50"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Salvando...' : 'Salvar Rascunho'}
                    <Save className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-sm bg-muted/10 border-muted">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Resumo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Avaliado</p>
                  <p className="font-medium truncate">{evaluation.employeeName}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Ciclo</p>
                  <p className="font-medium truncate">{evaluation.cycleName}</p>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Perguntas</span>
                  <span className="font-bold bg-muted px-2 py-0.5 rounded">{questions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Obrigatórias</span>
                  <span className="font-bold bg-muted px-2 py-0.5 rounded">{questions.filter(q => q.required).length}</span>
                </div>
              </CardContent>
            </Card>

            <div className="text-[10px] text-center text-muted-foreground opacity-60">
              ID da Avaliação: <br /> {evaluationId}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
