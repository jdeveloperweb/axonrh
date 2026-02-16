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
        <div className="w-full space-y-10 pb-20 px-4 md:px-8 animate-in fade-in duration-700">
            <div className="bg-gradient-to-br from-rose-50 to-white border-2 border-rose-100 p-10 md:p-14 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-200/20 rounded-full blur-3xl -mr-32 -mt-32" />

                <div className="h-20 w-20 rounded-3xl bg-rose-500 flex items-center justify-center text-white shadow-xl shadow-rose-200 shrink-0 relative z-10">
                    <ShieldAlert className="h-10 w-10" />
                </div>

                <div className="flex-1 text-center md:text-left relative z-10 space-y-4">
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 uppercase">Ações Necessárias</h1>
                        <p className="text-xl font-bold text-rose-500 italic">Treinamentos Obrigatórios Pendentes</p>
                    </div>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl">
                        Estes conhecimentos são fundamentais para sua jornada.
                        A conclusão destas trilhas garante a conformidade e excelência operacional da sua equipe.
                    </p>
                </div>

                <div className="flex flex-col items-center gap-2 relative z-10">
                    <Badge variant="destructive" className="px-8 py-3 rounded-2xl font-black text-lg uppercase tracking-widest shadow-lg shadow-rose-200 border-none">
                        {courses.length} PENDENTES
                    </Badge>
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Atenção aos prazos</span>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-80 bg-white border-2 border-slate-50 rounded-[2.5rem] animate-pulse shadow-sm" />
                    ))}
                </div>
            ) : courses.length === 0 ? (
                <div className="text-center py-40 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center space-y-6">
                    <div className="h-24 w-24 bg-white rounded-full shadow-xl flex items-center justify-center text-green-500">
                        <CheckCircle2 className="h-12 w-12" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Tudo em conformidade!</h3>
                        <p className="text-slate-400 font-medium text-lg">Você não possui nenhum treinamento obrigatório pendente neste momento.</p>
                    </div>
                    <Link href="/learning/catalog">
                        <Button className="h-14 px-10 rounded-2xl font-black text-[11px] uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800">EXPLORAR OUTROS CURSOS</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                    {courses.map((course) => (
                        <Link key={course.id} href={`/learning/course/${course.id}`}>
                            <div className="group h-full flex flex-col bg-white border-2 border-slate-50 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:border-rose-200 transition-all duration-500 shadow-sm relative active:scale-[0.98]">
                                <div className="relative h-56 w-full overflow-hidden shrink-0">
                                    <div className="absolute inset-0 bg-rose-900/20 group-hover:bg-rose-900/10 transition-colors z-10" />
                                    {course.thumbnailUrl ? (
                                        <Image src={course.thumbnailUrl} alt={course.title} fill className="object-cover group-hover:scale-110 transition-all duration-700" />
                                    ) : (
                                        <div className="w-full h-full bg-rose-50 flex items-center justify-center">
                                            <BookOpen className="h-16 w-16 text-rose-200" />
                                        </div>
                                    )}
                                    <div className="absolute top-6 left-6 z-20">
                                        <Badge className="bg-rose-500 text-white border-none font-black text-[10px] px-4 py-1 rounded-lg uppercase tracking-widest shadow-xl">
                                            OBRIGATÓRIO
                                        </Badge>
                                    </div>
                                    <div className="absolute bottom-6 right-6 z-20 h-10 w-10 rounded-xl bg-white/90 backdrop-blur-sm shadow-xl flex items-center justify-center text-rose-600 border border-white/50">
                                        <AlertCircle className="h-5 w-5" />
                                    </div>
                                </div>

                                <div className="p-8 flex flex-col flex-1 space-y-6">
                                    <div className="space-y-4 flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{course.categoryName || 'GERAL'}</span>
                                            <div className="flex items-center gap-1.5 text-rose-500 text-[10px] font-black uppercase tracking-widest">
                                                <Clock className="h-3.5 w-3.5" />
                                                Próximo ao Vencimento
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 leading-[1.2] uppercase tracking-tight line-clamp-2 group-hover:text-rose-600 transition-colors">
                                            {course.title}
                                        </h3>
                                    </div>

                                    <Button className="w-full bg-slate-900 hover:bg-rose-600 text-white font-black text-[11px] uppercase tracking-[0.2em] h-16 rounded-[1.5rem] shadow-xl shadow-slate-100 group-hover:shadow-rose-100 transition-all">
                                        Iniciar Imediatamente
                                    </Button>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>

    );
}
