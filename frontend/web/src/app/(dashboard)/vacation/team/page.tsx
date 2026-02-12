'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    format,
    getDay,
    parseISO,
    isWithinInterval,
    isWeekend,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    ArrowLeft,
    Sun,
    Home,
    Building,
    Loader2,
    Calendar as CalendarIcon,
    Users,
    MapPin,
    Search,
    Filter,
    Sparkles,
    UserCheck,
    Coffee
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';

import { vacationApi, VacationRequest } from '@/lib/api/vacation';
import { employeesApi, Employee } from '@/lib/api/employees';
import { cn } from '@/lib/utils';

interface DailyStatus {
    employee: Employee;
    status: 'OFFICE' | 'REMOTE' | 'VACATION' | 'OFF';
    note?: string;
}

export default function TeamVacationPage() {
    const router = useRouter();
    const [date, setDate] = useState<Date>(new Date());
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [vacations, setVacations] = useState<VacationRequest[]>([]);
    const [departmentId] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Load Data
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const empResponse = await employeesApi.list({ size: 100, status: 'ACTIVE' });
            setEmployees(empResponse.content);
            await loadVacations(date.getFullYear(), date.getMonth() + 1);
        } catch (error) {
            console.error('Error loading team data:', error);
        } finally {
            setLoading(false);
        }
    }, [date]);

    const loadVacations = async (year: number, month: number) => {
        const data = await vacationApi.getTeamCalendar(year, month);
        setVacations(data);
    };

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Calculate Status for the selected Date
    const teamStatus = useMemo(() => {
        const dayOfWeekMap = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const currentDayOfWeek = dayOfWeekMap[getDay(date)];

        return employees
            .filter(emp => (departmentId === 'all' || emp.department?.id === departmentId) &&
                emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(emp => {
                const vacation = vacations.find(v => {
                    if (v.employeeId !== emp.id) return false;
                    if (v.status !== 'APPROVED' && v.status !== 'IN_PROGRESS') return false;
                    const start = parseISO(v.startDate);
                    const end = parseISO(v.endDate);
                    return isWithinInterval(date, { start, end });
                });

                if (vacation) return { employee: emp, status: 'VACATION', note: 'Em Férias' } as DailyStatus;
                if (isWeekend(date)) return { employee: emp, status: 'OFF', note: 'Descanso Semanal' } as DailyStatus;

                if (emp.workRegime === 'REMOTO') return { employee: emp, status: 'REMOTE', note: 'Home Office' } as DailyStatus;
                if (emp.workRegime === 'HIBRIDO') {
                    const isOfficeDay = emp.hybridWorkDays?.includes(currentDayOfWeek);
                    return isOfficeDay
                        ? { employee: emp, status: 'OFFICE', note: 'Presencial' } as DailyStatus
                        : { employee: emp, status: 'REMOTE', note: 'Home Office' } as DailyStatus;
                }
                return { employee: emp, status: 'OFFICE', note: 'Presencial' } as DailyStatus;
            });
    }, [employees, vacations, date, departmentId, searchTerm]);

    const stats = useMemo(() => {
        return {
            office: teamStatus.filter(s => s.status === 'OFFICE').length,
            remote: teamStatus.filter(s => s.status === 'REMOTE').length,
            vacation: teamStatus.filter(s => s.status === 'VACATION').length,
            off: teamStatus.filter(s => s.status === 'OFF').length,
        };
    }, [teamStatus]);

    return (
        <div className="container max-w-7xl py-10 space-y-12 animate-in fade-in duration-700">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.back()}
                        className="h-14 w-14 rounded-2xl border-slate-100 bg-white shadow-sm hover:shadow-md transition-all"
                    >
                        <ArrowLeft className="h-6 w-6 text-slate-600" />
                    </Button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Escala Corporativa</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">Onde está a <span className="text-primary italic">Equipe?</span></h1>
                    </div>
                </div>

                <div className="relative group min-w-[320px]">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Buscar por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-16 pl-14 pr-6 rounded-2xl border-none bg-white shadow-xl shadow-slate-200/50 focus:ring-primary/20 transition-all font-medium"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Calendar & Summary */}
                <div className="lg:col-span-4 space-y-10">
                    <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
                        <CardHeader className="p-8 pb-0">
                            <CardTitle className="text-lg font-black uppercase text-slate-900 flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5 text-primary" />
                                Escolha a Data
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(d) => d && setDate(d)}
                                className="rounded-2xl border-2 border-slate-50 p-4"
                                locale={ptBR}
                            />
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-slate-900 text-white">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Status Consolidado</span>
                                <CardTitle className="text-2xl font-black capitalize">{format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 pt-4 space-y-6">
                            {[
                                { icon: Building, label: 'No Escritório', value: stats.office, color: 'bg-blue-500' },
                                { icon: Home, label: 'Em Home Office', value: stats.remote, color: 'bg-purple-500' },
                                { icon: Sun, label: 'Em Férias', value: stats.vacation, color: 'bg-amber-500' },
                                { icon: Coffee, label: 'Folga/Descanso', value: stats.off, color: 'bg-slate-500' },
                            ].map((stat, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", stat.color)}>
                                            <stat.icon className="h-5 w-5 text-white" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-300">{stat.label}</span>
                                    </div>
                                    <span className="text-xl font-black tabular-nums">{stat.value}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Detailed List */}
                <div className="lg:col-span-8">
                    <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white h-full min-h-[600px]">
                        <CardHeader className="p-10 pb-6 border-b border-slate-50">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl font-black text-slate-900 uppercase">Detalhamento da Escala</CardTitle>
                                    <CardDescription className="font-medium">
                                        Visualizando disponibilidades para {teamStatus.length} colaboradores
                                    </CardDescription>
                                </div>
                                <div className="hidden md:flex p-3 bg-slate-50 rounded-2xl">
                                    <Filter className="h-5 w-5 text-slate-300" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-40 gap-4">
                                    <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Sincronizando escalas...</p>
                                </div>
                            ) : teamStatus.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
                                    <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center">
                                        <Sparkles className="h-10 w-10 text-slate-200" />
                                    </div>
                                    <p className="text-slate-400 font-bold max-w-xs uppercase text-[10px] tracking-widest">Nenhum registro encontrado para esta busca.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {teamStatus.map((item) => (
                                        <div
                                            key={item.employee.id}
                                            className="group flex flex-col md:flex-row md:items-center justify-between p-10 hover:bg-slate-50/50 transition-all"
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="relative">
                                                    <Avatar className="h-16 w-16 rounded-[1.25rem] shadow-xl">
                                                        <AvatarImage src={item.employee.photoUrl} />
                                                        <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">
                                                            {item.employee.fullName.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className={cn(
                                                        "absolute -bottom-1 -right-1 h-6 w-6 rounded-lg border-4 border-white flex items-center justify-center",
                                                        item.status === 'OFFICE' ? 'bg-blue-500' :
                                                            item.status === 'REMOTE' ? 'bg-purple-500' :
                                                                item.status === 'VACATION' ? 'bg-amber-500' : 'bg-slate-500'
                                                    )}>
                                                        {item.status === 'OFFICE' ? <Building className="h-2.5 w-2.5 text-white" /> :
                                                            item.status === 'REMOTE' ? <Home className="h-2.5 w-2.5 text-white" /> :
                                                                item.status === 'VACATION' ? <Sun className="h-2.5 w-2.5 text-white" /> :
                                                                    <Coffee className="h-2.5 w-2.5 text-white" />}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-lg font-black text-slate-900 leading-tight group-hover:text-primary transition-colors">{item.employee.fullName}</p>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                        <MapPin className="h-3 w-3" />
                                                        {item.employee.position?.name || 'Cargo não definido'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-6 md:mt-0 flex items-center gap-4">
                                                <div className="text-right hidden md:block">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status Hoje</p>
                                                    <p className="text-sm font-black text-slate-700">{item.note}</p>
                                                </div>
                                                <Badge className={cn(
                                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm",
                                                    item.status === 'OFFICE' ? 'bg-blue-50 text-blue-600 hover:bg-blue-50' :
                                                        item.status === 'REMOTE' ? 'bg-purple-50 text-purple-600 hover:bg-purple-50' :
                                                            item.status === 'VACATION' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' :
                                                                'bg-slate-100 text-slate-500 hover:bg-slate-100'
                                                )}>
                                                    {item.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

