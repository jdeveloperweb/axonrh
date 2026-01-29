'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { settingsApi, BrandingData } from '@/lib/api/settings';
import { useThemeStore } from '@/stores/theme-store';
import { useToast } from '@/hooks/use-toast';

export default function BrandingPage() {
    const { toast } = useToast();
    const [data, setData] = useState<BrandingData>({
        logoUrl: '',
        logoWidth: 150,
        primaryColor: '#1976D2',
        secondaryColor: '#424242',
        accentColor: '#FF4081',
        fontFamily: 'Inter',
        baseFontSize: 16
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const fetchBranding = useThemeStore(state => state.fetchBranding);

    const loadBranding = useCallback(async () => {
        try {
            setLoading(true);
            const branding = await settingsApi.getBranding();
            if (branding && (branding.primaryColor || branding.logoUrl)) {
                setData(prev => ({
                    ...prev,
                    ...branding
                }));
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

    const fonts = [
        'Inter',
        'Plus Jakarta Sans',
        'Outfit',
        'Roboto',
        'Open Sans',
        'Montserrat'
    ];

    const handleSave = async () => {
        try {
            setSaving(true);
            await settingsApi.saveBranding(data);
            await fetchBranding();
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

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
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
                        {saving ? 'Salvando...' : (
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
                    <Card className="border-none shadow-sm bg-[var(--color-surface)]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Upload className="w-5 h-5 text-[var(--color-primary)]" />
                                Logotipo
                            </CardTitle>
                            <CardDescription>Upload da logo principal da sua empresa</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] p-8 bg-[var(--color-surface-variant)]/30 hover:bg-[var(--color-surface-variant)]/50 transition-colors cursor-pointer group">
                                {data.logoUrl ? (
                                    <Image
                                        src={data.logoUrl}
                                        alt="Preview"
                                        width={data.logoWidth || 150}
                                        height={150}
                                        style={{ maxWidth: data.logoWidth || 150 }}
                                        className="mb-4 h-auto"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                        <Upload className="w-8 h-8 text-[var(--color-primary)]" />
                                    </div>
                                )}
                                <p className="text-sm font-medium">Arraste ou clique para upload</p>
                                <p className="text-xs text-[var(--color-text-secondary)] mt-1">PNG, SVG ou JPG (Máx. 2MB)</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-semibold mb-2 block">URL da Logo (Opcional)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 bg-[var(--color-surface-variant)] rounded-[var(--radius-md)] border-none text-sm"
                                        placeholder="https://suaempresa.com/logo.png"
                                        value={data.logoUrl || ''}
                                        onChange={(e) => setData({ ...data, logoUrl: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-semibold block">Largura do Logo</label>
                                        <span className="text-xs font-mono text-[var(--color-primary)]">{data.logoWidth}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="50"
                                        max="300"
                                        step="10"
                                        value={data.logoWidth || 150}
                                        onChange={(e) => setData({ ...data, logoWidth: parseInt(e.target.value) })}
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
                            <CardDescription>Defina as cores principais do seu portal</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div>
                                <label className="text-sm font-semibold mb-2 block">Cor Primária</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 overflow-hidden"
                                        value={data.primaryColor}
                                        onChange={(e) => setData({ ...data, primaryColor: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="flex-1 px-3 py-2 bg-[var(--color-surface-variant)] rounded border-none text-xs font-mono uppercase"
                                        value={data.primaryColor}
                                        onChange={(e) => setData({ ...data, primaryColor: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold mb-2 block">Cor Secundária</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 overflow-hidden"
                                        value={data.secondaryColor}
                                        onChange={(e) => setData({ ...data, secondaryColor: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="flex-1 px-3 py-2 bg-[var(--color-surface-variant)] rounded border-none text-xs font-mono uppercase"
                                        value={data.secondaryColor}
                                        onChange={(e) => setData({ ...data, secondaryColor: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold mb-2 block">Cor de Destaque</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 overflow-hidden"
                                        value={data.accentColor}
                                        onChange={(e) => setData({ ...data, accentColor: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="flex-1 px-3 py-2 bg-[var(--color-surface-variant)] rounded border-none text-xs font-mono uppercase"
                                        value={data.accentColor}
                                        onChange={(e) => setData({ ...data, accentColor: e.target.value })}
                                    />
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
                            <CardDescription>Escolha a fonte principal e o tamanho base</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="text-sm font-semibold mb-2 block">Fonte Principal</label>
                                <select
                                    className="w-full px-4 py-2.5 bg-[var(--color-surface-variant)] rounded-[var(--radius-md)] border-none font-medium"
                                    value={data.fontFamily}
                                    onChange={(e) => setData({ ...data, fontFamily: e.target.value })}
                                >
                                    {fonts.map(font => (
                                        <option key={font} value={font}>{font}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-semibold block">Tamanho da Fonte Base</label>
                                    <span className="text-xs font-mono text-[var(--color-primary)]">{data.baseFontSize}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="12"
                                    max="20"
                                    step="1"
                                    value={data.baseFontSize || 16}
                                    onChange={(e) => setData({ ...data, baseFontSize: parseInt(e.target.value) })}
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
                            style={{ fontFamily: data.fontFamily }}
                        >
                            <div className="h-12 border-b flex items-center px-4 justify-between" style={{ backgroundColor: '#ffffff' }}>
                                {data.logoUrl ? (
                                    <Image
                                        src={data.logoUrl}
                                        alt="Logo"
                                        width={(data.logoWidth || 150) / 2}
                                        height={40}
                                        style={{ maxWidth: (data.logoWidth || 150) / 2 }}
                                        className="h-auto"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: data.primaryColor }} />
                                        <div className="w-16 h-2 bg-gray-100 rounded" />
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-50" />
                                </div>
                            </div>
                            <div className="p-6 space-y-4" style={{ fontSize: data.baseFontSize }}>
                                <div className="space-y-2">
                                    <h4 className="font-bold text-lg" style={{ color: data.secondaryColor }}>Bem-vindo ao AxonRH</h4>
                                    <div className="h-2 w-full bg-gray-50 rounded" />
                                    <div className="h-2 w-2/3 bg-gray-50 rounded" />
                                </div>
                                <div className="flex gap-2 mt-6">
                                    <div className="px-4 py-2 rounded-lg text-[10px] text-white font-bold shadow-md shadow-inner" style={{ backgroundColor: data.primaryColor }}>BOTÃO PRIMÁRIO</div>
                                    <div className="px-4 py-2 rounded-lg text-[10px] text-gray-400 border border-gray-200 font-bold bg-white">SECUNDÁRIO</div>
                                </div>
                                <div className="pt-4 border-t mt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="h-2 w-16 bg-gray-100 rounded" />
                                        <div className="text-[10px] font-bold" style={{ color: data.accentColor }}>+12%</div>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                        <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: data.primaryColor }} />
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
                            Use cores que facilitem a leitura. Procure manter um bom contraste entre a cor primária e o fundo branco.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
