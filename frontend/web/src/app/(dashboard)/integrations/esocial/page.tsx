'use client';

import { useState, useEffect } from 'react';
import {
    ShieldCheck,
    ArrowLeft,
    Search,
    Filter,
    Calendar,
    CheckCircle2,
    Clock,
    XCircle,
    AlertTriangle,
    Send,
    Eye
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { esocialApi, ESocialEvent } from '@/lib/api/integration';

export default function ESocialPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<ESocialEvent[]>([]);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const data = await esocialApi.listEvents();
            setEvents(data.content);
        } catch (error) {
            console.error('Erro ao carregar eventos:', error);
            // Mock data
            setEvents([
                {
                    id: '1',
                    eventType: 'S_2200',
                    status: 'PROCESSED',
                    employeeName: 'Jaime Vicente',
                    createdAt: new Date().toISOString(),
                    transmittedAt: new Date().toISOString(),
                    receiptNumber: '1.2.202602131206',
                    retryCount: 0
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const getStatusBadge = (status: ESocialEvent['status']) => {
        const configs = {
            PROCESSED: { label: 'Processado', icon: CheckCircle2, class: 'bg-emerald-100 text-emerald-700' },
            PENDING: { label: 'Pendente', icon: Clock, class: 'bg-yellow-100 text-yellow-700' },
            ERROR: { label: 'Erro', icon: XCircle, class: 'bg-red-100 text-red-700' },
            TRANSMITTED: { label: 'Transmitido', icon: Send, class: 'bg-blue-100 text-blue-700' },
        };
        const config = (configs as any)[status] || { label: status, icon: AlertTriangle, class: 'bg-gray-100 text-gray-700' };

        return (
            <Badge className={`${config.class} border-none flex items-center gap-1`}>
                <config.icon className="w-3 h-3" />
                {config.label}
            </Badge>
        );
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <button
                        onClick={() => router.push('/integrations')}
                        className="flex items-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors mb-2"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para o Hub
                    </button>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">eSocial Sync</h1>
                    <p className="text-[var(--color-text-secondary)]">
                        Transmissão e acompanhamento de obrigações legais.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Calendar className="w-4 h-4" /> Calendário
                    </Button>
                    <Button className="bg-[var(--color-primary)] gap-2">
                        <Send className="w-4 h-4" /> Transmitir Lote
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-white p-4 space-y-2">
                    <p className="text-xs text-gray-500 font-bold uppercase">Total</p>
                    <p className="text-2xl font-bold">156</p>
                </Card>
                <Card className="border-none shadow-sm bg-white p-4 space-y-2">
                    <p className="text-xs text-emerald-600 font-bold uppercase text-emerald-600">Sucesso</p>
                    <p className="text-2xl font-bold text-emerald-700">148</p>
                </Card>
                <Card className="border-none shadow-sm bg-white p-4 space-y-2">
                    <p className="text-xs text-yellow-600 font-bold uppercase text-yellow-600">Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-700">5</p>
                </Card>
                <Card className="border-none shadow-sm bg-white p-4 space-y-2">
                    <p className="text-xs text-red-600 font-bold uppercase text-red-600">Com Erro</p>
                    <p className="text-2xl font-bold text-red-700">3</p>
                </Card>
            </div>

            <Card className="border-none shadow-sm pb-10">
                <CardHeader className="bg-white border-b flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Eventos Recentes</CardTitle>
                        <CardDescription>Lista dos últimos eventos gerados pelo sistema.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                                    <th className="px-6 py-4">Evento</th>
                                    <th className="px-6 py-4">Colaborador</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Recibo / Protocolo</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {events.map((event) => (
                                    <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className="font-mono text-[10px]">{event.eventType}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium">{event.employeeName || 'SISTEMA'}</td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(event.status)}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-gray-500">
                                            {event.receiptNumber || event.protocolNumber || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
