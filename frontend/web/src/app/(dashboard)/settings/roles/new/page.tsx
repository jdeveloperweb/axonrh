
"use client";

import { useEffect, useState } from "react";
import { Permission, rolesApi } from "@/lib/api/roles";
import { RoleForm } from "@/components/roles/role-form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function NewRolePage() {
    const [permissionsGrouped, setPermissionsGrouped] = useState<Record<string, Permission[]>>({});
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        async function loadPermissions() {
            try {
                const data = await rolesApi.listPermissionsGrouped();
                setPermissionsGrouped(data);
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Erro ao carregar permissões",
                    description: "Não foi possível carregar a lista de permissões.",
                });
            } finally {
                setLoading(false);
            }
        }

        loadPermissions();
    }, [toast]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Novo Perfil</h1>
                    <p className="text-muted-foreground">
                        Crie um novo perfil de acesso e defina suas permissões.
                    </p>
                </div>
            </div>

            <RoleForm permissionsGrouped={permissionsGrouped} />
        </div>
    );
}
