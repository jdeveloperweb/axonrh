'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    BookOpen,
    CheckCircle2,
    Clock,
    Award,
    AlertCircle,
    TrendingUp
} from 'lucide-react';
import { enrollmentsApi, Enrollment, EnrollmentStatistics } from '@/lib/api/learning';
import { cn } from '@/lib/utils';

interface TrainingTabProps {
    employeeId: string;
}

export function TrainingTab({ employeeId }: TrainingTabProps) {
    const [loading, setLoading] = useState(true);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [stats, setStats] = useState<EnrollmentStatistics | null>(null);

    useEffect(() => {
        loadTrainingData();
    }, [employeeId]);

    const loadTrainingData = async () => {
        try {
            setLoading(true);
            const [enrollRes, statsRes] = await Promise.all([
                enrollmentsApi.getByEmployee(employeeId).catch(() => [] as Enrollment[]),
                enrollmentsApi.getStatistics(employeeId).catch(() => null)
            ]);

            setEnrollments(Array.isArray(enrollRes) ? enrollRes : []);
            setStats(statsRes as EnrollmentStatistics | null);
        } catch (error) {
            console.error('Error loading training data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-24 bg-slate-100 rounded-xl"></div>
                    <div className="h-24 bg-slate-100 rounded-xl"></div>
                    <div className="h-24 bg-slate-100 rounded-xl"></div>
                </div>
                <div className="h-96 bg-slate-50 rounded-2xl"></div>
            </div>
        );
    }

    const inProgress = enrollments.filter(e => e.status !== 'COMPLETED');
    const completed = enrollments.filter(e => e.status === 'COMPLETED');

    return (
        <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Cursos Ativos</p>
                            <h3 className="text-2xl font-bold">{inProgress.length}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Concluídos</p>
                            <h3 className="text-2xl font-bold">{completed.length}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Progresso Médio</p>
                            <h3 className="text-2xl font-bold">
                                {stats ? Math.round(stats.averageProgress) : 0}%
                            </h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Active Enrollments */}
                <Card className="border-none shadow-premium">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="h-5 w-5 text-blue-500" />
                            Treinamentos em Andamento
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {inProgress.length > 0 ? (
                            inProgress.map(enrollment => (
                                <div key={enrollment.id} className="p-4 rounded-xl border border-slate-50 bg-slate-50/30 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-slate-900 line-clamp-1">{enrollment.courseName}</h4>
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none text-[10px]">
                                            {enrollment.status}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                                            <span>Progresso</span>
                                            <span>{Math.round(enrollment.progressPercentage)}%</span>
                                        </div>
                                        <Progress value={enrollment.progressPercentage} className="h-2" />
                                    </div>
                                    <div className="flex items-center gap-4 text-[11px] text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            Expira em: {enrollment.dueDate ? new Date(enrollment.dueDate).toLocaleDateString() : 'Sem prazo'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center text-slate-400">
                                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                <p>Nenhum treinamento em andamento</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Completed Enrollments */}
                <Card className="border-none shadow-premium">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Award className="h-5 w-5 text-green-500" />
                            Histórico de Conclusão
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {completed.length > 0 ? (
                            completed.map(enrollment => (
                                <div key={enrollment.id} className="p-4 rounded-xl border border-slate-50 bg-white shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 leading-tight line-clamp-1">{enrollment.courseName}</h4>
                                            <p className="text-xs text-slate-400">Concluído em {enrollment.completedAt ? new Date(enrollment.completedAt).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                    </div>
                                    {enrollment.certificateId && (
                                        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none cursor-pointer">
                                            Certificado
                                        </Badge>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center text-slate-400">
                                <Award className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                <p>Nenhum certificado emitido</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
