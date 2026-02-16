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
    <div className="max-w-[1600px] mx-auto space-y-16 pb-32 px-4 md:px-8">

      {/* --- HERO SECTION --- */}
      <section className="grid lg:grid-cols-12 gap-8 items-stretch pt-6">
        <div className="lg:col-span-8 relative overflow-hidden rounded-[2.5rem] border border-white/40 bg-gradient-to-br from-white via-slate-50/50 to-primary/5 p-12 md:p-16 shadow-[0_20px_50px_rgba(0,0,0,0.04)] backdrop-blur-md flex flex-col justify-center min-h-[450px] group/hero hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] transition-all duration-700">
          {/* Efeitos de fundo dinâmicos */}
          <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[10s]" />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 space-y-10">
            <div className="space-y-6">
              <Badge variant="outline" className="bg-white/50 backdrop-blur-sm text-primary border-primary/20 font-black px-5 py-2 rounded-full text-[11px] tracking-[0.1em] mb-2 animate-fade-in shadow-sm">
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                AXON ACADEMY PRO
              </Badge>
              <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tight leading-[0.95] lg:-ml-1">
                {greeting}, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-light to-primary group-hover/hero:bg-[length:200%_auto] transition-all duration-1000">
                  {user?.name?.split(' ')[0]}
                </span>!
                <div className="mt-4 flex items-center gap-4">
                  <div className="h-1 w-24 bg-primary/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-1/2" />
                  </div>
                  <span className="text-slate-400 font-bold text-3xl md:text-4xl tracking-tight">Sua jornada evolutiva.</span>
                </div>
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-4">
              <Button
                onClick={() => router.push('/learning/certificates')}
                className="h-16 px-14 rounded-2xl font-black text-sm transition-all shadow-[0_15px_30px_-10px_rgba(var(--color-primary),0.4)] hover:shadow-[0_25px_50px_-12px_rgba(var(--color-primary),0.5)] hover:-translate-y-1.5 active:translate-y-0 flex gap-4 group bg-primary"
              >
                <Award className="h-6 w-6 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                MEUS CERTIFICADOS
              </Button>

              <div className="flex items-center gap-3 p-2 bg-slate-100/40 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-inner">
                <div className="flex items-center gap-3 px-6 py-4 bg-white rounded-2xl shadow-[0_8px_16px_rgba(0,0,0,0.03)] border border-slate-100 group cursor-default">
                  <Flame className="h-6 w-6 text-orange-500 fill-orange-500 group-hover:scale-125 transition-all duration-500" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-400 leading-none tracking-widest">STREAK</span>
                    <span className="text-base font-black text-slate-800">12 DIAS</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-6 py-4 group cursor-default">
                  <Trophy className="h-6 w-6 text-amber-500 fill-amber-500 group-hover:rotate-12 transition-transform duration-500" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-400 leading-none tracking-widest">PONTOS</span>
                    <span className="text-base font-black text-slate-800">2.450</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dash de Progresso & Próximo Passo */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-[#0f172a] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl flex-1 flex flex-col justify-between group hover:scale-[1.02] transition-all duration-700">
            {/* Efeitos Visuais de Fundo */}
            <div className="absolute -top-10 -right-10 opacity-10 group-hover:opacity-20 transition-all duration-1000 group-hover:rotate-45 group-hover:scale-150">
              <TrendingUp className="h-64 w-64" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-transparent pointer-events-none" />

            <div className="space-y-8 relative z-10">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Progresso Acadêmico</p>
                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">{Math.round(stats?.averageProgress || 0)}<span className="text-4xl text-primary">%</span></h3>
                </div>
                <div className="space-y-3">
                  <div className="relative h-3 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-1000 ease-out"
                      style={{ width: `${stats?.averageProgress || 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em] text-center uppercase">Falta pouco para o próximo nível</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-white/5 text-slate-400 relative z-10">
              <div className="flex flex-col">
                <span className="text-white text-2xl font-black">{stats?.completed || 0}</span>
                <span className="text-[10px] font-black tracking-widest h-auto uppercase">Concluídos</span>
              </div>
              <Award className="h-10 w-10 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl flex flex-col justify-between group hover:border-emerald-500/30 transition-all duration-500 border-l-[12px] border-l-emerald-500 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 opacity-[0.03] group-hover:opacity-[0.1] transition-all duration-1000 rotate-12 group-hover:rotate-0">
              <Zap className="h-48 w-48 fill-emerald-500" />
            </div>

            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-3 text-emerald-600">
                <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="h-5 w-5 fill-emerald-600 animate-pulse" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Sugestão especial</span>
              </div>
              <h4 className="font-black text-slate-900 leading-[1.2] line-clamp-2 text-2xl tracking-tight uppercase">
                {recommendedCourse?.title || "Treinamento de Liderança Alpha"}
              </h4>
            </div>
            <Link href={recommendedCourse ? `/learning/course/${recommendedCourse.id}` : '#'} className="mt-10 relative z-10">
              <button className="w-full h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center gap-4 text-[11px] font-black uppercase tracking-widest hover:bg-primary transition-all group/btn shadow-lg hover:shadow-primary/30">
                INICIAR AGORA
                <ArrowRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-2" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* --- CONTEÚDO --- */}
      <div className="grid lg:grid-cols-12 gap-12">

        {/* Sidebar (Elevated) */}
        <aside className="lg:col-span-3 space-y-10">
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Categorias</h3>
              <LayoutGrid className="h-4 w-4 text-slate-300" />
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "flex items-center justify-between px-6 py-4 rounded-2xl text-sm font-black transition-all border-2",
                  selectedCategory === null
                    ? "bg-slate-900 text-white border-slate-900 shadow-2xl shadow-slate-200 -translate-y-1"
                    : "text-slate-500 hover:bg-white hover:border-slate-200 border-transparent bg-slate-50/50"
                )}
              >
                <div className="flex items-center gap-4">
                  <LayoutGrid className="h-5 w-5" />
                  Todos os Cursos
                </div>
                {selectedCategory === null && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={cn(
                    "flex items-center justify-between px-6 py-4 rounded-2xl text-sm font-black transition-all border-2",
                    selectedCategory === cat.name
                      ? "bg-slate-900 text-white border-slate-900 shadow-2xl shadow-slate-200 -translate-y-1"
                      : "text-slate-500 hover:bg-white hover:border-slate-200 border-transparent bg-slate-50/50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Zap className="h-5 w-5" />
                    {cat.name}
                  </div>
                  {selectedCategory === cat.name && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                </button>
              ))}
            </div>
          </div>

          <Link href="/learning/certificates">
            <div className="p-8 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/30 hover:bg-white hover:border-primary/40 hover:shadow-2xl transition-all text-center group cursor-pointer relative overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              <div className="h-14 w-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <Award className="h-7 w-7 text-slate-300 group-hover:text-primary transition-colors" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 font-bold">RECONHECIMENTO</p>
              <p className="text-base font-black text-slate-800 tracking-tight">CENTRAL DE TÍTULOS</p>
            </div>
          </Link>
        </aside>

        {/* Catalog Main Area */}
        <main className="lg:col-span-9 space-y-16">

          {/* Busca Premium */}
          <div className="relative group mx-auto w-full">
            <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within:text-primary transition-all pointer-events-none group-focus-within:scale-110" />
            <Input
              placeholder="O que você deseja aprender hoje?"
              className="h-24 pl-20 pr-40 rounded-[2rem] border-slate-200 focus:ring-primary/10 shadow-[0_10px_30px_rgba(0,0,0,0.02)] text-xl font-bold placeholder:text-slate-300 transition-all bg-white hover:shadow-xl focus:shadow-[0_20px_50px_rgba(0,0,0,0.06)] border-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <div className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black text-slate-400 border border-slate-200 uppercase tracking-widest hidden md:block">
                Search
              </div>
            </div>
          </div>

          {/* Ativos */}
          {myEnrollments.length > 0 && (
            <section className="space-y-8 animate-slide-up">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-orange-50 flex items-center justify-center">
                    <Flame className="h-6 w-6 text-orange-500" />
                  </div>
                  EM ANDAMENTO
                </h2>
                <Badge className="bg-slate-900 text-white font-black px-4 py-1.5 rounded-full text-[10px] shadow-lg tracking-widest uppercase">{myEnrollments.length} CURSOS</Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {myEnrollments.map((en) => (
                  <Link key={en.id} href={`/learning/course/${en.courseId || (en.course as any)?.id}`}>
                    <div className="bg-white border-2 border-slate-100/80 rounded-[2rem] p-8 flex items-center gap-8 hover:shadow-[0_30px_70px_rgba(0,0,0,0.08)] transition-all duration-700 group cursor-pointer border-l-[12px] border-l-primary relative overflow-hidden active:scale-[0.98]">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="h-28 w-28 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-200 relative z-10 shadow-inner group-hover:scale-105 transition-transform duration-500">
                        {en.courseThumbnail ? (
                          <img src={getPhotoUrl(en.courseThumbnail) || ''} alt={en.courseName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                        ) : <BookOpen className="h-full w-full p-8 text-slate-300" />}
                      </div>

                      <div className="flex-1 space-y-5 min-w-0 relative z-10">
                        <h3 className="font-black text-slate-900 truncate pr-4 text-2xl tracking-tighter group-hover:text-primary transition-colors">{en.courseName}</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            <span>Status</span>
                            <span className="text-primary font-black">{Math.round(en.progressPercentage)}%</span>
                          </div>
                          <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div
                              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-primary-light to-primary transition-all duration-1000 ease-out"
                              style={{ width: `${en.progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="h-14 w-14 rounded-[1.25rem] flex items-center justify-center bg-slate-50 text-slate-300 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm relative z-10 group-hover:rotate-12">
                        <Play className="h-6 w-6 fill-current ml-1" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Catálogo Principal */}
          <section className="space-y-12">
            <div className="flex items-center justify-between border-b-2 border-slate-50/50 pb-8 px-4">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Catálogo de trilhas</h2>
                <p className="text-base font-bold text-slate-400 tracking-tight italic">Explore novos horizontes e potencialize seu talento.</p>
              </div>
              <Button
                variant="outline"
                className="text-[11px] font-black uppercase tracking-[0.2em] border-2 border-slate-200 hover:border-primary/50 hover:bg-slate-50 rounded-2xl h-14 px-10 shadow-sm transition-all active:scale-95"
                onClick={() => router.push('/learning/catalog')}
              >
                VER TODOS
              </Button>
            </div>

            {filteredCourses.length > 0 ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-10">
                {filteredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    isEnrolled={myEnrollments.some(e => e.courseId === course.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-32 text-center bg-slate-50/50 rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center animate-fade-in px-8">
                <div className="h-24 w-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-10 border border-slate-100 rotate-12">
                  <BookOpen className="h-12 w-12 text-slate-200" />
                </div>
                <h4 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter uppercase">Busca sem resultados</h4>
                <p className="text-lg font-bold text-slate-400 max-w-md mx-auto leading-relaxed mb-10 italic">Infelizmente não encontramos o que você procura. Tente usar termos mais amplos ou navegue pelas categorias.</p>
                <Button
                  variant="ghost"
                  onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
                  className="h-14 px-12 rounded-2xl text-primary font-black uppercase text-xs tracking-[0.3em] hover:bg-primary/5 transition-all bg-white shadow-lg border border-primary/10"
                >
                  Limpar todos os filtros
                </Button>
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
      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-700 flex flex-col h-full group hover:-translate-y-3 relative active:scale-95">
        <div className="h-56 bg-slate-100 relative overflow-hidden">
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#0f172a]">
              <Zap className="h-16 w-16 text-white/5 transition-transform duration-700 group-hover:scale-150" />
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white/10 uppercase tracking-[0.4em] pointer-events-none">Axon Academy</span>
            </div>
          )}

          <div className="absolute top-6 left-6 z-20">
            <Badge className="bg-white/95 backdrop-blur-md text-slate-900 border-none font-black text-[9px] px-4 py-2 uppercase tracking-widest shadow-xl">
              {course.categoryName || 'GERAL'}
            </Badge>
          </div>

          {!isEnrolled && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] z-10 transition-all duration-500">
              <div className="h-16 w-16 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl transform translate-y-8 group-hover:translate-y-0 transition-all duration-500 scale-75 group-hover:scale-100">
                <Play className="h-8 w-8 fill-white ml-1" />
              </div>
            </div>
          )}

          {isEnrolled && (
            <div className="absolute inset-0 bg-primary/10 backdrop-blur-[1px] flex items-center justify-center border-b-[8px] border-b-primary z-10">
              <Badge className="bg-primary text-white font-black px-6 py-2.5 shadow-2xl select-none scale-110 uppercase tracking-widest text-[10px]">Matriculado</Badge>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>

        <div className="p-8 flex flex-col flex-1 space-y-6 relative">
          <div className="space-y-4 flex-1">
            <h3 className="font-black text-slate-900 leading-[1.2] group-hover:text-primary transition-colors line-clamp-2 text-2xl tracking-tighter uppercase">
              {course.title}
            </h3>
            <p className="text-base font-medium text-slate-400 line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity italic">
              {course.description || "Inicie este treinamento para expandir suas competências e crescer na organização."}
            </p>
          </div>

          <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-slate-400 transition-colors group-hover:text-slate-600">
                <Clock className="h-4 w-4" />
                <span className="text-[11px] font-black uppercase tracking-widest">{course.durationMinutes || 0} min</span>
              </div>
              <div className="h-2 w-2 rounded-full bg-slate-200 group-hover:bg-primary/30 transition-colors" />
              <div className="flex items-center gap-2 text-slate-400 transition-colors group-hover:text-slate-600">
                <BarChart3 className="h-4 w-4" />
                <span className="text-[11px] font-black uppercase tracking-widest">Iniciante</span>
              </div>
            </div>

            <div className="h-12 w-12 rounded-[1.25rem] bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:rotate-[360deg] transition-all duration-1000 shadow-sm group-hover:shadow-primary/30">
              <ArrowRight className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
