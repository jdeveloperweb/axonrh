'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Settings,
  Sparkles,
  Zap,
  LayoutGrid,
  List,
  Flame,
  ArrowRight,
  TrendingUp,
  Trophy,
  Play,
  Clock,
  BookOpen,
  ChevronRight,
  Star,
  Award,
  AlertCircle
} from 'lucide-react';
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
import { useRouter } from 'next/navigation';

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

  const isAdminOrRH = user?.roles?.some(role => ['ADMIN', 'RH', 'GESTOR_RH', 'ANALISTA_DP', 'MANAGER', 'LIDER'].includes(role));

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');

    const loadData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        // Garantindo que não usamos mocks se a API falhar (mostraremos estado vazio elegante)
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
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-8 animate-in fade-in duration-1000">
        <div className="relative h-24 w-24">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100/50" />
          <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
          <div className="absolute inset-4 rounded-full border-2 border-slate-100/30 border-b-indigo-500 animate-spin-slow" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Axon Academy Cloud</p>
          <h2 className="text-xl font-black text-slate-800 tracking-tighter">Preparando seu ambiente...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-32 px-4 sm:px-6 lg:px-10 animate-in fade-in duration-700">

      {/* --- HERO SECTION REVISITADA --- */}
      <section className="grid lg:grid-cols-12 gap-8 items-stretch pt-4">
        {/* Main Welcome Banner - Glassmorphism e Efeito Vibrante */}
        <div className="lg:col-span-8 relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-100 p-8 md:p-14 flex flex-col justify-center min-h-[440px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] transition-all group">

          {/* Enhanced Accent Gradients */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-blue-500/10 rounded-full blur-[120px] group-hover:bg-blue-500/20 transition-all duration-1000" />
            <div className="absolute -bottom-[20%] right-[10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px]" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] contrast-150" />
          </div>

          <div className="relative z-10 space-y-8">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl shadow-slate-200/20 transition-all hover:scale-105">
              {tenantTheme?.logoUrl ? (
                <img
                  src={getPhotoUrl(tenantTheme.logoUrl, '', 'logo') || ''}
                  alt="Logo"
                  className="h-7 w-auto object-contain"
                />
              ) : (
                <Sparkles className="h-5 w-5 text-primary" />
              )}
              <div className="h-5 w-[1px] bg-slate-200 mx-1" />
              <span className="text-slate-900 text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                Academy <Badge className="bg-primary hover:bg-primary/90 text-white border-none text-[9px] h-5 rounded-md px-2">PRO</Badge>
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[1] tracking-tight">
                {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-600 to-purple-600">
                  {user?.name?.split(' ')[0] || 'Colaborador'}
                </span>!<br />
                <span className="text-slate-900/40 font-black">Sua jornada de evolução.</span>
              </h1>
              <p className="text-slate-500 text-lg md:text-xl leading-relaxed font-medium max-w-xl">
                {myEnrollments.length > 0
                  ? `Impressionante! Você tem ${myEnrollments.length} ${myEnrollments.length === 1 ? 'treinamento ativo' : 'treinamentos ativos'} em andamento agora.`
                  : `Seu ecossistema de conhecimento Axon. Explore nossas trilhas exclusivas e turbine sua carreira.`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-6">
              <Button
                onClick={() => router.push('/learning/certificates')}
                className="h-16 px-10 rounded-2xl bg-slate-900 text-white hover:bg-black font-black uppercase tracking-widest text-[11px] transition-all shadow-xl hover:-translate-y-1 active:scale-95 flex gap-3 group"
              >
                Ver Meus Certificados
                <Award className="h-5 w-5 text-primary group-hover:rotate-12 transition-transform" />
              </Button>

              <div className="flex items-center gap-8 pl-4 border-l border-slate-100">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />
                    <span className="text-2xl font-black text-slate-900 tracking-tighter">12 dias</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Streak Atual</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500 fill-amber-500" />
                    <span className="text-2xl font-black text-slate-900 tracking-tighter">2.450</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score Total</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Column - Estilo Premium High-End */}
        <div className="lg:col-span-4 grid sm:grid-cols-2 lg:grid-cols-1 gap-6">
          <div className="bg-gradient-to-br from-primary to-indigo-700 rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-[0_20px_50px_rgba(37,99,235,0.2)] transition-all hover:scale-[1.02]">
            <div className="absolute -right-6 -top-6 opacity-10 group-hover:scale-125 group-hover:rotate-6 transition-transform duration-1000">
              <Trophy className="h-48 w-48 text-white" />
            </div>

            <div className="relative z-10 h-full flex flex-col justify-between space-y-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">Progresso de Carreira</p>
                <h3 className="text-5xl font-black text-white tracking-tighter">{Math.round(stats?.averageProgress || 0)}%</h3>
              </div>

              <div className="space-y-5">
                <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)] transition-all duration-1000"
                    style={{ width: `${stats?.averageProgress || 0}%` }}
                  />
                </div>
                <div className="flex justify-between items-center bg-black/10 p-3 rounded-2xl backdrop-blur-md">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-white/50 mb-0.5">Concluídos</span>
                    <span className="font-black text-lg">{stats?.completed || 0} cursos</span>
                  </div>
                  <Award className="h-6 w-6 text-primary-light animate-bounce" />
                </div>
              </div>
            </div>
          </div>

          {/* Recomendação Inteligente */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 flex flex-col justify-between relative overflow-hidden group shadow-card hover:shadow-xl transition-all hover:border-emerald-100">
            <div className="absolute top-0 right-0 p-6">
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center group-hover:rotate-6 transition-transform">
                <Zap className="h-7 w-7 text-emerald-500 fill-emerald-500" />
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="space-y-1">
                <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em]">Próximo Passo</p>
                <h4 className="text-xl font-bold text-slate-900 tracking-tight leading-tight line-clamp-2">
                  {recommendedCourse?.title || "Sua evolução não para."}
                </h4>
                <p className="text-xs font-semibold text-slate-400">
                  {recommendedCourse?.categoryName || "Geral"} • {recommendedCourse?.durationMinutes || 0} min
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 mt-4 border-t border-slate-50 relative z-10">
              <Link href={recommendedCourse ? `/learning/course/${recommendedCourse.id}` : '#'} className="inline-flex items-center gap-2 group/btn">
                <span className="text-[10px] font-black text-slate-900 uppercase group-hover/btn:text-primary transition-colors">Ver Detalhes</span>
                <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover/btn:rotate-45 transition-all">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <div className="grid lg:grid-cols-12 gap-10 pt-4">

        {/* --- SIDEBAR EXPLORER --- */}
        <aside className="lg:col-span-3 space-y-10">
          <div className="space-y-6">
            <div className="flex items-center justify-between px-3">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Filtrar por</h3>
              <div className="h-1 w-8 bg-primary/20 rounded-full" />
            </div>

            <nav className="flex flex-col gap-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "flex items-center justify-between px-6 py-4.5 rounded-[1.5rem] border transition-all duration-300 text-sm font-black uppercase tracking-tight",
                  selectedCategory === null
                    ? "bg-primary border-primary text-white shadow-xl shadow-primary/20"
                    : "bg-white border-slate-100 hover:border-primary/30 text-slate-600 hover:bg-slate-50/50"
                )}
              >
                <div className="flex items-center gap-4">
                  <LayoutGrid className={cn("h-4 w-4", selectedCategory === null ? "text-white" : "text-slate-400")} />
                  <span>Todos os Cursos</span>
                </div>
                {selectedCategory === null && <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
              </button>

              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={cn(
                    "flex items-center justify-between px-6 py-4.5 rounded-[1.5rem] border transition-all duration-300 text-sm font-black uppercase tracking-tight",
                    selectedCategory === cat.name
                      ? "bg-slate-900 border-slate-900 text-white shadow-xl"
                      : "bg-white border-slate-100 hover:border-slate-300 text-slate-600 hover:bg-slate-50/50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Zap className={cn("h-4 w-4", selectedCategory === cat.name ? "text-white" : "text-slate-400")} />
                    <span>{cat.name}</span>
                  </div>
                  {selectedCategory === cat.name && <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
                </button>
              ))}

              <Link href="/learning/certificates" className="mt-4">
                <Button variant="ghost" className="w-full h-auto flex flex-col items-center gap-3 p-8 rounded-[2rem] border-2 border-dashed border-slate-100 hover:border-primary/40 hover:bg-primary/5 transition-all group">
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Award className="h-6 w-6 text-slate-400 group-hover:text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Reconhecimento</p>
                    <p className="font-black text-sm uppercase text-slate-900 tracking-tight">Meus Títulos</p>
                  </div>
                </Button>
              </Link>
            </nav>
          </div>
        </aside>

        {/* --- CATALOG AREA --- */}
        <main className="lg:col-span-9 space-y-16">

          {/* Search Bar Premium */}
          <div className="flex flex-col md:flex-row gap-5">
            <div className="relative flex-1 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors pointer-events-none" />
              <Input
                placeholder="Qual conhecimento vamos buscar hoje?"
                className="h-16 pl-14 rounded-2xl bg-white border-slate-100 text-base font-bold text-slate-900 focus-visible:ring-primary/10 shadow-sm transition-all placeholder:text-slate-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="h-16 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all">
              Pesquisar
            </Button>
          </div>

          {/* Em Andamento */}
          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase flex items-center gap-3">
                <Flame className="h-6 w-6 text-orange-500 fill-orange-500 animate-pulse" />
                Treinamentos Ativos
              </h2>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{myEnrollments.length} em andamento</span>
            </div>

            {myEnrollments.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-8">
                {myEnrollments.map((enrollment) => (
                  <Link key={enrollment.id} href={`/learning/course/${enrollment.courseId || (enrollment.course as any)?.id}`}>
                    <div className="group relative bg-white border border-slate-100 rounded-[2rem] p-6 flex items-center gap-6 hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden shadow-card">
                      <div className="h-24 w-24 rounded-2xl relative overflow-hidden shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-500">
                        {enrollment.courseThumbnail ? (
                          <img
                            src={getPhotoUrl(enrollment.courseThumbnail, undefined, 'logo') || enrollment.courseThumbnail}
                            alt={enrollment.courseName}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-white/20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/5 flex items-center justify-center backdrop-blur-[1px] group-hover:backdrop-blur-none transition-all">
                          <Play className="h-5 w-5 text-white fill-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 space-y-4">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                              <p className="text-[9px] font-black uppercase text-primary/80">Andamento</p>
                            </span>
                            {enrollment.dueDate && (
                              <p className="text-[8px] font-black uppercase text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md">
                                Prazo: {new Date(enrollment.dueDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <h3 className="font-black text-lg uppercase tracking-tight text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">
                            {enrollment.courseName}
                          </h3>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black text-slate-400 tracking-wider">
                            <span>Progresso</span>
                            <span className="text-slate-900 italic">{Math.round(enrollment.progressPercentage)}%</span>
                          </div>
                          <Progress value={enrollment.progressPercentage} className="h-2 bg-slate-50" />
                        </div>
                      </div>

                      <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 group-hover:bg-primary/10 group-hover:text-primary transition-all ml-2">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[2.5rem] p-16 text-center space-y-6">
                <div className="h-20 w-20 bg-white rounded-[1.5rem] shadow-xl flex items-center justify-center mx-auto">
                  <BookOpen className="h-10 w-10 text-slate-200" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-black text-slate-900 tracking-tight uppercase">Sua trilha está limpa!</h4>
                  <p className="text-sm text-slate-500 font-medium italic">Explore o catálogo abaixo para iniciar seu próximo grande aprendizado.</p>
                </div>
              </div>
            )}
          </div>

          {/* Catálogo Completo */}
          <div className="space-y-10">
            <div className="flex items-center justify-between px-2">
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Catálogo de Trilhas</h2>
                <div className="h-1.5 w-12 bg-primary rounded-full" />
              </div>
              <Button variant="ghost" className="text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-primary" onClick={() => router.push('/learning/catalog')}>
                Ver Tabela Completa
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
              <div className="py-24 text-center space-y-8 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
                <div className="h-24 w-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl relative">
                  <BookOpen className="h-10 w-10 text-slate-100" />
                  <div className="absolute -top-2 -right-2 h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-black">?</div>
                </div>
                <div className="space-y-2 max-w-sm">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Tudo Silencioso</h3>
                  <p className="text-sm font-medium text-slate-400 leading-relaxed uppercase tracking-widest">Nenhum treinamento corresponde à sua busca atual.</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
                  className="font-black text-[10px] uppercase tracking-widest border-2 hover:bg-white px-10 h-14 rounded-2xl"
                >
                  Limpar Busca
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// --- COURSE CARD PREMIUM ---
function CourseCard({ course, isEnrolled }: { course: any, isEnrolled?: boolean }) {
  const getDifficultyColor = (lvl?: string) => {
    switch (lvl) {
      case 'AVANCADO': return 'text-purple-600 bg-purple-50';
      case 'INTERMEDIARIO': return 'text-blue-600 bg-blue-50';
      default: return 'text-emerald-600 bg-emerald-50';
    }
  };

  return (
    <Link href={`/learning/course/${course.id}`}>
      <div className="group flex flex-col h-full bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all duration-700 cursor-pointer shadow-card hover:-translate-y-2">
        <div className="h-60 relative overflow-hidden bg-slate-900">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-black/80 z-10 opacity-70 group-hover:opacity-40 transition-opacity" />

          <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-1000">
            {course.thumbnailUrl ? (
              <img src={course.thumbnailUrl} className="w-full h-full object-cover" />
            ) : (
              <Zap className="h-20 w-20 text-white/10" />
            )}
          </div>

          <div className="absolute inset-0 z-20 flex flex-col justify-between p-6">
            <div className="flex justify-between items-start">
              {course.isMandatory && (
                <Badge className="bg-rose-500 text-white border-none font-black text-[9px] uppercase px-3 py-1 shadow-xl">Obrigatório</Badge>
              )}
              {isEnrolled && (
                <Badge className="bg-emerald-500 text-white border-none font-black text-[9px] uppercase px-3 py-1 shadow-xl">Matriculado</Badge>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md text-white px-3 py-2 rounded-xl flex items-center gap-2 border border-white/20">
                <Clock className="h-4 w-4 text-primary-light" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest">{course.durationMinutes || 0} min</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 flex flex-col flex-1 space-y-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-[0.2em]", getDifficultyColor(course.difficultyLevel))}>
                {course.difficultyLevel || 'INICIANTE'}
              </span>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                {course.categoryName || 'GERAL'}
              </span>
            </div>

            <h3 className="text-xl font-black tracking-tighter leading-tight text-slate-900 group-hover:text-primary transition-colors line-clamp-2 uppercase">
              {course.title}
            </h3>

            <p className="text-[13px] text-slate-400 font-medium line-clamp-2 leading-relaxed italic pr-4">
              "{course.description}"
            </p>
          </div>

          <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Axon Academy</span>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-primary" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
