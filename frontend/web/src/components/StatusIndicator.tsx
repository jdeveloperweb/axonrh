"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import axios from "axios";

export function StatusIndicator() {
    const [status, setStatus] = useState<"connected" | "disconnected" | "checking">("checking");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const checkStatus = async () => {
        try {
            // Determine the base URL from the apiClient or environment
            // This ensures we hit the correct server/port (e.g., remote IP vs localhost)
            // Remove '/api/v1' suffix to get the root, then append '/actuator/health'
            const apiBase = apiClient.defaults.baseURL || "http://localhost:8180/api/v1";
            const healthUrl = apiBase.replace('/api/v1', '') + '/actuator/health';

            console.log("Health Check Debug:", {
                configuredBase: apiClient.defaults.baseURL,
                fallbackBase: "http://localhost:8180/api/v1",
                finalHealthUrl: healthUrl
            });

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

    return (
        <div
            className={`fixed bottom-4 right-4 p-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium transition-colors cursor-help group z-50 ${status === "connected"
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
                }`}
            title={status === "connected" ? "Backend Connected" : `Error: ${errorMessage}`}
        >
            <div
                className={`w-2 h-2 rounded-full ${status === "connected" ? "bg-green-500" : "bg-red-500 animate-pulse"
                    }`}
            />
            <span className="hidden group-hover:inline">
                {status === "connected" ? "System Online" : "System Offline"}
            </span>
        </div>
    );
}
