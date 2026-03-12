
"use client";

import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AccessDenied() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6 text-rose-600 animate-pulse">
                <ShieldAlert className="w-10 h-10" />
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-2">Acesso Negado</h1>
            <p className="text-slate-600 max-w-md mb-8">
                Desculpe, você não possui as permissões necessárias para acessar esta página ou realizar esta ação.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </Button>
                <Button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2"
                >
                    <Home className="w-4 h-4" />
                    Ir para Dashboard
                </Button>
            </div>

            <div className="mt-12 p-4 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-sm max-w-lg">
                <strong>Dica:</strong> Se você acredita que deveria ter acesso, entre em contato com o administrador do sistema para revisar seu perfil de acesso.
            </div>
        </div>
    );
}
