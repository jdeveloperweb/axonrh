
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
import { formatDate } from "@/lib/utils/date";
import { Plus, Edit, Trash2 } from "lucide-react";
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

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
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
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao carregar perfis",
                description: "Não foi possível carregar a lista de perfis.",
            });
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Perfis de Acesso</h1>
                    <p className="text-muted-foreground">
                        Gerencie os perfis de acesso e suas permissões no sistema.
                    </p>
                </div>
                <Button onClick={() => router.push("/settings/roles/new")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Perfil
                </Button>
            </div>

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
                                        Nenhum perfil encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                roles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-medium">{role.name}</TableCell>
                                        <TableCell>{role.description || "-"}</TableCell>
                                        <TableCell>
                                            {role.systemRole ? (
                                                <Badge variant="secondary">Sistema</Badge>
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
                                                    asChild
                                                >
                                                    <Link href={`/settings/roles/${role.id}`}>
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
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
