'use client';

import { useState, useEffect, useCallback } from 'react';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import {
  Plus,
  Clock,
  Edit,
  Trash2,
  Copy,
  MoreHorizontal,
  AlertTriangle,
  Loader2,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { timesheetApi, WorkSchedule, WorkScheduleRequest, ScheduleDayRequest } from '@/lib/api/timesheet';

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Segunda-feira', short: 'Seg' },
  { value: 'TUESDAY', label: 'Terça-feira', short: 'Ter' },
  { value: 'WEDNESDAY', label: 'Quarta-feira', short: 'Qua' },
  { value: 'THURSDAY', label: 'Quinta-feira', short: 'Qui' },
  { value: 'FRIDAY', label: 'Sexta-feira', short: 'Sex' },
  { value: 'SATURDAY', label: 'Sábado', short: 'Sáb' },
  { value: 'SUNDAY', label: 'Domingo', short: 'Dom' },
];

const SCHEDULE_TYPES = [
  { value: 'FIXED', label: 'Fixo', description: 'Horário fixo todos os dias' },
  { value: 'FLEXIBLE', label: 'Flexível', description: 'Horário flexível com banco de horas' },
  { value: 'SHIFT', label: 'Escala', description: 'Trabalho em turnos' },
  { value: 'PART_TIME', label: 'Meio Período', description: 'Jornada parcial' },
  { value: 'INTERMITTENT', label: 'Intermitente', description: 'Trabalho sob demanda' },
];

const DEFAULT_DAYS: ScheduleDayRequest[] = DAYS_OF_WEEK.map((day) => ({
  dayOfWeek: day.value,
  isWorkDay: !['SATURDAY', 'SUNDAY'].includes(day.value),
  entryTime: '08:00',
  exitTime: '18:00',
  breakStartTime: '12:00',
  breakEndTime: '13:00',
}));

export default function SchedulesPage() {
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<WorkScheduleRequest>({
    name: '',
    description: '',
    scheduleType: 'FIXED',
    weeklyHoursMinutes: 2640, // 44 hours
    toleranceMinutes: 5,
    minBreakMinutes: 60,
    maxDailyOvertimeMinutes: 120,
    overtimeBankEnabled: false,
    overtimeBankExpirationMonths: 6,
    nightShiftStart: '22:00',
    nightShiftEnd: '05:00',
    nightShiftAdditionalPercent: 20,
    days: [...DEFAULT_DAYS],
  });

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const data = await timesheetApi.listSchedules();
      setSchedules(data);
    } catch (error) {
      console.error('Erro ao carregar escalas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleCreate = () => {
    setEditingSchedule(null);
    setFormData({
      name: '',
      description: '',
      scheduleType: 'FIXED',
      weeklyHoursMinutes: 2640,
      toleranceMinutes: 5,
      minBreakMinutes: 60,
      maxDailyOvertimeMinutes: 120,
      overtimeBankEnabled: false,
      overtimeBankExpirationMonths: 6,
      nightShiftStart: '22:00',
      nightShiftEnd: '05:00',
      nightShiftAdditionalPercent: 20,
      days: [...DEFAULT_DAYS],
    });
    setShowDialog(true);
  };

  const handleEdit = (schedule: WorkSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      description: schedule.description || '',
      scheduleType: schedule.scheduleType,
      weeklyHoursMinutes: schedule.weeklyHoursMinutes,
      toleranceMinutes: schedule.toleranceMinutes,
      minBreakMinutes: schedule.minBreakMinutes,
      maxDailyOvertimeMinutes: schedule.maxDailyOvertimeMinutes,
      overtimeBankEnabled: schedule.overtimeBankEnabled,
      overtimeBankExpirationMonths: schedule.overtimeBankExpirationMonths,
      nightShiftStart: schedule.nightShiftStart || '22:00',
      nightShiftEnd: schedule.nightShiftEnd || '05:00',
      nightShiftAdditionalPercent: schedule.nightShiftAdditionalPercent,
      days: schedule.days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        isWorkDay: d.isWorkDay,
        entryTime: d.entryTime || '08:00',
        exitTime: d.exitTime || '18:00',
        breakStartTime: d.breakStartTime || '12:00',
        breakEndTime: d.breakEndTime || '13:00',
      })),
    });
    setShowDialog(true);
  };

  const handleDuplicate = (schedule: WorkSchedule) => {
    setEditingSchedule(null);
    setFormData({
      name: `${schedule.name} (Cópia)`,
      description: schedule.description || '',
      scheduleType: schedule.scheduleType,
      weeklyHoursMinutes: schedule.weeklyHoursMinutes,
      toleranceMinutes: schedule.toleranceMinutes,
      minBreakMinutes: schedule.minBreakMinutes,
      maxDailyOvertimeMinutes: schedule.maxDailyOvertimeMinutes,
      overtimeBankEnabled: schedule.overtimeBankEnabled,
      overtimeBankExpirationMonths: schedule.overtimeBankExpirationMonths,
      nightShiftStart: schedule.nightShiftStart || '22:00',
      nightShiftEnd: schedule.nightShiftEnd || '05:00',
      nightShiftAdditionalPercent: schedule.nightShiftAdditionalPercent,
      days: schedule.days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        isWorkDay: d.isWorkDay,
        entryTime: d.entryTime || '08:00',
        exitTime: d.exitTime || '18:00',
        breakStartTime: d.breakStartTime || '12:00',
        breakEndTime: d.breakEndTime || '13:00',
      })),
    });
    setShowDialog(true);
  };

  const handleDelete = async (scheduleId: string) => {
    if (!await confirm({
      title: 'Excluir Escala',
      description: 'Deseja excluir esta escala? Esta ação não pode ser desfeita.',
      variant: 'destructive',
      confirmLabel: 'Excluir'
    })) return;

    try {
      await timesheetApi.deleteSchedule(scheduleId);
      await loadSchedules();
    } catch (error: unknown) {
      console.error('Erro ao excluir:', error);
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Erro ao excluir escala');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      alert('Informe o nome da escala');
      return;
    }

    try {
      setSubmitting(true);

      const timeToMinutes = (time?: string) => {
        if (!time) return 0;
        const [hours, minutes] = time.split(':').map(Number);
        return (hours || 0) * 60 + (minutes || 0);
      };

      const processedDays = formData.days.map(day => {
        if (!day.isWorkDay) return { ...day, expectedWorkMinutes: 0 };
        const entry = timeToMinutes(day.entryTime);
        const exit = timeToMinutes(day.exitTime);
        const breakStart = timeToMinutes(day.breakStartTime);
        const breakEnd = timeToMinutes(day.breakEndTime);
        let workMinutes = (exit - entry) - (breakEnd - breakStart);
        return { ...day, expectedWorkMinutes: workMinutes > 0 ? workMinutes : 0 };
      });

      const finalData = { ...formData, days: processedDays };

      if (editingSchedule) {
        await timesheetApi.updateSchedule(editingSchedule.id, finalData);
      } else {
        await timesheetApi.createSchedule(finalData);
      }

      setShowDialog(false);
      await loadSchedules();
    } catch (error: unknown) {
      console.error('Erro ao salvar:', error);
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Erro ao salvar escala');
    } finally {
      setSubmitting(false);
    }
  };

  const updateDayConfig = (dayOfWeek: string, field: string, value: string | boolean) => {
    setFormData({
      ...formData,
      days: formData.days.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d
      ),
    });
  };

  const formatMinutesToHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? `${mins}min` : ''}`;
  };

  const getScheduleTypeLabel = (type: string) => {
    return SCHEDULE_TYPES.find((t) => t.value === type)?.label || type;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Escalas de Trabalho</h1>
          <p className="text-muted-foreground">
            Configure jornadas e horários de trabalho
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Escala
        </Button>
      </div>

      {/* Schedules List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : schedules.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="pt-6">
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma escala cadastrada</p>
                <Button className="mt-4" onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Escala
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          schedules.map((schedule) => (
            <Card key={schedule.id} className={!schedule.active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{schedule.name}</CardTitle>
                    <CardDescription>{schedule.description}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(schedule)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(schedule)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(schedule.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{getScheduleTypeLabel(schedule.scheduleType)}</Badge>
                  {schedule.overtimeBankEnabled && (
                    <Badge variant="secondary">Banco de Horas</Badge>
                  )}
                  {!schedule.active && <Badge variant="destructive">Inativa</Badge>}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{schedule.weeklyHoursFormatted}/semana</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <span>Toler. {schedule.toleranceMinutes}min</span>
                  </div>
                </div>

                <div className="flex gap-1">
                  {[...schedule.days].sort((a, b) => {
                    const order = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
                    return order.indexOf(a.dayOfWeek) - order.indexOf(b.dayOfWeek);
                  }).map((day) => {
                    const dayConfig = DAYS_OF_WEEK.find((d) => d.value === day.dayOfWeek);
                    return (
                      <div
                        key={day.dayOfWeek}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${day.isWorkDay
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                          }`}
                        title={`${dayConfig?.label}: ${day.isWorkDay ? `${day.entryTime} - ${day.exitTime}` : 'Folga'
                          }`}
                      >
                        {dayConfig?.short.charAt(0)}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? 'Editar Escala' : 'Nova Escala de Trabalho'}
            </DialogTitle>
            <DialogDescription>
              Configure os horários e regras da jornada de trabalho
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="hours">Horários</TabsTrigger>
              <TabsTrigger value="rules">Regras</TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nome da Escala *</Label>
                <Input
                  placeholder="Ex: Comercial, Administrativo, Turno A..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  placeholder="Descrição opcional da escala"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Jornada</Label>
                <Select
                  value={formData.scheduleType}
                  onValueChange={(value) => setFormData({ ...formData, scheduleType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Carga Horária Semanal (min)</Label>
                  <Input
                    type="number"
                    value={formData.weeklyHoursMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, weeklyHoursMinutes: parseInt(e.target.value) || 0 })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {formatMinutesToHours(formData.weeklyHoursMinutes)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Intervalo Mínimo (min)</Label>
                  <Input
                    type="number"
                    value={formData.minBreakMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, minBreakMinutes: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            </TabsContent>

            {/* Hours Tab */}
            <TabsContent value="hours" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Dia</TableHead>
                    <TableHead className="text-center">Trabalha</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Saída</TableHead>
                    <TableHead>Int. Início</TableHead>
                    <TableHead>Int. Fim</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.days.map((day) => {
                    const dayConfig = DAYS_OF_WEEK.find((d) => d.value === day.dayOfWeek);
                    return (
                      <TableRow key={day.dayOfWeek}>
                        <TableCell className="font-medium">{dayConfig?.label}</TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={day.isWorkDay}
                            onCheckedChange={(checked) =>
                              updateDayConfig(day.dayOfWeek, 'isWorkDay', checked)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="time"
                            value={day.entryTime}
                            onChange={(e) =>
                              updateDayConfig(day.dayOfWeek, 'entryTime', e.target.value)
                            }
                            disabled={!day.isWorkDay}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="time"
                            value={day.exitTime}
                            onChange={(e) =>
                              updateDayConfig(day.dayOfWeek, 'exitTime', e.target.value)
                            }
                            disabled={!day.isWorkDay}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="time"
                            value={day.breakStartTime}
                            onChange={(e) =>
                              updateDayConfig(day.dayOfWeek, 'breakStartTime', e.target.value)
                            }
                            disabled={!day.isWorkDay}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="time"
                            value={day.breakEndTime}
                            onChange={(e) =>
                              updateDayConfig(day.dayOfWeek, 'breakEndTime', e.target.value)
                            }
                            disabled={!day.isWorkDay}
                            className="w-24"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Rules Tab */}
            <TabsContent value="rules" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tolerância (min)</Label>
                  <Input
                    type="number"
                    value={formData.toleranceMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, toleranceMinutes: parseInt(e.target.value) || 0 })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Tolerância para atrasos e saídas antecipadas
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Máximo Hora Extra Diária (min)</Label>
                  <Input
                    type="number"
                    value={formData.maxDailyOvertimeMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxDailyOvertimeMinutes: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-0.5">
                  <Label>Banco de Horas</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilitar compensação de horas extras
                  </p>
                </div>
                <Switch
                  checked={formData.overtimeBankEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, overtimeBankEnabled: checked })
                  }
                />
              </div>

              {formData.overtimeBankEnabled && (
                <div className="space-y-2">
                  <Label>Validade do Banco (meses)</Label>
                  <Input
                    type="number"
                    value={formData.overtimeBankExpirationMonths}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        overtimeBankExpirationMonths: parseInt(e.target.value) || 6,
                      })
                    }
                  />
                </div>
              )}

              <div className="p-4 rounded-lg border space-y-4">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  <Label>Adicional Noturno</Label>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Início</Label>
                    <Input
                      type="time"
                      value={formData.nightShiftStart}
                      onChange={(e) =>
                        setFormData({ ...formData, nightShiftStart: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Fim</Label>
                    <Input
                      type="time"
                      value={formData.nightShiftEnd}
                      onChange={(e) => setFormData({ ...formData, nightShiftEnd: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Adicional (%)</Label>
                    <Input
                      type="number"
                      value={formData.nightShiftAdditionalPercent}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nightShiftAdditionalPercent: parseInt(e.target.value) || 20,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : editingSchedule ? (
                'Salvar Alterações'
              ) : (
                'Criar Escala'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
