'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Trash2, Info } from 'lucide-react';

interface ConfirmOptions {
    title?: ReactNode;
    description?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'destructive';
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({});
    const [resolveRef, setResolveRef] = useState<(value: boolean) => void>(() => { });

    const confirm = useCallback((opts: ConfirmOptions) => {
        setOptions(opts);
        setOpen(true);
        return new Promise<boolean>((resolve) => {
            setResolveRef(() => resolve);
        });
    }, []);

    const handleConfirm = () => {
        setOpen(false);
        resolveRef(true);
    };

    const handleCancel = () => {
        setOpen(false);
        resolveRef(false);
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            handleCancel();
        }
        setOpen(newOpen);
    };

    // Determine icon and colors based on variant
    const getVariantStyles = () => {
        switch (options.variant) {
            case 'destructive':
                return {
                    icon: <Trash2 className="w-8 h-8 text-red-600" />,
                    bgIcon: 'bg-red-100',
                    buttonClass: 'bg-red-600 hover:bg-red-700 shadow-md shadow-red-200',
                    borderClass: 'border-red-100'
                };
            default:
                return {
                    icon: <Info className="w-8 h-8 text-[var(--color-primary)]" />,
                    bgIcon: 'bg-[var(--color-primary)]/10',
                    buttonClass: 'bg-[var(--color-primary)] hover:opacity-90 shadow-md shadow-blue-200',
                    borderClass: 'border-blue-100'
                };
        }
    };

    const styles = getVariantStyles();

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <AlertDialog open={open} onOpenChange={handleOpenChange}>
                <AlertDialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl bg-white/90 backdrop-blur-xl rounded-[2rem] ring-1 ring-black/5">
                    {/* Decorative top gradient */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white to-transparent opacity-50 pointer-events-none" />

                    <div className="flex flex-col items-center p-8 text-center pt-10">
                        {/* Animated Icon Container */}
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 ${styles.bgIcon} ${styles.borderClass} border-4 ring-4 ring-white shadow-xl animate-in zoom-in-50 duration-300`}>
                            {styles.icon}
                        </div>

                        <AlertDialogHeader className="space-y-3 w-full">
                            <AlertDialogTitle className="text-2xl font-black tracking-tight text-gray-900">
                                {options.title || 'Confirmação'}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-base font-medium text-gray-500 leading-relaxed max-w-xs mx-auto">
                                {options.description || 'Tem certeza que deseja realizar esta ação?'}
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <div className="w-full mt-8 grid grid-cols-2 gap-3">
                            <AlertDialogCancel
                                onClick={handleCancel}
                                className="w-full h-12 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold tracking-wide transition-all duration-200"
                            >
                                {options.cancelLabel || 'Cancelar'}
                            </AlertDialogCancel>

                            <AlertDialogAction
                                onClick={handleConfirm}
                                className={`w-full h-12 rounded-xl font-bold tracking-wide text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${styles.buttonClass}`}
                            >
                                {options.confirmLabel || 'Confirmar'}
                            </AlertDialogAction>
                        </div>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (context === undefined) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
}
