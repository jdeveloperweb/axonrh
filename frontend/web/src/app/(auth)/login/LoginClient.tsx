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
  email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .min(8, "Senha deve ter no mínimo 8 caracteres"),
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

  useEffect(() => { clearError(); }, [clearError]);

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
        setMfaSetupState({ setupToken: response.mfaSetupToken, maskedEmail: response.maskedEmail });
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
    { icon: ShieldCheck, title: "LGPD Compliance",         desc: "Sua segurança em nível bancário.",      color: "#059669" },
    { icon: Bot,         title: "IA Generativa",           desc: "Decisões baseadas em dados reais.",      color: "#2563EB" },
    { icon: Zap,         title: "Processamento Realtime",  desc: "Sincronização imediata de dados.",        color: "#D97706" },
    { icon: Layers,      title: "Arquitetura Modular",     desc: "Flexível à sua cultura interna.",         color: "#7C3AED" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap');

        :root {
          --lp-primary: ${primaryColor};
          --lp-primary-10: ${primaryColor}1A;
          --lp-primary-20: ${primaryColor}33;
        }

        .lp-sora    { font-family: 'Sora', sans-serif; }
        .lp-manrope { font-family: 'Manrope', sans-serif; }

        /* ── Background ─────────────────────────────────── */
        .lp-scene {
          position: relative;
          min-height: 100vh;
          background: #F0F4FF;
          overflow: hidden;
        }

        /* Animated mesh blobs */
        @keyframes lp-blob-a {
          0%   { transform: translate(0, 0) scale(1); }
          25%  { transform: translate(60px, -50px) scale(1.15); }
          50%  { transform: translate(20px, 40px) scale(0.92); }
          75%  { transform: translate(-40px, -20px) scale(1.08); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes lp-blob-b {
          0%   { transform: translate(0, 0) scale(1); }
          30%  { transform: translate(-50px, 30px) scale(1.12); }
          60%  { transform: translate(30px, -40px) scale(0.88); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes lp-blob-c {
          0%   { transform: translate(0, 0) scale(1); }
          40%  { transform: translate(40px, 50px) scale(1.1); }
          70%  { transform: translate(-30px, -30px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .lp-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
          will-change: transform;
        }
        .lp-blob-1 {
          width: 750px; height: 750px;
          top: -220px; left: -180px;
          background: radial-gradient(circle, rgba(37,99,235,0.32) 0%, rgba(37,99,235,0.12) 45%, transparent 70%);
          animation: lp-blob-a 18s ease-in-out infinite;
        }
        .lp-blob-2 {
          width: 550px; height: 550px;
          bottom: -160px; right: -120px;
          background: radial-gradient(circle, rgba(124,58,237,0.26) 0%, rgba(124,58,237,0.08) 45%, transparent 70%);
          animation: lp-blob-b 24s ease-in-out infinite reverse;
        }
        .lp-blob-3 {
          width: 420px; height: 420px;
          top: 35%; left: 50%;
          background: radial-gradient(circle, rgba(5,150,105,0.2) 0%, rgba(5,150,105,0.06) 45%, transparent 70%);
          animation: lp-blob-c 15s ease-in-out infinite 4s;
        }
        .lp-blob-4 {
          width: 360px; height: 360px;
          top: 10%; right: 8%;
          background: radial-gradient(circle, rgba(14,165,233,0.22) 0%, rgba(14,165,233,0.06) 45%, transparent 70%);
          animation: lp-blob-a 20s ease-in-out infinite 9s reverse;
        }

        /* Dot grid */
        .lp-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(37,99,235,0.22) 1.5px, transparent 1.5px);
          background-size: 30px 30px;
          pointer-events: none;
        }

        /* Floating decorative rings */
        @keyframes lp-ring-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .lp-ring {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .lp-ring-1 {
          width: 500px; height: 500px;
          top: -170px; right: 18%;
          border: 1.5px solid rgba(37,99,235,0.18);
          animation: lp-ring-spin 60s linear infinite;
        }
        .lp-ring-2 {
          width: 260px; height: 260px;
          bottom: 50px; left: 8%;
          border: 1px solid rgba(124,58,237,0.16);
          animation: lp-ring-spin 40s linear infinite reverse;
        }
        .lp-ring-3 {
          width: 160px; height: 160px;
          top: 55%; right: 5%;
          border: 1px solid rgba(14,165,233,0.14);
          animation: lp-ring-spin 30s linear infinite;
        }
        .lp-ring-1::after, .lp-ring-2::after, .lp-ring-3::after {
          content: '';
          position: absolute;
          width: 8px; height: 8px;
          background: rgba(37,99,235,0.5);
          border-radius: 50%;
          top: 50%; left: -4px;
          transform: translateY(-50%);
          box-shadow: 0 0 8px rgba(37,99,235,0.4);
        }
        .lp-ring-2::after { background: rgba(124,58,237,0.5); box-shadow: 0 0 8px rgba(124,58,237,0.4); }
        .lp-ring-3::after { background: rgba(14,165,233,0.5); box-shadow: 0 0 8px rgba(14,165,233,0.4); width: 6px; height: 6px; left: -3px; }

        /* ── Entrance animations ─────────────────────────── */
        @keyframes lp-slide-up {
          from { opacity: 0; transform: translateY(32px); filter: blur(8px); }
          60%  { filter: blur(2px); }
          to   { opacity: 1; transform: translateY(0);    filter: blur(0); }
        }

        /* Smoky card entrance — saturate+blur para efeito névoa sem conflito com backdrop-filter */
        @keyframes lp-smoke-in {
          0%   {
            opacity: 0;
            transform: translateY(32px) scale(0.95);
            filter: blur(14px) saturate(0) brightness(1.3);
          }
          35%  {
            opacity: 0.65;
            filter: blur(5px) saturate(0.3) brightness(1.1);
          }
          65%  {
            filter: blur(1px) saturate(0.8) brightness(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px) saturate(1) brightness(1);
          }
        }

        .lp-stagger > * { opacity: 0; }
        .lp-stagger > *:nth-child(1) { animation: lp-slide-up 0.9s cubic-bezier(0.22,1,0.36,1) 0.05s forwards; }
        .lp-stagger > *:nth-child(2) { animation: lp-slide-up 0.9s cubic-bezier(0.22,1,0.36,1) 0.2s  forwards; }
        .lp-stagger > *:nth-child(3) { animation: lp-slide-up 0.9s cubic-bezier(0.22,1,0.36,1) 0.33s forwards; }
        .lp-stagger > *:nth-child(4) { animation: lp-slide-up 0.9s cubic-bezier(0.22,1,0.36,1) 0.46s forwards; }

        .lp-card-in {
          animation: lp-smoke-in 1.3s cubic-bezier(0.22,1,0.36,1) 0.2s both;
        }

        /* ── Float ───────────────────────────────────────── */
        @keyframes lp-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        .lp-float { animation: lp-float 7s ease-in-out infinite; }

        /* ── Feature cards ───────────────────────────────── */
        .lp-feat {
          background: rgba(255,255,255,0.55);
          backdrop-filter: blur(16px) saturate(160%);
          -webkit-backdrop-filter: blur(16px) saturate(160%);
          border: 1px solid rgba(255,255,255,0.65);
          border-radius: 18px;
          padding: 18px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1),
                      box-shadow 0.3s ease,
                      border-color 0.3s ease,
                      background 0.3s ease;
          cursor: default;
        }
        .lp-feat:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 60px -10px rgba(15,23,42,0.12);
          background: rgba(255,255,255,0.78);
          border-color: rgba(255,255,255,0.9);
        }
        .lp-feat-icon {
          width: 40px; height: 40px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1);
        }
        .lp-feat:hover .lp-feat-icon {
          transform: scale(1.12) rotate(-4deg);
        }

        /* ── Login card ──────────────────────────────────── */
        .lp-card {
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.55);
          border-radius: 32px;
          box-shadow:
            0 40px 100px -20px rgba(15,23,42,0.14),
            0 0 0 1px rgba(255,255,255,0.3) inset;
          padding: 44px 40px;
          position: relative;
          overflow: hidden;
        }
        .lp-card::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 180px; height: 180px;
          background: radial-gradient(circle, var(--lp-primary-10) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .lp-card::after {
          content: '';
          position: absolute;
          bottom: -40px; left: -40px;
          width: 130px; height: 130px;
          background: radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        /* ── Inputs ──────────────────────────────────────── */
        .lp-field { position: relative; }
        .lp-field-icon {
          position: absolute;
          left: 14px; top: 50%;
          transform: translateY(-50%);
          width: 17px; height: 17px;
          color: #CBD5E1;
          pointer-events: none;
          transition: color 0.25s ease;
        }
        .lp-field:focus-within .lp-field-icon { color: var(--lp-primary); }

        .lp-input {
          width: 100%;
          padding: 13px 16px 13px 42px;
          background: rgba(248,250,255,0.8);
          border: 1.5px solid #E2EAF4;
          border-radius: 14px;
          font-family: 'Manrope', sans-serif;
          font-size: 14.5px;
          font-weight: 500;
          color: #0F172A;
          outline: none;
          transition:
            border-color 0.25s ease,
            box-shadow 0.25s ease,
            background 0.25s ease;
        }
        .lp-input::placeholder { color: #B8C9D9; font-weight: 400; }
        .lp-input:hover:not(:disabled) {
          border-color: #C4D4E8;
          background: rgba(248,250,255,1);
        }
        .lp-input:focus {
          background: #FFFFFF;
          border-color: var(--lp-primary);
          box-shadow: 0 0 0 4px var(--lp-primary-10), 0 1px 2px rgba(0,0,0,0.04);
        }
        .lp-input-pr { padding-right: 46px; }
        .lp-input-error { border-color: #FB7185 !important; }
        .lp-input-error:focus { box-shadow: 0 0 0 4px rgba(251,113,133,0.12) !important; }

        .lp-eye {
          position: absolute;
          right: 13px; top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
          background: none; border: none;
          cursor: pointer;
          display: flex; align-items: center;
          padding: 4px;
          border-radius: 6px;
          transition: color 0.2s, background 0.2s;
        }
        .lp-eye:hover { color: #475569; background: rgba(0,0,0,0.04); }

        /* ── Submit button ───────────────────────────────── */
        .lp-btn {
          position: relative;
          width: 100%;
          padding: 14px 24px;
          background: var(--lp-primary);
          color: #fff;
          border: none;
          border-radius: 14px;
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          overflow: hidden;
          transition:
            transform 0.22s cubic-bezier(0.22,1,0.36,1),
            box-shadow 0.22s ease,
            filter 0.22s ease;
          box-shadow: 0 4px 24px -4px var(--lp-primary-20), 0 2px 8px rgba(0,0,0,0.08);
        }
        .lp-btn::after {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: skewX(-15deg);
          transition: left 0.55s ease;
        }
        .lp-btn:hover:not(:disabled)::after { left: 150%; }
        .lp-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 36px -6px var(--lp-primary-20), 0 4px 12px rgba(0,0,0,0.1);
          filter: brightness(1.05);
        }
        .lp-btn:active:not(:disabled) { transform: translateY(0); }
        .lp-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        /* ── TOTP input ──────────────────────────────────── */
        .lp-totp {
          width: 100%;
          background: rgba(248,250,255,0.8);
          border: 2px solid #E2EAF4;
          border-radius: 16px;
          padding: 22px 16px;
          text-align: center;
          font-family: 'Sora', sans-serif;
          font-size: 34px;
          font-weight: 800;
          letter-spacing: 0.32em;
          color: #0F172A;
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
        }
        .lp-totp::placeholder { color: #D1DCE8; letter-spacing: 0.22em; }
        .lp-totp:focus {
          background: #fff;
          border-color: var(--lp-primary);
          box-shadow: 0 0 0 4px var(--lp-primary-10);
        }

        /* ── Alerts ──────────────────────────────────────── */
        .lp-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 15px;
          border-radius: 12px;
          font-family: 'Manrope', sans-serif;
          font-size: 13.5px;
          font-weight: 500;
        }
        .lp-alert-error {
          background: rgba(254,226,226,0.7);
          border: 1px solid rgba(252,165,165,0.5);
          color: #B91C1C;
        }
        .lp-alert-warn {
          background: rgba(254,243,199,0.7);
          border: 1px solid rgba(253,211,77,0.5);
          color: #92400E;
        }

        /* ── Label style ─────────────────────────────────── */
        .lp-label {
          display: block;
          margin-bottom: 7px;
          margin-left: 1px;
          font-family: 'Manrope', sans-serif;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #94A3B8;
        }

        /* ── Forgot link ─────────────────────────────────── */
        .lp-forgot {
          font-family: 'Manrope', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: var(--lp-primary);
          text-decoration: none;
          opacity: 0.85;
          transition: opacity 0.2s;
        }
        .lp-forgot:hover { opacity: 1; }

        /* ── Back button ─────────────────────────────────── */
        .lp-back {
          width: 100%;
          margin-top: 12px;
          padding: 10px;
          background: none; border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-family: 'Manrope', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #94A3B8;
          border-radius: 10px;
          transition: color 0.2s, background 0.2s;
        }
        .lp-back:hover { color: #475569; background: rgba(0,0,0,0.03); }

        /* 2FA info box */
        .lp-2fa-info {
          background: var(--lp-primary-10);
          border: 1px solid var(--lp-primary-20);
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
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

      <div className="lp-scene lp-manrope flex items-center justify-center p-6 sm:p-10">
        {/* Background layers */}
        <div className="lp-blob lp-blob-1" />
        <div className="lp-blob lp-blob-2" />
        <div className="lp-blob lp-blob-3" />
        <div className="lp-blob lp-blob-4" />
        <div className="lp-grid" />
        <div className="lp-ring lp-ring-1" />
        <div className="lp-ring lp-ring-2" />
        <div className="lp-ring lp-ring-3" />

        {/* Main layout */}
        <div className="relative z-10 w-full max-w-[1180px] grid lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-20 items-center">

          {/* ── Left: Branding ──────────────────────────── */}
          <div className="lp-stagger flex flex-col gap-7 text-center lg:text-left">
            {/* Logo */}
            <div className="flex items-center justify-center lg:justify-start">
              {loginConfig.logoUrl ? (
                <img
                  src={getPhotoUrl(loginConfig.logoUrl, new Date().getTime().toString(), "logo") || ""}
                  alt="Logo"
                  className="h-12 w-auto object-contain lp-float"
                  style={{ maxWidth: `${logoWidth}px` }}
                />
              ) : (
                <h1 className="lp-sora text-5xl sm:text-6xl font-black tracking-tight flex items-center gap-2 lp-float">
                  <span className="text-slate-900">Axon</span>
                  <span style={{ color: "var(--lp-primary)" }}>RH</span>
                </h1>
              )}
            </div>

            {/* Headline */}
            <h2 className="lp-sora text-3xl sm:text-[2.6rem] font-extrabold text-slate-900 leading-[1.12] tracking-tight">
              A revolução inteligente do seu{" "}
              <span style={{ color: "var(--lp-primary)" }}>Capital Humano.</span>
            </h2>

            {/* Subtitle */}
            <p className="text-slate-500 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
              {loginConfig.welcomeMessage ||
                "Toda a gestão de pessoas, estratégia de talentos e inteligência artificial em um único ecossistema premium."}
            </p>

            {/* Feature cards grid */}
            <div className="hidden sm:grid grid-cols-2 gap-3 mt-2">
              {features.map((item) => (
                <div className="lp-feat" key={item.title}>
                  <div className="lp-feat-icon" style={{ background: `${item.color}15`, color: item.color }}>
                    <item.icon style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <p className="lp-sora text-[13px] font-bold text-slate-800 leading-snug">{item.title}</p>
                    <p className="text-[12px] text-slate-500 mt-0.5 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Login Card ────────────────────────── */}
          <div className="w-full max-w-[440px] mx-auto lg:mx-0 lp-card-in">
            <div className="lp-card">
              {/* Card header */}
              <div className="relative z-10 mb-7">
                {show2FA ? (
                  <>
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                      style={{ background: "var(--lp-primary-10)", color: "var(--lp-primary)" }}
                    >
                      <KeyRound style={{ width: 22, height: 22 }} />
                    </div>
                    <h3 className="lp-sora text-[1.5rem] font-bold text-slate-900 mb-1.5">Segurança em 2 passos</h3>
                    <p className="text-slate-400 text-sm leading-relaxed font-medium">
                      Insira o código de 6 dígitos gerado pelo seu aplicativo autenticador.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="lp-sora text-[1.5rem] font-bold text-slate-900 mb-1">Seja bem-vindo</h3>
                    <p className="text-slate-400 text-sm font-medium">Use suas credenciais corporativas.</p>
                  </>
                )}
              </div>

              {/* Alerts */}
              {showExpiredMessage && (
                <div className="lp-alert lp-alert-warn mb-5">
                  <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Sessão Expirada</span>
                </div>
              )}
              {authError && (
                <div className="lp-alert lp-alert-error mb-5">
                  <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <span>{authError}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 space-y-0">
                {!show2FA && (
                  <div className="space-y-4">
                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="lp-label">E-mail Corporativo</label>
                      <div className="lp-field">
                        <Mail className="lp-field-icon" />
                        <input
                          {...register("email")}
                          type="email"
                          id="email"
                          placeholder="nome@empresa.com"
                          className={cn("lp-input", errors.email && "lp-input-error")}
                          disabled={isLoading}
                          autoComplete="email"
                        />
                      </div>
                      {errors.email && (
                        <span style={{ display: "block", marginTop: 5, marginLeft: 2, fontSize: 11.5, fontWeight: 600, color: "#E11D48" }}>
                          {errors.email.message}
                        </span>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <label htmlFor="password" className="lp-label">Sua Senha</label>
                      <div className="lp-field">
                        <Lock className="lp-field-icon" />
                        <input
                          {...register("password")}
                          type={showPassword ? "text" : "password"}
                          id="password"
                          placeholder="••••••••"
                          className={cn("lp-input lp-input-pr", errors.password && "lp-input-error")}
                          disabled={isLoading}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="lp-eye"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          {showPassword
                            ? <EyeOff style={{ width: 16, height: 16 }} />
                            : <Eye style={{ width: 16, height: 16 }} />}
                        </button>
                      </div>
                      {errors.password && (
                        <span style={{ display: "block", marginTop: 5, marginLeft: 2, fontSize: 11.5, fontWeight: 600, color: "#E11D48" }}>
                          {errors.password.message}
                        </span>
                      )}
                    </div>

                    {/* Forgot */}
                    <div className="flex justify-end pt-0.5">
                      <a href="/forgot-password" className="lp-forgot">Esqueceu sua senha?</a>
                    </div>
                  </div>
                )}

                {/* 2FA */}
                {show2FA && (
                  <div className="space-y-4 mb-2">
                    <div>
                      <label htmlFor="totpCode" className="lp-label text-center block">
                        Código de Verificação
                      </label>
                      <input
                        {...register("totpCode")}
                        type="text"
                        id="totpCode"
                        placeholder="000 000"
                        maxLength={6}
                        autoComplete="one-time-code"
                        className="lp-totp"
                        disabled={isLoading}
                        autoFocus
                      />
                    </div>
                    <div className="lp-2fa-info">
                      <ShieldCheck style={{ width: 16, height: 16, color: "var(--lp-primary)", flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.55, fontWeight: 500 }}>
                        Abra seu app autenticador para obter o token dinâmico necessário para este acesso.
                      </p>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <div className="pt-5">
                  <button type="submit" disabled={isLoading} className="lp-btn">
                    {isLoading ? (
                      <>
                        <Loader2 style={{ width: 17, height: 17 }} className="animate-spin" />
                        <span>Verificando...</span>
                      </>
                    ) : (
                      <>
                        <span>{show2FA ? "Validar Acesso" : "Entrar no Ecossistema"}</span>
                        <ArrowRight style={{ width: 16, height: 16 }} />
                      </>
                    )}
                  </button>

                  {show2FA && (
                    <button type="button" onClick={handleCancelMfa} disabled={isLoading} className="lp-back">
                      <ArrowLeft style={{ width: 14, height: 14 }} />
                      Alterar usuário ou senha
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Footer */}
            <p
              className="text-center mt-6 tracking-[0.18em] uppercase"
              style={{ fontSize: 10.5, fontWeight: 700, color: "#94A3B8" }}
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
