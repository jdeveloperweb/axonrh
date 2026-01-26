"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, AlertCircle, Lock, Mail } from "lucide-react";
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

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Imagem de Fundo */}
      <div
        className="hidden lg:flex lg:w-1/2 relative bg-[var(--color-primary)]"
        style={{
          backgroundImage: loginConfig.backgroundUrl
            ? `url(${loginConfig.backgroundUrl})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[var(--color-primary)]/80" />
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          {loginConfig.logoUrl && (
            <img
              src={loginConfig.logoUrl}
              alt="Logo"
              className="h-16 mb-8"
            />
          )}
          <h1 className="text-4xl font-bold mb-4 text-center">
            {loginConfig.welcomeMessage || "Bem-vindo ao AxonRH"}
          </h1>
          <p className="text-lg text-center opacity-90 max-w-md">
            Sistema Integrado de Gestao de RH e Departamento Pessoal com IA Conversacional
          </p>
        </div>
      </div>

      {/* Lado Direito - Formulario */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 bg-[var(--color-background)]">
        <div className="w-full max-w-md">
          {/* Logo Mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            {loginConfig.logoUrl ? (
              <img src={loginConfig.logoUrl} alt="Logo" className="h-12" />
            ) : (
              <h1 className="text-2xl font-bold text-[var(--color-primary)]">
                AxonRH
              </h1>
            )}
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-bold text-center mb-2 text-[var(--color-text-primary)]">
              Entrar
            </h2>
            <p className="text-center text-[var(--color-text-secondary)] mb-6">
              Acesse sua conta para continuar
            </p>

            {/* Mensagem de sessao expirada */}
            {expired && (
              <div className="flex items-center gap-2 p-3 mb-4 rounded-[var(--radius-md)] bg-[var(--color-warning)]/10 text-[var(--color-warning)]">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">
                  Sua sessao expirou. Faca login novamente.
                </span>
              </div>
            )}

            {/* Mensagem de erro */}
            {authError && (
              <div className="flex items-center gap-2 p-3 mb-4 rounded-[var(--radius-md)] bg-[var(--color-error)]/10 text-[var(--color-error)]">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{authError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="label">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
                  <input
                    {...register("email")}
                    type="email"
                    id="email"
                    placeholder="seu@email.com"
                    className={cn(
                      "input pl-10",
                      errors.email && "input-error"
                    )}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <span className="text-sm text-[var(--color-error)] mt-1">
                    {errors.email.message}
                  </span>
                )}
              </div>

              {/* Senha */}
              <div>
                <label htmlFor="password" className="label">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="********"
                    className={cn(
                      "input pl-10 pr-10",
                      errors.password && "input-error"
                    )}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <span className="text-sm text-[var(--color-error)] mt-1">
                    {errors.password.message}
                  </span>
                )}
              </div>

              {/* Codigo 2FA */}
              {show2FA && (
                <div className="animate-fade-in">
                  <label htmlFor="totpCode" className="label">
                    Codigo de Verificacao (2FA)
                  </label>
                  <input
                    {...register("totpCode")}
                    type="text"
                    id="totpCode"
                    placeholder="000000"
                    maxLength={6}
                    className="input text-center text-2xl tracking-widest"
                    disabled={isLoading}
                  />
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    Digite o codigo do seu aplicativo autenticador
                  </p>
                </div>
              )}

              {/* Link Esqueceu Senha */}
              <div className="flex justify-end">
                <a href="/forgot-password" className="link text-sm">
                  Esqueceu sua senha?
                </a>
              </div>

              {/* Botao Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3"
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

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
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
