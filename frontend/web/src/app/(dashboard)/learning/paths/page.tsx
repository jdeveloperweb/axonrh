'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    GraduationCap,
    Map,
    ChevronRight,
    Clock,
    Target,
    Sparkles,
    Search,
    Lock
} from 'lucide-react';
import Image from "next/image";
import Link from 'next/link';
import { learningPathsApi, LearningPath } from '@/lib/api/learning';

export default function LearningPaths() {
    const [paths, setPaths] = useState<LearningPath[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await learningPathsApi.listPublished();
                setPaths(res.data || []);
            } catch (error) {
                console.error('Erro ao buscar trilhas:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-12 pb-20">
            <div className="relative rounded-3xl overflow-hidden min-h-[400px] flex items-center">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-transparent z-10" />
                    <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
                    <Image
                        src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80"
                        alt="Background"
                        fill
                        className="object-cover opacity-30"
                    />
                </div>

                <div className="relative z-20 max-w-2xl px-12 space-y-6">
                    <Badge className="bg-primary/20 hover:bg-primary/30 text-primary border-none font-bold uppercase tracking-[0.2em] px-4 py-1.5">Trilhas de Desenvolvimento</Badge>
                    <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none text-foreground">A jornada para sua <span className="text-primary italic">próxima promoção</span> começa aqui.</h1>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Nossas trilhas de aprendizagem são conjuntos curados de cursos desenhados para levar você do iniciante ao especialista em habilidades específicas requisitadas pela empresa.
                    </p>
                    <div className="flex gap-4 pt-4">
                        <Button className="h-14 px-8 rounded-2xl font-black text-lg shadow-2xl shadow-primary/20 transition-all hover:scale-105">Explorar Agora</Button>
                        <Button variant="ghost" className="h-14 px-8 rounded-2xl font-bold text-lg gap-2">Saiba como funciona <ChevronRight className="h-5 w-5" /></Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 px-2">
                {/* Left Column - Featured/Pinned Path */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <Sparkles className="h-7 w-7 text-amber-500" />
                            Trilhas em Destaque
                        </h2>
                        <div className="flex gap-2">
                            <Button variant="outline" className="rounded-xl h-10 w-10 p-0"><ChevronRight className="h-5 w-5 rotate-180" /></Button>
                            <Button variant="outline" className="rounded-xl h-10 w-10 p-0"><ChevronRight className="h-5 w-5" /></Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="h-[400px] w-full bg-muted rounded-3xl animate-pulse" />
                    ) : paths.length === 0 ? (
                        <Card className="border-dashed h-[400px] flex flex-col items-center justify-center text-center space-y-4 rounded-3xl">
                            <Map className="h-16 w-16 text-muted-foreground/20" />
                            <div>
                                <h3 className="text-xl font-bold">Nenhuma trilha publicada</h3>
                                <p className="text-muted-foreground">Estamos desenhando novos caminhos para você. Volte em breve!</p>
                            </div>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {paths.map(path => (
                                <PathLargeCard key={path.id} path={path} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column - Stats/Recommendations */}
                <aside className="space-y-8">
                    <Card className="rounded-3xl border-primary/10 shadow-xl overflow-hidden">
                        <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <Target className="h-5 w-5 text-primary" />
                                Seu Objetivo
                            </CardTitle>
                            <CardDescription className="text-primary/70 font-medium">Faltam 3 competências para sua promoção.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-4">
                                {['Liderança Estratégica', 'Gestão de Projetos', 'Comunicação Assertiva'].map(skill => (
                                    <div key={skill} className="flex items-center justify-between">
                                        <span className="text-sm font-bold">{skill}</span>
                                        <Badge variant="secondary" className="text-[10px] font-black uppercase">Pendente</Badge>
                                    </div>
                                ))}
                            </div>
                            <Button className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/10">Ver Plano de Carreira</Button>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground px-2">Sugestões Baseadas no seu Perfil</h3>
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="group p-4 rounded-2xl border bg-card hover:border-primary/50 transition-all cursor-pointer flex gap-4 items-center">
                                    <div className="h-12 w-12 rounded-xl bg-muted group-hover:bg-primary/10 transition-colors flex items-center justify-center">
                                        <Lock className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold leading-tight">Mestre da Eficiência Operacional</p>
                                        <p className="text-[10px] font-medium text-muted-foreground uppercase mt-1">4 Cursos • 12 Semanas</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

function PathLargeCard({ path }: { path: LearningPath }) {
    return (
        <div className="group relative overflow-hidden rounded-[2.5rem] bg-card border hover:border-primary/30 transition-all duration-500 shadow-sm hover:shadow-2xl">
            <div className="flex flex-col md:flex-row h-full">
                <div className="relative w-full md:w-80 h-64 md:h-auto overflow-hidden shrink-0">
                    {path.thumbnailUrl ? (
                        <Image src={path.thumbnailUrl} alt={path.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center p-12">
                            <GraduationCap className="w-full h-full text-white/10" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 flex flex-col justify-end">
                        <Badge className="w-fit mb-2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-transparent text-[10px] tracking-widest font-black uppercase">
                            {path.isMandatory ? 'Mandatário' : 'Eletivo'}
                        </Badge>
                    </div>
                </div>

                <div className="flex-1 p-8 md:p-12 space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-primary text-xs font-black uppercase tracking-[0.2em] mb-2">
                            <Map className="h-4 w-4" /> TRILHA DE CARREIRA
                        </div>
                        <h3 className="text-3xl font-black leading-tight group-hover:text-primary transition-colors">{path.title}</h3>
                        <p className="text-muted-foreground line-clamp-2 max-w-xl">{path.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-6 pt-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Conteúdo</span>
                            <span className="font-black text-lg">{path.courses?.length || 0} Cursos</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Duração Estimada</span>
                            <span className="font-black text-lg">{path.durationHours || 24}h Total</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Certificações</span>
                            <span className="font-black text-lg">Múltiplas</span>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-between items-center">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-10 w-10 rounded-full border-4 border-card bg-muted flex items-center justify-center overflow-hidden">
                                    <Image src={`https://i.pravatar.cc/100?u=${i}`} alt="Avatar" width={40} height={40} />
                                </div>
                            ))}
                            <div className="h-10 w-10 rounded-full border-4 border-card bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">
                                +12
                            </div>
                            <span className="ml-6 flex items-center text-xs font-bold text-muted-foreground">alunos cursando</span>
                        </div>
                        <Button className="h-14 px-8 rounded-2xl font-black text-lg shadow-xl shadow-primary/10">Inscrever-se na Trilha</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
