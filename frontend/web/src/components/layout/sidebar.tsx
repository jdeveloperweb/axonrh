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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';

// ==================== Types ====================

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
}

// ==================== Navigation Items ====================

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Colaboradores', href: '/employees', icon: Users, permission: 'EMPLOYEE:READ' },
  { label: 'Ponto', href: '/timesheet', icon: Clock, permission: 'TIMESHEET:READ' },
  { label: 'Ferias', href: '/vacation', icon: Calendar, permission: 'VACATION:READ' },
  { label: 'Desempenho', href: '/performance', icon: BarChart3, permission: 'PERFORMANCE:READ' },
  { label: 'Treinamentos', href: '/learning', icon: BookOpen, permission: 'LEARNING:READ' },
  { label: 'Assistente IA', href: '/assistant', icon: MessageSquare },
  { label: 'Configuracoes', href: '/settings', icon: Settings, permission: 'CONFIG:READ' },
];

// ==================== Component ====================

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const { tenantTheme } = useThemeStore();

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    return user?.permissions?.includes(permission) ?? false;
  };

  const filteredItems = navItems.filter((item) => hasPermission(item.permission));

  return (
    <aside
      className={cn(
        'sidebar flex flex-col',
        isCollapsed && 'sidebar-collapsed'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-[var(--header-height)] px-4 border-b border-[var(--color-border)]">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            {tenantTheme?.logoUrl ? (
              <img src={tenantTheme.logoUrl} alt="Logo" className="h-8" />
            ) : (
              <span className="text-xl font-bold text-[var(--color-primary)]">AxonRH</span>
            )}
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-variant)] transition-colors"
          title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <ul className="space-y-1">
          {filteredItems.map((item) => {
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
                    isCollapsed && 'justify-center'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="border-t border-[var(--color-border)] p-4">
        {!isCollapsed && user && (
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
            isCollapsed && 'justify-center'
          )}
          title={isCollapsed ? 'Sair' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
