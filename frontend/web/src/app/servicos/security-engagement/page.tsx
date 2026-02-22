'use client';

import React from 'react';
import {
    ShieldCheck,
    Lock,
    Bell,
    Mail,
    Smartphone,
    Key,
    Eye,
    CheckCircle,
    Zap,
    ArrowRight,
    ShieldAlert,
    ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function SecurityLanding() {
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            {/* Hero Section */}
            <section className="relative py-24 bg-slate-950 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent)]" />

                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-bold mb-6 border border-blue-500/20">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Security & Engagement Core</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
                            Confiança e <br />
                            <span className="text-blue-500">Conectividade</span>
                        </h1>

                        <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl">
                            A espinha dorsal do AxonRH. Segurança de nível bancário unida a um motor de comunicação inteligente que mantém sua equipe sempre informada.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <button className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-2">
                                Conferir Arquitetura <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Security Pillars */}
            <section className="py-24">
                <div className="container mx-auto px-6">
                    <div className="mb-16 text-center max-w-2xl mx-auto">
                        <h2 className="text-3xl font-bold mb-4 italic">Segurança Sem Fricção</h2>
                        <p className="text-slate-500">Protegemos os dados mais sensíveis da sua empresa com as tecnologias mais modernas de criptografia e controle de acesso.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <SecurityCard
                            icon={<Lock className="w-8 h-8" />}
                            title="Identity Hub"
                            desc="Autenticação JWT segura com suporte a multi-fator e controle de sessão inteligente."
                            color="text-blue-600"
                        />
                        <SecurityCard
                            icon={<Key className="w-8 h-8" />}
                            title="Acesso Granular"
                            desc="Defina exatamente quem pode ver ou editar cada campo, respeitando a LGPD e políticas internas."
                            color="text-indigo-600"
                        />
                        <SecurityCard
                            icon={<Eye className="w-8 h-8" />}
                            title="Auditoria Total"
                            desc="Logs completos de cada ação sensível realizada no sistema para compliance e histórico."
                            color="text-slate-600"
                        />
                    </div>
                </div>
            </section>

            {/* Notification Showcase */}
            <section className="py-24 bg-slate-50 border-y border-slate-100">
                <div className="container mx-auto px-6 text-center">
                    <div className="inline-flex p-4 bg-white rounded-3xl shadow-lg mb-10 text-blue-600">
                        <Bell className="w-10 h-10" />
                    </div>
                    <h2 className="text-4xl font-bold mb-6 italic">Comunicação Inteligente</h2>
                    <p className="text-slate-500 text-lg max-w-3xl mx-auto mb-16 leading-relaxed">
                        Esqueça o ruído. Nosso sistema de notificações envia apenas o que é relevante, no canal que o colaborador prefere, aumentando o engajamento e a produtividade.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div>
                            <Mail className="w-12 h-12 text-slate-400 mx-auto mb-6" />
                            <h4 className="font-bold text-xl mb-3">E-mails Dinâmicos</h4>
                            <p className="text-slate-500 text-sm">Templates profissionais para admissão, folha e comunicados internos.</p>
                        </div>
                        <div>
                            <Smartphone className="w-12 h-12 text-slate-400 mx-auto mb-6" />
                            <h4 className="font-bold text-xl mb-3">Push & In-App</h4>
                            <p className="text-slate-500 text-sm">Alertas em tempo real sobre feedback, metas e aprovações pendentes.</p>
                        </div>
                        <div>
                            <Zap className="w-12 h-12 text-slate-400 mx-auto mb-6" />
                            <h4 className="font-bold text-xl mb-3">Event-Driven</h4>
                            <p className="text-slate-500 text-sm">Notificações disparadas automaticamente por eventos do sistema via Kafka.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Compliance CTA */}
            <section className="py-24">
                <div className="container mx-auto px-6">
                    <div className="bg-slate-900 rounded-3xl p-12 text-white flex flex-col md:flex-row justify-between items-center gap-10">
                        <div>
                            <div className="flex items-center gap-2 text-blue-400 font-bold mb-4">
                                <ShieldAlert className="w-5 h-5" />
                                <span>Pronto para LGPD</span>
                            </div>
                            <h3 className="text-3xl font-bold mb-4">Arquitetura de Segurança Resiliente</h3>
                            <p className="text-slate-400 max-w-xl leading-relaxed">Nossa infraestrutura foi desenhada para suportar milhares de acessos simultâneos mantendo a integridade e privacidade total dos dados.</p>
                        </div>
                        <button className="px-10 py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black transition-all flex items-center gap-2 group whitespace-nowrap">
                            Ver Whitepaper de Segurança <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </section>

            <footer className="py-12 border-t border-slate-100 text-center text-slate-400 text-sm">
                © 2026 AxonRH Infrastructure & Trust. Safety by design.
            </footer>
        </div>
    );
}

function SecurityCard({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) {
    return (
        <Card className="border-none shadow-none hover:bg-white hover:shadow-xl transition-all duration-300 p-8 group text-center">
            <CardContent className="p-0">
                <div className={`mb-6 p-4 bg-slate-50 rounded-full w-fit mx-auto group-hover:scale-110 transition-transform ${color}`}>
                    {icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                <div className="mt-6 flex items-center justify-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver Protocolos <ArrowRight className="w-3 h-3" />
                </div>
            </CardContent>
        </Card>
    );
}
