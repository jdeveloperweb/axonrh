import { apiClient } from './client';

// ==================== Types ====================

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  roles: string[];
  permissions: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
  totpCode?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

// ==================== API ====================

export const authApi = {
  /**
   * Realiza login com email e senha.
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse, LoginResponse>('/auth/login', credentials);
  },

  /**
   * Renova o access token usando o refresh token.
   */
  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    return apiClient.post<RefreshResponse, RefreshResponse>('/auth/refresh', {
      refreshToken,
    });
  },

  /**
   * Realiza logout invalidando o refresh token.
   */
  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  /**
   * Busca informacoes do usuario autenticado.
   */
  me: async (): Promise<User> => {
    return apiClient.get<User, User>('/auth/me');
  },

  /**
   * Inicia setup de 2FA.
   */
  setup2FA: async (): Promise<{ secret: string; qrCodeUrl: string }> => {
    return apiClient.post<unknown, { secret: string; qrCodeUrl: string }>('/auth/2fa/setup');
  },

  /**
   * Confirma ativacao de 2FA.
   */
  confirm2FA: async (code: string): Promise<{ backupCodes: string[] }> => {
    return apiClient.post<unknown, { backupCodes: string[] }>('/auth/2fa/confirm', { code });
  },

  /**
   * Desativa 2FA.
   */
  disable2FA: async (password: string): Promise<void> => {
    await apiClient.post('/auth/2fa/disable', { password });
  },

  /**
   * Solicita reset de senha.
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    await apiClient.post('/auth/password/reset-request', { email });
  },

  /**
   * Confirma reset de senha.
   */
  confirmPasswordReset: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/password/reset-confirm', { token, newPassword });
  },

  /**
   * Altera senha do usuario logado.
   */
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/password/change', { currentPassword, newPassword });
  },
};
