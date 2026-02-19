'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    Calendar,
    Stethoscope,
    Baby,
    Heart,
    Clock,
    TrendingUp,
    UserCheck,
    Activity,
    Filter,
    Download,
    Search,
    ChevronRight,
    User,
    Database,
    Loader2
} from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
    ComposedChart, Line, AreaChart, Area,
    ReferenceArea
} from 'recharts';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { leavesApi, LeaveDashboardStats } from '@/lib/api/leaves';
import { cn } from '@/lib/utils';

const COLORS = ['#2563EB', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

export function AvailabilityDashboard() {
    const [stats, setStats] = useState<LeaveDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const { toast } = useToast();

    async function loadStats() {
        try {
            setLoading(true);
            const data = await leavesApi.getDashboardStats();
            setStats(data);
        } catch (error) {
            console.error('Error loading leave stats:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleSeed = async () => {
        try {
            setSeeding(true);
            await leavesApi.seedLeaves(20);
            toast({
                title: 'Carga finalizada',
                description: '20 novas licenças foram geradas aleatoriamente.',
            });
            await loadStats();
        } catch (error) {
            toast({
                title: 'Erro na carga',
                description: 'Não foi possível gerar dados de teste.',
                variant: 'destructive',
            });
        } finally {
            setSeeding(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Transform gender distribution for pie chart
    const genderData = stats?.genderDistribution || [];

    // Medical leave pie chart
    const medicalLeaveByGender = [
        { name: 'Masculino', value: stats?.maleMedicalLeavesCount || 0, color: '#2563EB' },
        { name: 'Feminino', value: stats?.femaleMedicalLeavesCount || 0, color: '#EC4899' },
    ];

    const mainKpis = [
        { title: 'Total de Titulares', value: stats?.totalEmployees || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: 'Titulares (F)', value: stats?.femaleEmployees || 0, icon: User, color: 'text-pink-600', bg: 'bg-pink-50' },
        { title: 'Titulares (M)', value: stats?.maleEmployees || 0, icon: User, color: 'text-blue-500', bg: 'bg-blue-50' },
        { title: 'Qtd Licenças Médicas', value: stats?.medicalLeavesCount || 0, icon: Stethoscope, color: 'text-indigo-600', bg: 'bg-indigo-50', primary: true },
        { title: 'Funcionários em Licença', value: stats?.employeesOnLeave || 0, icon: UserCheck, iconBg: 'bg-blue-600', color: 'text-blue-600', bg: 'bg-blue-50', primary: true },
        { title: 'Idade Média em Licença', value: '35,50', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', primary: true },
        { title: 'Idade Média', value: (stats?.averageAge || 0).toFixed(2), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: 'Idade Média (F)', value: (stats?.femaleAverageAge || 0).toFixed(2), icon: User, color: 'text-pink-600', bg: 'bg-pink-50' },
        { title: 'Idade Média (M)', value: (stats?.maleAverageAge || 0).toFixed(2), icon: User, color: 'text-blue-500', bg: 'bg-blue-50' },
        { title: 'Licenças (F)', value: stats?.femaleMedicalLeavesCount || 0, icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50', primary: true },
        { title: 'Licenças (M)', value: stats?.maleMedicalLeavesCount || 0, icon: Heart, color: 'text-blue-500', bg: 'bg-blue-50', primary: true },
        { title: '% HC em Licença', value: `${(stats?.medicalLeavePercentage || 0).toFixed(2)}%`, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50', primary: true },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Visão Geral de Disponibilidade</h1>
                    <p className="text-sm text-slate-500">Gestão global de licenças e afastamentos</p>
                </div>
                <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                    <Badge variant="outline" className="px-4 py-2 border-none bg-slate-50 text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors">
                        01/01/2026 - 31/12/2026
                    </Badge>
                    <div className="w-[1px] h-6 bg-slate-100 mx-1" />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSeed}
                        disabled={seeding}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold gap-2"
                    >
                        {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                        Carga de Teste
                    </Button>
                    <div className="w-[1px] h-6 bg-slate-100 mx-1" />
                    <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {mainKpis.map((kpi, idx) => (
                    <Card key={idx} className={cn(
                        "border-none shadow-sm transition-all hover:shadow-md",
                        kpi.primary ? "bg-slate-900 border-none group" : "bg-white"
                    )}>
                        <CardContent className="p-4 flex flex-col items-center text-center">
                            <p className={cn(
                                "text-[10px] font-bold uppercase tracking-wider mb-2",
                                kpi.primary ? "text-slate-400 group-hover:text-blue-400" : "text-slate-500"
                            )}>
                                {kpi.title}
                            </p>
                            <h3 className={cn(
                                "text-2xl font-black mb-1",
                                kpi.primary ? "text-white" : "text-slate-800"
                            )}>
                                {kpi.value}
                            </h3>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Middle Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Generatons List */}
                <Card className="border-none shadow-sm h-[400px]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Geração - Qtd Func</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-slate-400 border-b border-slate-50">
                                        <th className="text-left font-normal pb-2">Geração</th>
                                        <th className="text-right font-normal pb-2">Head Count</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {stats?.generations.map((gen, i) => (
                                        <tr key={i} className="text-slate-700">
                                            <td className="py-2">{gen.name}</td>
                                            <td className="py-2 text-right font-bold">{gen.count.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    <tr className="text-slate-900 font-black border-t-2 border-slate-100">
                                        <td className="py-3">Total</td>
                                        <td className="py-3 text-right">{stats?.totalEmployees.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Head Count per Sex */}
                <Card className="border-none shadow-sm h-[400px]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Head Count por Sexo</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.genderDistribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="gender" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {stats?.genderDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.gender.toLowerCase() === 'female' ? '#EC4899' : '#10B981'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Em Licença Médica Pie */}
                <Card className="border-none shadow-sm h-[400px]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Em Licença Médica</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex flex-col justify-center">
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={medicalLeaveByGender}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {medicalLeaveByGender.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" align="center" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex border-t border-slate-50 pt-4 mt-2 justify-around">
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">F</p>
                                <p className="text-lg font-black text-slate-800">{stats?.femaleMedicalLeavesCount}</p>
                                <p className="text-[9px] text-slate-400">({((stats?.femaleMedicalLeavesCount || 0) / (stats?.medicalLeavesCount || 1) * 100).toFixed(2)}%)</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">M</p>
                                <p className="text-lg font-black text-slate-800">{stats?.maleMedicalLeavesCount}</p>
                                <p className="text-[9px] text-slate-400">({((stats?.maleMedicalLeavesCount || 0) / (stats?.medicalLeavesCount || 1) * 100).toFixed(2)}%)</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Reasons Table */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Qtd Licenças por Motivo</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-hidden rounded-xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr className="text-slate-500">
                                    <th className="text-left font-bold px-6 py-4">Motivo</th>
                                    <th className="text-right font-bold px-6 py-4">Licenças</th>
                                    <th className="text-right font-bold px-6 py-4">%</th>
                                    <th className="text-right font-bold px-6 py-4">Colaboradores</th>
                                    <th className="text-right font-bold px-6 py-4">Hoje em Licença</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {stats?.reasonDistribution.map((reason, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                <span className="font-medium text-slate-700">{reason.reason}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900">{reason.count.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-slate-500">{reason.percentage.toFixed(2)}%</td>
                                        <td className="px-6 py-4 text-right text-slate-900">{reason.employeesCount || reason.count}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none font-black px-3">
                                                {reason.currentOnLeave}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* CID Distribution Section */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">CID - Qtdade de Licenças</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {stats?.cidDistribution.map((cid, i) => (
                            <div key={i} className="group p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/10 transition-all">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                            <Stethoscope className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{cid.cid}: {cid.description}</h4>
                                            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{cid.chapter || 'DOENÇAS DO APARELHO RESPIRATÓRIO'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-slate-900">{cid.count}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Licenças em {cid.year}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!stats?.cidDistribution || stats?.cidDistribution.length === 0) && (
                            <div className="text-center py-12 text-slate-400 italic">
                                Nenhum registro de CID encontrado para o período.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
