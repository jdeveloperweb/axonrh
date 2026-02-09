'use client';

import React, { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationStore } from '@/stores/notification-store';
import { createNotificationSocket } from '@/lib/api/notification';
import { toast } from 'sonner';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated } = useAuthStore();
    const { addNotification } = useNotificationStore();
    const socketRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize audio
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audioRef.current.volume = 0.5;
    }, []);

    useEffect(() => {
        if (isAuthenticated && user?.id) {
            if (!socketRef.current) {
                socketRef.current = createNotificationSocket(user.id, {
                    onNotification: (notification) => {
                        // 1. Add to store
                        addNotification(notification);

                        // 2. Play sound
                        if (audioRef.current) {
                            audioRef.current.play().catch(e => console.warn('Audio play failed:', e));
                        }

                        // 3. Show toast
                        toast.info(notification.title, {
                            description: notification.message,
                            action: notification.actionUrl ? {
                                label: 'Ver',
                                onClick: () => {
                                    if (notification.actionUrl) {
                                        window.location.href = notification.actionUrl;
                                    }
                                }
                            } : undefined,
                        });
                    }
                });
                socketRef.current.connect();
            }
        } else {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [isAuthenticated, user?.id, addNotification]);

    return <>{children}</>;
}
