
"use client";

import { useEffect, useState } from "react";
import { Role, rolesApi } from "@/lib/api/roles";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Plus, AlertTriangle, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { isAxiosError } from "@/lib/api/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [backendError, setBackendError] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        loadRoles();
    }, []);

    async function loadRoles() {
        try {
            setLoading(true);
            const data = await rolesApi.list();
            setRoles(data);
            setBackendError(false);
        } catch (error) {
            console.error("Failed to load roles", error);

            if (isAxiosError(error) && error.response?.status === 404) {
                setBackendError(true);
                toast({
                    variant: "destructive",
                    title: "Backend Desatualizado",
                    description: "Os novos endpoints de perfil não foram encontrados no servidor.",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Erro ao carregar perfis",
                    description: "Não foi possível carregar a lista de perfis.",
                });
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        try {
            await rolesApi.delete(id);
            setRoles(roles.filter((r) => r.id !== id));
            toast({
                title: "Perfil excluído",
                description: "O perfil foi removido com sucesso.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao excluir",
                description: "Não foi possível excluir o perfil. Verifique se ele está em uso.",
            });
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Link
                href="/settings"
                className="flex items-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors mb-4 group w-fit"
            >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Voltar para Configurações
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Perfis de Acesso</h1>
                    <p className="text-[var(--color-text-secondary)]">
                        Gerencie os perfis de acesso e suas permissões no sistema.
                    </p>
                </div>
                <Button onClick={() => router.push("/settings/roles/new")} disabled={backendError}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Perfil
                </Button>
            </div>

            {backendError && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro de Versão do Backend</AlertTitle>
                    <AlertDescription>
                        O servidor backend não possui os endpoints necessários para gerenciar perfis (Erro 404).
                        Por favor, realize o DEPLOY da aplicação backend com as novas classes (RoleController, PermissionController).
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader className="pb-3 border-b border-[var(--color-border)]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-[var(--color-text-primary)]">Perfis Cadastrados</p>
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                Lista de todos os perfis disponíveis e seus níveis de acesso.
                            </p>
                        </div>
                        {!loading && roles.length > 0 && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--color-surface-variant)] text-[var(--color-text-secondary)]">
                                {roles.length} {roles.length === 1 ? "perfil" : "perfis"}
                            </span>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[var(--color-surface-variant)] text-[var(--color-text-secondary)] text-sm font-medium uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Nome</th>
                                    <th className="px-6 py-4">Descrição</th>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4" colSpan={5}>
                                                <div className="h-10 bg-[var(--color-surface-variant)] rounded"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : roles.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-[var(--color-text-secondary)]">
                                            {backendError
                                                ? "Funcionalidade indisponível até a atualização do backend."
                                                : "Nenhum perfil encontrado."}
                                        </td>
                                    </tr>
                                ) : (
                                    roles.map((role) => (
                                        <tr key={role.id} className="hover:bg-[var(--color-surface-variant)]/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                                                        <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
                                                    </div>
                                                    <span className="font-medium text-[var(--color-text-primary)]">{role.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[var(--color-text-secondary)] text-sm max-w-xs truncate">
                                                {role.description || <span className="text-[var(--color-text-secondary)]/50">—</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                {role.systemRole ? (
                                                    <Badge variant="warning">Sistema</Badge>
                                                ) : (
                                                    <Badge variant="outline">Personalizado</Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={role.active ? "default" : "destructive"}>
                                                    {role.active ? "Ativo" : "Inativo"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        className="p-2 hover:bg-[var(--color-surface-variant)] rounded-full transition-colors text-[var(--color-text-secondary)]"
                                                        title="Editar"
                                                        onClick={() => router.push(`/settings/roles/${role.id}`)}
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>

                                                    {!role.systemRole && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <button
                                                                    className="p-2 hover:bg-red-50 rounded-full transition-colors text-red-500"
                                                                    title="Excluir"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Excluir Perfil</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Tem certeza que deseja excluir o perfil <strong>{role.name}</strong>?
                                                                        Esta ação não pode ser desfeita.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDelete(role.id)}
                                                                        className="bg-destructive hover:bg-destructive/90"
                                                                    >
                                                                        Excluir
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
