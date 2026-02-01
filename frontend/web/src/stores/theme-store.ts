import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'high-contrast' | 'system';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
}

interface TenantTheme {
  tenantId: string;
  logoUrl?: string;
  logoWidth?: number;
  logoDarkUrl?: string;
  faviconUrl?: string;
  colors: ThemeColors;
  darkColors?: ThemeColors;
  customCss?: string;
  baseFontSize?: number;
}

interface ThemeState {
  theme: Theme;
  tenantTheme: TenantTheme | null;
  isLoading: boolean;

  // Actions
  setTheme: (theme: Theme) => void;
  loadTheme: () => void;
  fetchBranding: () => Promise<void>;
  setTenantTheme: (theme: TenantTheme) => void;
  applyTenantColors: (colors: ThemeColors) => void;
  resetToDefault: () => void;
}

const defaultColors: ThemeColors = {
  primary: '#1976D2',
  secondary: '#424242',
  accent: '#FF4081',
  background: '#FFFFFF',
  surface: '#FAFAFA',
  textPrimary: '#212121',
  textSecondary: '#757575',
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      tenantTheme: null,
      isLoading: false,

      setTheme: (theme: Theme) => {
        set({ theme });
        applyThemeToDocument(theme);
      },

      loadTheme: () => {
        const { theme, tenantTheme } = get();
        applyThemeToDocument(theme);

        if (tenantTheme) {
          applyColorsToDocument(tenantTheme.colors);

          // Aplica configurações de fonte
          if (tenantTheme.baseFontSize) {
            applyFontSize(tenantTheme.baseFontSize);
          }

          // Aplica CSS customizado
          if (tenantTheme.customCss) {
            applyCustomCss(tenantTheme.customCss);
          }

          // Atualiza favicon
          if (tenantTheme.faviconUrl) {
            updateFavicon(tenantTheme.faviconUrl);
          }
        }
      },

      fetchBranding: async () => {
        try {
          // Tenta pegar o tenantId de várias fontes
          let tenantId = localStorage.getItem('tenantId') || localStorage.getItem('setup_tenant_id');

          // Se não estiver no localStorage, tenta extrair do auth-store (Zustand persistido)
          if (!tenantId) {
            const authStorage = localStorage.getItem('axonrh-auth');
            if (authStorage) {
              try {
                const parsed = JSON.parse(authStorage);
                tenantId = parsed.state?.user?.tenantId;
              } catch (e) { }
            }
          }

          if (!tenantId) return;

          const { configApi } = await import('@/lib/api/config');
          const config = await configApi.getThemeConfig(tenantId);

          if (config) {
            const colors: ThemeColors = {
              primary: config.primaryColor || defaultColors.primary,
              secondary: config.secondaryColor || defaultColors.secondary,
              accent: config.accentColor || defaultColors.accent,
              background: config.backgroundColor || defaultColors.background,
              surface: config.surfaceColor || defaultColors.surface,
              textPrimary: config.textPrimaryColor || defaultColors.textPrimary,
              textSecondary: config.textSecondaryColor || defaultColors.textSecondary,
            };

            const tenantTheme: TenantTheme = {
              tenantId: config.tenantId,
              logoUrl: config.logoUrl,
              logoWidth: (config.extraSettings?.logoWidth as number) || 150,
              colors: colors,
              baseFontSize: (config.extraSettings?.baseFontSize as number) || 16,
              customCss: config.customCss,
              faviconUrl: config.faviconUrl
            };

            set({ tenantTheme });

            // Aplica cores e variáveis CSS
            applyColorsToDocument(colors);

            // Aplica Fonte
            const extraSettings = config.extraSettings || {};
            const fontFamily = (extraSettings.fontFamily as string) || 'Plus Jakarta Sans';
            const fontVar = getFontVariable(fontFamily);
            document.body.style.fontFamily = `${fontVar}, sans-serif`;

            if (tenantTheme.baseFontSize) {
              applyFontSize(tenantTheme.baseFontSize);
            }

            if (tenantTheme.customCss) {
              applyCustomCss(tenantTheme.customCss);
            }

            if (tenantTheme.faviconUrl) {
              updateFavicon(tenantTheme.faviconUrl);
            }
          }
        } catch (error) {
          console.error('Failed to fetch branding:', error);
        }
      },

      setTenantTheme: (tenantTheme: TenantTheme) => {
        set({ tenantTheme });
        applyColorsToDocument(tenantTheme.colors);

        // Aplica CSS customizado
        if (tenantTheme.customCss) {
          applyCustomCss(tenantTheme.customCss);
        }

        // Atualiza favicon
        if (tenantTheme.faviconUrl) {
          updateFavicon(tenantTheme.faviconUrl);
        }

        // Aplica fonte
        if (tenantTheme.baseFontSize) {
          applyFontSize(tenantTheme.baseFontSize);
        }

        // Aplica família da fonte se existir nos customCss ou explicitamente (assumindo que o branding foi salvo)
        // Nota: A lógica de fetchBranding já aplica. Se setTenantTheme for chamado manualmente, precisaria da info da fonte.
        // O TenantTheme interface não tem fontFamily explícito, mas vamos assumir que isso é persistido no reload.
      },

      applyTenantColors: (colors: ThemeColors) => {
        applyColorsToDocument(colors);
      },

      resetToDefault: () => {
        set({ tenantTheme: null });
        applyColorsToDocument(defaultColors);
        removeCustomCss();
        document.documentElement.style.removeProperty('--font-size-base');
      },
    }),
    {
      name: 'axonrh-theme',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
);

// ==================== Funções Auxiliares ====================

function applyThemeToDocument(theme: Theme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.classList.remove('light', 'dark', 'high-contrast');

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(prefersDark ? 'dark' : 'light');
  } else {
    root.classList.add(theme);
  }
}

function applyFontSize(size: number) {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--font-size-base', `${size}px`);
  // Update root font size to affect rem units if desired, or keep as variable for specific use
  document.documentElement.style.fontSize = `${size}px`;
}

function applyColorsToDocument(colors: ThemeColors) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Cores principais
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-secondary', colors.secondary);
  root.style.setProperty('--color-accent', colors.accent);

  // Variantes (opcionalmente calculadas, mas por enquanto replicando para garantir funcionamento dos componentes)
  root.style.setProperty('--color-primary-light', `${colors.primary}CC`);
  root.style.setProperty('--color-primary-dark', `${colors.primary}E6`);
  root.style.setProperty('--color-secondary-light', `${colors.secondary}CC`);
  root.style.setProperty('--color-secondary-dark', `${colors.secondary}E6`);
  root.style.setProperty('--color-accent-light', `${colors.accent}CC`);
  root.style.setProperty('--color-accent-dark', `${colors.accent}E6`);

  // Superfícies e Textos
  root.style.setProperty('--color-background', colors.background);
  root.style.setProperty('--color-surface', colors.surface);
  root.style.setProperty('--color-text-primary', colors.textPrimary);
  root.style.setProperty('--color-text-secondary', colors.textSecondary);
}

function applyCustomCss(css: string) {
  if (typeof document === 'undefined') return;

  removeCustomCss();

  const style = document.createElement('style');
  style.id = 'tenant-custom-css';
  style.textContent = css;
  document.head.appendChild(style);
}

function removeCustomCss() {
  if (typeof document === 'undefined') return;

  const existing = document.getElementById('tenant-custom-css');
  if (existing) {
    existing.remove();
  }
}

function updateFavicon(url: string) {
  if (typeof document === 'undefined') return;

  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (link) {
    link.href = url;
  } else {
    const newLink = document.createElement('link');
    newLink.rel = 'icon';
    newLink.href = url;
    document.head.appendChild(newLink);
  }
}

function getFontVariable(name: string): string {
  switch (name) {
    case 'Plus Jakarta Sans': return 'var(--font-primary)';
    case 'Outfit': return 'var(--font-secondary)';
    case 'Inter': return 'var(--font-inter)';
    case 'Roboto': return 'var(--font-roboto)';
    case 'Open Sans': return 'var(--font-opensans)';
    case 'Montserrat': return 'var(--font-montserrat)';
    default: return 'var(--font-primary)';
  }
}
