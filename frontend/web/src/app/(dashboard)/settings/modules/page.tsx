'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Settings as SettingsIcon,
    ArrowLeft,
    Save,
    Check,
    AlertCircle,
    Users,
    Clock,
    Calendar,
    DollarSign,
    TrendingUp,
    GraduationCap,
    MessageSquare,
    BarChart3,
    Smartphone,
    ShieldCheck,
    Search,
    Monitor,
    Heart,
    CreditCard,
    Building2
} from 'lucide-react';
import { setupApi, ModuleConfig } from '@/lib/api/setup';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const INITIAL_MODULES: ModuleConfig = {
    moduleEmployees: true,
    moduleTimesheet: true,
    moduleVacation: true,
    modulePayroll: false,
    modulePerformance: false,
    moduleLearning: false,
    moduleRecruitment: false,
    moduleBenefits: false,
    moduleEsocial: false,
    moduleAccounting: false,
    moduleBanking: false,
    moduleAiAssistant: false,
    moduleAiAnalytics: false,
    moduleMobileApp: true,
    moduleKiosk: false,
};

const moduleInfo = [
    {
        key: 'moduleEmployees',
        name: 'Colaboradores',
        desc: 'Gestão completa do ciclo de vida do colaborador, documentos e histórico.',
        icon: Users,
        category: 'Core',
        required: true
    },
    {
        key: 'moduleTimesheet',
        name: 'Ponto Eletrônico',
        desc: 'Controle de jornada, banco de horas e cerca digital (geofencing).',
        icon: Clock,
        category: 'Core',
        required: true
    },
    {
        key: 'moduleVacation',
        name: 'Férias e Ausências',
        desc: 'Gestão de solicitações, saldos e calendários de folgas.',
        icon: Calendar,
        category: 'Core',
        required: true
    },
    {
        key: 'modulePayroll',
        name: 'Folha de Pagamento',
        desc: 'Processamento de salários, encargos e benefícios integrados.',
        icon: DollarSign,
        category: 'Gestão Financeira'
    },
    {
        key: 'moduleBenefits',
        name: 'Gestão de Benefícios',
        desc: 'Vale transporte, alimentação, plano de saúde e outros benefícios.',
        icon: Heart,
        category: 'Gestão Financeira'
    },
    {
        key: 'moduleRecruitment',
        name: 'Recrutamento e Seleção',
        desc: 'Pipeline de candidatos, triagem por IA e gestão de vagas.',
        icon: Search,
        category: 'Talentos'
    },
    {
        key: 'modulePerformance',
        name: 'Desempenho',
        desc: 'Avaliações, PDI e acompanhamento de metas organizacionais.',
        icon: TrendingUp,
        category: 'Talentos'
    },
    {
        key: 'moduleLearning',
        name: 'Treinamento e L&D',
        desc: 'Plataforma de cursos (LMS) e trilhas de desenvolvimento.',
        icon: GraduationCap,
        category: 'Talentos'
    },
    {
        key: 'moduleAiAssistant',
        name: 'Assistente de IA',
        desc: 'Chatbot inteligente para tirar dúvidas de RH e automatizar tarefas.',
        icon: MessageSquare,
        category: 'Inteligência Artificial'
    },
    {
        key: 'moduleAiAnalytics',
        name: 'IA Analytics',
        desc: 'Predições de turnover e analytics avançado baseado em IA.',
        icon: BarChart3,
        category: 'Inteligência Artificial'
    },
    {
        key: 'moduleMobileApp',
        name: 'Aplicativo Mobile',
        desc: 'Acesso para colaboradores via iOS e Android para marcação de ponto.',
        icon: Smartphone,
        category: 'Experiência'
    },
    {
        key: 'moduleKiosk',
        name: 'Modo Quiosque',
        desc: 'Terminal de marcação de ponto coletivo com reconhecimento facial.',
        icon: Monitor,
        category: 'Experiência'
    },
    {
        key: 'moduleEsocial',
        name: 'eSocial Sync',
        desc: 'Integração direta para envio de eventos legais ao governo.',
        icon: ShieldCheck,
        category: 'Conformidade'
    },
    {
        key: 'moduleAccounting',
        name: 'Integração Contábil',
        desc: 'Exportação automatizada para sistemas contábeis externos.',
        icon: Building2,
        category: 'Conformidade'
    },
    {
        key: 'moduleBanking',
        name: 'Banking & Pagamentos',
        desc: 'Pagamento de salários diretamente pelo sistema via API bancária.',
        icon: CreditCard,
        category: 'Eficiência'
    }
];

export default function ModulesSettingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modules, setModules] = useState<ModuleConfig>(INITIAL_MODULES);

    useEffect(() => {
        async function loadModules() {
            try {
                setLoading(true);
                const data = await setupApi.getStepData(5);
                if (data) {
                    setModules({ ...INITIAL_MODULES, ...data });
                }
            } catch (error) {
                console.error('Erro ao carregar módulos:', error);
                toast({
                    title: 'Erro',
                    description: 'Não foi possível carregar as configurações de módulos.',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        }
        loadModules();
    }, [toast]);

    const handleSave = async () => {
        try {
            setSaving(true);
            await setupApi.saveStepData(5, modules as any);
            toast({
                title: 'Configurações salvas',
                description: 'Os recursos e módulos foram atualizados com sucesso.',
            });
        } catch (error) {
            console.error('Erro ao salvar módulos:', error);
            toast({
                title: 'Erro ao salvar',
                description: 'Houve um problema ao atualizar os módulos.',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const toggleModule = (key: string) => {
        const info = moduleInfo.find(m => m.key === key);
        if (info?.required) return;

        setModules(prev => ({
            ...prev,
            [key]: !prev[key as keyof ModuleConfig]
        }));
    };

    const categories = Array.from(new Set(moduleInfo.map(m => m.category)));

    if (loading) {
        return (
            <div className="flex items-center justify-center p-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <button
                        onClick={() => router.push('/settings')}
                        className="flex items-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors mb-2"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para Configurações
                    </button>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Recursos e Módulos</h1>
                    <p className="text-[var(--color-text-secondary)] mt-1">
                        Personalize seu AxonRH ativando apenas o que sua empresa precisa.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary flex items-center justify-center gap-2 px-6"
                >
                    {saving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-12">
                {categories.map(category => (
                    <div key={category} className="space-y-6">
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-[var(--color-primary)] rounded-full"></span>
                            {category}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {moduleInfo
                                .filter(m => m.category === category)
                                .map(mod => {
                                    const Icon = mod.icon;
                                    const isActive = modules[mod.key as keyof ModuleConfig];

                                    return (
                                        <Card
                                            key={mod.key}
                                            className={`relative overflow-hidden cursor-pointer transition-all duration-300 border shadow-sm hover:shadow-md ${isActive
                                                ? 'bg-[var(--color-surface)] border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/10'
                                                : 'bg-[var(--color-surface-variant)]/30 border-[var(--color-border)] opacity-80 grayscale-[0.5]'
                                                }`}
                                            onClick={() => toggleModule(mod.key)}
                                        >
                                            <CardContent className="p-6">
                                                <div className="flex flex-col h-full">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className={`p-3 rounded-xl transition-colors ${isActive
                                                            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                                            : 'bg-slate-200 text-slate-500'
                                                            }`}>
                                                            <Icon className="w-6 h-6" />
                                                        </div>
                                                        <Switch
                                                            checked={!!isActive}
                                                            disabled={mod.required}
                                                            onCheckedChange={() => toggleModule(mod.key)}
                                                        />
                                                    </div>

                                                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2 flex items-center gap-2">
                                                        {mod.name}
                                                        {mod.required && (
                                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                                                                Ativo
                                                            </span>
                                                        )}
                                                    </h3>
                                                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed flex-1">
                                                        {mod.desc}
                                                    </p>

                                                    {isActive && (
                                                        <div className="mt-4 flex items-center text-[var(--color-primary)] text-xs font-bold gap-1 animate-in fade-in slide-in-from-left-2 duration-300">
                                                            <Check className="w-3 h-3" /> MÓDULO ATIVO
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 flex gap-4 items-start">
                <AlertCircle className="w-6 h-6 text-blue-500 shrink-0" />
                <div className="space-y-1">
                    <h4 className="font-bold text-blue-900">Sobre os Módulos Core</h4>
                    <p className="text-sm text-blue-700 leading-relaxed">
                        Módulos marcados como "Ativo" são fundamentais para o funcionamento básico do sistema e não podem ser desativados.
                        Isso inclui a gestão de colaboradores e o registro de ponto, que são a base de todas as outras funcionalidades.
                    </p>
                </div>
            </div>
        </div>
    );
}
