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
    Info,
    BrainCircuit,
    Type,
    Layers,
    ExternalLink,
    ChevronDown
} from 'lucide-react';
import { coursesApi, enrollmentsApi, Course, Enrollment, Lesson, ContentType } from '@/lib/api/learning';
import { useAuthStore } from '@/stores/auth-store';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
                const e = ((enrollmentsRes as any) || []).find((enroll: any) => (enroll.courseId === id || enroll.course?.id === id));

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
            setEnrollment(res as any);
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

    const handleNextLesson = () => {
        const allLessons = course?.modules.flatMap(m => m.lessons) || [];
        const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
        if (currentIndex < allLessons.length - 1) {
            setCurrentLesson(allLessons[currentIndex + 1]);
        }
    };

    const handlePrevLesson = () => {
        const allLessons = course?.modules.flatMap(m => m.lessons) || [];
        const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
        if (currentIndex > 0) {
            setCurrentLesson(allLessons[currentIndex - 1]);
        }
    };

    if (loading || !course || !enrollment) {
        return (
            <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
                <div className="flex flex-col items-center gap-6 animate-in fade-in duration-700">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full border-t-4 border-primary animate-spin" />
                        <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-primary/20" />
                    </div>
                    <p className="text-muted-foreground font-medium tracking-wide animate-pulse">Preparando seu ambiente de estudo...</p>
                </div>
            </div>
        );
    }

    const isLessonCompleted = (lessonId: string) => {
        return enrollment.lessonProgresses?.some(p => p.lessonId === lessonId && p.status === 'COMPLETED');
    };

    const getEmbedUrl = (url?: string) => {
        if (!url) return null;
        if (url.includes('youtube.com/watch?v=')) {
            return url.replace('watch?v=', 'embed/');
        }
        if (url.includes('youtu.be/')) {
            return url.replace('youtu.be/', 'youtube.com/embed/');
        }
        if (url.includes('vimeo.com/')) {
            const id = url.split('/').pop();
            return `https://player.vimeo.com/video/${id}`;
        }
        return url;
    };

    return (
        <div className="fixed inset-0 bg-background z-50 flex flex-col overflow-hidden font-sans">
            {/* Top Header - Glassmorphism */}
            <header className="h-16 px-6 border-b flex items-center justify-between bg-card/80 backdrop-blur-xl z-20 shrink-0 sticky top-0">
                <div className="flex items-center gap-5">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/learning/course/${id}`)} className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                        <X className="h-5 w-5" />
                    </Button>
                    <div className="h-8 w-px bg-muted/50 mx-2 hidden md:block" />
                    <div className="flex flex-col">
                        <h1 className="text-sm font-black line-clamp-1 uppercase tracking-tight text-foreground/90">{course.title}</h1>
                        <div className="flex items-center gap-3 pt-1">
                            <Progress value={enrollment.progressPercentage} className="h-1.5 w-24 bg-muted" indicatorClassName="bg-gradient-to-r from-primary/80 to-primary" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{enrollment.progressPercentage.toFixed(0)}% CONCLUÍDO</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-muted-foreground hover:text-foreground">
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-[#050505] flex flex-col relative group">
                    {/* Ambient Background Effects */}
                    <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none opacity-50" />

                    {/* Content Viewer (Video/Text) */}
                    <div className="flex-1 flex flex-col lg:flex-row h-full z-10">
                        <div className="flex-1 flex flex-col">
                            <div className="flex-1 flex flex-col">
                                {currentLesson?.contentType === 'VIDEO' ? (
                                    <div className="flex-1 flex flex-col bg-black relative">
                                        <div className="relative w-full h-full flex flex-col items-center justify-center">
                                            <div className="w-full h-full max-h-[85vh] aspect-video relative shadow-2xl shadow-black/50">
                                                {currentLesson.contentUrl ? (
                                                    <iframe
                                                        src={getEmbedUrl(currentLesson.contentUrl)!}
                                                        className="w-full h-full"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-slate-900 via-stone-900 to-black">
                                                        <div className="relative group cursor-pointer">
                                                            <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/40 transition-all duration-500" />
                                                            <div className="h-24 w-24 rounded-full bg-background/10 backdrop-blur-sm border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 relative z-10 shadow-2xl">
                                                                <Play className="h-10 w-10 text-white fill-current ml-2 opacity-90 group-hover:opacity-100" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 p-6 md:p-12 overflow-y-auto bg-gradient-to-b from-slate-950 to-black">
                                        <div className="max-w-4xl mx-auto bg-card/40 backdrop-blur-2xl p-8 md:p-16 rounded-[3rem] shadow-2xl border border-white/5 space-y-10 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-20" />

                                            <div className="space-y-6 text-center">
                                                <Badge variant="outline" className={cn(
                                                    "border-2 font-black uppercase text-[10px] tracking-widest px-4 py-1.5 rounded-full shadow-sm",
                                                    currentLesson?.contentType === 'QUIZ' ? "border-amber-500/50 text-amber-400 bg-amber-500/10" :
                                                        currentLesson?.contentType === 'DOCUMENTO' ? "border-rose-500/50 text-rose-400 bg-rose-500/10" :
                                                            "border-primary/50 text-primary bg-primary/10"
                                                )}>{currentLesson?.contentType}</Badge>
                                                <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">{currentLesson?.title}</h2>
                                                <div className="h-1.5 w-24 bg-gradient-to-r from-primary/50 to-primary mx-auto rounded-full" />
                                            </div>

                                            {currentLesson?.contentType === 'QUIZ' ? (
                                                <div className="py-20 text-center space-y-10 animate-in fade-in zoom-in duration-500">
                                                    <div className="h-40 w-40 bg-gradient-to-br from-amber-500/20 to-amber-500/5 rounded-[3rem] flex items-center justify-center mx-auto shadow-[0_0_40px_-10px_rgba(245,158,11,0.3)] border border-amber-500/20 relative">
                                                        <div className="absolute inset-0 bg-amber-500/10 blur-2xl rounded-full" />
                                                        <BrainCircuit className="h-20 w-20 text-amber-400 relative z-10" />
                                                    </div>
                                                    <div className="space-y-4">
                                                        <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">Avaliação de Conhecimento</h3>
                                                        <p className="text-muted-foreground max-w-md mx-auto font-medium text-lg">Este quiz contém perguntas baseadas no conteúdo deste módulo. Pronto para testar seus conhecimentos?</p>
                                                    </div>
                                                    <Button className="h-16 px-12 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-lg shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95">
                                                        Iniciar Quiz agora
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="prose prose-lg prose-invert max-w-none text-muted-foreground/90 leading-relaxed">
                                                    <div dangerouslySetInnerHTML={{ __html: currentLesson?.contentText || currentLesson?.description || 'Conteúdo em desenvolvimento...' }} />
                                                </div>
                                            )}

                                            {(currentLesson?.isDownloadable || currentLesson?.contentType === 'DOCUMENTO') && currentLesson?.contentUrl && (
                                                <div className="pt-10 border-t border-white/5">
                                                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white/10 transition-all group cursor-pointer" onClick={() => window.open(currentLesson.contentUrl, '_blank')}>
                                                        <div className="flex gap-5 items-center">
                                                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 shadow-inner flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                                                                <FileText className="h-8 w-8 text-rose-400" />
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-xl text-foreground group-hover:text-rose-400 transition-colors">Material de Apoio</p>
                                                                <p className="text-sm text-muted-foreground font-medium">Clique para visualizar ou baixar o conteúdo.</p>
                                                            </div>
                                                        </div>
                                                        <Button variant="outline" size="lg" className="rounded-xl font-bold gap-3 border-white/10 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all">
                                                            Acessar Material <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Lesson Navigation Footer - Adjusted for Visibility */}
                                <div className="p-6 border-t border-white/10 bg-[#0a0a0a]/90 backdrop-blur-xl flex items-center justify-between z-20">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] font-bold text-primary/80 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            Executando Aula
                                        </p>
                                        <p className="font-bold text-white text-lg line-clamp-1">{currentLesson?.title}</p>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            variant={currentLesson && isLessonCompleted(currentLesson.id) ? "outline" : "default"}
                                            size="lg"
                                            className={cn(
                                                "font-bold text-xs uppercase rounded-xl min-w-[160px] transition-all duration-300",
                                                currentLesson && isLessonCompleted(currentLesson.id)
                                                    ? "border-green-500/50 text-green-500 hover:bg-green-500/10"
                                                    : "shadow-lg shadow-primary/20 hover:scale-105"
                                            )}
                                            onClick={handleCompleteLesson}
                                            disabled={!!(completing || (currentLesson && isLessonCompleted(currentLesson.id)))}
                                        >
                                            {currentLesson && isLessonCompleted(currentLesson.id) ? (
                                                <span className="flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4" /> Concluído
                                                </span>
                                            ) : completing ? 'Salvando...' : 'Marcar como Concluído'}
                                        </Button>
                                        <div className="h-10 w-px bg-white/10 mx-2" />
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="bg-transparent border-white/10 text-white hover:bg-white/10 h-10 w-10 rounded-xl"
                                                onClick={handlePrevLesson}
                                                disabled={!course?.modules.flatMap(m => m.lessons).findIndex(l => l.id === currentLesson?.id)}
                                            >
                                                <ChevronLeft className="h-5 w-5" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="bg-transparent border-white/10 text-white hover:bg-white/10 h-10 w-10 rounded-xl"
                                                onClick={handleNextLesson}
                                            >
                                                <ChevronRight className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Syllabus Sidebar */}
                <aside className={`
          fixed inset-y-16 right-0 w-80 bg-background/95 backdrop-blur-md border-l border-border/50 z-40 transition-transform duration-300 lg:sticky lg:inset-y-0
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-80 lg:hidden'}
        `}>
                    <div className="flex flex-col h-full">
                        <div className="p-6 border-b border-border/50 bg-muted/20">
                            <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground mb-4">Estrutura do Curso</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-foreground/80">{enrollment.progressPercentage.toFixed(0)}% COMPLETO</span>
                                    <span className="text-[10px] font-bold text-primary">{enrollment.lessonProgresses?.filter(p => p.status === 'COMPLETED').length || 0}/{course.modules.reduce((a, m) => a + m.lessons.length, 0)}</span>
                                </div>
                                <Progress value={enrollment.progressPercentage} className="h-1.5 bg-muted/50" indicatorClassName="bg-primary" />
                            </div>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="py-2">
                                {course.modules.map((module, mIdx) => (
                                    <div key={module.id} className="mb-2">
                                        <div className="px-6 py-3 flex items-center justify-between group cursor-default">
                                            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">Módulo {mIdx + 1} - {module.title}</h4>
                                        </div>
                                        <div className="space-y-1">
                                            {module.lessons.map((lesson) => (
                                                <button
                                                    key={lesson.id}
                                                    onClick={() => handleLessonSelect(lesson)}
                                                    className={`
                            w-full px-6 py-3 flex items-center gap-4 transition-all hover:bg-muted/50 text-left relative
                            ${currentLesson?.id === lesson.id ? 'bg-primary/10' : 'transparent'}
                          `}
                                                >
                                                    {currentLesson?.id === lesson.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />}

                                                    <div className={`
                            h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border transition-all
                            ${isLessonCompleted(lesson.id)
                                                            ? 'bg-green-500 border-green-500 text-white shadow-sm shadow-green-500/20'
                                                            : currentLesson?.id === lesson.id
                                                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30 scale-110'
                                                                : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-primary'}
                          `}>
                                                        {isLessonCompleted(lesson.id) ? (
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        ) : currentLesson?.id === lesson.id ? (
                                                            <Play className="h-3 w-3 fill-current" />
                                                        ) : (
                                                            lesson.contentType === 'VIDEO' ? <Video className="h-3 w-3" /> :
                                                                lesson.contentType === 'DOCUMENTO' ? <FileText className="h-3 w-3" /> :
                                                                    lesson.contentType === 'QUIZ' ? <BrainCircuit className="h-3 w-3" /> :
                                                                        <Type className="h-3 w-3" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-semibold truncate transition-colors ${currentLesson?.id === lesson.id ? 'text-primary' : 'text-foreground/80'}`}>
                                                            {lesson.title}
                                                        </p>
                                                        <span className="text-[10px] font-medium text-muted-foreground uppercase">{lesson.durationMinutes} min</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="p-5 border-t border-border/50 bg-muted/10 backdrop-blur-sm">
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 shadow-sm">
                                <Info className="h-5 w-5 text-primary shrink-0" />
                                <p className="text-[10px] text-muted-foreground leading-tight font-medium">Continue firme! Ao final, você receberá seu certificado.</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
