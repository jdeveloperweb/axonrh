'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Palette,
    Upload,
    Save,
    Undo,
    Type,
    Layout,
    Check
} from 'lucide-react';
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { configApi, ThemeConfig } from '@/lib/api/config';
import { useThemeStore, SUPPORTED_FONTS, getFontVariable } from '@/stores/theme-store';
import { useToast } from '@/hooks/use-toast';
import { getPhotoUrl } from '@/lib/utils';

export default function BrandingPage() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [config, setConfig] = useState<Partial<ThemeConfig>>({
        primaryColor: '#1976D2',
        secondaryColor: '#424242',
        accentColor: '#FF4081',
        backgroundColor: '#FFFFFF',
        surfaceColor: '#FAFAFA',
        textPrimaryColor: '#212121',
        textSecondaryColor: '#757575',
        extraSettings: {
            logoWidth: 150,
            fontFamily: 'Plus Jakarta Sans',
            baseFontSize: 16
        }
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const fetchBranding = useThemeStore(state => state.fetchBranding);
    const setTenantTheme = useThemeStore(state => state.setTenantTheme);

    const loadBranding = useCallback(async () => {
        try {
            setLoading(true);
            const tenantId = localStorage.getItem('tenantId') || localStorage.getItem('setup_tenant_id') || '';
            if (!tenantId) return;

            const branding = await configApi.getThemeConfig(tenantId);
            if (branding) {
                // Ensure extraSettings has defaults if missing
                const mergedConfig = {
                    ...branding,
                    extraSettings: {
                        logoWidth: 150,
                        fontFamily: 'Plus Jakarta Sans',
                        baseFontSize: 16,
                        ...(branding.extraSettings || {})
                    }
                };
                setConfig(mergedConfig);
            }
        } catch (error) {
            console.error('Error loading branding:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBranding();
    }, [loadBranding]);


    const handleSave = async () => {
        try {
            setSaving(true);
            const tenantId = config.tenantId || localStorage.getItem('tenantId') || localStorage.getItem('setup_tenant_id') || '';

            await configApi.updateThemeConfig(tenantId, {
                logoUrl: config.logoUrl,
                faviconUrl: config.faviconUrl,
                primaryColor: config.primaryColor,
                secondaryColor: config.secondaryColor,
                accentColor: config.accentColor,
                backgroundColor: config.backgroundColor,
                surfaceColor: config.surfaceColor,
                textPrimaryColor: config.textPrimaryColor,
                textSecondaryColor: config.textSecondaryColor,
                extraSettings: config.extraSettings,
                changeDescription: 'Atualização via painel de branding'
            });

            // Atualiza globalmente o estado do tema para refletir imediatamente sem F5
            setTenantTheme({
                tenantId: config.tenantId || '',
                logoUrl: config.logoUrl || '',
                logoWidth: (config.extraSettings?.logoWidth as number) || 150,
                colors: {
                    primary: config.primaryColor || '#1976D2',
                    secondary: config.secondaryColor || '#424242',
                    accent: config.accentColor || '#FF4081',
                    background: config.backgroundColor || '#FFFFFF',
                    surface: config.surfaceColor || '#FAFAFA',
                    textPrimary: config.textPrimaryColor || '#212121',
                    textSecondary: config.textSecondaryColor || '#757575',
                    buttonPrimary: (config.extraSettings?.buttonPrimary as string) || config.primaryColor || '#1976D2',
                    buttonPrimaryText: (config.extraSettings?.buttonPrimaryText as string) || '#FFFFFF',
                    buttonSecondary: (config.extraSettings?.buttonSecondary as string) || config.secondaryColor || '#424242',
                    buttonSecondaryText: (config.extraSettings?.buttonSecondaryText as string) || '#FFFFFF',
                },
                baseFontSize: (config.extraSettings?.baseFontSize as number) || 16,
                fontFamily: (config.extraSettings?.fontFamily as string) || 'Plus Jakarta Sans',
                customCss: config.customCss || '',
                faviconUrl: config.faviconUrl || ''
            });

            toast({
                title: 'Sucesso',
                description: 'Configurações de marca salvas com sucesso!',
            });
        } catch (error) {
            console.error('Error saving branding:', error);
            toast({
                title: 'Erro',
                description: 'Erro ao salvar configurações',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const updateGlobalTheme = useCallback(() => {
        if (loading) return;

        const tenantTheme = {
            tenantId: config.tenantId || '',
            logoUrl: config.logoUrl || '',
            logoWidth: config.extraSettings?.logoWidth || 150,
            colors: {
                primary: config.primaryColor || '#1976D2',
                secondary: config.secondaryColor || '#424242',
                accent: config.accentColor || '#FF4081',
                background: config.backgroundColor || '#FFFFFF',
                surface: config.surfaceColor || '#FAFAFA',
                textPrimary: config.textPrimaryColor || '#212121',
                textSecondary: config.textSecondaryColor || '#757575',
                buttonPrimary: (config.extraSettings?.buttonPrimary as string) || config.primaryColor || '#1976D2',
                buttonPrimaryText: (config.extraSettings?.buttonPrimaryText as string) || '#FFFFFF',
                buttonSecondary: (config.extraSettings?.buttonSecondary as string) || config.secondaryColor || '#424242',
                buttonSecondaryText: (config.extraSettings?.buttonSecondaryText as string) || '#FFFFFF',
            },
            baseFontSize: config.extraSettings?.baseFontSize || 16,
            fontFamily: config.extraSettings?.fontFamily || 'Plus Jakarta Sans',
            customCss: config.customCss || '',
            faviconUrl: config.faviconUrl || ''
        };

        setTenantTheme(tenantTheme);
    }, [config, loading, setTenantTheme]);

    // Sincroniza em tempo real enquanto edita
    useEffect(() => {
        updateGlobalTheme();
    }, [
        config.primaryColor,
        config.secondaryColor,
        config.accentColor,
        config.backgroundColor,
        config.surfaceColor,
        config.textPrimaryColor,
        config.textSecondaryColor,
        config.logoUrl,
        config.extraSettings?.logoWidth,
        config.extraSettings?.baseFontSize,
        config.extraSettings?.fontFamily,
        config.extraSettings?.buttonPrimary,
        config.extraSettings?.buttonPrimaryText,
        config.extraSettings?.buttonSecondary,
        config.extraSettings?.buttonSecondaryText,
        updateGlobalTheme
    ]);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setSaving(true);
            const tenantId = config.tenantId || localStorage.getItem('tenantId') || localStorage.getItem('setup_tenant_id') || '';
            const response = await configApi.uploadLogo(tenantId, file);

            setConfig(prev => ({
                ...prev,
                logoUrl: response.url
            }));

            toast({
                title: 'Logo carregada',
                description: 'A logo foi enviada com sucesso. Salve as alterações para confirmar.',
            });
        } catch (error: any) {
            console.error('Error uploading logo:', error);
            toast({
                title: 'Erro',
                description: error.message || 'Erro ao carregar logo',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const logoPreviewUrl = getPhotoUrl(config.logoUrl, undefined, 'logo');

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Identidade Visual</h1>
                    <p className="text-[var(--color-text-secondary)]">Personalize a aparência do sistema para sua empresa</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-variant)] transition-colors flex items-center gap-2 text-sm font-medium" onClick={loadBranding}>
                        <Undo className="w-4 h-4" />
                        Descartar
                    </button>
                    <button
                        className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 text-sm font-bold shadow-lg shadow-[var(--color-primary)]/20"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Processando...' : (
                            <>
                                <Save className="w-4 h-4" />
                                Salvar Alterações
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Logo Section */}
                    <Card className="border-none shadow-sm bg-[var(--color-surface)] overflow-hidden">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Upload className="w-5 h-5 text-[var(--color-primary)]" />
                                Logotipo
                            </CardTitle>
                            <CardDescription>Upload da logo principal da sua empresa para uso em badges e no portal</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleLogoUpload}
                            />

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] p-8 bg-[var(--color-surface-variant)]/30 hover:bg-[var(--color-surface-variant)]/50 transition-colors cursor-pointer group"
                            >
                                {config.logoUrl ? (
                                    <div className="relative mb-4">
                                        <Image
                                            src={logoPreviewUrl!}
                                            alt="Preview"
                                            width={config.extraSettings?.logoWidth || 150}
                                            height={150}
                                            style={{ maxWidth: config.extraSettings?.logoWidth || 150 }}
                                            className="h-auto object-contain"
                                            unoptimized
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                                            <Upload className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                        <Upload className="w-8 h-8 text-[var(--color-primary)]" />
                                    </div>
                                )}
                                <p className="text-sm font-medium">Clique para fazer upload da logo</p>
                                <p className="text-xs text-[var(--color-text-secondary)] mt-1">PNG, SVG ou JPG (Máx. 500KB)</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-semibold mb-2 block">Caminho da Logo</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 bg-[var(--color-surface-variant)] rounded-[var(--radius-md)] border-none text-sm text-[var(--color-text-primary)]"
                                        value={config.logoUrl || ''}
                                        onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                                        placeholder="URL da logo (PNG, JPG ou SVG)"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-semibold block">Largura da Logo no Portal</label>
                                        <span className="text-xs font-mono text-[var(--color-primary)]">{config.extraSettings?.logoWidth || 150}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="50"
                                        max="300"
                                        step="10"
                                        value={config.extraSettings?.logoWidth || 150}
                                        onChange={(e) => setConfig({
                                            ...config,
                                            extraSettings: { ...config.extraSettings, logoWidth: parseInt(e.target.value) }
                                        })}
                                        className="w-full h-1.5 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Colors Section */}
                    <Card className="border-none shadow-sm bg-[var(--color-surface)]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Palette className="w-5 h-5 text-[var(--color-primary)]" />
                                Paleta de Cores
                            </CardTitle>
                            <CardDescription>Defina as cores principais que serão aplicadas em todo o sistema</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-sm font-semibold mb-2 block">Cor Primária</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 overflow-hidden"
                                            value={config.primaryColor}
                                            onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                                        />
                                        <input
                                            type="text"
                                            className="flex-1 px-3 py-2 bg-[var(--color-surface-variant)] rounded border-none text-xs font-mono uppercase"
                                            value={config.primaryColor}
                                            onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold mb-2 block">Cor Secundária</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 overflow-hidden"
                                            value={config.secondaryColor}
                                            onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                                        />
                                        <input
                                            type="text"
                                            className="flex-1 px-3 py-2 bg-[var(--color-surface-variant)] rounded border-none text-xs font-mono uppercase"
                                            value={config.secondaryColor}
                                            onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold mb-2 block">Cor de Destaque</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 overflow-hidden"
                                            value={config.accentColor}
                                            onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                                        />
                                        <input
                                            type="text"
                                            className="flex-1 px-3 py-2 bg-[var(--color-surface-variant)] rounded border-none text-xs font-mono uppercase"
                                            value={config.accentColor}
                                            onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-[var(--color-border)]">
                                <h4 className="text-sm font-bold mb-4">Cores de Texto</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm font-semibold mb-2 block">Texto Principal</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 overflow-hidden"
                                                value={config.textPrimaryColor}
                                                onChange={(e) => setConfig({ ...config, textPrimaryColor: e.target.value })}
                                            />
                                            <input
                                                type="text"
                                                className="flex-1 px-3 py-2 bg-[var(--color-surface-variant)] rounded border-none text-xs font-mono uppercase"
                                                value={config.textPrimaryColor}
                                                onChange={(e) => setConfig({ ...config, textPrimaryColor: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold mb-2 block">Texto Secundário</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 overflow-hidden"
                                                value={config.textSecondaryColor}
                                                onChange={(e) => setConfig({ ...config, textSecondaryColor: e.target.value })}
                                            />
                                            <input
                                                type="text"
                                                className="flex-1 px-3 py-2 bg-[var(--color-surface-variant)] rounded border-none text-xs font-mono uppercase"
                                                value={config.textSecondaryColor}
                                                onChange={(e) => setConfig({ ...config, textSecondaryColor: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-[var(--color-border)]">
                                <h4 className="text-sm font-bold mb-4">Cores de Botões</h4>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-sm font-semibold mb-2 block">Botão Primário (Fundo)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 overflow-hidden"
                                                    value={config.extraSettings?.buttonPrimary || config.primaryColor}
                                                    onChange={(e) => setConfig({
                                                        ...config,
                                                        extraSettings: { ...config.extraSettings, buttonPrimary: e.target.value }
                                                    })}
                                                />
                                                <input
                                                    type="text"
                                                    className="flex-1 px-3 py-2 bg-[var(--color-surface-variant)] rounded border-none text-xs font-mono uppercase"
                                                    value={config.extraSettings?.buttonPrimary || config.primaryColor}
                                                    onChange={(e) => setConfig({
                                                        ...config,
                                                        extraSettings: { ...config.extraSettings, buttonPrimary: e.target.value }
                                                    })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold mb-2 block">Botão Primário (Texto)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 overflow-hidden"
                                                    value={config.extraSettings?.buttonPrimaryText || '#FFFFFF'}
                                                    onChange={(e) => setConfig({
                                                        ...config,
                                                        extraSettings: { ...config.extraSettings, buttonPrimaryText: e.target.value }
                                                    })}
                                                />
                                                <input
                                                    type="text"
                                                    className="flex-1 px-3 py-2 bg-[var(--color-surface-variant)] rounded border-none text-xs font-mono uppercase"
                                                    value={config.extraSettings?.buttonPrimaryText || '#FFFFFF'}
                                                    onChange={(e) => setConfig({
                                                        ...config,
                                                        extraSettings: { ...config.extraSettings, buttonPrimaryText: e.target.value }
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-sm font-semibold mb-2 block">Botão Secundário (Fundo)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 overflow-hidden"
                                                    value={config.extraSettings?.buttonSecondary || config.secondaryColor}
                                                    onChange={(e) => setConfig({
                                                        ...config,
                                                        extraSettings: { ...config.extraSettings, buttonSecondary: e.target.value }
                                                    })}
                                                />
                                                <input
                                                    type="text"
                                                    className="flex-1 px-3 py-2 bg-[var(--color-surface-variant)] rounded border-none text-xs font-mono uppercase"
                                                    value={config.extraSettings?.buttonSecondary || config.secondaryColor}
                                                    onChange={(e) => setConfig({
                                                        ...config,
                                                        extraSettings: { ...config.extraSettings, buttonSecondary: e.target.value }
                                                    })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold mb-2 block">Botão Secundário (Texto)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 overflow-hidden"
                                                    value={config.extraSettings?.buttonSecondaryText || '#FFFFFF'}
                                                    onChange={(e) => setConfig({
                                                        ...config,
                                                        extraSettings: { ...config.extraSettings, buttonSecondaryText: e.target.value }
                                                    })}
                                                />
                                                <input
                                                    type="text"
                                                    className="flex-1 px-3 py-2 bg-[var(--color-surface-variant)] rounded border-none text-xs font-mono uppercase"
                                                    value={config.extraSettings?.buttonSecondaryText || '#FFFFFF'}
                                                    onChange={(e) => setConfig({
                                                        ...config,
                                                        extraSettings: { ...config.extraSettings, buttonSecondaryText: e.target.value }
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Typography Section */}
                    <Card className="border-none shadow-sm bg-[var(--color-surface)]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Type className="w-5 h-5 text-[var(--color-primary)]" />
                                Tipografia
                            </CardTitle>
                            <CardDescription>Escolha a fonte principal e o tamanho base do sistema</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="text-sm font-semibold mb-2 block">Fonte Principal</label>
                                <select
                                    className="w-full px-4 py-2.5 bg-[var(--color-surface-variant)] rounded-[var(--radius-md)] border-none font-medium text-sm"
                                    value={config.extraSettings?.fontFamily || 'Plus Jakarta Sans'}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        extraSettings: { ...config.extraSettings, fontFamily: e.target.value }
                                    })}
                                >
                                    {SUPPORTED_FONTS.map(font => (
                                        <option key={font} value={font}>{font}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-semibold block">Tamanho da Fonte Base</label>
                                    <span className="text-xs font-mono text-[var(--color-primary)]">{config.extraSettings?.baseFontSize || 16}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="12"
                                    max="20"
                                    step="1"
                                    value={config.extraSettings?.baseFontSize || 16}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        extraSettings: { ...config.extraSettings, baseFontSize: parseInt(e.target.value) }
                                    })}
                                    className="w-full h-1.5 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Preview Section */}
                <div className="space-y-6">
                    <div className="sticky top-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Layout className="w-5 h-5 text-[var(--color-primary)]" />
                            Preview em Tempo Real
                        </h3>
                        <div
                            className="bg-white rounded-[var(--radius-xl)] shadow-2xl border border-gray-100 overflow-hidden"
                            style={{ fontFamily: getFontVariable(config.extraSettings?.fontFamily || 'Plus Jakarta Sans') }}
                        >
                            <div className="h-12 border-b flex items-center px-4 justify-between" style={{ backgroundColor: '#ffffff' }}>
                                {config.logoUrl ? (
                                    <Image
                                        src={logoPreviewUrl!}
                                        alt="Logo"
                                        width={(config.extraSettings?.logoWidth || 150) / 2}
                                        height={40}
                                        style={{ maxWidth: (config.extraSettings?.logoWidth || 150) / 2 }}
                                        className="h-auto object-contain"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: config.primaryColor }} />
                                        <div className="w-16 h-2 bg-gray-100 rounded" />
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-50" />
                                </div>
                            </div>
                            <div className="p-6 space-y-4" style={{ fontSize: config.extraSettings?.baseFontSize }}>
                                <div className="space-y-2">
                                    <h4 className="font-bold text-lg" style={{ color: config.textPrimaryColor }}>Bem-vindo ao AxonRH</h4>
                                    <p className="text-[10px]" style={{ color: config.textSecondaryColor }}>Gerencie seus talentos de forma inteligente.</p>
                                    <div className="h-2 w-full bg-gray-100 rounded" />
                                    <div className="h-2 w-2/3 bg-gray-100 rounded" />
                                </div>
                                <div className="flex gap-2 mt-6">
                                    <div className="px-4 py-2 rounded-lg text-[10px] font-bold shadow-md" style={{
                                        backgroundColor: config.extraSettings?.buttonPrimary || config.primaryColor,
                                        color: config.extraSettings?.buttonPrimaryText || '#FFFFFF'
                                    }}>BOTÃO PRIMÁRIO</div>
                                    <div className="px-4 py-2 rounded-lg text-[10px] font-bold border border-gray-100" style={{
                                        backgroundColor: config.extraSettings?.buttonSecondary || config.secondaryColor,
                                        color: config.extraSettings?.buttonSecondaryText || '#FFFFFF'
                                    }}>SECUNDÁRIO</div>
                                </div>
                                <div className="pt-4 border-t mt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="h-2 w-16 bg-gray-100 rounded" />
                                        <div className="text-[10px] font-bold" style={{ color: config.accentColor }}>+12%</div>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                        <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: config.primaryColor }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-4 text-center">As alterações serão aplicadas a todos os usuários logo após salvar.</p>

                        <div className="mt-8 p-4 rounded-xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10 text-xs leading-relaxed">
                            <h5 className="font-bold mb-1 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Dica de Design
                            </h5>
                            Use cores que facilitem a leitura. Procure manter um bom contraste entre a cor primária e o fundo branco para garantir acessibilidade.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
