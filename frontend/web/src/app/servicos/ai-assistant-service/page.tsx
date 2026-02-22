'use client';

import React from 'react';
import {
    Bot,
    BrainCircuit,
    Search,
    Layers,
    MessageSquareText,
    FileSearch,
    BarChart3,
    Sparkles,
    ArrowRight,
    Cpu
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AiAssistantLanding() {
    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30">
            {/* Dynamic Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-orb-float-1" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-orb-float-2" />
            </div>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 container mx-auto px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8 animate-fade-in">
                        <Sparkles className="w-4 h-4" />
                        <span>Inteligência Artificial de Próxima Geração</span>
                    </div>

                    <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                        Axon <span className="text-blue-500">AI Assistant</span>
                    </h1>

                    <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Elimine tarefas manuais e repetitivas. Nosso assistente utiliza modelos avançados de linguagem para automatizar a leitura de documentos e o suporte ao colaborador.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4">
                        <button className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold shadow-2xl shadow-blue-600/20 transition-all flex items-center gap-2 group">
                            Explorar Capacidades <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl font-bold transition-all">
                            Ver Demo Técnica
                        </button>
                    </div>
                </div>
            </section>

            {/* Stats/Metrics */}
            <section className="py-20 border-y border-white/5 bg-white/[0.02]">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <StatItem label="Precisão de Extração" value="99.2%" />
                        <StatItem label="Tempo Economizado" value="~15h/mês" />
                        <StatItem label="Docs Processados" value="+50k" />
                        <StatItem label="SLA de Resposta" value="< 2s" />
                    </div>
                </div>
            </section>

            {/* Core Capabilities */}
            <section className="py-32">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row gap-16 items-center">
                        <div className="w-full md:w-1/2">
                            <h2 className="text-4xl font-bold mb-8 italic">
                                Cérebro <span className="text-blue-500">Cognitivo</span> do RH
                            </h2>

                            <div className="space-y-4">
                                <CapabilityCard
                                    icon={<FileSearch className="w-6 h-6" />}
                                    title="OCR Inteligente"
                                    desc="Extraia dados de RGs, CPFs e comprovantes de residência instantaneamente com validação cruzada automática."
                                />
                                <CapabilityCard
                                    icon={<BrainCircuit className="w-6 h-6" />}
                                    title="RAG Knowledge Base"
                                    desc="Carregue o manual do colaborador e deixe que a IA responda dúvidas complexas sobre políticas da empresa."
                                />
                                <CapabilityCard
                                    icon={<BarChart3 className="w-6 h-6" />}
                                    title="Análise de Consistência"
                                    desc="Pontuação de confiança para garantir que os dados digitados batem com os documentos enviados."
                                />
                            </div>
                        </div>

                        <div className="w-full md:w-1/2 relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-[80px] rounded-full" />
                            <div className="relative aspect-square rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-3xl p-8 flex items-center justify-center">
                                <Bot className="w-48 h-48 text-blue-500 animate-pulse" />

                                {/* Floating Tags */}
                                <div className="absolute top-10 left-10 p-3 bg-white/10 rounded-xl border border-white/20 text-xs font-mono animate-float">GPT-4o Integration</div>
                                <div className="absolute bottom-20 right-10 p-3 bg-white/10 rounded-xl border border-white/20 text-xs font-mono animate-float" style={{ animationDelay: '1s' }}>LangChain4j Core</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Connect Section */}
            <section className="py-32 bg-gradient-to-b from-transparent to-blue-950/20">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold mb-12">Integração Nativa</h2>
                    <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                        <span className="text-2xl font-bold font-mono">OpenAI</span>
                        <span className="text-2xl font-bold font-mono">Google Cloud</span>
                        <span className="text-2xl font-bold font-mono">Anthropic</span>
                        <span className="text-2xl font-bold font-mono">Mistral</span>
                    </div>
                </div>
            </section>

            <footer className="py-12 border-t border-white/5 text-center text-slate-500 text-sm">
                © 2026 AxonRH AI Division. Empowering Human Intelligence.
            </footer>
        </div>
    );
}

function StatItem({ label, value }: { label: string, value: string }) {
    return (
        <div className="text-center">
            <p className="text-3xl font-bold mb-1">{value}</p>
            <p className="text-xs text-slate-500 uppercase tracking-widest">{label}</p>
        </div>
    );
}

function CapabilityCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all cursor-default group">
            <div className="flex gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <div>
                    <h4 className="font-bold text-lg mb-1">{title}</h4>
                    <p className="text-sm text-slate-400">{desc}</p>
                </div>
            </div>
        </div>
    );
}
