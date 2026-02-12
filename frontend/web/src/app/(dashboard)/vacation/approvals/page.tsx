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
import { ArrowLeft, Calendar, Loader2, CheckCircle2, XCircle, Clock, ShieldCheck, UserCheck, Search, Filter } from 'lucide-react';
import { vacationApi, VacationRequest } from '@/lib/api/vacation';
import { ReviewVacationDialog } from '@/components/vacation/ReviewVacationDialog';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export default function VacationApprovalsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<VacationRequest[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<VacationRequest | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

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
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const filteredRequests = requests.filter(r =>
        r.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container max-w-6xl py-10 space-y-10 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.back()}
                        className="h-12 w-12 rounded-full border-slate-100 bg-white shadow-sm hover:shadow-md transition-all"
                    >
                        <ArrowLeft className="h-6 w-6 text-slate-600" />
                    </Button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Gestão de Equipe</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">Aprovações <span className="text-primary italic">Pendentes</span></h1>
                    </div>
                </div>

                <div className="relative group min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Buscar colaborador..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-12 pl-12 pr-4 rounded-xl border-slate-100 bg-white shadow-sm focus:ring-primary/20 transition-all text-sm font-medium"
                    />
                </div>
            </div>

            {/* List Section */}
            <Card className="border border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
                <CardHeader className="p-8 pb-0">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-black text-slate-900 uppercase">Solicitações Aguardando Ação</CardTitle>
                            <CardDescription className="font-medium">
                                Você tem <span className="text-primary font-bold">{requests.length}</span> pedido(s) aguardando sua revisão profissional.
                            </CardDescription>
                        </div>
                        <div className="hidden md:flex p-2 bg-slate-50 rounded-xl">
                            <Filter className="h-5 w-5 text-slate-400" />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Carregando solicitações...</p>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                            <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center">
                                <UserCheck className="h-10 w-10 text-slate-200" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-black text-slate-900">Tudo em dia!</h3>
                                <p className="text-slate-400 font-medium max-w-sm">Não encontramos solicitações pendentes {searchTerm ? 'para esta busca' : 'no momento'}.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-slate-50 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50/50 h-16">
                                    <TableRow className="border-none">
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest px-8">Colaborador</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest">Período Solicitado</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Dias</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-right px-8">Ação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRequests.map((request) => (
                                        <TableRow key={request.id} className="h-24 hover:bg-slate-50/30 transition-colors border-none group">
                                            <TableCell className="px-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                                                        {request.employeeName?.[0]}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="font-black text-slate-900 leading-none">{request.employeeName}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Solicitado em {new Date(request.createdAt).toLocaleDateString('pt-BR')}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 font-bold text-slate-700">
                                                        <Calendar className="h-4 w-4 text-primary" />
                                                        {formatDate(request.startDate)} — {formatDate(request.endDate)}
                                                    </div>
                                                    {request.sellDays && (
                                                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 text-[9px] font-black uppercase tracking-widest rounded-lg">
                                                            + {request.soldDaysCount} dias de abono
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="text-lg font-black text-slate-900 leading-none">{request.daysCount}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">DIAS</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-8">
                                                <Button
                                                    onClick={() => handleReview(request)}
                                                    size="lg"
                                                    className="rounded-xl h-12 px-6 font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/10 transition-transform active:scale-95"
                                                >
                                                    Revisar
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
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

