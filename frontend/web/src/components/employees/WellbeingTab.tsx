'use client';

import { useState, useEffect, useMemo } from 'react';
import { wellbeingApi } from '@/lib/api/wellbeing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, TrendingUp, AlertCircle, Smile, Meh, Frown, HeartCrack, Laugh, Activity, HeartHandshake, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WellbeingTabProps {
    employeeId: string;
}

interface WellbeingRecord {
    id: string;
    score: number;
    notes?: string;
    sentiment?: string;
    riskLevel?: string;
    wantsEapContact?: boolean;
    createdAt: string;
    keywords?: string;
}

const MOOD_CONFIG: Record<number, { label: string, color: string, icon: any }> = {
    1: { label: 'Péssimo', color: 'text-red-500', icon: HeartCrack },
    2: { label: 'Ruim', color: 'text-orange-500', icon: Frown },
    3: { label: 'Normal', color: 'text-yellow-500', icon: Meh },
    4: { label: 'Bem', color: 'text-emerald-500', icon: Smile },
    5: { label: 'Ótimo', color: 'text-blue-500', icon: Laugh },
};

export function WellbeingTab({ employeeId }: WellbeingTabProps) {
    const [history, setHistory] = useState<WellbeingRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const data = await wellbeingApi.getHistory(employeeId);
                // Ensure data is array (backend returns list)
                if (Array.isArray(data)) {
                    setHistory(data);
                } else {
                    console.error('Expected array for history, got:', data);
                    setHistory([]);
                }
            } catch (error) {
                console.error('Failed to load wellbeing history', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [employeeId]);

    const stats = useMemo(() => {
        if (history.length === 0) return { avg: 0, count: 0, trend: 0 };
        const total = history.reduce((acc, curr) => acc + curr.score, 0);
        const avg = total / history.length;

        return { avg, count: history.length };
    }, [history]);

    const chartData = useMemo(() => {
        // Reverse needed because history usually comes sorted desc (newest first). 
        // For chart we want oldest first (left to right).
        return [...history].reverse().map(item => ({
            date: format(new Date(item.createdAt), 'dd/MM', { locale: ptBR }),
            shortTime: format(new Date(item.createdAt), 'HH:mm'),
            score: item.score,
            notes: item.notes,
            fullDate: format(new Date(item.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR }),
        }));
    }, [history]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Activity className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Sem registros ainda</h3>
                <p className="text-slate-500 max-w-xs mx-auto mt-2">
                    Este colaborador ainda não realizou nenhum check-in de humor.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Média Geral</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className={cn("text-4xl font-black", stats.avg >= 4 ? "text-emerald-600" : stats.avg >= 3 ? "text-yellow-600" : "text-rose-600")}>
                                {stats.avg.toFixed(1)}
                            </span>
                            <span className="text-sm font-bold text-slate-400">/ 5.0</span>
                        </div>
                    </div>
                    <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", stats.avg >= 3 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                        {stats.avg >= 4 ? <Smile className="w-8 h-8" /> : stats.avg >= 3 ? <Meh className="w-8 h-8" /> : <Frown className="w-8 h-8" />}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Check-ins</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-4xl font-black text-blue-600">{stats.count}</span>
                        </div>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Activity className="w-8 h-8" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-lg border border-indigo-400/20 text-white flex items-center justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-sm font-bold text-indigo-100 uppercase tracking-wider">Último Humor</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-3xl font-black">{MOOD_CONFIG[history[0].score]?.label}</span>
                            {(() => {
                                const Icon = MOOD_CONFIG[history[0].score]?.icon || Smile;
                                return <Icon className="w-8 h-8 opacity-80" />;
                            })()}
                        </div>
                        <p className="text-xs text-indigo-200 mt-1">
                            {format(new Date(history[0].createdAt), "d 'de' MMM, HH:mm", { locale: ptBR })}
                        </p>
                    </div>
                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                        <Smile className="w-32 h-32" />
                    </div>
                </div>
            </div>

            {/* Chart */}
            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                        Evolução do Humor
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    domain={[0, 6]}
                                    ticks={[1, 2, 3, 4, 5]}
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => val === 1 ? '☹️' : val === 5 ? '😄' : val}
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700">
                                                    <p className="font-bold text-slate-700 dark:text-slate-200">{data.fullDate}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-2xl font-black text-indigo-600">{data.score}</span>
                                                        <span className="text-sm text-slate-500">({MOOD_CONFIG[data.score]?.label})</span>
                                                    </div>
                                                    {data.notes && (
                                                        <p className="mt-2 text-xs italic text-slate-500 max-w-[200px] bg-slate-50 dark:bg-slate-900 p-2 rounded">"{data.notes}"</p>
                                                    )}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <ReferenceLine y={3} stroke="#cbd5e1" strokeDasharray="3 3" />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#6366f1"
                                    strokeWidth={4}
                                    dot={{ r: 6, fill: '#6366f1', strokeWidth: 4, stroke: '#e0e7ff' }}
                                    activeDot={{ r: 8, fill: '#4f46e5' }}
                                    animationDuration={1500}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* History List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        Histórico Detalhado
                    </h3>
                    <button
                        onClick={() => {
                            const headers = ['Data', 'Hora', 'Nota', 'Sentimento', 'Risco', 'EAP', 'Observações'];
                            const csvContent = [
                                headers.join(','),
                                ...history.map(row => [
                                    format(new Date(row.createdAt), 'dd/MM/yyyy'),
                                    format(new Date(row.createdAt), 'HH:mm'),
                                    row.score,
                                    row.sentiment || '-',
                                    row.riskLevel || '-',
                                    row.wantsEapContact ? 'Sim' : 'Não',
                                    `"${(row.notes || '').replace(/"/g, '""')}"`
                                ].join(','))
                            ].join('\n');

                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(blob);
                            link.download = `bem-estar-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                            link.click();
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                    >
                        <Download className="w-4 h-4" />
                        Exportar CSV
                    </button>
                </div>

                <div className="grid gap-4">
                    {history.map((record, idx) => {
                        const Info = MOOD_CONFIG[record.score] || MOOD_CONFIG[3];
                        const Icon = Info.icon;

                        return (
                            <div key={record.id} className="group flex flex-col md:flex-row gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
                                <div className="flex items-start gap-4">
                                    <div className={cn("p-3 rounded-2xl shadow-sm h-fit shrink-0",
                                        record.score >= 4 ? "bg-emerald-50 text-emerald-600" :
                                            record.score <= 2 ? "bg-rose-50 text-rose-600" :
                                                "bg-amber-50 text-amber-600"
                                    )}>
                                        <Icon className="w-8 h-8" />
                                    </div>

                                    <div className="space-y-1 min-w-[150px]">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                {format(new Date(record.createdAt), "dd MMM yyyy", { locale: ptBR })}
                                            </span>
                                            <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                                                {format(new Date(record.createdAt), "HH:mm")}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="secondary" className={cn(Info.color, "bg-slate-50 border-slate-200")}>
                                                {Info.label}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 md:border-l border-slate-100 md:pl-6 space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {record.riskLevel === 'HIGH' && (
                                            <Badge variant="destructive" className="animate-pulse">
                                                <AlertCircle className="w-3 h-3 mr-1" /> Alto Risco
                                            </Badge>
                                        )}
                                        {record.wantsEapContact && (
                                            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-none">
                                                <HeartHandshake className="w-3 h-3 mr-1" /> Solicitou Ajuda (EAP)
                                            </Badge>
                                        )}
                                        {record.sentiment && (
                                            <Badge variant="outline" className={cn(
                                                "text-xs uppercase tracking-wider font-bold",
                                                record.sentiment === 'POSITIVE' ? "text-emerald-600 border-emerald-200 bg-emerald-50" :
                                                    record.sentiment === 'NEGATIVE' ? "text-rose-600 border-rose-200 bg-rose-50" :
                                                        "text-slate-600"
                                            )}>
                                                IA: {record.sentiment === 'POSITIVE' ? 'Positivo' : record.sentiment === 'NEGATIVE' ? 'Negativo' : 'Neutro'}
                                            </Badge>
                                        )}
                                    </div>

                                    {record.notes ? (
                                        <div className="relative">
                                            <div className="absolute top-0 left-0 text-3xl text-slate-200 font-serif -translate-x-2 -translate-y-2">"</div>
                                            <p className="text-slate-600 dark:text-slate-300 italic relative z-10 pl-4">
                                                {record.notes}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 text-sm italic">Sem observações.</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
