'use client';

import { useEffect } from 'react';
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
    Check,
    Archive,
    Trash2,
    ExternalLink,
    Settings,
    CheckCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNotificationTime, type NotificationType } from '@/lib/api/notification';
import Link from 'next/link';

interface NotificationCenterProps {
    onClose: () => void;
}

export function NotificationCenter({ onClose }: NotificationCenterProps) {
    const {
        archiveNotification,
        deleteNotification,
        showArchived,
        setShowArchived,
        notifications,
        isLoading,
        unreadCount,
        fetchNotifications,
        markAllAsRead,
        markAsRead
    } = useNotificationStore();

    useEffect(() => {
        fetchNotifications(showArchived);
    }, [fetchNotifications, showArchived]);

    const getIcon = (type: NotificationType) => {
        const iconSize = "w-5 h-5";
        switch (type) {
            case 'SUCCESS': return <div className="p-2 bg-green-500/10 rounded-full"><CheckCircle2 className={cn(iconSize, "text-green-500")} /></div>;
            case 'WARNING': return <div className="p-2 bg-yellow-500/10 rounded-full"><AlertTriangle className={cn(iconSize, "text-yellow-500")} /></div>;
            case 'ERROR': return <div className="p-2 bg-red-500/10 rounded-full"><AlertCircle className={cn(iconSize, "text-red-500")} /></div>;
            case 'ALERT': return <div className="p-2 bg-orange-500/10 rounded-full"><AlertCircle className={cn(iconSize, "text-orange-500")} /></div>;
            case 'REMINDER': return <div className="p-2 bg-blue-500/10 rounded-full"><Clock className={cn(iconSize, "text-blue-500")} /></div>;
            case 'APPROVAL': return <div className="p-2 bg-purple-500/10 rounded-full"><UserCheck className={cn(iconSize, "text-purple-500")} /></div>;
            case 'ANNOUNCEMENT': return <div className="p-2 bg-indigo-500/10 rounded-full"><Megaphone className={cn(iconSize, "text-indigo-500")} /></div>;
            default: return <div className="p-2 bg-gray-500/10 rounded-full"><Info className={cn(iconSize, "text-gray-500")} /></div>;
        }
    };

    return (
        <div className="absolute right-0 top-full mt-3 w-80 sm:w-[420px] bg-[var(--color-surface)]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-[var(--color-border)]/50 z-50 animate-scale-in flex flex-col max-h-[36rem] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[var(--color-border)]/50 flex items-center justify-between bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-variant)]/30">
                <div>
                    <h3 className="font-bold text-xl tracking-tight text-[var(--color-text-primary)]">Notificações</h3>
                    {unreadCount > 0 && (
                        <p className="text-xs font-medium text-[var(--color-text-secondary)] mt-0.5">
                            Você tem <span className="text-[var(--color-primary)] font-bold">{unreadCount}</span> mensagens não lidas
                        </p>
                    )}
                </div>
                {unreadCount > 0 && !showArchived && (
                    <button
                        onClick={() => markAllAsRead()}
                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all"
                    >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Ler todas
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex p-1.5 bg-[var(--color-surface-variant)]/20 mx-4 mt-4 rounded-xl">
                <button
                    onClick={() => setShowArchived(false)}
                    className={cn(
                        "flex-1 py-2 text-xs font-bold transition-all rounded-lg",
                        !showArchived
                            ? "bg-[var(--color-surface)] shadow-sm text-[var(--color-primary)]"
                            : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]/50"
                    )}
                >
                    Ativas
                </button>
                <button
                    onClick={() => setShowArchived(true)}
                    className={cn(
                        "flex-1 py-2 text-xs font-bold transition-all rounded-lg",
                        showArchived
                            ? "bg-[var(--color-surface)] shadow-sm text-[var(--color-primary)]"
                            : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]/50"
                    )}
                >
                    Arquivadas
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 mt-2 pb-2">
                {isLoading && notifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-10 h-10 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-sm font-medium text-[var(--color-text-secondary)]">Carregando notificações...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-[var(--color-surface-variant)]/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-[var(--color-text-secondary)]/30" />
                        </div>
                        <p className="text-sm font-medium text-[var(--color-text-secondary)]">Sua caixa está limpa!</p>
                        <p className="text-[10px] text-[var(--color-text-disabled)] mt-1">Nenhuma notificação por aqui.</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={cn(
                                    "p-4 rounded-xl transition-all hover:bg-[var(--color-surface-variant)]/50 group relative",
                                    !notification.isRead && "bg-[var(--color-primary)]/[0.03]"
                                )}
                            >
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                {!notification.isRead && (
                                                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
                                                )}
                                                <h4 className={cn(
                                                    "text-sm font-bold truncate pr-4",
                                                    !notification.isRead ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"
                                                )}>
                                                    {notification.title}
                                                </h4>
                                            </div>
                                            <span className="text-[10px] font-medium text-[var(--color-text-secondary)] whitespace-nowrap group-hover:opacity-0 transition-opacity ml-2">
                                                {formatNotificationTime(notification.createdAt)}
                                            </span>
                                        </div>
                                        <p className={cn(
                                            "text-sm mb-3 line-clamp-2 leading-relaxed",
                                            !notification.isRead ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-disabled)]"
                                        )}>
                                            {notification.message}
                                        </p>

                                        {notification.actionUrl && (
                                            <Link
                                                href={notification.actionUrl}
                                                onClick={() => {
                                                    markAsRead(notification.id);
                                                    onClose();
                                                }}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10 transition-all border border-transparent hover:border-[var(--color-primary)]/20 shadow-sm"
                                            >
                                                Ver detalhes
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all bg-[var(--color-surface)] shadow-xl rounded-xl border border-[var(--color-border)] p-1 z-10 transition-all">
                                    {showArchived ? (
                                        <button
                                            onClick={() => deleteNotification(notification.id)}
                                            className="p-2 rounded-lg hover:bg-red-50 text-[var(--color-text-secondary)] hover:text-red-600 transition-colors"
                                            title="Excluir permanentemente"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <>
                                            {!notification.isRead && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="p-2 rounded-lg hover:bg-green-50 text-[var(--color-text-secondary)] hover:text-green-600 transition-colors"
                                                    title="Marcar como lida"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => archiveNotification(notification.id)}
                                                className="p-2 rounded-lg hover:bg-orange-50 text-[var(--color-text-secondary)] hover:text-orange-600 transition-colors"
                                                title="Arquivar"
                                            >
                                                <Archive className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--color-border)]/50 bg-[var(--color-surface-variant)]/10">
                <Link
                    href="/settings/notifications"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface)] transition-all border border-transparent hover:border-[var(--color-border)]/50"
                >
                    <Settings className="w-3.5 h-3.5" />
                    Configurações de notificações
                </Link>
            </div>
        </div>
    );
}
