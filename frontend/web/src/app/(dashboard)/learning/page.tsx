'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  BookOpen,
  GraduationCap,
  Trophy,
  Clock,
  Play,
  CheckCircle2,
  Search,
  Sparkles,
  Zap,
  LayoutGrid,
  List,
  Flame,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import {
  coursesApi,
  enrollmentsApi,
  Course,
  Enrollment,
  EnrollmentStatistics,
  TrainingCategory,
  categoriesApi,
} from '@/lib/api/learning';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

// --- MOCK DATA FOR FALLBACK ---
const MOCK_COURSES = [
  {
    id: 'c1',
    title: 'Liderança Alpha: O Guia Estratégico',
    description: 'Domine rituais de gestão, feedback e cultura para times remotos de alta performance.',
    courseType: 'ONLINE',
    difficultyLevel: 'AVANCADO',
    status: 'PUBLISHED',
    isMandatory: true,
    durationMinutes: 320,
    categoryName: 'Liderança',
    instructorName: 'Rodrigo Porto',
    modules: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c2',
    title: 'IA Generativa: Do Zero ao Prompt Pro',
    description: 'Transforme sua produtividade usando LLMs e frameworks avançados de engenharia de prompts.',
    courseType: 'ONLINE',
    difficultyLevel: 'INTERMEDIARIO',
    status: 'PUBLISHED',
    isMandatory: false,
    durationMinutes: 480,
    categoryName: 'Tecnologia',
    instructorName: 'Carlos Silveira',
    modules: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c3',
    title: 'Cultura Axon: Onboarding Definitivo',
    description: 'Nossa história, visão de futuro e guia completo de benefícios e imersão.',
    courseType: 'ONLINE',
    difficultyLevel: 'INICIANTE',
    status: 'PUBLISHED',
    isMandatory: true,
    durationMinutes: 120,
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
          coursesApi.listPublished().catch(() => ({ data: [] })),
          enrollmentsApi.getActiveByEmployee(user.id).catch(() => ({ data: [] })),
          enrollmentsApi.getStatistics(user.id).catch(() => ({ data: null })),
          categoriesApi.list().catch(() => ({ data: [] })),
        ]);

        const fetchedCourses = (coursesRes.data as any[]) || [];
        setPublishedCourses(fetchedCourses.length > 0 ? fetchedCourses : MOCK_COURSES);

        const fetchedCategories = (categoriesRes.data as any[]) || [];
        setCategories(fetchedCategories.length > 0 ? fetchedCategories : MOCK_CATEGORIES);

        setMyEnrollments(enrollmentsRes.data || []);
        setStats(statisticsRes.data);
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
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 animate-spin" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Sincronizando Ecossistema...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 pb-20 px-4">

      {/* --- SURREAL HERO --- */}
      <section className="relative overflow-hidden rounded-[3rem] bg-slate-950 border border-white/5 p-8 md:p-16">
        {/* Mesh Gradient Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px]" />
          <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-2xl space-y-8 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <Sparkles className="h-3 w-3" />
              <span>Axon Academy Cloud</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter">
              Eleve sua <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                Experiência
              </span>
            </h1>

            <p className="text-slate-400 text-base md:text-lg leading-relaxed font-medium max-w-lg">
              Acesse trilhas de conhecimento desenhadas para transformar sua carreira através da tecnologia e liderança.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <Button size="lg" className="h-12 px-8 rounded-xl bg-white text-black hover:bg-slate-100 font-bold transition-all hover:scale-105 active:scale-95">
                Começar Jornada
              </Button>
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-8 w-8 rounded-full bg-slate-800 border-2 border-slate-950" />
                ))}
                <div className="h-8 w-8 rounded-full bg-blue-600 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-white uppercase">+12k</div>
              </div>
            </div>
          </div>

          {/* Surreal Stat Card */}
          <div className="relative hidden xl:block">
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl space-y-6 rotate-3 hover:rotate-0 transition-transform duration-700">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Seu Progresso</h4>
                  <p className="text-2xl font-black text-white">84%</p>
                </div>
              </div>
              <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-[84%] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Top 5% da Empresa</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- CONTENT GRID --- */}
      <div className="grid lg:grid-cols-12 gap-10">

        {/* Sidebar Mini */}
        <aside className="lg:col-span-3 space-y-8">
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Filtros</h3>
            <div className="grid gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-sm font-bold",
                  selectedCategory === null ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20" : "bg-white border-slate-100 hover:bg-slate-50 text-slate-600"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
                Todos
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-sm font-bold",
                    selectedCategory === cat.name ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20" : "bg-white border-slate-100 hover:bg-slate-50 text-slate-600"
                  )}
                >
                  <Zap className="h-4 w-4" />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200/50 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h4 className="text-xs font-black uppercase tracking-widest">Última Conquista</h4>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase">Onboarding Master</p>
            <div className="text-[10px] text-blue-600 font-black uppercase cursor-pointer hover:underline flex items-center gap-1">
              Ver todos os certificados <ArrowRight className="h-3 w-3" />
            </div>
          </div>
        </aside>

        {/* Main Body */}
        <main className="lg:col-span-9 space-y-12">

          {/* Top Search Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="O que vamos aprender hoje?"
                className="h-14 pl-12 bg-white/50 border-slate-100 rounded-2xl text-sm font-medium focus-visible:ring-blue-500/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="h-14 w-14 rounded-2xl border-slate-100"><List className="h-4 w-4" /></Button>
              <Button className="h-14 px-8 rounded-2xl bg-slate-950 font-bold uppercase tracking-widest text-[10px]">Filtrar</Button>
            </div>
          </div>

          {/* Continued Learning (Horizontal Surreal Cards) */}
          {myEnrollments.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-black tracking-tighter uppercase flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                No seu Radar
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {myEnrollments.slice(0, 2).map((enrollment) => (
                  <Link key={enrollment.id} href={`/learning/course/${enrollment.courseId}`}>
                    <div className="group relative bg-white border border-slate-100 rounded-[2rem] p-6 flex gap-6 hover:shadow-2xl transition-all cursor-pointer overflow-hidden text-left">
                      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                        <Play className="h-8 w-8 text-white fill-white" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                        <h3 className="font-black text-sm uppercase tracking-tight truncate group-hover:text-blue-600 transition-colors">{enrollment.courseName}</h3>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                            <span>Progresso</span>
                            <span className="text-blue-600">{enrollment.progressPercentage.toFixed(0)}%</span>
                          </div>
                          <Progress value={enrollment.progressPercentage} className="h-1.5 bg-slate-100" />
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
              <h2 className="text-xl font-black tracking-tighter uppercase">Explorar Catálogo</h2>
              <Link href="/learning/catalog" className="text-[10px] font-black uppercase text-blue-600 hover:underline">Ver Tabela Completa</Link>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <CourseCardSurreal key={course.id} course={course} />
              ))}
            </div>

            {filteredCourses.length === 0 && (
              <div className="py-20 text-center space-y-4 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum curso encontrado para este filtro.</p>
                <Button variant="ghost" onClick={() => { setSearchQuery(''); setSelectedCategory(null); }} className="font-black text-[10px] uppercase">Limpar Busca</Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// --- SURREAL COMPONENTS ---

function CourseCardSurreal({ course }: { course: any }) {
  const getDifficultyStyles = (lvl?: string) => {
    switch (lvl) {
      case 'AVANCADO': return 'bg-purple-100 text-purple-700';
      case 'INTERMEDIARIO': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const seed = course.id.length % 4;
  const gradients = [
    'from-blue-600 via-indigo-600 to-purple-600',
    'from-teal-500 via-blue-600 to-indigo-700',
    'from-orange-500 via-rose-600 to-purple-600',
    'from-slate-900 via-slate-800 to-blue-900',
  ];

  return (
    <Link href={`/learning/course/${course.id}`}>
      <div className="group flex flex-col h-full bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer">
        {/* Abstract Abstract Header */}
        <div className="h-44 relative overflow-hidden bg-slate-900">
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90 transition-transform duration-700 group-hover:scale-110", gradients[seed])} />

          {/* Subtle noise pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center group-hover:rotate-12 group-hover:scale-110 transition-all">
              <Zap className="h-8 w-8 text-white fill-white/20" />
            </div>
          </div>

          <div className="absolute top-5 left-5">
            <div className="px-2 py-1 rounded-lg bg-black/20 backdrop-blur-md border border-white/10 text-[9px] font-black text-white uppercase tracking-widest">
              {course.categoryName || 'General'}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-7 flex flex-col flex-1 space-y-4">
          <div className="space-y-2 flex-1">
            <h3 className="text-base font-black uppercase tracking-tight leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">{course.title}</h3>
            <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed italic">{course.description}</p>
          </div>

          <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <Clock className="h-3 w-3" /> {course.durationMinutes || '45'}m
              </span>
              <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest", getDifficultyStyles(course.difficultyLevel))}>
                {course.difficultyLevel || 'Beginner'}
              </span>
            </div>
            <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
