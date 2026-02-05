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
                    icon: <Trash2 className="w-8 h-8 text-red-600 relative z-10" />,
                    iconBg: 'bg-red-100/80',
                    iconRing: 'ring-red-100',
                    blobColor: 'bg-red-500',
                    confirmButton: 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20 text-white',
                    cancelButton: 'hover:bg-red-50 text-red-900',
                    titleColor: 'text-red-950'
                };
            default:
                return {
                    icon: <Info className="w-8 h-8 text-indigo-600 relative z-10" />,
                    iconBg: 'bg-indigo-100/80',
                    iconRing: 'ring-indigo-100',
                    blobColor: 'bg-indigo-500',
                    confirmButton: 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 text-white',
                    cancelButton: 'hover:bg-indigo-50 text-indigo-900',
                    titleColor: 'text-slate-900'
                };
        }
    };

    const styles = getVariantStyles();

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <AlertDialog open={open} onOpenChange={handleOpenChange}>
                <AlertDialogContent className="max-w-[400px] p-0 overflow-hidden border-none shadow-2xl bg-white rounded-[2rem] duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">

                    <div className="flex flex-col items-center p-8 text-center pt-10">
                        {/* Modern Static Icon Container */}
                        <div className={`mb-6 p-4 rounded-2xl ${styles.iconBg}`}>
                            {styles.icon}
                        </div>

                        <AlertDialogHeader className="space-y-3 w-full relative">
                            <AlertDialogTitle className={`text-2xl font-black tracking-tight ${styles.titleColor}`}>
                                {options.title || 'Confirmação'}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-base font-medium text-slate-500 leading-relaxed mx-auto max-w-[280px]">
                                {options.description || 'Tem certeza que deseja realizar esta ação?'}
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <div className="w-full mt-10 grid grid-cols-2 gap-4">
                            <AlertDialogCancel
                                onClick={handleCancel}
                                className={`w-full h-14 rounded-2xl border-0 bg-transparent hover:bg-slate-50 text-slate-500 font-bold tracking-wide transition-all duration-200 mt-0 text-sm uppercase`}
                            >
                                {options.cancelLabel || 'Cancelar'}
                            </AlertDialogCancel>

                            <AlertDialogAction
                                onClick={handleConfirm}
                                className={`w-full h-14 rounded-2xl font-bold tracking-wider text-sm uppercase transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 ${styles.confirmButton}`}
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
