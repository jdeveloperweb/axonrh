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
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Save,
  Send,
  User,
  Calendar,
  AlertCircle,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { evaluationsApi, Evaluation, EvaluationAnswer } from '@/lib/api/performance';
import { getErrorMessage } from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { cn } from '@/lib/utils';

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
            questionOrder: 0 // Backend doesn't return order in answers, simplified for now
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
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Em Andamento</Badge>;
      case 'SUBMITTED':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Submetida</Badge>;
      case 'CALIBRATED':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Calibrada</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Concluída</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground text-sm">Carregando avaliação...</p>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-semibold">Avaliação não encontrada</h2>
        <p className="text-muted-foreground">O link pode estar expirado ou você não tem permissão para acessá-lo.</p>
        <Link href="/performance">
          <Button variant="outline">Voltar para Performance</Button>
        </Link>
      </div>
    );
  }

  const isReadOnly = ['COMPLETED', 'SUBMITTED', 'CALIBRATED'].includes(evaluation.status);

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 -ml-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Avaliação de Desempenho</h1>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm pl-8">
            <User className="h-4 w-4" />
            <span>{evaluation.employeeName}</span>
            <span className="text-border">|</span>
            <span>{evaluation.cycleName}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-muted-foreground font-medium uppercase">Status</span>
            {getStatusBadge(evaluation.status)}
          </div>
          {evaluation.dueDate && (
            <div className="flex flex-col items-end gap-1 border-l pl-4 border-border">
              <span className="text-xs text-muted-foreground font-medium uppercase">Prazo</span>
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(evaluation.dueDate).toLocaleDateString('pt-BR')}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">

          {/* Progress Section */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Progresso Geral</CardTitle>
                <span className="text-sm font-bold text-primary">{progress.toFixed(0)}%</span>
              </div>
              <CardDescription>
                {progress < 100 ? "Complete as perguntas obrigatórias para enviar." : "Pronto para envio!"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>

          {/* Form Sections */}
          <div className="space-y-8">
            {Object.entries(groupedQuestions).length > 0 ? (
              Object.entries(groupedQuestions).map(([section, sectionQuestions]) => (
                <div key={section} className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <h3 className="text-lg font-semibold tracking-tight">{section}</h3>
                  </div>

                  <div className="grid gap-4">
                    {sectionQuestions.map((question, index) => (
                      <Card key={question.id} className="shadow-sm border-border/60">
                        <CardHeader className="pb-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <CardTitle className="text-base font-medium leading-relaxed">
                                {question.text}
                                {question.required && <span className="text-red-500 ml-1">*</span>}
                              </CardTitle>
                              {question.weight > 1 && (
                                <Badge variant="secondary" className="text-xs font-normal">
                                  Peso x{question.weight}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {question.type === 'SCALE' ? (
                            <div className="space-y-6">
                              <Slider
                                value={[answers[question.id]?.score || 0]}
                                onValueChange={([value]) => !isReadOnly && handleScoreChange(question.id, value)}
                                max={5}
                                min={0}
                                step={1}
                                disabled={isReadOnly}
                                className="w-full"
                              />
                              <div className="flex justify-between w-full px-1">
                                {[0, 1, 2, 3, 4, 5].map((val) => (
                                  <div key={val} className="flex flex-col items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => !isReadOnly && handleScoreChange(question.id, val)}
                                      disabled={isReadOnly}
                                      className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all border",
                                        answers[question.id]?.score === val
                                          ? "bg-primary text-primary-foreground border-primary shadow-sm scale-110"
                                          : "bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground"
                                      )}
                                    >
                                      {val}
                                    </button>
                                    <span className={cn(
                                      "text-[10px] uppercase font-semibold tracking-wider",
                                      answers[question.id]?.score === val ? "text-primary" : "text-muted-foreground/60"
                                    )}>
                                      {val === 0 ? "N/A" : val === 5 ? "Excel" : ""}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Textarea
                                value={answers[question.id]?.textAnswer || ''}
                                onChange={(e) => handleTextChange(question.id, e.target.value)}
                                placeholder="Descreva sua resposta aqui..."
                                className="min-h-[120px] resize-none"
                                disabled={isReadOnly}
                              />
                              <div className="flex justify-end text-xs text-muted-foreground">
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
              <Card className="border-dashed shadow-none bg-muted/30">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Info className="h-8 w-8 mb-4 opacity-50" />
                  <p>Nenhuma pergunta disponível.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Qualitative Feedback */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold tracking-tight">Feedback Qualitativo</h3>

            <Card className="shadow-sm">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label>Pontos Fortes</Label>
                  <Textarea
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    placeholder="Quais foram as principais conquistas e diferenciais?"
                    className="min-h-[100px]"
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Oportunidades de Melhoria</Label>
                  <Textarea
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                    placeholder="Quais áreas precisam de desenvolvimento?"
                    className="min-h-[100px]"
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Comentários Gerais</Label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Mensagem final ou observações..."
                    className="min-h-[100px]"
                    disabled={isReadOnly}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar Info & Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="sticky top-8 space-y-6">

            {/* Info Card */}
            <Card className="shadow-sm bg-muted/40 border-muted">
              <CardHeader>
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Detalhes da Avaliação</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div className="flex justify-between border-b pb-2 border-border/50">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="font-medium">
                    {evaluation.evaluatorType === 'SELF' ? 'Autoavaliação' :
                      evaluation.evaluatorType === 'MANAGER' ? 'Gestor' : 'Pares'}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2 border-border/50">
                  <span className="text-muted-foreground">Perguntas</span>
                  <span className="font-medium">{questions.length}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-muted-foreground">Obrigatórias</span>
                  <span className="font-medium">{questions.filter(q => q.required).length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions Card */}
            {!isReadOnly && (
              <Card className="shadow-md border-primary/10">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Ações</CardTitle>
                  <CardDescription>Suas alterações são salvas automaticamente, mas lembre-se de enviar ao final.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full font-semibold"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={progress < 100 || submitting}
                  >
                    {submitting ? 'Enviando...' : 'Finalizar e Enviar'}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Salvando...' : 'Salvar Rascunho'}
                    <Save className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {isReadOnly && evaluation.finalScore && (
              <Card className="bg-primary text-primary-foreground border-none shadow-lg">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-2">
                  <p className="text-xs uppercase font-bold tracking-widest opacity-80">Nota Final</p>
                  <div className="text-5xl font-black">{evaluation.finalScore.toFixed(1)}</div>
                  {evaluation.calibratedScore && (
                    <div className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full mt-2">
                      Calibrada: {evaluation.calibratedScore.toFixed(1)}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
