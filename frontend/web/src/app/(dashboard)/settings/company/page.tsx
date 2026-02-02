'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    setupApi,
    CompanyProfile,
    BRAZIL_STATES,
    validateCNPJ,
    formatCNPJ
} from '@/lib/api/setup';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Building2, Save, ArrowLeft, MapPin, Shield, Info, Loader2, Navigation, Crosshair } from 'lucide-react';
import { toast } from 'sonner';

export default function CompanySettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [profile, setProfile] = useState<CompanyProfile>({
        legalName: '',
        cnpj: '',
        geofenceEnabled: false,
        geofenceRadius: 100
    });

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                const data = await setupApi.getCompanyProfile();
                setProfile(data);
            } catch (error) {
                console.error('Error loading company profile:', error);
                toast.error('Erro ao carregar dados da empresa');
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);

    const handleSave = async () => {
        try {
            if (!profile.legalName || !profile.cnpj) {
                toast.error('Razão Social e CNPJ são obrigatórios');
                return;
            }

            if (!validateCNPJ(profile.cnpj)) {
                toast.error('CNPJ inválido');
                return;
            }

            setSaving(true);
            await setupApi.saveCompanyProfile(profile);
            toast.success('Configurações salvas com sucesso');
        } catch (error) {
            console.error('Error saving company profile:', error);
            toast.error('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocalização não é suportada pelo seu navegador');
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setProfile(prev => ({
                    ...prev,
                    geofenceLatitude: position.coords.latitude,
                    geofenceLongitude: position.coords.longitude
                }));
                setGettingLocation(false);
                toast.success('Localização capturada com sucesso!');
            },
            (error) => {
                console.error('Error getting location:', error);
                setGettingLocation(false);
                toast.error('Não foi possível obter sua localização. Verifique as permissões.');
            },
            { enableHighAccuracy: true }
        );
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors mb-2"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para Configurações
                    </button>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Dados da Empresa</h1>
                    <p className="text-[var(--color-text-secondary)] mt-1">
                        Gerencie as informações jurídicas e de localização da sua organização.
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary"
                >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Salvar Alterações
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Informações Básicas */}
                <Card className="border-none shadow-lg bg-[var(--color-surface)]">
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <CardTitle>Informações Jurídicas</CardTitle>
                        </div>
                        <CardDescription>Dados cadastrais da empresa para fins legais e de emissão.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="legalName" className="font-semibold text-sm">Razão Social *</Label>
                                <Input
                                    id="legalName"
                                    value={profile.legalName}
                                    onChange={(e) => setProfile({ ...profile, legalName: e.target.value })}
                                    className="bg-[var(--color-surface-variant)]/50 border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]"
                                    placeholder="Nome jurídico da empresa"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tradeName" className="font-semibold text-sm">Nome Fantasia</Label>
                                <Input
                                    id="tradeName"
                                    value={profile.tradeName || ''}
                                    onChange={(e) => setProfile({ ...profile, tradeName: e.target.value })}
                                    className="bg-[var(--color-surface-variant)]/50 border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]"
                                    placeholder="Nome comercial"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cnpj" className="font-semibold text-sm">CNPJ *</Label>
                                <Input
                                    id="cnpj"
                                    value={formatCNPJ(profile.cnpj)}
                                    onChange={(e) => setProfile({ ...profile, cnpj: e.target.value.replace(/\D/g, '') })}
                                    className="bg-[var(--color-surface-variant)]/50 border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]"
                                    placeholder="00.000.000/0000-00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="taxRegime" className="font-semibold text-sm">Regime Tributário</Label>
                                <Select
                                    value={profile.taxRegime || ''}
                                    onValueChange={(value) => setProfile({ ...profile, taxRegime: value as any })}
                                >
                                    <SelectTrigger className="bg-[var(--color-surface-variant)]/50 border-[var(--color-border)]">
                                        <SelectValue placeholder="Selecione o regime" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SIMPLES">Simples Nacional</SelectItem>
                                        <SelectItem value="LUCRO_PRESUMIDO">Lucro Presumido</SelectItem>
                                        <SelectItem value="LUCRO_REAL">Lucro Real</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Endereço */}
                <Card className="border-none shadow-lg bg-[var(--color-surface)]">
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <CardTitle>Endereço</CardTitle>
                        </div>
                        <CardDescription>Endereço da sede administrativa principal.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="street" className="font-semibold text-sm">Logradouro</Label>
                                <Input
                                    id="street"
                                    value={profile.addressStreet || ''}
                                    onChange={(e) => setProfile({ ...profile, addressStreet: e.target.value })}
                                    className="bg-[var(--color-surface-variant)]/50 border-[var(--color-border)]"
                                    placeholder="Rua, Avenida, etc."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="number" className="font-semibold text-sm">Número</Label>
                                <Input
                                    id="number"
                                    value={profile.addressNumber || ''}
                                    onChange={(e) => setProfile({ ...profile, addressNumber: e.target.value })}
                                    className="bg-[var(--color-surface-variant)]/50 border-[var(--color-border)]"
                                    placeholder="123"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="neighborhood" className="font-semibold text-sm">Bairro</Label>
                                <Input
                                    id="neighborhood"
                                    value={profile.addressNeighborhood || ''}
                                    onChange={(e) => setProfile({ ...profile, addressNeighborhood: e.target.value })}
                                    className="bg-[var(--color-surface-variant)]/50 border-[var(--color-border)]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city" className="font-semibold text-sm">Cidade</Label>
                                <Input
                                    id="city"
                                    value={profile.addressCity || ''}
                                    onChange={(e) => setProfile({ ...profile, addressCity: e.target.value })}
                                    className="bg-[var(--color-surface-variant)]/50 border-[var(--color-border)]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state" className="font-semibold text-sm">Estado</Label>
                                <Select
                                    value={profile.addressState || ''}
                                    onValueChange={(value) => setProfile({ ...profile, addressState: value })}
                                >
                                    <SelectTrigger className="bg-[var(--color-surface-variant)]/50 border-[var(--color-border)]">
                                        <SelectValue placeholder="UF" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BRAZIL_STATES.map((state) => (
                                            <SelectItem key={state.code} value={state.code}>
                                                {state.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Cerca Digital */}
                <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden group">
                    <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black tracking-tight">Cerca Digital (Geofencing)</CardTitle>
                                    <CardDescription className="text-slate-500 font-medium">Controle o perímetro permitido para registro de ponto.</CardDescription>
                                </div>
                            </div>
                        </div>
                        <Switch
                            checked={profile.geofenceEnabled || false}
                            onCheckedChange={(checked) => setProfile({ ...profile, geofenceEnabled: checked })}
                            className="data-[state=checked]:bg-indigo-600"
                        />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {profile.geofenceEnabled ? (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-top-4 duration-500">
                                <div className="lg:col-span-5 space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="latitude" className="font-bold text-xs uppercase tracking-widest text-slate-500">Latitude</Label>
                                            <div className="relative group/input">
                                                <Input
                                                    id="latitude"
                                                    type="number"
                                                    step="any"
                                                    value={profile.geofenceLatitude || ''}
                                                    onChange={(e) => setProfile({ ...profile, geofenceLatitude: parseFloat(e.target.value) })}
                                                    className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 h-11 pl-10 font-mono focus:ring-2 focus:ring-indigo-500/20"
                                                    placeholder="-23.5505"
                                                />
                                                <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="longitude" className="font-bold text-xs uppercase tracking-widest text-slate-500">Longitude</Label>
                                            <div className="relative group/input">
                                                <Input
                                                    id="longitude"
                                                    type="number"
                                                    step="any"
                                                    value={profile.geofenceLongitude || ''}
                                                    onChange={(e) => setProfile({ ...profile, geofenceLongitude: parseFloat(e.target.value) })}
                                                    className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 h-11 pl-10 font-mono focus:ring-2 focus:ring-indigo-500/20"
                                                    placeholder="-46.6333"
                                                />
                                                <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="radius" className="font-bold text-xs uppercase tracking-widest text-slate-500">Raio de Alcance (metros)</Label>
                                        <div className="flex gap-3">
                                            <Input
                                                id="radius"
                                                type="number"
                                                value={profile.geofenceRadius || 100}
                                                onChange={(e) => setProfile({ ...profile, geofenceRadius: parseInt(e.target.value) })}
                                                className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 h-11 font-bold focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                            <Button
                                                variant="outline"
                                                onClick={handleGetLocation}
                                                disabled={gettingLocation}
                                                className="h-11 px-6 rounded-xl border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2"
                                            >
                                                {gettingLocation ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Crosshair className="w-4 h-4" />
                                                )}
                                                {gettingLocation ? 'Capturando...' : 'Minha Localização'}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="p-5 rounded-2xl bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/50 space-y-3">
                                        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                                            <Info className="w-4 h-4" />
                                            <span className="font-black text-xs uppercase tracking-widest">Pro Tip</span>
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                            Se você estiver fisicamente no local da empresa, use o botão <span className="text-indigo-600 font-bold">Minha Localização</span> para preencher automaticamente as coordenadas. O raio define a distância máxima que o colaborador pode estar para bater o ponto.
                                        </p>
                                    </div>
                                </div>

                                <div className="lg:col-span-7 relative group/map">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-10 group-hover/map:opacity-20 transition duration-1000"></div>
                                    <div className="relative h-[300px] w-full rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-inner bg-slate-50">
                                        {profile.geofenceLatitude && profile.geofenceLongitude ? (
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                frameBorder="0"
                                                scrolling="no"
                                                marginHeight={0}
                                                marginWidth={0}
                                                src={`https://maps.google.com/maps?q=${profile.geofenceLatitude},${profile.geofenceLongitude}&t=&z=17&ie=UTF8&iwloc=&output=embed`}
                                                title="Geofence Preview"
                                                className="w-full h-full filter brightness-[0.9] group-hover/map:brightness-100 transition-all duration-500 scale-100 group-hover/map:scale-105"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                                                <div className="p-4 bg-slate-100 rounded-full animate-pulse">
                                                    <MapPin className="w-8 h-8 opacity-40" />
                                                </div>
                                                <p className="text-sm font-bold uppercase tracking-widest opacity-60">Aguardando Coordenadas</p>
                                            </div>
                                        )}
                                        {/* Geofence Overlay Circle Mockup */}
                                        {profile.geofenceLatitude && profile.geofenceLongitude && (
                                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                                <div
                                                    className="border-2 border-indigo-500 bg-indigo-500/10 rounded-full animate-pulse-slow"
                                                    style={{
                                                        width: '120px',
                                                        height: '120px',
                                                        transition: 'all 0.5s ease'
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-lg border border-white/40 text-[10px] font-black uppercase tracking-widest text-indigo-600 z-10">
                                        Preview em Tempo Real
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 group-hover:border-indigo-300 transition-colors">
                                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mx-auto mb-4 group-hover:rotate-6 transition-transform">
                                    <Shield className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Cerca Digital Desativada</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 font-medium px-6">
                                    Ao ativar a cerca digital, você restringe o local onde os colaboradores podem registrar o ponto. Registros fora da área exigirão aprovação.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => setProfile({ ...profile, geofenceEnabled: true })}
                                    className="mt-6 rounded-xl border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold"
                                >
                                    Ativar Agora
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Footer space */}
            <div className="h-12"></div>
        </div>
    );
}
