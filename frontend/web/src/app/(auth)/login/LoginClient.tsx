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
  Sparkles,
  ShieldCheck,
  Bot,
  Zap,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";
import { configApi } from "@/lib/api/config";
import { cn } from "@/lib/utils";

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
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      totpCode: "",
    },
  });

  // Carrega configuracoes do tenant
  useEffect(() => {
    const tenantId = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID;
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

          // Aplica tema do tenant
          setTenantTheme({
            tenantId: config.tenantId,
            logoUrl: config.logoUrl,
            colors: {
              primary: config.primaryColor,
              secondary: config.secondaryColor,
              accent: config.accentColor,
              background: config.backgroundColor,
              surface: config.surfaceColor,
              textPrimary: config.textPrimaryColor,
              textSecondary: config.textSecondaryColor,
            },
          });
        })
        .catch(() => {
          // Usa configuracoes padrao
        });
    }
  }, [setTenantTheme]);

  // Redireciona se ja autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Limpa erro ao montar
  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    clearError();

    try {
      await login({
        email: data.email,
        password: data.password,
        totpCode: data.totpCode || undefined,
      });
      router.replace("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      // Verifica se precisa de 2FA
      if (message.includes("2FA")) {
        setShow2FA(true);
        setFocus("totpCode");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputBaseClasses =
    "input bg-slate-950/40 border-white/10 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-300/60 focus:border-emerald-300/50";

  return (
    <div className="min-h-screen relative flex items-center justify-center px-6 py-16 text-white">
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0b2147] to-[#101b3c]"
        style={{
          backgroundImage: loginConfig.backgroundUrl
            ? `linear-gradient(120deg, rgba(2, 6, 23, 0.92), rgba(15, 23, 42, 0.86)), url(${loginConfig.backgroundUrl})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35),_transparent_55%)]" />
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_80%,_rgba(16,185,129,0.35),_transparent_55%)]" />
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-sky-500/20 blur-[120px]" />
      <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-emerald-500/20 blur-[120px]" />

      <div className="relative z-10 w-full max-w-6xl grid gap-12 lg:grid-cols-[1.15fr,0.85fr] items-center">
        <div className="flex flex-col gap-6 text-center lg:text-left">
          <span className="mx-auto lg:mx-0 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white text-sm font-medium shadow-lg shadow-emerald-400/20">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            Nova Geração de Sistemas de RH com IA
          </span>

          <div className="flex items-center justify-center lg:justify-start gap-3">
            {loginConfig.logoUrl ? (
              <img src={loginConfig.logoUrl} alt="Logo" className="h-12" />
            ) : (
              <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight">
                <span className="text-white">Axon</span>
                <span className="text-sky-400">RH</span>
              </h1>
            )}
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-white/95">
            Um RH mais <span className="text-emerald-300">humano</span>, conectado
            com uma IA que impressiona.
          </h2>
          <p className="text-base sm:text-lg text-slate-200/80 max-w-xl mx-auto lg:mx-0">
            {loginConfig.welcomeMessage ||
              "A plataforma inteligente que unifica Departamento Pessoal e Recursos Humanos com uma assistente de IA conversacional. Pergunte, comande e acompanhe tudo pelo chat."}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 text-left">
            {[
              {
                icon: Bot,
                title: "IA conversacional",
                description: "Fluxos inteligentes para decisões rápidas e seguras.",
              },
              {
                icon: ShieldCheck,
                title: "LGPD e compliance",
                description: "Governança e rastreabilidade de ponta a ponta.",
              },
              {
                icon: Zap,
                title: "Operação contínua",
                description: "Disponível mesmo offline no mobile corporativo.",
              },
              {
                icon: Sparkles,
                title: "100% personalizável",
                description: "Identidade visual adaptada ao seu time.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur shadow-lg shadow-slate-900/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-200">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-slate-300">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full">
          <div className="relative">
            <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-sky-500/60 via-emerald-400/40 to-indigo-500/60 blur-lg opacity-60" />
            <div className="relative rounded-3xl border border-white/20 bg-slate-950/60 shadow-2xl shadow-slate-900/40 backdrop-blur-xl p-8 sm:p-10">
              <div className="mb-6 text-center">
                <h2 className="font-heading text-2xl font-semibold text-white">
                  Entrar
                </h2>
                <p className="text-sm text-slate-200/80">
                  Acesse sua conta para continuar
                </p>
              </div>

              {/* Mensagem de sessao expirada */}
              {expired && (
                <div className="flex items-center gap-2 p-3 mb-4 rounded-[var(--radius-md)] bg-amber-400/15 text-amber-200">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm text-amber-100">
                    Sua sessao expirou. Faca login novamente.
                  </span>
                </div>
              )}

              {/* Mensagem de erro */}
              {authError && (
                <div className="flex items-center gap-2 p-3 mb-4 rounded-[var(--radius-md)] bg-rose-500/15 text-rose-100">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{authError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-200"
                  >
                    Email
                  </label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input
                      {...register("email")}
                      type="email"
                      id="email"
                      placeholder="seu@email.com"
                      className={cn(
                        `${inputBaseClasses} pl-10`,
                        errors.email && "input-error"
                      )}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <span className="text-sm text-rose-200 mt-1">
                      {errors.email.message}
                    </span>
                  )}
                </div>

                {/* Senha */}
                <div>
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-200"
                  >
                    Senha
                  </label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      id="password"
                      placeholder="********"
                      className={cn(
                        `${inputBaseClasses} pl-10 pr-10`,
                        errors.password && "input-error"
                      )}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="text-sm text-rose-200 mt-1">
                      {errors.password.message}
                    </span>
                  )}
                </div>

                {/* Codigo 2FA */}
                {show2FA && (
                  <div className="animate-fade-in">
                    <label
                      htmlFor="totpCode"
                      className="text-sm font-medium text-slate-200"
                    >
                      Codigo de Verificacao (2FA)
                    </label>
                    <input
                      {...register("totpCode")}
                      type="text"
                      id="totpCode"
                      placeholder="000000"
                      maxLength={6}
                      className={`${inputBaseClasses} mt-2 text-center text-2xl tracking-widest`}
                      disabled={isLoading}
                    />
                    <p className="text-sm text-slate-300 mt-1">
                      Digite o codigo do seu aplicativo autenticador
                    </p>
                  </div>
                )}

                {/* Link Esqueceu Senha */}
                <div className="flex justify-end">
                  <a
                    href="/forgot-password"
                    className="text-sm text-sky-200 hover:text-sky-100 underline underline-offset-4"
                  >
                    Esqueceu sua senha?
                  </a>
                </div>

                {/* Botao Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-[var(--radius-md)] font-semibold text-white bg-gradient-to-r from-sky-500 via-blue-500 to-emerald-400 shadow-lg shadow-sky-500/30 hover:from-sky-400 hover:via-blue-400 hover:to-emerald-300 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-slate-300/80">
            {loginConfig.footerText || (
              <>
                {loginConfig.showPoweredBy !== false && (
                  <span>Powered by AxonRH</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
