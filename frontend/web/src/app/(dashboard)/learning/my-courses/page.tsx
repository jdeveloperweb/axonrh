'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    BookOpen,
    Clock,
    Play,
    CheckCircle2,
    ArrowRight,
    Search,
    Filter,
    Trophy,
    History,
    TrendingUp
} from 'lucide-react';
import Image from "next/image";
import Link from 'next/link';
import { enrollmentsApi, Enrollment } from '@/lib/api/learning';
import { useAuthStore } from '@/stores/auth-store';

export default function MyCourses() {
    const { user } = useAuthStore();
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        const loadData = async () => {
            if (!user?.id) return;
            try {
                setLoading(true);
                const res = await enrollmentsApi.getByEmployee(user.id);
                setEnrollments(res.data || []);
            } catch (error) {
                console.error('Erro ao buscar matriculas:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user?.id]);

    const filteredEnrollments = enrollments.filter(e => {
        if (activeTab === 'in-progress') return e.status === 'IN_PROGRESS' || e.status === 'ENROLLED';
        if (activeTab === 'completed') return e.status === 'COMPLETED';
        return true;
    });

    const stats = {
        total: enrollments.length,
        completed: enrollments.filter(e => e.status === 'COMPLETED').length,
        inProgress: enrollments.filter(e => e.status === 'IN_PROGRESS' || e.status === 'ENROLLED').length,
        avgProgress: enrollments.length > 0
            ? enrollments.reduce((acc, e) => acc + e.progressPercentage, 0) / enrollments.length
            : 0
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight">Meus Cursos</h1>
                    <p className="text-muted-foreground mt-1">Gerencie seu progresso e continue sua jornada de aprendizado.</p>
                </div>
                <Link href="/learning/catalog">
                    <Button className="rounded-xl font-bold gap-2">
                        <BookOpen className="h-4 w-4" /> Desbravar Novos Cursos
                    </Button>
                </Link>
            </div>

            {/* Mini Stats Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-primary/5 border-primary/10">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Inscritos</p>
                            <p className="text-2xl font-black leading-none">{stats.total}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-500/5 border-green-500/10 text-green-700">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Concluídos</p>
                            <p className="text-2xl font-black leading-none">{stats.completed}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-500/5 border-amber-500/10 text-amber-700">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Progresso Médio</p>
                            <p className="text-2xl font-black leading-none">{stats.avgProgress.toFixed(0)}%</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-dashed">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <History className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Horas de Estudo</p>
                            <p className="text-2xl font-black leading-none">12.4h</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-muted p-1 rounded-xl h-12 w-fit">
                    <TabsTrigger value="all" className="rounded-lg px-6 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">Todos</TabsTrigger>
                    <TabsTrigger value="in-progress" className="rounded-lg px-6 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">Em Andamento</TabsTrigger>
                    <TabsTrigger value="completed" className="rounded-lg px-6 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">Concluídos</TabsTrigger>
                </TabsList>

                <div className="mt-8">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <Card key={i} className="animate-pulse">
                                    <div className="h-40 bg-muted rounded-t-xl" />
                                    <div className="p-4 space-y-3">
                                        <div className="h-4 bg-muted w-3/4 rounded" />
                                        <div className="h-4 bg-muted w-1/2 rounded" />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : filteredEnrollments.length === 0 ? (
                        <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-primary/20">
                            <Trophy className="h-12 w-12 mx-auto text-primary/20 mb-4" />
                            <h3 className="text-lg font-bold">Nenhum curso por aqui</h3>
                            <p className="text-muted-foreground max-w-xs mx-auto text-sm mt-1">Que tal começar um novo aprendizado hoje?</p>
                            <Link href="/learning/catalog" className="mt-4 block">
                                <Button variant="outline" size="sm" className="rounded-lg font-bold">Ir para o Catálogo</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredEnrollments.map((enrollment) => (
                                <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
                            ))}
                        </div>
                    )}
                </div>
            </Tabs>
        </div>
    );
}

function EnrollmentCard({ enrollment }: { enrollment: Enrollment }) {
    return (
        <Link href={`/learning/course/${enrollment.courseId}`}>
            <Card className="group h-full flex flex-col overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300">
                <div className="relative h-40 w-full shrink-0">
                    {enrollment.courseThumbnail ? (
                        <Image src={enrollment.courseThumbnail} alt={enrollment.courseName || ''} fill className="object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <BookOpen className="h-10 w-10 text-primary/30" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-4 flex flex-col justify-end">
                        <Badge className="w-fit bg-primary/80 backdrop-blur-sm border-transparent text-[10px] uppercase font-black">
                            {enrollment.status === 'COMPLETED' ? 'Concluído' : 'Ativo'}
                        </Badge>
                    </div>
                </div>

                <CardContent className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-black leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[3rem]">
                            {enrollment.courseName}
                        </h3>
                    </div>

                    <div className="space-y-4 mt-4">
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest leading-none">
                                <span className="text-muted-foreground">Progresso</span>
                                <span className="text-primary">{enrollment.progressPercentage.toFixed(0)}%</span>
                            </div>
                            <Progress value={enrollment.progressPercentage} className="h-1.5 bg-muted shadow-inner" />
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-primary/5 mt-auto">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span className="text-[10px] font-bold uppercase">Último acesso: 2h atrás</span>
                            </div>
                            <Button size="sm" variant="ghost" className="h-8 px-2 group-hover:bg-primary group-hover:text-white rounded-lg transition-all text-xs font-bold">
                                {enrollment.status === 'COMPLETED' ? 'Rever' : 'Continuar'} <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
