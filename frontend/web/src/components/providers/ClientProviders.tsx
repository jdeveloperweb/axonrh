'use client';

import React from 'react';
import { ConfirmProvider } from './ConfirmProvider';

interface ClientProvidersProps {
    children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
    return (
        <ConfirmProvider>
            {children}
        </ConfirmProvider>
    );
}
