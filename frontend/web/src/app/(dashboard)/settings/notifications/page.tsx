'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Bell,
    Mail,
    Smartphone,
    Monitor,
    Volume2,
    Vibrate,
    Moon,
    Clock,
    Save,
    Undo,
    CheckCircle2,
    Info,
    Settings,
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { preferencesApi, NotificationPreferences, NotificationCategory } from '@/lib/api/notification';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export default function NotificationSettingsPage() {
    const { toast } = useToast();
    const [preferences, setPreferences] = useState<Partial<NotificationPreferences>>({
        emailEnabled: true,
        emailDigestFrequency: 'INSTANT',
        pushEnabled: true,
        pushSoundEnabled: true,
        pushVibrationEnabled: true,
        inAppEnabled: true,
        inAppSoundEnabled: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        categoryPreferences: {}
    });
    const [categories, setCategories] = useState<NotificationCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [prefsResponse, catsResponse] = await Promise.all([
                preferencesApi.get(),
                preferencesApi.getCategories()
            ]);

            if (prefsResponse.data) {
                setPreferences(prefsResponse.data);
            }
            if (catsResponse.data) {
                setCategories(catsResponse.data);
            }
        } catch (error) {
            console.error('Error loading notification settings:', error);
            // If it's 404, we might not have preferences yet, which is fine
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSave = useCallback(async () => {
        try {
            setSaving(true);
            await preferencesApi.update(preferences);
            toast({
                title: 'Sucesso',
                description: 'Configurações de notificações atualizadas!',
            });
        } catch (error) {
            console.error('Error saving notification settings:', error);
            toast({
                title: 'Erro',
                description: 'Erro ao salvar configurações',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    }, [preferences, toast]);

    const handleCategoryToggle = async (categoryCode: string, type: 'email' | 'push' | 'inApp', value: boolean) => {
        const currentPrefs = preferences.categoryPreferences?.[categoryCode] || { email: true, push: true, inApp: true };
        const newCategoryPrefs = { ...currentPrefs, [type]: value };

        // Optimistic update
        setPreferences(prev => ({
            ...prev,
            categoryPreferences: {
                ...prev.categoryPreferences,
                [categoryCode]: newCategoryPrefs
            }
        }));

        try {
            await preferencesApi.updateCategoryPreference(categoryCode, newCategoryPrefs);
        } catch (error) {
            console.error('Error updating category preference:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível atualizar a preferência desta categoria.',
                variant: 'destructive',
            });
            // Revert on error
            loadData();
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
            <Link
                href="/settings"
                className="flex items-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors mb-4 group w-fit"
            >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Voltar para Configurações
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Configurações de Notificações</h1>
                    <p className="text-[var(--color-text-secondary)]">Escolha como e quando você quer ser notificado</p>
                </div>
                <div className="flex gap-3">
                    <button
                        className="px-4 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-variant)] transition-colors flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]"
                        onClick={loadData}
                    >
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

            <div className="grid grid-cols-1 gap-8">
                {/* Canais Principais */}
                <Card className="border-none shadow-sm bg-[var(--color-surface)]">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Settings className="w-5 h-5 text-[var(--color-primary)]" />
                            Canais de Comunicação
                        </CardTitle>
                        <CardDescription>Ative ou desative os principais meios de recebimento</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-surface-variant)]/30 border border-[var(--color-border)]/50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-[var(--color-text-primary)]">E-mail</p>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Receba notificações importantes por e-mail</p>
                                </div>
                            </div>
                            <Switch
                                checked={preferences.emailEnabled}
                                onCheckedChange={(val) => setPreferences({ ...preferences, emailEnabled: val })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-surface-variant)]/30 border border-[var(--color-border)]/50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-[var(--color-text-primary)]">Push (Mobile)</p>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Notificações em tempo real no seu celular</p>
                                </div>
                            </div>
                            <Switch
                                checked={preferences.pushEnabled}
                                onCheckedChange={(val) => setPreferences({ ...preferences, pushEnabled: val })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-surface-variant)]/30 border border-[var(--color-border)]/50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <Monitor className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-[var(--color-text-primary)]">In-App (Web)</p>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Alertas visuais enquanto utiliza o portal</p>
                                </div>
                            </div>
                            <Switch
                                checked={preferences.inAppEnabled}
                                onCheckedChange={(val) => setPreferences({ ...preferences, inAppEnabled: val })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Preferências por Categoria */}
                <Card className="border-none shadow-sm bg-[var(--color-surface)]">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Bell className="w-5 h-5 text-[var(--color-primary)]" />
                            Preferências por Categoria
                        </CardTitle>
                        <CardDescription>Personalize o que você deseja receber em cada canal</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[var(--color-border)]">
                                        <th className="text-left py-4 px-2 text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Categoria</th>
                                        <th className="text-center py-4 px-2 text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider w-20">E-mail</th>
                                        <th className="text-center py-4 px-2 text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider w-20">Push</th>
                                        <th className="text-center py-4 px-2 text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider w-20">Web</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {categories.map((cat) => {
                                        const pref = preferences.categoryPreferences?.[cat.code] || {
                                            email: cat.defaultEmailEnabled,
                                            push: cat.defaultPushEnabled,
                                            inApp: cat.defaultInAppEnabled
                                        };
                                        return (
                                            <tr key={cat.id} className="group hover:bg-[var(--color-surface-variant)]/20 transition-colors">
                                                <td className="py-4 px-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ backgroundColor: cat.color || 'var(--color-primary)' }}>
                                                            {cat.code.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-[var(--color-text-primary)]">{cat.name}</p>
                                                            <p className="text-xs text-[var(--color-text-secondary)]">{cat.description}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-2 text-center">
                                                    <Switch
                                                        disabled={!preferences.emailEnabled}
                                                        checked={pref.email}
                                                        onCheckedChange={(val) => handleCategoryToggle(cat.code, 'email', val)}
                                                    />
                                                </td>
                                                <td className="py-4 px-2 text-center">
                                                    <Switch
                                                        disabled={!preferences.pushEnabled}
                                                        checked={pref.push}
                                                        onCheckedChange={(val) => handleCategoryToggle(cat.code, 'push', val)}
                                                    />
                                                </td>
                                                <td className="py-4 px-2 text-center">
                                                    <Switch
                                                        disabled={!preferences.inAppEnabled}
                                                        checked={pref.inApp}
                                                        onCheckedChange={(val) => handleCategoryToggle(cat.code, 'inApp', val)}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {categories.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-[var(--color-text-secondary)] italic">
                                                Nenhuma categoria configurada.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Configurações Avançadas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="border-none shadow-sm bg-[var(--color-surface)]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Volume2 className="w-5 h-5 text-[var(--color-primary)]" />
                                Som e Vibração
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Volume2 className="w-4 h-4 text-[var(--color-text-secondary)]" />
                                    <span className="text-sm font-medium">Som no Portal (Web)</span>
                                </div>
                                <Switch
                                    checked={preferences.inAppSoundEnabled}
                                    onCheckedChange={(val) => setPreferences({ ...preferences, inAppSoundEnabled: val })}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Volume2 className="w-4 h-4 text-[var(--color-text-secondary)]" />
                                    <span className="text-sm font-medium">Som no Mobile (Push)</span>
                                </div>
                                <Switch
                                    checked={preferences.pushSoundEnabled}
                                    onCheckedChange={(val) => setPreferences({ ...preferences, pushSoundEnabled: val })}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Vibrate className="w-4 h-4 text-[var(--color-text-secondary)]" />
                                    <span className="text-sm font-medium">Vibração no Mobile</span>
                                </div>
                                <Switch
                                    checked={preferences.pushVibrationEnabled}
                                    onCheckedChange={(val) => setPreferences({ ...preferences, pushVibrationEnabled: val })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-[var(--color-surface)]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Moon className="w-5 h-5 text-[var(--color-primary)]" />
                                Horário de Silêncio
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Moon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                                    <span className="text-sm font-medium">Ativar Silêncio</span>
                                </div>
                                <Switch
                                    checked={preferences.quietHoursEnabled}
                                    onCheckedChange={(val) => setPreferences({ ...preferences, quietHoursEnabled: val })}
                                />
                            </div>

                            {preferences.quietHoursEnabled && (
                                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] mb-1 block">Início</label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
                                            <input
                                                type="time"
                                                className="w-full pl-9 pr-3 py-2 bg-[var(--color-surface-variant)] border-none rounded-lg text-sm"
                                                value={preferences.quietHoursStart}
                                                onChange={(e) => setPreferences({ ...preferences, quietHoursStart: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] mb-1 block">Fim</label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
                                            <input
                                                type="time"
                                                className="w-full pl-9 pr-3 py-2 bg-[var(--color-surface-variant)] border-none rounded-lg text-sm"
                                                value={preferences.quietHoursEnd}
                                                onChange={(e) => setPreferences({ ...preferences, quietHoursEnd: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-4">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <p className="text-sm text-blue-700 leading-relaxed">
                    <strong>Importante:</strong> Notificações críticas de segurança e avisos obrigatórios do sistema poderão ser enviados mesmo que os canais acima estejam desativados.
                </p>
            </div>
        </div>
    );
}
