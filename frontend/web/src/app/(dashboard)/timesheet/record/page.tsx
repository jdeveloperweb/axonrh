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
  Info,
  FileEdit,
  FileCheck
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
import { wellbeingApi } from '@/lib/api/wellbeing';
import { Frown, Meh, Smile, Laugh, HeartCrack, HeartHandshake } from 'lucide-react';

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

  // Mood / Wellbeing State
  const [showMoodDialog, setShowMoodDialog] = useState(false);
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [moodText, setMoodText] = useState('');
  const [wantsEap, setWantsEap] = useState(false);
  const [submittingMood, setSubmittingMood] = useState(false);
  // Map always visible, no toggle needed


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

      // Open Mood Dialog
      if (selectedType === 'ENTRY') {
        setShowMoodDialog(true);
      }

      await loadTodayRecords();
    } catch (error: any) {
      console.error('Erro ao registrar ponto:', error);
      const message = error.response?.data?.message || 'Não foi possível registrar o ponto.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMoodSubmit = async () => {
    if (!moodScore) return;

    try {
      setSubmittingMood(true);
      await wellbeingApi.checkIn({
        employeeId: user?.id || '',
        score: moodScore,
        notes: moodText,
        wantsEapContact: wantsEap,
        source: 'WEB'
      });
      toast.success('Obrigado pelo seu feedback!');
      setShowMoodDialog(false);
      // Reset mood state
      setMoodScore(null);
      setMoodText('');
      setWantsEap(false);
    } catch (error: any) {
      console.error('Erro ao registrar sentimento:', error);
      const message = error.response?.data?.message || 'Erro ao registrar check-in.';
      toast.error(message);
    } finally {
      setSubmittingMood(false);
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
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-700">

      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">{user?.name?.split(' ')[0] || 'Colaborador'}</span>
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-2 text-lg">
            <CalendarIcon className="w-5 h-5 text-purple-500" />
            <span className="capitalize">{currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={() => router.push('/timesheet/adjustments')} className="flex-1 md:flex-none border-orange-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 shadow-sm transition-all">
            {user?.roles?.some((role: string) => ['ADMIN', 'RH', 'GESTOR_RH', 'ANALISTA_DP'].includes(role)) ? (
              <>
                <FileCheck className="mr-2 h-4 w-4" />
                Aprovar Ajustes
              </>
            ) : (
              <>
                <FileEdit className="mr-2 h-4 w-4" />
                Solicitar Ajuste
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/timesheet/mirror')} className="flex-1 md:flex-none border-gray-200 hover:bg-white hover:text-purple-600 hover:border-purple-200 shadow-sm transition-all">
            <History className="mr-2 h-4 w-4" />
            Histórico Completo
          </Button>
          <Button variant="ghost" size="icon" onClick={loadTodayRecords} disabled={loading} className="shrink-0 hover:bg-gray-100 rounded-full">
            <RefreshCw className={cn("h-5 w-5 text-gray-500", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Clock, Map & Actions (8 cols) */}
        <div className="lg:col-span-8 space-y-8">

          {/* Hero Clock Card */}
          <div className="relative overflow-hidden rounded-3xl shadow-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white border border-white/10 group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-700">
              <Clock className="w-64 h-64 rotate-12" />
            </div>

            <div className="relative z-10 p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="flex flex-col items-center">
                <span className="text-sm font-medium uppercase tracking-[0.2em] text-white/70 mb-2">Horário Atual</span>
                <div className="text-7xl md:text-9xl font-bold tracking-tighter font-mono tabular-nums leading-none drop-shadow-lg">
                  {currentTime.toLocaleTimeString('pt-BR')}
                </div>
              </div>

              {/* Location Status Pill */}
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md transition-all shadow-lg",
                location.error ? "bg-red-500/20 border-red-200/30 text-red-100" :
                  location.loading ? "bg-white/10 border-white/20 text-white/70" :
                    "bg-emerald-500/20 border-emerald-200/30 text-emerald-50"
              )}>
                {location.loading ? <Loader2 className="w-4 h-4 animate-spin" /> :
                  location.error ? <XCircle className="w-4 h-4" /> :
                    <MapPin className="w-4 h-4" />
                }
                <span className="font-semibold text-sm">
                  {location.loading ? "Identificando local..." :
                    location.error ? "Sem sinal GPS" :
                      `Precisão GPS: ${location.accuracy?.toFixed(0)}m`
                  }
                </span>
                {geofences.length > 0 && !location.loading && (
                  <span className={cn(
                    "ml-2 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide shadow-sm",
                    isInsideGeofence ? "bg-emerald-400 text-emerald-950" : "bg-rose-400 text-rose-950"
                  )}>
                    {isInsideGeofence ? "Em Área" : "Fora da Área"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Map Section - Always Visible */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
              <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-500" /> Localização em Tempo Real
              </h3>
              <span className="text-xs text-gray-400">Atualizado agora</span>
            </div>
            <div className="h-[250px] w-full relative">
              <GeofenceMap
                userLocation={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  accuracy: location.accuracy
                }}
                geofences={geofences}
                height="100%"
              />
            </div>
            <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 border-t border-blue-100 dark:border-blue-900/30 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-600 dark:text-blue-400 leading-tight">
                Não monitoramos sua localização continuamente. O mapa acima serve apenas para que você confirme sua posição exata no momento do registro do ponto.
              </p>
            </div>
          </div>

          {/* Main Action Buttons Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(['ENTRY', 'BREAK_START', 'BREAK_END', 'EXIT'] as RecordType[]).map((type) => {
              const config = getRecordTypeConfig(type);
              const isExpected = type === nextExpected;
              const Icon = config.icon;

              return (
                <Button
                  key={type}
                  variant={isExpected ? "primary" : "outline"}
                  className={cn(
                    "h-32 flex flex-col items-center justify-center gap-3 transition-all duration-300 rounded-2xl border-2 relative overflow-hidden group",
                    isExpected
                      ? `ring-4 ring-offset-4 ring-offset-gray-50 dark:ring-offset-gray-900 ${config.buttonColor} border-transparent scale-[1.02] shadow-xl`
                      : "hover:bg-gray-50 bg-white border-gray-100 text-gray-400 hover:text-gray-600 hover:border-gray-200 shadow-sm"
                  )}
                  onClick={() => handleTypeSelect(type)}
                  disabled={submitting}
                >
                  {isExpected && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-white/30 animate-pulse" />
                  )}
                  <Icon className={cn("w-8 h-8 transition-transform duration-300 group-hover:scale-110", isExpected ? "opacity-100" : "opacity-50 grayscale group-hover:grayscale-0")} />
                  <div className="flex flex-col items-center z-10">
                    <span className="text-base font-bold uppercase tracking-wide">{config.label}</span>
                    {isExpected && <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white mt-1">Sugerido</span>}
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Assistant / Help Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30 flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-xl">
              <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-bold text-blue-900 dark:text-blue-100">Precisa de ajuda com o ponto?</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Se houver divergências ou esquecimentos, utilize  o menu "Ajustes" ou contate seu gestor. Mantenha seus registros sempre atualizados.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline (4 cols) */}
        <div className="lg:col-span-4">
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 h-full flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                Linha do Tempo
              </h2>
              <p className="text-sm text-gray-500 mt-1">Seus registros de hoje</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                  <p className="text-sm text-gray-400 font-medium">Sincronizando...</p>
                </div>
              ) : todayRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100 dark:border-gray-700">
                    <History className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">Dia não iniciado</h3>
                  <p className="text-xs text-gray-500 mt-2 max-w-[200px]">Seu primeiro registro do dia aparecerá aqui.</p>
                </div>
              ) : (
                <div className="relative min-h-full pb-4 space-y-6">
                  {/* Vertical Trace Line - Now Centered and aligned */}
                  <div className="absolute left-[31px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 z-0 rounded-full opacity-60" />

                  {todayRecords.map((record, index) => {
                    const config = getRecordTypeConfig(record.recordType);
                    const isLast = index === todayRecords.length - 1;

                    return (
                      <div key={record.id} className="relative z-10 flex gap-6 group animate-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                        {/* Time Bubble */}
                        <div className={cn(
                          "w-16 h-16 flex-none flex flex-col items-center justify-center rounded-2xl border-2 bg-white dark:bg-gray-900 transition-all duration-300 shadow-sm z-10",
                          isLast
                            ? "border-indigo-600 dark:border-indigo-500 shadow-indigo-100 dark:shadow-indigo-900/20 shadow-lg scale-105 ring-4 ring-indigo-50 dark:ring-indigo-950/50"
                            : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600 grayscale hover:grayscale-0"
                        )}>
                          <span className={cn(
                            "text-sm font-bold tracking-tight",
                            isLast ? "text-indigo-700 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"
                          )}>
                            {formatTime(record.recordTime)}
                          </span>
                        </div>

                        {/* Content Card */}
                        <div className={cn(
                          "flex-1 p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-center",
                          isLast
                            ? "bg-white dark:bg-gray-800 border-indigo-100 dark:border-indigo-900/50 shadow-md translate-y-[-2px]"
                            : "bg-gray-50 dark:bg-gray-800/50 border-transparent hover:bg-white dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                        )}>
                          <div className="flex justify-between items-center">
                            <span className={cn("font-bold text-sm uppercase tracking-wide flex items-center gap-2", config.color)}>
                              {config.label}
                            </span>
                            {record.withinGeofence !== undefined && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="cursor-help">
                                      {record.withinGeofence ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{record.withinGeofence ? "Validado por GPS" : "Fora da cerca virtual"}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 font-medium mt-1 flex items-center gap-1">
                            via {record.sourceLabel || 'Web'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {todayRecords.length > 0 && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <span>Total</span>
                  <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded">{todayRecords.length} Registros</span>
                </div>
              </div>
            )}
          </div>
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

      {/* Mood / Wellbeing Dialog */}
      <Dialog open={showMoodDialog} onOpenChange={(open) => {
        if (!submittingMood && !open) setShowMoodDialog(false);
      }}>
        <DialogContent className="sm:max-w-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-none shadow-2xl">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 text-4xl shadow-inner">
              👋
            </div>
            <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Como você está hoje?
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600 dark:text-gray-300 mt-2">
              Sua saúde mental é importante para nós. Isso ajuda a calibrar nosso clima organizacional.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-4">
            {/* Mood Icons */}
            <div className="flex justify-between items-center gap-2 px-2">
              {[
                { score: 1, icon: HeartCrack, color: 'hover:text-red-500 text-gray-300', activeColor: 'text-red-500 scale-125', label: 'Péssimo' },
                { score: 2, icon: Frown, color: 'hover:text-orange-500 text-gray-300', activeColor: 'text-orange-500 scale-125', label: 'Ruim' },
                { score: 3, icon: Meh, color: 'hover:text-yellow-500 text-gray-300', activeColor: 'text-yellow-500 scale-125', label: 'Normal' },
                { score: 4, icon: Smile, color: 'hover:text-emerald-500 text-gray-300', activeColor: 'text-emerald-500 scale-125', label: 'Bem' },
                { score: 5, icon: Laugh, color: 'hover:text-blue-500 text-gray-300', activeColor: 'text-blue-500 scale-125', label: 'Ótimo' },
              ].map((item) => (
                <button
                  key={item.score}
                  onClick={() => setMoodScore(item.score)}
                  className={cn(
                    "flex flex-col items-center gap-2 transition-all duration-300 group",
                    moodScore === item.score ? "transform -translate-y-2" : "hover:-translate-y-1"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-12 h-12 transition-all duration-300 drop-shadow-sm",
                      moodScore === item.score ? item.activeColor : item.color
                    )}
                    strokeWidth={1.5}
                  />
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-wider transition-colors",
                    moodScore === item.score ? "text-gray-900 dark:text-white" : "text-gray-400 group-hover:text-gray-600"
                  )}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Note Area */}
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="relative">
                <Textarea
                  placeholder={moodScore && moodScore <= 2 ? "O que houve? Pode desabafar..." : "Quer compartilhar algo positivo ou alguma sugestão?"}
                  value={moodText}
                  onChange={(e) => setMoodText(e.target.value)}
                  className="min-h-[100px] resize-none bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-blue-500/20 text-base"
                />
                <div className="absolute right-3 bottom-3 text-[10px] text-gray-400 font-medium bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                  IA Analisando
                </div>
              </div>

              {/* EAP Offer for Low Scores */}
              {moodScore && moodScore <= 2 && (
                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-xl p-4 flex items-start gap-3 animate-in fade-in duration-300">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg shrink-0">
                    <HeartHandshake className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold text-orange-900 dark:text-orange-100">Podemos ajudar?</h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mt-0.5">
                        Entendemos que dias difíceis acontecem. Gostaria que nossa equipe do <strong>Programa de Apoio (EAP)</strong> entrasse em contato com você?
                      </p>
                    </div>
                    <div className="flex items-center gap-4 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={cn(
                          "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                          wantsEap ? "bg-orange-500 border-orange-500 text-white" : "border-orange-300 bg-white"
                        )}>
                          {wantsEap && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={wantsEap} onChange={(e) => setWantsEap(e.target.checked)} />
                        <span className={cn("text-sm font-medium", wantsEap ? "text-orange-800" : "text-gray-600")}>Sim, gostaria de apoio</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="sm:justify-between items-center gap-4 pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowMoodDialog(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              Pular
            </Button>
            <Button
              onClick={handleMoodSubmit}
              disabled={!moodScore || submittingMood}
              className={cn(
                "px-8 rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95",
                moodScore && moodScore <= 2 ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200" :
                  "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-blue-200"
              )}
            >
              {submittingMood ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Enviar Registro'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
