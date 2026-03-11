"use client";

import { useState, useRef, useEffect } from "react";
import { Shield, Mail, Loader2, AlertCircle, RefreshCw, CheckCircle2, X } from "lucide-react";
import { authApi, type LoginResponse } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";

interface MfaSetupRequiredModalProps {
  setupToken: string;
  maskedEmail: string;
  onSuccess: (response: LoginResponse) => void;
  onClose: () => void;
}

export default function MfaSetupRequiredModal({
  setupToken,
  maskedEmail,
  onSuccess,
  onClose,
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
    if (clean && index < 5) inputRefs.current[index + 1]?.focus();
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
    const next = ["", "", "", "", "", ""];
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    setError(null);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) { setError("Digite todos os 6 dígitos."); return; }
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
      if (response.user?.tenantId) localStorage.setItem("tenantId", response.user.tenantId);
      onSuccess(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código inválido. Verifique e tente novamente.");
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
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

  const primary = "var(--color-primary)";
  const primaryRgba = "rgba(0,0,0,0.06)"; // generic soft tint — avoids color-mix()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm px-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <style>{`
        @keyframes mfaUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .mfa-card { animation: mfaUp 0.3s cubic-bezier(0.22,1,0.36,1) both; }
        .otp-box {
          width: 100%; aspect-ratio: 1;
          text-align: center;
          font-size: 1.375rem;
          font-weight: 700;
          font-family: ui-monospace, monospace;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: #f8fafc;
          color: #0f172a;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .otp-box:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.15);
          background: #ffffff;
        }
        .otp-box.has-val {
          border-color: var(--color-primary);
          background: #ffffff;
          color: var(--color-primary);
        }
        .btn-confirm {
          background: var(--color-primary);
          color: #ffffff;
          width: 100%; padding: 13px;
          border-radius: 12px;
          font-size: 15px; font-weight: 600;
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: filter 0.15s, opacity 0.15s;
        }
        .btn-confirm:hover:not(:disabled) { filter: brightness(0.88); }
        .btn-confirm:disabled { opacity: 0.45; cursor: not-allowed; }
        .step-num {
          background: var(--color-primary);
          color: #fff;
          width: 26px; height: 26px; min-width: 26px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700;
          margin-top: 1px;
        }
        .accent-bar { background: var(--color-primary); }
        .email-row { border-left: 3px solid var(--color-primary); }
        .resend-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; color: #94a3b8; transition: color 0.15s; }
        .resend-btn:hover:not(:disabled) { color: var(--color-primary); }
        .resend-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div className="mfa-card w-full max-w-[410px] bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Accent bar */}
        <div className="accent-bar h-[3px] w-full" />

        {/* Close button */}
        <div className="flex justify-end px-5 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col items-center pt-2 pb-5 px-8 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: primaryRgba }}
          >
            <Shield className="w-7 h-7" style={{ color: primary }} strokeWidth={1.75} />
          </div>
          <h2 className="text-[1.3rem] font-bold text-slate-900 leading-tight">
            Verificação em duas etapas
          </h2>
          <p className="text-[13.5px] text-slate-500 mt-1.5 max-w-[270px] leading-relaxed">
            Configure o MFA para proteger o acesso aos seus dados.
          </p>
        </div>

        <div className="px-7 pb-7 space-y-5">

          {/* Email sent */}
          <div className="email-row bg-slate-50 rounded-r-xl rounded-bl-xl px-4 py-3.5">
            <div className="flex items-start gap-3">
              <Mail className="w-[17px] h-[17px] flex-shrink-0 mt-0.5" style={{ color: primary }} />
              <div>
                <p className="text-[13px] font-semibold text-slate-800">Email enviado com instruções</p>
                <p className="text-[12.5px] text-slate-500 mt-0.5 leading-relaxed">
                  Verifique <span className="font-semibold text-slate-700">{maskedEmail}</span>
                  {" "}— enviamos o QR Code e o passo a passo.
                </p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {[
              "Abra o app autenticador e escaneie o QR Code do email",
              "O app vai gerar um código de 6 dígitos renovado a cada 30s",
              "Digite o código abaixo para confirmar e acessar o sistema",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="step-num">{i + 1}</span>
                <p className="text-[13px] text-slate-600 leading-snug pt-0.5">{text}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100" />

          {/* OTP */}
          <form onSubmit={handleComplete} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-3">
                Código do autenticador
              </label>
              <div className="flex gap-2" onPaste={handlePaste}>
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
                    autoComplete="one-time-code"
                    className={`otp-box${d ? " has-val" : ""}`}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-100">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span className="text-[13px] text-rose-700">{error}</span>
              </div>
            )}

            {resentSuccess && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-[13px] text-emerald-700">Email reenviado com sucesso!</span>
              </div>
            )}

            <button type="submit" disabled={isSubmitting || code.length !== 6} className="btn-confirm">
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</>
              ) : (
                <><Shield className="w-4 h-4" /> Confirmar e entrar</>
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="flex justify-center">
            <button type="button" onClick={handleResend} disabled={isResending} className="resend-btn">
              {isResending
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Reenviando...</>
                : <><RefreshCw className="w-3.5 h-3.5" /> Não recebeu o email? Reenviar</>
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
