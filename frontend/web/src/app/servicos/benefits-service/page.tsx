'use client';

import React from 'react';
import {
    Heart,
    Stethoscope,
    Utensils,
    Car,
    Smile,
    ShieldCheck,
    PlusCircle,
    Gem,
    ArrowRight,
    Sparkles,
    PieChart,
    ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function BenefitsLanding() {
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            {/* Hero Section */}
            <section className="relative py-24 bg-gradient-to-br from-pink-50 via-white to-white overflow-hidden">
                <div className="absolute top-0 right-0 w-1/4 h-full bg-pink-500/5 -skew-x-12 translate-x-1/2" />

                <div className="container mx-auto px-6 relative">
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-sm font-bold mb-6">
                            <Heart className="w-4 h-4" />
                            <span>Wellness & Care: Axon Benefits Hub</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
                            Valorize quem <br />
                            <span className="text-pink-600">Move sua Empresa</span>
                        </h1>

                        <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl">
                            Gestão inteligente de planos de saúde, vales e benefícios flexíveis. Cuide dos seus colaboradores e de suas famílias com transparência e facilidade.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <button className="px-10 py-5 bg-pink-600 text-white rounded-2xl font-black shadow-xl shadow-pink-200 hover:scale-105 transition-all flex items-center gap-2">
                                Explorar Benefícios <ChevronRight className="w-5 h-5" />
                            </button>
                            <button className="px-10 py-5 border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-colors">
                                Ver Vídeo Demo
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Pillars */}
            <section className="py-24">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <BenefitPillar
                            icon={<Stethoscope className="w-8 h-8" />}
                            title="Saúde & Odonto"
                            desc="Gestão simplificada de apólices, upgrades e inclusão de dependentes."
                            color="text-red-500"
                        />
                        <BenefitPillar
                            icon={<Utensils className="w-8 h-8" />}
                            title="Alimentação & Refição"
                            desc="Controle preciso de cargas e descontos em folha conforme o PAT."
                            color="text-orange-500"
                        />
                        <BenefitPillar
                            icon={<Gem className="w-8 h-8" />}
                            title="Benefícios Flex"
                            desc="Liberdade para o colaborador escolher como usar seu saldo de benefícios."
                            color="text-purple-500"
                        />
                        <BenefitPillar
                            icon={<ShieldCheck className="w-8 h-8" />}
                            title="Seguros & Auxílios"
                            desc="Seguro de vida, auxílio creche e outras garantias para tranquilidade total."
                            color="text-blue-500"
                        />
                    </div>
                </div>
            </section>

            {/* Flexible Benefits Showcase */}
            <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 to-transparent pointer-events-none" />

                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row gap-20 items-center">
                        <div className="flex-1">
                            <div className="inline-flex p-3 bg-pink-500/10 rounded-2xl text-pink-400 mb-6">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <h2 className="text-4xl font-bold mb-8">O Futuro é <span className="text-pink-500">Flexível</span></h2>
                            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                                Cada colaborador tem necessidades únicas. Com o Axon Benefits, você permite que sua equipe distribua seus pontos entre diferentes categorias, aumentando o engajamento e a percepção de valor do pacote de benefícios.
                            </p>

                            <ul className="space-y-6">
                                <li className="flex items-center gap-4">
                                    <div className="h-2 w-2 rounded-full bg-pink-500" />
                                    <span className="font-bold">Saldo customizável por colaborador</span>
                                </li>
                                <li className="flex items-center gap-4">
                                    <div className="h-2 w-2 rounded-full bg-pink-500" />
                                    <span className="font-bold">Marketplace de parceiros integrado</span>
                                </li>
                                <li className="flex items-center gap-4">
                                    <div className="h-2 w-2 rounded-full bg-pink-500" />
                                    <span className="font-bold">Mudanças automáticas via App</span>
                                </li>
                            </ul>
                        </div>

                        <div className="flex-1 grid grid-cols-2 gap-4">
                            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6 flex flex-col items-center text-center">
                                <Smile className="w-10 h-10 text-pink-400 mb-4" />
                                <p className="font-bold text-lg">+35%</p>
                                <p className="text-xs text-slate-500 uppercase tracking-widest">Satisfação</p>
                            </Card>
                            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6 flex flex-col items-center text-center translate-y-8">
                                <Car className="w-10 h-10 text-pink-400 mb-4" />
                                <p className="font-bold text-lg">-20%</p>
                                <p className="text-xs text-slate-500 uppercase tracking-widest">Custo de Gestão</p>
                            </Card>
                            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6 flex flex-col items-center text-center">
                                <PieChart className="w-10 h-10 text-pink-400 mb-4" />
                                <p className="font-bold text-lg">Real-Time</p>
                                <p className="text-xs text-slate-500 uppercase tracking-widest">Dashboard</p>
                            </Card>
                            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6 flex flex-col items-center text-center translate-y-8">
                                <PlusCircle className="w-10 h-10 text-pink-400 mb-4" />
                                <p className="font-bold text-lg">Onboarding</p>
                                <p className="text-xs text-slate-500 uppercase tracking-widest">Simplificado</p>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 text-center">
                <div className="container mx-auto px-6">
                    <div className="max-w-2xl mx-auto">
                        <h2 className="text-4xl font-bold mb-6 italic">Retenha seus talentos com cuidado real.</h2>
                        <p className="text-slate-500 mb-10">Simplifique a operação do seu RH e ofereça uma experiência premium aos seus colaboradores.</p>
                        <button className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black hover:scale-105 transition-all">
                            Marcar Reunião Estratégica
                        </button>
                    </div>
                </div>
            </section>

            <footer className="py-12 border-t border-slate-100 text-center text-slate-400 text-sm">
                © 2026 AxonRH Benefits Care. Value what matters most.
            </footer>
        </div>
    );
}

function BenefitPillar({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) {
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
