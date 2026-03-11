"use client";

import { useState } from "react";
import { ShieldCheck, Mail, Loader2, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { authApi, type LoginResponse } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";

interface MfaSetupRequiredModalProps {
  setupToken: string;
  maskedEmail: string;
  onSuccess: (response: LoginResponse) => void;
}

export default function MfaSetupRequiredModal({
  setupToken,
  maskedEmail,
  onSuccess,
}: MfaSetupRequiredModalProps) {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resentSuccess, setResentSuccess] = useState(false);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Digite o código de 6 dígitos do seu aplicativo autenticador.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await authApi.completeMandatoryMfaSetup(setupToken, code);

      // Persiste sessão na store
      useAuthStore.setState({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      if (response.user?.tenantId) {
        localStorage.setItem("tenantId", response.user.tenantId);
      }

      onSuccess(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Código inválido. Tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    setResentSuccess(false);
    try {
      await authApi.resendMfaSetupEmail(setupToken);
      setResentSuccess(true);
      setTimeout(() => setResentSuccess(false), 5000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível reenviar o email. Tente fazer login novamente."
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white text-center">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
          </div>
          <h2 className="text-xl font-bold">Autenticação em duas etapas obrigatória</h2>
          <p className="text-blue-100 text-sm mt-1">
            Por conter dados pessoais, este sistema exige MFA ativo.
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Email enviado */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 mb-5">
            <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Email enviado!</p>
              <p className="text-sm text-blue-700 mt-0.5">
                Enviamos um email para{" "}
                <span className="font-semibold">{maskedEmail}</span> com o QR Code
                e as instruções de configuração.
              </p>
            </div>
          </div>

          {/* Instruções resumidas */}
          <ol className="space-y-2 mb-5 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">1</span>
              Abra o email e escaneie o QR Code com um app autenticador
              <span className="text-slate-400 text-xs">(Google Authenticator, Authy…)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">2</span>
              O app gerará um código de 6 dígitos
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">3</span>
              Digite o código abaixo para confirmar a configuração
            </li>
          </ol>

          {/* Erro */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 mb-4">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span className="text-sm text-rose-700">{error}</span>
            </div>
          )}

          {/* Sucesso reenvio */}
          {resentSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 mb-4">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-700">Email reenviado com sucesso!</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleComplete} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Código do autenticador
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setCode(val);
                  setError(null);
                }}
                placeholder="000000"
                autoFocus
                className="w-full text-center text-3xl font-mono tracking-[0.5em] py-3 px-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none bg-slate-50 text-slate-900 placeholder:text-slate-300"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || code.length !== 6}
              className="w-full py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Confirmar e entrar
                </>
              )}
            </button>
          </form>

          {/* Reenviar email */}
          <div className="mt-4 text-center">
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1.5 mx-auto transition-colors disabled:opacity-50"
            >
              {isResending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Não recebeu o email? Reenviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
