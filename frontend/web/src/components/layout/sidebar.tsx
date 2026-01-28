'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  BarChart3,
  BookOpen,
  Settings,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Calculator,
  Database,
  Bot,
  Building2,
  UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import { useLayoutStore } from '@/stores/layout-store';
import { StatusIndicator } from '@/components/StatusIndicator';

// ==================== Types ====================

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
}

// ==================== Navigation Items ====================

// ==================== Navigation Groups ====================
interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'PESSOAS',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Colaboradores', href: '/employees', icon: Users, permission: 'EMPLOYEE:READ' },
      // { label: 'Organograma', href: '/org-chart', icon: Network }, // Future
      // { label: 'Departamentos', href: '/departments', icon: Building2 }, // Future
      // { label: 'Cargos', href: '/positions', icon: Briefcase }, // Future
      // { label: 'Vagas', href: '/vacancies', icon: Target }, // Future
      { label: 'Ponto', href: '/timesheet', icon: Clock, permission: 'TIMESHEET:READ' },
      { label: 'Férias', href: '/vacation', icon: Calendar, permission: 'VACATION:READ' },
      { label: 'Desempenho', href: '/performance', icon: BarChart3, permission: 'PERFORMANCE:READ' },
      { label: 'Treinamentos', href: '/learning', icon: BookOpen, permission: 'LEARNING:READ' },
      { label: 'Assistente IA', href: '/assistant', icon: MessageSquare },
    ]
  },
  {
    title: 'GERAL',
    items: [
      // { label: 'Inventário', href: '/inventory', icon: Package }, // Future
    ]
  },
  {
    title: 'FERRAMENTAS',
    items: [
      { label: 'Calculadora', href: '/calculator', icon: Calculator },
      { label: 'Base de Conhecimento', href: '/knowledge', icon: Database },
    ]
  },
  {
    title: 'ADMINISTRAÇÃO',
    items: [
      { label: 'Departamentos', href: '/departments', icon: Building2, permission: 'DEPARTMENT:READ' },
      { label: 'Gestores', href: '/managers', icon: UserCog, permission: 'MANAGER:READ' },
      { label: 'Configurações', href: '/settings', icon: Settings, permission: 'CONFIG:READ' },
    ]
  }
];

// ==================== Component ====================

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar } = useLayoutStore();
  const { user, logout } = useAuthStore();
  const { tenantTheme } = useThemeStore();

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    return user?.permissions?.includes(permission) ?? false;
  };

  return (
    <aside
      className={cn(
        'sidebar flex flex-col',
        isSidebarCollapsed && 'sidebar-collapsed'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-[var(--header-height)] px-4 border-b border-[var(--color-border)]">
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-2">
            {tenantTheme?.logoUrl ? (
              <img
                src={tenantTheme.logoUrl}
                alt="Logo"
                style={{ width: tenantTheme.logoWidth ? `${tenantTheme.logoWidth}px` : 'auto', maxHeight: '40px' }}
                className="object-contain"
              />
            ) : (
              <span className="text-xl font-bold text-[var(--color-primary)]">AxonRH</span>
            )}
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-variant)] transition-colors"
          title={isSidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <div className="space-y-6">
          {navGroups.map((group, groupIndex) => {
            const groupFilteredItems = group.items.filter((item) => hasPermission(item.permission));
            if (groupFilteredItems.length === 0) return null;

            return (
              <div key={groupIndex}>
                {!isSidebarCollapsed && group.title && (
                  <h3 className="px-3 mb-2 text-xs font-semibold text-[var(--color-text-tertiary)] tracking-wider">
                    {group.title}
                  </h3>
                )}
                <ul className="space-y-1">
                  {groupFilteredItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)]',
                            'transition-colors duration-[var(--transition-fast)]',
                            'hover:bg-[var(--color-surface-variant)]',
                            isActive && 'bg-[var(--color-primary)] text-[var(--color-text-on-primary)]',
                            isSidebarCollapsed && 'justify-center'
                          )}
                          title={isSidebarCollapsed ? item.label : undefined}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          {!isSidebarCollapsed && (
                            <span className="font-medium">{item.label}</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
          <div className="mt-4 px-2">
            {!isSidebarCollapsed && (
              <StatusIndicator variant="sidebar" />
            )}
            {isSidebarCollapsed && (
              <div className="flex justify-center py-2">
                <StatusIndicator variant="sidebar" className="px-0 py-0 justify-center w-8 h-8 rounded-full" />
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-[var(--color-border)] p-4">
        {!isSidebarCollapsed && user && (
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-text-on-primary)] font-medium">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user.name}</p>
              <p className="text-sm text-[var(--color-text-secondary)] truncate">
                {user.roles?.[0] || 'Colaborador'}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => logout()}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-[var(--radius-md)]',
            'text-[var(--color-error)] hover:bg-[var(--color-error)]/10',
            'transition-colors',
            isSidebarCollapsed && 'justify-center'
          )}
          title={isSidebarCollapsed ? 'Sair' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!isSidebarCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
