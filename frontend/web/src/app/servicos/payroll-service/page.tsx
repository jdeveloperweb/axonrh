'use client';

import React from 'react';
import {
    Coins,
    Calculator,
    FileCheck,
    TrendingDown,
    ShieldAlert,
    Clock,
    GanttChartSquare,
    ArrowRight,
    FileDown,
    PieChart
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function PayrollLanding() {
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            {/* Hero Section */}
            <section className="relative py-24 bg-gradient-to-br from-emerald-50 via-white to-white overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-emerald-500/5 -skew-x-12 translate-x-1/4" />

                <div className="container mx-auto px-6 relative">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold mb-6">
                            <Coins className="w-4 h-4" />
                            <span>Financial Module: Axon Payroll</span>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
                            Precisão Máxima na sua <br />
                            <span className="text-emerald-600">Folha de Pagamento</span>
                        </h1>

                        <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                            Automação completa do processamento salarial com conformidade legal garantida e transparência total para o colaborador.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <button className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center gap-2">
                                Ver Documentação Técnica <ArrowRight className="w-4 h-4" />
                            </button>
                            <button className="px-8 py-4 border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                                Simular Cálculo
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Features Grid */}
            <section className="py-24">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <PayrollFeature
                            icon={<Calculator className="w-6 h-6" />}
                            title="Cálculo Automatizado"
                            desc="Motor de cálculo parametrizável que processa proventos, descontos e encargos em segundos."
                        />
                        <PayrollFeature
                            icon={<FileCheck className="w-6 h-6" />}
                            title="Compliance Legal"
                            desc="Atualizações automáticas de tabelas de IRRF, INSS e FGTS de acordo com a legislação vigente."
                        />
                        <PayrollFeature
                            icon={<FileDown className="w-6 h-6" />}
                            title="Holerites Digitais"
                            desc="Geração automática de PDFs e autoatendimento para o colaborador via portal e mobile."
                        />
                        <PayrollFeature
                            icon={<Clock className="w-6 h-6" />}
                            title="Integração de Ponto"
                            desc="Sincronização direta com o módulo de Timesheet para cálculo automático de horas extras e faltas."
                        />
                        <PayrollFeature
                            icon={<PieChart className="w-6 h-6" />}
                            title="Relatórios Estratégicos"
                            desc="Visão detalhada de custos por centro de custo, departamento e categoria salarial."
                        />
                        <PayrollFeature
                            icon={<ShieldAlert className="w-6 h-6" />}
                            title="Auditoria Completa"
                            desc="Log detalhado de todas as alterações e aprovações no fluxo da folha."
                        />
                    </div>
                </div>
            </section>

            {/* Visual Quote / Value Prop */}
            <section className="py-24 bg-slate-900 text-white">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl font-bold mb-8">"Reduzimos o tempo de fechamento da folha de 3 dias para 30 minutos."</h2>
                        <div className="flex justify-center items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center font-bold">JD</div>
                            <div className="text-left">
                                <p className="font-bold">João Diniz</p>
                                <p className="text-slate-400 text-sm">Diretor de RH @ TechNova</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-24 bg-slate-50">
                <div className="container mx-auto px-6">
                    <h2 className="text-center text-3xl font-bold mb-16">Fluxo Simplificado de Fechamento</h2>

                    <div className="flex flex-col lg:flex-row justify-between gap-12 relative">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-emerald-100 hidden lg:block -z-0" />

                        <StepItem number="01" title="Integração" desc="Coleta automática de dados de contratos e ponto." />
                        <StepItem number="02" title="Processamento" desc="Cálculo de encargos e variáveis em lote." />
                        <StepItem number="03" title="Validação" desc="Checklist de inconsistências e aprovação interna." />
                        <StepItem number="04" title="Publicação" desc="Envio de holerites e arquivos bancários." />
                    </div>
                </div>
            </section>

            <footer className="py-12 border-t border-slate-100 text-center text-slate-400 text-sm">
                © 2026 AxonRH Payroll Engine. Robustness in every cent.
            </footer>
        </div>
    );
}

function PayrollFeature({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="p-8 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group">
            <div className="mb-6 p-3 bg-emerald-50 rounded-xl w-fit text-emerald-600 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
        </div>
    );
}

function StepItem({ number, title, desc }: { number: string, title: string, desc: string }) {
    return (
        <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative z-10 text-center">
            <span className="text-4xl font-black text-emerald-100 block mb-4">{number}</span>
            <h4 className="font-bold text-lg mb-2">{title}</h4>
            <p className="text-sm text-slate-500">{desc}</p>
        </div>
    );
}
