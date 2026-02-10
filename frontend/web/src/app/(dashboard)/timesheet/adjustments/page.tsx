'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { useAuthStore } from '@/stores/auth-store';
import {
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Eye,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Calendar,
  Timer,
  FileEdit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { timesheetApi, TimeAdjustment, TimeAdjustmentRequest, TimeRecord } from '@/lib/api/timesheet';
import { toast } from 'sonner';

function AdjustmentsPageContent() {
  const searchParams = useSearchParams();
  const { confirm } = useConfirm();
  const user = useAuthStore((state) => state.user);

  // Role based access: Admins, HR, Managers can approve
  const canApprove = user?.roles?.some(role =>
    ['ADMIN', 'RH', 'GESTOR_RH', 'ANALISTA_DP'].includes(role)
  ) ?? false;

  const [loading, setLoading] = useState(true);
  const [myAdjustments, setMyAdjustments] = useState<TimeAdjustment[]>([]);
  const [pendingAdjustments, setPendingAdjustments] = useState<TimeAdjustment[]>([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<TimeAdjustment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [activeTab, setActiveTab] = useState('my');

  // New adjustment form
  const [newAdjustment, setNewAdjustment] = useState<Partial<TimeAdjustmentRequest>>({
    adjustmentType: 'ADD',
    recordType: 'ENTRY',
    recordDate: new Date().toISOString().split('T')[0],
    requestedTime: '',
    justification: '',
  });

  const [dayRecords, setDayRecords] = useState<TimeRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Fetch records when date changes for MODIFY/DELETE
  useEffect(() => {
    const fetchDayRecords = async () => {
      const { adjustmentType, recordDate, employeeId } = newAdjustment;

      if (['MODIFY', 'DELETE'].includes(adjustmentType || '') && recordDate) {
        try {
          setLoadingRecords(true);
          const targetEmployeeId = employeeId || user?.id || 'me';
          const records = await timesheetApi.getRecordsByDate(targetEmployeeId, recordDate);
          setDayRecords(records);
        } catch (error) {
          console.error('Erro ao buscar registros do dia:', error);
          toast.error('Erro ao carregar registros do dia selecionado.');
        } finally {
          setLoadingRecords(false);
        }
      } else {
        setDayRecords([]);
      }
    };

    fetchDayRecords();
  }, [newAdjustment.adjustmentType, newAdjustment.recordDate, newAdjustment.employeeId, user?.id]);

  // Approval form
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const loadMyAdjustments = useCallback(async () => {
    try {
      const response = await timesheetApi.getMyAdjustments(0, 50);
      setMyAdjustments(response.content);
    } catch (error) {
      console.error('Erro ao carregar ajustes:', error);
      toast.error('Erro ao carregar seus ajustes. Tente novamente.');
    }
  }, []);

  const loadPendingAdjustments = useCallback(async () => {
    if (!canApprove) return;
    try {
      const response = await timesheetApi.getPendingAdjustments(0, 50);
      setPendingAdjustments(response.content);
    } catch (error) {
      console.error('Erro ao carregar pendências:', error);
      toast.error('Erro ao carregar solicitações pendentes.');
    }
  }, [canApprove]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const promises = [loadMyAdjustments()];
    if (canApprove) {
      promises.push(loadPendingAdjustments());
    }
    await Promise.all(promises);
    setLoading(false);
  }, [loadMyAdjustments, loadPendingAdjustments, canApprove]);

  useEffect(() => {
    loadData();

    // Handle query params
    const dateParam = searchParams.get('date');
    const employeeParam = searchParams.get('employee');
    const newParam = searchParams.get('new');

    if (dateParam || newParam === 'true') {
      if (dateParam) {
        setNewAdjustment(prev => ({
          ...prev,
          recordDate: dateParam,
          employeeId: employeeParam || undefined
        }));
      }
      setShowNewDialog(true);
    }
  }, [loadData, searchParams]);

  const handleSubmitAdjustment = async () => {
    if (!newAdjustment.recordDate || !newAdjustment.requestedTime || !newAdjustment.justification) {
      toast.warning('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setSubmitting(true);
      await timesheetApi.createAdjustment(newAdjustment as TimeAdjustmentRequest);
      toast.success('Solicitação enviada com sucesso!');
      setShowNewDialog(false);
      setNewAdjustment({
        adjustmentType: 'ADD',
        recordType: 'ENTRY',
        recordDate: new Date().toISOString().split('T')[0],
        requestedTime: '',
        justification: '',
      });
      await loadMyAdjustments();
    } catch (error: any) {
      console.error('Erro ao criar ajuste:', error);
      toast.error(error.response?.data?.message || 'Erro ao processar solicitação. Verifique os dados.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (adjustment: TimeAdjustment) => {
    try {
      setApproving(true);
      await timesheetApi.approveAdjustment(adjustment.id, approvalNotes);
      toast.success('Solicitação aprovada com sucesso!');
      setShowDetailsDialog(false);
      setSelectedAdjustment(null);
      setApprovalNotes('');
      await loadPendingAdjustments();
    } catch (error: any) {
      console.error('Erro ao aprovar:', error);
      toast.error(error.response?.data?.message || 'Falha ao aprovar solicitação.');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (adjustment: TimeAdjustment) => {
    if (!rejectReason) {
      toast.warning('É necessário informar o motivo da rejeição.');
      return;
    }

    try {
      setApproving(true);
      await timesheetApi.rejectAdjustment(adjustment.id, rejectReason);
      toast.success('Solicitação rejeitada.');
      setShowDetailsDialog(false);
      setSelectedAdjustment(null);
      setRejectReason('');
      await loadPendingAdjustments();
    } catch (error: any) {
      console.error('Erro ao rejeitar:', error);
      toast.error(error.response?.data?.message || 'Falha ao rejeitar solicitação.');
    } finally {
      setApproving(false);
    }
  };

  const handleCancel = async (adjustmentId: string) => {
    if (!await confirm({
      title: 'Cancelar Solicitação',
      description: 'Tem certeza que deseja cancelar esta solicitação? Esta ação é irreversível.',
      variant: 'destructive',
      confirmLabel: 'Sim, Cancelar'
    })) return;

    try {
      await timesheetApi.cancelAdjustment(adjustmentId);
      toast.success('Solicitação cancelada com sucesso.');
      await loadMyAdjustments();
    } catch (error: any) {
      console.error('Erro ao cancelar:', error);
      toast.error(error.response?.data?.message || 'Erro ao cancelar solicitação.');
    }
  };

  const getStatusBadge = (status: TimeAdjustment['status']) => {
    const config = {
      PENDING: { label: 'Pendente', className: 'bg-amber-100/60 text-amber-700 border-amber-200 hover:bg-amber-100', icon: Clock },
      APPROVED: { label: 'Aprovado', className: 'bg-green-100/50 text-green-700 border-green-200 hover:bg-green-100', icon: CheckCircle },
      REJECTED: { label: 'Rejeitado', className: 'bg-red-100/50 text-red-700 border-red-200 hover:bg-red-100', icon: XCircle },
      CANCELLED: { label: 'Cancelado', className: 'bg-gray-100/50 text-gray-700 border-gray-200 hover:bg-gray-100', icon: XCircle },
    };
    const { label, className, icon: Icon } = config[status];
    return (
      <Badge variant="outline" className={`flex items-center gap-1.5 px-2.5 py-0.5 font-medium ${className}`}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const config = {
      ADD: { label: 'Inclusão', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      MODIFY: { label: 'Alteração', className: 'bg-purple-50 text-purple-700 border-purple-200' },
      DELETE: { label: 'Exclusão', className: 'bg-pink-50 text-pink-700 border-pink-200' },
    };
    const { label, className } = config[type as keyof typeof config] || { label: type, className: '' };
    return <Badge variant="outline" className={className}>{label}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateTimeStr: string) => {
    return new Date(dateTimeStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Ajustes de Ponto</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Gerencie solicitações de ajuste de ponto e correções de horário.
          </p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-sm font-semibold">
              <Plus className="mr-2 h-5 w-5" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Solicitar Ajuste de Ponto</DialogTitle>
              <DialogDescription>
                Informe os detalhes do ajuste. Seus gestores analisarão a solicitação.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Ajuste</Label>
                  <Select
                    value={newAdjustment.adjustmentType}
                    onValueChange={(value) =>
                      setNewAdjustment({
                        ...newAdjustment,
                        adjustmentType: value as TimeAdjustmentRequest['adjustmentType'],
                        originalRecordId: undefined // Reset when type changes
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADD">Inclusão</SelectItem>
                      <SelectItem value="MODIFY">Alteração</SelectItem>
                      <SelectItem value="DELETE">Exclusão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data do Ocorrido</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      className="pl-9"
                      value={newAdjustment.recordDate}
                      onChange={(e) =>
                        setNewAdjustment({ ...newAdjustment, recordDate: e.target.value })
                      }
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Fields based on Type */}
              {newAdjustment.adjustmentType === 'ADD' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Registro</Label>
                    <Select
                      value={newAdjustment.recordType}
                      onValueChange={(value) =>
                        setNewAdjustment({ ...newAdjustment, recordType: value as TimeAdjustmentRequest['recordType'] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ENTRY">Entrada</SelectItem>
                        <SelectItem value="BREAK_START">Início Intervalo</SelectItem>
                        <SelectItem value="BREAK_END">Fim Intervalo</SelectItem>
                        <SelectItem value="EXIT">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <div className="relative">
                      <Timer className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        className="pl-9"
                        value={newAdjustment.requestedTime}
                        onChange={(e) =>
                          setNewAdjustment({ ...newAdjustment, requestedTime: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Registro Original para {newAdjustment.adjustmentType === 'MODIFY' ? 'Alterar' : 'Excluir'}</Label>
                    <Select
                      value={newAdjustment.originalRecordId}
                      onValueChange={(value) => {
                        const record = dayRecords.find(r => r.id === value);
                        setNewAdjustment({
                          ...newAdjustment,
                          originalRecordId: value,
                          recordType: record?.recordType, // Auto-fill type from record
                          requestedTime: newAdjustment.adjustmentType === 'MODIFY' ? (newAdjustment.requestedTime || record?.recordTime) : record?.recordTime
                        });
                      }}
                    >
                      <SelectTrigger disabled={loadingRecords || dayRecords.length === 0}>
                        <SelectValue placeholder={loadingRecords ? "Carregando registros..." : dayRecords.length === 0 ? "Nenhum registro encontrado" : "Selecione o registro"} />
                      </SelectTrigger>
                      <SelectContent>
                        {dayRecords.map((record) => (
                          <SelectItem key={record.id} value={record.id}>
                            {record.recordTime} - {record.recordTypeLabel} ({record.sourceLabel})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {newAdjustment.adjustmentType === 'MODIFY' && (
                    <div className="space-y-2">
                      <Label>Novo Horário Correto</Label>
                      <div className="relative">
                        <Timer className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="time"
                          className="pl-9"
                          value={newAdjustment.requestedTime}
                          onChange={(e) =>
                            setNewAdjustment({ ...newAdjustment, requestedTime: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Justificativa</Label>
                <Textarea
                  placeholder="Explique o motivo do ajuste (ex: esquecimento, erro no sistema, atividade externa)..."
                  className="resize-none min-h-[100px]"
                  value={newAdjustment.justification}
                  onChange={(e) =>
                    setNewAdjustment({ ...newAdjustment, justification: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitAdjustment} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando
                  </>
                ) : (
                  'Confirmar Solicitação'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-${canApprove ? '4' : '3'} gap-4`}>
        <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-yellow-400">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Minhas Pendentes</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-foreground">
                    {myAdjustments.filter((a) => a.status === 'PENDING').length}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium">solicitações</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-100/80 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aprovadas</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-green-600">
                    {myAdjustments.filter((a) => a.status === 'APPROVED').length}
                  </span>
                  <span className="text-sm text-green-600 font-medium">realizadas</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-100/80 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejeitadas</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-red-600">
                    {myAdjustments.filter((a) => a.status === 'REJECTED').length}
                  </span>
                  <span className="text-sm text-red-600 font-medium">recusadas</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-100/80 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {canApprove && (
          <Card className="shadow-sm hover:shadow-md transition-shadow border-blue-200 bg-blue-50/40">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Para Aprovar</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight text-blue-700">
                      {pendingAdjustments.length}
                    </span>
                    <span className="text-sm text-blue-600 font-medium">aguardando</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between border-b pb-px mb-6">
          <TabsList className="bg-transparent h-auto p-0 gap-6">
            <TabsTrigger
              value="my"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 px-0 pb-2 font-medium text-muted-foreground data-[state=active]:text-foreground transition-all"
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Minhas Solicitações
                {myAdjustments.filter((a) => a.status === 'PENDING').length > 0 && (
                  <Badge variant="secondary" className="px-1.5 min-w-[1.25rem] h-5 flex items-center justify-center text-xs">
                    {myAdjustments.filter((a) => a.status === 'PENDING').length}
                  </Badge>
                )}
              </div>
            </TabsTrigger>

            {canApprove && (
              <TabsTrigger
                value="pending"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 px-0 pb-2 font-medium text-muted-foreground data-[state=active]:text-foreground transition-all"
              >
                <div className="flex items-center gap-2">
                  <FileEdit className="h-4 w-4" />
                  Pendentes de Aprovação
                  {pendingAdjustments.length > 0 && (
                    <Badge variant="destructive" className="px-1.5 min-w-[1.25rem] h-5 flex items-center justify-center text-xs">
                      {pendingAdjustments.length}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* My Adjustments */}
        <TabsContent value="my" className="mt-0 focus-visible:outline-none">
          <Card className="border-none shadow-none bg-transparent">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 bg-card rounded-lg border border-dashed shadow-sm">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium">Carregando solicitações...</p>
              </div>
            ) : myAdjustments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-card rounded-lg border border-dashed shadow-sm">
                <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <h3 className="text-lg font-medium text-foreground">Nenhuma solicitação encontrada</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm text-center">
                  Você ainda não realizou nenhuma solicitação de ajuste de ponto.
                </p>
                <Button className="mt-6 shadow-sm" variant="outline" onClick={() => setShowNewDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Solicitação
                </Button>
              </div>
            ) : (
              <div className="rounded-md border bg-card shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-[120px]">Data</TableHead>
                      <TableHead className="w-[120px]">Tipo</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead className="hidden md:table-cell">Justificativa</TableHead>
                      <TableHead className="w-[140px]">Status</TableHead>
                      <TableHead className="text-right w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myAdjustments.map((adjustment) => (
                      <TableRow key={adjustment.id} className="cursor-pointer hover:bg-muted/30" onClick={() => {
                        setSelectedAdjustment(adjustment);
                        setShowDetailsDialog(true);
                      }}>
                        <TableCell className="font-medium text-sm">{formatDate(adjustment.recordDate)}</TableCell>
                        <TableCell>{getTypeBadge(adjustment.adjustmentType)}</TableCell>
                        <TableCell className="text-muted-foreground">{adjustment.recordTypeLabel}</TableCell>
                        <TableCell className="font-mono text-xs font-medium">{adjustment.requestedTime}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-[200px] truncate text-muted-foreground text-sm" title={adjustment.justification}>
                          {adjustment.justification}
                        </TableCell>
                        <TableCell>{getStatusBadge(adjustment.status)}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              title="Ver detalhes"
                              onClick={() => {
                                setSelectedAdjustment(adjustment);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {adjustment.status === 'PENDING' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="Cancelar solicitação"
                                onClick={() => handleCancel(adjustment.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Pending Approvals */}
        {canApprove && (
          <TabsContent value="pending" className="mt-0 focus-visible:outline-none">
            <Card className="border-none shadow-none bg-transparent">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 bg-card rounded-lg border border-dashed shadow-sm">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground font-medium">Carregando pendências...</p>
                </div>
              ) : pendingAdjustments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-card rounded-lg border border-dashed shadow-sm">
                  <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">Tudo em dia!</h3>
                  <p className="text-sm text-muted-foreground mt-1 text-center">
                    Não há solicitações pendentes de aprovação no momento.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border bg-card shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="w-[200px]">Colaborador</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Registro</TableHead>
                        <TableHead>Horário</TableHead>
                        <TableHead className="hidden md:table-cell">Solicitado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingAdjustments.map((adjustment) => (
                        <TableRow key={adjustment.id} className="cursor-pointer hover:bg-muted/30" onClick={() => {
                          setSelectedAdjustment(adjustment);
                          setShowDetailsDialog(true);
                        }}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{adjustment.employeeName}</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(adjustment.recordDate)}</TableCell>
                          <TableCell>{getTypeBadge(adjustment.adjustmentType)}</TableCell>
                          <TableCell className="text-muted-foreground">{adjustment.recordTypeLabel}</TableCell>
                          <TableCell className="font-mono text-xs font-medium">{adjustment.requestedTime}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                            {formatDateTime(adjustment.createdAt)}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Aprovar"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setApprovalNotes('');
                                  handleApprove(adjustment);
                                }}
                                disabled={approving}
                              >
                                <ThumbsUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Rejeitar/Ver Detalhes"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAdjustment(adjustment);
                                  setShowDetailsDialog(true);
                                }}
                                disabled={approving}
                              >
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px] overflow-hidden">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle>Detalhes da Solicitação</DialogTitle>
            <DialogDescription>
              {selectedAdjustment?.status === 'PENDING'
                ? 'Analise os detalhes da solicitação antes de aprovar ou rejeitar.'
                : 'Visualize os detalhes e o histórico desta solicitação.'}
            </DialogDescription>
          </DialogHeader>

          {selectedAdjustment && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-lg border">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Colaborador</Label>
                  <p className="font-medium mt-1 text-sm">{selectedAdjustment.employeeName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Status Atual</Label>
                  <div className="mt-1">{getStatusBadge(selectedAdjustment.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Tipo</Label>
                  <div className="mt-1">{getTypeBadge(selectedAdjustment.adjustmentType)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Registro</Label>
                  <p className="mt-1 text-sm font-medium">{selectedAdjustment.recordTypeLabel}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Data do Ocorrido</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">{formatDate(selectedAdjustment.recordDate)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {selectedAdjustment.originalTime && (
                  <div className="border rounded-md p-3 bg-muted/20">
                    <Label className="text-xs text-muted-foreground">Horário Original</Label>
                    <p className="font-mono text-lg">{selectedAdjustment.originalTime}</p>
                  </div>
                )}
                <div className="border rounded-md p-3 bg-blue-50/50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900">
                  <Label className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Horário Solicitado</Label>
                  <p className="font-mono text-lg font-bold text-blue-700 dark:text-blue-300">{selectedAdjustment.requestedTime}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Justificativa do Colaborador</Label>
                <div className="mt-2 p-3 bg-muted/30 rounded-md text-sm italic text-muted-foreground border">
                  "{selectedAdjustment.justification}"
                </div>
              </div>

              {selectedAdjustment.approvalNotes && (
                <div>
                  <Label className="text-sm font-medium">Observação da Avaliação</Label>
                  <div className={`mt-2 p-3 rounded-md text-sm border ${selectedAdjustment.status === 'APPROVED' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'
                    }`}>
                    {selectedAdjustment.approvalNotes}
                  </div>
                </div>
              )}

              {/* Approve/Reject Controls - ONLY for Managers/Admins AND when Pending */}
              {selectedAdjustment.status === 'PENDING' && canApprove && activeTab === 'pending' && (
                <div className="space-y-4 pt-4 border-t mt-4 bg-muted/10 -mx-6 px-6 pb-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <FileEdit className="h-4 w-4" />
                    Área de Aprovação
                  </h4>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="rejectReason">Observação / Motivo (Obrigatório para recusar)</Label>
                      <Textarea
                        id="rejectReason"
                        placeholder="Informe um motivo para rejeição ou uma observação para aprovação..."
                        value={rejectReason || approvalNotes}
                        onChange={(e) => {
                          setRejectReason(e.target.value);
                          setApprovalNotes(e.target.value);
                        }}
                        rows={2}
                        className="resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        variant="danger"
                        onClick={() => handleReject(selectedAdjustment)}
                        disabled={approving || !rejectReason}
                        className="flex-1 sm:flex-none"
                      >
                        <ThumbsDown className="mr-2 h-4 w-4" />
                        Rejeitar
                      </Button>
                      <Button
                        onClick={() => handleApprove(selectedAdjustment)}
                        disabled={approving}
                        className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white"
                      >
                        {approving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <ThumbsUp className="mr-2 h-4 w-4" />
                            Aprovar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default function AdjustmentsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <AdjustmentsPageContent />
    </Suspense>
  );
}
