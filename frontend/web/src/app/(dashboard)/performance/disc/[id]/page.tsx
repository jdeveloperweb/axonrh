'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DiscResultRedirectPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    useEffect(() => {
        if (id) {
            // Redireciona para a página de resultado do DISC
            router.replace(`/performance/disc/result/${id}`);
        }
    }, [id, router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">Carregando resultado...</p>
        </div>
    );
}
