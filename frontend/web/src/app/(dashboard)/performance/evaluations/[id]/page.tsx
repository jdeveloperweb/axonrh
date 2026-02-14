'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Info,
  ChevronRight,
  Target,
  Trophy,
  BrainCircuit,
  Lightbulb,
} from 'lucide-react';
import Link from 'next/link';
import { evaluationsApi, Evaluation, EvaluationAnswer } from '@/lib/api/performance';
import { getErrorMessage } from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/auth-store';
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

        // Derivar perguntas das respostas retornadas pelo backend
        if (data.answers && data.answers.length > 0) {
          const derivedQuestions: FormQuestion[] = data.answers.map(ans => ({
            id: ans.questionId,
            text: ans.questionText,
            section: ans.sectionName,
            type: ans.weight > 0 ? 'SCALE' : 'TEXT',
            weight: ans.weight,
            required: ans.weight > 0,
            answerId: ans.id
          }));

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

  const getScoreLabel = (score: number) => {
    const labels = [
      'Não avaliado',
      'Muito abaixo do esperado',
      'Abaixo do esperado',
      'Atende plenamente',
      'Supera as expectativas',
      'Excepcional / Referência',
    ];
    return labels[score] || '';
  };

  const getScoreColor = (score: number) => {
    const colors = [
      'text-slate-400',
      'text-rose-600',
      'text-amber-600',
      'text-indigo-600',
      'text-emerald-600',
      'text-violet-600'
    ];
    return colors[score] || 'text-slate-400';
  };

  const groupedQuestions = useMemo(() => {
    return questions.reduce((acc, question) => {
      if (!acc[question.section]) {
        acc[question.section] = [];
      }
      acc[question.section].push(question);
      return acc;
    }, {} as Record<string, FormQuestion[]>);
  }, [questions]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="relative h-20 w-20">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] animate-pulse">Sincronizando com AxonIA...</p>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
        <div className="h-20 w-20 rounded-full bg-rose-50 flex items-center justify-center">
          <Info className="h-10 w-10 text-rose-500" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-slate-800">Avaliação não encontrada</h2>
          <p className="text-slate-500 font-medium">O link pode estar expirado ou você não tem permissão para acessá-lo.</p>
        </div>
        <Link href="/performance">
          <Button className="bg-slate-900 font-bold px-8">Voltar para Performance</Button>
        </Link>
      </div>
    );
  }

  const isReadOnly = evaluation.status === 'COMPLETED' || evaluation.status === 'SUBMITTED' || evaluation.status === 'CALIBRATED';

  return (
    <div className="w-full max-w-6xl mx-auto px-4 lg:px-6 py-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">

      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="h-14 w-14 rounded-2xl border-2 border-slate-100 bg-white shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center p-0"
          >
            <ArrowLeft className="h-6 w-6 text-slate-600" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500 fill-indigo-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Módulo de Talentos</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-none tracking-tighter">
              Avaliação de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 italic">Desempenho</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Status Atual</span>
            <span className="text-sm font-bold text-slate-900">
              {evaluation.status === 'PENDING' ? 'Aguardando Início' :
                evaluation.status === 'IN_PROGRESS' ? 'Em Preenchimento' : 'Concluída'}
            </span>
          </div>
          <Badge className={cn(
            "px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-widest border-2 shadow-lg",
            evaluation.status === 'PENDING' ? 'bg-amber-500 text-white border-amber-400' :
              evaluation.status === 'IN_PROGRESS' ? 'bg-indigo-600 text-white border-indigo-500' :
                'bg-emerald-500 text-white border-emerald-400'
          )}>
            {evaluation.status === 'PENDING' ? 'PENDENTE' :
              evaluation.status === 'IN_PROGRESS' ? 'EM ANDAMENTO' :
                evaluation.status === 'SUBMITTED' ? 'SUBMETIDA' :
                  evaluation.status === 'CALIBRATED' ? 'CALIBRADA' :
                    evaluation.status === 'COMPLETED' ? 'CONCLUÍDA' : evaluation.status}
          </Badge>
        </div>
      </div>

      {/* Grid de Informações e Progresso */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Card do Avaliado */}
        <Card className="lg:col-span-2 border-0 shadow-2xl shadow-slate-200/50 bg-white ring-1 ring-slate-100 overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-600 to-violet-600" />
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative group">
                <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center ring-4 ring-white shadow-xl transition-transform group-hover:scale-110">
                  <User className="h-12 w-12 text-indigo-600" />
                </div>
                <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg border-2 border-white">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">
                    {evaluation.employeeName || "Colaborador não identificado"}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1 text-slate-500 font-bold text-sm">
                    <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg">
                      <Target className="h-4 w-4 text-indigo-500" />
                      {evaluation.cycleName || "Ciclo de Performance"}
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg uppercase tracking-tight text-xs">
                      {evaluation.evaluatorType === 'SELF' ? 'Autoavaliação' :
                        evaluation.evaluatorType === 'MANAGER' ? 'Avaliação do Gestor' : 'Avaliação 360º'}
                    </span>
                  </div>
                </div>
              </div>
              {evaluation.dueDate && (
                <div className="bg-slate-900 p-5 rounded-3xl text-white text-center min-w-[140px] shadow-2xl shadow-indigo-200">
                  <Calendar className="h-6 w-6 text-indigo-400 mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prazo Final</p>
                  <p className="text-lg font-black">{new Date(evaluation.dueDate).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card de Progresso */}
        <Card className="border-0 shadow-2xl shadow-slate-200/50 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 translate-x-4 -translate-y-4">
            <BrainCircuit className="h-32 w-32" />
          </div>
          <CardContent className="p-8 flex flex-col items-center justify-center h-full space-y-4 text-center relative z-10">
            <div className="relative h-24 w-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-800"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={263.8}
                  strokeDashoffset={263.8 - (263.8 * progress / 100)}
                  strokeLinecap="round"
                  className="text-indigo-500 transition-all duration-1000"
                />
              </svg>
              <span className="absolute text-2xl font-black">{progress.toFixed(0)}%</span>
            </div>
            <div>
              <h3 className="text-lg font-black">Progresso Geral</h3>
              <p className="text-slate-400 text-xs font-bold leading-relaxed">
                {progress < 100 ? "Complete as perguntas para habilitar a submissão" : "Tudo pronto para enviar!"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulario de Questoes */}
      <div className="space-y-12">
        {Object.entries(groupedQuestions).length > 0 ? (
          Object.entries(groupedQuestions).map(([section, sectionQuestions]) => (
            <div key={section} className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Trophy className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{section}</h3>
                <div className="flex-1 h-[2px] bg-slate-100 rounded-full" />
              </div>

              <div className="grid grid-cols-1 gap-6">
                {sectionQuestions.map((question, index) => (
                  <Card key={question.id} className="border-0 shadow-xl shadow-slate-200/40 bg-white ring-1 ring-slate-100 hover:ring-indigo-100 transition-all">
                    <CardContent className="p-8">
                      <div className="space-y-8">
                        <div className="flex items-start justify-between gap-6">
                          <div className="space-y-2">
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Pergunta {index + 1}</span>
                            <h4 className="text-lg font-bold text-slate-800 leading-snug">
                              {question.text}
                              {question.required && <span className="text-rose-500 ml-1 italic font-normal text-xs">(obrigatória)</span>}
                            </h4>
                          </div>
                          {question.weight > 1 && (
                            <div className="px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase">
                              Peso x{question.weight}
                            </div>
                          )}
                        </div>

                        {question.type === 'SCALE' ? (
                          <div className="space-y-8">
                            <div className="px-2">
                              <Slider
                                value={[answers[question.id]?.score || 0]}
                                onValueChange={([value]) => handleScoreChange(question.id, value)}
                                max={5}
                                min={0}
                                step={1}
                                disabled={isReadOnly}
                                className="w-full h-2"
                              />
                            </div>
                            <div className="grid grid-cols-6 gap-2">
                              {[0, 1, 2, 3, 4, 5].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => !isReadOnly && handleScoreChange(question.id, val)}
                                  className={cn(
                                    "flex flex-col items-center gap-1 transition-all duration-300",
                                    (answers[question.id]?.score === val) ? "scale-110" : "opacity-40 hover:opacity-100"
                                  )}
                                >
                                  <div className={cn(
                                    "h-10 w-10 md:h-12 md:w-12 rounded-2xl flex items-center justify-center font-black text-lg transition-colors border-2",
                                    answers[question.id]?.score === val
                                      ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-100"
                                      : "bg-slate-50 text-slate-400 border-slate-100"
                                  )}>
                                    {val}
                                  </div>
                                  <span className={cn(
                                    "text-[8px] font-black uppercase tracking-tighter text-center",
                                    answers[question.id]?.score === val ? "text-indigo-600" : "text-slate-400"
                                  )}>
                                    {val === 0 ? "N/A" : val === 5 ? "Brilhante" : ""}
                                  </span>
                                </button>
                              ))}
                            </div>
                            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-50 flex items-center justify-center gap-3">
                              <Lightbulb className="h-5 w-5 text-indigo-500" />
                              <span className={cn("text-sm font-black uppercase tracking-wider", getScoreColor(answers[question.id]?.score || 0))}>
                                {getScoreLabel(answers[question.id]?.score || 0)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <Textarea
                              value={answers[question.id]?.textAnswer || ''}
                              onChange={(e) => handleTextChange(question.id, e.target.value)}
                              placeholder="Descreva detalhadamente sua percepção aqui..."
                              className="min-h-[160px] rounded-2xl border-2 border-slate-100 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-slate-700 p-6 shadow-sm"
                              disabled={isReadOnly}
                            />
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                              <span>Mínimo recomendado: 10 caracteres</span>
                              <span>{answers[question.id]?.textAnswer?.length || 0} caracteres</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        ) : (
          <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-[40px] text-center p-20">
            <div className="h-20 w-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6">
              < brainCircuit className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-400 uppercase tracking-widest">Nenhuma pergunta carregada</h3>
            <p className="text-slate-400 font-medium max-w-sm mx-auto mt-2">
              Não foram encontradas perguntas vinculadas a este formulário de avaliação. Por favor, contate o RH.
            </p>
          </Card>
        )}

        {/* Feedback Consolidado */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-violet-600 text-white flex items-center justify-center">
              <brainCircuit className="h-5 w-5" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Feedback Consolidado</h3>
            <div className="flex-1 h-[2px] bg-slate-100 rounded-full" />
          </div>

          <Card className="border-0 shadow-2xl shadow-slate-200/50 overflow-hidden rounded-[32px]">
            <div className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <Label className="text-sm font-black text-slate-700 uppercase tracking-widest">Pontos Fortes</Label>
                  </div>
                  <Textarea
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    placeholder="Quais foram as principais conquistas e diferenciais?"
                    className="min-h-[180px] rounded-[24px] border-2 border-slate-100 bg-emerald-50/5 p-6 font-medium focus:border-emerald-500 focus:ring-emerald-50 transition-all"
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-5 w-5 text-rose-500" />
                    <Label className="text-sm font-black text-slate-700 uppercase tracking-widest">Oportunidades de Melhoria</Label>
                  </div>
                  <Textarea
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                    placeholder="Quais áreas precisam de maior atenção e desenvolvimento?"
                    className="min-h-[180px] rounded-[24px] border-2 border-slate-100 bg-rose-50/5 p-6 font-medium focus:border-rose-500 focus:ring-rose-50 transition-all"
                    disabled={isReadOnly}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                  <Label className="text-sm font-black text-slate-700 uppercase tracking-widest">Feedback Geral e Sugestões</Label>
                </div>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Deixe uma mensagem final ou recomendações para o próximo ciclo..."
                  className="min-h-[150px] rounded-[24px] border-2 border-slate-100 bg-indigo-50/5 p-6 font-medium focus:border-indigo-600 focus:ring-indigo-50 transition-all text-lg leading-relaxed"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Barra de Ações Flutuante */}
      {!isReadOnly && (
        <div className="sticky bottom-8 left-0 right-0 z-50 px-4">
          <div className="max-w-4xl mx-auto bg-slate-900/90 backdrop-blur-xl rounded-[32px] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-3xl shadow-indigo-500/20 ring-1 ring-white/10">
            <div className="flex items-center gap-4 pl-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status da Edição</span>
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Salvamento automático habilitado
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant="ghost"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 sm:flex-none h-14 px-8 rounded-2xl text-white font-black hover:bg-white/10 transition-all"
              >
                <Save className="h-5 w-5 mr-3" />
                {saving ? 'Arquivando...' : 'Salvar como Rascunho'}
              </Button>

              <Button
                disabled={progress < 100 || submitting}
                onClick={handleSubmit}
                className={cn(
                  "flex-1 sm:flex-none h-14 px-10 rounded-2xl font-black shadow-xl transition-all border-0",
                  progress >= 100
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:scale-105 hover:shadow-indigo-500/40 text-white"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                )}
              >
                <Send className="h-5 w-5 mr-3" />
                {submitting ? 'Consolidando...' : 'Finalizar & Enviar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Resultado Final (se concluída) */}
      {(evaluation.status === 'COMPLETED' || evaluation.status === 'CALIBRATED') && evaluation.finalScore && (
        <Card className="border-0 bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-[40px] shadow-3xl shadow-indigo-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Trophy className="h-40 w-40" />
          </div>
          <CardContent className="p-12 text-center space-y-4 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-100">Performance Score Resultado</p>
            <div className="text-8xl font-black tracking-tighter drop-shadow-2xl">
              {evaluation.finalScore.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Score Bruto</p>
                <p className="text-xl font-bold">{(evaluation.finalScore || 0).toFixed(1)}</p>
              </div>
              {evaluation.calibratedScore && (
                <div className="bg-white/20 px-6 py-3 rounded-2xl backdrop-blur-md ring-2 ring-white/30">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Nota Calibrada</p>
                  <p className="text-xl font-bold">{evaluation.calibratedScore.toFixed(1)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
