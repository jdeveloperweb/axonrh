'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    format,
    startOfMonth,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';

import { vacationApi, VacationRequest } from '@/lib/api/vacation';
import { employeesApi, Employee } from '@/lib/api/employees';

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

    // Load Data
    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch employees
            // In a real app, pagination should be handled. fetching 100 for now.
            const empResponse = await employeesApi.list({ size: 100, status: 'ACTIVE' });
            setEmployees(empResponse.content);

            // Fetch vacations for the month of selected date
            // Backend api accepts year/month.
            await loadVacations(date.getFullYear(), date.getMonth() + 1);

        } catch (error) {
            console.error('Error loading team data:', error);
        } finally {
            setLoading(false);
        }
    }, [date]); // Re-fetch if month changes? Ideally should separate month fetching.

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

        return employees.filter(emp => departmentId === 'all' || emp.department?.id === departmentId).map(emp => {
            // 1. Check Vacation
            const vacation = vacations.find(v => {
                if (v.employeeId !== emp.id) return false;
                if (v.status !== 'APPROVED' && v.status !== 'IN_PROGRESS') return false;
                const start = parseISO(v.startDate);
                const end = parseISO(v.endDate);
                return isWithinInterval(date, { start, end });
            });

            if (vacation) {
                return { employee: emp, status: 'VACATION', note: 'Férias' } as DailyStatus;
            }

            // 2. Check Weekend
            if (isWeekend(date)) {
                return { employee: emp, status: 'OFF', note: 'Fim de Semana' } as DailyStatus;
            }

            // 3. Check Work Regime
            if (emp.workRegime === 'REMOTO') {
                return { employee: emp, status: 'REMOTE', note: '100% Remoto' } as DailyStatus;
            }

            if (emp.workRegime === 'HIBRIDO') {
                // Check if today is an office day
                const isOfficeDay = emp.hybridWorkDays?.includes(currentDayOfWeek);
                if (isOfficeDay) {
                    return { employee: emp, status: 'OFFICE', note: 'Dia Presencial' } as DailyStatus;
                } else {
                    return { employee: emp, status: 'REMOTE', note: 'Dia Remoto' } as DailyStatus;
                }
            }

            // Default Presencial
            return { employee: emp, status: 'OFFICE', note: 'Presencial' } as DailyStatus;
        });
    }, [employees, vacations, date, departmentId]);

    const stats = useMemo(() => {
        return {
            office: teamStatus.filter(s => s.status === 'OFFICE').length,
            remote: teamStatus.filter(s => s.status === 'REMOTE').length,
            vacation: teamStatus.filter(s => s.status === 'VACATION').length,
        };
    }, [teamStatus]);

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Presença da Equipe</h1>
                    <p className="text-muted-foreground">Quem está onde hoje?</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Date Picker & Filters */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Data</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(d) => d && setDate(d)}
                                className="rounded-md border"
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Resumo do Dia</CardTitle>
                            <CardDescription>{format(date, "d 'de' MMMM, yyyy", { locale: ptBR })}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-blue-500" />
                                    <span>No Escritório</span>
                                </div>
                                <span className="font-bold">{stats.office}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Home className="h-4 w-4 text-purple-500" />
                                    <span>Remoto</span>
                                </div>
                                <span className="font-bold">{stats.remote}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sun className="h-4 w-4 text-yellow-500" />
                                    <span>Férias</span>
                                </div>
                                <span className="font-bold">{stats.vacation}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* List */}
                <div className="md:col-span-2">
                    <Card className="h-full">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Status da Equipe</CardTitle>
                                <CardDescription>
                                    Visualizando {teamStatus.length} colaboradores
                                </CardDescription>
                            </div>
                            {/* Department Filter could go here */}
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {teamStatus.map((item) => (
                                        <div
                                            key={item.employee.id}
                                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <Avatar>
                                                    <AvatarImage src={item.employee.photoUrl} />
                                                    <AvatarFallback>{item.employee.fullName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{item.employee.fullName}</p>
                                                    <p className="text-sm text-muted-foreground">{item.employee.position?.name || 'Cargo não definido'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                {item.status === 'OFFICE' && (
                                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">
                                                        <Building className="mr-1 h-3 w-3" /> Presencial
                                                    </Badge>
                                                )}
                                                {item.status === 'REMOTE' && (
                                                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200">
                                                        <Home className="mr-1 h-3 w-3" /> Remoto
                                                    </Badge>
                                                )}
                                                {item.status === 'VACATION' && (
                                                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200">
                                                        <Sun className="mr-1 h-3 w-3" /> Férias
                                                    </Badge>
                                                )}
                                                {item.status === 'OFF' && (
                                                    <Badge variant="outline" className="text-muted-foreground">Off</Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {teamStatus.length === 0 && (
                                        <div className="text-center py-12 text-muted-foreground">
                                            Nenhum colaborador encontrado
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
