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
