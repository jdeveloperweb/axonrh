'use client';

import React, { useState } from 'react';
import {
    Search,
    LayoutGrid,
    List,
    ArrowUpRight,
    BookOpen,
    Zap,
    ShieldCheck,
    Coins,
    Briefcase,
    GraduationCap,
    HeartPulse,
    CheckCircle2,
    Clock,
    Sparkles,
    ArrowRight,
    Filter,
    Heart,
    Lock,
    Bell
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

interface ServiceModule {
    id: string;
    name: string;
    category: 'Core' | 'Finance' | 'Wellbeing' | 'Intelligence' | 'Operations';
    description: string;
    icon: React.ReactNode;
    status: 'Documented' | 'In Progress' | 'Planned';
    technicalLink: string;
    businessLink: string;
    color: string;
}

const services: ServiceModule[] = [
    {
        id: 'employee-service',
        name: 'Gestão de Colaboradores',
        category: 'Core',
        description: 'Ciclo de vida completo do colaborador, do onboarding ao offboarding.',
        icon: <Briefcase />,
        status: 'Documented',
        technicalLink: '/backend/employee-service/docs/technical.md',
        businessLink: '/servicos/employee-service',
        color: 'blue'
    },
    {
        id: 'ai-assistant-service',
        name: 'Assistente de IA',
        category: 'Intelligence',
        description: 'Automação cognitiva, OCR e suporte inteligente via IA Generativa.',
        icon: <Sparkles />,
        status: 'Documented',
        technicalLink: '/backend/ai-assistant-service/docs/technical.md',
        businessLink: '/servicos/ai-assistant-service',
        color: 'purple'
    },
    {
        id: 'payroll-service',
        name: 'Folha de Pagamento',
        category: 'Finance',
        description: 'Cálculo de salários, encargos e conformidade financeira total.',
        icon: <Coins />,
        status: 'Documented',
        technicalLink: '/backend/payroll-service/docs/technical.md',
        businessLink: '/servicos/payroll-service',
        color: 'emerald'
    },
    {
        id: 'vacation-service',
        name: 'Férias e Afastamentos',
        category: 'Wellbeing',
        description: 'Controle de períodos aquisitivos, solicitações e licenças médicas.',
        icon: <HeartPulse />,
        status: 'Documented',
        technicalLink: '/backend/vacation-service/docs/technical.md',
        businessLink: '/servicos/vacation-service',
        color: 'orange'
    },
    {
        id: 'performance-service',
        name: 'Avaliação de Desempenho',
        category: 'Core',
        description: 'Gestão de metas, OKRs e avaliações de feedback 360.',
        icon: <Zap />,
        status: 'Documented',
        technicalLink: '/backend/performance-service/docs/technical.md',
        businessLink: '/servicos/performance-service',
        color: 'red'
    },
    {
        id: 'learning-service',
        name: 'T&D e Treinamentos',
        category: 'Operations',
        description: 'Plataforma de aprendizagem e capacitação contínua.',
        icon: <GraduationCap />,
        status: 'Documented',
        technicalLink: '/backend/learning-service/docs/technical.md',
        businessLink: '/servicos/learning-service',
        color: 'indigo'
    },
    {
        id: 'benefits-service',
        name: 'Gestão de Benefícios',
        category: 'Wellbeing',
        description: 'Convênios médicos, vales e benefícios flexíveis em um só lugar.',
        icon: <Heart />,
        status: 'Documented',
        technicalLink: '/backend/benefits-service/docs/technical.md',
        businessLink: '/servicos/benefits-service',
        color: 'pink'
    },
    {
        id: 'timesheet-service',
        name: 'Jornada de Trabalho',
        category: 'Operations',
        description: 'Controle de ponto digital, banco de horas e gestão de escalas.',
        icon: <Clock />,
        status: 'Documented',
        technicalLink: '/backend/timesheet-service/docs/technical.md',
        businessLink: '/servicos/timesheet-service',
        color: 'orange'
    },
    {
        id: 'security-engagement',
        name: 'Segurança & Engajamento',
        category: 'Intelligence',
        description: 'A espinha dorsal de confiança e comunicação da plataforma.',
        icon: <Lock />,
        status: 'Documented',
        technicalLink: '/backend/auth-service/docs/technical.md',
        businessLink: '/servicos/security-engagement',
        color: 'blue'
    }
];

export default function DocumentationHub() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'All' | ServiceModule['category']>('All');

    const filteredServices = services.filter(s =>
        (filter === 'All' || s.category === filter) &&
        (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Header Section */}
            <header className="bg-white border-b border-slate-200 pt-16 pb-12">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="max-w-2xl">
                            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                                Hub de Documentação <span className="text-[var(--color-primary)]">AxonRH</span>
                            </h1>
                            <p className="text-slate-500 text-lg">
                                Explore o ecossistema de microsserviços do AxonRH através de visões técnicas e de negócio.
                            </p>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                            <button className="p-2 bg-white shadow-sm rounded-lg text-slate-900"><LayoutGrid className="w-5 h-5" /></button>
                            <button className="p-2 text-slate-400 hover:text-slate-600"><List className="w-5 h-5" /></button>
                        </div>
                    </div>

                    <div className="mt-10 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar módulo ou funcionalidade..."
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                            {['All', 'Core', 'Finance', 'Wellbeing', 'Intelligence', 'Operations'].map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setFilter(cat as any)}
                                    className={`px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${filter === cat
                                        ? 'bg-slate-900 text-white shadow-lg'
                                        : 'bg-white text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {cat === 'All' ? 'Todos' : cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 mt-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredServices.map((service) => (
                        <ServiceCard key={service.id} service={service} />
                    ))}
                </div>

                {filteredServices.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="mb-4 inline-flex p-4 bg-slate-100 rounded-full">
                            <Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Nenhum módulo encontrado</h3>
                        <p className="text-slate-500">Tente ajustar sua busca ou filtro.</p>
                    </div>
                )}
            </main>

            {/* Footer / CTA Card */}
            <section className="container mx-auto px-6 mt-20">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 max-w-xl">
                        <h2 className="text-3xl font-bold mb-3 italic">Precisa de documentar um novo serviço?</h2>
                        <p className="text-slate-400">Siga o padrão AxonRH de documentação dupla: Apresentação de Negócio (Next.js) e Detalhes Técnicos (Markdown).</p>
                    </div>
                    <button className="relative z-10 px-8 py-4 bg-[var(--color-primary)] hover:opacity-90 rounded-2xl font-black transition-all flex items-center gap-2 group">
                        Iniciar Nova Documentação <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </section>
        </div>
    );
}

function ServiceCard({ service }: { service: ServiceModule }) {
    const colorMap: Record<string, string> = {
        blue: 'bg-blue-600',
        purple: 'bg-purple-600',
        emerald: 'bg-emerald-600',
        orange: 'bg-orange-600',
        red: 'bg-red-600',
        indigo: 'bg-indigo-600'
    };

    const statusMap = {
        'Documented': { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Documentado', classes: 'bg-emerald-100 text-emerald-700' },
        'In Progress': { icon: <Clock className="w-4 h-4" />, label: 'Em Progresso', classes: 'bg-blue-100 text-blue-700' },
        'Planned': { icon: <ArrowUpRight className="w-4 h-4" />, label: 'Planejado', classes: 'bg-slate-100 text-slate-500' }
    };

    const status = statusMap[service.status];

    return (
        <Card className="group hover:shadow-2xl transition-all duration-500 border-transparent hover:border-slate-200 overflow-hidden bg-white">
            <CardContent className="p-0">
                <div className={`h-2 ${colorMap[service.color] || 'bg-slate-600'}`} />
                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div className={`p-4 rounded-2xl ${colorMap[service.color]} text-white shadow-lg shadow-current/20 group-hover:scale-110 transition-transform duration-500`}>
                            {React.cloneElement(service.icon as React.ReactElement, { className: 'w-7 h-7' } as any)}
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${status.classes}`}>
                            {status.icon}
                            {status.label}
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2">{service.name}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-8 h-12 line-clamp-2">
                        {service.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-100">
                        {service.status === 'Documented' ? (
                            <>
                                <Link href={service.businessLink} className="flex flex-col gap-1 group/btn p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Produto</span>
                                    <span className="text-sm font-bold text-slate-900 group-hover/btn:text-[var(--color-primary)] flex items-center gap-1">
                                        Vision <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                    </span>
                                </Link>
                                <div className="flex flex-col gap-1 p-3 rounded-xl border border-dashed border-slate-200 opacity-60">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Técnico</span>
                                    <span className="text-sm font-bold text-slate-900 flex items-center gap-1">
                                        Markdown <BookOpen className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="col-span-2 py-4 text-center text-xs font-bold text-slate-300 uppercase tracking-widest border border-dashed border-slate-200 rounded-2xl">
                                Aguardando Implementação
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
