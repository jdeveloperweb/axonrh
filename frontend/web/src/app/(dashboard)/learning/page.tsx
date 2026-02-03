'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Filter,
  Star,
  Video,
  FileText,
  ArrowRight,
  TrendingUp,
  LayoutGrid,
  List,
  Flame,
  User,
  Zap,
} from 'lucide-react';
import Image from "next/image";
import Link from 'next/link';
import {
  coursesApi,
  enrollmentsApi,
  certificatesApi,
  Course,
  Enrollment,
  Certificate,
  EnrollmentStatistics,
  TrainingCategory,
  categoriesApi,
} from '@/lib/api/learning';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

// Mock Courses to fill the screen
const MOCK_COURSES: Course[] = [
  {
    id: 'course-1',
    title: 'Liderança de Alta Performance',
    description: 'Desenvolva habilidades essenciais para liderar equipes em ambientes dinâmicos e desafiadores.',
    courseType: 'ONLINE',
    difficultyLevel: 'AVANCADO',
    status: 'PUBLISHED',
    isMandatory: true,
    price: 0,
    durationMinutes: 480,
    thumbnailUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop',
    instructorName: 'Mariana Silva',
    modules: [
      { id: 'm1', courseId: 'course-1', title: 'Fundamentos', sequenceOrder: 1, isRequired: true, lessons: [{ id: 'l1', moduleId: 'm1', title: 'Introdução', contentType: 'VIDEO', sequenceOrder: 1, isRequired: true, isDownloadable: false }] }
    ],
    createdAt: new Date().toISOString(),
    requiresApproval: false,
    passingScore: 70,
    allowRetake: true,
    maxRetakes: 3,
    categoryName: 'Liderança',
  } as Course,
  {
    id: 'course-2',
    title: 'Comunicação Não-Violenta no Trabalho',
    description: 'Aprenda as técnicas de CNV para melhorar o clima organizacional e resolver conflitos de forma produtiva.',
    courseType: 'ONLINE',
    difficultyLevel: 'INTERMEDIARIO',
    status: 'PUBLISHED',
    isMandatory: false,
    price: 0,
    durationMinutes: 120,
    thumbnailUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=800&auto=format&fit=crop',
    instructorName: 'Roberto Almeida',
    modules: [],
    createdAt: new Date().toISOString(),
    requiresApproval: false,
    passingScore: 70,
    allowRetake: true,
    maxRetakes: 3,
    categoryName: 'Soft Skills',
  } as Course,
  {
    id: 'course-3',
    title: 'Excel Avançado para RH',
    description: 'Domine tabelas dinâmicas, PROCV e automações voltadas para gestão de pessoas e indicadores.',
    courseType: 'ONLINE',
    difficultyLevel: 'AVANCADO',
    status: 'PUBLISHED',
    isMandatory: false,
    price: 0,
    durationMinutes: 600,
    thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop',
    instructorName: 'Carlos Ferreira',
    modules: [],
    createdAt: new Date().toISOString(),
    requiresApproval: false,
    passingScore: 70,
    allowRetake: true,
    maxRetakes: 3,
    categoryName: 'Tecnologia',
  } as Course,
  {
    id: 'course-4',
    title: 'Diversidade e Inclusão na Prática',
    description: 'Como construir uma cultura inclusiva e diversa que gere valor real para a organização.',
    courseType: 'ONLINE',
    difficultyLevel: 'INICIANTE',
    status: 'PUBLISHED',
    isMandatory: true,
    price: 0,
    durationMinutes: 180,
    thumbnailUrl: 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?q=80&w=800&auto=format&fit=crop',
    instructorName: 'Ana Paula Santos',
    modules: [],
    createdAt: new Date().toISOString(),
    requiresApproval: false,
    passingScore: 70,
    allowRetake: true,
    maxRetakes: 3,
    categoryName: 'Cultura',
  } as Course,
  {
    id: 'course-5',
    title: 'Gestão de Tempo e Produtividade',
    description: 'Técnicas modernas de organização pessoal para otimizar resultados e evitar o burnout.',
    courseType: 'ONLINE',
    difficultyLevel: 'INICIANTE',
    status: 'PUBLISHED',
    isMandatory: false,
    price: 0,
    durationMinutes: 90,
    thumbnailUrl: 'https://images.unsplash.com/photo-1495364141860-b0d03eccd065?q=80&w=800&auto=format&fit=crop',
    instructorName: 'Juliana Mendes',
    modules: [],
    createdAt: new Date().toISOString(),
    requiresApproval: false,
    passingScore: 70,
    allowRetake: true,
    maxRetakes: 3,
    categoryName: 'Produtividade',
  } as Course,
  {
    id: 'course-6',
    title: 'People Analytics: O Guia Completo',
    description: 'Transforme dados em decisões estratégicas utilizando ferramentas modernas de análise.',
    courseType: 'ONLINE',
    difficultyLevel: 'AVANCADO',
    status: 'PUBLISHED',
    isMandatory: false,
    price: 0,
    durationMinutes: 720,
    thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bbda38a5f452?q=80&w=800&auto=format&fit=crop',
    instructorName: 'Fernando Costa',
    modules: [],
    createdAt: new Date().toISOString(),
    requiresApproval: false,
    passingScore: 70,
    allowRetake: true,
    maxRetakes: 3,
    categoryName: 'Tecnologia',
  } as Course,
  {
    id: 'course-7',
    title: 'Saúde Mental no Trabalho',
    description: 'Como identificar sinais de estresse e promover o bem-estar psicológico na sua rotina.',
    courseType: 'ONLINE',
    difficultyLevel: 'INICIANTE',
    status: 'PUBLISHED',
    isMandatory: false,
    price: 0,
    durationMinutes: 150,
    thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop',
    instructorName: 'Dra. Luana Braga',
    modules: [],
    createdAt: new Date().toISOString(),
    requiresApproval: false,
    passingScore: 70,
    allowRetake: true,
    maxRetakes: 3,
    categoryName: 'Soft Skills',
  } as Course,
  {
    id: 'course-8',
    title: 'Cybersecurity: Proteção de Dados',
    description: 'Fundamentos de segurança da informação para proteger sua empresa e dados pessoais.',
    courseType: 'ONLINE',
    difficultyLevel: 'INTERMEDIARIO',
    status: 'PUBLISHED',
    isMandatory: true,
    price: 0,
    durationMinutes: 240,
    thumbnailUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop',
    instructorName: 'Mateus Oliveira',
    modules: [],
    createdAt: new Date().toISOString(),
    requiresApproval: false,
    passingScore: 80,
    allowRetake: true,
    maxRetakes: 5,
    categoryName: 'Tecnologia',
  } as Course,
  {
    id: 'course-9',
    title: 'Vendas Consultivas B2B',
    description: 'Maximize seus resultados comerciais com técnicas avançadas de negociação e fechamento.',
    courseType: 'ONLINE',
    difficultyLevel: 'INTERMEDIARIO',
    status: 'PUBLISHED',
    isMandatory: false,
    price: 0,
    durationMinutes: 450,
    thumbnailUrl: 'https://images.unsplash.com/photo-1552581234-26160f608093?q=80&w=800&auto=format&fit=crop',
    instructorName: 'Ricardo Sales',
    modules: [],
    createdAt: new Date().toISOString(),
    requiresApproval: false,
    passingScore: 70,
    allowRetake: true,
    maxRetakes: 3,
    categoryName: 'Vendas',
  } as Course,
  {
    id: 'course-10',
    title: 'Inteligência Artificial no Dia a Dia',
    description: 'Como utilizar ferramentas de IA generativa para aumentar sua produtividade em 2x.',
    courseType: 'ONLINE',
    difficultyLevel: 'INICIANTE',
    status: 'PUBLISHED',
    isMandatory: false,
    price: 0,
    durationMinutes: 300,
    thumbnailUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop',
    instructorName: 'Tiago Souza',
    modules: [],
    createdAt: new Date().toISOString(),
    requiresApproval: false,
    passingScore: 70,
    allowRetake: true,
    maxRetakes: 3,
    categoryName: 'Tecnologia',
  } as Course,
  {
    id: 'course-11',
    title: 'Design Thinking para Inovação',
    description: 'Uma metodologia prática para resolver problemas complexos e criar soluções centradas no humano.',
    courseType: 'ONLINE',
    difficultyLevel: 'INTERMEDIARIO',
    status: 'PUBLISHED',
    isMandatory: false,
    price: 0,
    durationMinutes: 360,
    thumbnailUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800&auto=format&fit=crop',
    instructorName: 'Beatriz Martins',
    modules: [],
    createdAt: new Date().toISOString(),
    requiresApproval: false,
    passingScore: 70,
    allowRetake: true,
    maxRetakes: 3,
    categoryName: 'Cultura',
  } as Course,
  {
    id: 'course-12',
    title: 'Finanças Pessoais e Investimentos',
    description: 'Aprenda a gerir seu dinheiro e comece a investir no mercado financeiro de forma inteligente.',
    courseType: 'ONLINE',
    difficultyLevel: 'INICIANTE',
    status: 'PUBLISHED',
    isMandatory: false,
    price: 0,
    durationMinutes: 520,
    thumbnailUrl: 'https://images.unsplash.com/photo-1579621970795-87f957f60017?q=80&w=800&auto=format&fit=crop',
    instructorName: 'Paulo Guedes',
    modules: [],
    createdAt: new Date().toISOString(),
    requiresApproval: false,
    passingScore: 70,
    allowRetake: true,
    maxRetakes: 3,
    categoryName: 'Geral',
  } as Course,
];

const MOCK_CATEGORIES: TrainingCategory[] = [
  { id: 'cat-1', name: 'Liderança', icon: 'User', color: '#3b82f6', isActive: true },
  { id: 'cat-2', name: 'Soft Skills', icon: 'Zap', color: '#f59e0b', isActive: true },
  { id: 'cat-3', name: 'Tecnologia', icon: 'LayoutGrid', color: '#10b981', isActive: true },
  { id: 'cat-4', name: 'Cultura', icon: 'GraduationCap', color: '#8b5cf6', isActive: true },
  { id: 'cat-5', name: 'Produtividade', icon: 'Clock', color: '#ef4444', isActive: true },
  { id: 'cat-6', name: 'Vendas', icon: 'TrendingUp', color: '#ec4899', isActive: true },
];

export default function LearningDashboard() {
  const { user } = useAuthStore();
  const [publishedCourses, setPublishedCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<TrainingCategory[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [myCertificates, setMyCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState<EnrollmentStatistics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const [coursesRes, enrollmentsRes, certificatesRes, statisticsRes, categoriesRes] = await Promise.all([
          coursesApi.listPublished().catch(() => ({ data: [] })),
          enrollmentsApi.getActiveByEmployee(user.id).catch(() => ({ data: [] })),
          certificatesApi.getByEmployee(user.id).catch(() => ({ data: [] })),
          enrollmentsApi.getStatistics(user.id).catch(() => ({ data: null })),
          categoriesApi.list().catch(() => ({ data: [] })),
        ]);

        // Merge real data with mock data if real data is empty or few
        const fetchedCourses = coursesRes.data || [];
        if (fetchedCourses.length < 3) {
          setPublishedCourses([...fetchedCourses, ...MOCK_COURSES]);
        } else {
          setPublishedCourses(fetchedCourses);
        }

        const fetchedCategories = categoriesRes.data || [];
        if (fetchedCategories.length === 0) {
          setCategories(MOCK_CATEGORIES);
        } else {
          setCategories(fetchedCategories);
        }

        setMyEnrollments(enrollmentsRes.data || []);
        setMyCertificates(certificatesRes.data || []);
        setStats(statisticsRes.data);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const filteredCourses = useMemo(() => {
    return publishedCourses.filter((course) => {
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = !selectedCategory || course.categoryName === selectedCategory || course.categoryId === selectedCategory;
      const matchesLevel = !selectedLevel || course.difficultyLevel === selectedLevel;

      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [publishedCourses, searchQuery, selectedCategory, selectedLevel]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-[#030712] text-white p-8 md:p-12 min-h-[400px] flex flex-col md:flex-row items-center justify-between border border-white/10">
        <div className="relative z-10 max-w-xl space-y-6">
          <Badge className="bg-white/10 hover:bg-white/20 text-blue-400 border-none px-4 py-1 text-xs backdrop-blur-md">
            Plataforma Axon Academy
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Explore seu <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">potencial</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Mergulhe em trilhas de conhecimento exclusivas, desenhadas por especialistas para acelerar seu crescimento profissional na Axon.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Button size="lg" className="rounded-full px-8 bg-white text-black hover:bg-white/90 font-semibold h-12">
              Iniciar Jornada
            </Button>
            <div className="flex items-center -space-x-3 overflow-hidden ml-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-[#030712] relative overflow-hidden bg-gray-600">
                  <Image src={`https://i.pravatar.cc/150?u=${i + 10}`} fill alt="User avatar" />
                </div>
              ))}
              <div className="flex h-8 w-12 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-white ring-2 ring-[#030712] backdrop-blur-md">
                +12k
              </div>
            </div>
            <span className="text-xs text-blue-400 font-medium">alunos ativos</span>
          </div>
        </div>

        {/* Hero Decorative Elements */}
        <div className="hidden lg:block relative w-[450px] h-[350px]">
          <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
            <div className="relative w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop"
                fill
                alt="Learning Illustration"
                className="object-cover opacity-60 mix-blend-overlay"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 p-8">
                  <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                    <Trophy className="h-8 w-8 text-amber-500 mb-2" />
                    <div className="text-xs font-medium text-white/60">CONQUISTAS</div>
                    <div className="text-xl font-bold">15.4k+</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 transform rotate-6 translate-y-8 hover:rotate-0 transition-transform duration-500">
                    <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
                    <div className="text-xs font-medium text-white/60">PROGRESSO</div>
                    <div className="text-xl font-bold">84%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories & Search */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-3 flex-1">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
              Categorias
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="rounded-full"
              >
                Todas
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.name ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                  className="rounded-full flex items-center gap-2"
                >
                  <span className="text-xs">{cat.name}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="O que você quer aprender hoje?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-muted/30 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-blue-500/50"
              />
            </div>
            <div className="flex items-center bg-muted/30 p-1 rounded-xl">
              <Button
                variant={viewType === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9 rounded-lg"
                onClick={() => setViewType('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewType === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9 rounded-lg"
                onClick={() => setViewType('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Levels Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <span className="text-sm font-medium text-muted-foreground mr-2">Nível:</span>
          {['INICIANTE', 'INTERMEDIARIO', 'AVANCADO'].map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm transition-all whitespace-nowrap",
                selectedLevel === level
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {level === 'INICIANTE' ? '💡 Iniciante' :
                level === 'INTERMEDIARIO' ? '⚡ Intermediário' : '🔥 Avançado'}
            </button>
          ))}
        </div>
      </div>

      {/* Continue Learning */}
      {myEnrollments.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />
              Continuar Aprendendo
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myEnrollments.slice(0, 3).map((enrollment) => (
              <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        </section>
      )}

      {/* Course Catalog */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-blue-500" />
            Catálogo de Cursos
          </h2>
          <span className="text-sm text-muted-foreground font-medium">
            {filteredCourses.length} cursos encontrados
          </span>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border border-dashed border-muted">
            <div className="h-16 w-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Nenhum curso encontrado</h3>
            <p className="text-muted-foreground max-w-xs text-center mt-2">
              Tente ajustar seus filtros ou busca para encontrar o que procura.
            </p>
            <Button variant="link" onClick={() => { setSearchQuery(''); setSelectedCategory(null); setSelectedLevel(null); }} className="mt-2 text-blue-600">
              Limpar filtros
            </Button>
          </div>
        ) : (
          <div className={cn(
            "grid gap-6",
            viewType === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
          )}>
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} viewType={viewType} />
            ))}
          </div>
        )}

        <div className="flex justify-center pt-8">
          <Link href="/learning/catalog">
            <Button variant="outline" className="rounded-xl px-12 h-12 hover:bg-blue-600 hover:text-white transition-all group">
              Explorar Catálogo Completo
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features / Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
        <QuickCard
          icon={<GraduationCap className="h-6 w-6" />}
          title="Trilhas de Aprendizagem"
          description="Caminhos estruturados para o seu desenvolvimento profissional."
          href="/learning/paths"
          color="bg-purple-500/10 text-purple-600"
        />
        <QuickCard
          icon={<CheckCircle2 className="h-6 w-6" />}
          title="Treinamentos Obrigatórios"
          description="Fique em dia com as certificações exigidas para sua função."
          href="/learning/mandatory"
          color="bg-blue-500/10 text-blue-600"
        />
        <QuickCard
          icon={<Trophy className="h-6 w-6" />}
          title="Minhas Conquistas"
          description="Veja seus certificados e badges conquistados até agora."
          href="/learning/certificates"
          color="bg-amber-500/10 text-amber-600"
        />
      </div>
    </div>
  );
}

// Enrollment Card (In Progress)
function EnrollmentCard({ enrollment }: { enrollment: Enrollment }) {
  return (
    <Link href={`/learning/course/${enrollment.courseId}`}>
      <Card className="group overflow-hidden border-none bg-muted/30 hover:bg-muted/50 transition-all duration-300">
        <CardContent className="p-0">
          <div className="flex p-4 gap-4">
            <div className="h-20 w-20 rounded-xl bg-blue-600/10 flex-shrink-0 relative overflow-hidden">
              {enrollment.courseThumbnail ? (
                <Image src={enrollment.courseThumbnail} fill className="object-cover" alt="" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="h-8 w-8 text-blue-600 fill-blue-600/20" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              <h3 className="font-bold text-sm line-clamp-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                {enrollment.courseName}
              </h3>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase">
                  <span>Progresso</span>
                  <span className="text-blue-600">{enrollment.progressPercentage.toFixed(0)}%</span>
                </div>
                <Progress value={enrollment.progressPercentage} className="h-1.5" />
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Retomar aula 4 de 12
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Course Card
function CourseCard({ course, viewType }: { course: Course; viewType: 'grid' | 'list' }) {
  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const getDifficultyColor = (level?: string) => {
    const colors: Record<string, string> = {
      INICIANTE: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
      INTERMEDIARIO: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
      AVANCADO: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    };
    return colors[level || ''] || 'bg-gray-100 text-gray-700';
  };

  if (viewType === 'list') {
    return (
      <Link href={`/learning/course/${course.id}`}>
        <div className="flex gap-6 p-4 rounded-2xl border hover:border-blue-500/50 hover:bg-muted/10 transition-all group">
          <div className="h-24 w-40 rounded-xl overflow-hidden relative flex-shrink-0 bg-muted">
            {course.thumbnailUrl ? (
              <Image src={course.thumbnailUrl} fill className="object-cover group-hover:scale-110 transition-transform duration-500" alt={course.title} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-primary/30" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg group-hover:text-blue-600 transition-colors uppercase tracking-tight">{course.title}</h3>
              {course.isMandatory && <Badge variant="destructive" className="h-5 text-[10px] uppercase">Obrigatório</Badge>}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">{course.description}</p>
            <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
              <span className={cn("px-2 py-0.5 rounded-md", getDifficultyColor(course.difficultyLevel))}>
                {course.difficultyLevel}
              </span>
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{formatDuration(course.durationMinutes)}</span>
              <span className="flex items-center gap-1.5"><Video className="h-3.5 w-3.5" />{course.modules?.length || 0} módulos</span>
              <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />4.8</span>
            </div>
          </div>
          <div className="flex items-center">
            <Button size="icon" variant="ghost" className="rounded-full group-hover:bg-blue-600 group-hover:text-white transition-all">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/learning/course/${course.id}`}>
      <div className="flex flex-col h-full rounded-2xl border overflow-hidden hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500/50 transition-all duration-300 group bg-card">
        <div className="h-44 relative bg-muted animate-pulse-slow">
          {course.thumbnailUrl ? (
            <Image src={course.thumbnailUrl} fill className="object-cover group-hover:scale-105 transition-transform duration-500" alt={course.title} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-primary/30" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {course.isMandatory && <Badge variant="destructive" className="shadow-lg uppercase text-[10px]">Obrigatório</Badge>}
            <Badge variant="outline" className="bg-white/80 dark:bg-black/80 backdrop-blur-md shadow-sm border-none text-[10px] uppercase">
              {course.categoryName || 'Geral'}
            </Badge>
          </div>
          <div className="absolute bottom-3 right-3">
            <div className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(course.durationMinutes)}
            </div>
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col space-y-3">
          <h3 className="font-bold text-base leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight flex-1">
            {course.title}
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {course.description}
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-muted">
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-full bg-blue-600/10 flex items-center justify-center">
                <User className="h-3 w-3 text-blue-600" />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">{course.instructorName || 'Instutor Axon'}</span>
            </div>
            <div className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase", getDifficultyColor(course.difficultyLevel))}>
              {course.difficultyLevel}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Quick Access Card
function QuickCard({ icon, title, description, href, color }: { icon: React.ReactNode; title: string; description: string; href: string; color: string }) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-lg hover:border-blue-500/30 transition-all duration-300 group cursor-pointer h-full">
        <CardHeader>
          <div className={cn("p-3 rounded-2xl w-fit mb-2 group-hover:scale-110 transition-transform duration-300", color)}>
            {icon}
          </div>
          <CardTitle className="text-lg uppercase tracking-tight">{title}</CardTitle>
          <CardDescription className="text-xs leading-relaxed">{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
