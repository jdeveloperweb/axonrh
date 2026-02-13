'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Loader2 } from 'lucide-react';

export default function BenefitsPage() {
    const router = useRouter();
    const { user } = useAuthStore();

    useEffect(() => {
        if (!user) return;

        const roles = user.roles || [];
        const isRH = roles.includes('ADMIN') || roles.includes('RH') || roles.includes('GESTOR_RH') || roles.includes('ANALISTA_DP');

        if (isRH) {
            router.replace('/benefits/management');
        } else {
            router.replace('/benefits/my-benefits');
        }
    }, [user, router]);

    return (
        <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">Redirecionando para benefícios...</p>
        </div>
    );
}
