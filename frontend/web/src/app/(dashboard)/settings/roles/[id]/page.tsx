
"use client";

import { useEffect, useState } from "react";
import { Permission, Role, rolesApi } from "@/lib/api/roles";
import { RoleForm } from "@/components/roles/role-form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function EditRolePage() {
    const [permissionsGrouped, setPermissionsGrouped] = useState<Record<string, Permission[]>>({});
    const [role, setRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    useEffect(() => {
        async function loadData() {
            try {
                const [permsData, roleData] = await Promise.all([
                    rolesApi.listPermissionsGrouped(),
                    rolesApi.get(id),
                ]);
                setPermissionsGrouped(permsData);
                setRole(roleData);
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Erro ao carregar dados",
                    description: "Não foi possível carregar o perfil ou as permissões.",
                });
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [id, toast]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!role) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-muted-foreground">Perfil não encontrado.</p>
                <Button onClick={() => router.back()}>Voltar</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <button
                onClick={() => router.back()}
                className="flex items-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors group w-fit"
            >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Voltar
            </button>

            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Editar Perfil</h1>
                <p className="text-[var(--color-text-secondary)]">
                    Gerencie as permissões do perfil <strong>{role.name}</strong>.
                </p>
            </div>

            <RoleForm initialData={role} permissionsGrouped={permissionsGrouped} />
        </div>
    );
}
