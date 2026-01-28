import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import axios from "axios";
import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
    className?: string;
    variant?: "floating" | "sidebar";
}

export function StatusIndicator({ className, variant = "sidebar" }: StatusIndicatorProps) {
    const [status, setStatus] = useState<"connected" | "disconnected" | "checking">("checking");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const checkStatus = async () => {
        try {
            const apiBase = apiClient.defaults.baseURL || "http://localhost:8180/api/v1";
            const healthUrl = apiBase.replace('/api/v1', '') + '/actuator/health';
            await axios.get(healthUrl);
            setStatus("connected");
            setErrorMessage(null);
        } catch (error) {
            setStatus("disconnected");
            setErrorMessage("Backend unreachable");
            console.error("Backend health check failed", error);
        }
    };

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    if (status === "checking") return null;

    if (variant === "sidebar") {
        return (
            <div
                className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm transition-colors cursor-help",
                    status === "connected" ? "text-green-700 bg-green-50/50 hover:bg-green-100/50" : "text-red-700 bg-red-50/50 hover:bg-red-100/50",
                    className
                )}
                title={status === "connected" ? "Sistema Online" : `Erro: ${errorMessage}`}
            >
                <div className={cn("w-2 h-2 rounded-full", status === "connected" ? "bg-green-500" : "bg-red-500 animate-pulse")} />
                <span className="font-medium">{status === "connected" ? "Sistema Online" : "Sistema Offline"}</span>
            </div>
        );
    }

    // Default floating variant (legacy)
    return (
        <div
            className={cn(
                "fixed bottom-4 right-28 p-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium transition-colors cursor-help group z-50",
                status === "connected" ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200",
                className
            )}
            title={status === "connected" ? "Backend Connected" : `Error: ${errorMessage}`}
        >
            <div
                className={cn("w-2 h-2 rounded-full", status === "connected" ? "bg-green-500" : "bg-red-500 animate-pulse")}
            />
            <span className="hidden group-hover:inline">
                {status === "connected" ? "System Online" : "System Offline"}
            </span>
        </div>
    );
}
