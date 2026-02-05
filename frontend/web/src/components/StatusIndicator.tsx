import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import axios from "axios";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff, ServerCrash } from "lucide-react";

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
            // Remove /api/v1 or /api/v1/ suffix robustly
            const baseUrl = apiBase.replace(/\/api\/v1\/?$/, "");
            const healthUrl = `${baseUrl}/actuator/health`;

            await axios.get(healthUrl, { timeout: 5000 });
            setStatus("connected");
            setErrorMessage(null);
        } catch (error: any) {
            if (error.response) {
                // The server responded with a status code that falls out of the range of 2xx
                // This means the server IS reachable, so we are connected (just the health check failed or is 404/401)
                setStatus("connected");
                setErrorMessage(null);
            } else if (error.request) {
                // The request was made but no response was received (network error or timeout)
                setStatus("server-error");
                setErrorMessage("Servidor indisponível");
            } else {
                // Something happened in setting up the request
                setStatus("connected"); // Assume okay if strictly logic error
                console.error("Health check setup error", error);
            }
        }
    };

    useEffect(() => {
        checkStatus();

        // Listen to network changes
        const handleOnline = () => checkStatus();
        const handleOffline = () => setStatus("offline");

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const interval = setInterval(checkStatus, 30000); // Check every 30s

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
                    icon: Wifi,
                    text: "Online",
                    styles: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20",
                    dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                };
            case "offline":
                return {
                    icon: WifiOff,
                    text: "Sem Internet",
                    styles: "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20",
                    dot: "bg-red-500"
                };
            case "server-error":
                return {
                    icon: ServerCrash,
                    text: "Servidor Offline",
                    styles: "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20",
                    dot: "bg-amber-500"
                };
            default:
                return {
                    icon: Wifi,
                    text: "Verificando...",
                    styles: "bg-slate-100 text-slate-500",
                    dot: "bg-slate-400"
                };
        }
    };

    const config = getStatusConfig();
    // const Icon = config.icon; // Not used in sidebar variant currently, but available

    if (variant === "sidebar") {
        return (
            <div
                className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-full border text-xs font-medium transition-all duration-300 backdrop-blur-sm cursor-help select-none",
                    config.styles,
                    className
                )}
                title={errorMessage || "Sistema Operacional"}
            >
                <span className={cn("relative flex h-2 w-2")}>
                    {status === 'connected' && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current"></span>
                    )}
                    <span className={cn("relative inline-flex rounded-full h-2 w-2", config.dot)}></span>
                </span>

                <span className="truncate">{config.text}</span>
            </div>
        );
    }

    // Floating variant
    return (
        <div
            className={cn(
                "fixed bottom-4 right-4 p-2.5 rounded-full shadow-lg border backdrop-blur-md flex items-center gap-2 transition-all duration-300 z-50 group hover:pr-4",
                config.styles,
                className
            )}
            title={errorMessage || "System Status"}
        >
            <span className={cn("relative flex h-2.5 w-2.5")}>
                {status === 'connected' && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current"></span>
                )}
                <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", config.dot)}></span>
            </span>
            <span className="w-0 overflow-hidden group-hover:w-auto transition-all duration-300 whitespace-nowrap opacity-0 group-hover:opacity-100 font-medium text-xs">
                {config.text}
            </span>
        </div>
    );
}
