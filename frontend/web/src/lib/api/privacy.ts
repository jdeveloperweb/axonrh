import { api } from './client';

export interface PrivacyPolicy {
  id: string;
  tenantId: string;
  content: string;
  version: number;
  updatedAt?: string;
}

export const privacyApi = {
  get: () => api.get<PrivacyPolicy>('/privacy'),
  save: (content: string) => api.post<PrivacyPolicy>('/privacy', { content }),
};
