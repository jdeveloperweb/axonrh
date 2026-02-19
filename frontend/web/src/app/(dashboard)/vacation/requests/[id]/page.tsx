'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { vacationApi, VacationRequest } from '@/lib/api/vacation';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    DollarSign,
    FileText,
    User,
    XCircle,
    Loader2,
    AlertTriangle,
    Download
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { ReviewVacationDialog } from '@/components/vacation/ReviewVacationDialog';

export default function VacationRequestDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const { user } = useAuthStore();
    const [request, setRequest] = useState<VacationRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

    const requestId = params.id as string;

    const loadRequest = useCallback(async () => {
        try {
            setLoading(true);
            // In a real scenario we would have a specific getRequestById endpoint
            // For now, we'll iterate through my requests or pending to find it
            // Assuming we implement getById in API or filter locally
            const myRequests = await vacationApi.getMyRequests();
            const found = myRequests.find(r => r.id === requestId);

            if (found) {
                setRequest(found);
            } else {
                // If not found in my requests, try pending (if manager)
                // This is a workaround until we have a proper getById endpoint accessible
                try {
                    const pending = await vacationApi.getPendingRequests(0, 100);
                    const foundPending = pending.content.find(r => r.id === requestId);
                    if (foundPending) {
                        setRequest(foundPending);
                    } else {
                        throw new Error('Solicitação não encontrada');
                    }
                } catch (e) {
                    toast({
                        title: 'Erro',
                        description: 'Solicitação não encontrada ou acesso negado.',
                        variant: 'destructive',
                    });
                    router.push('/vacation');
                }
            }
        } catch (error) {
            console.error('Error loading request:', error);
            toast({
                title: 'Erro',
                description: 'Falha ao carregar detalhes da solicitação.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [requestId, router, toast]);

    useEffect(() => {
        if (requestId) {
            loadRequest();
        }
    }, [loadRequest, requestId]);

    const handleCancel = async () => {
        try {
            await vacationApi.cancelRequest(requestId);
            toast({
                title: 'Cancelado',
                description: 'Solicitação cancelada com sucesso.',
            });
            loadRequest();
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível cancelar a solicitação.',
                variant: 'destructive',
            });
        }
    };

    const handleReviewConfirm = async (id: string, notes: string, type: 'APPROVE' | 'REJECT') => {
        try {
            if (type === 'APPROVE') {
                await vacationApi.approveRequest(id, notes);
                toast({ title: 'Aprovado', description: 'Solicitação aprovada com sucesso.' });
            } else {
                await vacationApi.rejectRequest(id, notes);
                toast({ title: 'Rejeitado', description: 'Solicitação rejeitada.' });
            }
            loadRequest();
        } catch (error) {
            toast({ title: 'Erro', description: 'Falha ao processar a ação.', variant: 'destructive' });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
                <p className="text-sm text-gray-500">Carregando detalhes...</p>
            </div>
        );
    }

    if (!request) return null;

    const statusColors = {
        PENDING: 'bg-amber-100 text-amber-700',
        MANAGER_APPROVED: 'bg-blue-100 text-blue-700',
        APPROVED: 'bg-emerald-100 text-emerald-700',
        REJECTED: 'bg-red-100 text-red-700',
        CANCELLED: 'bg-gray-100 text-gray-700',
        SCHEDULED: 'bg-blue-100 text-blue-700',
        IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
        COMPLETED: 'bg-green-100 text-green-700',
    };

    const statusLabels: Record<string, string> = {
        PENDING: 'Pendente',
        MANAGER_APPROVED: 'Aprov. Gestor',
        APPROVED: 'Aprovada',
        REJECTED: 'Rejeitada',
        CANCELLED: 'Cancelada',
        SCHEDULED: 'Agendada',
        IN_PROGRESS: 'Em Andamento',
        COMPLETED: 'Concluída',
    };

    const roles = user?.roles || [];
    const isAdmin = roles.some(r => r.includes('ADMIN'));
    const isRH = roles.some(r => r.includes('RH') || r.includes('GESTOR_RH') || r.includes('ANALISTA_DP'));
    const isManager = roles.some(r => r.includes('GESTOR') || r.includes('LIDER') || r.includes('MANAGER'));

    const isApprover = isAdmin || isRH || isManager;
    const canApprove = (request.status === 'PENDING' && isApprover) ||
        (request.status === 'MANAGER_APPROVED' && (isAdmin || isRH));

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Detalhes da Solicitação</h1>
                    <p className="text-[var(--color-text-secondary)]">
                        ID: {request.id.slice(0, 8)}
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase", statusColors[request.status as keyof typeof statusColors])}>
                        {statusLabels[request.status] || request.statusLabel || request.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-[var(--color-primary)]" />
                                Período de Férias
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-xs text-gray-400 font-medium uppercase mb-1">Início</p>
                                    <p className="text-xl font-bold text-gray-900 capitalize">
                                        {format(new Date(request.startDate), 'dd MMM yyyy', { locale: ptBR })}
                                    </p>
                                    <p className="text-sm text-gray-500 capitalize">
                                        {format(new Date(request.startDate), 'EEEE', { locale: ptBR })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400 font-medium uppercase mb-1">Fim</p>
                                    <p className="text-xl font-bold text-gray-900 capitalize">
                                        {format(new Date(request.endDate), 'dd MMM yyyy', { locale: ptBR })}
                                    </p>
                                    <p className="text-sm text-gray-500 capitalize">
                                        {format(new Date(request.endDate), 'EEEE', { locale: ptBR })}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Duração Total</p>
                                    <p className="text-xs text-gray-500">Dias corridos solicitados</p>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-[var(--color-primary)]">{request.daysCount}</span>
                                    <span className="text-sm text-gray-400">dias</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-emerald-600" />
                                Financeiro
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={cn("h-4 w-4 rounded-full border-2", request.sellDays ? "bg-emerald-500 border-emerald-500" : "border-gray-300")} />
                                    <span className="text-sm font-medium text-gray-700">Abono Pecuniário (Venda de dias)</span>
                                </div>
                                {request.sellDays ? (
                                    <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">Sim, {request.soldDaysCount} dias</Badge>
                                ) : (
                                    <span className="text-sm text-gray-400">Não solicitado</span>
                                )}
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={cn("h-4 w-4 rounded-full border-2", request.advance13thSalary ? "bg-emerald-500 border-emerald-500" : "border-gray-300")} />
                                    <span className="text-sm font-medium text-gray-700">Adiantamento 1ª Parcela 13º</span>
                                </div>
                                {request.advance13thSalary ? (
                                    <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">Solicitado</Badge>
                                ) : (
                                    <span className="text-sm text-gray-400">Não solicitado</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {request.notes && (
                        <Card className="border-none shadow-sm bg-white">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-gray-500" />
                                    Observações
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg italic">
                                    "{request.notes}"
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <User className="h-5 w-5 text-gray-500" />
                                Colaborador
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-bold text-sm">
                                    {request.employeeName?.[0]}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">{request.employeeName}</p>
                                    <p className="text-xs text-gray-400">Solicitante</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Ações</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {request.status === 'APPROVED' && (
                                <>
                                    <Button variant="outline" className="w-full justify-start gap-2" disabled={!request.noticeDocumentUrl}>
                                        <Download className="h-4 w-4" />
                                        Aviso de Férias
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start gap-2" disabled={!request.receiptDocumentUrl}>
                                        <Download className="h-4 w-4" />
                                        Recibo de Férias
                                    </Button>
                                </>
                            )}

                            {canApprove && (
                                <Button
                                    className="w-full bg-[var(--color-primary)] hover:opacity-90"
                                    onClick={() => setReviewDialogOpen(true)}
                                >
                                    Avaliar Solicitação
                                </Button>
                            )}

                            {request.canCancel && request.status === 'PENDING' && (
                                <Button
                                    variant="danger"
                                    className="w-full"
                                    onClick={handleCancel}
                                >
                                    Cancelar Solicitação
                                </Button>
                            )}

                            {!canApprove && !request.canCancel && request.status === 'PENDING' && (
                                <p className="text-xs text-center text-gray-400">
                                    Aguardando aprovação do gestor.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {request.status !== 'PENDING' && (
                        <Card className="border-none shadow-sm bg-gray-50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">Histórico</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm">
                                <p className="mb-1"><span className="font-bold">Solicitado em:</span> {format(new Date(request.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                                {request.approvedAt && (
                                    <>
                                        <p className="mb-1"><span className="font-bold">Avaliado em:</span> {format(new Date(request.approvedAt), 'dd/MM/yyyy HH:mm')}</p>
                                        <p className="mb-1"><span className="font-bold">Por:</span> {request.approverName || 'Sistema'}</p>
                                    </>
                                )}
                                {request.rejectionReason && (
                                    <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-xs">
                                        <p className="font-bold mb-1">Motivo da Rejeição:</p>
                                        {request.rejectionReason}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <ReviewVacationDialog
                request={request}
                open={reviewDialogOpen}
                onOpenChange={setReviewDialogOpen}
                onConfirm={handleReviewConfirm}
            />
        </div>
    );
}
