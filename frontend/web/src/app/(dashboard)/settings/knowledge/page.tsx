'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import KnowledgeBase from '@/components/knowledge/KnowledgeBase';

export default function KnowledgeBasePage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <Link
                    href="/settings"
                    className="flex items-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors mb-4 group w-fit"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Voltar para Configurações
                </Link>

                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                    Base de Conhecimento
                </h1>
                <p className="text-[var(--color-text-secondary)] mt-2">
                    Alimente a IA com manuais, políticas e documentos da sua empresa.
                </p>
            </div>

            {/* Content */}
            <KnowledgeBase />
        </div>
    );
}
