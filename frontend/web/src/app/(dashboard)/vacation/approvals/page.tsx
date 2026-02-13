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
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, Loader2, UserCheck, Search, FileSignature, Users } from 'lucide-react';
import { vacationApi, VacationRequest } from '@/lib/api/vacation';
import { ReviewVacationDialog } from '@/components/vacation/ReviewVacationDialog';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/stores/auth-store';
import { Badge } from '@/components/ui/badge';

export default function VacationApprovalsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [teamRequests, setTeamRequests] = useState<VacationRequest[]>([]);
    const [rhRequests, setRhRequests] = useState<VacationRequest[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<VacationRequest | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [activeTab, setActiveTab] = useState('team');

    const roles = user?.roles || [];
    const isRH = roles.some(r => r.includes('RH') || r.includes('ADMIN') || r.includes('GESTOR_RH') || r.includes('ANALISTA_DP'));

    const loadRequests = useCallback(async () => {
        try {
            setLoading(true);

            // Carregar pendências da equipe (Gestor)
            const teamResponse = await vacationApi.getPendingRequests(0, 50);
            setTeamRequests(teamResponse.content);

            // Se for RH, carregar pendências finais (Manager Approved)
            if (isRH) {
                const rhResponse = await vacationApi.getPendingRequestsRH(0, 50);
                setRhRequests(rhResponse.content);
            }

        } catch (error) {
            console.error('Failed to load pending requests:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar as solicitações.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [isRH, toast]);

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
                    description: 'Solicitação aprovada com sucesso!',
                });
            } else {
                await vacationApi.rejectRequest(requestId, notes);
                toast({
                    title: 'Rejeitada',
                    description: 'Solicitação rejeitada.',
                });
            }
            loadRequests();
        } catch (error) {
            console.error('Error reviewing request:', error);
            toast({
                title: 'Erro',
                description: 'Falha ao processar a solicitação.',
                variant: 'destructive',
            });
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const currentList = activeTab === 'team' ? teamRequests : rhRequests;

    const filteredRequests = currentList.filter(r =>
        r.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const RequestList = ({ requests, type }: { requests: VacationRequest[], type: 'team' | 'rh' }) => {
        if (requests.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                    <div className="h-14 w-14 rounded-xl bg-gray-100 flex items-center justify-center">
                        <UserCheck className="h-7 w-7 text-gray-300" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900">Tudo em dia!</h3>
                        <p className="text-sm text-gray-400 max-w-sm">
                            Não há solicitações {type === 'team' ? 'da sua equipe' : 'para aprovação final'} pendentes.
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow className="border-b border-gray-100">
                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-6">Colaborador</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Período</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Dias</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right px-6">Ação</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.map((request) => (
                            <TableRow key={request.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50">
                                <TableCell className="px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-bold text-sm">
                                            {request.employeeName?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{request.employeeName}</p>
                                            <p className="text-xs text-gray-400">Solicitado em {new Date(request.createdAt).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="text-xs font-medium">
                                        {type === 'team' ? 'Aguardando Gestor' : 'Aguardando RH'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 font-medium text-gray-700 text-sm">
                                            <Calendar className="h-4 w-4 text-[var(--color-primary)]" />
                                            {formatDate(request.startDate)} — {formatDate(request.endDate)}
                                        </div>
                                        {request.sellDays && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                                + {request.soldDaysCount} dias abono
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="inline-flex flex-col items-center">
                                        <span className="text-base font-bold text-gray-900 tabular-nums">{request.daysCount}</span>
                                        <span className="text-[10px] text-gray-400">dias</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right px-6">
                                    <Button
                                        onClick={() => handleReview(request)}
                                        size="sm"
                                        className="rounded-lg h-9 px-4 font-bold text-sm bg-[var(--color-primary)] hover:opacity-90 transition-opacity"
                                    >
                                        {type === 'team' ? 'Aprovar (Gestor)' : 'Finalizar (RH)'}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Aprovações Pendentes</h1>
                        <p className="text-[var(--color-text-secondary)]">
                            Gerencie o fluxo de aprovação de férias.
                        </p>
                    </div>
                </div>

                <div className="relative min-w-[280px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar colaborador..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-10 pl-10 pr-4 rounded-lg border-gray-200 bg-white text-sm"
                    />
                </div>
            </div>

            <Tabs defaultValue="team" value={activeTab} onValueChange={setActiveTab} className="w-full">
                {isRH && (
                    <TabsList className="grid w-full grid-cols-2 mb-6 max-w-[400px]">
                        <TabsTrigger value="team" className="flex gap-2">
                            <Users className="h-4 w-4" /> Minha Equipe
                            {teamRequests.length > 0 && <span className="ml-1 bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full text-[10px]">{teamRequests.length}</span>}
                        </TabsTrigger>
                        <TabsTrigger value="rh" className="flex gap-2">
                            <FileSignature className="h-4 w-4" /> Aprovação Final (RH)
                            {rhRequests.length > 0 && <span className="ml-1 bg-[var(--color-primary)] text-white px-1.5 py-0.5 rounded-full text-[10px]">{rhRequests.length}</span>}
                        </TabsTrigger>
                    </TabsList>
                )}

                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold">
                                    {activeTab === 'team' ? 'Aprovação de Gestor' : 'Aprovação Final (RH)'}
                                </CardTitle>
                                <CardDescription>
                                    Listando solicitações aguardando sua ação.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
                                <p className="text-sm text-gray-500">Carregando solicitações...</p>
                            </div>
                        ) : (
                            <RequestList requests={filteredRequests} type={activeTab as 'team' | 'rh'} />
                        )}
                    </CardContent>
                </Card>
            </Tabs>

            <ReviewVacationDialog
                request={selectedRequest}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onConfirm={onConfirmReview}
            />
        </div>
    );
}
