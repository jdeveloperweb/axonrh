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
  Clock
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

// --- MOCK DATA MATCHING DB TITLES ---
const MOCK_COURSES = [
  {
    id: 'c1',
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
    id: 'c2',
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
    id: 'c3',
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

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const [coursesRes, enrollmentsRes, statisticsRes, categoriesRes] = await Promise.all([
          coursesApi.listPublished().catch(() => []),
          enrollmentsApi.getActiveByEmployee(user.id).catch(() => []),
          enrollmentsApi.getStatistics(user.id).catch(() => null),
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
      const matchesCategory = !selectedCategory || course.categoryName === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [publishedCourses, searchQuery, selectedCategory]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
          <div className="absolute inset-0 rounded-full border-2 border-t-blue-600 animate-spin" />
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Iniciando Academy...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 pb-20 px-4 animate-in fade-in duration-700">

      {/* --- REFINED LIGHT HEADER --- */}
      <section className="grid lg:grid-cols-12 gap-6 pt-4">
        {/* Main Welcome Banner - LIGHT THEME */}
        <div className="lg:col-span-8 relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-8 md:p-12 flex flex-col justify-center min-h-[360px] shadow-sm">
          {/* Subtle Accent Gradients */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[100px]" />
            <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[80px]" />
          </div>

          <div className="relative z-10 space-y-8">
            <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md">
              {tenantTheme?.logoUrl ? (
                <img
                  src={getPhotoUrl(tenantTheme.logoUrl, '', 'logo') || ''}
                  alt="Logo"
                  className="h-5 w-auto object-contain"
                />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              )}
              <div className="h-3 w-[1px] bg-slate-200 mx-1" />
              <span className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">Academy Cloud</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter">
                Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  {user?.name?.split(' ')[0] || 'Explorador'}
                </span>!<br />
                Evolua hoje.
              </h1>
              <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium max-w-lg">
                Sua trilha de conhecimento está pronta. Explore novos horizontes com nossa curadoria exclusiva de treinamentos.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button className="h-12 px-8 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold transition-all shadow-lg shadow-blue-200 active:scale-95">
                Continuar Estudos
              </Button>
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-8 w-8 rounded-full bg-slate-50 border-2 border-white" />
                ))}
                <div className="h-8 w-8 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white uppercase">+12k</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Column */}
        <div className="lg:col-span-4 grid grid-rows-2 gap-6">
          {/* Progress Card */}
          <div className="bg-slate-950 rounded-2xl p-8 text-white relative overflow-hidden group shadow-xl">
            <div className="absolute -right-6 -top-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Trophy className="h-40 w-40" />
            </div>

            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Seu Progresso Médio</p>
                <h3 className="text-4xl font-black">{(stats?.averageProgress || 84).toFixed(0)}%</h3>
              </div>

              <div className="space-y-3">
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-1000"
                    style={{ width: `${stats?.averageProgress || 84}%` }}
                  />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                  {stats?.completed || 0} de {stats?.total || 3} concluídos
                </p>
              </div>
            </div>
          </div>

          {/* Activity Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden group shadow-sm">
            <div className="absolute top-0 right-0 p-6">
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:rotate-12 transition-transform">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ranking Semanal</p>
              <h4 className="text-xl font-black text-slate-900 tracking-tight">Top 5% Global</h4>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-5 w-5 rounded-full bg-slate-100 border border-white" />
                ))}
              </div>
              <span className="text-[9px] font-black text-blue-600 uppercase cursor-pointer hover:underline">Ver Tabela</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- CONTENT GRID --- */}
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">

        {/* Sidebar Mini */}
        <aside className="lg:col-span-3 space-y-8">
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Explorar</h3>
            <div className="grid gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "flex items-center gap-3 px-5 py-4 rounded-xl border transition-all text-sm font-bold shadow-sm",
                  selectedCategory === null ? "bg-slate-900 border-slate-900 text-white shadow-xl" : "bg-white border-slate-100 hover:bg-slate-50 text-slate-600"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
                Todos os Cursos
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory((cat as any).name)}
                  className={cn(
                    "flex items-center gap-3 px-5 py-4 rounded-xl border transition-all text-sm font-bold shadow-sm",
                    selectedCategory === (cat as any).name ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200" : "bg-white border-slate-100 hover:bg-slate-50 text-slate-600"
                  )}
                >
                  <Zap className="h-4 w-4" />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-600">Conquistas</h4>
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase leading-snug">Você tem 2 novos certificados disponíveis!</p>
            <div className="text-[10px] text-blue-600 font-black uppercase cursor-pointer hover:underline flex items-center gap-1">
              Acessar Certificados <ArrowRight className="h-3 w-3" />
            </div>
          </div>
        </aside>

        {/* Main Body */}
        <main className="lg:col-span-9 space-y-12">

          {/* Top Search Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <Input
                placeholder="O que vamos aprender hoje?"
                className="h-14 pl-12 bg-white border-slate-100 rounded-xl text-sm font-bold focus-visible:ring-blue-600/10 shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="h-14 w-14 rounded-xl border-slate-100 shadow-sm"><List className="h-4 w-4 text-slate-400" /></Button>
              <Button className="h-14 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 font-black uppercase tracking-widest text-[10px] shadow-sm">Filtrar</Button>
            </div>
          </div>

          {/* Continued Learning */}
          {myEnrollments.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Continuar de onde parou
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {myEnrollments.slice(0, 2).map((enrollment) => (
                  <Link key={enrollment.id} href={`/learning/course/${enrollment.courseId}`}>
                    <div className="group relative bg-white border border-slate-100 rounded-2xl p-6 flex gap-6 hover:shadow-xl transition-all cursor-pointer overflow-hidden shadow-sm">
                      <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-500">
                        <Play className="h-8 w-8 text-white fill-white" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                        <h3 className="font-black text-sm uppercase tracking-tight truncate group-hover:text-blue-600 transition-colors">{enrollment.courseName}</h3>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                            <span>Progresso</span>
                            <span className="text-blue-600 font-black">{enrollment.progressPercentage.toFixed(0)}%</span>
                          </div>
                          <Progress value={enrollment.progressPercentage} className="h-1.5 bg-slate-50" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Catalog Section */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">Catálogo de Cursos</h2>
              <Link href="/learning/catalog" className="text-[10px] font-black uppercase text-blue-600 hover:underline tracking-widest">Tabela de Treinamentos</Link>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <CourseCardSimple key={course.id} course={course} />
              ))}
            </div>

            {filteredCourses.length === 0 && (
              <div className="py-24 text-center space-y-6 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <Search className="h-8 w-8 text-slate-100" />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum treinamento encontrado.</p>
                <Button variant="ghost" onClick={() => { setSearchQuery(''); setSelectedCategory(null); }} className="font-black text-[10px] uppercase">Limpar Filtros</Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// --- COMPONENTS ---

function CourseCardSimple({ course }: { course: any }) {
  const getDifficultyStyles = (lvl?: string) => {
    switch (lvl) {
      case 'AVANCADO': return 'bg-purple-100 text-purple-700';
      case 'INTERMEDIARIO': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  // Improved seed for visual variety
  const nameHash = (course.title || "").split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const gradients = [
    'from-blue-600 to-indigo-700',
    'from-emerald-500 to-blue-600',
    'from-orange-500 to-rose-600',
    'from-slate-800 to-slate-900',
  ];
  const gIndex = nameHash % gradients.length;

  return (
    <Link href={`/learning/course/${course.id}`}>
      <div className="group flex flex-col h-full bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 cursor-pointer shadow-sm">
        {/* Visual Header */}
        <div className="h-40 relative overflow-hidden bg-slate-900">
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90 transition-transform duration-700 group-hover:scale-110", gradients[gIndex])} />

          <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-14 w-14 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:rotate-12 group-hover:scale-110 transition-all shadow-2xl">
              <Zap className="h-6 w-6 text-white fill-white/20" />
            </div>
          </div>

          <div className="absolute top-4 left-4">
            <div className="px-2 py-1 rounded-lg bg-black/20 backdrop-blur-md border border-white/10 text-[8px] font-black text-white uppercase tracking-widest">
              {course.categoryName || 'Geral'}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-6 flex flex-col flex-1 space-y-4">
          <div className="space-y-2 flex-1">
            <h3 className="text-base font-black uppercase tracking-tight leading-snug text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">{course.title}</h3>
            <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed italic">{course.description}</p>
          </div>

          <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <Clock className="h-3 w-3" /> {course.durationMinutes || '45'}m
              </span>
              <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest", getDifficultyStyles(course.difficultyLevel))}>
                {course.difficultyLevel === 'AVANCADO' ? 'Avançado' : course.difficultyLevel === 'INTERMEDIARIO' ? 'Interm.' : 'Iniciante'}
              </span>
            </div>
            <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
