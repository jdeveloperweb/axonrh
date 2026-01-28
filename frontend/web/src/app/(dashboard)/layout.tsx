'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useLayoutStore } from '@/stores/layout-store';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { isSidebarCollapsed } = useLayoutStore();
  const isSetupRoute = pathname?.startsWith('/setup');

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
        {children}
      </main>
    </div>
  );
}
