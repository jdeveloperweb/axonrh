'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Award, Upload, Save, Building2, UserCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { certificateConfigsApi, CertificateConfig } from '@/lib/api/learning';
import { useRouter } from 'next/navigation';

export default function CertificateSettingsPage() {
    const router = useRouter();
    const [config, setConfig] = useState<CertificateConfig>({
        instructorName: '',
        instructorSignatureUrl: '',
        generalSignerName: '',
        generalSignatureUrl: '',
        companyLogoUrl: '',
        showCompanyLogo: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const res = await certificateConfigsApi.get();
            if (res && (res as any).data) {
                setConfig((res as any).data);
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            // toast.error('Erro ao carregar configurações de certificado');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await certificateConfigsApi.save(config);
            toast.success('Configurações salvas com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field: keyof CertificateConfig, value: string) => {
        setConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (loading) {
        return <div className="flex items-center justify-center h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>;
    }

    return (
        <div className="max-w-[1200px] mx-auto space-y-10 pb-20 px-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="pt-8 space-y-6">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-2 -ml-2 h-10 px-3 hover:bg-slate-100 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest gap-2"
                >
                    <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] w-fit shadow-xl">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                            Configurações Gerais
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none flex items-center gap-4">
                            <Award className="h-12 w-12 text-primary" />
                            Configurações de Certificados
                        </h1>
                        <p className="text-slate-500 font-medium text-lg max-w-2xl">
                            Configure como os certificados dos cursos serão emitidos e quem assinará como instrutor.
                        </p>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="h-16 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 transition-all hover:-translate-y-1 active:scale-95 flex gap-3"
                    >
                        <Save className="h-5 w-5" />
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            </div>

            {/* Cards */}
            <div className="grid gap-8">
                {/* Assinatura Geral */}
                <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-slate-50 py-8 px-10">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <ShieldCheck className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black">Assinatura Geral do RH / Empresa</CardTitle>
                                <CardDescription className="text-base mt-1">Esta assinatura aparecerá em todos os certificados emitidos pela plataforma.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 space-y-8">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <Label htmlFor="generalSignerName" className="text-xs font-black uppercase text-slate-400 tracking-widest">
                                    Nome do Responsável / Cargo
                                </Label>
                                <Input
                                    id="generalSignerName"
                                    placeholder="Ex: Maria Silva - Diretora de RH"
                                    value={config.generalSignerName || ''}
                                    onChange={(e) => handleInputChange('generalSignerName', e.target.value)}
                                    className="h-14 rounded-xl border-slate-200 bg-white font-bold text-lg shadow-sm focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                                />
                            </div>
                            <div className="space-y-4">
                                <Label htmlFor="generalSignatureUrl" className="text-xs font-black uppercase text-slate-400 tracking-widest">
                                    URL da Assinatura Digital
                                </Label>
                                <div className="flex gap-3">
                                    <Input
                                        id="generalSignatureUrl"
                                        placeholder="https://sua-empresa.com/assinatura.png"
                                        value={config.generalSignatureUrl || ''}
                                        onChange={(e) => handleInputChange('generalSignatureUrl', e.target.value)}
                                        className="h-14 rounded-xl border-slate-200 bg-white font-bold text-sm shadow-sm focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                                    />
                                    <Button variant="outline" size="icon" className="h-14 w-14 rounded-xl border-slate-200 shrink-0">
                                        <Upload className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Assinatura Padrão do Instrutor */}
                <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-slate-50 py-8 px-10">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <UserCircle2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black">Assinatura Padrão do Instrutor</CardTitle>
                                <CardDescription className="text-base mt-1">Dados do instrutor que aparecerão se não houver um instrutor específico definido no curso.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 space-y-8">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <Label htmlFor="instructorName" className="text-xs font-black uppercase text-slate-400 tracking-widest">
                                    Nome do Instrutor Padrão
                                </Label>
                                <Input
                                    id="instructorName"
                                    placeholder="Ex: Time de Educação Axon"
                                    value={config.instructorName || ''}
                                    onChange={(e) => handleInputChange('instructorName', e.target.value)}
                                    className="h-14 rounded-xl border-slate-200 bg-white font-bold text-lg shadow-sm focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                                />
                            </div>
                            <div className="space-y-4">
                                <Label htmlFor="instructorSignatureUrl" className="text-xs font-black uppercase text-slate-400 tracking-widest">
                                    URL da Assinatura do Instrutor
                                </Label>
                                <div className="flex gap-3">
                                    <Input
                                        id="instructorSignatureUrl"
                                        placeholder="https://sua-empresa.com/assinatura.png"
                                        value={config.instructorSignatureUrl || ''}
                                        onChange={(e) => handleInputChange('instructorSignatureUrl', e.target.value)}
                                        className="h-14 rounded-xl border-slate-200 bg-white font-bold text-sm shadow-sm focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                                    />
                                    <Button variant="outline" size="icon" className="h-14 w-14 rounded-xl border-slate-200 shrink-0">
                                        <Upload className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Identidade Visual */}
                <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-slate-50 py-8 px-10">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black">Identidade Visual</CardTitle>
                                <CardDescription className="text-base mt-1">Personalize a aparência do certificado com a logo da sua empresa.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 space-y-8">
                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="space-y-1">
                                <Label className="font-black text-sm">Exibir logo da empresa no certificado</Label>
                                <p className="text-xs text-slate-500">Se desativado, apenas o texto do certificado será exibido.</p>
                            </div>
                            <Switch
                                checked={config.showCompanyLogo}
                                onCheckedChange={(val) => setConfig({ ...config, showCompanyLogo: val })}
                            />
                        </div>

                        <div className="space-y-4">
                            <Label htmlFor="companyLogoUrl" className="text-xs font-black uppercase text-slate-400 tracking-widest">
                                URL da Logo da Empresa
                            </Label>
                            <div className="flex gap-3">
                                <Input
                                    id="companyLogoUrl"
                                    placeholder="Deixe vazio para usar a logo padrão do sistema"
                                    value={config.companyLogoUrl || ''}
                                    onChange={(e) => handleInputChange('companyLogoUrl', e.target.value)}
                                    className="h-14 rounded-xl border-slate-200 bg-white font-bold text-sm shadow-sm focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                                />
                                <Button variant="outline" size="icon" className="h-14 w-14 rounded-xl border-slate-200 shrink-0">
                                    <Upload className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50/50 border border-blue-100/50 p-8 rounded-2xl flex gap-6">
                <Award className="h-12 w-12 text-blue-500 shrink-0" />
                <div className="space-y-2">
                    <h4 className="font-black text-blue-900 text-lg uppercase tracking-tight">Dica de Praticidade</h4>
                    <p className="text-sm text-blue-700 font-medium leading-relaxed">
                        As assinaturas devem ser imagens em formato PNG com fundo transparente para garantir a melhor aparência nos certificados gerados em PDF.
                    </p>
                </div>
            </div>
        </div>
    );
}
