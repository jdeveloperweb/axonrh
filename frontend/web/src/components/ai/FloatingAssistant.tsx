'use client';

import { useState } from 'react';
import ChatWidget from './ChatWidget';
import { ChatIcons } from './ChatIcons';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

export default function FloatingAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const { user } = useAuthStore();

    // Don't show the floating assistant on the dedicated assistant page
    // to avoid duplication or confusion
    if (pathname === '/assistant') {
        return null;
    }

    const context = {
        userName: user?.name,
        userRole: user?.roles?.[0],
        currentPage: pathname,
        companyName: 'AxonRH'
    };


    return (
        <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-[100] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 sm:mb-6 w-[calc(100vw-2rem)] sm:w-[550px] h-[calc(100vh-120px)] sm:h-[800px] max-h-[calc(100vh-80px)] sm:max-h-[calc(100vh-160px)] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom-10 fade-in zoom-in-95 duration-500 ease-out origin-bottom-right">
                    <ChatWidget
                        onClose={() => setIsOpen(false)}
                        className="h-full"
                        context={context}
                    />
                </div>
            )}

            {/* Toggle Button - Super Modernized */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "group relative flex items-center justify-center w-16 h-16 rounded-[1.5rem] transition-all duration-500 shadow-2xl active:scale-90",
                    isOpen
                        ? "bg-gray-900 text-white rotate-90"
                        : "bg-gradient-to-br from-primary to-primary-700 text-white hover:shadow-primary/40 hover:-translate-y-1 hover:scale-105"
                )}
                title={isOpen ? 'Fechar AxonIA' : 'Abrir AxonIA'}
            >
                {/* Glow effect */}
                {!isOpen && <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>}
                <div className="absolute inset-0 bg-white/10 rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-opacity"></div>

                {isOpen ? (
                    <ChatIcons.X className="w-7 h-7" />
                ) : (
                    <div className="relative">
                        <ChatIcons.Bot className="w-9 h-9" />
                        <div className="absolute top-0 -right-1 w-4 h-4 bg-success border-4 border-primary rounded-full animate-pulse shadow-lg ring-2 ring-white/10"></div>
                    </div>
                )}

                {/* Modern Tooltip */}
                {!isOpen && (
                    <div className="absolute right-full mr-6 px-4 py-2 bg-white text-gray-900 text-sm font-black rounded-2xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 translate-x-4 group-hover:translate-x-0 pointer-events-none shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-gray-100 whitespace-nowrap">
                        Olá! Como posso ajudar? ✨
                        <div className="absolute top-1/2 -right-2 -translate-y-1/2 border-[8px] border-transparent border-l-white"></div>
                    </div>
                )}
            </button>
        </div>
    );
}
