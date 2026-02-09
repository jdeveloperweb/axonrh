'use client';

import { useEffect, useState } from 'react';
import { useNotificationStore } from '@/stores/notification-store';
import {
    Bell,
    CheckCircle2,
    AlertTriangle,
    AlertCircle,
    Info,
    Clock,
    UserCheck,
    Megaphone,
    Search,
    Archive,
    Trash2,
    ExternalLink,
    Settings,
    CheckCheck,
    X,
    Eraser,
    ArchiveRestore
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNotificationTime, type NotificationType } from '@/lib/api/notification';
import Link from 'next/link';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';

interface NotificationCenterProps {
    onClose: () => void;
}

export function NotificationCenter({ onClose }: NotificationCenterProps) {
    const {
        archiveNotification,
        archiveAllNotifications,
        deleteNotification,
        deleteAllNotifications,
        showArchived,
        setShowArchived,
        notifications,
        isLoading,
        unreadCount,
        fetchNotifications,
        markAllAsRead,
        markAsRead
    } = useNotificationStore();

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{
        title: string;
        description: string;
        action: () => void;
        variant: 'primary' | 'danger';
    } | null>(null);

    useEffect(() => {
        fetchNotifications(showArchived);
    }, [fetchNotifications, showArchived]);

    const handleConfirm = (title: string, description: string, action: () => void, variant: 'primary' | 'danger' = 'primary') => {
        setConfirmAction({ title, description, action, variant });
        setConfirmOpen(true);
    };

    const getIcon = (type: NotificationType) => {
        const iconSize = "w-4 h-4";
        switch (type) {
            case 'SUCCESS': return <CheckCircle2 className={cn(iconSize, "text-emerald-500")} />;
            case 'WARNING': return <AlertTriangle className={cn(iconSize, "text-amber-500")} />;
            case 'ERROR': return <AlertCircle className={cn(iconSize, "text-rose-500")} />;
            case 'ALERT': return <AlertCircle className={cn(iconSize, "text-orange-500")} />;
            case 'REMINDER': return <Clock className={cn(iconSize, "text-blue-500")} />;
            case 'APPROVAL': return <UserCheck className={cn(iconSize, "text-violet-500")} />;
            case 'ANNOUNCEMENT': return <Megaphone className={cn(iconSize, "text-indigo-500")} />;
            default: return <Info className={cn(iconSize, "text-slate-400")} />;
        }
    };

    return (
        <>
            <div className="absolute right-0 top-full mt-2 w-[380px] bg-white dark:bg-slate-900 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 dark:border-slate-800 z-50 animate-scale-in flex flex-col max-h-[520px] overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="font-semibold text-base text-slate-900 dark:text-white">Notificações</h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {unreadCount > 0 ? `Você tem ${unreadCount} alertas pendentes` : 'Tudo em dia por aqui'}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {notifications.length > 0 && (
                        <div className="flex items-center gap-2">
                            {!showArchived && (
                                <>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={() => markAllAsRead()}
                                            className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 transition-all border border-blue-100 dark:border-blue-800"
                                        >
                                            <CheckCheck className="w-3 h-3" />
                                            Ler todas
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleConfirm(
                                            'Arquivar todas?',
                                            'Todas as notificações ativas serão movidas para o arquivo.',
                                            () => archiveAllNotifications()
                                        )}
                                        className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 hover:text-slate-700 dark:text-slate-400 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700"
                                    >
                                        <ArchiveRestore className="w-3 h-3" />
                                        Arquivar tudo
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => handleConfirm(
                                    'Excluir tudo?',
                                    `Deseja excluir permanentemente todas as notificações desta aba (${showArchived ? 'Arquivo' : 'Recentes'})? Esta ação não pode ser desfeita.`,
                                    () => deleteAllNotifications(),
                                    'danger'
                                )}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 px-2 py-1 rounded-md bg-rose-50 dark:bg-rose-900/20 transition-all border border-rose-100 dark:border-rose-800"
                            >
                                <Eraser className="w-3 h-3" />
                                Limpar tudo
                            </button>
                        </div>
                    )}
                </div>

                {/* Selector Tabs - Minimalist Style */}
                <div className="px-5 pt-3 flex gap-4 border-b border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => setShowArchived(false)}
                        className={cn(
                            "pb-2 text-xs font-bold transition-all relative",
                            !showArchived
                                ? "text-blue-600 dark:text-blue-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600 dark:after:bg-blue-400"
                                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        )}
                    >
                        Recentes
                    </button>
                    <button
                        onClick={() => setShowArchived(true)}
                        className={cn(
                            "pb-2 text-xs font-bold transition-all relative",
                            showArchived
                                ? "text-blue-600 dark:text-blue-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600 dark:after:bg-blue-400"
                                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        )}
                    >
                        Arquivo
                    </button>
                </div>

                {/* Search/Filter Bar (Simulated visual only for modern look) */}
                <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] text-slate-400 flex-1">Filtrar por nome ou tipo...</span>
                </div>

                {/* List Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {isLoading && notifications.length === 0 ? (
                        <div className="p-10 text-center space-y-3">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-xs text-slate-500">Buscando atualizações...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bell className="w-5 h-5 text-slate-300" />
                            </div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">Sem notificações</p>
                            <p className="text-xs text-slate-500 mt-1">Quando algo novo acontecer, avisaremos você.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50 dark:divide-slate-800">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 group relative flex gap-3",
                                        !notification.isRead && "bg-blue-50/30 dark:bg-blue-900/10"
                                    )}
                                >
                                    <div className="mt-0.5">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className={cn(
                                                "text-sm font-medium truncate pr-6",
                                                !notification.isRead ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"
                                            )}>
                                                {notification.title}
                                            </h4>
                                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap mt-0.5">
                                                {formatNotificationTime(notification.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                                            {notification.message}
                                        </p>

                                        {notification.actionUrl && (
                                            <Link
                                                href={notification.actionUrl}
                                                onClick={() => {
                                                    markAsRead(notification.id);
                                                    onClose();
                                                }}
                                                className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all hover:gap-1.5"
                                            >
                                                Ver detalhes
                                                <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        )}
                                    </div>

                                    {/* Minimal Quick Actions hover menu */}
                                    <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        {showArchived ? (
                                            <button
                                                onClick={() => deleteNotification(notification.id)}
                                                className="p-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-slate-400 hover:text-rose-600 shadow-sm transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        ) : (
                                            <>
                                                {!notification.isRead && (
                                                    <button
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="p-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-slate-400 hover:text-emerald-600 shadow-sm transition-colors"
                                                        title="Lido"
                                                    >
                                                        <CheckCheck className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => archiveNotification(notification.id)}
                                                    className="p-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-slate-400 hover:text-blue-600 shadow-sm transition-colors"
                                                    title="Arquivar"
                                                >
                                                    <Archive className="w-3.5 h-3.5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer - Minimalist */}
                <div className="bg-slate-50 dark:bg-slate-800/80 p-3 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                    <Link
                        href="/settings/notifications"
                        onClick={onClose}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                    >
                        <Settings className="w-3 h-3" />
                        Gerenciar preferências
                    </Link>
                </div>
            </div>

            {/* System Confirmation Dialog */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent className="w-[95vw] max-w-[400px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmAction?.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="text-xs font-bold px-4 py-2 rounded-md border border-slate-200 hover:bg-slate-100 transition-colors">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className={cn(
                                "text-xs font-bold px-4 py-2 rounded-md transition-colors",
                                confirmAction?.variant === 'danger'
                                    ? "bg-rose-600 text-white hover:bg-rose-700"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                            )}
                            onClick={() => {
                                confirmAction?.action();
                                setConfirmOpen(false);
                            }}
                        >
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
