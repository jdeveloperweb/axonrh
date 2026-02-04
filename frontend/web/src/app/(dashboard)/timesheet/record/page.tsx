'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Coffee,
  LogIn,
  LogOut,
  RefreshCw,
  Loader2,
  Calendar as CalendarIcon,
  ChevronRight,
  History,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { timesheetApi, TimeRecord, TimeRecordRequest, Geofence } from '@/lib/api/timesheet';
import { useAuthStore } from '@/stores/auth-store';
import { formatTime } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';

const GeofenceMap = dynamic(() => import('@/components/timesheet/GeofenceMap'), {
  ssr: false,
  loading: () => <div className="h-[200px] w-full bg-muted/50 animate-pulse rounded-lg flex items-center justify-center text-muted-foreground text-sm">Carregando mapa...</div>
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
  const [showMap, setShowMap] = useState(false);

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
      toast.error('Erro ao carregar registros de hoje.');
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
        return 'Permissão negada.';
      case error.POSITION_UNAVAILABLE:
        return 'Localização indisponível.';
      case error.TIMEOUT:
        return 'Tempo esgotado.';
      default:
        return 'Erro de localização.';
    }
  };

  const getNextExpectedType = (): RecordType => {
    if (todayRecords.length === 0) return 'ENTRY';
    const lastRecord = todayRecords[todayRecords.length - 1];
    switch (lastRecord.recordType) {
      case 'ENTRY': return 'BREAK_START';
      case 'BREAK_START': return 'BREAK_END';
      case 'BREAK_END': return 'EXIT';
      case 'EXIT': return 'ENTRY';
      default: return 'ENTRY';
    }
  };

  const getRecordTypeConfig = (type: RecordType) => {
    const configs = {
      ENTRY: {
        label: 'Entrada',
        icon: LogIn,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-100 dark:bg-emerald-950/30',
        hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
        buttonColor: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 dark:shadow-emerald-900',
        description: 'Iniciar jornada de trabalho',
      },
      EXIT: {
        label: 'Saída',
        icon: LogOut,
        color: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-100 dark:bg-rose-950/30',
        hoverBg: 'hover:bg-rose-50 dark:hover:bg-rose-900/20',
        buttonColor: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 dark:shadow-rose-900',
        description: 'Encerrar jornada de trabalho',
      },
      BREAK_START: {
        label: 'Início Pausa',
        icon: Coffee,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-100 dark:bg-amber-950/30',
        hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-900/20',
        buttonColor: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200 dark:shadow-amber-900',
        description: 'Sair para intervalo',
      },
      BREAK_END: {
        label: 'Volta Pausa',
        icon: Coffee,
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-100 dark:bg-orange-950/30',
        hoverBg: 'hover:bg-orange-50 dark:hover:bg-orange-900/20',
        buttonColor: 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200 dark:shadow-orange-900',
        description: 'Retornar do intervalo',
      },
    };
    return configs[type] || configs.ENTRY;
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

      toast.success('Ponto registrado com sucesso!');

      setShowConfirmDialog(false);
      setSelectedType(null);
      setNotes('');
      setPhotoBase64(null);

      await loadTodayRecords();
    } catch (error: any) {
      console.error('Erro ao registrar ponto:', error);
      const message = error.response?.data?.message || 'Não foi possível registrar o ponto.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const nextExpected = getNextExpectedType();

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">

      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {getGreeting()}, {user?.firstName || 'Colaborador'}
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <CalendarIcon className="w-4 h-4" />
            {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={() => router.push('/timesheet/mirror')} className="flex-1 md:flex-none">
            <History className="mr-2 h-4 w-4" />
            Histórico
          </Button>
          <Button variant="ghost" size="icon" onClick={loadTodayRecords} disabled={loading} className="shrink-0">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Clock & Actions */}
        <div className="lg:col-span-2 space-y-6">

          {/* Hero Clock Card */}
          <Card className="border-none shadow-md bg-gradient-to-br from-primary/5 via-background to-background relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Clock className="w-32 h-32" />
            </div>
            <CardContent className="p-8 text-center relative z-10">
              <div className="text-7xl font-bold tracking-tighter text-primary font-mono tabular-nums">
                {currentTime.toLocaleTimeString('pt-BR')}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
                {/* Location Status Pill */}
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors cursor-pointer hover:bg-muted/50",
                  location.error ? "bg-destructive/10 text-destructive border-destructive/20" :
                    location.loading ? "bg-muted text-muted-foreground" :
                      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900"
                )}
                  onClick={() => setShowMap(!showMap)}
                >
                  {location.loading ? <Loader2 className="w-3 h-3 animate-spin" /> :
                    location.error ? <XCircle className="w-3 h-3" /> :
                      <MapPin className="w-3 h-3" />
                  }
                  <span className="font-medium">
                    {location.loading ? "Localizando..." :
                      location.error ? "Sem localização" :
                        `Localização: ${location.accuracy?.toFixed(0)}m`
                    }
                  </span>
                  {geofences.length > 0 && (
                    <span className={cn(
                      "ml-1 text-xs font-bold px-1.5 py-0.5 rounded",
                      isInsideGeofence ? "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200"
                    )}>
                      {isInsideGeofence ? "EM ÁREA" : "FORA DÁ ÁREA"}
                    </span>
                  )}
                </div>
              </div>

              {showMap && (
                <div className="mt-6 animate-in slide-in-from-top-4 fade-in duration-300">
                  <div className="rounded-lg overflow-hidden border shadow-inner">
                    <GeofenceMap
                      userLocation={{
                        latitude: location.latitude,
                        longitude: location.longitude,
                        accuracy: location.accuracy
                      }}
                      geofences={geofences}
                      height="200px"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {geofences.length > 0 ? "Você deve estar dentro de uma das áreas marcadas." : "Nenhuma cerca eletrônica configurada."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            {(['ENTRY', 'BREAK_START', 'BREAK_END', 'EXIT'] as RecordType[]).map((type) => {
              const config = getRecordTypeConfig(type);
              const isExpected = type === nextExpected;
              const Icon = config.icon;

              return (
                <Button
                  key={type}
                  variant={isExpected ? "default" : "outline"}
                  className={cn(
                    "h-auto py-6 flex flex-col items-center justify-center gap-3 transition-all duration-300 border",
                    isExpected
                      ? `col-span-2 sm:col-span-1 ring-4 ring-offset-2 ring-primary/20 ${config.buttonColor} border-transparent scale-[1.02] hover:scale-[1.03]`
                      : "hover:bg-muted bg-card hover:border-primary/50 text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => handleTypeSelect(type)}
                  disabled={submitting}
                >
                  <Icon className={cn("w-8 h-8", isExpected ? "animate-pulse" : "opacity-70")} />
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-bold uppercase tracking-wide">{config.label}</span>
                    {isExpected && <span className="text-xs opacity-90 font-medium mt-1">Sugerido agora</span>}
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Notes/Warnings Section */}
          {todayRecords.length === 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-blue-900 dark:text-blue-200">Começando o dia?</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">Não esqueça de registrar seu ponto de entrada para iniciar a contagem de horas.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col border-none shadow-md bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Linha do Tempo
              </CardTitle>
              <CardDescription>Seus registros de hoje</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto pr-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-40 space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                </div>
              ) : todayRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center p-4 border-2 border-dashed rounded-lg border-muted">
                  <Clock className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum registro hoje.<br />Seu dia começa agora!</p>
                </div>
              ) : (
                <div className="relative pl-4 space-y-0 border-l-2 border-muted ml-2">
                  {todayRecords.map((record, index) => {
                    const config = getRecordTypeConfig(record.recordType);
                    const isLast = index === todayRecords.length - 1;

                    return (
                      <div key={record.id} className="pb-8 relative group">
                        {/* Dot */}
                        <div className={cn(
                          "absolute -left-[21px] top-1 w-4 h-4 rounded-full border-2 transition-all duration-300",
                          "bg-background border-muted-foreground/30 group-hover:border-primary group-hover:scale-110",
                          isLast ? "bg-primary border-primary ring-4 ring-primary/20" : ""
                        )}>
                          <div className={cn("w-full h-full rounded-full opacity-20", config.bg)} />
                        </div>

                        {/* Content */}
                        <div className="flex flex-col gap-1 -mt-1 hover:bg-muted/50 p-2 rounded-lg transition-colors -ml-2">
                          <div className="flex items-center justify-between">
                            <span className={cn("font-bold text-sm", config.color)}>
                              {config.label}
                            </span>
                            <Badge variant="outline" className={cn("font-mono text-xs",
                              record.status === 'VALID' ? "border-green-200 text-green-700 bg-green-50" :
                                "border-yellow-200 text-yellow-700 bg-yellow-50"
                            )}>
                              {formatTime(record.recordTime)}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            {record.sourceLabel}
                            {record.withinGeofence !== undefined && (
                              isInsideGeofence ?
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> :
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
            {todayRecords.length > 0 && (
              <CardFooter className="pt-2 border-t bg-muted/20">
                <div className="flex justify-between w-full text-xs text-muted-foreground font-medium">
                  <span>Total registros: {todayRecords.length}</span>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar {selectedType && getRecordTypeConfig(selectedType).label}</DialogTitle>
            <DialogDescription>
              Registrar ponto às <span className="font-bold text-foreground">{formatTime(currentTime.toISOString())}</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className={cn("flex items-center gap-3 p-3 rounded-lg border",
              location.error ? "bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30" : "bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30"
            )}>
              {location.error ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <MapPin className="h-5 w-5 text-emerald-600" />
              )}
              <div className="flex-1">
                <p className={cn("text-sm font-medium", location.error ? "text-red-900 dark:text-red-200" : "text-emerald-900 dark:text-emerald-200")}>
                  {location.error ? "Atenção: Sem localização" : "Localização capturada"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {location.error || `Precisão: ${location.accuracy?.toFixed(0)}m`}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Ex: Esqueci de bater na hora certa..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 justify-end sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={submitting}
              className="mt-0"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmRecord}
              disabled={submitting}
              className={selectedType ? getRecordTypeConfig(selectedType).buttonColor : ""}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
