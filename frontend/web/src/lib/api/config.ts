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
  extraSettings?: Record<string, any>;
  version: number;
}

export interface ThemeConfigRequest {
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
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
  extraSettings?: Record<string, any>;
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
    return apiClient.get<ThemeConfig, ThemeConfig>(`/config/theme/${tenantId}`);
  },

  /**
   * Atualiza configuracao de tema.
   */
  updateThemeConfig: async (tenantId: string, config: ThemeConfigRequest): Promise<ThemeConfig> => {
    return apiClient.put<ThemeConfigRequest, ThemeConfig>(`/config/theme/${tenantId}`, config);
  },

  /**
   * Busca CSS gerado.
   */
  getCss: async (tenantId: string): Promise<string> => {
    return apiClient.get<string, string>(`/config/theme/${tenantId}/css`, {
      headers: { Accept: 'text/css' },
    });
  },

  /**
   * Busca variaveis CSS como JSON.
   */
  getCssVariables: async (tenantId: string): Promise<CssVariables> => {
    return apiClient.get<CssVariables, CssVariables>(`/config/theme/${tenantId}/variables`);
  },

  /**
   * Valida contraste entre cores.
   */
  validateContrast: async (foreground: string, background: string): Promise<boolean> => {
    const response = await apiClient.get<unknown, { valid: boolean }>('/config/theme/validate-contrast', {
      params: { foreground, background },
    });
    return response.valid;
  },

  /**
   * Rollback para versao anterior.
   */
  rollbackTheme: async (tenantId: string, version: number): Promise<ThemeConfig> => {
    return apiClient.post<unknown, ThemeConfig>(`/config/theme/${tenantId}/rollback/${version}`);
  },

  /**
   * Upload de logo.
   */
  uploadLogo: async (tenantId: string, file: File): Promise<LogoUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    // Não definir Content-Type manualmente - deixar o axios configurar o boundary automaticamente
    return apiClient.post<FormData, LogoUploadResponse>(`/config/logo/${tenantId}`, formData);
  },

  /**
   * Upload de logo dark.
   */
  uploadLogoDark: async (tenantId: string, file: File): Promise<LogoUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    // Não definir Content-Type manualmente - deixar o axios configurar o boundary automaticamente
    return apiClient.post<FormData, LogoUploadResponse>(`/config/logo/${tenantId}/dark`, formData);
  },

  /**
   * Upload de favicon.
   */
  uploadFavicon: async (tenantId: string, file: File): Promise<LogoUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    // Não definir Content-Type manualmente - deixar o axios configurar o boundary automaticamente
    return apiClient.post<FormData, LogoUploadResponse>(`/config/favicon/${tenantId}`, formData);
  },

  /**
   * Upload de imagem de fundo do login.
   */
  uploadLoginBackground: async (tenantId: string, file: File): Promise<LogoUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    // Não definir Content-Type manualmente - deixar o axios configurar o boundary automaticamente
    return apiClient.post<FormData, LogoUploadResponse>(`/config/login-background/${tenantId}`, formData);
  },

  /**
   * Remove logo.
   */
  deleteLogo: async (tenantId: string): Promise<void> => {
    await apiClient.delete(`/config/logo/${tenantId}`);
  },
};
