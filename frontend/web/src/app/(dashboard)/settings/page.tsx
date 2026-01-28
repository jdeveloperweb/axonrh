'use client';

import { useRouter } from 'next/navigation';
import {
    Users,
    Palette,
    Settings as SettingsIcon,
    ShieldCheck,
    Database,
    ArrowRight,
    Building2,
    Network,
    Gavel,
    Lock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';

const settingsItems = [
    {
        title: 'Dados da Empresa',
        description: 'Gerencie o perfil jurídico, endereço e contatos da organização.',
        icon: Building2,
        href: '/settings/company',
        color: 'bg-emerald-500',
        adminOnly: true
    },
    {
        title: 'Estrutura Organizacional',
        description: 'Configure departamentos, cargos e hierarquias do sistema.',
        icon: Network,
        href: '/settings/org',
        color: 'bg-indigo-500',
        adminOnly: true
    },
    {
        title: 'Regras Trabalhistas',
        description: 'Defina jornadas, horas extras, banco de horas e feriados.',
        icon: Gavel,
        href: '/settings/labor',
        color: 'bg-amber-500',
        adminOnly: true
    },
    {
        title: 'Usuários e Acessos',
        description: 'Gerencie administradores, papéis e permissões do sistema.',
        icon: Users,
        href: '/settings/users',
        color: 'bg-blue-500',
        adminOnly: true
    },
    {
        title: 'Identidade Visual',
        description: 'Personalize logo, cores, tipografia e tema do seu portal.',
        icon: Palette,
        href: '/settings/branding',
        color: 'bg-purple-500',
        adminOnly: true
    },
    {
        title: 'Recursos e Módulos',
        description: 'Ative ou desative funcionalidades conforme sua necessidade.',
        icon: SettingsIcon,
        href: '/setup',
        color: 'bg-orange-500',
        adminOnly: true
    }
];

export default function SettingsHubPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const isAdmin = user?.roles?.includes('ADMIN');

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <Lock className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Acesso Restrito</h1>
                <p className="text-[var(--color-text-secondary)] mt-2 max-w-md">
                    Você não tem permissão para acessar as configurações do sistema. Esta área é exclusiva para administradores.
                </p>
                <button
                    className="mt-8 btn-primary"
                    onClick={() => router.push('/dashboard')}
                >
                    Voltar para o Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Configurações</h1>
                <p className="text-[var(--color-text-secondary)] mt-2">Central de controle e personalização do seu AxonRH</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {settingsItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Card
                            key={item.href}
                            className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-none bg-[var(--color-surface)]"
                            onClick={() => router.push(item.href)}
                        >
                            <CardContent className="p-6">
                                <div className="flex flex-col h-full">
                                    <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">{item.title}</h3>
                                    <p className="text-[var(--color-text-secondary)] text-sm flex-1">{item.description}</p>
                                    <div className="mt-6 flex items-center text-[var(--color-primary)] font-semibold text-sm">
                                        Configurar <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-surface-variant)]/50 border border-[var(--color-border)]">
                    <div className="flex items-center gap-3 mb-4">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        <h4 className="font-bold">Segurança e Auditoria</h4>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-4">Logs de acesso, política de senhas e autenticação mútua (2FA).</p>
                    <button className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] hover:underline">Ver Logs →</button>
                </div>

                <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-surface-variant)]/50 border border-[var(--color-border)]">
                    <div className="flex items-center gap-3 mb-4">
                        <Database className="w-5 h-5 text-indigo-500" />
                        <h4 className="font-bold">Dados e Integrações</h4>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-4">Configuração de APIs, Webhooks e conexões com sistemas externos.</p>
                    <button className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] hover:underline">Gerar Chave API →</button>
                </div>
            </div>
        </div>
    );
}
