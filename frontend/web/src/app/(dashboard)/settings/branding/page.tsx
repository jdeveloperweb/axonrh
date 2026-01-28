'use client';

import { useState, useEffect } from 'react';
import {
    Palette,
    Upload,
    Save,
    Undo,
    Type,
    Layout,
    Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { settingsApi, BrandingData } from '@/lib/api/settings';
import { useThemeStore } from '@/stores/theme-store';
import { useToast } from '@/hooks/use-toast';

export default function BrandingPage() {
    const { toast } = useToast();
    const [data, setData] = useState<BrandingData>({
        primaryColor: '#1976D2',
        secondaryColor: '#424242',
        accentColor: '#FF4081',
        fontFamily: 'Inter',
        baseFontSize: 16
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const fetchBranding = useThemeStore(state => state.fetchBranding);

    useEffect(() => {
        loadBranding();
    }, []);

    const loadBranding = async () => {
        try {
            setLoading(true);
            const branding = await settingsApi.getBranding();
            if (branding && branding.primaryColor) {
                setData(branding);
            }
        } catch (error) {
            console.error('Error loading branding:', error);
        } finally {
            setLoading(false);
        }
    };

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

    if (loading) return <div className="p-8">Carregando...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Identidade Visual</h1>
                    <p className="text-[var(--color-text-secondary)]">Personalize a aparência do sistema para sua empresa</p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-outline flex items-center gap-2" onClick={loadBranding}>
                        <Undo className="w-4 h-4" />
                        Descartar
                    </button>
                    <button
                        className="btn-primary flex items-center gap-2"
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    {/* Logo Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="w-5 h-5" />
                                Logotipo
                            </CardTitle>
                            <CardDescription>Upload da logo principal da sua empresa</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] p-8 bg-[var(--color-surface-variant)]/30 hover:bg-[var(--color-surface-variant)]/50 transition-colors cursor-pointer group">
                                {data.logoUrl ? (
                                    <img src={data.logoUrl} alt="Preview" className="max-h-24 mb-4" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                        <Upload className="w-8 h-8 text-[var(--color-primary)]" />
                                    </div>
                                )}
                                <p className="text-sm font-medium">Arraste ou clique para upload</p>
                                <p className="text-xs text-[var(--color-text-secondary)] mt-1">PNG, SVG ou JPG (Máx. 2MB)</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="text-sm font-medium mb-1 block">URL da Logo (Opcional)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 bg-[var(--color-surface-variant)] rounded-[var(--radius-md)] border-none"
                                        value={data.logoUrl || ''}
                                        onChange={(e) => setData({ ...data, logoUrl: e.target.value })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Colors Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="w-5 h-5" />
                                Paleta de Cores
                            </CardTitle>
                            <CardDescription>Defina as cores principais do seu portal</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Cor Primária</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        className="w-10 h-10 rounded cursor-pointer border-none p-0"
                                        value={data.primaryColor}
                                        onChange={(e) => setData({ ...data, primaryColor: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="flex-1 px-3 py-2 bg-[var(--color-surface-variant)] rounded border-none text-sm font-mono"
                                        value={data.primaryColor}
                                        onChange={(e) => setData({ ...data, primaryColor: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Cor Secundária</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        className="w-10 h-10 rounded cursor-pointer border-none p-0"
                                        value={data.secondaryColor}
                                        onChange={(e) => setData({ ...data, secondaryColor: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="flex-1 px-3 py-2 bg-[var(--color-surface-variant)] rounded border-none text-sm font-mono"
                                        value={data.secondaryColor}
                                        onChange={(e) => setData({ ...data, secondaryColor: e.target.value })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Typography Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Type className="w-5 h-5" />
                                Tipografia
                            </CardTitle>
                            <CardDescription>Escolha a fonte padrão do sistema</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <select
                                className="w-full px-4 py-3 bg-[var(--color-surface-variant)] rounded-[var(--radius-md)] border-none font-medium"
                                value={data.fontFamily}
                                onChange={(e) => setData({ ...data, fontFamily: e.target.value })}
                            >
                                <option value="Inter">Inter (Padrão)</option>
                                <option value="Roboto">Roboto</option>
                                <option value="Outfit">Outfit</option>
                                <option value="Montserrat">Montserrat</option>
                                <option value="Open Sans">Open Sans</option>
                            </select>
                        </CardContent>
                    </Card>
                </div>

                {/* Preview Section */}
                <div className="space-y-6">
                    <div className="sticky top-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Layout className="w-5 h-5" />
                            Preview em Tempo Real
                        </h3>
                        <div className="bg-white rounded-[var(--radius-xl)] shadow-2xl border border-gray-100 overflow-hidden">
                            <div className="h-12 border-b flex items-center px-4 gap-2" style={{ backgroundColor: data.primaryColor }}>
                                <div className="w-6 h-6 bg-white/20 rounded-full" />
                                <div className="w-24 h-3 bg-white/30 rounded" />
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <div className="h-4 w-3/4 bg-gray-100 rounded" />
                                    <div className="h-4 w-1/2 bg-gray-100 rounded" />
                                </div>
                                <div className="flex gap-2 mt-6">
                                    <div className="px-4 py-2 rounded text-[10px] text-white font-bold" style={{ backgroundColor: data.primaryColor }}>BOTÃO PRIMÁRIO</div>
                                    <div className="px-4 py-2 rounded text-[10px] text-gray-400 border border-gray-200 font-bold bg-white">SECUNDÁRIO</div>
                                </div>
                                <div className="pt-4 border-t mt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="h-3 w-16 bg-gray-100 rounded" />
                                        <div className="h-3 w-8 bg-green-100/50 rounded" style={{ color: data.accentColor }} />
                                    </div>
                                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                        <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: data.primaryColor }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-4 text-center">As alterações serão aplicadas a todos os usuários logo após salvar.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
