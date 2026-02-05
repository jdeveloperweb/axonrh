'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CareersRedirect() {
    const router = useRouter();

    useEffect(() => {
        const tenantId = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ||
            localStorage.getItem('tenantId') ||
            localStorage.getItem('setup_tenant_id');

        if (tenantId) {
            router.replace(`/careers/${tenantId}`);
        } else {
            // Se não houver tenant, pode redirecionar para o login ou mostrar uma mensagem
            router.replace('/login');
        }
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-100 border-t-blue-600" />
        </div>
    );
}
