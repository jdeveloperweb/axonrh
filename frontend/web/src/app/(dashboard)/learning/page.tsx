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
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || course.categoryName === selectedCategory || course.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [publishedCourses, searchQuery, selectedCategory]);

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
    <div className="max-w-[1500px] mx-auto space-y-12 pb-24 px-2 md:px-4">

      {/* --- HERO SECTION --- */}
      <section className="grid lg:grid-cols-12 gap-8 items-stretch pt-2">
        <div className="lg:col-span-8 relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50/50 to-primary/5 p-10 md:p-14 shadow-sm backdrop-blur-sm flex flex-col justify-center min-h-[400px] group/hero">
          {/* Efeitos de fundo dinâmicos mais sutis */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 space-y-8">
            <div className="space-y-4">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold px-4 py-1.5 rounded-full text-[10px] tracking-wider mb-2">
                <Sparkles className="h-3 w-3 mr-2" />
                AXON ACADEMY PRO
              </Badge>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                {greeting}, <br />
                <span className="text-primary">
                  {user?.name?.split(' ')[0]}
                </span>!
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1 w-16 bg-primary/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-1/2" />
                  </div>
                  <span className="text-slate-400 font-bold text-2xl md:text-3xl tracking-tight">Sua jornada evolutiva.</span>
                </div>
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                onClick={() => router.push('/learning/certificates')}
                className="h-14 px-10 rounded-xl font-black text-xs transition-all shadow-md hover:shadow-primary/20 hover:-translate-y-0.5 flex gap-3 group bg-primary"
              >
                <Award className="h-5 w-5 transition-transform group-hover:scale-110" />
                VER MEUS CERTIFICADOS
              </Button>

              <div className="flex items-center gap-2 p-1 bg-slate-100/50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-100 group cursor-default">
                  <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 leading-none">STREAK</span>
                    <span className="text-xs font-black text-slate-700">12 DIAS</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-5 py-2 group cursor-default">
                  <Trophy className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 leading-none">PONTOS</span>
                    <span className="text-xs font-black text-slate-700">2.450 PTS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dash de Progresso & Próximo Passo */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#0f172a] rounded-2xl p-8 text-white relative overflow-hidden shadow-xl flex-1 flex flex-col justify-between group">
            {/* Efeitos Visuais de Fundo */}
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <TrendingUp className="h-32 w-32" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent pointer-events-none" />

            <div className="space-y-6 relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Progresso Geral</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-6xl font-black tracking-tighter">{Math.round(stats?.averageProgress || 0)}%</h3>
              </div>
              <Progress value={stats?.averageProgress} className="h-2 bg-white/10" />
            </div>

            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest pt-6 border-t border-white/5 text-slate-400 relative z-10">
              <span>{stats?.completed || 0} Certificados</span>
              <Award className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-8 shadow-sm flex flex-col justify-between group hover:border-emerald-200 transition-all">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-600">
                <Zap className="h-4 w-4 fill-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-widest">Recomendado para você</span>
              </div>
              <h4 className="font-black text-slate-800 leading-tight line-clamp-2 text-lg uppercase tracking-tight">
                {recommendedCourse?.title || "Treinamento de Liderança Alpha"}
              </h4>
            </div>
            <Link href={recommendedCourse ? `/learning/course/${recommendedCourse.id}` : '#'} className="mt-6">
              <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:gap-3 transition-all font-bold">
                Ver detalhes do curso <ArrowRight className="h-3 w-3" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* --- CONTEÚDO --- */}
      <div className="grid lg:grid-cols-12 gap-8">

        {/* Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Categorias</h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "flex items-center gap-3 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                  selectedCategory === null
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                    : "text-slate-500 hover:bg-slate-100/80"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
                Todos os Cursos
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={cn(
                    "flex items-center gap-3 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                    selectedCategory === cat.name
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                      : "text-slate-500 hover:bg-slate-100/80"
                  )}
                >
                  <Zap className="h-4 w-4" />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <Link href="/learning/certificates">
            <div className="p-6 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-white hover:border-primary/30 transition-all text-center group cursor-pointer">
              <div className="h-10 w-10 bg-white rounded-lg shadow-sm flex items-center justify-center mx-auto mb-3 border border-slate-100 group-hover:scale-110 transition-transform">
                <Award className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">RECONHECIMENTO</p>
              <p className="text-sm font-black text-slate-800 tracking-tight">CENTRAL DE TÍTULOS</p>
            </div>
          </Link>
        </aside>

        {/* Catalog Main Area */}
        <main className="lg:col-span-9 space-y-10">

          {/* Busca Premium */}
          <div className="relative group max-w-3xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors pointer-events-none" />
            <Input
              placeholder="O que você deseja aprender hoje?"
              className="h-16 pl-14 rounded-xl border-slate-200 focus:ring-primary shadow-sm text-base font-medium placeholder:text-slate-300 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Ativos */}
          {myEnrollments.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <Flame className="h-6 w-6 text-orange-500 animate-pulse" />
                  EM ANDAMENTO
                </h2>
                <span className="bg-slate-100 text-[10px] font-black px-3 py-1 rounded-full text-slate-500">{myEnrollments.length} CURSOS</span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {myEnrollments.map((en) => (
                  <Link key={en.id} href={`/learning/course/${en.courseId || (en.course as any)?.id}`}>
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 flex items-center gap-6 hover:shadow-xl transition-all group cursor-pointer hover:border-primary/30">
                      <div className="h-20 w-20 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100">
                        {en.courseThumbnail ? (
                          <img src={getPhotoUrl(en.courseThumbnail) || ''} alt={en.courseName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : <BookOpen className="h-full w-full p-6 text-slate-200" />}
                      </div>
                      <div className="flex-1 space-y-3 min-w-0">
                        <h3 className="font-black text-slate-900 truncate pr-4 text-lg tracking-tight group-hover:text-primary transition-colors">{en.courseName}</h3>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                            <span>Progresso</span>
                            <span className="text-primary italic font-bold">{Math.round(en.progressPercentage)}%</span>
                          </div>
                          <Progress value={en.progressPercentage} className="h-1.5" />
                        </div>
                      </div>
                      <div className="h-10 w-10 rounded-full flex items-center justify-center text-slate-200 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                        <ChevronRight className="h-6 w-6" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Catálogo Principal */}
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b-2 border-slate-50 pb-6 px-2">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Catálogo de trilhas</h2>
                <p className="text-sm font-medium text-slate-400">Encontre o treinamento ideal para seu próximo passo.</p>
              </div>
              <Button variant="outline" className="text-[10px] font-black uppercase tracking-widest border-2 hover:bg-slate-50 rounded-xl px-6" onClick={() => router.push('/learning/catalog')}>
                VER TODOS
              </Button>
            </div>

            {filteredCourses.length > 0 ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    isEnrolled={myEnrollments.some(e => e.courseId === course.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-24 flex flex-col items-center">
                <Alert className="max-w-md bg-slate-50 border-slate-200 flex flex-col items-center text-center p-12 rounded-3xl">
                  <div className="h-16 w-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                    <BookOpen className="h-8 w-8 text-slate-300" />
                  </div>
                  <AlertTitle className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Busca sem resultados</AlertTitle>
                  <AlertDescription className="text-slate-400 font-medium mb-6">
                    Tente ajustar seus filtros ou pesquisar por termos mais genéricos para encontrar o curso desejado.
                  </AlertDescription>
                  <Button
                    variant="outline"
                    onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
                    className="h-11 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 hover:bg-white"
                  >
                    LIMPAR TODOS OS FILTROS
                  </Button>
                </Alert>
              </div>
            )}
          </section>
        </main>
      </div>
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
