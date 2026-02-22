'use client';

import React from 'react';
import {
    Clock,
    MapPin,
    Calendar,
    History,
    CheckCircle,
    AlertCircle,
    Smartphone,
    ShieldCheck,
    ChevronRight,
    TrendingUp,
    ArrowRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function TimesheetLanding() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Hero Section */}
            <section className="relative py-24 bg-white overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-orange-500/5 skew-x-12 translate-x-1/4" />

                <div className="container mx-auto px-6 relative">
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-bold mb-6">
                            <Clock className="w-4 h-4" />
                            <span>Time Tracking: Axon Journey</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
                            Gestão de Jornada <br />
                            <span className="text-orange-600">Ágil e Segura</span>
                        </h1>

                        <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl">
                            Elimine erros de fechamento e processos manuais. Controle de ponto multicanal com geofencing, banco de horas automático e conformidade jurídica total (Portaria 671).
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <button className="px-10 py-5 bg-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-200 hover:scale-105 transition-all flex items-center gap-2">
                                Experimentar o Ponto Digital <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Features */}
            <section className="py-24">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FeatureCard
                            icon={<MapPin className="w-8 h-8" />}
                            title="Geolocalização"
                            desc="Certifique-se de que as marcações ocorram nos locais permitidos com perímetros virtuais."
                            color="text-orange-600"
                        />
                        <FeatureCard
                            icon={<TrendingUp className="w-8 h-8" />}
                            title="Banco de Horas"
                            desc="Cálculo automático de saldo positivo e negativo em tempo real para gestor e colaborador."
                            color="text-blue-600"
                        />
                        <FeatureCard
                            icon={<Calendar className="w-8 h-8" />}
                            title="Escalas Flexíveis"
                            desc="Crie jornadas 5x2, 6x1, 12x36 ou horários totalmente customizáveis e trocas de turno."
                            color="text-emerald-600"
                        />
                        <FeatureCard
                            icon={<Smartphone className="w-8 h-8" />}
                            title="Ponto Mobile"
                            desc="Experiência fluida para marcação via App, Web ou Totem com reconhecimento facial opcional."
                            color="text-slate-600"
                        />
                    </div>
                </div>
            </section>

            {/* Accuracy Showcase */}
            <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row gap-20 items-center">
                        <div className="flex-1">
                            <h2 className="text-4xl font-bold mb-8">Fechamento de Folha em <span className="text-orange-500">Minutos</span>, não Dias.</h2>
                            <div className="space-y-6">
                                <AccuracyItem
                                    title="Consolidação Automática"
                                    desc="Integração nativa com o módulo de folha, enviando atrasos e extras sem CSVs."
                                />
                                <AccuracyItem
                                    title="Justificativas Inteligentes"
                                    desc="Anexo de atestados e abonos diretamente pelo colaborador com fluxo de aprovação."
                                />
                                <AccuracyItem
                                    title="Seguridade Jurídica"
                                    desc="Backup em nuvem e assinatura digital de espelhos de ponto conforme a lei."
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl">
                                {/* Visual Representation of Time Schedule */}
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-orange-500" />
                                                <span className="text-sm">Registro de Entrada</span>
                                            </div>
                                            <span className="font-mono text-orange-400">08:02:45</span>
                                        </div>
                                    ))}
                                    <div className="pt-4 border-t border-white/10 flex justify-between">
                                        <span className="text-xs uppercase text-slate-500">Saldo do Dia</span>
                                        <span className="text-sm font-black text-emerald-400">+00:15:00</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 text-center">
                <div className="container mx-auto px-6">
                    <div className="max-w-3xl mx-auto p-12 bg-orange-50 rounded-[3rem] border border-orange-100">
                        <h2 className="text-3xl font-bold mb-6 italic">Controle total do tempo, foco total no talento.</h2>
                        <button className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black hover:scale-105 transition-all flex items-center gap-2 mx-auto">
                            Ver Planos de Ponto Digital <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </section>

            <footer className="py-12 text-center text-slate-400 text-sm">
                © 2026 AxonRH Journey & Time. Precision in every second.
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) {
    return (
        <Card className="p-8 border-slate-100 hover:shadow-xl transition-all duration-300 group">
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

function AccuracyItem({ title, desc }: { title: string, desc: string }) {
    return (
        <div className="flex gap-4">
            <div className="p-2 bg-orange-500/10 rounded-lg h-fit">
                <CheckCircle className="w-5 h-5 text-orange-500" />
            </div>
            <div>
                <h4 className="font-bold text-lg mb-1">{title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}
