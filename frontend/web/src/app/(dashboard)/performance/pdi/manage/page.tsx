'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ArrowLeft,
    Send,
    Users,
    TrendingUp,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
    Search,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { pdisApi, PDI } from '@/lib/api/performance';
import { employeesApi, Employee } from '@/lib/api/employees';

export default function ManagePDIPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [pdis, setPdis] = useState<PDI[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sendDialogOpen, setSendDialogOpen] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [objectives, setObjectives] = useState('');
    const [focusAreas, setFocusAreas] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sending, setSending] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [employeesRes, pdisRes] = await Promise.all([
                employeesApi.list({ status: 'ACTIVE', size: 1000 }),
                pdisApi.list(0, 100),
            ]);
            setEmployees(employeesRes.content);
            setPdis(pdisRes.content);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast({
                title: 'Erro',
                description: 'Falha ao carregar dados',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSend = async () => {
        if (selectedEmployees.length === 0) {
            toast({
                title: 'Atenção',
                description: 'Selecione pelo menos um colaborador',
                variant: 'destructive',
            });
            return;
        }

        if (!title || !endDate) {
            toast({
                title: 'Atenção',
                description: 'Preencha todos os campos obrigatórios',
                variant: 'destructive',
            });
            return;
        }

        try {
            setSending(true);

            // Enviar PDI para cada colaborador selecionado
            await Promise.all(
                selectedEmployees.map(async (employeeId) => {
                    const employee = employees.find((e) => e.id === employeeId);
                    if (!employee) return;

                    await pdisApi.create({
                        employeeId,
                        employeeName: employee.fullName,
                        managerId: employee.manager?.id,
                        managerName: employee.manager?.name || employee.manager?.fullName,
                        title,
                        description,
                        objectives,
                        focusAreas,
                        endDate,
                        status: 'DRAFT',
                    });
                })
            );

            toast({
                title: 'Sucesso',
                description: `PDI enviado para ${selectedEmployees.length} colaborador(es)`,
            });

            // Reset form
            setSelectedEmployees([]);
            setTitle('');
            setDescription('');
            setObjectives('');
            setFocusAreas('');
            setEndDate('');
            setSendDialogOpen(false);
            loadData();
        } catch (error) {
            console.error('Failed to send PDI:', error);
            toast({
                title: 'Erro',
                description: 'Falha ao enviar PDI',
                variant: 'destructive',
            });
        } finally {
            setSending(false);
        }
    };

    const filteredEmployees = employees.filter((emp) =>
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleEmployee = (employeeId: string) => {
        setSelectedEmployees((prev) =>
            prev.includes(employeeId)
                ? prev.filter((id) => id !== employeeId)
                : [...prev, employeeId]
        );
    };

    const selectAll = () => {
        setSelectedEmployees(filteredEmployees.map((e) => e.id));
    };

    const clearSelection = () => {
        setSelectedEmployees([]);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const stats = {
        total: pdis.length,
        active: pdis.filter((p) => p.status === 'ACTIVE').length,
        pending: pdis.filter((p) => p.status === 'PENDING_APPROVAL').length,
        completed: pdis.filter((p) => p.status === 'COMPLETED').length,
    };

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
                    <h1 className="text-3xl font-black tracking-tight">Gerenciar PDIs</h1>
                    <p className="text-muted-foreground">
                        Envie e acompanhe Planos de Desenvolvimento Individual
                    </p>
                </div>
                <Button onClick={() => setSendDialogOpen(true)} className="font-bold shadow-lg shadow-primary/20">
                    <Send className="h-4 w-4 mr-2" />
                    Enviar PDI
                </Button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Total de PDIs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{stats.total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Ativos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-green-500">{stats.active}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            Aguardando Aprovação
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-amber-500">{stats.pending}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-blue-500" />
                            Concluídos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-blue-500">{stats.completed}</div>
                    </CardContent>
                </Card>
            </div>

            {/* PDI List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        PDIs Enviados
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {pdis.length === 0 ? (
                        <div className="text-center py-12">
                            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">Nenhum PDI enviado ainda</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pdis.map((pdi) => (
                                <Link key={pdi.id} href={`/performance/pdi/${pdi.id}`}>
                                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <TrendingUp className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-bold">{pdi.title}</p>
                                                <p className="text-sm text-muted-foreground">{pdi.employeeName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant={pdi.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                                {pdi.status === 'ACTIVE' ? 'Ativo' : pdi.status === 'COMPLETED' ? 'Concluído' : 'Rascunho'}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                                {pdi.overallProgress}%
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Send PDI Dialog */}
            <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Enviar PDI para Colaboradores</DialogTitle>
                        <DialogDescription>
                            Selecione os colaboradores e preencha as informações do PDI
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Employee Selection */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Colaboradores ({selectedEmployees.length} selecionados)</Label>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={selectAll}>
                                        Selecionar Todos
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={clearSelection}>
                                        Limpar
                                    </Button>
                                </div>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar colaboradores..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            <div className="border rounded-lg max-h-60 overflow-y-auto">
                                {filteredEmployees.map((employee) => (
                                    <div
                                        key={employee.id}
                                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${selectedEmployees.includes(employee.id) ? 'bg-primary/5' : ''
                                            }`}
                                        onClick={() => toggleEmployee(employee.id)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedEmployees.includes(employee.id)}
                                            onChange={() => { }}
                                            className="h-4 w-4"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium">{employee.fullName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {employee.position?.title || employee.position?.name} • {employee.department?.name}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* PDI Form */}
                        <div className="space-y-4 border-t pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Título do PDI *</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ex: Desenvolvimento em Liderança"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Descreva o objetivo geral do PDI..."
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="objectives">Objetivos</Label>
                                <Textarea
                                    id="objectives"
                                    value={objectives}
                                    onChange={(e) => setObjectives(e.target.value)}
                                    placeholder="Liste os objetivos específicos..."
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="focusAreas">Áreas de Foco</Label>
                                <Input
                                    id="focusAreas"
                                    value={focusAreas}
                                    onChange={(e) => setFocusAreas(e.target.value)}
                                    placeholder="Ex: Comunicação, Gestão de Projetos"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endDate">Data Limite *</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSend} disabled={sending || selectedEmployees.length === 0 || !title || !endDate}>
                            {sending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Enviar PDI
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
