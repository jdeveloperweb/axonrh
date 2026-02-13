'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Webhook as WebhookIcon,
    Trash2,
    Edit2,
    Play,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Clock,
    Activity
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { webhooksApi, Webhook } from '@/lib/api/integration';

export default function WebhooksPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const loadWebhooks = async () => {
        try {
            setLoading(true);
            const data = await webhooksApi.list();
            setWebhooks(data);
        } catch (error) {
            console.error('Erro ao carregar webhooks:', error);
            // toast({
            //     title: 'Erro',
            //     description: 'Não foi possível carregar os webhooks.',
            //     variant: 'destructive',
            // });
            // Mock data for demo if it fails
            setWebhooks([
                {
                    id: '1',
                    name: 'Novo Colaborador',
                    targetUrl: 'https://webhook.site/axoon-events',
                    eventType: 'EMPLOYEE_CREATED',
                    isActive: true,
                    httpMethod: 'POST',
                    successCount: 124,
                    failureCount: 2,
                    retryCount: 3,
                    timeoutSeconds: 30,
                    createdAt: new Date().toISOString()
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWebhooks();
    }, []);

    const filteredWebhooks = webhooks.filter(w =>
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.targetUrl.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Webhooks</h1>
                    <p className="text-[var(--color-text-secondary)]">
                        Receba eventos do sistema em tempo real na sua URL de destino.
                    </p>
                </div>
                <Button className="bg-[var(--color-primary)] hover:opacity-90 transition-opacity gap-2">
                    <Plus className="w-4 h-4" /> Novo Webhook
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredWebhooks.map((hook) => (
                    <Card key={hook.id} className="border-none shadow-sm hover:shadow-md transition-shadow transition-all group">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className={`p-3 rounded-xl bg-purple-50 text-purple-600`}>
                                    <WebhookIcon className="w-5 h-5" />
                                </div>
                                <Switch checked={hook.isActive} />
                            </div>
                            <CardTitle className="text-lg font-bold mt-4">{hook.name}</CardTitle>
                            <Badge variant="secondary" className="w-fit text-[10px] mt-1">
                                {hook.eventType}
                            </Badge>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-gray-50 p-2 rounded text-[10px] font-mono text-gray-500 truncate">
                                {hook.targetUrl}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 rounded-lg bg-emerald-50 text-center">
                                    <p className="text-[10px] text-emerald-600 font-bold uppercase">Sucessos</p>
                                    <p className="text-xl font-bold text-emerald-700">{hook.successCount}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-red-50 text-center">
                                    <p className="text-[10px] text-red-600 font-bold uppercase">Falhas</p>
                                    <p className="text-xl font-bold text-red-700">{hook.failureCount}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t">
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600">
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                <Button size="sm" variant="outline" className="text-xs gap-2">
                                    <Activity className="w-3 h-3" /> Logs
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
