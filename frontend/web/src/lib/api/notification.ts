import { api } from './client';

// ==================== Types ====================

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ALERT' | 'REMINDER' | 'APPROVAL' | 'ANNOUNCEMENT';
export type ActionType = 'LINK' | 'ROUTE' | 'MODAL' | 'APPROVE' | 'REJECT' | 'DOWNLOAD';
export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type DeviceType = 'ANDROID' | 'IOS' | 'WEB';
export type EmailStatus = 'PENDING' | 'QUEUED' | 'SENDING' | 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'COMPLAINED' | 'FAILED';

export interface Notification {
  id: string;
  userId: string;
  employeeId?: string;
  type: NotificationType;
  category?: string;
  title: string;
  message: string;
  icon?: string;
  imageUrl?: string;
  actionType?: ActionType;
  actionUrl?: string;
  actionData?: string;
  priority: Priority;
  isRead: boolean;
  readAt?: string;
  isArchived: boolean;
  archivedAt?: string;
  expiresAt?: string;
  sourceType?: string;
  sourceId?: string;
  createdAt: string;
}

export interface EmailTemplate {
  id: string;
  code: string;
  name: string;
  description?: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  category?: string;
  variables?: string;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  templateCode?: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  status: EmailStatus;
  messageId?: string;
  errorMessage?: string;
  retryCount: number;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  createdAt: string;
}

export interface PushToken {
  id: string;
  userId: string;
  employeeId?: string;
  token: string;
  deviceType: DeviceType;
  deviceName?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  isActive: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  id: string;
  emailEnabled: boolean;
  emailDigestFrequency: 'INSTANT' | 'DAILY' | 'WEEKLY';
  emailDigestTime?: string;
  pushEnabled: boolean;
  pushSoundEnabled: boolean;
  pushVibrationEnabled: boolean;
  inAppEnabled: boolean;
  inAppSoundEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  categoryPreferences?: Record<string, { email: boolean; push: boolean; inApp: boolean }>;
}

export interface NotificationCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  defaultEmailEnabled: boolean;
  defaultPushEnabled: boolean;
  defaultInAppEnabled: boolean;
  isSystem: boolean;
  displayOrder: number;
}

// ==================== Notifications API ====================

export const notificationsApi = {
  list: (page = 0, size = 20) =>
    api.get<{ content: Notification[]; totalElements: number }>(`/notifications?page=${page}&size=${size}`),

  getUnread: () =>
    api.get<Notification[]>('/notifications/unread'),

  getUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread/count'),

  create: (data: {
    userId: string;
    employeeId?: string;
    type: NotificationType;
    category?: string;
    title: string;
    message: string;
    icon?: string;
    imageUrl?: string;
    actionType?: ActionType;
    actionUrl?: string;
    actionData?: string;
    priority?: Priority;
    sourceType?: string;
    sourceId?: string;
    sendPush?: boolean;
  }) => api.post<Notification>('/notifications', data),

  markAsRead: (id: string) =>
    api.post<Notification>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.post<void>('/notifications/read-all'),

  archive: (id: string) =>
    api.post<Notification>(`/notifications/${id}/archive`),

  delete: (id: string) =>
    api.delete(`/notifications/${id}`),

  sendBulk: (data: {
    userIds: string[];
    type: NotificationType;
    category?: string;
    title: string;
    message: string;
    sendPush?: boolean;
  }) => api.post<void>('/notifications/bulk', data),
};

// ==================== Email API ====================

export const emailApi = {
  send: (data: {
    templateCode?: string;
    recipientEmail: string;
    recipientName?: string;
    subject?: string;
    bodyHtml?: string;
    bodyText?: string;
    variables?: Record<string, string>;
  }) => api.post<void>('/notifications/email/send', data),

  retry: (emailLogId: string) =>
    api.post<void>(`/notifications/email/${emailLogId}/retry`),

  listTemplates: () =>
    api.get<EmailTemplate[]>('/notifications/email/templates'),

  createTemplate: (template: Partial<EmailTemplate>) =>
    api.post<EmailTemplate>('/notifications/email/templates', template),

  getHistory: (recipientEmail?: string) =>
    api.get<EmailLog[]>(`/notifications/email/history${recipientEmail ? `?recipientEmail=${recipientEmail}` : ''}`),
};

// ==================== Push API ====================

export const pushApi = {
  registerToken: (data: {
    employeeId?: string;
    token: string;
    deviceType: DeviceType;
    deviceName?: string;
    deviceModel?: string;
    osVersion?: string;
    appVersion?: string;
  }) => api.post<PushToken>('/notifications/push/register', data),

  unregisterToken: (token: string) =>
    api.delete('/notifications/push/unregister', { data: { token } }),

  send: (data: {
    userId?: string;
    userIds?: string[];
    topic?: string;
    title: string;
    body: string;
    data?: Record<string, string>;
    imageUrl?: string;
  }) => api.post<void>('/notifications/push/send', data),

  subscribeToTopic: (topic: string) =>
    api.post<void>('/notifications/push/subscribe', { topic }),

  unsubscribeFromTopic: (topic: string) =>
    api.post<void>('/notifications/push/unsubscribe', { topic }),
};

// ==================== Preferences API ====================

export const preferencesApi = {
  get: () =>
    api.get<NotificationPreferences>('/notifications/preferences'),

  update: (preferences: Partial<NotificationPreferences>) =>
    api.put<NotificationPreferences>('/notifications/preferences', preferences),

  getCategories: () =>
    api.get<NotificationCategory[]>('/notifications/categories'),

  updateCategoryPreference: (categoryCode: string, preferences: { email?: boolean; push?: boolean; inApp?: boolean }) =>
    api.put<void>(`/notifications/preferences/categories/${categoryCode}`, preferences),
};

// ==================== WebSocket Hook ====================

export interface UseNotificationSocketOptions {
  onNotification?: (notification: Notification) => void;
  onUpdate?: (update: { type: string; data: unknown }) => void;
}

export function createNotificationSocket(userId: string, _options: UseNotificationSocketOptions = {}) {
  // In production, this would connect to WebSocket
  // For now, return a mock implementation
  const socket = {
    connect: () => {
      console.log('Connecting to notification WebSocket for user:', userId);
      // Suppress unused variable warning by effectively "using" it
      if (_options.onNotification) {
        /* placeholder for future implementation */
      }
    },
    disconnect: () => {
      console.log('Disconnecting from notification WebSocket');
    },
    isConnected: () => false,
  };

  return socket;
}

// ==================== Notification Helpers ====================

export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'SUCCESS':
      return 'check-circle';
    case 'WARNING':
      return 'alert-triangle';
    case 'ERROR':
      return 'x-circle';
    case 'ALERT':
      return 'alert-circle';
    case 'REMINDER':
      return 'clock';
    case 'APPROVAL':
      return 'user-check';
    case 'ANNOUNCEMENT':
      return 'megaphone';
    default:
      return 'info';
  }
}

export function getNotificationColor(type: NotificationType): string {
  switch (type) {
    case 'SUCCESS':
      return 'text-green-600';
    case 'WARNING':
      return 'text-yellow-600';
    case 'ERROR':
      return 'text-red-600';
    case 'ALERT':
      return 'text-orange-600';
    case 'APPROVAL':
      return 'text-purple-600';
    case 'ANNOUNCEMENT':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
}

export function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString('pt-BR');
}
