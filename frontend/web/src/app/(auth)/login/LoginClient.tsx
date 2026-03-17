"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Lock,
  Mail,
  Sparkles,
  ShieldCheck,
  Bot,
  Zap,
  ArrowLeft,
  KeyRound,
  Layers,
  ArrowRight
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";
import { configApi } from "@/lib/api/config";
import { cn, getPhotoUrl } from "@/lib/utils";
import MfaSetupRequiredModal from "@/components/auth/MfaSetupRequiredModal";
import type { LoginResponse } from "@/lib/api/auth";

// ==================== Schema de Validacao ====================

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email e obrigatorio")
    .email("Email invalido"),
  password: z
    .string()
    .min(1, "Senha e obrigatoria")
    .min(8, "Senha deve ter no minimo 8 caracteres"),
  totpCode: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ==================== Component ====================

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, error: authError, clearError } = useAuthStore();
  const { setTenantTheme } = useThemeStore();

  const [showPassword, setShowPassword] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [mfaSetupState, setMfaSetupStateRaw] = useState<{
    setupToken: string;
    maskedEmail: string;
  } | null>(() => {
    try {
      const saved = sessionStorage.getItem("mfa_setup_pending");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setMfaSetupState = (state: { setupToken: string; maskedEmail: string } | null) => {
    setMfaSetupStateRaw(state);
    if (state) {
      sessionStorage.setItem("mfa_setup_pending", JSON.stringify(state));
    } else {
      sessionStorage.removeItem("mfa_setup_pending");
    }
  };
  const [loginConfig, setLoginConfig] = useState<{
    logoUrl?: string;
    backgroundUrl?: string;
    welcomeMessage?: string;
    footerText?: string;
    showPoweredBy?: boolean;
  }>({});

  const expired = searchParams.get("expired") === "true";

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
    resetField,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      totpCode: "",
    },
  });

  useEffect(() => {
    const tenantId = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ||
      localStorage.getItem('tenantId') ||
      localStorage.getItem('setup_tenant_id');

    if (tenantId) {
      configApi
        .getThemeConfig(tenantId)
        .then((config) => {
          setLoginConfig({
            logoUrl: config.logoUrl,
            backgroundUrl: config.loginBackgroundUrl,
            welcomeMessage: config.loginWelcomeMessage,
            footerText: config.loginFooterText,
            showPoweredBy: config.showPoweredBy,
          });

          setTenantTheme({
            tenantId: config.tenantId,
            logoUrl: config.logoUrl,
            logoWidth: (config.extraSettings?.logoWidth as number) || 150,
            colors: {
              primary: config.primaryColor || '#1E40AF',
              secondary: config.secondaryColor || '#1E293B',
              accent: config.accentColor || '#3B82F6',
              background: config.backgroundColor || '#F8FAFC',
              surface: config.surfaceColor || '#FFFFFF',
              textPrimary: config.textPrimaryColor || '#0F172A',
              textSecondary: config.textSecondaryColor || '#475569',
            },
            baseFontSize: (config.extraSettings?.baseFontSize as number) || 16,
            customCss: config.customCss,
            faviconUrl: config.faviconUrl
          });
        })
        .catch(() => {});
    }
  }, [setTenantTheme]);

  useEffect(() => {
    if (isAuthenticated) {
      const setupTenantId = localStorage.getItem('setup_tenant_id');
      if (setupTenantId) {
        router.replace(`/setup?tenantId=${setupTenantId}`);
      } else {
        router.replace("/dashboard");
      }
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    clearError();

    if (show2FA && (!data.totpCode || data.totpCode.length < 6)) {
      setIsLoading(false);
      useAuthStore.setState({ error: "Digite o código de 6 dígitos do seu autenticador" });
      return;
    }

    try {
      const response = await login({
        email: data.email,
        password: data.password,
        totpCode: data.totpCode || undefined,
      });

      if (response.mfaSetupRequired && response.mfaSetupToken && response.maskedEmail) {
        setMfaSetupState({
          setupToken: response.mfaSetupToken,
          maskedEmail: response.maskedEmail,
        });
        return;
      }

      if (response.mfaRequired) {
        setShow2FA(true);
        setTimeout(() => setFocus("totpCode"), 100);
        return;
      }

      const setupTenantId = localStorage.getItem('setup_tenant_id');
      if (setupTenantId) {
        router.replace(`/setup?tenantId=${setupTenantId}`);
      } else {
        router.replace("/dashboard");
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelMfa = () => {
    setShow2FA(false);
    resetField("totpCode");
    clearError();
  };

  const handleMfaSetupSuccess = async (response: LoginResponse) => {
    setMfaSetupState(null);
    if (response.user?.tenantId) {
      const { useThemeStore } = await import("@/stores/theme-store");
      await useThemeStore.getState().fetchBranding();
    }
    const setupTenantId = localStorage.getItem("setup_tenant_id");
    if (setupTenantId) {
      router.replace(`/setup?tenantId=${setupTenantId}`);
    } else {
      router.replace("/dashboard");
    }
  };

  const inputBaseClasses = "w-full px-4 py-3 bg-white/50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:ring-4 focus:ring-sky-100 focus:border-sky-400 transition-all outline-none backdrop-blur-sm font-medium";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Manrope:wght@400;500;600;700&display=swap');
        
        :root {
          --color-primary: ${useThemeStore.getState().tenantTheme?.colors?.primary || '#2563EB'};
        }

        .axr-sora { font-family: 'Sora', sans-serif; }
        .axr-manrope { font-family: 'Manrope', sans-serif; }

        @keyframes axr-mesh-flow {
          0% { transform: scale(1) translate(0, 0); }
          33% { transform: scale(1.1) translate(20px, -20px); }
          66% { transform: scale(0.9) translate(-20px, 20px); }
          100% { transform: scale(1) translate(0, 0); }
        }

        .axr-bg-mesh {
          position: absolute;
          inset: 0;
          background: #F8FAFF;
          overflow: hidden;
          z-index: 0;
        }

        .axr-bg-mesh::after {
          content: "";
          position: absolute;
          inset: -50%;
          background: 
            radial-gradient(circle at 20% 30%, rgba(37, 99, 235, 0.15) 0%, transparent 40%),
            radial-gradient(circle at 80% 20%, rgba(79, 70, 229, 0.15) 0%, transparent 40%),
            radial-gradient(circle at 50% 80%, rgba(5, 150, 105, 0.1) 0%, transparent 40%),
            radial-gradient(circle at 10% 90%, rgba(217, 119, 6, 0.1) 0%, transparent 40%);
          filter: blur(80px);
          animation: axr-mesh-flow 25s ease-in-out infinite;
        }

        @keyframes axr-reveal {
          from { opacity: 0; transform: translateY(20px); filter: blur(8px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }

        .axr-reveal {
          animation: axr-reveal 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        .axr-glass {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 32px 128px -16px rgba(15, 23, 42, 0.12);
        }

        .axr-lift { transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .axr-lift:hover { transform: translateY(-4px); box-shadow: 0 40px 160px -12px rgba(15, 23, 42, 0.18); }

        .axr-btn-shine {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .axr-btn-shine::after {
          content: "";
          position: absolute;
          top: -50%; left: -50%;
          width: 200%; height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: rotate(45deg);
          transition: 0.5s;
        }
        .axr-btn-shine:hover::after { left: 100%; }

        @keyframes axr-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .axr-float { animation: axr-float 6s ease-in-out infinite; }

        .axr-stagger > * { opacity: 0; }
        .axr-stagger > *:nth-child(1) { animation: axr-reveal 0.8s 0.1s forwards; }
        .axr-stagger > *:nth-child(2) { animation: axr-reveal 0.8s 0.2s forwards; }
        .axr-stagger > *:nth-child(3) { animation: axr-reveal 0.8s 0.3s forwards; }
        .axr-stagger > *:nth-child(4) { animation: axr-reveal 0.8s 0.4s forwards; }
        .axr-stagger > *:nth-child(5) { animation: axr-reveal 0.8s 0.5s forwards; }
      `}</style>

      {mfaSetupState && (
        <MfaSetupRequiredModal
          setupToken={mfaSetupState.setupToken}
          maskedEmail={mfaSetupState.maskedEmail}
          onSuccess={handleMfaSetupSuccess}
          onClose={() => setMfaSetupState(null)}
        />
      )}

      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden axr-manrope">
        {/* New Animated Background */}
        <div className="axr-bg-mesh" />
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#2563EB 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10 w-full max-w-[1240px] grid lg:grid-cols-[1.1fr,0.9fr] gap-12 lg:gap-24 items-center">
          
          {/* Left Column: Branding & Features */}
          <div className="axr-stagger flex flex-col gap-8 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-4">
              {loginConfig.logoUrl ? (
                <img
                  src={getPhotoUrl(loginConfig.logoUrl, new Date().getTime().toString(), 'logo') || ''}
                  alt="Logo"
                  className="h-12 w-auto object-contain axr-float"
                  style={{ maxWidth: `${useThemeStore.getState().tenantTheme?.logoWidth || 180}px` }}
                />
              ) : (
                <h1 className="axr-sora text-4xl sm:text-6xl font-black tracking-tight flex items-center gap-2">
                  <span className="text-slate-900">Axon</span>
                  <span className="text-[var(--color-primary)]">RH</span>
                </h1>
              )}
            </div>

            <h2 className="axr-sora text-3xl sm:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
              A revolução inteligente do seu <span className="text-[var(--color-primary)]">Capital Humano.</span>
            </h2>
            
            <p className="text-lg sm:text-xl text-slate-500 max-w-xl font-medium mx-auto lg:mx-0">
              {loginConfig.welcomeMessage || "Toda a gestão de pessoas, processamento de folha e inteligência artificial em um único ecossistema premium."}
            </p>

            <div className="hidden sm:grid grid-cols-2 gap-4 mt-4">
              {[
                { icon: ShieldCheck, title: "LGPD Compliance", desc: "Sua segurança em nível bancário.", color: '#059669' },
                { icon: Bot, title: "IA Generativa", desc: "Decisões baseadas em dados reais.", color: '#2563EB' },
                { icon: Zap, title: "Processamento Realtime", desc: "Sincronização imediata de dados.", color: '#D97706' },
                { icon: Layers, title: "Arquitetura Modular", desc: "Flexível à sua cultura interna.", color: '#7C3AED' },
              ].map((item, idx) => (
                <div key={idx} className="axr-lift axr-glass p-5 rounded-2xl text-left">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="p-2.5 rounded-xl flex items-center justify-center" style={{ background: `${item.color}10`, color: item.color }}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="axr-sora text-sm font-bold text-slate-900">{item.title}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Login Card */}
          <div className="w-full max-w-[460px] mx-auto lg:mx-0 axr-reveal" style={{ animationDelay: '0.4s' }}>
            <div className="axr-glass rounded-[40px] p-8 sm:p-12 relative overflow-hidden">
              {/* Card decorative elements */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--color-primary)]/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 mb-8">
                {show2FA ? (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center mb-6 axr-float">
                      <KeyRound className="w-7 h-7 text-[var(--color-primary)]" />
                    </div>
                    <h3 className="axr-sora text-2xl font-bold text-slate-900 mb-2">Segurança em 2 passos</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                      Insira o código de 6 dígitos gerado pelo seu aplicativo autenticador.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="axr-sora text-2xl font-bold text-slate-900 mb-2">Seja bem-vindo</h3>
                    <p className="text-sm text-slate-500 font-medium">Use suas credenciais corporativas.</p>
                  </>
                )}
              </div>

              {expired && (
                <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 animate-pulse">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">Sessão Expirada</span>
                </div>
              )}

              {authError && (
                <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-semibold">{authError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {!show2FA && (
                  <div className="axr-stagger">
                    <div className="mb-5">
                      <label htmlFor="email" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">E-mail Corporativo</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input
                          {...register("email")}
                          type="email"
                          id="email"
                          placeholder="nome@empresa.com"
                          className={cn(inputBaseClasses, "pl-12", errors.email && "border-rose-400 focus:ring-rose-100")}
                          disabled={isLoading}
                        />
                      </div>
                      {errors.email && <span className="text-[10px] text-rose-500 font-bold mt-2 ml-1 block">{errors.email.message}</span>}
                    </div>

                    <div className="mb-2">
                       <label htmlFor="password" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Sua Senha</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input
                          {...register("password")}
                          type={showPassword ? "text" : "password"}
                          id="password"
                          placeholder="********"
                          className={cn(inputBaseClasses, "pl-12 pr-12", errors.password && "border-rose-400 focus:ring-rose-100")}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && <span className="text-[10px] text-rose-500 font-bold mt-2 ml-1 block">{errors.password.message}</span>}
                    </div>

                    <div className="flex justify-end">
                      <a href="/forgot-password" className="text-xs font-bold text-[var(--color-primary)] hover:opacity-80 transition-opacity">
                        Esqueceu sua senha?
                      </a>
                    </div>
                  </div>
                )}

                {show2FA && (
                  <div className="space-y-6 axr-reveal">
                    <div>
                      <label htmlFor="totpCode" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Código de Verificação</label>
                      <input
                        {...register("totpCode")}
                        type="text"
                        id="totpCode"
                        placeholder="000 000"
                        maxLength={6}
                        autoComplete="one-time-code"
                        className="w-full bg-slate-50/50 border-2 border-slate-200 rounded-2xl py-5 text-center text-3xl font-black tracking-[0.3em] axr-sora focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 outline-none transition-all placeholder:text-slate-200"
                        disabled={isLoading}
                        autoFocus
                      />
                    </div>
                    <div className="p-4 rounded-2xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10 flex gap-4">
                      <ShieldCheck className="w-6 h-6 text-[var(--color-primary)] flex-shrink-0" />
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        Abra seu app autenticador para obter o token dinâmico necessário para este acesso.
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="axr-btn-shine w-full py-4 rounded-2xl axr-sora text-sm font-bold text-white shadow-2xl shadow-[var(--color-primary)]/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                    style={{ background: 'var(--color-primary, #2563EB)' }}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Verificando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>{show2FA ? "Validar Acesso" : "Entrar no Ecossistema"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </button>

                  {show2FA && (
                    <button
                      type="button"
                      onClick={handleCancelMfa}
                      disabled={isLoading}
                      className="w-full mt-4 py-3 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Alterar usuário ou senha
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="mt-8 text-center">
              <p className="text-xs font-bold text-slate-400 tracking-wider">
                {loginConfig.footerText || (loginConfig.showPoweredBy !== false && "AXONRH ECOSYSTEM © 2026")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
