'use client';

import React from 'react';
import {
    Target,
    TrendingUp,
    Users2,
    Lightbulb,
    ShieldCheck,
    Compass,
    LayoutDashboard,
    Zap,
    Award,
    BarChart4,
    ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function PerformanceLanding() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Hero Section */}
            <section className="relative py-24 bg-white overflow-hidden">
                <div className="absolute top-0 right-0 w-1/4 h-full bg-red-500/5 -skew-x-12 translate-x-1/2" />

                <div className="container mx-auto px-6 relative">
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-bold mb-6">
                            <Zap className="w-4 h-4" />
                            <span>High Performance: Axon Performance</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
                            Transforme Potencial em <br />
                            <span className="text-red-600">Alta Performance</span>
                        </h1>

                        <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl">
                            Uma plataforma completa para gestão de metas, avaliações 360° e perfil comportamental. Construa uma cultura baseada em resultados e desenvolvimento contínuo.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <button className="px-10 py-5 bg-red-600 text-white rounded-2xl font-black shadow-xl shadow-red-200 hover:scale-105 transition-all flex items-center gap-2">
                                Conhecer o Módulo <ChevronRight className="w-5 h-5" />
                            </button>
                            <button className="px-10 py-5 border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-colors">
                                Ver Roadmap
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pillars of Performance */}
            <section className="py-24">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <PillarCard
                            icon={<Target className="w-8 h-8" />}
                            title="Metas & OKRs"
                            desc="Acompanhamento em tempo real de objetivos estratégicos e individuais."
                            color="text-red-600"
                        />
                        <PillarCard
                            icon={<Users2 className="w-8 h-8" />}
                            title="Avaliação 360°"
                            desc="Feedbacks estruturados de gestores, pares e liderados para visão total."
                            color="text-blue-600"
                        />
                        <PillarCard
                            icon={<Compass className="w-8 h-8" />}
                            title="Perfil DISC"
                            desc="Mapeamento comportamental científico para otimização de times."
                            color="text-amber-600"
                        />
                        <PillarCard
                            icon={<Lightbulb className="w-8 h-8" />}
                            title="PDI & Carreira"
                            desc="Planos de desenvolvimento individual guiados por dados de performance."
                            color="text-emerald-600"
                        />
                    </div>
                </div>
            </section>

            {/* The "Power-Up" Section - Integration with AI */}
            <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute right-0 top-0 w-1/2 h-full opacity-10">
                    <TrendingUp className="w-full h-full text-red-500" strokeWidth={0.5} />
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl font-bold mb-6">Decisões <span className="text-red-500">Data-Driven</span> para o seu Capital Humano</h2>
                            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                Utilize nossa Matriz Nine Box integrada para identificar sucessores, talentos de alto risco e oportunidades de desenvolvimento antes mesmo que os gaps apareçam.
                            </p>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                        <Award className="text-red-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Retenção de Top Talents</h4>
                                        <p className="text-sm text-slate-500">Algoritmos que alertam sobre queda de performance ou engajamento.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                        <BarChart4 className="text-red-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Dashboards Executivos</h4>
                                        <p className="text-sm text-slate-500">Visão macro da evolução cultural e de entregas da companhia.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-1 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="bg-slate-800 p-8 rounded-[22px]">
                                {/* Visual Representation of Nine Box */}
                                <div className="grid grid-cols-3 gap-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                                        <div key={i} className={`aspect-square rounded-lg border flex items-center justify-center text-[10px] font-bold ${i === 1 ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-slate-700/50 border-white/10 text-slate-500'}`}>
                                            {i === 1 ? 'Top Talent' : ''}
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-6 text-center text-xs font-mono text-slate-500 uppercase tracking-widest">Matriz Nine Box Integrada</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Simple CTA */}
            <section className="py-24 text-center">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold mb-8 italic">Não gerencie apenas pessoas, impulsione carreiras.</h2>
                    <button className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all">
                        Solicitar Trial do Módulo de Performance
                    </button>
                </div>
            </section>

            <footer className="py-12 border-t border-slate-100 text-center text-slate-400 text-sm">
                © 2026 AxonRH Performance & Growth. Elevating human standards.
            </footer>
        </div>
    );
}

function PillarCard({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) {
    return (
        <Card className="border-none shadow-none hover:bg-white hover:shadow-xl transition-all duration-300 p-8 group">
            <CardContent className="p-0">
                <div className={`mb-6 p-4 bg-slate-50 rounded-2xl w-fit group-hover:scale-110 transition-transform ${color}`}>
                    {icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </CardContent>
        </Card>
    );
}
