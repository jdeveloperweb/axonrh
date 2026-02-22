'use client';

import React from 'react';
import {
    GraduationCap,
    BookOpenCheck,
    Map,
    Award,
    PlayCircle,
    Users,
    Layers,
    ArrowRight,
    Library,
    Star,
    ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function LearningLanding() {
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            {/* Hero Section */}
            <section className="relative py-24 bg-gradient-to-br from-indigo-50 via-white to-white overflow-hidden">
                <div className="absolute top-0 right-0 w-1/4 h-full bg-indigo-600/5 skew-x-12 translate-x-1/4" />

                <div className="container mx-auto px-6 relative">
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold mb-6">
                            <GraduationCap className="w-4 h-4" />
                            <span>Upskilling: Axon Learning Hub</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
                            Cultura de <br />
                            <span className="text-indigo-600">Aprendizado Contínuo</span>
                        </h1>

                        <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl">
                            Uma experiência de aprendizado moderna e intuitiva. Capacite sua equipe com cursos, trilhas de conhecimento e certificações integradas ao plano de carreira.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <button className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-200 hover:scale-105 transition-all flex items-center gap-2">
                                Conhecer a Plataforma <ChevronRight className="w-5 h-5" />
                            </button>
                            <button className="px-10 py-5 border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-colors">
                                Ver Catálogo
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Learning Pillars */}
            <section className="py-24">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <LearningCard
                            icon={<Map className="w-8 h-8" />}
                            title="Trilhas de Aprendizagem"
                            desc="Combine múltiplos cursos em uma jornada sequencial para formar especialistas de forma estruturada."
                            color="text-indigo-600"
                        />
                        <LearningCard
                            icon={<Library className="w-8 h-8" />}
                            title="Biblioteca de Conteúdo"
                            desc="Acesso ilimitado a vídeos, artigos e materiais técnicos organizados por categorias dinâmicas."
                            color="text-blue-600"
                        />
                        <LearningCard
                            icon={<Award className="w-8 h-8" />}
                            title="Certificação Própria"
                            desc="Emita certificados personalizados com a marca da sua empresa e validação digital automática."
                            color="text-emerald-600"
                        />
                    </div>
                </div>
            </section>

            {/* Experience Showcase */}
            <section className="py-24 bg-slate-900 text-white">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-indigo-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            <div className="relative aspect-video bg-slate-800 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <PlayCircle className="w-20 h-20 text-white/20 group-hover:text-indigo-400 transition-colors" />
                                </div>
                                <div className="absolute bottom-6 left-6 right-6">
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full w-2/3 bg-indigo-500" />
                                    </div>
                                    <p className="mt-3 text-xs font-mono text-white/40 uppercase tracking-widest">User Progress Hub: 68% Completed</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-4xl font-bold mb-8">Experiência de <span className="text-indigo-400">Usuário Imersiva</span></h2>
                            <ul className="space-y-8">
                                <li className="flex gap-4">
                                    <div className="mt-1 p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                        <BookOpenCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-1">Micro-Learning</h4>
                                        <p className="text-slate-400 text-sm">Lições curtas e focadas para facilitar o aprendizado diário sem sobrecarga.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="mt-1 p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                        <Layers className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-1">Multi-Formato</h4>
                                        <p className="text-slate-400 text-sm">Suporte nativo para vídeos, PDFs, links externos e avaliações de conhecimento.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="mt-1 p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                        <Star className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-1">Engajamento & Gamificação</h4>
                                        <p className="text-slate-400 text-sm">Acompanhe rankings, badges e conquistas para incentivar a cultura de estudos.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof / Stats */}
            <section className="py-24 border-b border-slate-100">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
                        <div>
                            <h3 className="text-3xl font-bold mb-2">+12.000</h3>
                            <p className="text-slate-500">Certificados emitidos este ano</p>
                        </div>
                        <div className="h-12 w-px bg-slate-200 hidden md:block" />
                        <div>
                            <h3 className="text-3xl font-bold mb-2">94%</h3>
                            <p className="text-slate-500">Taxa de retenção de conhecimento</p>
                        </div>
                        <div className="h-12 w-px bg-slate-200 hidden md:block" />
                        <div>
                            <h3 className="text-3xl font-bold mb-2">240+</h3>
                            <p className="text-slate-500">Horas de conteúdo técnico disponível</p>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="py-12 text-center text-slate-400 text-sm">
                © 2026 AxonRH Learning Division. Knowledge is the ultimate leverage.
            </footer>
        </div>
    );
}

function LearningCard({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) {
    return (
        <Card className="p-10 border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
            <CardContent className="p-0">
                <div className={`mb-8 p-4 bg-slate-50 rounded-2xl w-fit group-hover:scale-110 transition-transform ${color}`}>
                    {icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{title}</h3>
                <p className="text-slate-500 leading-relaxed">{desc}</p>
                <div className="mt-8 flex items-center text-indigo-600 font-bold text-sm gap-2">
                    Ver Detalhes <ArrowRight className="w-4 h-4" />
                </div>
            </CardContent>
        </Card>
    );
}
