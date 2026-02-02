'use client';

import Link from 'next/link';
import Image from "next/image";
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

  Building2,
  UserCog,
  Briefcase,
  ClipboardCheck,
} from 'lucide-react';
import { cn, getPhotoUrl } from '@/lib/utils';
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
      { label: 'Ponto', href: '/timesheet/record', icon: Clock, permission: 'TIMESHEET:READ' },
      { label: 'Férias', href: '/vacation', icon: Calendar, permission: 'VACATION:READ' },
      { label: 'Desempenho', href: '/performance', icon: BarChart3, permission: 'PERFORMANCE:READ' },
      { label: 'Treinamentos', href: '/learning', icon: BookOpen, permission: 'LEARNING:READ' },
      { label: 'Processos RH', href: '/processes', icon: ClipboardCheck, permission: 'EMPLOYEE:READ' },
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
      { label: 'Organograma', href: '/organogram', icon: Users },
      { label: 'Departamentos', href: '/departments', icon: Building2 },
      { label: 'Cargos', href: '/positions', icon: Briefcase },
      { label: 'Gestores', href: '/managers', icon: UserCog },
      { label: 'Configurações', href: '/settings', icon: Settings, permission: 'CONFIG:READ' },
    ]
  }
];

// ==================== Component ====================

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar, isMobileMenuOpen, toggleMobileMenu } = useLayoutStore();
  const { user, logout } = useAuthStore();
  const { tenantTheme } = useThemeStore();

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    return user?.permissions?.includes(permission) ?? false;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="mobile-overlay lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      <aside
        className={cn(
          'sidebar flex flex-col',
          isSidebarCollapsed && 'sidebar-collapsed',
          isMobileMenuOpen && 'sidebar-mobile-open'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-[var(--header-height)] px-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2 overflow-hidden">
            {tenantTheme?.logoUrl ? (
              <div
                key={`${tenantTheme.logoUrl}-${tenantTheme.logoWidth}`}
                className="relative flex items-center justify-start overflow-hidden"
                style={{
                  width: isSidebarCollapsed ? '32px' : 'auto',
                  height: '48px',
                  transition: 'all 0.3s ease'
                }}
              >
                <img
                  src={getPhotoUrl(tenantTheme.logoUrl, new Date().getTime().toString(), 'logo') || ''}
                  alt="Logo"
                  className={cn(
                    "h-full w-auto object-contain object-left",
                    isSidebarCollapsed ? "min-w-[32px]" : ""
                  )}
                  style={{
                    maxWidth: isSidebarCollapsed ? '32px' : '180px', // Limite um pouco maior para logos horizontais
                  }}
                />
              </div>
            ) : (
              !isSidebarCollapsed && (
                <span className="text-xl font-bold text-[var(--color-primary)]">AxonRH</span>
              )
            )}
          </div>

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
              const roles = user?.roles || [];
              const isAdmin = roles.includes('ADMIN');
              const isRH = roles.includes('RH');
              const hasAdminAccess = isAdmin || isRH;

              // Só quem tem acesso admin (ADMIN ou RH) vê o grupo de administração
              if (group.title === 'ADMINISTRAÇÃO' && !hasAdminAccess) return null;

              const groupFilteredItems = group.items.filter((item) => {
                if (!hasPermission(item.permission)) return false;

                // Filtros específicos: Administrador e RH vêem tudo.
                if (hasAdminAccess) return true;

                // Colaboradores puros, Líderes e Gestores não vêem estas telas específicas de gestão
                if (item.label === 'Colaboradores' || item.label === 'Processos RH') {
                  return false;
                }

                return true;
              });

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
                              'transition-colors duration-fast',
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
    </>
  );
}
