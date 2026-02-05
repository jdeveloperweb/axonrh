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
                    icon: <Trash2 className="w-10 h-10 text-red-600 relative z-10" />,
                    iconBg: 'bg-red-50',
                    iconRing: 'ring-red-100',
                    blobColor: 'bg-red-500',
                    confirmButton: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg shadow-red-500/30 text-white',
                    cancelButton: 'hover:bg-red-50 text-red-900',
                    titleColor: 'text-red-900'
                };
            default:
                return {
                    icon: <Info className="w-10 h-10 text-indigo-600 relative z-10" />,
                    iconBg: 'bg-indigo-50',
                    iconRing: 'ring-indigo-100',
                    blobColor: 'bg-indigo-500',
                    confirmButton: 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg shadow-indigo-500/30 text-white',
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
                <AlertDialogContent className="max-w-[400px] p-0 overflow-hidden border-none shadow-[0_20px_70px_-10px_rgba(0,0,0,0.15)] bg-white/95 backdrop-blur-2xl rounded-[2.5rem] ring-1 ring-white/60 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] duration-200">

                    {/* Abstract Background Element */}
                    <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-white/80 to-transparent pointer-events-none z-0" />

                    <div className="relative z-10 flex flex-col items-center p-8 text-center pt-12">
                        {/* Animated Icon Container */}
                        <div className="relative mb-6 group">
                            <div className={`absolute inset-0 ${styles.blobColor} blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500 rounded-full animate-pulse`} />
                            <div className={`relative w-24 h-24 rounded-[2rem] flex items-center justify-center ${styles.iconBg} border-[6px] border-white shadow-xl transform group-hover:scale-105 transition-transform duration-300 ease-out`}>
                                {styles.icon}
                            </div>
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
