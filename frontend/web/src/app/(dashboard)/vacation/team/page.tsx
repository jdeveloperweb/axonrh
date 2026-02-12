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
    Coffee
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

    const statusConfig = {
        OFFICE: { label: 'Presencial', color: 'bg-blue-500', badgeCls: 'bg-blue-50 text-blue-600' },
        REMOTE: { label: 'Home Office', color: 'bg-purple-500', badgeCls: 'bg-purple-50 text-purple-600' },
        VACATION: { label: 'Em Férias', color: 'bg-amber-500', badgeCls: 'bg-amber-50 text-amber-600' },
        OFF: { label: 'Folga', color: 'bg-gray-400', badgeCls: 'bg-gray-100 text-gray-500' },
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Escala da Equipe</h1>
                        <p className="text-[var(--color-text-secondary)]">
                            Visualize onde estão os colaboradores em cada dia.
                        </p>
                    </div>
                </div>

                <div className="relative min-w-[280px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-10 pl-10 pr-4 rounded-lg border-gray-200 bg-white text-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Calendar & Summary */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5 text-[var(--color-primary)]" />
                                Escolha a Data
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(d) => d && setDate(d)}
                                className="rounded-lg border border-gray-200 p-3"
                                locale={ptBR}
                            />
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-gray-900 text-white">
                        <CardHeader className="pb-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">Status Consolidado</p>
                            <CardTitle className="text-xl font-bold capitalize">{format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                { icon: Building, label: 'No Escritório', value: stats.office, color: 'bg-blue-500' },
                                { icon: Home, label: 'Em Home Office', value: stats.remote, color: 'bg-purple-500' },
                                { icon: Sun, label: 'Em Férias', value: stats.vacation, color: 'bg-amber-500' },
                                { icon: Coffee, label: 'Folga/Descanso', value: stats.off, color: 'bg-gray-500' },
                            ].map((stat, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", stat.color)}>
                                            <stat.icon className="h-4 w-4 text-white" />
                                        </div>
                                        <span className="text-sm text-gray-300">{stat.label}</span>
                                    </div>
                                    <span className="text-lg font-bold tabular-nums">{stat.value}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Detailed List */}
                <div className="lg:col-span-8">
                    <Card className="border-none shadow-sm bg-white h-full min-h-[600px]">
                        <CardHeader className="pb-4 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold">Detalhamento da Escala</CardTitle>
                                    <CardDescription>
                                        Visualizando {teamStatus.length} colaboradores
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
                                    <p className="text-sm text-gray-500">Sincronizando escalas...</p>
                                </div>
                            ) : teamStatus.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                                    <Users className="h-10 w-10 text-gray-200" />
                                    <p className="text-sm text-gray-400">Nenhum registro encontrado para esta busca.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {teamStatus.map((item) => (
                                        <div
                                            key={item.employee.id}
                                            className="flex flex-col md:flex-row md:items-center justify-between p-5 hover:bg-gray-50/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <Avatar className="h-12 w-12 rounded-lg">
                                                        <AvatarImage src={item.employee.photoUrl} />
                                                        <AvatarFallback className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold text-sm rounded-lg">
                                                            {item.employee.fullName.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className={cn(
                                                        "absolute -bottom-1 -right-1 h-5 w-5 rounded border-2 border-white flex items-center justify-center",
                                                        statusConfig[item.status].color
                                                    )}>
                                                        {item.status === 'OFFICE' ? <Building className="h-2.5 w-2.5 text-white" /> :
                                                            item.status === 'REMOTE' ? <Home className="h-2.5 w-2.5 text-white" /> :
                                                                item.status === 'VACATION' ? <Sun className="h-2.5 w-2.5 text-white" /> :
                                                                    <Coffee className="h-2.5 w-2.5 text-white" />}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{item.employee.fullName}</p>
                                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                                        <MapPin className="h-3 w-3" />
                                                        {item.employee.position?.name || 'Cargo não definido'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3 md:mt-0 flex items-center gap-3">
                                                <div className="text-right hidden md:block">
                                                    <p className="text-xs text-gray-400">Status Hoje</p>
                                                    <p className="text-sm font-medium text-gray-700">{item.note}</p>
                                                </div>
                                                <span className={cn(
                                                    "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold",
                                                    statusConfig[item.status].badgeCls
                                                )}>
                                                    {statusConfig[item.status].label}
                                                </span>
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
