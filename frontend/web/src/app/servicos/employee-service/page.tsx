'use client';

import React from 'react';
import {
    Users,
    UserPlus,
    FileText,
    Target,
    Heart,
    ShieldCheck,
    Zap,
    ChevronRight,
    Database,
    Search,
    CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function EmployeeServiceLanding() {
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            {/* Hero Section */}
            <section className="relative py-20 overflow-hidden bg-gradient-to-br from-slate-50 to-white">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-[var(--color-primary)]/5 skew-x-12 transform translate-x-1/4 -z-10" />

                <div className="container mx-auto px-6 relative">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold mb-6 animate-fade-in">
                            <Zap className="w-4 h-4" />
                            <span>Core Module: Employee Service</span>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                            O Coração da sua <br />
                            <span className="text-[var(--color-primary)]">Gestão de Talentos</span>
                        </h1>

                        <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                            O AxonRH Employee Service centraliza todo o ciclo de vida do colaborador, desde a primeira assinatura digital até a gestão estratégica de cargos e salários.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <button className="px-8 py-4 bg-[var(--color-primary)] text-white rounded-xl font-bold shadow-lg shadow-[var(--color-primary)]/30 hover:scale-105 transition-transform flex items-center gap-2">
                                Explorar Documentação <ChevronRight className="w-4 h-4" />
                            </button>
                            <button className="px-8 py-4 border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                                Agendar Demo
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Value Pillars */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold mb-4">Eficiência que Impulsiona Pessoas</h2>
                        <p className="text-slate-500 italic">Transforme dados administrativos em inteligência estratégica para o seu RH.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <ValueCard
                            icon={<UserPlus className="w-8 h-8 text-blue-500" />}
                            title="Admissão Digital"
                            description="Reduza em até 80% o tempo estratégico de contratação com fluxos totalmente digitais de coleta de documentos e assinatura de contratos."
                        />
                        <ValueCard
                            icon={<Database className="w-8 h-8 text-emerald-500" />}
                            title="Single Source of Truth"
                            description="Uma única fonte de verdade para todos os dados dos colaboradores, integrando perfeitamente com folha, benefícios e performance."
                        />
                        <ValueCard
                            icon={<ShieldCheck className="w-8 h-8 text-purple-500" />}
                            title="Compliance & Segurança"
                            description="Histórico completo de alterações, gestão de documentos sensíveis e segurança de nível enterprise para seus dados de RH."
                        />
                    </div>
                </div>
            </section>

            {/* Feature Deep Dive */}
            <section className="py-24 bg-slate-50">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-tr from-[var(--color-primary)]/20 to-transparent blur-2xl rounded-3xl" />
                            <div className="relative bg-white p-8 rounded-3xl shadow-2xl border border-slate-100">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                        <CheckCircle2 className="text-blue-600 w-6 h-6" />
                                        <div>
                                            <p className="font-bold text-slate-800">Contratos Inteligentes</p>
                                            <p className="text-xs text-slate-500">Criação automatizada baseada em templates</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                        <CheckCircle2 className="text-emerald-600 w-6 h-6" />
                                        <div>
                                            <p className="font-bold text-slate-800">OCR Hub</p>
                                            <p className="text-xs text-slate-500">Extração de dados de documentos via IA</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                                        <CheckCircle2 className="text-purple-600 w-6 h-6" />
                                        <div>
                                            <p className="font-bold text-slate-800">Multi-Empresas</p>
                                            <p className="text-xs text-slate-500">Gestão centralizada de múltiplos CNPJs</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-4xl font-bold mb-6">Funcionalidades de <span className="text-[var(--color-primary)]">Classe Mundial</span></h2>
                            <ul className="space-y-6">
                                <FeatureItem
                                    title="Gestão de Organograma"
                                    desc="Estruture Departamentos, Centros de Custo e Cargos de forma visual e intuitiva."
                                />
                                <FeatureItem
                                    title="Banco de Talentos & Vagas"
                                    desc="Publique vagas internas e gerencie candidatos com triagem inteligente."
                                />
                                <FeatureItem
                                    title="Ecossistema de Vitalidade"
                                    desc="Acompanhe o bem-estar da sua equipe através de ferramentas integradas de engajamento."
                                />
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tech Breakdown Sneak Peek (Techno-Marketing) */}
            <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent" />

                <div className="container mx-auto px-6 relative">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="max-w-xl">
                            <h2 className="text-3xl font-bold mb-6">Tecnologia Robusta para Escala</h2>
                            <p className="text-slate-400 mb-8">
                                Desenvolvido com uma arquitetura de microsserviços resiliente, garantindo alta disponibilidade e performance mesmo em operações com milhares de colaboradores.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <p className="text-[var(--color-primary)] font-mono text-sm mb-1">Runtime</p>
                                    <p className="font-bold">Java 21 / Spring Boot</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <p className="text-[var(--color-primary)] font-mono text-sm mb-1">Persistence</p>
                                    <p className="font-bold">PostgreSQL</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <p className="text-[var(--color-primary)] font-mono text-sm mb-1">Messaging</p>
                                    <p className="font-bold">Apache Kafka</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <p className="text-[var(--color-primary)] font-mono text-sm mb-1">Integrations</p>
                                    <p className="font-bold">REST / gRPC</p>
                                </div>
                            </div>
                        </div>

                        <div className="hidden lg:block relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-primary)] to-blue-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                            <div className="relative p-12 bg-slate-800 rounded-full border border-white/10 animate-float">
                                <Users className="w-32 h-32 text-[var(--color-primary)]" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer / CTA */}
            <footer className="py-12 bg-white border-t border-slate-100 text-center">
                <p className="text-slate-400 text-sm">© 2026 AxonRH - Employee Service Documentation Layer</p>
            </footer>
        </div>
    );
}

function ValueCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <Card className="hover:shadow-xl transition-all duration-300 border-slate-100 overflow-hidden group">
            <CardContent className="p-8">
                <div className="mb-6 p-3 bg-slate-50 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
            </CardContent>
        </Card>
    );
}

function FeatureItem({ title, desc }: { title: string, desc: string }) {
    return (
        <li className="flex gap-4 p-4 rounded-2xl hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-slate-100">
            <div className="mt-1 h-6 w-6 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                <div className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
            </div>
            <div>
                <h4 className="font-bold text-slate-800">{title}</h4>
                <p className="text-sm text-slate-500">{desc}</p>
            </div>
        </li>
    );
}
