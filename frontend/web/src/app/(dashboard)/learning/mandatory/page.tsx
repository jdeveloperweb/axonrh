'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    BookOpen,
    ChevronRight,
    ShieldAlert
} from 'lucide-react';
import Image from "next/image";
import Link from 'next/link';
import { coursesApi, Course } from '@/lib/api/learning';

export default function MandatoryTrainings() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await coursesApi.listMandatory();
                setCourses(res.data || []);
            } catch (error) {
                console.error('Erro ao buscar treinamentos obrigatorios:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="bg-destructive/5 border border-destructive/20 p-8 rounded-3xl flex flex-col md:flex-row items-center gap-6">
                <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
                    <ShieldAlert className="h-10 w-10" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-3xl font-black tracking-tight text-destructive">Treinamentos Obrigatórios</h1>
                    <p className="text-muted-foreground font-medium">Estes cursos são essenciais para sua conformidade e segurança na empresa. Certifique-se de concluí-los dentro do prazo.</p>
                </div>
                <Badge variant="destructive" className="px-6 py-2 rounded-xl font-black text-sm uppercase tracking-widest">{courses.length} PENDENTES</Badge>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-64 bg-card border rounded-3xl animate-pulse" />)}
                </div>
            ) : courses.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-3xl border border-dashed flex flex-col items-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500/20 mb-4" />
                    <h3 className="text-xl font-bold">Tudo em dia!</h3>
                    <p className="text-muted-foreground mt-2">Você não possui treinamentos obrigatórios pendentes no momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {courses.map((course) => (
                        <Link key={course.id} href={`/learning/course/${course.id}`}>
                            <Card className="group h-full flex flex-col overflow-hidden hover:shadow-2xl hover:border-destructive/30 transition-all duration-300 border-destructive/10">
                                <div className="relative h-40 w-full overflow-hidden">
                                    {course.thumbnailUrl ? (
                                        <Image src={course.thumbnailUrl} alt={course.title} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-destructive/10 flex items-center justify-center">
                                            <BookOpen className="h-12 w-12 text-destructive/30" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-destructive">
                                        <AlertCircle className="h-5 w-5" />
                                    </div>
                                </div>
                                <CardHeader className="p-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/5 text-[10px] font-black tracking-widest leading-none">URGENTE</Badge>
                                        <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> 15 DIAS RESTANTES
                                        </span>
                                    </div>
                                    <CardTitle className="text-xl font-black line-clamp-2 leading-tight group-hover:text-destructive transition-colors">{course.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 pt-0 mt-auto">
                                    <Button className="w-full bg-destructive/90 hover:bg-destructive text-white font-bold rounded-xl h-12 shadow-lg shadow-destructive/20">Iniciar Imediatamente</Button>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
