'use client';

import { useState } from 'react';
import { Bell, Search, Sun, Moon, Monitor, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeStore, type Theme } from '@/stores/theme-store';

// ==================== Component ====================

export function Header() {
  const { theme, setTheme } = useThemeStore();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const themeOptions: { value: Theme; label: string; icon: React.ElementType }[] = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Escuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ];

  const currentThemeIcon = themeOptions.find((t) => t.value === theme)?.icon || Monitor;
  const ThemeIcon = currentThemeIcon;

  return (
    <header className="header">
      {/* Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
          <input
            type="search"
            placeholder="Buscar colaboradores, documentos..."
            className="input pl-10 py-2"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-variant)] transition-colors"
            title="Alterar tema"
          >
            <ThemeIcon className="w-5 h-5" />
          </button>

          {showThemeMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowThemeMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-40 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-lg border border-[var(--color-border)] z-50 animate-scale-in">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        setTheme(option.value);
                        setShowThemeMenu(false);
                      }}
                      className={cn(
                        'flex items-center gap-3 w-full px-4 py-2.5 text-left',
                        'hover:bg-[var(--color-surface-variant)] transition-colors',
                        'first:rounded-t-[var(--radius-lg)] last:rounded-b-[var(--radius-lg)]',
                        theme === option.value && 'text-[var(--color-primary)] font-medium'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-variant)] transition-colors"
            title="Notificacoes"
          >
            <Bell className="w-5 h-5" />
            {/* Badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--color-error)] rounded-full" />
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-lg border border-[var(--color-border)] z-50 animate-scale-in">
                <div className="p-4 border-b border-[var(--color-border)]">
                  <h3 className="font-semibold">Notificacoes</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {/* Placeholder notifications */}
                  <div className="p-4 text-center text-[var(--color-text-secondary)]">
                    Nenhuma notificacao
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
