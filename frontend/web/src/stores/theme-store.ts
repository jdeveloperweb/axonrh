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
  logoDarkUrl?: string;
  faviconUrl?: string;
  colors: ThemeColors;
  darkColors?: ThemeColors;
  customCss?: string;
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
        }
      },

      fetchBranding: async () => {
        try {
          const { settingsApi } = await import('@/lib/api/settings');
          const branding = await settingsApi.getBranding();

          if (branding) {
            const colors: ThemeColors = {
              primary: branding.primaryColor || defaultColors.primary,
              secondary: branding.secondaryColor || defaultColors.secondary,
              accent: branding.accentColor || defaultColors.accent,
              background: defaultColors.background,
              surface: defaultColors.surface,
              textPrimary: defaultColors.textPrimary,
              textSecondary: defaultColors.textSecondary,
            };

            set({
              tenantTheme: {
                tenantId: localStorage.getItem('setup_tenant_id') || '',
                logoUrl: branding.logoUrl,
                colors: colors
              }
            });

            applyColorsToDocument(colors);

            if (branding.fontFamily) {
              document.documentElement.style.setProperty('--font-family', branding.fontFamily);
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
      },

      applyTenantColors: (colors: ThemeColors) => {
        applyColorsToDocument(colors);
      },

      resetToDefault: () => {
        set({ tenantTheme: null });
        applyColorsToDocument(defaultColors);
        removeCustomCss();
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

function applyColorsToDocument(colors: ThemeColors) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-secondary', colors.secondary);
  root.style.setProperty('--color-accent', colors.accent);
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
