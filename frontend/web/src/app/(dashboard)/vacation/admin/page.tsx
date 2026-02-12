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
import {
    AlertTriangle,
    ArrowLeft,
    Bell,
    Loader2,
    Search,
    RefreshCw,
    UserCircle2,
    CheckCircle2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { vacationApi, VacationPeriod } from '@/lib/api/vacation';
import { cn } from '@/lib/utils';

export default function VacationAdminPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [expiringPeriods, setExpiringPeriods] = useState<VacationPeriod[]>([]);
    const [filter, setFilter] = useState('');

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await vacationApi.getExpiringPeriods(60);
            setExpiringPeriods(data);
        } catch (error) {
            console.error('Error loading admin data:', error);
            toast({
                title: 'Erro',
                description: 'Falha ao carregar dados administrativos.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleNotify = async (period: VacationPeriod) => {
        try {
            await vacationApi.notifyExpiration(period.id);
            toast({
                title: 'Notificação Enviada',
                description: `Lembrete enviado para ${period.employeeName || 'o colaborador'}.`,
            });
        } catch (error) {
            console.error('Error sending notification:', error);
            toast({
                title: 'Erro',
                description: 'Falha ao enviar notificação.',
                variant: 'destructive',
            });
        }
    };

    const handleSync = async () => {
        try {
            setSyncing(true);
            await vacationApi.syncPeriods();
            toast({
                title: 'Sincronização Concluída',
                description: 'Períodos aquisitivos atualizados com sucesso.',
            });
            loadData();
        } catch (err) {
            toast({
                title: 'Erro na Sincronização',
                description: 'Não foi possível sincronizar os dados.',
                variant: 'destructive'
            });
        } finally {
            setSyncing(false);
        }
    };

    const filteredPeriods = expiringPeriods.filter(p =>
        p.employeeName?.toLowerCase().includes(filter.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
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
                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Monitoramento de Prazos</h1>
                        <p className="text-[var(--color-text-secondary)]">
                            Colaboradores com períodos vencendo nos próximos 60 dias.
                        </p>
                    </div>
                </div>

                <Button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                    <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
                    Sincronizar Dados
                </Button>
            </div>

            {/* Main Content */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="pb-4 bg-gray-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                Períodos em Risco
                            </CardTitle>
                            <CardDescription>
                                {filteredPeriods.length} período(s) requerem atenção.
                            </CardDescription>
                        </div>

                        <div className="relative min-w-[280px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar colaborador..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="h-10 pl-10 pr-4 rounded-lg border-gray-200 bg-white text-sm"
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
                            <p className="text-sm text-gray-500">Analisando prazos...</p>
                        </div>
                    ) : filteredPeriods.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                            <div className="h-14 w-14 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Operação Segura</h3>
                                <p className="text-sm text-gray-400 max-w-sm">Nenhum período exige atenção imediata no momento.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="border-b border-gray-100">
                                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-6">Colaborador</TableHead>
                                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fim Aquisitivo</TableHead>
                                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-red-600">Limite Crítico</TableHead>
                                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Saldo</TableHead>
                                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right px-6">Ação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPeriods.map((period) => (
                                        <TableRow key={period.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50">
                                            <TableCell className="px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                                        <UserCircle2 className="h-5 w-5" />
                                                    </div>
                                                    <p className="font-bold text-gray-900 text-sm">{period.employeeName}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-gray-600 text-sm">
                                                {formatDate(period.acquisitionEndDate)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-red-50 border border-red-100">
                                                    <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                                                    <span className="font-bold text-red-600 tabular-nums text-sm">{formatDate(period.concessionEndDate)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-gray-900 tabular-nums">
                                                {period.remainingDays}d
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                <div className="flex items-center justify-end gap-3">
                                                    {period.isExpired ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-800">Expirado</span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700">
                                                            {period.daysUntilExpiration} dias restantes
                                                        </span>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleNotify(period)}
                                                        className="rounded-lg h-9 border-gray-200 hover:bg-gray-50 transition-all"
                                                    >
                                                        <Bell className="mr-2 h-3.5 w-3.5" />
                                                        Notificar
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
