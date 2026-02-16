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
import { cn } from '@/lib/utils';

// Mock Data matching Consolidated DB Titles
const MOCK_COURSES: Course[] = [
    {
        id: '11111111-1111-1111-1111-111111111111',
        title: 'Liderança Alpha: Gestão de Times Remotos',
        description: 'Desenvolva as soft skills necessárias para liderar times de alto impacto no modelo remoto.',
        courseType: 'ONLINE' as CourseType,
        difficultyLevel: 'AVANCADO' as DifficultyLevel,
        status: 'PUBLISHED' as CourseStatus,
        isMandatory: true,
        durationMinutes: 300,
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
        id: '22222222-2222-2222-2222-222222222222',
        title: 'Bem-vindo à Axon: Guia Definitivo de Imersão',
        description: 'Tudo o que você precisa saber sobre nossa cultura, benefícios e pilares fundamentais.',
        courseType: 'ONLINE' as CourseType,
        difficultyLevel: 'INICIANTE' as DifficultyLevel,
        status: 'PUBLISHED' as CourseStatus,
        isMandatory: true,
        durationMinutes: 240,
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
        id: '33333333-3333-3333-3333-333333333333',
        title: 'IA Generativa para Negócios: Do Zero ao Pro',
        description: 'Como usar ChatGPT e Claude para dobrar sua velocidade de entrega no dia a dia.',
        courseType: 'ONLINE' as CourseType,
        difficultyLevel: 'INTERMEDIARIO' as DifficultyLevel,
        status: 'PUBLISHED' as CourseStatus,
        isMandatory: false,
        durationMinutes: 360,
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
                    coursesApi.listPublished().catch(() => []),
                    categoriesApi.list().catch(() => [])
                ]);

                const fetchedCourses = (coursesRes as any) || [];
                const fetchedCategories = (categoriesRes as any) || [];

                setCourses(fetchedCourses.length > 0 ? fetchedCourses : MOCK_COURSES);
                setCategories(fetchedCategories.length > 0 ? fetchedCategories : MOCK_CATEGORIES);
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
        const matchesCategory = !selectedCategory || (course.categoryId === selectedCategory || (course as any).categoryName === selectedCategory);
        const matchesLevel = !selectedLevel || course.difficultyLevel === selectedLevel;
        return matchesSearch && matchesCategory && matchesLevel;
    });

    return (
        <div className="w-full min-h-screen pb-20 space-y-12 px-4 md:px-8 animate-in fade-in duration-700">
            {/* Refined Header - Light Theme */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-100 px-8 py-20 md:px-20 md:py-24 group shadow-sm mt-6">
                <div className="absolute top-[10%] left-[-5%] w-[50%] h-[70%] bg-blue-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[70%] bg-indigo-500/5 rounded-full blur-[120px]" />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-10">
                        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-blue-600/5 border border-blue-600/10 text-blue-600 text-[11px] font-black uppercase tracking-[0.2em]">
                            <Sparkles className="h-4 w-4" />
                            <span>Explorar Catálogo de Trilhas</span>
                        </div>
                        <div className="space-y-8">
                            <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[1]">
                                Domine Novas <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-primary">
                                    Habilidades
                                </span>
                            </h1>
                            <p className="max-w-xl text-slate-500 text-lg md:text-xl font-medium leading-relaxed">
                                Mergulhe em nosso ecossistema de aprendizado. Conteúdos práticos,
                                curadoria premium e certificados reconhecidos para impulsionar sua evolução.
                            </p>
                        </div>
                    </div>

                    <div className="hidden lg:flex justify-end pr-12">
                        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-blue-200/20 space-y-6 max-w-sm rotate-3 hover:rotate-0 transition-all duration-1000 group/card relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover/card:bg-blue-100/50 transition-colors" />
                            <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-200 relative z-10">
                                <Award className="h-8 w-8 text-white" />
                            </div>
                            <div className="space-y-3 relative z-10">
                                <h3 className="text-2xl font-black text-slate-900">Certificações Axon</h3>
                                <p className="text-base text-slate-500 font-medium">Todos os nossos cursos oferecem certificado digital imediato e verificável.</p>
                            </div>
                            <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden relative z-10 border border-slate-100">
                                <div className="h-full w-2/3 bg-blue-600 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Filters Section */}
            <section className="space-y-10">
                {/* Search & Layout Toggle */}
                <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-0 bg-blue-600/5 blur-3xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                        <Input
                            placeholder="Pesquisar por título, descrição ou tecnologia..."
                            className="h-20 pl-16 pr-8 bg-white border-2 border-slate-100 rounded-[2rem] text-xl font-bold shadow-xl shadow-slate-100 focus:ring-blue-600 placeholder:text-slate-300 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white p-2 rounded-[1.5rem] flex items-center gap-2 border-2 border-slate-50 shadow-sm">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-14 w-14 rounded-xl transition-all", viewMode === 'grid' ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50")}
                                onClick={() => setViewMode('grid')}
                            >
                                <LayoutGrid className="h-6 w-6" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-14 w-14 rounded-xl transition-all", viewMode === 'list' ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50")}
                                onClick={() => setViewMode('list')}
                            >
                                <ListIcon className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Categories Scroll (Improved Area) */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Filtrar Categorias</h3>
                        <span className="text-xs font-bold text-slate-300 uppercase">{categories.length} Especialidades</span>
                    </div>

                    <div className="flex flex-wrap gap-4 pb-2">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={cn(
                                "flex items-center gap-4 px-8 py-5 rounded-[1.5rem] transition-all font-black text-sm border-2",
                                selectedCategory === null
                                    ? "bg-slate-950 border-slate-950 text-white shadow-2xl translate-y-[-4px]"
                                    : "bg-white border-slate-100 hover:border-blue-600/30 text-slate-500"
                            )}
                        >
                            <LayoutGrid className="h-5 w-5" />
                            <span>Todas</span>
                        </button>

                        {categories.map(category => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={cn(
                                    "flex items-center gap-4 px-8 py-5 rounded-[1.5rem] transition-all font-black text-sm border-2",
                                    selectedCategory === category.id
                                        ? "bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-100 translate-y-[-4px]"
                                        : "bg-white border-slate-100 hover:border-blue-600/30 text-slate-500"
                                )}
                            >
                                <Zap className="h-5 w-5" />
                                <span>{category.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Difficulty Filters */}
                <div className="flex items-center gap-4 px-2 overflow-x-auto no-scrollbar pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-4 shrink-0">Nível:</span>
                    {['INICIANTE', 'INTERMEDIARIO', 'AVANCADO'].map(level => (
                        <button
                            key={level}
                            onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
                            className={cn(
                                "px-6 py-3 rounded-full border-2 text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                                selectedLevel === level
                                    ? "bg-slate-100 border-slate-900 text-slate-900"
                                    : "bg-transparent border-slate-100 text-slate-400 hover:border-slate-200"
                            )}
                        >
                            {level === 'INICIANTE' ? 'Iniciante' : level === 'INTERMEDIARIO' ? 'Intermediário' : 'Avançado'}
                        </button>
                    ))}
                </div>

                <main className="pt-8">
                    {loading ? (
                        <div className="py-40 flex flex-col items-center gap-6">
                            <div className="h-14 w-14 border-4 border-slate-50 border-t-blue-600 rounded-full animate-spin" />
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Sincronizando Oxon Academy...</p>
                        </div>
                    ) : filteredCourses.length === 0 ? (
                        <div className="text-center py-40 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100 space-y-8">
                            <div className="h-20 w-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto">
                                <Search className="h-8 w-8 text-slate-200" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-2xl font-black text-slate-800 uppercase tracking-tight">Nenhuma trilha encontrada</p>
                                <p className="text-slate-400 font-medium">Tente ajustar seus filtros para descobrir novos conteúdos.</p>
                            </div>
                            <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory(null); setSelectedLevel(null); }} className="h-14 px-10 rounded-2xl font-black text-[11px] uppercase tracking-widest border-2">LIMPAR TODOS OS FILTROS</Button>
                        </div>
                    ) : (
                        <div className={cn(
                            "gap-10",
                            viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col"
                        )}>
                            {filteredCourses.map((course) => (
                                <CourseCard key={course.id} course={course} viewMode={viewMode} />
                            ))}
                        </div>
                    )}
                </main>
            </section>
        </div>

    );
}

function CourseCard({ course, viewMode }: { course: Course, viewMode: 'grid' | 'list' }) {
    const diffColor = (lvl?: string) => {
        switch (lvl) {
            case 'AVANCADO': return 'text-purple-600';
            case 'INTERMEDIARIO': return 'text-blue-600';
            default: return 'text-emerald-600';
        }
    };

    const diffLabel = (lvl?: string) => {
        switch (lvl) {
            case 'AVANCADO': return 'AVANÇADO';
            case 'INTERMEDIARIO': return 'INTERMEDIÁRIO';
            default: return 'INICIANTE';
        }
    }

    if (viewMode === 'list') {
        return (
            <Link href={`/learning/course/${course.id}`} className="group flex flex-col md:flex-row gap-6 p-6 bg-white rounded-3xl border border-slate-100 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-500">
                <div className="h-48 w-full md:w-72 rounded-2xl bg-[#1e40af] relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 opacity-20">
                        <Zap className="h-full w-full text-white/10" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="h-16 w-16 text-blue-300 drop-shadow-[0_0_15px_rgba(147,197,253,0.5)]" />
                    </div>
                </div>
                <div className="flex flex-col flex-1 py-2">
                    <div className="flex items-center gap-3 mb-4 shrink-0">
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest border border-slate-200/50">
                            {course.categoryName || 'GERAL'}
                        </span>
                        {course.isMandatory && (
                            <span className="px-3 py-1 rounded-full bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest shadow-sm">
                                OBRIGATÓRIO
                            </span>
                        )}
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase leading-tight mb-3">
                        {course.title}
                    </h3>

                    <p className="text-slate-500 font-medium leading-relaxed line-clamp-2 max-w-2xl mb-8">
                        {course.description}
                    </p>

                    <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-6">
                        <div className="flex gap-8">
                            <div>
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Duração</p>
                                <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    {course.durationMinutes || 0} min
                                </div>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Nível Profissional</p>
                                <div className={cn(
                                    "px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest inline-block border",
                                    course.difficultyLevel === 'AVANCADO' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                        course.difficultyLevel === 'INTERMEDIARIO' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                            'bg-emerald-100 text-emerald-700 border-emerald-200'
                                )}>
                                    {diffLabel(course.difficultyLevel)}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-blue-500/20">
                            <span>Acessar</span>
                            <ChevronRight className="h-4 w-4" />
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

    // Grid View - Simplified and Refined
    return (
        <Link href={`/learning/course/${course.id}`}>
            <div className="group flex flex-col h-full bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden hover:shadow-[0_48px_80px_-16px_rgba(0,0,0,0.12)] transition-all duration-500 cursor-pointer shadow-sm hover:-translate-y-2">

                {/* Header / Thumbnail Area */}
                <div className="relative bg-[#1e40af] flex items-center justify-center overflow-hidden shrink-0 w-full h-56">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <Zap className="h-32 w-32 text-white fill-white/10" />
                    </div>

                    {/* Central Icon */}
                    <div className="relative z-10">
                        <Zap className="h-12 w-12 text-blue-300 drop-shadow-[0_0_15px_rgba(147,197,253,0.5)]" />
                    </div>

                    {/* Mandatory Badge */}
                    {course.isMandatory && (
                        <div className="absolute top-5 left-5">
                            <span className="px-3 py-1 rounded-md bg-red-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg">
                                OBRIGATORIO
                            </span>
                        </div>
                    )}

                    {/* Duration Badge */}
                    <div className="absolute bottom-5 right-5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 border border-white/10 shadow-lg">
                        <Clock className="h-3.5 w-3.5 text-white" />
                        <span className="text-[10px] font-bold text-white tracking-tight">{course.durationMinutes || 0} min</span>
                    </div>
                </div>

                {/* Content Body */}
                <div className="p-8 space-y-6 flex flex-col flex-1">
                    <div className="space-y-4 flex-1">
                        {/* Meta Row */}
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
                            <span className={cn(diffColor(course.difficultyLevel))}>
                                {diffLabel(course.difficultyLevel)}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-400">
                                {course.categoryName || 'GERAL'}
                            </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-[1.2] line-clamp-2">
                            {course.title}
                        </h3>

                        {/* Description */}
                        <p className="text-[13px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                            {course.description}
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="pt-6 mt-auto flex items-center justify-between border-t border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                <span className="text-[8px] font-black text-slate-400">AA</span>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Axon Academy
                            </span>
                        </div>

                        <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600/5 group-hover:text-blue-600 transition-all duration-300">
                            <ChevronRight className="h-5 w-5" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
