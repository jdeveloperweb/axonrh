'use client';

import { useState, useRef } from 'react';
import { Bell, Search, Sun, Moon, Monitor, Sparkles, Bot, Menu } from 'lucide-react';
import { cn, getPhotoUrl } from '@/lib/utils';
import { useThemeStore, type Theme } from '@/stores/theme-store';
import { useLayoutStore } from '@/stores/layout-store';
import { useRouter } from 'next/navigation';

// ==================== Component ====================

export function Header() {
  const { theme, setTheme } = useThemeStore();
  const { toggleMobileMenu } = useLayoutStore();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false);
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const themeOptions: { value: Theme; label: string; icon: React.ElementType }[] = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Escuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ];

  const currentThemeIcon = themeOptions.find((t) => t.value === theme)?.icon || Monitor;
  const ThemeIcon = currentThemeIcon;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInputRef.current?.value;
    if (!query) return;

    if (isAiMode) {
      router.push(`/assistant?q=${encodeURIComponent(query)}`);
    } else {
      // Todo: Implement standard search
      console.log('Searching for:', query);
    }
  };

  const toggleAiMode = () => {
    setIsAiMode(!isAiMode);
    // Focus input when switching
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  return (
    <header className="header">
      {/* Mobile Menu Toggle */}
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Menu Toggle */}
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-variant)] lg:hidden"
          aria-label="Toggle Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Brand Logo in Header for better visibility */}
        {useThemeStore.getState().tenantTheme?.logoUrl && (
          <div className="hidden lg:flex items-center h-8">
            <img
              src={getPhotoUrl(useThemeStore.getState().tenantTheme?.logoUrl, undefined, 'logo') || ''}
              alt="Brand"
              className="h-full w-auto object-contain"
            />
          </div>
        )}
      </div>

      {/* Search Bar Container */}
      <div className={cn(
        "flex items-center gap-2 sm:gap-4 flex-1 max-w-xl transition-all duration-500",
        isAiMode ? "scale-105" : ""
      )}>
        <form onSubmit={handleSearch} className="relative flex-1 group">
          <div className={cn(
            "absolute inset-y-0 left-0 flex items-center pl-3 transition-colors duration-300",
            isAiMode ? "text-purple-600" : "text-[var(--color-text-secondary)]"
          )}>
            {isAiMode ? (
              <Sparkles className="w-5 h-5 animate-pulse" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>

          <input
            ref={searchInputRef}
            type="search"
            placeholder={isAiMode ? "Pergunte à IA..." : "Buscar..."}
            className={cn(
              "input pl-10 pr-10 sm:pr-12 h-10 sm:h-12 w-full transition-all duration-300 border-2 text-sm sm:text-base",
              isAiMode
                ? "border-purple-400 focus:border-purple-600 focus:ring-purple-200 placeholder:text-purple-400/70"
                : "border-transparent focus:border-[var(--color-primary)] placeholder:text-gray-400"
            )}
          />

          {/* AI Toggle Button */}
          <button
            type="button"
            onClick={toggleAiMode}
            className={cn(
              "absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all duration-300 flex items-center justify-center",
              isAiMode
                ? "bg-purple-100 text-purple-600 hover:bg-purple-200"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-[var(--color-primary)]"
            )}
            title={isAiMode ? "Desativar modo IA" : "Ativar assistente IA"}
          >
            <Bot className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isAiMode && "animate-bounce")} />
          </button>
        </form>
      </div>


      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Access AI Icon */}
        <button
          onClick={() => router.push('/assistant')}
          className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-variant)] text-[var(--color-text-secondary)] hover:text-purple-600 transition-colors hidden sm:block"
          title="Ir para Assistente IA"
        >
          <Sparkles className="w-5 h-5" />
        </button>

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
