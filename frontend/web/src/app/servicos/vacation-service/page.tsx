'use client';

import React from 'react';
import {
    Palmtree,
    CalendarDays,
    Stethoscope,
    Clock8,
    Plane,
    UserCheck2,
    FileText,
    AlertCircle,
    CalendarCheck2,
    ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function VacationLanding() {
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            {/* Hero Section */}
            <section className="relative py-24 bg-gradient-to-br from-orange-50 via-white to-white overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-orange-500/5 skew-x-12 translate-x-1/4" />

                <div className="container mx-auto px-6 relative">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-bold mb-6">
                            <Palmtree className="w-4 h-4" />
                            <span>Wellbeing Module: Vacation & Leave</span>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
                            Gestão de Descanso com <br />
                            <span className="text-orange-600">Equilíbrio e Controle</span>
                        </h1>

                        <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                            Simplifique o agendamento de férias e o controle de afastamentos. Garanta que sua equipe esteja sempre renovada e em conformidade.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <button className="px-8 py-4 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all flex items-center gap-2">
                                Documentação do Módulo <ChevronRight className="w-4 h-4" />
                            </button>
                            <button className="px-8 py-4 border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                                Políticas de Férias
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Grid */}
            <section className="py-24">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<CalendarDays className="w-6 h-6" />}
                            title="Agendamento Intuitivo"
                            desc="Interface visual para solicitação de férias com visualização imediata de saldos e períodos aquisitivos."
                        />
                        <FeatureCard
                            icon={<Stethoscope className="w-6 h-6" />}
                            title="Gestão de Atestados"
                            desc="Módulo completo para registro de licenças médicas com suporte a CID e upload de documentos."
                        />
                        <FeatureCard
                            icon={<Clock8 className="w-6 h-6" />}
                            title="Alertas de Vencimento"
                            desc="Notificações automáticas para RH e Gestores sobre férias próximas ao vencimento (dobra)."
                        />
                        <FeatureCard
                            icon={<Plane className="w-6 h-6" />}
                            title="Pequenos Afastamentos"
                            desc="Controle simples para licenças gala, nojo, paternidade e outras ausências legais."
                        />
                        <FeatureCard
                            icon={<UserCheck2 className="w-6 h-6" />}
                            title="Fluxo de Aprovação"
                            desc="Processo multinível de aprovação entre gestor imediato e departamento de RH."
                        />
                        <FeatureCard
                            icon={<CalendarCheck2 className="w-6 h-6" />}
                            title="Mapa de Disponibilidade"
                            desc="Visão de calendário para evitar conflitos de férias dentro do mesmo time."
                        />
                    </div>
                </div>
            </section>

            {/* Info Highlight */}
            <section className="py-20 bg-slate-50 border-y border-slate-100">
                <div className="container mx-auto px-6">
                    <div className="bg-[var(--color-primary)] rounded-3xl p-12 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-3xl font-bold mb-6">Total Conformidade com a CLT</h2>
                                <p className="text-white/80 leading-relaxed">
                                    O AxonRH aplica automaticamente as regras de fracionamento de férias, abono pecuniário e períodos de descanso mínimo exigidos por lei, reduzindo riscos de passivos trabalhistas.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                                    <p className="font-bold text-2xl">100%</p>
                                    <p className="text-xs uppercase tracking-wider">Digital</p>
                                </div>
                                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                                    <p className="font-bold text-2xl">Sinc</p>
                                    <p className="text-xs uppercase tracking-wider">Folha</p>
                                </div>
                                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                                    <p className="font-bold text-2xl">Zero</p>
                                    <p className="text-xs uppercase tracking-wider">Papel</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="py-12 text-center text-slate-400 text-sm">
                © 2026 AxonRH Vacation & Wellbeing. Rest is part of performance.
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <Card className="hover:shadow-xl transition-all duration-300 border-slate-100 group">
            <CardContent className="p-8">
                <div className="mb-6 p-3 bg-orange-50 rounded-xl w-fit text-orange-600 group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </CardContent>
        </Card>
    );
}
