
"use client";

import { useEffect, useState } from "react";
import { Role, rolesApi } from "@/lib/api/roles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, AlertTriangle, ArrowLeft } from "lucide-react";
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
        <div className="space-y-6">
            <Link
                href="/settings"
                className="flex items-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors mb-4 group w-fit"
            >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Voltar para Configurações
            </Link>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Perfis de Acesso</h1>
                    <p className="text-muted-foreground">
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
                <CardHeader>
                    <CardTitle>Perfis Cadastrados</CardTitle>
                    <CardDescription>
                        Lista de todos os perfis disponíveis e seus níveis de acesso.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        Carregando...
                                    </TableCell>
                                </TableRow>
                            ) : roles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        {backendError
                                            ? "Funcionalidade indisponível até a atualização do backend."
                                            : "Nenhum perfil encontrado."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                roles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-medium">{role.name}</TableCell>
                                        <TableCell>{role.description || "-"}</TableCell>
                                        <TableCell>
                                            {role.systemRole ? (
                                                <Badge variant="warning">Sistema</Badge>
                                            ) : (
                                                <Badge variant="outline">Personalizado</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={role.active ? "default" : "destructive"}>
                                                {role.active ? "Ativo" : "Inativo"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/settings/roles/${role.id}`)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>

                                                {!role.systemRole && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
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
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
