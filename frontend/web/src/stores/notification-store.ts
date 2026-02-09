import { create } from 'zustand';
import { notificationsApi, type Notification } from '@/lib/api/notification';

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;

    fetchNotifications: () => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    archiveNotification: (id: string) => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,

    fetchNotifications: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await notificationsApi.list(0, 50);
            // Como o interceptor no client.ts já retorna response.data, 
            // a variável 'response' aqui já contém o payload { content: [], totalElements: X }
            const data = response as any;
            set({
                notifications: data.content || [],
                isLoading: false
            });
            await get().fetchUnreadCount();
        } catch (err) {
            set({ error: (err as Error).message, isLoading: false });
        }
    },

    fetchUnreadCount: async () => {
        try {
            const response = await notificationsApi.getUnreadCount();
            const data = response as any;
            set({ unreadCount: data.count || 0 });
        } catch (err) {
            console.error('Failed to fetch unread count:', err);
        }
    },

    markAsRead: async (id: string) => {
        try {
            await notificationsApi.markAsRead(id);
            set((state) => ({
                notifications: state.notifications.map((n) =>
                    n.id === id ? { ...n, isRead: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1),
            }));
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    },

    markAllAsRead: async () => {
        try {
            await notificationsApi.markAllAsRead();
            set((state) => ({
                notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
                unreadCount: 0,
            }));
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    },

    archiveNotification: async (id: string) => {
        try {
            await notificationsApi.archive(id);
            set((state) => ({
                notifications: state.notifications.filter((n) => n.id !== id),
            }));
            await get().fetchUnreadCount();
        } catch (err) {
            console.error('Failed to archive notification:', err);
        }
    },

    deleteNotification: async (id: string) => {
        try {
            await notificationsApi.delete(id);
            set((state) => ({
                notifications: state.notifications.filter((n) => n.id !== id),
            }));
            await get().fetchUnreadCount();
        } catch (err) {
            console.error('Failed to delete notification:', err);
        }
    },

    addNotification: (notification: Notification) => {
        set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
        }));
    },
}));
