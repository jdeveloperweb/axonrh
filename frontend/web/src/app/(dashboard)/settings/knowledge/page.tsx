'use client';

import KnowledgeBase from '@/components/knowledge/KnowledgeBase';

export default function KnowledgeBasePage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Base de Conhecimento
                            </h1>
                            <p className="text-sm text-gray-500">
                                Políticas, leis e manuais internos
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <KnowledgeBase />
            </div>
        </div>
    );
}
