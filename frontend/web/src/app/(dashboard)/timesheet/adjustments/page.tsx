'use client';

import { useState, useEffect, useCallback } from 'react';
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
  MessageSquare,
  Search,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { timesheetApi, TimeAdjustment, TimeAdjustmentRequest } from '@/lib/api/timesheet';

export default function AdjustmentsPage() {
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

  // Approval form
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const loadMyAdjustments = useCallback(async () => {
    try {
      const response = await timesheetApi.getMyAdjustments(0, 50);
      setMyAdjustments(response.content);
    } catch (error) {
      console.error('Erro ao carregar ajustes:', error);
    }
  }, []);

  const loadPendingAdjustments = useCallback(async () => {
    try {
      const response = await timesheetApi.getPendingAdjustments(0, 50);
      setPendingAdjustments(response.content);
    } catch (error) {
      console.error('Erro ao carregar pendências:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadMyAdjustments(), loadPendingAdjustments()]);
    setLoading(false);
  }, [loadMyAdjustments, loadPendingAdjustments]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmitAdjustment = async () => {
    if (!newAdjustment.recordDate || !newAdjustment.requestedTime || !newAdjustment.justification) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSubmitting(true);
      await timesheetApi.createAdjustment(newAdjustment as TimeAdjustmentRequest);
      setShowNewDialog(false);
      setNewAdjustment({
        adjustmentType: 'ADD',
        recordType: 'ENTRY',
        recordDate: new Date().toISOString().split('T')[0],
        requestedTime: '',
        justification: '',
      });
      await loadMyAdjustments();
    } catch (error: unknown) {
      console.error('Erro ao criar ajuste:', error);
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Erro ao criar solicitação');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (adjustment: TimeAdjustment) => {
    try {
      setApproving(true);
      await timesheetApi.approveAdjustment(adjustment.id, approvalNotes);
      setShowDetailsDialog(false);
      setSelectedAdjustment(null);
      setApprovalNotes('');
      await loadPendingAdjustments();
    } catch (error: unknown) {
      console.error('Erro ao aprovar:', error);
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Erro ao aprovar');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (adjustment: TimeAdjustment) => {
    if (!rejectReason) {
      alert('Informe o motivo da rejeição');
      return;
    }

    try {
      setApproving(true);
      await timesheetApi.rejectAdjustment(adjustment.id, rejectReason);
      setShowDetailsDialog(false);
      setSelectedAdjustment(null);
      setRejectReason('');
      await loadPendingAdjustments();
    } catch (error: unknown) {
      console.error('Erro ao rejeitar:', error);
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Erro ao rejeitar');
    } finally {
      setApproving(false);
    }
  };

  const handleCancel = async (adjustmentId: string) => {
    if (!confirm('Deseja cancelar esta solicitação?')) return;

    try {
      await timesheetApi.cancelAdjustment(adjustmentId);
      await loadMyAdjustments();
    } catch (error: unknown) {
      console.error('Erro ao cancelar:', error);
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Erro ao cancelar');
    }
  };

  const getStatusBadge = (status: TimeAdjustment['status']) => {
    const config = {
      PENDING: { label: 'Pendente', variant: 'warning' as const, icon: AlertTriangle },
      APPROVED: { label: 'Aprovado', variant: 'success' as const, icon: CheckCircle },
      REJECTED: { label: 'Rejeitado', variant: 'destructive' as const, icon: XCircle },
      CANCELLED: { label: 'Cancelado', variant: 'secondary' as const, icon: XCircle },
    };
    const { label, variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const config = {
      ADD: { label: 'Inclusão', color: 'bg-green-100 text-green-800' },
      MODIFY: { label: 'Alteração', color: 'bg-blue-100 text-blue-800' },
      DELETE: { label: 'Exclusão', color: 'bg-red-100 text-red-800' },
    };
    const { label, color } = config[type as keyof typeof config] || { label: type, color: '' };
    return <Badge className={color}>{label}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateTimeStr: string) => {
    return new Date(dateTimeStr).toLocaleString('pt-BR');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ajustes de Ponto</h1>
          <p className="text-muted-foreground">
            Solicite e acompanhe ajustes nas suas marcações
          </p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Solicitar Ajuste de Ponto</DialogTitle>
              <DialogDescription>
                Preencha os dados para solicitar a inclusão, alteração ou exclusão de um registro
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Ajuste *</Label>
                  <Select
                    value={newAdjustment.adjustmentType}
                    onValueChange={(value) =>
                      setNewAdjustment({ ...newAdjustment, adjustmentType: value as TimeAdjustmentRequest['adjustmentType'] })
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
                  <Label>Tipo de Registro *</Label>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input
                    type="date"
                    value={newAdjustment.recordDate}
                    onChange={(e) =>
                      setNewAdjustment({ ...newAdjustment, recordDate: e.target.value })
                    }
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Horário Solicitado *</Label>
                  <Input
                    type="time"
                    value={newAdjustment.requestedTime}
                    onChange={(e) =>
                      setNewAdjustment({ ...newAdjustment, requestedTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Justificativa *</Label>
                <Textarea
                  placeholder="Descreva o motivo do ajuste..."
                  value={newAdjustment.justification}
                  onChange={(e) =>
                    setNewAdjustment({ ...newAdjustment, justification: e.target.value })
                  }
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitAdjustment} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Solicitação'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Minhas Pendentes</p>
                <p className="text-2xl font-bold">
                  {myAdjustments.filter((a) => a.status === 'PENDING').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aprovadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {myAdjustments.filter((a) => a.status === 'APPROVED').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejeitadas</p>
                <p className="text-2xl font-bold text-red-600">
                  {myAdjustments.filter((a) => a.status === 'REJECTED').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Para Aprovar</p>
                <p className="text-2xl font-bold text-blue-600">{pendingAdjustments.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Minhas Solicitações
            {myAdjustments.filter((a) => a.status === 'PENDING').length > 0 && (
              <Badge variant="secondary">
                {myAdjustments.filter((a) => a.status === 'PENDING').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Pendentes de Aprovação
            {pendingAdjustments.length > 0 && (
              <Badge variant="destructive">{pendingAdjustments.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* My Adjustments */}
        <TabsContent value="my">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : myAdjustments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Você não possui solicitações de ajuste</p>
                  <Button className="mt-4" onClick={() => setShowNewDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Solicitação
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myAdjustments.map((adjustment) => (
                      <TableRow key={adjustment.id}>
                        <TableCell>{formatDate(adjustment.recordDate)}</TableCell>
                        <TableCell>{getTypeBadge(adjustment.adjustmentType)}</TableCell>
                        <TableCell>{adjustment.recordTypeLabel}</TableCell>
                        <TableCell className="font-mono">{adjustment.requestedTime}</TableCell>
                        <TableCell>{getStatusBadge(adjustment.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDateTime(adjustment.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
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
                                size="sm"
                                className="text-red-500 hover:text-red-700"
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Approvals */}
        <TabsContent value="pending">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : pendingAdjustments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma solicitação pendente de aprovação</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Solicitado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingAdjustments.map((adjustment) => (
                      <TableRow key={adjustment.id}>
                        <TableCell className="font-medium">{adjustment.employeeName}</TableCell>
                        <TableCell>{formatDate(adjustment.recordDate)}</TableCell>
                        <TableCell>{getTypeBadge(adjustment.adjustmentType)}</TableCell>
                        <TableCell>{adjustment.recordTypeLabel}</TableCell>
                        <TableCell className="font-mono">{adjustment.requestedTime}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDateTime(adjustment.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAdjustment(adjustment);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-500 hover:text-green-700"
                              onClick={() => handleApprove(adjustment)}
                              disabled={approving}
                            >
                              <ThumbsUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => {
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação</DialogTitle>
          </DialogHeader>

          {selectedAdjustment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Colaborador</Label>
                  <p className="font-medium">{selectedAdjustment.employeeName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p>{getStatusBadge(selectedAdjustment.status)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Tipo</Label>
                  <p>{getTypeBadge(selectedAdjustment.adjustmentType)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Registro</Label>
                  <p>{selectedAdjustment.recordTypeLabel}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data</Label>
                  <p>{formatDate(selectedAdjustment.recordDate)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {selectedAdjustment.originalTime && (
                  <div>
                    <Label className="text-muted-foreground">Horário Original</Label>
                    <p className="font-mono">{selectedAdjustment.originalTime}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Horário Solicitado</Label>
                  <p className="font-mono font-medium">{selectedAdjustment.requestedTime}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Justificativa</Label>
                <p className="p-3 bg-muted rounded-md">{selectedAdjustment.justification}</p>
              </div>

              {selectedAdjustment.approvalNotes && (
                <div>
                  <Label className="text-muted-foreground">Observação do Aprovador</Label>
                  <p className="p-3 bg-muted rounded-md">{selectedAdjustment.approvalNotes}</p>
                </div>
              )}

              {selectedAdjustment.status === 'PENDING' && activeTab === 'pending' && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Observações da Aprovação</Label>
                    <Textarea
                      placeholder="Adicione uma observação (opcional)..."
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Motivo da Rejeição (se aplicável)</Label>
                    <Textarea
                      placeholder="Informe o motivo da rejeição..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="danger"
                      onClick={() => handleReject(selectedAdjustment)}
                      disabled={approving || !rejectReason}
                    >
                      <ThumbsDown className="mr-2 h-4 w-4" />
                      Rejeitar
                    </Button>
                    <Button
                      onClick={() => handleApprove(selectedAdjustment)}
                      disabled={approving}
                    >
                      {approving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ThumbsUp className="mr-2 h-4 w-4" />
                      )}
                      Aprovar
                    </Button>
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
