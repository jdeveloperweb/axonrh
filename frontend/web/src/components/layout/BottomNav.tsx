'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Clock, FileText, User, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/stores/theme-store';

export function BottomNav() {
    const pathname = usePathname();
    const { tenantTheme } = useThemeStore();

    const navItems = [
        { label: 'Início', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Ponto', href: '/timesheet/record', icon: Clock, module: 'moduleTimesheet' },
        { label: 'IA', href: '/assistant', icon: MessageSquare, module: 'moduleAiAssistant' },
        { label: 'Holerites', href: '/payroll/my-payslips', icon: FileText, module: 'modulePayroll' },
        { label: 'Perfil', href: '/settings/security', icon: User },
    ];

    const filteredItems = navItems.filter(item => {
        if (item.module && tenantTheme?.modules) {
            return tenantTheme.modules[item.module as keyof typeof tenantTheme.modules] !== false;
        }
        return true;
    });

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-[var(--color-surface)] border-t border-[var(--color-border)] lg:hidden safe-area-bottom">
            <div className="flex h-full items-center justify-around px-2">
                {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 min-w-[64px] h-full transition-colors",
                                isActive ? "text-[var(--color-primary)]" : "text-[var(--color-text-tertiary)]"
                            )}
                        >
                            <Icon className={cn("w-6 h-6", isActive && "animate-in zoom-in duration-300")} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                            {isActive && (
                                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[var(--color-primary)]" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
