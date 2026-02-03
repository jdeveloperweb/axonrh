'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Play,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Menu,
    FileText,
    Video,
    ArrowLeft,
    X,
    Star,
    Download,
    Info
} from 'lucide-react';
import { coursesApi, enrollmentsApi, Course, Enrollment, Lesson } from '@/lib/api/learning';
import { useAuthStore } from '@/stores/auth-store';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function LearnCourse() {
    const { id } = useParams();
    const { user } = useAuthStore();
    const router = useRouter();

    const [course, setCourse] = useState<Course | null>(null);
    const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [completing, setCompleting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!id || !user?.id) return;
            try {
                setLoading(true);
                const [courseRes, enrollmentsRes] = await Promise.all([
                    coursesApi.get(id as string),
                    enrollmentsApi.getByEmployee(user.id)
                ]);

                const c = courseRes as any;
                const e = ((enrollmentsRes as any) || []).find((enroll: any) => enroll.courseId === id);

                if (!e) {
                    toast.error('Você não está inscrito neste curso');
                    router.push(`/learning/course/${id}`);
                    return;
                }

                setCourse(c);
                setEnrollment(e);

                // Find last progress or first lesson
                const lastProgress = (e as any).lessonProgresses
                    ?.filter((p: any) => p.status === 'IN_PROGRESS')
                    .sort((a: any, b: any) => new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime())[0];

                let initialLesson: any | null = null;
                if (lastProgress) {
                    initialLesson = (c as any).modules
                        .flatMap((m: any) => m.lessons)
                        .find((l: any) => l.id === lastProgress.lessonId) || null;
                }

                if (!initialLesson) {
                    initialLesson = c.modules[0]?.lessons[0] || null;
                }

                setCurrentLesson(initialLesson);
            } catch (error) {
                console.error('Erro ao buscar dados do curso:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, user?.id, router]);

    const handleLessonSelect = (lesson: Lesson) => {
        setCurrentLesson(lesson);
        // If mobile, close sidebar
        if (window.innerWidth < 1024) setSidebarOpen(false);
    };

    const handleCompleteLesson = async () => {
        if (!enrollment || !currentLesson || completing) return;
        try {
            setCompleting(true);
            const res = await enrollmentsApi.updateProgress(enrollment.id, currentLesson.id, {
                status: 'COMPLETED',
                timeSpent: currentLesson.durationMinutes || 0
            });
            setEnrollment(res.data);
            toast.success('Lição concluída!');

            // Go to next lesson
            const allLessons = course?.modules.flatMap(m => m.lessons) || [];
            const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id);
            if (currentIndex < allLessons.length - 1) {
                setCurrentLesson(allLessons[currentIndex + 1]);
            } else {
                toast.success('Parabéns! Você concluiu todas as lições do curso.');
            }
        } catch (error) {
            console.error('Erro ao completar lição:', error);
            toast.error('Erro ao salvar progresso');
        } finally {
            setCompleting(false);
        }
    };

    if (loading || !course || !enrollment) {
        return (
            <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                    <p className="text-muted-foreground font-medium">Preparando seu ambiente de estudo...</p>
                </div>
            </div>
        );
    }

    const isLessonCompleted = (lessonId: string) => {
        return enrollment.lessonProgresses?.some(p => p.lessonId === lessonId && p.status === 'COMPLETED');
    };

    return (
        <div className="fixed inset-0 bg-background z-50 flex flex-col overflow-hidden">
            {/* Top Header */}
            <header className="h-16 px-6 border-b flex items-center justify-between bg-card shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/learning/course/${id}`)} className="rounded-full">
                        <X className="h-5 w-5" />
                    </Button>
                    <div className="h-8 w-px bg-muted mx-2 hidden md:block" />
                    <div className="flex flex-col">
                        <h1 className="text-sm font-black line-clamp-1 uppercase tracking-tight">{course.title}</h1>
                        <div className="flex items-center gap-2">
                            <Progress value={enrollment.progressPercentage} className="h-1.5 w-24 bg-muted" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{enrollment.progressPercentage.toFixed(0)}% CONCLUÍDO</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="hidden border-amber-200 bg-amber-50 text-amber-700 md:flex items-center gap-2 font-bold text-xs uppercase tracking-tighter">
                        <Star className="h-3 w-3 fill-current" /> Avaliar Curso
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-[#0a0a0a] flex flex-col">
                    {/* Content Viewer (Video/Text) */}
                    <div className="flex-1 flex flex-col lg:flex-row h-full">
                        <div className="flex-1 flex flex-col">
                            {currentLesson?.contentType === 'VIDEO' ? (
                                <div className="relative aspect-video bg-black w-full flex items-center justify-center">
                                    {/* Mock Video Player */}
                                    <div className="absolute inset-0 flex items-center justify-center group cursor-pointer bg-gradient-to-tr from-primary/5 to-transparent">
                                        <div className="h-20 w-20 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                                            <Play className="h-10 w-10 text-white fill-current ml-1" />
                                        </div>
                                        <div className="absolute bottom-8 left-8 right-8 space-y-4">
                                            <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary w-1/3" />
                                            </div>
                                            <div className="flex justify-between text-white/80 text-xs font-mono">
                                                <span>10:24 / 32:00</span>
                                                <div className="flex gap-4">
                                                    <span>1080p</span>
                                                    <span>HD</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 p-12 overflow-y-auto">
                                    <div className="max-w-4xl mx-auto bg-card p-12 rounded-3xl shadow-xl border border-white/5 space-y-8">
                                        <div className="space-y-4 text-center">
                                            <Badge variant="outline" className="text-primary border-primary">{currentLesson?.contentType}</Badge>
                                            <h2 className="text-4xl font-black">{currentLesson?.title}</h2>
                                            <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
                                        </div>

                                        <div className="prose prose-slate dark:prose-invert max-w-none text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">
                                            {currentLesson?.contentText || currentLesson?.description || 'Conteúdo em desenvolvimento...'}
                                        </div>

                                        {currentLesson?.isDownloadable && (
                                            <div className="pt-8 border-t">
                                                <Button variant="outline" className="w-full h-16 border-dashed gap-3 font-bold text-lg">
                                                    <Download className="h-5 w-5 text-primary" />
                                                    Baixar Material Complementar (PDF)
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Lesson Navigation Footer */}
                            <div className="p-6 border-t border-white/10 bg-card/50 backdrop-blur-md flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Executando</p>
                                    <p className="font-bold text-white line-clamp-1">{currentLesson?.title}</p>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        className="font-bold text-xs uppercase rounded-xl"
                                        onClick={handleCompleteLesson}
                                        disabled={!!(completing || (currentLesson && isLessonCompleted(currentLesson.id)))}
                                    >
                                        {currentLesson && isLessonCompleted(currentLesson.id) ? (
                                            <span className="flex items-center gap-2 text-green-500">
                                                <CheckCircle2 className="h-4 w-4" /> Concluído
                                            </span>
                                        ) : completing ? 'Salvando...' : 'Marcar como Concluído'}
                                    </Button>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-12 w-12 rounded-xl border border-white/5">
                                            <ChevronLeft className="h-6 w-6" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-12 w-12 rounded-xl border border-white/10">
                                            <ChevronRight className="h-6 w-6" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Syllabus Sidebar */}
                <aside className={`
          fixed inset-y-16 right-0 w-80 bg-card border-l z-40 transition-transform duration-300 lg:sticky lg:inset-y-0
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-80 lg:hidden'}
        `}>
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b">
                            <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground mb-4">Conteúdo do Curso</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase">{enrollment.progressPercentage.toFixed(0)}% COMPLETO</span>
                                    <span className="text-[10px] font-bold text-primary">{enrollment.lessonProgresses?.filter(p => p.status === 'COMPLETED').length || 0} / {course.modules.reduce((a, m) => a + m.lessons.length, 0)} AULAS</span>
                                </div>
                                <Progress value={enrollment.progressPercentage} className="h-1 bg-muted" />
                            </div>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="divide-y">
                                {course.modules.map((module, mIdx) => (
                                    <div key={module.id} className="py-2">
                                        <div className="px-4 py-2 bg-muted/20">
                                            <p className="text-[9px] font-bold text-primary uppercase tracking-tighter mb-0.5">Módulo {mIdx + 1}</p>
                                            <h4 className="text-xs font-black line-clamp-1">{module.title}</h4>
                                        </div>
                                        <div className="space-y-0.5">
                                            {module.lessons.map((lesson) => (
                                                <button
                                                    key={lesson.id}
                                                    onClick={() => handleLessonSelect(lesson)}
                                                    className={`
                            w-full p-4 flex items-center gap-4 transition-all hover:bg-muted/30 group text-left
                            ${currentLesson?.id === lesson.id ? 'bg-primary/5 border-l-4 border-primary' : 'border-l-4 border-transparent'}
                          `}
                                                >
                                                    <div className={`
                            h-6 w-6 rounded-full flex items-center justify-center shrink-0 border
                            ${isLessonCompleted(lesson.id) ? 'bg-green-500 border-green-400' : 'bg-background border-muted-foreground/20'}
                          `}>
                                                        {isLessonCompleted(lesson.id) ? (
                                                            <CheckCircle2 className="h-3 w-3 text-white" />
                                                        ) : currentLesson?.id === lesson.id ? (
                                                            <Play className="h-3 w-3 text-primary fill-current" />
                                                        ) : (
                                                            lesson.contentType === 'VIDEO' ? <Video className="h-3 w-3 text-muted-foreground" /> : <FileText className="h-3 w-3 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-xs font-bold truncate ${currentLesson?.id === lesson.id ? 'text-primary' : 'text-foreground'}`}>
                                                            {lesson.title}
                                                        </p>
                                                        <span className="text-[9px] font-medium text-muted-foreground uppercase">{lesson.durationMinutes} min</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="p-4 border-t bg-muted/10">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-muted-foreground/10">
                                <Info className="h-4 w-4 text-primary shrink-0" />
                                <p className="text-[10px] text-muted-foreground leading-tight font-medium">Conclua todas as lições para desbloquear seu certificado exclusivo.</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
