"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.requestPasswordReset(data.email);
      setSubmitted(true);
    } catch {
      // Sempre mostra sucesso para não expor se o email existe
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  const inputBaseClasses =
    "input bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-sky-200 focus:border-sky-400";

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 sm:px-6 py-8 sm:py-16 text-slate-900">
      <div className="absolute inset-0 bg-gradient-to-br from-[#f2f7ff] via-[#eaf6ff] to-[#e9f8f5]" />
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(94,165,255,0.25),_transparent_55%)]" />
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_80%,_rgba(88,214,194,0.25),_transparent_55%)]" />
      <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="animate-login-orb-drift absolute -top-32 right-0 h-72 w-72 rounded-full bg-sky-200/60 blur-[120px]" />
      <div className="animate-login-orb-drift-alt absolute bottom-0 left-0 h-72 w-72 rounded-full bg-emerald-200/60 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="animate-login-card-enter relative rounded-3xl border border-white/40 glass shadow-2xl shadow-slate-200/50 p-6 sm:p-10">
          {submitted ? (
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-semibold text-slate-900 mb-3">
                Verifique seu e-mail
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-2">
                Se <strong className="text-slate-700">{getValues("email")}</strong> estiver
                cadastrado, você receberá um link para redefinir sua senha em instantes.
              </p>
              <p className="text-xs text-slate-400 mb-8">
                Não esqueça de verificar a pasta de spam.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700 underline underline-offset-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--color-primary,#1E40AF)]/10 mb-4">
                  <Mail className="w-7 h-7 text-[var(--color-primary,#1E40AF)]" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold text-slate-900">
                  Recuperar senha
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Informe seu e-mail e enviaremos um link para redefinir sua senha.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-rose-100 text-rose-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="email" className="text-sm font-medium text-slate-700">
                    E-mail corporativo
                  </label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      {...register("email")}
                      type="email"
                      id="email"
                      placeholder="seu@email.com"
                      className={cn(`${inputBaseClasses} pl-10`, errors.email && "input-error")}
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                  {errors.email && (
                    <span className="text-sm text-rose-600 mt-1">{errors.email.message}</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{ backgroundColor: "var(--color-primary, #0f172a)" }}
                  className="w-full py-3 rounded-[var(--radius-md)] font-semibold text-white shadow-lg hover:opacity-90 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar link de recuperação"
                  )}
                </button>

                <Link
                  href="/login"
                  className="w-full py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para o login
                </Link>
              </form>
            </>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-slate-500">
          Powered by AxonRH
        </div>
      </div>
    </div>
  );
}
