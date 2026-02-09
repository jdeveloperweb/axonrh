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
    MoreVertical,
    Trash2,
    Archive,
    ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNotificationTime, type NotificationType } from '@/lib/api/notification';
import Link from 'next/link';

interface NotificationCenterProps {
    onClose: () => void;
}

export function NotificationCenter({ onClose }: NotificationCenterProps) {
    const {
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        archiveNotification
    } = useNotificationStore();

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'SUCCESS': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'WARNING': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'ERROR': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'ALERT': return <AlertCircle className="w-5 h-5 text-orange-500" />;
            case 'REMINDER': return <Clock className="w-5 h-5 text-blue-500" />;
            case 'APPROVAL': return <UserCheck className="w-5 h-5 text-purple-500" />;
            case 'ANNOUNCEMENT': return <Megaphone className="w-5 h-5 text-indigo-500" />;
            default: return <Info className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-2xl border border-[var(--color-border)] z-50 animate-scale-in flex flex-col max-h-[32rem]">
            {/* Header */}
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface-variant)]/30">
                <div>
                    <h3 className="font-bold text-lg">Notificações</h3>
                    {unreadCount > 0 && (
                        <p className="text-xs text-[var(--color-text-secondary)]">
                            Você tem {unreadCount} mensagens não lidas
                        </p>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={() => markAllAsRead()}
                        className="text-xs text-[var(--color-primary)] hover:underline font-medium"
                    >
                        Ler todas
                    </button>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading && notifications.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm text-[var(--color-text-secondary)]">Carregando...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <Bell className="w-12 h-12 text-[var(--color-text-secondary)]/20 mx-auto mb-4" />
                        <p className="text-[var(--color-text-secondary)]">Nenhuma notificação por aqui.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--color-border)]">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={cn(
                                    "p-4 transition-colors hover:bg-[var(--color-surface-variant)]/50 group relative",
                                    !notification.isRead && "bg-[var(--color-primary)]/5"
                                )}
                            >
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 mt-1">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={cn(
                                                "text-sm font-semibold truncate pr-4",
                                                !notification.isRead ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"
                                            )}>
                                                {notification.title}
                                            </h4>
                                            <span className="text-[10px] text-[var(--color-text-secondary)] whitespace-nowrap">
                                                {formatNotificationTime(notification.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-2">
                                            {notification.message}
                                        </p>

                                        {notification.actionUrl && (
                                            <Link
                                                href={notification.actionUrl}
                                                onClick={() => {
                                                    markAsRead(notification.id);
                                                    onClose();
                                                }}
                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] hover:gap-2 transition-all"
                                            >
                                                Ver detalhes
                                                <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    {!notification.isRead && (
                                        <button
                                            onClick={() => markAsRead(notification.id)}
                                            className="p-1.5 rounded-full hover:bg-[var(--color-surface-variant)] text-[var(--color-text-secondary)] hover:text-green-600"
                                            title="Marcar como lida"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => archiveNotification(notification.id)}
                                        className="p-1.5 rounded-full hover:bg-[var(--color-surface-variant)] text-[var(--color-text-secondary)] hover:text-orange-600"
                                        title="Arquivar"
                                    >
                                        <Archive className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[var(--color-border)] text-center bg-[var(--color-surface-variant)]/10">
                <Link
                    href="/settings/notifications"
                    onClick={onClose}
                    className="text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                >
                    Configurações de notificações
                </Link>
            </div>
        </div>
    );
}
