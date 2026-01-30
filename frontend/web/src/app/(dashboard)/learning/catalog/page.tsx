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
    Award
} from 'lucide-react';
import Image from "next/image";
import Link from 'next/link';
import { coursesApi, categoriesApi, Course, TrainingCategory } from '@/lib/api/learning';

export default function CourseCatalog() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<TrainingCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
                setCourses(coursesRes.data || []);
                setCategories(categoriesRes.data || []);
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
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Hero Section */}
            <div className="relative h-64 rounded-2xl overflow-hidden bg-gradient-to-r from-primary to-primary/60 flex items-center px-12">
                <div className="relative z-10 max-w-2xl space-y-4">
                    <h1 className="text-4xl font-bold text-white">Catálogo de Cursos</h1>
                    <p className="text-primary-foreground/90 text-lg">
                        Explore nossa biblioteca completa de treinamentos e acelere seu desenvolvimento profissional com conteúdos exclusivos.
                    </p>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 opacity-20 pointer-events-none grayscale brightness-200">
                    <BookOpen className="w-full h-full p-8" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Filters Sidebar */}
                <aside className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Filtros
                        </h3>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Categorias</label>
                            <div className="flex flex-col gap-1">
                                <Button
                                    variant={selectedCategory === null ? "secondary" : "ghost"}
                                    className="justify-start font-normal"
                                    onClick={() => setSelectedCategory(null)}
                                >
                                    Todas as Categorias
                                </Button>
                                {categories.map(category => (
                                    <Button
                                        key={category.id}
                                        variant={selectedCategory === category.id ? "secondary" : "ghost"}
                                        className="justify-start font-normal"
                                        onClick={() => setSelectedCategory(category.id)}
                                    >
                                        {category.name}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t space-y-2">
                            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Nível</label>
                            <div className="flex flex-col gap-1">
                                {['INICIANTE', 'INTERMEDIARIO', 'AVANCADO'].map(level => (
                                    <Button key={level} variant="ghost" className="justify-start font-normal">
                                        {level === 'INICIANTE' ? 'Iniciante' : level === 'INTERMEDIARIO' ? 'Intermediário' : 'Avançado'}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="O que você quer aprender hoje?"
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-auto">
                            <span className="text-sm text-muted-foreground mr-2 font-medium">
                                {filteredCourses.length} cursos encontrados
                            </span>
                            <div className="flex bg-muted p-1 rounded-lg">
                                <Button
                                    variant={viewMode === 'grid' ? "white" : "ghost"}
                                    size="icon"
                                    className={`h-8 w-8 ${viewMode === 'grid' ? 'shadow-sm bg-background' : ''}`}
                                    onClick={() => setViewMode('grid')}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? "white" : "ghost"}
                                    size="icon"
                                    className={`h-8 w-8 ${viewMode === 'list' ? 'shadow-sm bg-background' : ''}`}
                                    onClick={() => setViewMode('list')}
                                >
                                    <ListIcon className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                            <p className="text-muted-foreground animate-pulse">Carregando cursos incríveis...</p>
                        </div>
                    ) : filteredCourses.length === 0 ? (
                        <div className="text-center py-20 bg-card rounded-2xl border border-dashed">
                            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                            <h3 className="text-xl font-semibold">Nenhum curso encontrado</h3>
                            <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                                Não encontramos cursos com os filtros aplicados. Tente mudar sua busca.
                            </p>
                            <Button variant="outline" className="mt-6" onClick={() => {
                                setSearchQuery('');
                                setSelectedCategory(null);
                            }}>
                                Limpar filtros
                            </Button>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ?
                            "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" :
                            "flex flex-col gap-4"
                        }>
                            {filteredCourses.map((course) => (
                                <CourseCard key={course.id} course={course} viewMode={viewMode} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function CourseCard({ course, viewMode }: { course: Course, viewMode: 'grid' | 'list' }) {
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
                <div className="group flex flex-col md:flex-row gap-6 bg-card border rounded-xl overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300 p-4">
                    <div className="relative w-full md:w-64 h-40 rounded-lg overflow-hidden shrink-0">
                        {course.thumbnailUrl ? (
                            <Image src={course.thumbnailUrl} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                <BookOpen className="h-10 w-10 text-primary/40" />
                            </div>
                        )}
                        {course.isMandatory && (
                            <Badge className="absolute top-2 left-2 shadow-lg" variant="destructive">Obrigatório</Badge>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col py-2">
                        <div className="flex justify-between items-start mb-2">
                            <Badge variant="secondary" className="font-medium text-[10px] tracking-wider uppercase mb-2">
                                {course.categoryName || 'Geral'}
                            </Badge>
                            <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">
                                <Star className="h-3 w-3 fill-current" />
                                <span className="text-xs font-bold">4.8</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{course.title}</h3>
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                            {course.description}
                        </p>

                        <div className="mt-auto flex items-center gap-6">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                <Clock className="h-4 w-4" />
                                {formatDuration(course.durationMinutes)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                <Video className="h-4 w-4" />
                                {course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0} aulas
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                <Award className="h-4 w-4" />
                                Certificado
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center px-4">
                        <Button size="icon" variant="ghost" className="rounded-full group-hover:bg-primary group-hover:text-white transition-all">
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link href={`/learning/course/${course.id}`}>
            <Card className="group h-full flex flex-col overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-primary/5">
                <div className="relative h-48 w-full overflow-hidden">
                    {course.thumbnailUrl ? (
                        <Image src={course.thumbnailUrl} alt={course.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent flex items-center justify-center">
                            <BookOpen className="h-16 w-16 text-primary/30" />
                        </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                        <Badge className="w-fit mb-1 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-transparent text-[10px]">
                            {course.categoryName || 'Inovação'}
                        </Badge>
                    </div>
                    {course.isMandatory && (
                        <Badge className="absolute top-4 right-4 bg-destructive shadow-lg" variant="destructive">Obrigatório</Badge>
                    )}
                </div>

                <CardHeader className="p-5 flex-1 pb-0">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            4.8
                        </div>
                        <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(course.durationMinutes)}
                        </div>
                    </div>
                    <CardTitle className="text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors min-h-[3rem]">
                        {course.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-2 leading-relaxed">
                        {course.description}
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-5 pt-4 mt-auto">
                    <div className="flex items-center justify-between pt-4 border-t border-primary/5">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-bold text-[10px]">JV</span>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Axon Academy</span>
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 px-2 group-hover:bg-primary group-hover:text-white transition-all rounded-lg">
                            Começar <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
