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
    Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { vacationApi, VacationPeriod } from '@/lib/api/vacation';

export default function VacationAdminPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
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

    const filteredPeriods = expiringPeriods.filter(p =>
        p.employeeName?.toLowerCase().includes(filter.toLowerCase())
    );

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
                    <h1 className="text-3xl font-bold tracking-tight">Administração de Férias</h1>
                    <p className="text-muted-foreground">Painel de controle do RH</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-3">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                    Férias a Vencer
                                </CardTitle>
                                <CardDescription>
                                    Colaboradores com períodos vencendo nos próximos 60 dias
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 mb-4">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar colaborador..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="max-w-sm"
                            />
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredPeriods.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Nenhum período próximo do vencimento.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Colaborador</TableHead>
                                        <TableHead>Fim do Período</TableHead>
                                        <TableHead>Limite Concessivo</TableHead>
                                        <TableHead>Restantes</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPeriods.map((period) => (
                                        <TableRow key={period.id}>
                                            <TableCell className="font-medium">{period.employeeName}</TableCell>
                                            <TableCell>{formatDate(period.acquisitionEndDate)}</TableCell>
                                            <TableCell className="font-bold text-red-600">
                                                {formatDate(period.concessionEndDate)}
                                            </TableCell>
                                            <TableCell>{period.remainingDays} dias</TableCell>
                                            <TableCell>
                                                {period.isExpired ? (
                                                    <Badge variant="destructive">Vencido</Badge>
                                                ) : (
                                                    <Badge variant="warning">Vence em {period.daysUntilExpiration} dias</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleNotify(period)}
                                                >
                                                    <Bell className="mr-2 h-4 w-4" />
                                                    Notificar
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
