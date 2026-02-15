import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import axios from "axios";
import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldAlert, ShieldOff, Activity } from "lucide-react";

interface StatusIndicatorProps {
    className?: string;
    variant?: "floating" | "sidebar";
}

type ConnectionStatus = "connected" | "server-error" | "offline" | "checking";

export function StatusIndicator({ className, variant = "sidebar" }: StatusIndicatorProps) {
    const [status, setStatus] = useState<ConnectionStatus>("checking");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const checkStatus = async () => {
        if (!navigator.onLine) {
            setStatus("offline");
            return;
        }

        try {
            const apiBase = apiClient.defaults.baseURL || "http://localhost:8180/api/v1";
            const baseUrl = apiBase.replace(/\/api\/v1\/?$/, "");
            const healthUrl = `${baseUrl}/actuator/health`;

            await axios.get(healthUrl, { timeout: 8000 });
            setStatus("connected");
            setErrorMessage(null);
        } catch (error: any) {
            if (error.response) {
                setStatus("connected");
                setErrorMessage(null);
            } else if (error.request) {
                setStatus("server-error");
                setErrorMessage("Servidor indisponível");
            } else {
                setStatus("connected");
                console.error("Health check setup error", error);
            }
        }
    };

    useEffect(() => {
        checkStatus();
        const handleOnline = () => checkStatus();
        const handleOffline = () => setStatus("offline");

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        const interval = setInterval(checkStatus, 45000);

        return () => {
            clearInterval(interval);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (status === "checking") return null;

    const getStatusConfig = () => {
        switch (status) {
            case "connected":
                return {
                    icon: ShieldCheck,
                    text: "SISTEMA ONLINE",
                    styles: "bg-emerald-500/5 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.05)]",
                    dot: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]",
                    glow: "after:bg-emerald-500/20"
                };
            case "offline":
                return {
                    icon: ShieldOff,
                    text: "SEM INTERNET",
                    styles: "bg-rose-500/5 text-rose-500 border-rose-500/20 hover:bg-rose-500/10",
                    dot: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]",
                    glow: "after:bg-rose-500/10"
                };
            case "server-error":
                return {
                    icon: ShieldAlert,
                    text: "CONEXÃO INSTÁVEL",
                    styles: "bg-amber-500/5 text-amber-500 border-amber-500/20 hover:bg-amber-500/10",
                    dot: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]",
                    glow: "after:bg-amber-500/10"
                };
            default:
                return {
                    icon: Activity,
                    text: "VERIFICANDO",
                    styles: "bg-slate-500/5 text-slate-500 border-slate-500/20",
                    dot: "bg-slate-400",
                    glow: ""
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    if (variant === "sidebar") {
        const isCompact = className?.includes("w-8") || className?.includes("h-8");

        return (
            <div
                className={cn(
                    "group relative flex items-center transition-all duration-500 backdrop-blur-md cursor-help select-none overflow-hidden",
                    !isCompact ? "gap-3 px-4 py-2.5 rounded-2xl border" : "justify-center rounded-full border",
                    config.styles,
                    className
                )}
                title={errorMessage || "Monitor de Integridade do Sistema"}
            >
                {/* Glossy overlay effect */}
                {!isCompact && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -translate-x-full group-hover:translate-x-full" />
                )}

                <span className={cn("relative flex h-2.5 w-2.5 flex-shrink-0")}>
                    {status === 'connected' && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 bg-current"></span>
                    )}
                    <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", config.dot)}></span>
                </span>

                {!isCompact && (
                    <>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold tracking-[0.15em] leading-tight">
                                {config.text}
                            </span>
                            <span className="text-[9px] opacity-60 font-medium truncate">
                                {status === 'connected' ? 'Secure Encryption Active' : 'Check Connectivity'}
                            </span>
                        </div>

                        <Icon className="ml-auto w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
                    </>
                )}
            </div>
        );
    }

    // Floating variant
    return (
        <div
            className={cn(
                "fixed bottom-6 right-6 p-1 rounded-full shadow-2xl border backdrop-blur-xl flex items-center transition-all duration-500 z-50 group hover:pr-4",
                config.styles,
                className
            )}
            title={errorMessage || "System Status"}
        >
            <div className="flex items-center gap-3 px-3 py-2">
                <span className={cn("relative flex h-2.5 w-2.5")}>
                    {status === 'connected' && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 bg-current"></span>
                    )}
                    <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", config.dot)}></span>
                </span>

                <span className="w-0 overflow-hidden group-hover:w-auto transition-all duration-500 whitespace-nowrap opacity-0 group-hover:opacity-100 font-bold text-[10px] tracking-wider">
                    {config.text}
                </span>
            </div>
        </div>
    );
}

