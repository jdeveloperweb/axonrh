'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
    History,
    CheckCircle2,
    Clock,
    ArrowRight,
    TrendingDown,
    ChevronRight,
    Filter
} from 'lucide-react';
import { enrollmentsApi, Enrollment } from '@/lib/api/learning';
import { useAuthStore } from '@/stores/auth-store';

export default function LearningHistory() {
    const { user } = useAuthStore();
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!user?.id) return;
            try {
                setLoading(true);
                const res = await enrollmentsApi.getByEmployee(user.id);
                // Sort by completion date or enrolled date
                const sorted = (res.data || []).sort((a, b) =>
                    new Date(b.completedAt || b.enrolledAt).getTime() - new Date(a.completedAt || a.enrolledAt).getTime()
                );
                setEnrollments(sorted);
            } catch (error) {
                console.error('Erro ao buscar historico:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user?.id]);

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-1000">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground shadow-inner">
                        <History className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight">Histórico de Atividade</h1>
                        <p className="text-muted-foreground font-medium">Revisite seus estudos e acompanhe sua evolução temporal.</p>
                    </div>
                </div>
                <Button variant="outline" className="rounded-xl h-12 px-6 gap-2 font-black border-2 border-primary/10">
                    <Filter className="h-4 w-4" /> FILTRAR POR ANO
                </Button>
            </div>

            <div className="relative">
                <div className="absolute left-[31px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary/20 via-muted/50 to-transparent z-0 hidden md:block" />

                <div className="space-y-12 relative z-10">
                    {loading ? (
                        [1, 2].map(i => <div key={i} className="h-32 bg-card border rounded-3xl animate-pulse ml-16" />)
                    ) : enrollments.length === 0 ? (
                        <div className="ml-16 py-20 bg-card rounded-3xl border border-dashed text-center flex flex-col items-center">
                            <TrendingDown className="h-12 w-12 text-muted-foreground/20 mb-4" />
                            <h3 className="text-xl font-bold">Nenhum registro encontrado</h3>
                            <p className="text-muted-foreground max-w-xs mx-auto">Você ainda não iniciou sua jornada de estudos conosco.</p>
                        </div>
                    ) : (
                        enrollments.map((enrollment, idx) => (
                            <div key={enrollment.id} className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="h-16 w-16 rounded-full bg-background border-4 border-muted shrink-0 z-10 hidden md:flex items-center justify-center shadow-lg">
                                    <span className="text-[10px] font-black text-muted-foreground">{new Date(enrollment.enrolledAt).getFullYear()}</span>
                                </div>

                                <Card className="flex-1 w-full rounded-[2rem] border-primary/5 hover:border-primary/20 transition-all duration-300 hover:shadow-xl group overflow-hidden">
                                    <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="flex items-center gap-6 flex-1">
                                            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 ${enrollment.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
                                                {enrollment.status === 'COMPLETED' ? <CheckCircle2 className="h-8 w-8" /> : <Clock className="h-8 w-8" />}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                                    {enrollment.status === 'COMPLETED' ? 'Finalizado em: ' : 'Iniciado em: '}
                                                    {new Date(enrollment.completedAt || enrollment.enrolledAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                                                </p>
                                                <h3 className="text-2xl font-black leading-tight group-hover:text-primary transition-colors">{enrollment.courseName}</h3>
                                                <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground/60 uppercase">
                                                    <span>{enrollment.progressPercentage.toFixed(0)}% de Progresso</span>
                                                    {enrollment.finalScore && <span>Pontuação: {enrollment.finalScore}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Link href={`/learning/course/${enrollment.courseId}`}>
                                                <Button variant="ghost" className="rounded-xl font-bold h-12 px-6 group-hover:bg-primary group-hover:text-white transition-all">
                                                    Revisar Conteúdo <ChevronRight className="h-4 w-4 ml-2" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
