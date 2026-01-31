'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Coffee,
  LogIn,
  LogOut,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { timesheetApi, TimeRecord, TimeRecordRequest, Geofence } from '@/lib/api/timesheet';
import { useAuthStore } from '@/stores/auth-store';
import { formatTime } from '@/lib/utils';
import dynamic from 'next/dynamic';

const GeofenceMap = dynamic(() => import('@/components/timesheet/GeofenceMap'), {
  ssr: false,
  loading: () => <div className="h-[350px] w-full bg-muted animate-pulse rounded-lg flex items-center justify-center text-muted-foreground">Carregando mapa...</div>
});

type RecordType = 'ENTRY' | 'EXIT' | 'BREAK_START' | 'BREAK_END';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

export default function TimeRecordPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayRecords, setTodayRecords] = useState<TimeRecord[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<RecordType | null>(null);
  const [notes, setNotes] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
  });

  const isInsideGeofence = useMemo(() => {
    if (!location.latitude || !location.longitude || geofences.length === 0) return false;

    return geofences.some(fence => {
      const R = 6371000;
      const lat1 = location.latitude! * Math.PI / 180;
      const lat2 = fence.latitude * Math.PI / 180;
      const dLat = (fence.latitude - location.latitude!) * Math.PI / 180;
      const dLon = (fence.longitude - location.longitude!) * Math.PI / 180;

      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return distance <= fence.radiusMeters;
    });
  }, [location.latitude, location.longitude, geofences]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            error: null,
            loading: false,
          });
        },
        (error) => {
          setLocation({
            latitude: null,
            longitude: null,
            accuracy: null,
            error: getLocationErrorMessage(error),
            loading: false,
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      setLocation({
        latitude: null,
        longitude: null,
        accuracy: null,
        error: 'Geolocalização não suportada pelo navegador',
        loading: false,
      });
    }
  }, []);

  const loadTodayRecords = useCallback(async () => {
    try {
      setLoading(true);
      const [records, myGeofences] = await Promise.all([
        timesheetApi.getTodayRecords(),
        timesheetApi.getMyAllowedGeofences()
      ]);
      setTodayRecords(records);
      setGeofences(myGeofences);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodayRecords();
  }, [loadTodayRecords]);

  const getLocationErrorMessage = (error: GeolocationPositionError): string => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Permissão de localização negada. Habilite nas configurações do navegador.';
      case error.POSITION_UNAVAILABLE:
        return 'Localização indisponível no momento.';
      case error.TIMEOUT:
        return 'Tempo esgotado ao obter localização.';
      default:
        return 'Erro ao obter localização.';
    }
  };

  const getNextExpectedType = (): RecordType => {
    if (todayRecords.length === 0) return 'ENTRY';

    const lastRecord = todayRecords[todayRecords.length - 1];
    switch (lastRecord.recordType) {
      case 'ENTRY':
        return 'BREAK_START';
      case 'BREAK_START':
        return 'BREAK_END';
      case 'BREAK_END':
        return 'EXIT';
      case 'EXIT':
        return 'ENTRY';
      default:
        return 'ENTRY';
    }
  };

  const getRecordTypeConfig = (type: RecordType) => {
    const configs = {
      ENTRY: {
        label: 'Entrada',
        icon: LogIn,
        color: 'bg-green-500 hover:bg-green-600',
        description: 'Registrar início da jornada',
      },
      EXIT: {
        label: 'Saída',
        icon: LogOut,
        color: 'bg-red-500 hover:bg-red-600',
        description: 'Registrar fim da jornada',
      },
      BREAK_START: {
        label: 'Início Intervalo',
        icon: Coffee,
        color: 'bg-yellow-500 hover:bg-yellow-600',
        description: 'Registrar início do intervalo',
      },
      BREAK_END: {
        label: 'Fim Intervalo',
        icon: Coffee,
        color: 'bg-orange-500 hover:bg-orange-600',
        description: 'Registrar fim do intervalo',
      },
    };
    return configs[type];
  };

  const handleTypeSelect = (type: RecordType) => {
    setSelectedType(type);
    setShowConfirmDialog(true);
  };

  const handleConfirmRecord = async () => {
    if (!selectedType) return;

    try {
      setSubmitting(true);

      const request: TimeRecordRequest = {
        employeeId: user?.id || '',
        recordType: selectedType,
        source: 'WEB',
        latitude: location.latitude ?? undefined,
        longitude: location.longitude ?? undefined,
        photoBase64: photoBase64 ?? undefined,
        deviceInfo: navigator.userAgent,
        notes: notes || undefined,
      };

      await timesheetApi.registerTimeRecord(request);

      setShowConfirmDialog(false);
      setSelectedType(null);
      setNotes('');
      setPhotoBase64(null);

      await loadTodayRecords();
    } catch (error: unknown) {
      console.error('Erro ao registrar ponto:', error);
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Erro ao registrar ponto');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrentTime = () => {
    return currentTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatCurrentDate = () => {
    return currentTime.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: TimeRecord['status']) => {
    const statusConfig = {
      VALID: { label: 'Válido', variant: 'default' as const },
      PENDING_APPROVAL: { label: 'Pendente', variant: 'warning' as const },
      APPROVED: { label: 'Aprovado', variant: 'success' as const },
      REJECTED: { label: 'Rejeitado', variant: 'destructive' as const },
      ADJUSTED: { label: 'Ajustado', variant: 'secondary' as const },
    };
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const nextExpected = getNextExpectedType();

  return (
    <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Registro de Ponto</h1>
          <p className="text-sm sm:text-base text-muted-foreground capitalize">{formatCurrentDate()}</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadTodayRecords} disabled={loading} className="w-full sm:w-auto">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Clock Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-none shadow-sm">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-4xl sm:text-6xl font-mono font-bold tracking-wider text-primary">
              {formatCurrentTime()}
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground">
              {location.loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Obtendo localização...</span>
                </>
              ) : location.error ? (
                <>
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-destructive">{location.error}</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span>
                    Localização capturada (precisão: {location.accuracy?.toFixed(0)}m)
                  </span>
                  {geofences.length > 0 && (
                    <Badge variant={isInsideGeofence ? "success" : "destructive"} className="ml-2">
                      {isInsideGeofence ? "Área Autorizada" : "Fora da Área"}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa de Cercas Digitais
          </CardTitle>
          <CardDescription>
            Verifique se você está dentro da área permitida para registro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GeofenceMap
            userLocation={{
              latitude: location.latitude,
              longitude: location.longitude
            }}
            geofences={geofences}
            height="350px"
          />
          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500"></div>
              <span>Dentro da Cerca</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div>
              <span>Fora da Cerca</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-blue-500" />
              <span>Sua Posição</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Record Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Registrar Ponto</CardTitle>
          <CardDescription>
            Próximo registro esperado: <strong>{getRecordTypeConfig(nextExpected).label}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['ENTRY', 'BREAK_START', 'BREAK_END', 'EXIT'] as RecordType[]).map((type) => {
              const config = getRecordTypeConfig(type);
              const Icon = config.icon;
              const isExpected = type === nextExpected;

              return (
                <Button
                  key={type}
                  className={`h-24 flex-col gap-2 ${config.color} ${isExpected ? 'ring-2 ring-offset-2 ring-primary' : ''
                    }`}
                  onClick={() => handleTypeSelect(type)}
                  disabled={submitting}
                >
                  <Icon className="h-8 w-8" />
                  <span className="text-sm font-medium">{config.label}</span>
                  {isExpected && (
                    <Badge variant="secondary" className="text-xs">
                      Esperado
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Today's Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Registros de Hoje
          </CardTitle>
          <CardDescription>
            {todayRecords.length} registro(s) realizado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : todayRecords.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Nenhum registro de ponto realizado hoje. Clique em &quot;Entrada&quot; para começar.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {todayRecords.map((record) => {
                const config = getRecordTypeConfig(record.recordType);
                const Icon = config.icon;

                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-full ${config.color.replace('hover:', '')}`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">{config.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {record.sourceLabel}
                          {record.withinGeofence !== undefined && (
                            <span className="ml-2">
                              {record.withinGeofence ? (
                                <CheckCircle className="inline h-3 w-3 text-green-500" />
                              ) : (
                                <XCircle className="inline h-3 w-3 text-red-500" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-mono font-bold">
                        {formatTime(record.recordTime)}
                      </div>
                      <div className="mt-1">{getStatusBadge(record.status)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => router.push('/timesheet/mirror')}
        >
          <CardContent className="pt-6 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-medium">Espelho de Ponto</h3>
            <p className="text-sm text-muted-foreground">Ver histórico completo</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => router.push('/timesheet/adjustments')}
        >
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <h3 className="font-medium">Solicitar Ajuste</h3>
            <p className="text-sm text-muted-foreground">Corrigir marcações</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => router.push('/timesheet/overtime')}
        >
          <CardContent className="pt-6 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <h3 className="font-medium">Banco de Horas</h3>
            <p className="text-sm text-muted-foreground">Ver saldo atual</p>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Registro</DialogTitle>
            <DialogDescription>
              Você está prestes a registrar{' '}
              <strong>{selectedType && getRecordTypeConfig(selectedType).label}</strong> às{' '}
              <strong>{formatCurrentTime()}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Location Status */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              {location.latitude && location.longitude ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Localização capturada com sucesso</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <span>Localização não disponível</span>
                </>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Adicione uma observação se necessário..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmRecord} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirmar Registro
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
