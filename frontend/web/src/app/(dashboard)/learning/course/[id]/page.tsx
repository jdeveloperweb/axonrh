'use client';

import { useState, useEffect } from 'react';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { useParams, useRouter } from 'next/navigation';
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
    ChevronRight,
    Lock,
    Calendar,
    Award,
    Users,
    Star,
    FileText,
    MessageSquare,
    Share2,
    ArrowLeft,
    Video,
    LogOut
} from 'lucide-react';
import Image from "next/image";
import { coursesApi, enrollmentsApi, Course, Enrollment } from '@/lib/api/learning';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';

export default function CourseDetails() {
    const { confirm } = useConfirm();
    const { id } = useParams();
    const { user } = useAuthStore();
    const router = useRouter();
    const [course, setCourse] = useState<Course | null>(null);
    const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!id || !user?.id) return;
            try {
                setLoading(true);
                const courseRes = await coursesApi.get(id as string);
                setCourse(courseRes as any);

                const enrollmentsRes = await enrollmentsApi.getByEmployee(user.id);
                const myEnrollment = ((enrollmentsRes as any) || []).find((e: any) => {
                    const cId = e.course?.id || e.courseId || e.idCourse;
                    return cId === id;
                });
                setEnrollment(myEnrollment || null);
            } catch (error) {
                console.error('Erro ao buscar curso:', error);
                toast.error('Erro ao carregar detalhes do curso');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, user?.id]);

    const handleEnroll = async () => {
        if (!user?.id || !course) return;
        try {
            setEnrolling(true);
            const res = await enrollmentsApi.enroll(course.id, {
                employeeId: user.id,
                employeeName: user.name || 'Usuário'
            });
            setEnrollment(res as any);
            toast.success('Inscrição realizada com sucesso!');
        } catch (error: any) {
            console.error('Erro ao inscrever:', error);
            const message = error.response?.data?.message || error.message || 'Erro ao realizar inscrição';
            toast.error(message);
        } finally {
            setEnrolling(false);
        }
    };

    const handleStart = async () => {
        if (!enrollment) return;
        try {
            if (enrollment.status === 'ENROLLED') {
                const res = await enrollmentsApi.start(enrollment.id);
                setEnrollment(res as any);
            }
            // Redirect to first lesson or last progress
            router.push(`/learning/course/${course?.id}/learn`);
        } catch (error) {
            console.error('Erro ao iniciar curso:', error);
        }
    };

    const handleComplete = async () => {
        if (!enrollment) return;
        try {
            if (!await confirm({
                title: 'Finalizar Treinamento',
                description: 'Parabéns por concluir o conteúdo! Deseja finalizar o curso e emitir seu certificado agora?',
                confirmLabel: 'Finalizar e Emitir Certificado',
                variant: 'default'
            })) return;

            setEnrolling(true);
            const res = await enrollmentsApi.complete(enrollment.id, 100);
            setEnrollment(res as any);
            toast.success('Treinamento concluído com sucesso! Seu certificado foi gerado.');
        } catch (error: any) {
            console.error('Erro ao completar curso:', error);
            toast.error('Erro ao finalizar treinamento');
        } finally {
            setEnrolling(false);
        }
    };

    const handleUnenroll = async () => {
        if (!enrollment) return;

        if (course?.isMandatory) {
            toast.error('Este treinamento é obrigatório e não pode ser removido.');
            return;
        }

        if (!await confirm({
            title: 'Sair do Treinamento',
            description: 'Tem certeza que deseja sair deste treinamento? Todo o seu progresso será perdido.',
            variant: 'destructive',
            confirmLabel: 'Sair'
        })) {
            return;
        }

        try {
            setEnrolling(true);
            await enrollmentsApi.unenroll(enrollment.id);
            setEnrollment(null);
            toast.success('Você saiu do treinamento com sucesso.');
        } catch (error: any) {
            console.error('Erro ao desinscrever:', error);
            toast.error('Erro ao sair do treinamento');
        } finally {
            setEnrolling(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="text-center py-20">
                <h1 className="text-2xl font-bold">Curso não encontrado</h1>
                <Button onClick={() => router.back()} className="mt-4">Voltar</Button>
            </div>
        );
    }

    const formatDuration = (minutes?: number) => {
        if (!minutes) return '-';
        if (minutes < 60) return `${minutes}min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 pb-20">
            {/* Breadcrumbs / Back button */}
            <Button variant="ghost" onClick={() => router.push('/learning/catalog')} className="mb-4 -ml-4 hover:bg-muted font-medium text-muted-foreground">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para o catálogo
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Course Info (Left/Main Column) */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <div className="flex gap-2 items-center">
                            <Badge variant="outline" className="text-primary border-primary bg-primary/5">{course.categoryName || 'Treinamento'}</Badge>
                            <Badge variant="outline" className="text-muted-foreground">{course.difficultyLevel === 'INICIANTE' ? 'Iniciante' : course.difficultyLevel === 'INTERMEDIARIO' ? 'Intermediário' : 'Avançado'}</Badge>
                            {course.isMandatory && <Badge variant="destructive">Obrigatório</Badge>}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight">{course.title}</h1>
                        <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
                            {course.description}
                        </p>
                        <div className="flex items-center gap-6 pt-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="h-5 w-5" />
                                <span className="text-sm font-medium">Conteúdo exclusivo para colaboradores Axon</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-muted-foreground/10">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {course.instructorName?.split(' ').map(n => n[0]).join('') || 'IA'}
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Instrutor</p>
                            <p className="font-semibold text-lg">{course.instructorName || 'Especialista Axon'}</p>
                        </div>
                    </div>

                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0 mb-6 gap-8">
                            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent px-0 py-3 text-base data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold">Resumo</TabsTrigger>
                            <TabsTrigger value="syllabus" className="rounded-none border-b-2 border-transparent px-0 py-3 text-base data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold">Conteúdo do Curso</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="prose prose-slate max-w-none dark:prose-invert">
                                <h3 className="text-2xl font-bold mb-4">O que você vai aprender</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                    {course.objectives?.split('\n').filter(o => o.trim()).map((obj, i) => (
                                        <div key={i} className="flex gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                            <span className="text-muted-foreground">{obj}</span>
                                        </div>
                                    )) || (
                                            <p className="text-muted-foreground italic col-span-2">Os objetivos deste curso serão listados em breve.</p>
                                        )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-2xl font-bold">Pré-requisitos</h3>
                                <p className="text-muted-foreground">
                                    {course.prerequisites || 'Não há pré-requisitos específicos para este treinamento. Mente aberta e vontade de aprender são as únicas necessidades!'}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-2xl font-bold">Público Alvo</h3>
                                <p className="text-muted-foreground">
                                    {course.targetAudience ?? 'Todos os colaboradores interessados no tema.'}
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="syllabus" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="space-y-4">
                                {course.modules?.map((module, idx) => (
                                    <Card key={module.id} className="overflow-hidden border-muted-foreground/10 group">
                                        <CardHeader className="p-4 bg-muted/20 cursor-pointer flex flex-row items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Módulo {idx + 1}</p>
                                                <CardTitle className="text-lg">{module.title}</CardTitle>
                                            </div>
                                            <div className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                                                <Play className="h-3 w-3" />
                                                {module.lessons?.length || 0} aulas • {formatDuration(module.durationMinutes)}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="divide-y divide-muted-foreground/5">
                                                {module.lessons?.map((lesson, lIdx) => (
                                                    <div key={lesson.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group/lesson">
                                                        <div className="flex gap-4 items-center">
                                                            <div className="h-8 w-8 rounded-full border border-primary/20 flex items-center justify-center bg-background group-hover/lesson:border-primary transition-colors">
                                                                {enrollment?.lessonProgresses?.some(p => p.lessonId === lesson.id && p.status === 'COMPLETED') ? (
                                                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                                ) : (
                                                                    <span className="text-xs font-bold text-muted-foreground group-hover/lesson:text-primary">{lIdx + 1}</span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold">{lesson.title}</p>
                                                                <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                                                    {lesson.contentType === 'VIDEO' ? <Play className="h-2.5 w-2.5" /> : <FileText className="h-2.5 w-2.5" />}
                                                                    {lesson.durationMinutes} min
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Lock className="h-4 w-4 text-muted-foreground opacity-20" />
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar (Right Column) */}
                <div className="sticky top-24 space-y-6">
                    <Card className="overflow-hidden shadow-2xl border-primary/10 ring-1 ring-primary/5">
                        <div className="relative h-48 w-full group">
                            {course.thumbnailUrl ? (
                                <Image src={course.thumbnailUrl} alt={course.title} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary to-primary-foreground/30 flex items-center justify-center">
                                    <Play className="h-16 w-16 text-white/50" />
                                </div>
                            )}
                            {(!enrollment || enrollment.status === 'ENROLLED') && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="outline" className="text-white border-white bg-white/20 hover:bg-white hover:text-primary transition-all rounded-full p-8 font-black">
                                        PREVIEW
                                    </Button>
                                </div>
                            )}
                        </div>

                        <CardContent className="p-6 space-y-6">
                            {!enrollment ? (
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Treinamento Corporativo</p>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Disponível para sua trilha</h3>
                                    </div>
                                    <Button className="w-full py-6 text-lg font-bold rounded-xl" onClick={handleEnroll} disabled={enrolling}>
                                        {enrolling ? 'Processando...' : 'Inscrever-se Agora'}
                                    </Button>
                                    <p className="text-[10px] text-center text-muted-foreground uppercase font-black tracking-widest">Acesso vitalício</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-sm font-bold">
                                            <span>Progresso</span>
                                            <span className="text-primary">{enrollment.progressPercentage.toFixed(0)}%</span>
                                        </div>
                                        <Progress value={enrollment.progressPercentage} className="h-2 bg-muted transition-all" />
                                    </div>

                                    {(enrollment.progressPercentage === 100 && enrollment.status !== 'COMPLETED') || (enrollment.status === 'COMPLETED' && !enrollment.certificateId) ? (
                                        <Button className="w-full py-6 text-lg font-bold rounded-xl shadow-lg bg-green-600 hover:bg-green-700 shadow-green-900/10" onClick={handleComplete} disabled={enrolling}>
                                            {enrolling ? 'Processando...' : 'Finalizar e Emitir Certificado'}
                                            <Award className="ml-2 h-5 w-5" />
                                        </Button>
                                    ) : (
                                        <>
                                            {enrollment.status !== 'COMPLETED' && (
                                                <Button className="w-full py-6 text-lg font-bold rounded-xl shadow-lg shadow-primary/20" onClick={handleStart}>
                                                    {enrollment.progressPercentage > 0 ? 'Continuar Curso' : 'Iniciar Treinamento'}
                                                    <Play className="ml-2 h-4 w-4 fill-current" />
                                                </Button>
                                            )}
                                        </>
                                    )}

                                    {enrollment.status === 'COMPLETED' && enrollment.certificateId && (
                                        <Button
                                            variant="outline"
                                            className="w-full border-primary text-primary hover:bg-primary/5 font-bold py-6 rounded-xl"
                                            onClick={() => router.push(`/learning/certificates/${enrollment.certificateId}`)}
                                        >
                                            Ver Certificado
                                            <Award className="ml-2 h-5 w-5" />
                                        </Button>
                                    )}

                                    {!course.isMandatory && enrollment.status !== 'COMPLETED' && (
                                        <Button
                                            variant="ghost"
                                            className="w-full text-muted-foreground hover:text-red-500 hover:bg-red-50 font-bold py-4 rounded-xl text-xs uppercase tracking-widest mt-2 flex gap-2"
                                            onClick={handleUnenroll}
                                            disabled={enrolling}
                                        >
                                            {enrolling ? 'Saindo...' : (
                                                <>
                                                    <LogOut className="h-3 w-3" />
                                                    Sair do Treinamento
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            )}

                            <div className="space-y-4 pt-6 border-t font-medium">
                                <p className="text-sm font-bold flex items-center gap-3">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                    {course.modules?.length || 0} módulos
                                </p>
                                <p className="text-sm font-bold flex items-center gap-3">
                                    <Video className="h-4 w-4 text-primary" />
                                    {course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0} aulas
                                </p>
                                <p className="text-sm font-bold flex items-center gap-3">
                                    <Clock className="h-4 w-4 text-primary" />
                                    {formatDuration(course.durationMinutes)} totais
                                </p>
                                <p className="text-sm font-bold flex items-center gap-3">
                                    <Award className="h-4 w-4 text-primary" />
                                    Certificado de conclusão
                                </p>
                            </div>

                            <div className="pt-2">
                                <p className="text-[10px] text-center text-muted-foreground uppercase font-black tracking-widest italic">
                                    Finalize para obter seu certificado Axon
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-muted-foreground/10">
                        <CardHeader className="p-4">
                            <CardTitle className="text-sm uppercase tracking-widest font-black flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-primary" />
                                Precisa de ajuda?
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Tem alguma dúvida sobre este treinamento? Fale com nosso suporte pedagógico pelo chat ou abra um chamado.
                            </p>
                            <Button variant="ghost" size="sm" className="px-0 text-primary font-bold text-xs mt-2 hover:bg-transparent">Falar com suporte →</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
