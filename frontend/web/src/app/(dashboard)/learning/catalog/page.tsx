'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    Filter,
    BookOpen,
    Clock,
    Star,
    Video,
    ChevronRight,
    LayoutGrid,
    List as ListIcon,
    Award,
    Sparkles,
    BookMarked,
    TrendingUp,
    Zap
} from 'lucide-react';
import Image from "next/image";
import Link from 'next/link';
import { coursesApi, categoriesApi, Course, TrainingCategory, CourseType, DifficultyLevel, CourseStatus } from '@/lib/api/learning';

// Mock Data for fallback
const MOCK_COURSES: Course[] = [
    {
        id: 'c1',
        title: 'Liderança Alpha: O Guia de Gestão',
        description: 'Desenvolva as soft skills necessárias para liderar times de alto impacto no modelo remoto.',
        courseType: 'ONLINE' as CourseType,
        difficultyLevel: 'AVANCADO' as DifficultyLevel,
        status: 'PUBLISHED' as CourseStatus,
        isMandatory: true,
        durationMinutes: 320,
        thumbnailUrl: 'https://images.unsplash.com/photo-15222071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop',
        categoryName: 'Liderança',
        price: 0,
        requiresApproval: false,
        passingScore: 70,
        allowRetake: true,
        maxRetakes: 3,
        modules: [],
        createdAt: new Date().toISOString()
    },
    {
        id: 'c2',
        title: 'Bem-vindo à Axon: Onboarding',
        description: 'Tudo o que você precisa saber sobre nossa cultura, benefícios e pilares fundamentais.',
        courseType: 'ONLINE' as CourseType,
        difficultyLevel: 'INICIANTE' as DifficultyLevel,
        status: 'PUBLISHED' as CourseStatus,
        isMandatory: true,
        durationMinutes: 120,
        thumbnailUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop',
        categoryName: 'Cultura',
        price: 0,
        requiresApproval: false,
        passingScore: 70,
        allowRetake: true,
        maxRetakes: 3,
        modules: [],
        createdAt: new Date().toISOString()
    },
    {
        id: 'c3',
        title: 'IA Generativa e Productividade',
        description: 'Como usar ChatGPT e Claude para dobrar sua velocidade de entrega no dia a dia.',
        courseType: 'ONLINE' as CourseType,
        difficultyLevel: 'INTERMEDIARIO' as DifficultyLevel,
        status: 'PUBLISHED' as CourseStatus,
        isMandatory: false,
        durationMinutes: 240,
        thumbnailUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop',
        categoryName: 'Tecnologia',
        price: 0,
        requiresApproval: false,
        passingScore: 70,
        allowRetake: true,
        maxRetakes: 3,
        modules: [],
        createdAt: new Date().toISOString()
    }
];

const MOCK_CATEGORIES: TrainingCategory[] = [
    { id: 'cat1', name: 'Liderança', icon: 'User', color: '#3b82f6', isActive: true },
    { id: 'cat2', name: 'Tecnologia', icon: 'Zap', color: '#10b981', isActive: true },
    { id: 'cat3', name: 'Cultura', icon: 'GraduationCap', color: '#8b5cf6', isActive: true },
];

export default function CourseCatalog() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<TrainingCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [coursesRes, categoriesRes] = await Promise.all([
                    coursesApi.listPublished(),
                    categoriesApi.list()
                ]);
                // Fallback robusto para garantir que a tela NUNCA fique vazia
                const fetchedCourses = coursesRes.data || [];
                const fetchedCategories = categoriesRes.data || [];

                if (fetchedCourses.length === 0) {
                    setCourses(MOCK_COURSES);
                } else {
                    setCourses(fetchedCourses);
                }

                if (fetchedCategories.length === 0) {
                    setCategories(MOCK_CATEGORIES);
                } else {
                    setCategories(fetchedCategories);
                }
            } catch (error) {
                console.error('Erro ao carregar catalogo:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || course.categoryId === selectedCategory;
        // Assume course has a level field or we can add it to the filter logic if available
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen pb-20 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Modern Hero Section with Mash Gradient */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 px-8 py-16 md:px-16 md:py-24 group">
                {/* Animated Background Blobs */}
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[60%] bg-primary/30 rounded-full blur-[120px] animate-pulse duration-[10s]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[60%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse duration-[15s] delay-700" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[40%] bg-indigo-500/20 rounded-full blur-[100px] animate-bounce duration-[20s] opacity-50" />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-primary-foreground/90 text-sm font-medium">
                            <Sparkles className="h-4 w-4 text-primary-light" />
                            <span>Transforme sua carreira hoje</span>
                        </div>
                        <div className="space-y-6">
                            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.1]">
                                Explore seu <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light via-blue-400 to-indigo-300">
                                    Potencial Infinito
                                </span>
                            </h1>
                            <p className="max-w-xl text-blue-50/90 text-lg md:text-xl font-medium leading-relaxed">
                                Mergulhe em trilhas de conhecimento exclusivas, desenhadas por especialistas
                                para acelerar seu crescimento profissional com a Axon Academy.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <Button size="lg" className="rounded-full h-14 px-8 text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95">
                                Iniciar Jornada
                            </Button>
                            <div className="flex -space-x-3 items-center ml-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-10 w-10 rounded-full border-2 border-slate-950 overflow-hidden bg-slate-800">
                                        <Image src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="User" width={40} height={40} />
                                    </div>
                                ))}
                                <span className="ml-6 text-sm text-blue-100/60 font-medium">+2k alunos ativos</span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:block relative h-[450px]">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent rounded-[3rem] backdrop-blur-[2px] border border-white/10 shadow-2xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-700">
                            {/* Premium Hero Image */}
                            <Image
                                src="/images/learning-hero.png"
                                alt="Learning Illustration"
                                fill
                                className="object-cover opacity-80 mix-blend-lighten"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />

                            {/* Floating Stats with better contrast */}
                            <div className="absolute top-10 right-10 p-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl animate-bounce duration-[4s]">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-green-500/30 rounded-xl">
                                        <TrendingUp className="h-6 w-6 text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] uppercase tracking-widest text-white/70 font-black">Progresso Médio</p>
                                        <p className="text-white font-black text-xl">84%</p>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-10 left-10 p-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl animate-bounce duration-[5s] delay-1000">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-primary/30 rounded-xl">
                                        <Award className="h-6 w-6 text-primary-light" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] uppercase tracking-widest text-white/70 font-black">Certificados</p>
                                        <p className="text-white font-black text-xl">15.4k+</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* sidebar and search combined logic */}
                <aside className="lg:col-span-3 space-y-10">
                    {/* Category Selection Sidebar */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Filter className="h-5 w-5 text-primary" />
                                Categorias
                            </h3>
                            {selectedCategory && (
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className="text-xs text-muted-foreground hover:text-primary underline underline-offset-4 transition-colors"
                                >
                                    Limpar
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 p-1">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={cn(
                                    "flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                                    selectedCategory === null
                                        ? "bg-blue-600 text-white shadow-xl shadow-blue-200"
                                        : "bg-white border border-slate-200 hover:border-blue-500/30 hover:bg-slate-50"
                                )}
                            >
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className={cn(
                                        "p-2.5 rounded-xl transition-colors",
                                        selectedCategory === null ? "bg-primary/20 text-primary-light" : "bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary"
                                    )}>
                                        <BookMarked className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold text-sm tracking-tight">Todas as Categorias</span>
                                </div>
                                <span className={cn(
                                    "text-xs font-black px-2 py-1 rounded-lg relative z-10",
                                    selectedCategory === null ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary/70"
                                )}>{courses.length}</span>
                            </button>

                            {categories.map(category => {
                                const count = courses.filter(c => c.categoryId === category.id).length;
                                const isSelected = selectedCategory === category.id;
                                return (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={cn(
                                            "flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                                            isSelected
                                                ? "bg-blue-600 text-white shadow-xl shadow-blue-200"
                                                : "bg-white border border-slate-200 hover:border-blue-500/30 hover:bg-slate-50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 relative z-10">
                                            <div className={cn(
                                                "p-2.5 rounded-xl transition-colors",
                                                isSelected ? "bg-primary/20 text-primary-light" : "bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary"
                                            )}>
                                                <Zap className="h-4 w-4" />
                                            </div>
                                            <span className="font-bold text-sm tracking-tight truncate max-w-[140px] text-left">{category.name}</span>
                                        </div>
                                        <span className={cn(
                                            "text-xs font-black px-2 py-1 rounded-lg relative z-10",
                                            isSelected ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary/70"
                                        )}>{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Level Filter */}
                    <div className="space-y-6 pt-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Nível
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {['INICIANTE', 'INTERMEDIARIO', 'AVANCADO'].map(level => (
                                <button
                                    key={level}
                                    onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
                                    className={cn(
                                        "px-5 py-4 rounded-2xl border text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 text-left flex items-center justify-between group",
                                        selectedLevel === level
                                            ? "bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-200"
                                            : "bg-white border-slate-200 hover:border-blue-500/50 text-slate-600"
                                    )}
                                >
                                    <span>{level === 'INICIANTE' ? 'Iniciante' : level === 'INTERMEDIARIO' ? 'Intermediário' : 'Avançado'}</span>
                                    <ChevronRight className={cn(
                                        "h-4 w-4 transition-transform",
                                        selectedLevel === level ? "text-primary translate-x-1" : "text-slate-300 group-hover:translate-x-1"
                                    )} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Promotion Card */}
                    <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-8 rounded-[2.5rem] text-white space-y-6 shadow-2xl shadow-indigo-200 hidden lg:block overflow-hidden relative group border border-white/10">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl group-hover:animate-pulse" />

                        <CardHeader className="p-0 space-y-4 relative z-10">
                            <div className="bg-white/20 w-fit p-3 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
                                <Award className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black tracking-tight">Trilha de Liderança</CardTitle>
                                <CardDescription className="text-indigo-100 font-medium text-base mt-2 leading-relaxed">
                                    Conquiste as habilidades necessárias para liderar times de alto desempenho.
                                </CardDescription>
                            </div>
                        </CardHeader>

                        <Button className="w-full h-14 rounded-2xl bg-white text-indigo-700 font-black text-lg hover:bg-slate-50 hover:scale-105 transition-all shadow-xl shadow-indigo-900/20 active:scale-95">
                            Explorar AGORA
                        </Button>
                    </div>
                </aside>

                <main className="lg:col-span-9 space-y-10">
                    {/* Dynamic Search & View Controls */}
                    <div className="flex flex-col md:flex-row gap-6 items-center p-6 bg-card border border-border/50 rounded-3xl shadow-sm">
                        <div className="relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="O que você quer aprender hoje?"
                                className="pl-12 h-14 bg-muted/30 border-none rounded-2xl text-lg focus-visible:ring-2 focus-visible:ring-primary/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-6 shrink-0 w-full md:w-auto justify-between md:justify-end">
                            <div className="bg-muted/50 p-1.5 rounded-2xl flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-10 w-10 rounded-xl transition-all",
                                        viewMode === 'grid' ? "bg-white text-primary shadow-md scale-110" : "text-muted-foreground hover:bg-white/50"
                                    )}
                                    onClick={() => setViewMode('grid')}
                                >
                                    <LayoutGrid className="h-5 w-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-10 w-10 rounded-xl transition-all",
                                        viewMode === 'list' ? "bg-white text-primary shadow-md scale-110" : "text-muted-foreground hover:bg-white/50"
                                    )}
                                    onClick={() => setViewMode('list')}
                                >
                                    <ListIcon className="h-5 w-5" />
                                </Button>
                            </div>
                            <div className="hidden sm:block h-8 w-[1px] bg-border mx-2" />
                            <span className="whitespace-nowrap font-bold text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-full">
                                {filteredCourses.length} cursos encontrados
                            </span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-6">
                            <div className="relative h-20 w-20">
                                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                                <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
                                <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" />
                            </div>
                            <p className="text-xl font-medium text-muted-foreground animate-pulse">Preparando seu catálogo personalizado...</p>
                        </div>
                    ) : filteredCourses.length === 0 ? (
                        <div className="text-center py-32 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-32 -mt-32" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 -mb-32" />

                            <div className="relative mb-8 inline-flex">
                                <div className="h-32 w-32 rounded-[2.5rem] bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-700 shadow-inner">
                                    <BookOpen className="h-16 w-16 text-slate-200" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 h-14 w-14 bg-white rounded-2xl shadow-xl border border-slate-50 flex items-center justify-center">
                                    <Search className="h-6 w-6 text-primary animate-pulse" />
                                </div>
                            </div>

                            <h3 className="text-4xl font-black mb-4 text-slate-900 tracking-tight">Nada por aqui ainda...</h3>
                            <p className="text-slate-500 max-w-sm mx-auto text-lg mb-12 font-medium leading-relaxed">
                                Não encontramos cursos que correspondam aos seus filtros atuais.
                                Que tal tentar novos termos?
                            </p>

                            <Button
                                variant="outline"
                                size="lg"
                                className="h-16 px-12 rounded-2xl border-2 border-slate-200 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all active:scale-95 font-black text-lg shadow-xl shadow-slate-100"
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory(null);
                                    setSelectedLevel(null);
                                }}
                            >
                                Recomeçar Busca
                            </Button>
                        </div>
                    ) : (
                        <div className={cn(
                            "gap-8",
                            viewMode === 'grid'
                                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                                : "flex flex-col"
                        )}>
                            {filteredCourses.map((course, idx) => (
                                <CourseCard key={course.id} course={course} viewMode={viewMode} index={idx} />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

function CourseCard({ course, viewMode, index }: { course: Course, viewMode: 'grid' | 'list', index: number }) {
    const formatDuration = (minutes?: number) => {
        if (!minutes) return '-';
        if (minutes < 60) return `${minutes}min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    };

    if (viewMode === 'list') {
        return (
            <Link href={`/learning/course/${course.id}`}>
                <div className="group flex flex-col md:flex-row gap-8 bg-card border border-border/50 rounded-3xl overflow-hidden hover:shadow-2xl hover:border-primary/20 transition-all duration-500 p-5 relative">
                    <div className="relative w-full md:w-80 h-48 rounded-2xl overflow-hidden shrink-0 shadow-lg group-hover:shadow-primary/10 transition-all">
                        {course.thumbnailUrl ? (
                            <Image src={course.thumbnailUrl} alt={course.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                            <div className="w-full h-full bg-slate-900 flex items-center justify-center p-12">
                                <BookOpen className="h-full w-full text-white/10 group-hover:text-primary/20 transition-colors" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-4 left-4 flex gap-2">
                            {course.isMandatory && (
                                <Badge className="bg-destructive text-white border-none shadow-lg px-3 py-1 rounded-lg">Obrigatório</Badge>
                            )}
                        </div>
                        <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all">
                            <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100 rounded-lg font-bold">Acessar Agora</Button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col py-2">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold text-[10px] tracking-widest uppercase px-3 py-1">
                                    {course.categoryName || 'Performance'}
                                </Badge>
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                                    <Star className="h-3.5 w-3.5 fill-current" />
                                    <span className="text-xs font-bold leading-none mt-0.5">4.9</span>
                                </div>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-tight tracking-tight">{course.title}</h3>
                        <p className="text-muted-foreground text-base line-clamp-3 mb-6 leading-relaxed flex-1">
                            {course.description || "Inicie este treinamento agora para adquirir novas habilidades estratégicas e elevar seu patamar profissional dentro da corporação."}
                        </p>

                        <div className="mt-auto flex flex-wrap items-center gap-x-8 gap-y-3 pt-6 border-t border-border/50">
                            <div className="flex items-center gap-2.5 text-sm text-foreground/70 font-bold">
                                <div className="p-2 rounded-lg bg-muted">
                                    <Clock className="h-4 w-4 text-primary" />
                                </div>
                                {formatDuration(course.durationMinutes)}
                            </div>
                            <div className="flex items-center gap-2.5 text-sm text-foreground/70 font-bold">
                                <div className="p-2 rounded-lg bg-muted">
                                    <Video className="h-4 w-4 text-primary" />
                                </div>
                                {course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0} aulas
                            </div>
                            <div className="flex items-center gap-2.5 text-sm text-foreground/70 font-bold">
                                <div className="p-2 rounded-lg bg-muted">
                                    <Award className="h-4 w-4 text-primary" />
                                </div>
                                Certificado Digital
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center justify-center pl-6">
                        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                            <ChevronRight className="h-7 w-7" />
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link href={`/learning/course/${course.id}`} className="block h-full animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
            <Card className="group h-full flex flex-col overflow-hidden border-border/40 hover:border-primary/30 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 rounded-[2rem] hover:-translate-y-2">
                <div className="relative h-56 w-full overflow-hidden">
                    {course.thumbnailUrl ? (
                        <Image src={course.thumbnailUrl} alt={course.title} fill className="object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out" />
                    ) : (
                        <div className="w-full h-full bg-slate-950 flex items-center justify-center p-16">
                            <BookOpen className="h-full w-full text-white/5 group-hover:text-primary/10 transition-colors" />
                        </div>
                    )}

                    {/* Overlay effects */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-80" />

                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                        <Badge variant="secondary" className="bg-white/10 backdrop-blur-md text-white border-white/20 px-3 py-1 font-bold text-[10px] tracking-widest uppercase">
                            {course.categoryName || 'Treinamento'}
                        </Badge>
                        {course.isMandatory && (
                            <div className="bg-destructive text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1">
                                <Zap className="h-3 w-3 fill-current" />
                                OBRIGATÓRIO
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-5 left-5 right-5 flex justify-between items-center pointer-events-none translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/10 backdrop-blur-md text-white text-[10px] font-black border border-white/10">
                            <Star className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
                            4.9
                        </div>
                        <div className="text-[10px] font-black text-white/80 bg-black/20 backdrop-blur-sm px-2 py-1 rounded flex items-center gap-1">
                            <Clock className="h-3 w-3 text-primary-light" />
                            {formatDuration(course.durationMinutes)}
                        </div>
                    </div>
                </div>

                <CardHeader className="p-6 flex-1 pb-4 space-y-3">
                    <CardTitle className="text-xl md:text-2xl font-black line-clamp-2 leading-[1.2] group-hover:text-primary transition-colors tracking-tight">
                        {course.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 leading-relaxed text-sm font-medium text-muted-foreground/80">
                        {course.description || "Explore os fundamentos e técnicas avançadas deste módulo essencial para o seu sucesso na plataforma."}
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-6 pt-0 mt-auto">
                    <div className="flex items-center justify-between pt-6 border-t border-border/50">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center p-0.5 border border-primary/5">
                                <div className="bg-primary/20 h-full w-full rounded-lg flex items-center justify-center text-primary font-black text-xs">
                                    AA
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">Instrutor</span>
                                <span className="text-xs font-bold text-muted-foreground">Axon Academy</span>
                            </div>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                            <ChevronRight className="h-5 w-5" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
