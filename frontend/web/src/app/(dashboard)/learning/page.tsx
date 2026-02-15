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
        <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Carregando sua academia...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-20">

      {/* --- HERO SECTION (Ajustada) --- */}
      <section className="grid lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 relative overflow-hidden rounded-xl border border-slate-200 bg-white p-8 md:p-12 shadow-sm flex flex-col justify-center min-h-[380px]">
          {/* Sutil gradiente de fundo */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-slate-50/50 to-transparent pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 font-bold px-3 py-1">
                ACADEMY PRO
              </Badge>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                {greeting}, <span className="text-primary">{user?.name?.split(' ')[0]}</span>!
              </h1>
              <p className="text-slate-500 text-lg font-medium max-w-lg">
                Continue sua jornada de desenvolvimento e alcance novos patamares na sua carreira.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Button
                onClick={() => router.push('/learning/certificates')}
                className="h-12 px-8 rounded-lg font-bold text-sm transition-all shadow-md flex gap-2"
              >
                <Award className="h-4 w-4" />
                VER MEUS CERTIFICADOS
              </Button>

              <div className="flex items-center gap-6 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
                  <span className="text-sm font-bold text-slate-700">12 dias de foco</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-slate-700">2.450 pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Recomendação */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-900 rounded-xl p-8 text-white relative overflow-hidden shadow-lg flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Progresso de Carreira</p>
              <h3 className="text-5xl font-black tracking-tighter">{Math.round(stats?.averageProgress || 0)}%</h3>
              <Progress value={stats?.averageProgress} className="h-2 bg-white/10" />
            </div>
            <div className="flex items-center justify-between text-sm font-medium pt-4 text-slate-300">
              <span>{stats?.completed || 0} Cursos Concluídos</span>
              <Award className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between group hover:border-primary/50 transition-all">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-emerald-600">
                <Zap className="h-4 w-4 fill-emerald-600" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Próximo Passo</span>
              </div>
              <h4 className="font-bold text-slate-900 leading-tight line-clamp-2">
                {recommendedCourse?.title || "Mantenha-se em evolução"}
              </h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4 w-full border border-slate-100 hover:bg-slate-50 text-xs font-bold"
              onClick={() => recommendedCourse && router.push(`/learning/course/${recommendedCourse.id}`)}
            >
              VER DETALHES <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          </div>
        </div>
      </section>

      {/* --- GRID DE CONTEÚDO --- */}
      <div className="grid lg:grid-cols-12 gap-8">

        {/* Sidebar Categorias (Mais discreta) */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="p-1.5 bg-slate-100/50 rounded-xl border border-slate-200 flex flex-col gap-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all",
                selectedCategory === null
                  ? "bg-white text-primary shadow-sm ring-1 ring-slate-200"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
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
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all",
                  selectedCategory === cat.name
                    ? "bg-white text-primary shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                )}
              >
                <Zap className="h-4 w-4" />
                {cat.name}
              </button>
            ))}
          </div>

          <Link href="/learning/certificates">
            <div className="p-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 hover:bg-white hover:border-primary/50 transition-all text-center space-y-2 group cursor-pointer">
              <Award className="h-6 w-6 mx-auto text-slate-400 group-hover:text-primary transition-colors" />
              <p className="text-xs font-bold text-slate-600">CENTRAL DE TÍTULOS</p>
            </div>
          </Link>
        </aside>

        {/* Catalog Area */}
        <main className="lg:col-span-9 space-y-10">

          {/* Busca Simplificada */}
          <div className="relative group max-w-2xl px-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Pesquisar treinamentos e trilhas..."
              className="h-14 pl-12 rounded-xl border-slate-200 focus:ring-primary shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Treinamentos Ativos */}
          {myEnrollments.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Continue seus Estudo
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {myEnrollments.map((en) => (
                  <Link key={en.id} href={`/learning/course/${en.courseId || (en.course as any)?.id}`}>
                    <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 hover:shadow-md transition-all group">
                      <div className="h-16 w-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                        {en.courseThumbnail ? (
                          <img src={getPhotoUrl(en.courseThumbnail)} alt={en.courseName} className="w-full h-full object-cover" />
                        ) : <BookOpen className="h-full w-full p-4 text-slate-300" />}
                      </div>
                      <div className="flex-1 space-y-2 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate group-hover:text-primary transition-colors">{en.courseName}</h3>
                        <Progress value={en.progressPercentage} className="h-1.5" />
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          <span>{Math.round(en.progressPercentage)}% concluído</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {en.dueDate ? 'Prazo próximo' : 'Sem prazo'}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Catálogo */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">Catálogo de Cursos</h2>
              <span className="text-xs font-bold text-slate-400 tracking-widest">{filteredCourses.length} disponíveis</span>
            </div>

            {filteredCourses.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    isEnrolled={myEnrollments.some(e => e.courseId === course.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <BookOpen className="h-12 w-12 mx-auto text-slate-200 mb-4" />
                <p className="text-sm font-bold text-slate-500">Nenhum curso encontrado para sua busca.</p>
                <Button variant="link" onClick={() => { setSearchQuery(''); setSelectedCategory(null); }} className="text-primary font-bold mt-2">
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

// --- CARD DE CURSO (ALINHADO AO SISTEMA) ---
function CourseCard({ course, isEnrolled }: { course: any, isEnrolled?: boolean }) {
  return (
    <Link href={`/learning/course/${course.id}`}>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/30 transition-all flex flex-col h-full group">
        <div className="h-40 bg-slate-100 relative overflow-hidden">
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-900">
              <Zap className="h-10 w-10 text-white/10" />
            </div>
          )}
          <Badge className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-900 border-none font-bold text-[10px] px-2 py-0.5">
            {course.categoryName || 'TREINAMENTO'}
          </Badge>
          {isEnrolled && (
            <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center">
              <Badge className="bg-primary text-white font-bold">INSCRITO</Badge>
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col flex-1 space-y-4">
          <div className="space-y-1 flex-1">
            <h3 className="font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {course.title}
            </h3>
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {course.description}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase">{course.durationMinutes || 0} min</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
