'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Heart, Settings, Users, UserCircle } from 'lucide-react';

interface BenefitsLayoutProps {
    children: ReactNode;
}

export default function BenefitsLayout({ children }: BenefitsLayoutProps) {
    const pathname = usePathname();

    const tabs = [
        {
            label: 'Gestão de Benefícios',
            href: '/benefits/management',
            icon: Users,
            isAdmin: true
        },
        {
            label: 'Configurar Tipos',
            href: '/benefits/types',
            icon: Settings,
            isAdmin: true
        },
        {
            label: 'Meus Benefícios',
            href: '/benefits/my-benefits',
            icon: UserCircle,
            isAdmin: false
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
                        <Heart className="w-8 h-8 text-[var(--color-primary)]" />
                        Benefícios
                    </h1>
                    <p className="text-[var(--color-text-secondary)] mt-1">
                        Gestão de benefícios corporativos e planos dos colaboradores.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1 p-1 bg-[var(--color-surface-variant)]/50 rounded-xl w-fit border border-[var(--color-border)]">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = pathname === tab.href;

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm border border-[var(--color-border)]"
                                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-variant)]"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </Link>
                    );
                })}
            </div>

            <div className="min-h-[600px]">
                {children}
            </div>
        </div>
    );
}
