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
import { Building2, Save, ArrowLeft, MapPin, Shield, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CompanySettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
                <Card className="border-none shadow-lg bg-[var(--color-surface)] overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <CardTitle>Cerca Digital (Geofencing)</CardTitle>
                            </div>
                            <CardDescription>Controle o perímetro permitido para registro de ponto.</CardDescription>
                        </div>
                        <Switch
                            checked={profile.geofenceEnabled || false}
                            onCheckedChange={(checked) => setProfile({ ...profile, geofenceEnabled: checked })}
                        />
                    </CardHeader>
                    <CardContent>
                        {profile.geofenceEnabled ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-500">
                                <div className="space-y-2">
                                    <Label htmlFor="latitude" className="font-semibold text-sm">Latitude</Label>
                                    <div className="relative">
                                        <Input
                                            id="latitude"
                                            type="number"
                                            step="any"
                                            value={profile.geofenceLatitude || ''}
                                            onChange={(e) => setProfile({ ...profile, geofenceLatitude: parseFloat(e.target.value) })}
                                            className="bg-[var(--color-surface-variant)]/50 border-[var(--color-border)] pl-9"
                                            placeholder="-23.5505"
                                        />
                                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-secondary)]" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="longitude" className="font-semibold text-sm">Longitude</Label>
                                    <div className="relative">
                                        <Input
                                            id="longitude"
                                            type="number"
                                            step="any"
                                            value={profile.geofenceLongitude || ''}
                                            onChange={(e) => setProfile({ ...profile, geofenceLongitude: parseFloat(e.target.value) })}
                                            className="bg-[var(--color-surface-variant)]/50 border-[var(--color-border)] pl-9"
                                            placeholder="-46.6333"
                                        />
                                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-secondary)]" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="radius" className="font-semibold text-sm">Raio (metros)</Label>
                                    <Input
                                        id="radius"
                                        type="number"
                                        value={profile.geofenceRadius || 100}
                                        onChange={(e) => setProfile({ ...profile, geofenceRadius: parseInt(e.target.value) })}
                                        className="bg-[var(--color-surface-variant)]/50 border-[var(--color-border)]"
                                    />
                                </div>

                                <div className="md:col-span-3 flex items-start gap-3 p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-blue-700 text-sm">
                                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="font-semibold">Como obter as coordenadas?</p>
                                        <p className="opacity-90">
                                            Acesse o Google Maps, clique com o botão direito sobre o local da empresa e copie os números que aparecem (ex: -23.5505, -46.6333).
                                            O raio define a distância máxima (em metros) que o colaborador pode estar da sede para bater o ponto sem necessidade de aprovação.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <h3 className="font-semibold text-slate-600">Cerca Digital Desativada</h3>
                                <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2">
                                    Ative esta função para restringir o local onde os colaboradores podem registrar o ponto.
                                    Registros fora do local serão enviados para aprovação do RH.
                                </p>
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
