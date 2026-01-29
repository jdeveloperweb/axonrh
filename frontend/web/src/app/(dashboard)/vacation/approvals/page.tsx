'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react';
import { vacationApi, VacationRequest } from '@/lib/api/vacation';
import { ReviewVacationDialog } from '@/components/vacation/ReviewVacationDialog';

export default function VacationApprovalsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<VacationRequest[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<VacationRequest | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Pagination (simplified for now)
    const [page] = useState(0);

    const loadRequests = useCallback(async () => {
        try {
            setLoading(true);
            const response = await vacationApi.getPendingRequests(page);
            setRequests(response.content);
        } catch (error) {
            console.error('Failed to load pending requests:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar as solicitações pendentes.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [page, toast]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const handleReview = (request: VacationRequest) => {
        setSelectedRequest(request);
        setDialogOpen(true);
    };

    const onConfirmReview = async (requestId: string, notes: string, type: 'APPROVE' | 'REJECT') => {
        try {
            if (type === 'APPROVE') {
                await vacationApi.approveRequest(requestId, notes);
                toast({
                    title: 'Sucesso',
                    description: 'Férias aprovadas com sucesso!',
                });
            } else {
                await vacationApi.rejectRequest(requestId, notes);
                toast({
                    title: 'Rejeitada',
                    description: 'Solicitação de férias rejeitada.',
                });
            }
            // Refresh list
            loadRequests();
        } catch (error) {
            console.error('Error reviewing request:', error);
            toast({
                title: 'Erro',
                description: 'Falha ao processar a solicitação.',
                variant: 'destructive',
            });
            throw error;
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Aprovações Pendentes</h1>
                    <p className="text-muted-foreground">Gerencie as solicitações de férias da sua equipe</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Solicitações Aguardando Aprovação</CardTitle>
                    <CardDescription>
                        {requests.length} solicitação(ões) pendente(s)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhuma solicitação pendente no momento.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Colaborador</TableHead>
                                    <TableHead>Período</TableHead>
                                    <TableHead>Dias</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Solicitado em</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell className="font-medium">{request.employeeName}</TableCell>
                                        <TableCell>
                                            {formatDate(request.startDate)} - {formatDate(request.endDate)}
                                            {request.sellDays && (
                                                <span className="block text-xs text-muted-foreground">
                                                    + {request.soldDaysCount} dias abono
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>{request.daysCount} dias</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{request.requestTypeLabel}</Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button onClick={() => handleReview(request)} size="sm">
                                                Revisar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <ReviewVacationDialog
                request={selectedRequest}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onConfirm={onConfirmReview}
            />
        </div>
    );
}
