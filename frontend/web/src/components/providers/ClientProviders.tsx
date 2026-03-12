'use client';

import React from 'react';
import { ConfirmProvider } from './ConfirmProvider';
import { NotificationProvider } from './NotificationProvider';
import { ToastProvider } from '../ui/toast';
import { Toaster } from 'sonner';

interface ClientProvidersProps {
    children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
    React.useEffect(() => {
        if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(
                    (registration) => {
                        console.log('SW registered: ', registration);
                    },
                    (registrationError) => {
                        console.log('SW registration failed: ', registrationError);
                    }
                );
            });
        }
    }, []);

    return (
        <ToastProvider>
            <ConfirmProvider>
                <NotificationProvider>
                    {children}
                    <Toaster richColors position="top-right" />
                </NotificationProvider>
            </ConfirmProvider>
        </ToastProvider>
    );
}
