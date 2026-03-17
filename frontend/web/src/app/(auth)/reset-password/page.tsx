"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Deve conter ao menos uma letra maiúscula")
      .regex(/[a-z]/, "Deve conter ao menos uma letra minúscula")
      .regex(/[0-9]/, "Deve conter ao menos um número")
      .regex(/[^A-Za-z0-9]/, "Deve conter ao menos um caractere especial"),
    confirmPassword: z.string().min(1, "Confirmação é obrigatória"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Link inválido. Solicite um novo link de recuperação.");
    }
  }, [token]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      await authApi.confirmPasswordReset(token, data.newPassword);
      setSuccess(true);
      setTimeout(() => router.replace("/login"), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("inválido") || msg.toLowerCase().includes("expirado")) {
        setError("Link expirado ou inválido. Solicite um novo link de recuperação.");
      } else {
        setError("Ocorreu um erro. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase =
    "input bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-sky-200 focus:border-sky-400";

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-16 text-slate-900">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f2f7ff] via-[#eaf6ff] to-[#e9f8f5]" />
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(94,165,255,0.25),_transparent_55%)]" />
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_80%,_rgba(88,214,194,0.25),_transparent_55%)]" />
      <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl border border-white/40 glass shadow-2xl shadow-slate-200/50 p-8 sm:p-10 bg-white/80 backdrop-blur">

          {/* Logo */}
          <div className="mb-8 text-center">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight mb-1">
              <span className="text-slate-900">Axon</span>
              <span className="text-[var(--color-primary,#1E40AF)]">RH</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Redefinição de senha</p>
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
              <h2 className="font-heading text-xl font-semibold text-slate-900">Senha redefinida!</h2>
              <p className="text-sm text-slate-500">
                Sua senha foi atualizada com sucesso. Você será redirecionado para o login em instantes.
              </p>
              <a
                href="/login"
                className="inline-block mt-2 text-sm text-[var(--color-primary,#1E40AF)] hover:opacity-80 font-medium"
              >
                Ir para o login agora
              </a>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="font-heading text-xl font-semibold text-slate-900">
                  Crie uma nova senha
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  A senha deve ter no mínimo 8 caracteres com letras maiúsculas, minúsculas, números e caracteres especiais.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-rose-100 text-rose-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    {error}
                    {error.includes("Link") && (
                      <div className="mt-1">
                        <a href="/forgot-password" className="underline font-medium">
                          Solicitar novo link
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!token ? null : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Nova senha */}
                  <div>
                    <label htmlFor="newPassword" className="text-sm font-medium text-slate-700">
                      Nova senha
                    </label>
                    <div className="relative mt-2">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        {...register("newPassword")}
                        type={showPassword ? "text" : "password"}
                        id="newPassword"
                        placeholder="••••••••"
                        className={cn(`${inputBase} pl-10 pr-10`, errors.newPassword && "input-error")}
                        disabled={isLoading}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <span className="text-sm text-rose-600 mt-1 block">{errors.newPassword.message}</span>
                    )}
                  </div>

                  {/* Confirmar senha */}
                  <div>
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                      Confirmar nova senha
                    </label>
                    <div className="relative mt-2">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        {...register("confirmPassword")}
                        type={showConfirm ? "text" : "password"}
                        id="confirmPassword"
                        placeholder="••••••••"
                        className={cn(`${inputBase} pl-10 pr-10`, errors.confirmPassword && "input-error")}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <span className="text-sm text-rose-600 mt-1 block">{errors.confirmPassword.message}</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{ backgroundColor: "var(--color-primary, #1E40AF)" }}
                    className="w-full py-3 rounded-xl font-semibold text-white shadow-lg hover:opacity-90 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar nova senha"
                    )}
                  </button>
                </form>
              )}

              <div className="mt-6 text-center">
                <a href="/login" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
                  Voltar para o login
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
