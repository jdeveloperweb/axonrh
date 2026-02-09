import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth-store';

// ==================== Configuracao ====================

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8180/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Alias for backward compatibility
export const apiClient = api;

// ==================== Request Interceptor ====================

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken, user } = useAuthStore.getState();

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    if (config.headers) {
      if (user?.tenantId) {
        config.headers['X-Tenant-ID'] = user.tenantId;
      } else {
        const setupTenantId = typeof window !== 'undefined' ? localStorage.getItem('setup_tenant_id') : null;
        if (setupTenantId) {
          config.headers['X-Tenant-ID'] = setupTenantId;
        }
      }
      if (user?.id) {
        config.headers['X-User-Id'] = user.id;
      } else {
        const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
        if (storedUserId) {
          config.headers['X-User-Id'] = storedUserId;
        }
      }
      if (user?.email) {
        config.headers['X-User-Email'] = user.email;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== Response Interceptor ====================

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Se não for 401 ou já tentou retry, rejeita
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(parseApiError(error));
    }

    // Se já está refreshing, adiciona à fila
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          },
          reject: (err) => reject(err),
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const success = await useAuthStore.getState().refreshAccessToken();

      if (success) {
        const { accessToken } = useAuthStore.getState();
        processQueue(null, accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      }

      // Refresh falhou - faz logout
      processQueue(new Error('Session expired'));
      await useAuthStore.getState().logout();
      window.location.href = '/login?expired=true';

      return Promise.reject(new Error('Session expired'));
    } catch (refreshError) {
      processQueue(refreshError as Error);
      await useAuthStore.getState().logout();
      window.location.href = '/login?expired=true';

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ==================== Error Parser ====================

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

function parseApiError(error: AxiosError): Error {
  if (error.response?.data) {
    const data = error.response.data as ApiError;
    const message = data.message || 'Erro desconhecido';
    return new Error(message);
  }

  if (error.code === 'ECONNABORTED') {
    return new Error('Tempo limite excedido. Tente novamente.');
  }

  if (!error.response) {
    return new Error('Erro de conexão. Verifique sua internet.');
  }

  return new Error('Erro ao processar requisição');
}

// ==================== Helpers ====================

export const isAxiosError = axios.isAxiosError;

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Erro desconhecido';
}
