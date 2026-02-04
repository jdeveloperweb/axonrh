'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
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
  Award
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

// --- MOCK DATA MATCHING DB TITLES ---
const MOCK_COURSES = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Liderança Alpha: Gestão de Times Remotos',
    description: 'Transforme sua gestão com rituais de feedback, cultura e produtividade para times distribuídos.',
    courseType: 'ONLINE',
    difficultyLevel: 'AVANCADO',
    status: 'PUBLISHED',
    isMandatory: true,
    durationMinutes: 300,
    categoryName: 'Liderança',
    instructorName: 'Dr. Rodrigo Porto',
    modules: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    title: 'IA Generativa para Negócios: Do Zero ao Pro',
    description: 'A revolução da produtividade: domine LLMs, prompt engineering e automação de fluxos de trabalho.',
    courseType: 'ONLINE',
    difficultyLevel: 'INTERMEDIARIO',
    status: 'PUBLISHED',
    isMandatory: false,
    durationMinutes: 360,
    categoryName: 'Tecnologia',
    instructorName: 'Eng. Carlos AI',
    modules: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    title: 'Bem-vindo à Axon: Guia Definitivo de Imersão',
    description: 'Sua jornada começa aqui. Entenda nossa cultura, valores e como construímos o futuro do RH.',
    courseType: 'ONLINE',
    difficultyLevel: 'INICIANTE',
    status: 'PUBLISHED',
    isMandatory: true,
    durationMinutes: 240,
    categoryName: 'Cultura',
    instructorName: 'Time de Gente',
    modules: [],
    createdAt: new Date().toISOString(),
  }
];

const MOCK_CATEGORIES: TrainingCategory[] = [
  { id: 'cat1', name: 'Liderança', icon: 'User', color: '#3b82f6', isActive: true },
  { id: 'cat2', name: 'Tecnologia', icon: 'Zap', color: '#10b981', isActive: true },
  { id: 'cat3', name: 'Cultura', icon: 'GraduationCap', color: '#8b5cf6', isActive: true },
];

export default function LearningDashboard() {
  const { user } = useAuthStore();
  const { tenantTheme } = useThemeStore();
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

        const fetchedCourses = (coursesRes as any[]) || [];
        setPublishedCourses(fetchedCourses.length > 0 ? fetchedCourses : MOCK_COURSES);

        const fetchedCategories = (categoriesRes as any[]) || [];
        setCategories(fetchedCategories.length > 0 ? fetchedCategories : MOCK_CATEGORIES);

        setMyEnrollments((enrollmentsRes as any) || []);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-8 animate-in fade-in duration-1000">
        <div className="relative h-24 w-24">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100/50" />
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin" />
          <div className="absolute inset-4 rounded-full border-2 border-slate-100/30 border-b-indigo-500 animate-spin-slow" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-blue-600 animate-pulse" />
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
    <div className="max-w-[1500px] mx-auto space-y-12 pb-32 px-6 lg:px-10 animate-in fade-in duration-1000 slide-in-from-bottom-4">

      {/* --- HERO SECTION --- */}
      <section className="grid lg:grid-cols-12 gap-8 pt-8 items-stretch">
        {/* Main Welcome Banner */}
        <div className="lg:col-span-8 relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-10 md:p-16 flex flex-col justify-center min-h-[420px] shadow-2xl shadow-slate-200/40 transition-all hover:border-blue-100/50">

          {/* Enhanced Accent Gradients */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px]" />
            <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[120px]" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] contrast-150" />
          </div>

          <div className="relative z-10 space-y-10">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-100 shadow-xl shadow-slate-200/20 transition-all hover:scale-105">
              {tenantTheme?.logoUrl ? (
                <img
                  src={getPhotoUrl(tenantTheme.logoUrl, '', 'logo') || ''}
                  alt="Logo"
                  className="h-6 w-auto object-contain"
                />
              ) : (
                <Sparkles className="h-4 w-4 text-blue-600" />
              )}
              <div className="h-4 w-[1px] bg-slate-200 mx-1" />
              <span className="text-slate-900 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                Academy <Badge className="bg-blue-600 text-white border-none text-[8px] h-4 rounded-md">Cloud</Badge>
              </span>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[0.95] tracking-tight">
                {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                  {user?.name?.split(' ')[0] || 'Colaborador'}
                </span>!<br />
                <span className="text-slate-900">
                  {myEnrollments.length > 0
                    ? 'Sua trilha de evolução continua.'
                    : 'Transforme seu futuro hoje.'}
                </span>
              </h1>
              <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium max-w-xl">
                {myEnrollments.length > 0
                  ? `Você tem ${myEnrollments.length} ${myEnrollments.length === 1 ? 'treinamento ativo' : 'treinamentos ativos'} em sua jornada.`
                  : `Seu ecossistema de conhecimento Axon. Temos ${publishedCourses.length} trilhas exclusivas prontas para você.`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-10 pt-4">
              <Link href={myEnrollments.length > 0 ? `/learning/course/${myEnrollments[0].courseId || (myEnrollments[0].course as any)?.id}` : '/learning/catalog'}>
                <Button className="h-16 px-10 rounded-2xl bg-slate-900 text-white hover:bg-black font-black uppercase tracking-widest text-[11px] transition-all shadow-2xl shadow-slate-400/20 hover:-translate-y-1 active:scale-95 flex gap-3 group ring-offset-2 hover:ring-2 ring-slate-900/10">
                  {myEnrollments.length > 0 ? 'Continuar Estudos' : 'Explorar Catálogo'}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <div className="flex items-center gap-8 divide-x divide-slate-100">
                <div className="flex flex-col pr-8">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
                    <span className="text-xl font-black text-slate-900">12 dias</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Streak Atual</span>
                </div>
                <div className="flex flex-col pl-8">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-purple-600" />
                    <span className="text-xl font-black text-slate-900">2.450 pts</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score Total</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Column */}
        <div className="lg:col-span-4 grid sm:grid-cols-2 lg:grid-cols-1 gap-6">
          {/* Progress Card */}
          <div className="bg-slate-950 rounded-2xl p-10 text-white relative overflow-hidden group shadow-2xl transition-all hover:scale-[1.02] hover:shadow-blue-500/10">
            <div className="absolute -right-6 -top-6 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-1000">
              <Trophy className="h-48 w-48 text-blue-500" />
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative z-10 h-full flex flex-col justify-between space-y-12">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400">Progresso Geral</p>
                </div>
                <h3 className="text-5xl font-black tracking-tighter">{Math.round(stats?.averageProgress || 0)}%</h3>
              </div>

              <div className="space-y-4">
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.6)] transition-all duration-1000"
                    style={{ width: `${stats?.averageProgress || 0}%` }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                    {stats?.completed || 0} de {stats?.total || 0} concluídos
                  </p>
                  <Award className="h-4 w-4 text-blue-500 opacity-60" />
                </div>
              </div>
            </div>
          </div>

          {/* Activity Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-10 flex flex-col justify-between relative overflow-hidden group shadow-xl transition-all hover:border-indigo-100">
            <div className="absolute top-0 right-0 p-8">
              <div className="h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:rotate-6 transition-transform shadow-sm">
                <TrendingUp className="h-8 w-8 text-indigo-600" />
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em]">Ranking Semanal</p>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-3xl font-black text-slate-900 tracking-tighter">14º Lugar</h4>
                  <span className="text-[11px] font-black text-emerald-500 uppercase tracking-tighter">↑ 2 posições</span>
                </div>
              </div>
              <p className="text-[11px] font-medium text-slate-400 max-w-[180px]">Você está superando <span className="text-slate-900 font-bold">95%</span> de todos os colaboradores!</p>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-50 relative z-10">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-6 w-6 rounded-full bg-slate-50 border border-white" />
                  ))}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Ver Ranking</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-white hover:bg-indigo-600 transition-colors cursor-pointer">
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CONTENT CONTAINER --- */}
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 pt-8">

        {/* --- SIDEBAR EXPLORER --- */}
        <aside className="lg:col-span-3 space-y-12">

          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Explorar</h3>
              <Sparkles className="h-3 w-3 text-blue-600" />
            </div>

            <nav className="grid gap-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "flex items-center justify-between px-6 py-5 rounded-2xl border transition-all duration-300 text-sm font-black uppercase tracking-tight group",
                  selectedCategory === null
                    ? "bg-slate-950 border-slate-950 text-white shadow-2xl shadow-slate-300"
                    : "bg-white border-slate-100 hover:border-blue-200 text-slate-600 hover:bg-slate-50/50"
                )}
              >
                <div className="flex items-center gap-4">
                  <LayoutGrid className={cn("h-4 w-4", selectedCategory === null ? "text-blue-400" : "text-slate-400")} />
                  <span>Todos os Cursos</span>
                </div>
                {selectedCategory === null && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />}
              </button>

              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "flex items-center justify-between px-6 py-5 rounded-2xl border transition-all duration-300 text-sm font-black uppercase tracking-tight group",
                    selectedCategory === cat.id
                      ? "bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-200"
                      : "bg-white border-slate-100 hover:border-blue-200 text-slate-600 hover:bg-slate-50/50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Zap className={cn("h-4 w-4", selectedCategory === cat.id ? "text-white" : "text-slate-400")} />
                    <span>{cat.name}</span>
                  </div>
                  {selectedCategory === cat.id && <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
                </button>
              ))}
            </nav>
          </div>

          {/* Achievements Highlight */}
          <div className="relative overflow-hidden p-8 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-2xl">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Star className="h-24 w-24 fill-white" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Award className="h-5 w-5 text-white" />
              </div>
              <div className="space-y-2">
                <h4 className="font-black text-lg tracking-tight uppercase leading-none">Conquistas</h4>
                <p className="text-white/70 text-[11px] font-medium">Você tem 2 novos certificados para resgatar!</p>
              </div>
              <Link href="/learning/certificates" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] bg-white text-blue-600 px-4 py-2 rounded-lg hover:scale-105 transition-transform">
                Acessar Agora
              </Link>
            </div>
          </div>
        </aside>

        {/* --- MAIN CATALOG AREA --- */}
        <main className="lg:col-span-9 space-y-16">

          {/* Search & Tool Bar */}
          <div className="flex flex-col md:flex-row gap-5">
            <div className="relative flex-1 group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-blue-600 transition-colors pointer-events-none">
                <Search className="h-full w-full" />
              </div>
              <Input
                placeholder="Qual conhecimento vamos buscar hoje?"
                className="h-16 pl-16 rounded-2xl bg-white border-slate-100 text-base font-bold text-slate-900 focus-visible:ring-blue-600/10 shadow-sm transition-all placeholder:text-slate-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="h-16 w-16 rounded-2xl border-slate-100 shadow-sm hover:bg-slate-50 transition-all">
                <List className="h-5 w-5 text-slate-400" />
              </Button>
              <Button className="h-16 px-10 rounded-2xl bg-slate-900 hover:bg-black font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-slate-200 transition-all hover:-translate-y-0.5">
                Filtrar
              </Button>
            </div>
          </div>

          {/* Continue Learning Section */}
          <div className="space-y-8 animate-in slide-in-from-left-4 duration-700 delay-100">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase flex items-center gap-3">
                <Flame className="h-6 w-6 text-orange-500 fill-orange-500" />
                Meus Treinamentos em Andamento
              </h2>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{myEnrollments.length} em andamento</span>
            </div>

            {myEnrollments.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-8">
                {myEnrollments.map((enrollment) => (
                  <Link key={enrollment.id} href={`/learning/course/${enrollment.courseId || (enrollment.course as any)?.id}`}>
                    <div className="group relative bg-white border border-slate-100 rounded-3xl p-6 flex items-center gap-6 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-700 cursor-pointer overflow-hidden shadow-sm hover:border-blue-100/50">

                      {/* Interactive Background Glow */}
                      <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-100/30 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                      {/* Course Identity Thumbnail */}
                      <div className="h-24 w-24 rounded-2xl relative overflow-hidden shrink-0 shadow-xl group-hover:scale-110 transition-all duration-700 group-hover:rotate-2">
                        {enrollment.courseThumbnail ? (
                          <img
                            src={getPhotoUrl(enrollment.courseThumbnail, undefined, 'logo') || enrollment.courseThumbnail}
                            alt={enrollment.courseName}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950" />
                        )}

                        {/* Overlay with glass effect and play icon */}
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-blue-600/40 transition-all duration-500 flex items-center justify-center backdrop-blur-[1px] group-hover:backdrop-blur-none">
                          <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center scale-90 group-hover:scale-100 transition-transform">
                            <Play className="h-4 w-4 text-white fill-white" />
                          </div>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 min-w-0 space-y-4 relative z-10">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600/80">
                                {enrollment.status === 'COMPLETED' ? 'Concluído' : 'Em andamento'}
                              </p>
                            </div>

                            {enrollment.dueDate && (
                              <Badge className={cn(
                                "text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1 border-none shadow-sm",
                                new Date(enrollment.dueDate) < new Date() ? "bg-rose-500 text-white" : "bg-orange-100 text-orange-700"
                              )}>
                                <Clock className="h-2 w-2" />
                                {Math.max(0, Math.ceil((new Date(enrollment.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))} dias
                              </Badge>
                            )}
                          </div>

                          <h3 className="font-black text-lg uppercase tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors truncate pr-4">
                            {enrollment.courseName || (enrollment.course as any)?.title}
                          </h3>
                        </div>

                        {/* Progress Section */}
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-end">
                            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Progresso de Aprendizado</span>
                            <span className="text-xs font-black text-slate-900 italic">{enrollment.progressPercentage?.toFixed(0) || 0}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-[2px]">
                            <div
                              className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.3)] transition-all duration-1000 group-hover:shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                              style={{ width: `${enrollment.progressPercentage || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Floating Action Hint */}
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 hidden lg:block">
                        <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/40">
                          <ChevronRight className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-4">
                <BookOpen className="h-12 w-12 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <p className="font-black text-slate-900 uppercase tracking-tight">Nenhuma inscrição ativa</p>
                  <p className="text-sm text-slate-500 font-medium">Explore o catálogo abaixo para iniciar sua primeira trilha de conhecimento.</p>
                </div>
              </div>
            )}
          </div>

          {/* Catalog Grid */}
          <div className="space-y-10">
            <div className="flex items-center justify-between px-2">
              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Catálogo Axon</h2>
                <div className="h-1.5 w-12 bg-blue-600 rounded-full" />
              </div>
              <Link href="/learning/catalog" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 hover:underline tracking-[0.2em] transition-colors">
                Ver Tabela Completa
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-10">
              {filteredCourses.map((course, idx) => (
                <div key={course.id} className="animate-in fade-in slide-in-from-bottom-6 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                  <CourseCard
                    course={course}
                    isEnrolled={myEnrollments.some(e => e.courseId === course.id || (e.course as any)?.id === course.id)}
                  />
                </div>
              ))}
            </div>

            {filteredCourses.length === 0 && (
              <div className="py-32 text-center space-y-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 animate-in fade-in duration-700">
                <div className="h-24 w-24 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                  <BookOpen className="h-10 w-10 text-slate-200" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Nenhum treinamento encontrado</h3>
                  <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Tente ajustar seus filtros ou busca.</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
                  className="font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white transition-all px-8 h-12 rounded-xl"
                >
                  Limpar Todos Filtros
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// --- REFINED COMPONENTS ---

function CourseCard({ course, isEnrolled }: { course: any, isEnrolled?: boolean }) {
  const getDifficultyStyles = (lvl?: string) => {
    switch (lvl) {
      case 'AVANCADO': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'INTERMEDIARIO': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  const nameHash = (course.title || "").split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const gradients = [
    'from-blue-600 to-indigo-700',
    'from-indigo-600 to-purple-700',
    'from-slate-800 to-slate-950',
    'from-emerald-600 to-blue-700',
  ];
  const gIndex = nameHash % gradients.length;

  return (
    <Link href={`/learning/course/${course.id}`}>
      <div className="group flex flex-col h-full bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-700 cursor-pointer shadow-sm hover:-translate-y-2 border-b-4 hover:border-b-blue-600">

        {/* Course Thumbnail Header */}
        <div className="h-56 relative overflow-hidden bg-slate-900">
          {/* Main Background Gradient */}
          <div className={cn("absolute inset-0 bg-gradient-to-br transition-all duration-1000 group-hover:scale-110 group-hover:rotate-2", gradients[gIndex])} />

          {/* Textures and Overlays */}
          <div className="absolute inset-0 opacity-[0.2] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] group-hover:opacity-[0.1] transition-opacity" />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />

          {/* Floating Icon Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-20 w-20 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 shadow-2xl">
              <Zap className="h-8 w-8 text-white fill-white/20" />
            </div>
          </div>

          {/* Category Badge Top Left */}
          <div className="absolute top-6 left-6">
            <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-none px-3 py-1 font-black text-[9px] uppercase tracking-[0.2em] shadow-xl">
              {course.categoryName || 'Geral'}
            </Badge>
          </div>

          {/* Enrolled Badge Botton Left */}
          {isEnrolled && (
            <div className="absolute bottom-6 left-6">
              <Badge className="bg-emerald-500 text-white border-none px-3 py-1 font-black text-[9px] uppercase tracking-[0.2em] shadow-xl">
                Matriculado
              </Badge>
            </div>
          )}

          {/* Mandatory Badge Top Right */}
          {course.isMandatory && (
            <div className="absolute top-6 right-6">
              <div className="h-10 w-10 rounded-full bg-rose-500/90 backdrop-blur-md flex items-center justify-center shadow-xl animate-pulse">
                <Star className="h-4 w-4 text-white fill-white" />
              </div>
            </div>
          )}
        </div>

        {/* Course Details */}
        <div className="p-8 flex flex-col flex-1 space-y-6">
          <div className="space-y-3 flex-1">
            <h3 className="text-xl font-black uppercase tracking-tight leading-[1.1] text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {course.title}
            </h3>
            <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed italic">
              {course.description}
            </p>
          </div>

          <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Duração</span>
                <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-900 uppercase">
                  <Clock className="h-3 w-3 text-blue-500" /> {course.durationMinutes || '45'}m
                </span>
              </div>
              <div className="h-8 w-[1px] bg-slate-100" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Nível</span>
                <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border", getDifficultyStyles(course.difficultyLevel))}>
                  {course.difficultyLevel === 'AVANCADO' ? 'Pro' : course.difficultyLevel === 'INTERMEDIARIO' ? 'Interm' : 'Basic'}
                </span>
              </div>
            </div>

            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-90 transition-all duration-500 shadow-sm">
              <ArrowRight className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
