'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft,
    Search,
    CheckCircle2,
    Clock,
    Users,
    Calendar,
    ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { evaluationsApi, Evaluation } from '@/lib/api/performance';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';

export default function EvaluationsListPage() {
    const [pendingEvaluations, setPendingEvaluations] = useState<Evaluation[]>([]);
    const [historyEvaluations, setHistoryEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const { user } = useAuthStore();
    const currentUserId = user?.id || '';

    useEffect(() => {
        loadEvaluations();
    }, []);

    const loadEvaluations = async () => {
        if (!currentUserId) {
            console.warn('User ID not available, skipping evaluations load');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            // Fetch pending
            const pending = await evaluationsApi.getPending(currentUserId);
            setPendingEvaluations(pending);

            // Fetch history (using getByEmployee or similar, filtering for completed)
            // Since there isn't a dedicated getHistory, we fetch by employee and filter
            const allMyEvaluations = await evaluationsApi.getByEmployee(currentUserId);
            setHistoryEvaluations(allMyEvaluations.filter(e =>
                e.status === 'COMPLETED' || e.status === 'SUBMITTED' || e.status === 'CALIBRATED'
            ));

        } catch (error: unknown) {
            console.error('Erro ao carregar avaliacoes:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
            PENDING: { label: 'Pendente', variant: 'secondary' },
            IN_PROGRESS: { label: 'Em Andamento', variant: 'default' },
            SUBMITTED: { label: 'Submetida', variant: 'outline' },
            CALIBRATED: { label: 'Calibrada', variant: 'outline' },
            COMPLETED: { label: 'Concluida', variant: 'outline' },
            CANCELLED: { label: 'Cancelada', variant: 'destructive' },
        };
        const c = config[status] || { label: status, variant: 'secondary' };
        return <Badge variant={c.variant}>{c.label}</Badge>;
    };

    const filteredPending = pendingEvaluations.filter(e =>
        e.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.cycleName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredHistory = historyEvaluations.filter(e =>
        e.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.cycleName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/performance">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">Avaliacoes</h1>
                    <p className="text-muted-foreground">
                        Gerencie suas avaliacoes e historico
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nome ou ciclo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            <Tabs defaultValue="pending">
                <TabsList>
                    <TabsTrigger value="pending">
                        Pendentes ({pendingEvaluations.length})
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        Historico ({historyEvaluations.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Avaliacoes a Realizar</CardTitle>
                            <CardDescription>
                                Avaliacoes que precisam da sua atencao
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {filteredPending.length === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                                    <p className="text-muted-foreground">Voce nao tem avaliacoes pendentes!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredPending.map((evaluation) => (
                                        <Link key={evaluation.id} href={`/performance/evaluations/${evaluation.id}`}>
                                            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Users className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium">{evaluation.employeeName}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {evaluation.evaluatorType === 'SELF' ? 'Autoavaliacao' :
                                                                evaluation.evaluatorType === 'MANAGER' ? 'Avaliacao de Gestor' :
                                                                    evaluation.evaluatorType === 'PEER' ? 'Avaliacao de Pares' :
                                                                        'Avaliacao 360'}
                                                            {evaluation.cycleName && ` • ${evaluation.cycleName}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {evaluation.dueDate && (
                                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                            <Clock className="h-4 w-4" />
                                                            {new Date(evaluation.dueDate).toLocaleDateString('pt-BR')}
                                                        </div>
                                                    )}
                                                    {getStatusBadge(evaluation.status)}
                                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historico de Avaliacoes</CardTitle>
                            <CardDescription>
                                Avaliacoes concluidas e submetidas
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {filteredHistory.length === 0 ? (
                                <div className="text-center py-12">
                                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">Nenhuma avaliacao no historico</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredHistory.map((evaluation) => (
                                        <Link key={evaluation.id} href={`/performance/evaluations/${evaluation.id}`}>
                                            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                                                        <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium">{evaluation.employeeName}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {evaluation.evaluatorType === 'SELF' ? 'Autoavaliacao' :
                                                                evaluation.evaluatorType === 'MANAGER' ? 'Avaliacao de Gestor' :
                                                                    'Avaliacao'}
                                                            {evaluation.cycleName && ` • ${evaluation.cycleName}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {evaluation.submittedAt && (
                                                        <div className="text-sm text-muted-foreground">
                                                            Concluido em: {new Date(evaluation.submittedAt).toLocaleDateString('pt-BR')}
                                                        </div>
                                                    )}
                                                    {getStatusBadge(evaluation.status)}
                                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
