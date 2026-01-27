"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import axios from "axios";

export function StatusIndicator() {
    const [status, setStatus] = useState<"connected" | "disconnected" | "checking">("checking");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const checkStatus = async () => {
        try {
            // Trying to hit the health endpoint of the API Gateway
            // Assuming existing client base URL is correct (http://localhost:8080/api/v1)
            // Actuator usually lives at /actuator/health, often not under /api/v1
            // So we might need to adjust the URL.
            // Checking application.yml: server.port: 8080.
            // Management endpoints often on same port unless management.server.port is set.
            // management.endpoints.web.exposure.include includes 'health'.
            // So http://localhost:8080/actuator/health should work.

            // Since apiClient has baseURL /api/v1, we need to bypass it or use absolute URL.
            await axios.get("http://localhost:8180/actuator/health");
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
