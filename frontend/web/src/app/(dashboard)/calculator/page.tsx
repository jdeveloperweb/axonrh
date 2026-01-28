'use client';

import CalculatorWidget from '@/components/ai/CalculatorWidget';

export default function CalculatorPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Calculadora
                            </h1>
                            <p className="text-sm text-gray-500">
                                Ferramentas de cálculo de RH
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="max-w-2xl mx-auto">
                    <CalculatorWidget />
                </div>
            </div>
        </div>
    );
}
