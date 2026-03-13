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
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Calculator,
  Database,
  Building2,
  UserCog,
  Briefcase,
  ClipboardCheck,
  UserPlus,
  HeartPulse,
  Banknote,
  Puzzle,
  Mic2,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { cn, getPhotoUrl } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import { useLayoutStore } from '@/stores/layout-store';
import { usePermissions } from '@/hooks/use-permissions';
import { StatusIndicator } from '@/components/StatusIndicator';

// ==================== Types ====================

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
  module?: string;
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
      { label: 'Colaboradores', href: '/employees', icon: Users, permission: 'EMPLOYEE:READ', module: 'moduleEmployees' },
      { label: 'Ponto', href: '/timesheet/record', icon: Clock, permission: 'TIMESHEET:READ', module: 'moduleTimesheet' },
      { label: 'Licenças', href: '/vacation', icon: Calendar, permission: 'VACATION:READ', module: 'moduleVacation' },
      { label: 'Desempenho', href: '/performance', icon: BarChart3, permission: 'PERFORMANCE:READ', module: 'modulePerformance' },
      { label: 'Folha de Pagamento', href: '/payroll', icon: Banknote, permission: 'PAYROLL:READ', module: 'modulePayroll' },
      { label: 'Treinamentos', href: '/learning', icon: BookOpen, permission: 'LEARNING:READ', module: 'moduleLearning' },
      { label: 'Recrutamento e Seleção', href: '/talent-pool', icon: UserPlus, permission: 'HIRING:READ', module: 'moduleRecruitment' },
      { label: 'Benefícios', href: '/benefits', icon: HeartPulse, permission: 'BENEFIT:READ', module: 'moduleBenefits' },
      { label: 'Processos RH', href: '/processes', icon: ClipboardCheck, permission: 'ADMISSION:READ' },
      { label: 'Saúde Mental', href: '/wellbeing', icon: HeartPulse, permission: 'WELLBEING:READ' },
      { label: 'Eventos e Palestras', href: '/events', icon: Mic2, permission: 'EVENT:READ', module: 'moduleEvents' },
      { label: 'Assistente IA', href: '/assistant', icon: MessageSquare, permission: 'AI_ASSISTANT:READ', module: 'moduleAiAssistant' },
    ]
  },
  {
    title: 'GERAL',
    items: []
  },
  {
    title: 'ADMINISTRAÇÃO',
    items: [
      { label: 'Organograma', href: '/organogram', icon: Users, permission: 'ORG:READ' },
      { label: 'Departamentos', href: '/departments', icon: Building2, permission: 'ORG:READ' },
      { label: 'Cargos', href: '/positions', icon: Briefcase, permission: 'ORG:READ' },
      { label: 'Gestores', href: '/managers', icon: UserCog, permission: 'USER:READ' },
    ]
  },

  {
    title: 'CONFIGURAÇÕES',
    items: [
      { label: 'Integração da Dinâmica', href: '/integrations', icon: Puzzle, permission: 'INTEGRATION:READ', module: 'moduleIntegration' },
      { label: 'Privacidade', href: '/privacy', icon: ShieldCheck },
      { label: 'Segurança', href: '/settings/security', icon: Lock },
      { label: 'Sistema', href: '/settings', icon: Settings, permission: 'CONFIG:READ' },
    ]
  }
];

// ==================== Component ====================

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar, isMobileMenuOpen, toggleMobileMenu } = useLayoutStore();
  const { user, logout } = useAuthStore();
  const { tenantTheme } = useThemeStore();
  const { hasPermission } = usePermissions();

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
          'sidebar flex flex-col glass border-r border-white/20',
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
                    maxWidth: isSidebarCollapsed ? '32px' : `${tenantTheme.logoWidth || 150}px`,
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
              const { hasManagementAccess } = usePermissions();

              // Só quem tem acesso admin (ADMIN ou RH) vê o grupo de administração
              if (group.title === 'ADMINISTRAÇÃO' && !hasManagementAccess) return null;

              const groupFilteredItems = group.items.filter((item) => {
                // 1. Check Module Activation
                if (item.module && tenantTheme?.modules) {
                  const isModuleActive = tenantTheme.modules[item.module as keyof typeof tenantTheme.modules];
                  // Se o módulo está explicitamente desativado (false), removemos do menu
                  if (isModuleActive === false) return false;
                }

                // 2. Check Permission
                if (item.permission && !hasPermission(item.permission as any)) return false;

                return true;
              });

              // Para colaboradores comuns, garantir que eles vejam "Meus Holerites" se o módulo estiver ativo
              if (!hasManagementAccess && group.title === 'PESSOAS') {
                groupFilteredItems.push({
                  label: 'Meus Holerites',
                  href: '/payroll/my-payslips',
                  icon: FileText,
                  module: 'modulePayroll'
                });
              }

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
        <div className="border-t border-[var(--color-border)] p-4 bg-gradient-to-t from-white/5 to-transparent">
          {!isSidebarCollapsed && user && (
            <div className="flex items-center gap-3 mb-4 p-2 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/40 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white font-bold shadow-md shadow-[var(--color-primary)]/20">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate text-slate-800">{user.name}</p>
                <p className="text-[10px] font-black text-[var(--color-text-secondary)] truncate uppercase tracking-tight">
                  {(() => {
                    const roleLabels: Record<string, string> = {
                      'ADMIN': 'Administrador',
                      'GESTOR_RH': 'Gestor de RH',
                      'RH': 'RH',
                      'ANALISTA_DP': 'Analista de DP',
                      'LIDER': 'Líder',
                      'GESTOR': 'Gestor',
                      'MANAGER': 'Gestor',
                      'CONTADOR': 'Contador',
                      'COLABORADOR': 'Colaborador'
                    };
                    return roleLabels[user.roles?.[0] || ''] || user.roles?.[0] || 'Colaborador';
                  })()}
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
