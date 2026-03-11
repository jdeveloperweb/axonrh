'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, ArrowLeft, Loader2, CheckCircle2, QrCode, Lock } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/api/auth';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';

export default function SecuritySettingsPage() {
    const { user, logout } = useAuthStore();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [mfaSetup, setMfaSetup] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
    const [verifyCode, setVerifyCode] = useState('');
    const [isPedingVerification, setIsPendingVerification] = useState(false);

    const handleSetupMfa = async () => {
        try {
            setLoading(true);
            const setup = await authApi.setup2FA();
            setMfaSetup(setup);
            setIsPendingVerification(true);
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível iniciar a configuração do MFA.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEnableMfa = async () => {
        if (!mfaSetup || !verifyCode) return;

        try {
            setLoading(true);
            await authApi.confirm2FA(mfaSetup.secret, verifyCode);
            toast({
                title: 'Sucesso',
                description: 'MFA ativado com sucesso! Você precisará usá-lo no próximo login.',
            });
            // logout(); // Opcional: forçar login novamente
            window.location.reload(); // Para atualizar o estado do user
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Código de verificação inválido.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDisableMfa = async () => {
        if (!verifyCode) return;

        try {
            setLoading(true);
            await authApi.disable2FA(verifyCode);
            toast({
                title: 'Sucesso',
                description: 'MFA desativado com sucesso.',
            });
            window.location.reload();
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Código de verificação inválido.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <Link
                href="/settings"
                className="flex items-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors mb-4 group w-fit"
            >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Voltar para Configurações
            </Link>

            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Segurança da Conta</h1>
                <p className="text-[var(--color-text-secondary)]">Gerencie como você protege seu acesso ao AxonRH</p>
            </div>

            <Card className="border-none shadow-lg bg-[var(--color-surface)]">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${user?.twoFactorEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <CardTitle className="text-xl">Autenticação de Dois Fatores (MFA)</CardTitle>
                        <CardDescription>
                            {user?.twoFactorEnabled
                                ? 'Seu acesso está protegido por uma camada extra de segurança.'
                                : 'Adicione uma camada extra de segurança usando um aplicativo autenticador.'}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    {!user?.twoFactorEnabled && !isPedingVerification && (
                        <div className="space-y-4">
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                O MFA exige um código gerado pelo seu celular toda vez que você faz login.
                                Recomendamos o uso de aplicativos como Google Authenticator, Microsoft Authenticator ou Authy.
                            </p>
                            <button
                                onClick={handleSetupMfa}
                                disabled={loading}
                                className="btn-primary flex items-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                Configurar MFA
                            </button>
                        </div>
                    )}

                    {isPedingVerification && mfaSetup && (
                        <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                            <div className="flex flex-col md:flex-row gap-8 items-center bg-[var(--color-surface-variant)]/30 p-6 rounded-2xl border border-[var(--color-border)]">
                                <div className="bg-white p-4 rounded-xl shadow-inner">
                                    <QRCodeSVG value={mfaSetup.qrCodeUrl} size={180} />
                                </div>
                                <div className="space-y-4 flex-1">
                                    <h4 className="font-bold flex items-center gap-2">
                                        <QrCode className="w-4 h-4 text-[var(--color-primary)]" />
                                        Escaneie o QR Code
                                    </h4>
                                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                        Abra seu aplicativo autenticador e escaneie o código ao lado.
                                        Se não conseguir escanear, use a chave manual abaixo:
                                    </p>
                                    <div className="p-3 bg-white rounded border border-dashed border-slate-300 font-mono text-xs break-all text-center">
                                        {mfaSetup.secret}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-semibold">Insira o código de 6 dígitos para confirmar:</label>
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        placeholder="000 000"
                                        className="input max-w-[200px] text-center text-2xl tracking-[0.5em]"
                                        value={verifyCode}
                                        onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        maxLength={6}
                                    />
                                    <button
                                        onClick={handleEnableMfa}
                                        disabled={loading || verifyCode.length !== 6}
                                        className="btn-primary flex-1"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ativar Agora'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {user?.twoFactorEnabled && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="text-sm font-medium">MFA está ATIVADO na sua conta.</span>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-bold text-sm text-red-600 flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4" />
                                    Zona de Perigo
                                </h4>
                                <p className="text-xs text-[var(--color-text-secondary)]">
                                    Ao desativar o MFA, sua conta ficará menos protegida. Você precisará de um código atual para realizar esta ação.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        type="text"
                                        placeholder="Código de 6 dígitos"
                                        className="input max-w-[200px]"
                                        value={verifyCode}
                                        onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        maxLength={6}
                                    />
                                    <button
                                        onClick={handleDisableMfa}
                                        disabled={loading || verifyCode.length !== 6}
                                        className="btn-outline text-red-600 hover:bg-red-50 border-red-200"
                                    >
                                        Desativar MFA
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
