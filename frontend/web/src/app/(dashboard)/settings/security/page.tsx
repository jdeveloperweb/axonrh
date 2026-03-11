'use client';

import { useState } from 'react';
import { ShieldCheck, ShieldAlert, ArrowLeft, Loader2, QrCode, Lock, Smartphone, KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/api/auth';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

export default function SecuritySettingsPage() {
    const { user, setUser } = useAuthStore();
    const { toast } = useToast();

    // MFA States
    const [loadingMfa, setLoadingMfa] = useState(false);
    const [mfaSetup, setMfaSetup] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
    const [verifyCode, setVerifyCode] = useState('');
    const [isPedingVerification, setIsPendingVerification] = useState(false);

    // Password States
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // MFA Handlers
    const handleSetupMfa = async () => {
        try {
            setLoadingMfa(true);
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
            setLoadingMfa(false);
        }
    };

    const handleEnableMfa = async () => {
        if (!mfaSetup || !verifyCode) return;

        try {
            setLoadingMfa(true);
            await authApi.confirm2FA(mfaSetup.secret, verifyCode);

            // Refresh user data
            const updatedUser = await authApi.me();
            setUser(updatedUser);

            setIsPendingVerification(false);
            setMfaSetup(null);
            setVerifyCode('');

            toast({
                title: 'Sucesso',
                description: 'Autenticação de dois fatores ativada com sucesso!',
            });
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Código de verificação inválido.',
                variant: 'destructive',
            });
        } finally {
            setLoadingMfa(false);
        }
    };

    const handleDisableMfa = async () => {
        if (!verifyCode) return;

        try {
            setLoadingMfa(true);
            await authApi.disable2FA(verifyCode);

            // Refresh user data
            const updatedUser = await authApi.me();
            setUser(updatedUser);

            setVerifyCode('');
            toast({
                title: 'Sucesso',
                description: 'MFA desativado com sucesso.',
            });
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Código de verificação inválido.',
                variant: 'destructive',
            });
        } finally {
            setLoadingMfa(false);
        }
    };

    // Password Handler
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast({
                title: 'Erro',
                description: 'As senhas não coincidem.',
                variant: 'destructive',
            });
            return;
        }

        try {
            setLoadingPassword(true);
            await authApi.changePassword(passwordData.currentPassword, passwordData.newPassword);

            toast({
                title: 'Sucesso',
                description: 'Senha alterada com sucesso!',
            });

            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao alterar senha.';
            toast({
                title: 'Erro',
                description: message,
                variant: 'destructive',
            });
        } finally {
            setLoadingPassword(false);
        }
    };

    const inputClasses = "input bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white";

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10 px-4">
            <Link
                href="/dashboard"
                className="flex items-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors mb-4 group w-fit"
            >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Voltar para o Dashboard
            </Link>

            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Segurança e Acesso</h1>
                <p className="text-[var(--color-text-secondary)]">Proteja sua conta alterando sua senha e ativando o MFA.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. Alteração de Senha */}
                <Card className="border-none shadow-lg bg-[var(--color-surface)] h-fit">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                            <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Alterar Senha</CardTitle>
                            <CardDescription>Mantenha sua senha atualizada.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Senha Atual</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords ? "text" : "password"}
                                        className={cn(inputClasses, "w-full pr-10")}
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(!showPasswords)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Nova Senha</label>
                                <input
                                    type={showPasswords ? "text" : "password"}
                                    className={cn(inputClasses, "w-full")}
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    required
                                    minLength={8}
                                />
                                <p className="text-[10px] text-slate-400">Mínimo de 8 caracteres.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Confirmar Nova Senha</label>
                                <input
                                    type={showPasswords ? "text" : "password"}
                                    className={cn(inputClasses, "w-full")}
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loadingPassword}
                                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
                            >
                                {loadingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                Atualizar Senha
                            </button>
                        </form>
                    </CardContent>
                </Card>

                {/* 2. Configuração de MFA */}
                <Card className="border-none shadow-lg bg-[var(--color-surface)] h-fit">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            user?.twoFactorEnabled ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                        )}>
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Segurança (MFA)</CardTitle>
                            <CardDescription>
                                {user?.twoFactorEnabled ? "Proteção ativa." : "Camada extra de proteção."}
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {!user?.twoFactorEnabled && !isPedingVerification && (
                            <div className="space-y-4 text-center lg:text-left">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    A autenticação de dois fatores adiciona uma camada extra de segurança à sua conta.
                                </p>
                                <button
                                    onClick={handleSetupMfa}
                                    disabled={loadingMfa}
                                    className="btn-outline border-blue-200 text-blue-600 hover:bg-blue-50 w-full flex items-center justify-center gap-2"
                                >
                                    {loadingMfa ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                                    Configurar MFA
                                </button>
                            </div>
                        )}

                        {isPedingVerification && mfaSetup && (
                            <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                                <div className="flex flex-col items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <div className="bg-white p-2 rounded-lg mb-3 shadow-inner">
                                        <QRCodeSVG value={mfaSetup.qrCodeUrl} size={150} />
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-mono break-all text-center">
                                        {mfaSetup.secret}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Código do App</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="000000"
                                            className={cn(inputClasses, "flex-1 text-center tracking-widest text-lg")}
                                            value={verifyCode}
                                            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            maxLength={6}
                                        />
                                        <button
                                            onClick={handleEnableMfa}
                                            disabled={loadingMfa || verifyCode.length !== 6}
                                            className="btn-primary"
                                        >
                                            {loadingMfa ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ativar'}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setIsPendingVerification(false); setMfaSetup(null); }}
                                    className="text-xs text-slate-400 hover:text-slate-600 w-full text-center"
                                >
                                    Cancelar
                                </button>
                            </div>
                        )}

                        {user?.twoFactorEnabled && (
                            <div className="space-y-6">
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30 flex items-center gap-3">
                                    <Smartphone className="w-5 h-5 text-emerald-600" />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Proteção Ativada</p>
                                        <p className="text-[11px] text-emerald-600 opacity-80">Codigos gerados via App</p>
                                    </div>
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                </div>

                                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4 text-slate-400" />
                                        Desativar MFA
                                    </h4>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Código"
                                            className={cn(inputClasses, "flex-1 text-center text-sm")}
                                            value={verifyCode}
                                            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            maxLength={6}
                                        />
                                        <button
                                            onClick={handleDisableMfa}
                                            disabled={loadingMfa || verifyCode.length !== 6}
                                            className="btn-outline border-red-200 text-red-600 hover:bg-red-50"
                                        >
                                            {loadingMfa ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Desativar'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Sub-ícone que faltava ser importado
function ShieldAlert(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
        </svg>
    );
}
