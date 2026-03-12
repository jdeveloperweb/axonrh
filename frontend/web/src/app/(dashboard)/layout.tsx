'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/BottomNav';
import { useLayoutStore } from '@/stores/layout-store';
import { cn } from '@/lib/utils';
import FloatingAssistant from '@/components/ai/FloatingAssistant';
import { useThemeStore } from '@/stores/theme-store';
import AccessDenied from '@/components/auth/access-denied';
import { usePermissions, type Permission } from '@/hooks/use-permissions';

const ROUTE_PERMISSIONS: Record<string, Permission> = {
  '/employees': 'EMPLOYEE:READ',
  '/payroll': 'PAYROLL:READ',
  '/vacation': 'VACATION:READ',
  '/timesheet': 'TIMESHEET:READ',
  '/performance': 'PERFORMANCE:READ',
  '/learning': 'LEARNING:READ',
  '/talent-pool': 'HIRING:READ',
  '/benefits': 'BENEFIT:READ',
  '/settings/audit': 'AUDIT:READ',
  '/settings/roles': 'ROLE:READ',
  '/settings/users': 'USER:READ',
  '/settings/company': 'CONFIG:READ',
  '/settings/org': 'ORG:READ',
  '/wellbeing': 'WELLBEING:READ',
  '/events': 'EVENT:READ',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { isSidebarCollapsed } = useLayoutStore();
  const { hasPermission } = usePermissions();
  const isSetupRoute = pathname?.startsWith('/setup');

  // Lógica de proteção de rotas (Acesso Negado)
  const requiredPermission = Object.entries(ROUTE_PERMISSIONS).find(([route]) =>
    pathname === route || pathname.startsWith(`${route}/`)
  )?.[1];

  const canAccess = !requiredPermission || hasPermission(requiredPermission);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isSetupRoute) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, isSetupRoute, router]);

  // Carrega o branding se estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      import('@/stores/theme-store').then(({ useThemeStore }) => {
        useThemeStore.getState().fetchBranding();
      });
    }
  }, [isAuthenticated]);

  // Loading state
  if (isLoading && !isSetupRoute) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-background)]">
        <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated && !isSetupRoute) {
    return null;
  }

  if (isSetupRoute) {
    return <>{children}</>;
  }

  return (
    <div className={cn(
      "min-h-screen bg-[var(--color-background)]",
      isSidebarCollapsed && "layout-collapsed"
    )}>
      <Sidebar />
      <Header />
      <main className="main-content animate-fade-in">
        {canAccess ? children : <AccessDenied />}
      </main>
      {useThemeStore.getState().tenantTheme?.modules?.moduleAiAssistant !== false && (
        <FloatingAssistant />
      )}
      <BottomNav />
    </div>
  );
}
