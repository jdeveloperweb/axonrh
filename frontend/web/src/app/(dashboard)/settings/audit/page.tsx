
"use client";

import { useEffect, useState } from "react";
import { AuditLog, auditApi, PageResponse } from "@/lib/api/audit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, Search, Activity } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [pageData, setPageData] = useState<PageResponse<AuditLog> | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const { toast } = useToast();

    useEffect(() => {
        loadLogs(currentPage);
    }, [currentPage]);

    async function loadLogs(page: number) {
        try {
            setLoading(true);
            const data = await auditApi.list(page);
            setPageData(data);
            setLogs(data.content);
        } catch (error) {
            console.error("Failed to load audit logs", error);
            toast({
                variant: "destructive",
                title: "Erro ao carregar logs",
                description: "Não foi possível carregar o histórico de auditoria.",
            });
        } finally {
            setLoading(false);
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "SUCCESS":
                return <Badge className="bg-emerald-500">Sucesso</Badge>;
            case "FAILURE":
                return <Badge variant="destructive">Falha</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getActionBadge = (action: string) => {
        switch (action) {
            case "CREATE":
                return <Badge variant="default" className="bg-blue-500">Criação</Badge>;
            case "UPDATE":
                return <Badge variant="default" className="bg-amber-500">Alteração</Badge>;
            case "DELETE":
                return <Badge variant="destructive">Exclusão</Badge>;
            case "LOGIN":
                return <Badge variant="default" className="bg-indigo-500">Login</Badge>;
            default:
                return <Badge variant="secondary">{action}</Badge>;
        }
    };

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
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Activity className="w-8 h-8 text-[var(--color-primary)]" />
                        Log de Auditoria
                    </h1>
                    <p className="text-muted-foreground">
                        Rastreabilidade completa de ações realizadas no sistema.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Histórico de Operações</CardTitle>
                            <CardDescription>
                                Visualize quem, quando e o que foi alterado.
                            </CardDescription>
                        </div>
                        <div className="relative w-72">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Pesquisar logs..." className="pl-8" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[180px]">Data/Hora</TableHead>
                                <TableHead>Usuário</TableHead>
                                <TableHead>Ação</TableHead>
                                <TableHead>Recurso</TableHead>
                                <TableHead>Detalhes</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent"></div>
                                            <p className="text-sm text-muted-foreground">Carregando logs...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        Nenhum registro de auditoria encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="text-xs font-medium">
                                            {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm">{log.userName}</span>
                                                <span className="text-xs text-muted-foreground">{log.userEmail}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getActionBadge(log.action)}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-muted-foreground uppercase">{log.resource}</span>
                                                <span className="text-[10px] text-muted-foreground">ID: {log.resourceId || "N/A"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap text-sm">
                                            {log.details}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                {pageData && pageData.totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t">
                        <p className="text-sm text-muted-foreground">
                            Página {pageData.number + 1} de {pageData.totalPages} ({pageData.totalElements} registros)
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                disabled={currentPage === 0 || loading}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(pageData.totalPages - 1, prev + 1))}
                                disabled={currentPage === pageData.totalPages - 1 || loading}
                            >
                                Próximo
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
