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
    Calendar,
    Search,
    RefreshCw,
    ShieldAlert,
    UserCircle2,
    CheckCircle2,
    Zap
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
            const data = await vacationApi.getExpiringPeriods(60); // 60 days threshold
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
        <div className="container max-w-7xl py-10 space-y-10 animate-in fade-in duration-700">
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
                            <ShieldAlert className="h-5 w-5 text-rose-500" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Painel de Controle RH</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">Monitoramento de <span className="text-rose-500 italic">Prazos</span></h1>
                    </div>
                </div>

                <Button
                    onClick={handleSync}
                    disabled={syncing}
                    size="xl"
                    className="rounded-xl shadow-lg shadow-primary/10 bg-slate-900 hover:bg-slate-800 text-white border-0 h-14 px-8 group"
                >
                    <RefreshCw className={cn("mr-3 h-4 w-4 transition-transform group-hover:rotate-180 duration-500", syncing && "animate-spin")} />
                    Sincronizar Dados
                </Button>
            </div>

            {/* Main Content */}
            <Card className="border border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
                <CardHeader className="p-8 pb-6 bg-slate-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-black text-slate-900 uppercase flex items-center gap-3">
                                <Zap className="h-5 w-5 text-amber-500" />
                                Períodos em Risco
                            </CardTitle>
                            <CardDescription className="font-medium text-slate-500">
                                Colaboradores com períodos vencendo nos próximos <span className="text-rose-600 font-black">60 dias</span>.
                            </CardDescription>
                        </div>

                        <div className="relative group min-w-[320px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Buscar colaborador..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="h-12 pl-12 pr-4 rounded-xl border-slate-200 bg-white focus:ring-primary/20 transition-all text-sm font-medium"
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Analisando prazos...</p>
                        </div>
                    ) : filteredPeriods.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
                            <div className="h-20 w-20 rounded-2xl bg-emerald-50 flex items-center justify-center">
                                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-black text-slate-900">Operação Segura</h3>
                                <p className="text-slate-400 font-medium max-w-sm">Nenhum período exige atenção imediata no momento.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/80 h-16">
                                    <TableRow className="border-none">
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest px-10">Colaborador</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest">Fim Aquisitivo</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-rose-600">Limite Crítico</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Saldo</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-right px-10">Status & Ação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPeriods.map((period) => (
                                        <TableRow key={period.id} className="h-24 hover:bg-slate-50/50 transition-colors border-none group">
                                            <TableCell className="px-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                        <UserCircle2 className="h-7 w-7" />
                                                    </div>
                                                    <p className="font-black text-slate-900 text-base">{period.employeeName}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold text-slate-600">
                                                {formatDate(period.acquisitionEndDate)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-100">
                                                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                                                    <span className="font-black text-rose-600 tabular-nums">{formatDate(period.concessionEndDate)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-black text-slate-900 tabular-nums text-lg">
                                                {period.remainingDays}d
                                            </TableCell>
                                            <TableCell className="text-right px-10">
                                                <div className="flex items-center justify-end gap-4">
                                                    {period.isExpired ? (
                                                        <Badge variant="destructive" className="h-8 rounded-lg px-3 font-black text-[10px] uppercase tracking-wider">Expirado</Badge>
                                                    ) : (
                                                        <Badge className="h-8 rounded-lg px-3 font-black text-[10px] uppercase tracking-wider bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">
                                                            {period.daysUntilExpiration} dias restantes
                                                        </Badge>
                                                    )}
                                                    <Button
                                                        size="lg"
                                                        variant="outline"
                                                        onClick={() => handleNotify(period)}
                                                        className="rounded-xl h-11 border-slate-200 hover:bg-slate-900 hover:text-white transition-all group/btn"
                                                    >
                                                        <Bell className="mr-2 h-4 w-4 transition-transform group-hover/btn:rotate-12" />
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

