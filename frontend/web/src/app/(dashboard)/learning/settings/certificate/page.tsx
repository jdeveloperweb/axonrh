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
            toast.error('Erro ao carregar configurações de certificado');
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

    if (loading) {
        return <div className="flex items-center justify-center h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Button variant="ghost" onClick={() => router.back()} className="mb-2 -ml-2 p-0 h-auto hover:bg-transparent text-muted-foreground font-bold text-xs uppercase tracking-widest gap-2">
                        <ArrowLeft className="h-3 w-3" /> Voltar
                    </Button>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Award className="h-8 w-8 text-primary" />
                        Configurações de Certificados
                    </h1>
                    <p className="text-muted-foreground font-medium">Configure como os certificados dos cursos serão emitidos e quem assinará como instrutor.</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="font-bold gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>

            <div className="grid gap-6">
                <Card className="border-primary/10 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            Assinatura Geral do RH / Empresa
                        </CardTitle>
                        <CardDescription>Esta assinatura aparecerá em todos os certificados emitidos pela plataforma.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="generalSignerName" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Nome do Responsável / Cargo</Label>
                                <Input
                                    id="generalSignerName"
                                    placeholder="Ex: Maria Silva - Diretora de RH"
                                    value={config.generalSignerName || ''}
                                    onChange={(e) => setConfig({ ...config, generalSignerName: e.target.value })}
                                    className="font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="generalSignatureUrl" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">URL da Assinatura Digital</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="generalSignatureUrl"
                                        placeholder="https://..."
                                        value={config.generalSignatureUrl || ''}
                                        onChange={(e) => setConfig({ ...config, generalSignatureUrl: e.target.value })}
                                        className="font-medium"
                                    />
                                    <Button variant="outline" size="icon" className="shrink-0">
                                        <Upload className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-primary/10 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <UserCircle2 className="h-5 w-5 text-primary" />
                            Assinatura Padrão do Instrutor
                        </CardTitle>
                        <CardDescription>Dados do instrutor que aparecerão se não houver um instrutor específico definido no curso.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="instructorName" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Nome do Instrutor Padrão</Label>
                                <Input
                                    id="instructorName"
                                    placeholder="Ex: Time de Educação Axon"
                                    value={config.instructorName || ''}
                                    onChange={(e) => setConfig({ ...config, instructorName: e.target.value })}
                                    className="font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="instructorSignatureUrl" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">URL da Assinatura do Instrutor</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="instructorSignatureUrl"
                                        placeholder="https://..."
                                        value={config.instructorSignatureUrl || ''}
                                        onChange={(e) => setConfig({ ...config, instructorSignatureUrl: e.target.value })}
                                        className="font-medium"
                                    />
                                    <Button variant="outline" size="icon" className="shrink-0">
                                        <Upload className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-primary/10 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Building2 className="h-5 w-5 text-primary" />
                            Identidade Visual
                        </CardTitle>
                        <CardDescription>Personalize a aparência do certificado com a logo da sua empresa.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-muted-foreground/10">
                            <div className="space-y-1">
                                <Label className="font-bold">Exibir logo da empresa no certificado</Label>
                                <p className="text-xs text-muted-foreground">Se desativado, apenas o texto do certificado será exibido.</p>
                            </div>
                            <Switch
                                checked={config.showCompanyLogo}
                                onCheckedChange={(val) => setConfig({ ...config, showCompanyLogo: val })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="companyLogoUrl" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">URL da Logo da Empresa</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="companyLogoUrl"
                                    placeholder="Deixe vazio para usar a logo padrão do sistema"
                                    value={config.companyLogoUrl || ''}
                                    onChange={(e) => setConfig({ ...config, companyLogoUrl: e.target.value })}
                                    className="font-medium"
                                />
                                <Button variant="outline" size="icon" className="shrink-0">
                                    <Upload className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex gap-4">
                <Award className="h-10 w-10 text-amber-600 shrink-0" />
                <div className="space-y-2">
                    <h4 className="font-black text-amber-900 uppercase tracking-tight">Dica de Praticidade</h4>
                    <p className="text-sm text-amber-800 font-medium">As assinaturas devem ser imagens em formato PNG com fundo transparente para garantir a melhor aparência nos certificados gerados em PDF.</p>
                </div>
            </div>
        </div>
    );
}
