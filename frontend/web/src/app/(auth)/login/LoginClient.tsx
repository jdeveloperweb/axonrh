"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  ShieldCheck,
  Bot,
  Zap,
  ArrowLeft,
  KeyRound,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";
import { configApi } from "@/lib/api/config";
import { cn, getPhotoUrl } from "@/lib/utils";
import MfaSetupRequiredModal from "@/components/auth/MfaSetupRequiredModal";
import type { LoginResponse } from "@/lib/api/auth";

// ==================== Schema ====================

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
    if (state) sessionStorage.setItem("mfa_setup_pending", JSON.stringify(state));
    else sessionStorage.removeItem("mfa_setup_pending");
  };

  const [loginConfig, setLoginConfig] = useState<{
    logoUrl?: string;
    backgroundUrl?: string;
    welcomeMessage?: string;
    footerText?: string;
    showPoweredBy?: boolean;
  }>({});

  const [showExpiredMessage, setShowExpiredMessage] = useState(false);

  useEffect(() => {
    if (searchParams.get("expired") === "true") setShowExpiredMessage(true);
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
    resetField,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", totpCode: "" },
  });

  useEffect(() => {
    const tenantId =
      process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ||
      localStorage.getItem("tenantId") ||
      localStorage.getItem("setup_tenant_id");

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
              primary: config.primaryColor || "#1E40AF",
              secondary: config.secondaryColor || "#1E293B",
              accent: config.accentColor || "#3B82F6",
              background: config.backgroundColor || "#F8FAFC",
              surface: config.surfaceColor || "#FFFFFF",
              textPrimary: config.textPrimaryColor || "#0F172A",
              textSecondary: config.textSecondaryColor || "#475569",
            },
            baseFontSize: (config.extraSettings?.baseFontSize as number) || 16,
            customCss: config.customCss,
            faviconUrl: config.faviconUrl,
          });
        })
        .catch(() => {});
    }
  }, [setTenantTheme]);

  useEffect(() => {
    if (isAuthenticated) {
      const setupTenantId = localStorage.getItem("setup_tenant_id");
      if (setupTenantId) router.replace(`/setup?tenantId=${setupTenantId}`);
      else router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    clearError();
    setShowExpiredMessage(false);

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

      const setupTenantId = localStorage.getItem("setup_tenant_id");
      if (setupTenantId) router.replace(`/setup?tenantId=${setupTenantId}`);
      else router.replace("/dashboard");
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
    if (setupTenantId) router.replace(`/setup?tenantId=${setupTenantId}`);
    else router.replace("/dashboard");
  };

  const primaryColor = useThemeStore.getState().tenantTheme?.colors?.primary || "#2563EB";
  const logoWidth = useThemeStore.getState().tenantTheme?.logoWidth || 180;

  const features = [
    { icon: ShieldCheck, title: "LGPD Compliance", desc: "Segurança em nível bancário.", color: "#10B981" },
    { icon: Bot, title: "IA Generativa", desc: "Decisões baseadas em dados reais.", color: "#3B82F6" },
    { icon: Zap, title: "Processamento Realtime", desc: "Sincronização imediata.", color: "#F59E0B" },
    { icon: Layers, title: "Arquitetura Modular", desc: "Flexível à sua cultura.", color: "#8B5CF6" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        :root {
          --axr-primary: ${primaryColor};
          --axr-primary-rgb: 37, 99, 235;
        }

        .axr-bricolage { font-family: 'Bricolage Grotesque', sans-serif; }
        .axr-dm { font-family: 'DM Sans', sans-serif; }

        /* ── Dark Panel ─────────────────────────────── */
        .axr-dark-panel {
          background: linear-gradient(155deg, #070D1B 0%, #0C1628 60%, #091220 100%);
          position: relative;
          overflow: hidden;
        }

        /* Aurora blobs */
        @keyframes axr-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(40px, -30px) scale(1.12); }
          66%       { transform: translate(-25px, 40px) scale(0.9); }
        }

        .axr-aurora {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .axr-aurora-a {
          width: 560px; height: 560px;
          top: -160px; left: -120px;
          background: radial-gradient(circle, rgba(37,99,235,0.28) 0%, transparent 70%);
          animation: axr-drift 20s ease-in-out infinite;
        }
        .axr-aurora-b {
          width: 420px; height: 420px;
          bottom: -120px; right: -100px;
          background: radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%);
          animation: axr-drift 26s ease-in-out infinite reverse;
        }
        .axr-aurora-c {
          width: 320px; height: 320px;
          top: 45%; left: 45%;
          background: radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%);
          animation: axr-drift 16s ease-in-out infinite 7s;
        }

        /* Decorative rings */
        .axr-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.04);
          pointer-events: none;
        }
        .axr-ring-lg {
          width: 560px; height: 560px;
          top: -220px; right: -220px;
        }
        .axr-ring-md {
          width: 280px; height: 280px;
          bottom: 40px; left: -80px;
        }
        .axr-ring-sm {
          width: 160px; height: 160px;
          top: 38%; right: 12%;
          border-color: rgba(37,99,235,0.12);
        }

        /* Dot grid */
        .axr-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        /* Feature cards */
        .axr-feat-card {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          transition: background 0.3s ease, border-color 0.3s ease;
        }
        .axr-feat-card:hover {
          background: rgba(255,255,255,0.055);
          border-color: rgba(255,255,255,0.1);
        }
        .axr-feat-icon {
          width: 38px; height: 38px;
          border-radius: 10px;
          background: rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        /* Left panel stagger */
        @keyframes axr-up {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .axr-left-content > * { opacity: 0; }
        .axr-left-content > *:nth-child(1) { animation: axr-up 0.75s cubic-bezier(0.2,0.8,0.2,1) 0.1s forwards; }
        .axr-left-content > *:nth-child(2) { animation: axr-up 0.75s cubic-bezier(0.2,0.8,0.2,1) 0.22s forwards; }
        .axr-left-content > *:nth-child(3) { animation: axr-up 0.75s cubic-bezier(0.2,0.8,0.2,1) 0.36s forwards; }
        .axr-left-content > *:nth-child(4) { animation: axr-up 0.75s cubic-bezier(0.2,0.8,0.2,1) 0.48s forwards; }

        /* Right panel reveal */
        @keyframes axr-right-in {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .axr-right-reveal      { animation: axr-right-in 0.65s cubic-bezier(0.2,0.8,0.2,1) 0.25s both; }
        .axr-right-reveal-slow { animation: axr-right-in 0.65s cubic-bezier(0.2,0.8,0.2,1) 0.4s both; }
        .axr-right-reveal-btn  { animation: axr-right-in 0.65s cubic-bezier(0.2,0.8,0.2,1) 0.5s both; }

        /* Form inputs */
        .axr-input-wrap { position: relative; }
        .axr-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 18px; height: 18px;
          color: #B0BEC7;
          pointer-events: none;
          transition: color 0.2s;
        }
        .axr-input-wrap:focus-within .axr-input-icon {
          color: var(--axr-primary);
        }

        .axr-input {
          width: 100%;
          padding: 13px 16px 13px 44px;
          background: #F7F9FF;
          border: 1.5px solid #E4EAF2;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 400;
          color: #0F172A;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .axr-input::placeholder { color: #B8C4CE; }
        .axr-input:hover { border-color: #C8D4E0; background: #F2F6FF; }
        .axr-input:focus {
          background: #FFFFFF;
          border-color: var(--axr-primary);
          box-shadow: 0 0 0 4px rgba(var(--axr-primary-rgb), 0.1);
        }
        .axr-input-err { border-color: #F43F5E !important; }
        .axr-input-err:focus { box-shadow: 0 0 0 4px rgba(244,63,94,0.1) !important; }

        .axr-input-pr { padding-right: 48px; }
        .axr-eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #B0BEC7;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .axr-eye-btn:hover { color: #64748B; }

        /* Submit button */
        .axr-submit-btn {
          width: 100%;
          padding: 14px 28px;
          background: var(--axr-primary);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
          box-shadow: 0 4px 20px rgba(var(--axr-primary-rgb), 0.35);
        }
        .axr-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(var(--axr-primary-rgb), 0.45);
          filter: brightness(1.06);
        }
        .axr-submit-btn:active:not(:disabled) { transform: translateY(0); }
        .axr-submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        /* 2FA code input */
        .axr-totp-input {
          width: 100%;
          background: #F7F9FF;
          border: 2px solid #E4EAF2;
          border-radius: 14px;
          padding: 20px 16px;
          text-align: center;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: 0.28em;
          color: #0F172A;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .axr-totp-input::placeholder { color: #D1D8E0; letter-spacing: 0.2em; }
        .axr-totp-input:focus {
          border-color: var(--axr-primary);
          box-shadow: 0 0 0 4px rgba(var(--axr-primary-rgb), 0.1);
          background: #fff;
        }

        /* Alert banners */
        .axr-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          font-weight: 500;
        }
        .axr-alert-error { background: #FFF1F3; border: 1px solid #FEE0E5; color: #BE123C; }
        .axr-alert-warn  { background: #FFFBEB; border: 1px solid #FDE68A; color: #92400E; }

        /* Logo float */
        @keyframes axr-float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
        .axr-float { animation: axr-float 7s ease-in-out infinite; }

        /* Mobile form panel background dots */
        .axr-form-panel {
          background: #ffffff;
          position: relative;
        }
        .axr-form-panel::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(37,99,235,0.04) 1px, transparent 1px);
          background-size: 24px 24px;
          pointer-events: none;
        }

        /* Divider line on form panel top (desktop) */
        .axr-accent-bar {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--axr-primary), rgba(99,102,241,0.6));
        }
      `}</style>

      {mfaSetupState && (
        <MfaSetupRequiredModal
          setupToken={mfaSetupState.setupToken}
          maskedEmail={mfaSetupState.maskedEmail}
          onSuccess={handleMfaSetupSuccess}
          onClose={() => setMfaSetupState(null)}
        />
      )}

      <div className="axr-dm min-h-screen flex flex-col lg:flex-row">
        {/* ── Left: Dark Brand Panel ──────────────────────────────────── */}
        <div className="axr-dark-panel hidden lg:flex lg:w-[54%] xl:w-[56%] flex-col justify-between p-14 xl:p-20">
          {/* Background layers */}
          <div className="axr-aurora axr-aurora-a" />
          <div className="axr-aurora axr-aurora-b" />
          <div className="axr-aurora axr-aurora-c" />
          <div className="axr-ring axr-ring-lg" />
          <div className="axr-ring axr-ring-md" />
          <div className="axr-ring axr-ring-sm" />
          <div className="axr-grid" />

          {/* Content stacked with spacing */}
          <div className="relative z-10 flex flex-col h-full axr-left-content">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-auto">
              {loginConfig.logoUrl ? (
                <img
                  src={getPhotoUrl(loginConfig.logoUrl, new Date().getTime().toString(), "logo") || ""}
                  alt="Logo"
                  className="h-10 w-auto object-contain axr-float"
                  style={{ maxWidth: `${logoWidth}px` }}
                />
              ) : (
                <div className="flex items-center gap-1 axr-float">
                  <span className="axr-bricolage text-white text-[28px] font-bold tracking-tight">Axon</span>
                  <span className="axr-bricolage text-[28px] font-bold tracking-tight" style={{ color: "var(--axr-primary)" }}>RH</span>
                </div>
              )}
            </div>

            {/* Headline */}
            <div className="flex-1 flex flex-col justify-center py-10">
              <h2 className="axr-bricolage text-[2.4rem] xl:text-[2.75rem] font-bold text-white leading-[1.18] mb-5">
                A revolução inteligente do seu{" "}
                <span style={{ color: "var(--axr-primary)" }}>Capital Humano.</span>
              </h2>
              <p className="text-[#7A98BB] text-lg leading-relaxed max-w-lg font-normal">
                {loginConfig.welcomeMessage ||
                  "Toda a gestão de pessoas, estratégia de talentos e inteligência artificial em um único ecossistema premium."}
              </p>

              {/* Feature grid */}
              <div className="grid grid-cols-2 gap-3 mt-10">
                {features.map((item) => (
                  <div className="axr-feat-card" key={item.title}>
                    <div className="axr-feat-icon" style={{ color: item.color }}>
                      <item.icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                    </div>
                    <div>
                      <p className="axr-bricolage text-white text-[13.5px] font-semibold leading-snug">{item.title}</p>
                      <p style={{ color: "#5A7898", fontSize: 12, marginTop: 3, fontWeight: 400 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <p className="axr-bricolage text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#2A405A" }}>
              AXONRH ECOSYSTEM © 2026
            </p>
          </div>
        </div>

        {/* ── Right: Form Panel ──────────────────────────────────────── */}
        <div className="axr-form-panel flex-1 flex flex-col items-center justify-center px-8 py-14 sm:px-12">
          <div className="axr-accent-bar" />

          <div className="w-full max-w-[420px] relative z-10">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center gap-1 mb-10">
              {loginConfig.logoUrl ? (
                <img
                  src={getPhotoUrl(loginConfig.logoUrl, new Date().getTime().toString(), "logo") || ""}
                  alt="Logo"
                  className="h-10 w-auto object-contain"
                  style={{ maxWidth: `${logoWidth}px` }}
                />
              ) : (
                <>
                  <span className="axr-bricolage text-slate-900 text-2xl font-bold">Axon</span>
                  <span className="axr-bricolage text-2xl font-bold" style={{ color: "var(--axr-primary)" }}>RH</span>
                </>
              )}
            </div>

            {/* Heading */}
            <div className="mb-8 axr-right-reveal">
              {show2FA ? (
                <>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: `rgba(var(--axr-primary-rgb), 0.1)`, color: "var(--axr-primary)" }}
                  >
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h1 className="axr-bricolage text-[1.75rem] font-bold text-slate-900 mb-1.5 leading-snug">
                    Segurança em 2 passos
                  </h1>
                  <p className="text-slate-400 text-[14.5px] leading-relaxed">
                    Insira o código de 6 dígitos do seu aplicativo autenticador.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="axr-bricolage text-[1.75rem] font-bold text-slate-900 mb-1.5 leading-snug">
                    Seja bem-vindo
                  </h1>
                  <p className="text-slate-400 text-[14.5px]">Use suas credenciais corporativas.</p>
                </>
              )}
            </div>

            {/* Alerts */}
            {showExpiredMessage && (
              <div className="axr-alert axr-alert-warn mb-5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider">Sessão Expirada</span>
              </div>
            )}
            {authError && (
              <div className="axr-alert axr-alert-error mb-5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)}>
              {!show2FA && (
                <div className="axr-right-reveal-slow">
                  {/* Email */}
                  <div className="mb-4">
                    <label
                      htmlFor="email"
                      className="block mb-1.5 ml-0.5"
                      style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94A3B8" }}
                    >
                      E-mail Corporativo
                    </label>
                    <div className="axr-input-wrap">
                      <Mail className="axr-input-icon" />
                      <input
                        {...register("email")}
                        type="email"
                        id="email"
                        placeholder="nome@empresa.com"
                        className={cn("axr-input", errors.email && "axr-input-err")}
                        disabled={isLoading}
                        autoComplete="email"
                      />
                    </div>
                    {errors.email && (
                      <span style={{ display: "block", marginTop: 6, marginLeft: 2, fontSize: 11.5, fontWeight: 600, color: "#F43F5E" }}>
                        {errors.email.message}
                      </span>
                    )}
                  </div>

                  {/* Password */}
                  <div className="mb-2">
                    <label
                      htmlFor="password"
                      className="block mb-1.5 ml-0.5"
                      style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94A3B8" }}
                    >
                      Senha
                    </label>
                    <div className="axr-input-wrap">
                      <Lock className="axr-input-icon" />
                      <input
                        {...register("password")}
                        type={showPassword ? "text" : "password"}
                        id="password"
                        placeholder="••••••••"
                        className={cn("axr-input axr-input-pr", errors.password && "axr-input-err")}
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="axr-eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4.5 h-4.5" style={{ width: 17, height: 17 }} /> : <Eye className="w-4.5 h-4.5" style={{ width: 17, height: 17 }} />}
                      </button>
                    </div>
                    {errors.password && (
                      <span style={{ display: "block", marginTop: 6, marginLeft: 2, fontSize: 11.5, fontWeight: 600, color: "#F43F5E" }}>
                        {errors.password.message}
                      </span>
                    )}
                  </div>

                  {/* Forgot password */}
                  <div className="flex justify-end mb-6 mt-2.5">
                    <a
                      href="/forgot-password"
                      style={{ fontSize: 13, fontWeight: 600, color: "var(--axr-primary)", textDecoration: "none", opacity: 0.9, transition: "opacity 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.9")}
                    >
                      Esqueceu sua senha?
                    </a>
                  </div>
                </div>
              )}

              {/* 2FA code */}
              {show2FA && (
                <div className="space-y-4 mb-6 axr-right-reveal-slow">
                  <div>
                    <label
                      htmlFor="totpCode"
                      className="block mb-2 text-center"
                      style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94A3B8" }}
                    >
                      Código de Verificação
                    </label>
                    <input
                      {...register("totpCode")}
                      type="text"
                      id="totpCode"
                      placeholder="000 000"
                      maxLength={6}
                      autoComplete="one-time-code"
                      className="axr-totp-input"
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: "rgba(var(--axr-primary-rgb), 0.05)",
                      border: "1px solid rgba(var(--axr-primary-rgb), 0.1)",
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <ShieldCheck style={{ width: 17, height: 17, color: "var(--axr-primary)", flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 12.5, color: "#64748B", lineHeight: 1.5, fontWeight: 400 }}>
                      Abra seu app autenticador para obter o token dinâmico necessário para este acesso.
                    </p>
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="axr-right-reveal-btn">
                <button type="submit" disabled={isLoading} className="axr-submit-btn">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <span>{show2FA ? "Validar Acesso" : "Entrar no Ecossistema"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {show2FA && (
                  <button
                    type="button"
                    onClick={handleCancelMfa}
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      marginTop: 14,
                      padding: "10px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#94A3B8",
                      transition: "color 0.2s",
                      fontFamily: "DM Sans, sans-serif",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#334155")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" style={{ width: 14, height: 14 }} />
                    Alterar usuário ou senha
                  </button>
                )}
              </div>
            </form>

            {/* Footer (mobile/solo) */}
            <p
              className="text-center mt-10 tracking-widest uppercase lg:hidden"
              style={{ fontSize: 10.5, fontWeight: 700, color: "#CBD5E1" }}
            >
              {loginConfig.footerText ||
                (loginConfig.showPoweredBy !== false && "AXONRH ECOSYSTEM © 2026")}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
