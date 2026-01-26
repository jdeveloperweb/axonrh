import { apiClient } from './client';

// ==================== Types ====================

export interface ThemeConfig {
  id: string;
  tenantId: string;
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textPrimaryColor: string;
  textSecondaryColor: string;
  darkPrimaryColor?: string;
  darkSecondaryColor?: string;
  darkBackgroundColor?: string;
  darkSurfaceColor?: string;
  darkTextPrimaryColor?: string;
  darkTextSecondaryColor?: string;
  loginBackgroundUrl?: string;
  loginWelcomeMessage?: string;
  loginFooterText?: string;
  showPoweredBy: boolean;
  customCss?: string;
  version: number;
}

export interface ThemeConfigRequest {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textPrimaryColor?: string;
  textSecondaryColor?: string;
  darkPrimaryColor?: string;
  darkSecondaryColor?: string;
  darkBackgroundColor?: string;
  darkSurfaceColor?: string;
  darkTextPrimaryColor?: string;
  darkTextSecondaryColor?: string;
  loginWelcomeMessage?: string;
  loginFooterText?: string;
  showPoweredBy?: boolean;
  customCss?: string;
  changeDescription?: string;
}

export interface CssVariables {
  cssContent: string;
  lightTheme: Record<string, string>;
  darkTheme: Record<string, string>;
  highContrastTheme: Record<string, string>;
  version: number;
  cacheKey: string;
}

export interface LogoUploadResponse {
  url: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  message: string;
}

// ==================== API ====================

export const configApi = {
  /**
   * Busca configuracao de tema do tenant.
   */
  getThemeConfig: async (tenantId: string): Promise<ThemeConfig> => {
    const response = await apiClient.get<ThemeConfig>(`/config/theme/${tenantId}`);
    return response.data;
  },

  /**
   * Atualiza configuracao de tema.
   */
  updateThemeConfig: async (tenantId: string, config: ThemeConfigRequest): Promise<ThemeConfig> => {
    const response = await apiClient.put<ThemeConfig>(`/config/theme/${tenantId}`, config);
    return response.data;
  },

  /**
   * Busca CSS gerado.
   */
  getCss: async (tenantId: string): Promise<string> => {
    const response = await apiClient.get<string>(`/config/theme/${tenantId}/css`, {
      headers: { Accept: 'text/css' },
    });
    return response.data;
  },

  /**
   * Busca variaveis CSS como JSON.
   */
  getCssVariables: async (tenantId: string): Promise<CssVariables> => {
    const response = await apiClient.get<CssVariables>(`/config/theme/${tenantId}/variables`);
    return response.data;
  },

  /**
   * Valida contraste entre cores.
   */
  validateContrast: async (foreground: string, background: string): Promise<boolean> => {
    const response = await apiClient.get<{ valid: boolean }>('/config/theme/validate-contrast', {
      params: { foreground, background },
    });
    return response.data.valid;
  },

  /**
   * Rollback para versao anterior.
   */
  rollbackTheme: async (tenantId: string, version: number): Promise<ThemeConfig> => {
    const response = await apiClient.post<ThemeConfig>(`/config/theme/${tenantId}/rollback/${version}`);
    return response.data;
  },

  /**
   * Upload de logo.
   */
  uploadLogo: async (tenantId: string, file: File): Promise<LogoUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<LogoUploadResponse>(`/config/logo/${tenantId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Upload de logo dark.
   */
  uploadLogoDark: async (tenantId: string, file: File): Promise<LogoUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<LogoUploadResponse>(`/config/logo/${tenantId}/dark`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Upload de favicon.
   */
  uploadFavicon: async (tenantId: string, file: File): Promise<LogoUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<LogoUploadResponse>(`/config/favicon/${tenantId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Upload de imagem de fundo do login.
   */
  uploadLoginBackground: async (tenantId: string, file: File): Promise<LogoUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<LogoUploadResponse>(`/config/login-background/${tenantId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Remove logo.
   */
  deleteLogo: async (tenantId: string): Promise<void> => {
    await apiClient.delete(`/config/logo/${tenantId}`);
  },
};
