'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { setupApi } from '@/lib/api/setup';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoadingTimedOut(true);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleRedirect = async () => {
      if (isLoading && !loadingTimedOut) {
        return;
      }

      try {
        const summaryResponse = await setupApi.getSummary();
        const status = summaryResponse.status as unknown;
        const isSetupCompleted =
          (typeof status === 'string' && status === 'COMPLETED') ||
          (typeof status === 'number' && status === 2) ||
          summaryResponse.progressPercentage === 100;

        if (!isSetupCompleted) {
          router.replace('/setup');
          return;
        }
      } catch (error) {
        console.error('Error loading setup summary:', error);
        router.replace('/setup');
        return;
      }

      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    };

    void handleRedirect();
  }, [isAuthenticated, isLoading, loadingTimedOut, router]);

  // Loading state
  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-background)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        <p className="text-[var(--color-text-secondary)]">Carregando...</p>
      </div>
    </div>
  );
}
