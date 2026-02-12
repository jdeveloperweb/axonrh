'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Save,
  Send,
  User,
  Calendar,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { evaluationsApi, Evaluation, EvaluationAnswer } from '@/lib/api/performance';
import { getErrorMessage } from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { cn } from '@/lib/utils';

// FormQuestion interface defined locally for UI mapping
interface FormQuestion {
  id: string; // This will map to questionId from backend answer
  text: string;
  section: string;
  type: 'SCALE' | 'TEXT';
  weight: number;
  required: boolean;
  answerId?: string; // ID of the answer record itself
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

        setEvaluation(data);

        // Derivar perguntas das respostas retornadas pelo backend
        if (data.answers && data.answers.length > 0) {
          const derivedQuestions: FormQuestion[] = data.answers.map(ans => ({
            id: ans.questionId,
            text: ans.questionText,
            section: ans.sectionName,
            type: ans.weight > 0 ? 'SCALE' : 'TEXT',
            weight: ans.weight,
            required: ans.weight > 0, // Assumindo obrigatoriedade para questões de escala
            answerId: ans.id
          }));

          // Ordenar por seção (simples)
          // Em um cenario real, teriamos uma ordem definida

          setQuestions(derivedQuestions);

          // Inicializar respostas existentes
          const existingAnswers: Record<string, EvaluationAnswer> = {};
          data.answers.forEach((answer) => {
            existingAnswers[answer.questionId] = answer;
          });
          setAnswers(existingAnswers);
        }

        // Inicializar feedback
        setFeedback(data.overallFeedback || '');
        setStrengths(data.strengths || '');
        setImprovements(data.areasForImprovement || '');

        // Iniciar avaliacao se pendente
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
        id: question.answerId, // Manter o ID da resposta original para update
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
        description: 'A avaliacao foi salva com sucesso.',
      });
    } catch (error: unknown) {
      console.error('Erro ao salvar:', error);
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
      title: 'Confirmar Submissão',
      description: 'Após submeter a avaliação, você não poderá mais editá-la. Tem certeza que deseja continuar?',
      confirmLabel: 'Confirmar'
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
        title: 'Avaliacao enviada',
        description: 'Sua avaliacao foi submetida com sucesso.',
      });
      router.push('/performance');
    } catch (error: unknown) {
      console.error('Erro ao submeter:', error);
      toast({
        title: 'Erro ao submeter',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const calculateProgress = () => {
    const required = questions.filter((q) => q.required);
    const answered = required.filter((q) => answers[q.id]?.score !== undefined);
    return (answered.length / required.length) * 100;
  };

  const getScoreLabel = (score: number) => {
    const labels = [
      'Nao avaliado',
      'Abaixo do esperado',
      'Parcialmente atende',
      'Atende',
      'Supera',
      'Excepcional',
    ];
    return labels[score] || '';
  };

  const getScoreColor = (score: number) => {
    const colors = ['', 'text-red-500', 'text-orange-500', 'text-yellow-500', 'text-green-500', 'text-emerald-500'];
    return colors[score] || '';
  };

  // Agrupar perguntas por secao
  const groupedQuestions = questions.reduce((acc, question) => {
    if (!acc[question.section]) {
      acc[question.section] = [];
    }
    acc[question.section].push(question);
    return acc;
  }, {} as Record<string, FormQuestion[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="text-center py-8">
        <p>Avaliacao nao encontrada</p>
        <Link href="/performance">
          <Button variant="primary">Voltar</Button>
        </Link>
      </div>
    );
  }

  const isReadOnly = evaluation.status === 'COMPLETED' || evaluation.status === 'SUBMITTED';

  return (
    <div className="w-full px-6 lg:px-10 py-10 space-y-10 animate-in fade-in duration-700">

      {/* Design System Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="h-12 w-12 rounded-full border-slate-100 bg-white shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center p-0"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Crescimento & Carreira</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight tracking-tighter">
              Avaliação de <span className="text-indigo-600 italic">Desempenho</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className={cn(
            "px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest border-2 shadow-sm",
            evaluation.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
              evaluation.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                'bg-emerald-50 text-emerald-600 border-emerald-100'
          )}>
            {evaluation.status === 'PENDING' ? 'PENDENTE' :
              evaluation.status === 'IN_PROGRESS' ? 'EM ANDAMENTO' :
                evaluation.status === 'SUBMITTED' ? 'SUBMETIDA' :
                  evaluation.status === 'COMPLETED' ? 'CONCLUÍDA' : evaluation.status}
          </Badge>
        </div>
      </div>

      {/* Info do Avaliado */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{evaluation.employeeName}</h2>
              <p className="text-muted-foreground">Colaborador avaliado</p>
            </div>
            {evaluation.dueDate && (
              <div className="text-right">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Prazo: {new Date(evaluation.dueDate).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progresso */}
      {!isReadOnly && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso da Avaliacao</span>
              <span className="text-sm text-muted-foreground">{calculateProgress().toFixed(0)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario */}
      <div className="space-y-6">
        {Object.entries(groupedQuestions).map(([section, questions]) => (
          <Card key={section}>
            <CardHeader>
              <CardTitle>{section}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.id}>
                  {index > 0 && <Separator className="mb-6" />}
                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium flex-1">
                        {question.text}
                        {question.required && <span className="text-destructive ml-1">*</span>}
                      </span>
                      {question.weight > 1 && (
                        <Badge variant="secondary" className="text-xs">
                          Peso {question.weight}x
                        </Badge>
                      )}
                    </div>

                    {question.type === 'SCALE' && (
                      <div className="space-y-3">
                        <Slider
                          value={[answers[question.id]?.score || 0]}
                          onValueChange={([value]) => handleScoreChange(question.id, value)}
                          max={5}
                          min={0}
                          step={1}
                          disabled={isReadOnly}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0</span>
                          <span>1</span>
                          <span>2</span>
                          <span>3</span>
                          <span>4</span>
                          <span>5</span>
                        </div>
                        <p className={`text-sm font-medium ${getScoreColor(answers[question.id]?.score || 0)}`}>
                          {getScoreLabel(answers[question.id]?.score || 0)}
                        </p>
                      </div>
                    )}

                    {question.type === 'TEXT' && (
                      <Textarea
                        value={answers[question.id]?.textAnswer || ''}
                        onChange={(e) => handleTextChange(question.id, e.target.value)}
                        placeholder="Digite sua resposta..."
                        disabled={isReadOnly}
                        rows={3}
                      />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Feedback Geral */}
        <Card>
          <CardHeader>
            <CardTitle>Feedback Consolidado</CardTitle>
            <CardDescription>
              Faca um resumo geral da avaliacao
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Pontos Fortes</Label>
              <Textarea
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="Destaque os principais pontos fortes..."
                disabled={isReadOnly}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Areas de Melhoria</Label>
              <Textarea
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                placeholder="Indique as areas que precisam de desenvolvimento..."
                disabled={isReadOnly}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Feedback Geral</Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Escreva um feedback geral sobre o desempenho..."
                disabled={isReadOnly}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acoes */}
      {!isReadOnly && (
        <div className="flex justify-end gap-4 sticky bottom-4 bg-background p-4 border rounded-lg shadow-lg">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Rascunho'}
          </Button>

          <Button
            disabled={calculateProgress() < 100 || submitting}
            onClick={handleSubmit}
          >
            <Send className="h-4 w-4 mr-2" />
            {submitting ? 'Enviando...' : 'Submeter Avaliacao'}
          </Button>
        </div>
      )}

      {/* Resultado Final (se completa) */}
      {evaluation.status === 'COMPLETED' && evaluation.finalScore && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Resultado Final
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">
                {evaluation.finalScore.toFixed(1)}
              </div>
              <p className="text-muted-foreground">Nota Final</p>
              {evaluation.calibratedScore && (
                <p className="text-sm text-muted-foreground mt-2">
                  Nota calibrada: {evaluation.calibratedScore.toFixed(1)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
