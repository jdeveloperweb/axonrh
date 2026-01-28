'use client';

import { useState } from 'react';
import ChatWidget from './ChatWidget';
import { ChatIcons } from './ChatIcons';
import { usePathname } from 'next/navigation';

export default function FloatingAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Don't show the floating assistant on the dedicated assistant page
    // to avoid duplication or confusion
    if (pathname === '/assistant') {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[400px] h-[600px] max-h-[calc(100vh-120px)] shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <ChatWidget
                        onClose={() => setIsOpen(false)}
                        className="h-full border-2 border-blue-100/50"
                    />
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="group relative flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl shadow-lg hover:shadow-blue-500/40 transform transition-all duration-300 hover:scale-105 active:scale-95"
                title={isOpen ? 'Fechar AxonIA' : 'Abrir AxonIA'}
            >
                <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {isOpen ? (
                    <ChatIcons.X className="w-6 h-6 animate-in spin-in-90 duration-300" />
                ) : (
                    <div className="relative">
                        <ChatIcons.Bot className="w-7 h-7" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"></div>
                    </div>
                )}

                {/* Tooltip on hover when closed */}
                {!isOpen && (
                    <div className="absolute right-full mr-4 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                        AxonIA
                        <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
                    </div>
                )}
            </button>
        </div>
    );
}
