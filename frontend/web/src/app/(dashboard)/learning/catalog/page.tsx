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
        <div className="max-w-[1400px] mx-auto min-h-screen pb-20 space-y-10 px-4 animate-in fade-in duration-700">
            {/* Refined Header - Light Theme */}
            <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 px-8 py-16 md:px-16 md:py-20 group shadow-sm mt-6">
                <div className="absolute top-[10%] left-[-5%] w-[40%] h-[60%] bg-blue-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[60%] bg-purple-500/5 rounded-full blur-[100px]" />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-600/5 border border-blue-600/10 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                            <Sparkles className="h-3 w-3" />
                            <span>Explorar Catálogo Completo</span>
                        </div>
                        <div className="space-y-6">
                            <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                                Domine Novas <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                    Habilidades
                                </span>
                            </h1>
                            <p className="max-w-xl text-slate-500 text-base md:text-lg font-medium leading-relaxed">
                                Explore nosso ecossistema de aprendizado e impulsione sua trajetória
                                profissional com conteúdos práticos e certificados reconhecidos.
                            </p>
                        </div>
                    </div>

                    <div className="hidden lg:flex justify-end pr-8">
                        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/20 space-y-4 max-w-sm rotate-2 hover:rotate-0 transition-transform duration-700">
                            <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                                <Award className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900">Certificações Axon</h3>
                            <p className="text-sm text-slate-500 font-medium">Todos os nossos cursos oferecem certificado de conclusão digital imediato.</p>
                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full w-2/3 bg-blue-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <aside className="lg:col-span-3 space-y-10">
                    <div className="space-y-6">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Filtrar por Categoria</h3>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={cn(
                                    "flex items-center justify-between px-5 py-4 rounded-xl transition-all font-bold text-sm",
                                    selectedCategory === null
                                        ? "bg-slate-900 text-white shadow-xl"
                                        : "bg-white border border-slate-100 hover:bg-slate-50 text-slate-600"
                                )}
                            >
                                <span className="flex items-center gap-3"><LayoutGrid className="h-4 w-4" /> Todos</span>
                                <span className="text-[10px] uppercase opacity-50">{courses.length}</span>
                            </button>

                            {categories.map(category => (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={cn(
                                        "flex items-center justify-between px-5 py-4 rounded-xl transition-all font-bold text-sm",
                                        selectedCategory === category.id
                                            ? "bg-blue-600 text-white shadow-xl shadow-blue-100"
                                            : "bg-white border border-slate-100 hover:bg-slate-50 text-slate-600"
                                    )}
                                >
                                    <span className="flex items-center gap-3 truncate"><Zap className="h-4 w-4" /> {category.name}</span>
                                    <span className="text-[10px] uppercase opacity-50">{courses.filter(c => c.categoryId === category.id || (c as any).categoryName === category.name).length}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Nível de Dificuldade</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {['INICIANTE', 'INTERMEDIARIO', 'AVANCADO'].map(level => (
                                <button
                                    key={level}
                                    onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
                                    className={cn(
                                        "px-5 py-4 rounded-xl border text-sm font-bold transition-all text-left flex items-center justify-between",
                                        selectedLevel === level
                                            ? "bg-slate-950 text-white border-slate-950 shadow-lg"
                                            : "bg-white border-slate-100 hover:bg-slate-50 text-slate-600"
                                    )}
                                >
                                    <span>{level === 'INICIANTE' ? 'Iniciante' : level === 'INTERMEDIARIO' ? 'Intermediário' : 'Avançado'}</span>
                                    <ChevronRight className={cn("h-4 w-4 opacity-30", selectedLevel === level && "opacity-100")} />
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                <main className="lg:col-span-9 space-y-10">
                    {/* Search Bar */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <Input
                                placeholder="Buscar treinamentos..."
                                className="h-16 pl-12 bg-white border-slate-100 rounded-xl text-lg font-bold shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="bg-slate-50 p-1.5 rounded-xl flex items-center gap-1 border border-slate-100">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("h-11 w-11 rounded-lg", viewMode === 'grid' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400")}
                                    onClick={() => setViewMode('grid')}
                                >
                                    <LayoutGrid className="h-5 w-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("h-11 w-11 rounded-lg", viewMode === 'list' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400")}
                                    onClick={() => setViewMode('list')}
                                >
                                    <ListIcon className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-32 flex flex-col items-center gap-4">
                            <div className="h-10 w-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando Catálogo...</p>
                        </div>
                    ) : filteredCourses.length === 0 ? (
                        <div className="text-center py-32 bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-6">
                            <p className="font-bold text-slate-400 uppercase tracking-widest text-sm">Nenhum curso encontrado.</p>
                            <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory(null); setSelectedLevel(null); }} className="rounded-xl font-black text-[10px] uppercase">Limpar Filtros</Button>
                        </div>
                    ) : (
                        <div className={cn(
                            "gap-8",
                            viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "flex flex-col"
                        )}>
                            {filteredCourses.map((course) => (
                                <CourseCard key={course.id} course={course} viewMode={viewMode} />
                            ))}
                        </div>
                    )}
                </main>
            </div>
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
