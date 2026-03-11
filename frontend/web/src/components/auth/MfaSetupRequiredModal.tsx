"use client";

import { useState, useRef, useEffect } from "react";
import { Shield, Mail, Loader2, AlertCircle, RefreshCw, CheckCircle2, Lock, Smartphone } from "lucide-react";
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
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resentSuccess, setResentSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const code = digits.join("");

  const handleDigitChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    setError(null);
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    setError(null);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Digite todos os 6 dígitos do código.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await authApi.completeMandatoryMfaSetup(setupToken, code);
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
      setError(err instanceof Error ? err.message : "Código inválido. Verifique e tente novamente.");
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
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
      setTimeout(() => setResentSuccess(false), 6000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível reenviar. Tente fazer login novamente.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
      <style>{`
        @keyframes mfa-slide-up {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes mfa-dot-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
        .mfa-card {
          animation: mfa-slide-up 0.35s cubic-bezier(0.22,1,0.36,1) both;
        }
        .otp-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent); }
        .otp-input.filled { border-color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 6%, white); color: var(--color-primary); }
        .btn-primary { background: var(--color-primary); }
        .btn-primary:hover:not(:disabled) { filter: brightness(0.9); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .step-badge { background: color-mix(in srgb, var(--color-primary) 12%, transparent); color: var(--color-primary); }
        .shield-ring { border: 2px solid color-mix(in srgb, var(--color-primary) 25%, transparent); }
        .shield-bg { background: color-mix(in srgb, var(--color-primary) 10%, transparent); }
        .shield-icon { color: var(--color-primary); }
        .email-badge { background: color-mix(in srgb, var(--color-primary) 8%, transparent); border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent); }
        .email-icon { color: var(--color-primary); }
        .link-btn { color: var(--color-secondary); }
        .link-btn:hover { color: var(--color-primary); }
        .pulse-dot { animation: mfa-dot-pulse 1.4s ease-in-out infinite; }
        .pulse-dot:nth-child(2) { animation-delay: 0.2s; }
        .pulse-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      <div className="mfa-card w-full max-w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* ── Top accent bar ── */}
        <div className="h-1 w-full btn-primary" />

        {/* ── Header ── */}
        <div className="flex flex-col items-center pt-8 pb-6 px-8 text-center">
          <div className="shield-ring shield-bg w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
            <Shield className="shield-icon w-8 h-8" strokeWidth={1.75} />
          </div>
          <h2 className="text-[1.35rem] font-bold text-slate-900 leading-tight tracking-tight">
            Verificação em duas etapas
          </h2>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed max-w-[280px]">
            Configure o MFA para acessar dados pessoais com segurança.
          </p>
        </div>

        <div className="px-8 pb-8 space-y-5">

          {/* ── Email notice ── */}
          <div className="email-badge rounded-xl px-4 py-3.5 flex items-start gap-3">
            <Mail className="email-icon w-4.5 h-4.5 flex-shrink-0 mt-0.5" style={{ width: 18, height: 18 }} />
            <div>
              <p className="text-[13px] font-semibold text-slate-800">Email de configuração enviado</p>
              <p className="text-[12.5px] text-slate-500 mt-0.5 leading-relaxed">
                Verifique <span className="font-semibold text-slate-700">{maskedEmail}</span> — enviamos o QR Code e as instruções.
              </p>
            </div>
          </div>

          {/* ── Steps ── */}
          <div className="space-y-2.5">
            {[
              { icon: <Smartphone size={14} />, text: "Abra o app autenticador e escaneie o QR Code do email" },
              { icon: <Lock size={14} />,       text: "O app vai gerar um código de 6 dígitos" },
              { icon: <Shield size={14} />,     text: "Digite o código abaixo para ativar o acesso" },
            ].map(({ icon, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="step-badge flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5">
                  {i + 1}
                </span>
                <p className="text-[13px] text-slate-600 leading-snug pt-0.5">{text}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100" />

          {/* ── OTP Inputs ── */}
          <form onSubmit={handleComplete} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-3">
                Código do autenticador
              </label>
              <div className="flex gap-2 justify-between" onPaste={handlePaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={d}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    disabled={isSubmitting}
                    className={`otp-input w-full aspect-square max-w-[52px] text-center text-xl font-bold border-2 border-slate-200 rounded-xl outline-none bg-slate-50 transition-all duration-150 text-slate-900 ${d ? "filled" : ""}`}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-100">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span className="text-[13px] text-rose-700 font-medium">{error}</span>
              </div>
            )}

            {/* Resent success */}
            {resentSuccess && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-[13px] text-emerald-700 font-medium">Email reenviado com sucesso!</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || code.length !== 6}
              className="btn-primary w-full py-3 rounded-xl font-semibold text-white text-sm transition-all duration-150 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="flex gap-1">
                    <span className="pulse-dot w-1.5 h-1.5 bg-white/70 rounded-full inline-block" />
                    <span className="pulse-dot w-1.5 h-1.5 bg-white/70 rounded-full inline-block" />
                    <span className="pulse-dot w-1.5 h-1.5 bg-white/70 rounded-full inline-block" />
                  </span>
                  Verificando...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Confirmar e entrar
                </>
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="link-btn text-[12.5px] font-medium flex items-center gap-1.5 mx-auto transition-colors duration-150 disabled:opacity-50"
            >
              {isResending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              {isResending ? "Reenviando..." : "Não recebeu o email? Reenviar"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
