'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Zap,
  LayoutGrid,
  Flame,
  ArrowRight,
  TrendingUp,
  Trophy,
  Play,
  Clock,
  BookOpen,
  ChevronRight,
  Award,
  BarChart3,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import {
  coursesApi,
  enrollmentsApi,
  Enrollment,
  EnrollmentStatistics,
  TrainingCategory,
  categoriesApi,
} from '@/lib/api/learning';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import { cn, getPhotoUrl } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LearningDashboard() {
  const { user } = useAuthStore();
  const { tenantTheme } = useThemeStore();
  const router = useRouter();

  const [publishedCourses, setPublishedCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<TrainingCategory[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [stats, setStats] = useState<EnrollmentStatistics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Olá');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');

    const loadData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const [coursesRes, enrollmentsRes, statisticsRes, categoriesRes] = await Promise.all([
          coursesApi.listPublished().catch(() => []),
          enrollmentsApi.getActiveByEmployee(user.id).catch(() => []),
          enrollmentsApi.getStatistics(user.id).catch(() => ({ total: 0, completed: 0, inProgress: 0, averageProgress: 0 })),
          categoriesApi.list().catch(() => []),
        ]);

        setPublishedCourses(Array.isArray(coursesRes) ? coursesRes : []);
        setCategories(Array.isArray(categoriesRes) ? categoriesRes : []);
        setMyEnrollments(Array.isArray(enrollmentsRes) ? enrollmentsRes : []);
        setStats(statisticsRes as any);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.id]);

  const filteredCourses = useMemo(() => {
    return publishedCourses.filter((course) => {
      const search = searchQuery.toLowerCase().trim();
      const matchesSearch = course.title.toLowerCase().includes(search) ||
        course.description?.toLowerCase().includes(search);

      const matchesCategory = !selectedCategory ||
        course.categoryId === selectedCategory ||
        course.categoryName === selectedCategory ||
        course.categoryName === categories.find(c => c.id === selectedCategory)?.name;

      return matchesSearch && matchesCategory;
    });
  }, [publishedCourses, searchQuery, selectedCategory, categories]);

  const recommendedCourse = useMemo(() => {
    if (!publishedCourses || publishedCourses.length === 0) return null;
    return publishedCourses.find(c => !myEnrollments.some(e => (e.courseId || (e.course as any)?.id) === c.id)) || publishedCourses[0];
  }, [publishedCourses, myEnrollments]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sincronizando trilhas...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-12 pb-24 px-4 md:px-8">

      {/* --- HERO SECTION --- */}
      <section className="grid lg:grid-cols-12 gap-8 items-stretch pt-2">
        <div className="lg:col-span-8 relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50/50 to-primary/5 p-10 md:p-14 shadow-sm backdrop-blur-sm flex flex-col justify-center min-h-[400px] group/hero">
          {/* Efeitos de fundo dinâmicos mais sutis */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-400/5 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 space-y-8">
            <div className="space-y-4">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black px-4 py-1.5 rounded-full text-[10px] tracking-wider mb-2">
                <Sparkles className="h-3 w-3 mr-2" />
                AXON ACADEMY PRO
              </Badge>
              <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1]">
                {greeting}, <br />
                <span className="text-primary">
                  {user?.name?.split(' ')[0]}
                </span>!
                <div className="mt-4 flex items-center gap-4">
                  <div className="h-1.5 w-24 bg-primary/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-2/3 animate-pulse" />
                  </div>
                  <span className="text-slate-400 font-bold text-2xl md:text-4xl tracking-tight">Sua jornada evolutiva.</span>
                </div>
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                onClick={() => router.push('/learning/certificates')}
                className="h-16 px-12 rounded-2xl font-black text-sm transition-all shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-1 flex gap-3 group bg-primary"
              >
                <Award className="h-6 w-6 transition-transform group-hover:scale-110" />
                VER MEUS CERTIFICADOS
              </Button>

              <div className="flex items-center gap-2 p-1.5 bg-white/50 backdrop-blur-md border border-slate-200 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-slate-100 group cursor-default">
                  <Flame className="h-5 w-5 text-orange-500 fill-orange-500 animate-bounce" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 leading-none tracking-widest">STREAK</span>
                    <span className="text-sm font-black text-slate-800 tracking-tight">12 DIAS</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-5 py-3 group cursor-default">
                  <Trophy className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 leading-none tracking-widest">PONTOS</span>
                    <span className="text-sm font-black text-slate-800 tracking-tight">2.450 PTS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dash de Progresso & Próximo Passo */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#0f172a] rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl flex-1 flex flex-col justify-between group">
            {/* Efeitos Visuais de Fundo */}
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
              <TrendingUp className="h-48 w-48" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-transparent pointer-events-none" />

            <div className="space-y-8 relative z-10">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Progresso Geral</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-7xl font-black tracking-tighter">{Math.round(stats?.averageProgress || 0)}%</h3>
                </div>
              </div>
              <Progress value={stats?.averageProgress} className="h-3 bg-white/10" />
            </div>

            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] pt-8 border-t border-white/5 text-slate-400 relative z-10">
              <span>{stats?.completed || 0} Certificados</span>
              <Award className="h-6 w-6 text-primary" />
            </div>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-10 shadow-sm flex flex-col justify-between group hover:border-emerald-200 transition-all cursor-pointer relative overflow-hidden">
            <div className="absolute -top-10 -right-10 h-32 w-32 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-2 text-emerald-600">
                <Zap className="h-5 w-5 fill-emerald-600" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Recomendado para você</span>
              </div>
              <h4 className="font-black text-slate-800 leading-tight line-clamp-2 text-xl uppercase tracking-tight">
                {recommendedCourse?.title || "Treinamento de Liderança Alpha"}
              </h4>
            </div>
            <Link href={recommendedCourse ? `/learning/course/${recommendedCourse.id}` : '#'} className="mt-8 relative z-10">
              <button className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 hover:gap-5 transition-all">
                Ver detalhes do curso <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* --- CATEGORIAS (NEW PREMIUM AREA) --- */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center justify-between px-2">
          <div className="space-y-1">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Explorar por área</h3>
            <p className="text-sm font-bold text-slate-600">Selecione uma categoria para filtrar as trilhas de conhecimento.</p>
          </div>
        </div>

        <div className="flex flex-nowrap gap-4 overflow-x-auto pt-4 pb-4 no-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "flex items-center gap-4 px-8 py-5 rounded-2xl text-sm font-black transition-all shrink-0 border-2",
              selectedCategory === null
                ? "bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-200 translate-y-[-4px]"
                : "bg-white border-slate-100 text-slate-500 hover:border-primary/30 hover:bg-slate-50"
            )}
          >
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
              selectedCategory === null ? "bg-white/10" : "bg-slate-50"
            )}>
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="uppercase tracking-widest text-[10px] mb-1 opacity-50">Geral</span>
              <span>Todos os Cursos</span>
            </div>
          </button>

          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={cn(
                "flex items-center gap-4 px-8 py-5 rounded-2xl text-sm font-black transition-all shrink-0 border-2",
                selectedCategory === cat.id
                  ? "bg-primary border-primary text-white shadow-2xl shadow-primary/20 translate-y-[-4px]"
                  : "bg-white border-slate-100 text-slate-500 hover:border-primary/30 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                selectedCategory === cat.id ? "bg-white/10" : "bg-primary/5 text-primary"
              )}>
                <Zap className="h-5 w-5" />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="uppercase tracking-widest text-[10px] mb-1 opacity-50">Explorar</span>
                <span>{cat.name}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className="space-y-12">
        {/* Busca Premium */}
        <div className="relative group max-w-4xl mx-auto">
          <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within:text-primary transition-colors pointer-events-none" />
          <Input
            placeholder="O que você deseja aprender hoje? Digite o tema ou habilidade..."
            className="h-20 pl-16 pr-8 rounded-[2rem] border-slate-100 focus:ring-primary shadow-xl shadow-slate-100 text-xl font-bold placeholder:text-slate-300 bg-white/80 backdrop-blur-md transition-all border-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Ativos (Em Andamento) */}
        {myEnrollments.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <Flame className="h-6 w-6 text-orange-500 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Continuar Aprendendo</h2>
                  <p className="text-sm font-medium text-slate-400">Você possui {myEnrollments.length} trilhas iniciadas.</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
              {myEnrollments.map((en) => (
                <Link key={en.id} href={`/learning/course/${en.courseId || (en.course as any)?.id}`}>
                  <div className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-8 flex flex-col gap-6 hover:shadow-2xl transition-all group cursor-pointer hover:border-primary/20 relative overflow-hidden active:scale-[0.98]">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <BookOpen className="h-24 w-24" />
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                      <div className="h-24 w-24 bg-slate-50 rounded-3xl overflow-hidden flex-shrink-0 border border-slate-100 shadow-inner">
                        {en.courseThumbnail ? (
                          <img src={getPhotoUrl(en.courseThumbnail) || ''} alt={en.courseName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : <BookOpen className="h-full w-full p-7 text-slate-200" />}
                      </div>
                      <div className="flex-1 space-y-2 min-w-0">
                        <Badge className="bg-orange-100 text-orange-600 border-none font-black text-[9px] px-2 py-0.5 rounded-md self-start uppercase tracking-widest">
                          Em Andamento
                        </Badge>
                        <h3 className="font-black text-slate-900 truncate pr-4 text-xl tracking-tight group-hover:text-primary transition-colors">{en.courseName}</h3>
                      </div>
                    </div>

                    <div className="space-y-3 relative z-10">
                      <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        <span>Progresso da Trilha</span>
                        <span className="text-primary font-bold italic">{Math.round(en.progressPercentage)}%</span>
                      </div>
                      <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-1000"
                          style={{ width: `${en.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        <Clock className="h-4 w-4" />
                        <span>Retomar de onde parou</span>
                      </div>
                      <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                        <ChevronRight className="h-6 w-6" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Catálogo Principal */}
        <section className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-slate-50 pb-10 px-2">
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Catálogo de trilhas</h2>
              <p className="text-lg font-medium text-slate-400">Descubra novos conhecimentos e expanda sua carreira na Axon.</p>
            </div>
            <div className="flex gap-4">
              <Link href="/learning/history">
                <Button variant="outline" className="h-14 px-8 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] border-2 bg-white hover:bg-slate-50">
                  MEU HISTÓRICO
                </Button>
              </Link>
              <Button
                onClick={() => router.push('/learning/catalog')}
                className="h-14 px-10 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-primary/10 transition-all hover:-translate-y-1"
              >
                VER TUDO
              </Button>
            </div>
          </div>

          {filteredCourses.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={{
                    ...course,
                    categoryName: course.categoryName || categories.find(c => c.id === course.categoryId)?.name
                  }}
                  isEnrolled={myEnrollments.some(e => e.courseId === course.id)}
                />
              ))}
            </div>
          ) : (
            <div className="py-32 flex flex-col items-center">
              <Alert className="max-w-xl bg-slate-50 border-slate-200 border-dashed border-4 flex flex-col items-center text-center p-20 rounded-[3rem]">
                <div className="h-24 w-24 bg-white rounded-[2rem] shadow-xl border border-slate-100 flex items-center justify-center mb-8">
                  <Search className="h-10 w-10 text-slate-200" />
                </div>
                <AlertTitle className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-tight">Nenhuma trilha encontrada</AlertTitle>
                <AlertDescription className="text-slate-400 font-medium mb-10 text-lg">
                  Não encontramos resultados para sua busca atual. Tente usar termos diferentes ou limpar os filtros de categoria abaixo.
                </AlertDescription>
                <Button
                  variant="outline"
                  onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
                  className="h-16 px-12 rounded-2xl font-black text-xs uppercase tracking-widest border-2 bg-white hover:bg-slate-100 shadow-sm"
                >
                  LIMPAR TODOS OS FILTROS
                </Button>
              </Alert>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// --- COURSE CARD (UPGRADED) ---
function CourseCard({ course, isEnrolled }: { course: any, isEnrolled?: boolean }) {
  return (
    <Link href={`/learning/course/${course.id}`}>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full group hover:-translate-y-2 relative active:scale-[0.98]">
        <div className="h-48 bg-slate-100 relative overflow-hidden">
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#0f172a]">
              <Zap className="h-12 w-12 text-white/5" />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white/10 uppercase tracking-[0.3em] pointer-events-none">Axon Academy</span>
            </div>
          )}

          <div className="absolute top-4 left-4 z-20">
            <Badge className="bg-white/95 backdrop-blur-sm text-slate-900 border-none font-black text-[9px] px-3 py-1 uppercase tracking-wider shadow-sm">
              {course.categoryName || 'GERAL'}
            </Badge>
          </div>

          {!isEnrolled && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] z-10 transition-all duration-500">
              <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 scale-75 group-hover:scale-100">
                <Play className="h-5 w-5 fill-white" />
              </div>
            </div>
          )}

          {isEnrolled && (
            <div className="absolute inset-0 bg-primary/5 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all duration-500">
              <Badge className="bg-primary text-white font-black px-4 py-1.5 shadow-xl select-none uppercase text-[9px] tracking-wider border-none rounded-lg">
                <CheckCircle2 className="h-3 w-3 mr-1.5" />
                MATRICULADO
              </Badge>
            </div>
          )}
        </div>

        <div className="p-7 flex flex-col flex-1 space-y-5 relative">
          <div className="space-y-2 flex-1">
            <h3 className="font-black text-slate-900 leading-tight group-hover:text-primary transition-colors line-clamp-2 text-lg uppercase tracking-tight">
              {course.title}
            </h3>
            <p className="text-sm font-medium text-slate-400 line-clamp-2 leading-relaxed italic opacity-80">
              {course.description || "Inicie este treinamento para expandir suas competências e crescer na organização."}
            </p>
          </div>

          <div className="pt-5 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">{course.durationMinutes || 0} min</span>
              </div>
              <div className="h-1 w-1 rounded-full bg-slate-200" />
              <div className="flex items-center gap-2 text-slate-400">
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Iniciante</span>
              </div>
            </div>

            <div className="h-9 w-9 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
