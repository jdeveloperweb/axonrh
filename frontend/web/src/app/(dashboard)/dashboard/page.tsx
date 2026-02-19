'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  AlertCircle,
  TrendingUp,
  UserCheck,
  BarChart3,
  Brain,
  GraduationCap,
  CheckCircle,
  BookOpen,
  Clock as ClockIcon,
  ShieldCheck,
  LineChart,
  Smile,
  Meh,
  Frown,
  Activity
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  ComposedChart, Line, AreaChart, Area,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ReferenceArea
} from 'recharts';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth-store';
import { dashboardApi, DashboardStats, LearningStats } from '@/lib/api/dashboard';
import { wellbeingApi, WellbeingStats } from '@/lib/api/wellbeing';
import { CollaboratorDashboard } from '@/components/dashboard/CollaboratorDashboard';
import { AvailabilityDashboard } from '@/components/dashboard/AvailabilityDashboard';
import { useThemeStore } from '@/stores/theme-store';
import { cn } from '@/lib/utils';

// ==================== Types ====================

interface StatCard {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ElementType;
  color: string; // Hex or var
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const TRANSLATIONS: Record<string, string> = {
  // Gênero
  'MALE': 'Masculino',
  'FEMALE': 'Feminino',
  'OTHER': 'Outro',
  // Etnia
  'BRANCO': 'Branca',
  'PARDO': 'Parda',
  'PRETO': 'Preta',
  'AMARELO': 'Amarela',
  'INDIGENA': 'Indígena',
  // Status de Treinamento
  'IN_PROGRESS': 'Em Andamento',
  'COMPLETED': 'Concluído',
  'NOT_STARTED': 'Não Iniciado',
  'ENROLLED': 'Matriculado',
  'FAILED': 'Reprovado',
  'CANCELLED': 'Cancelado',
  'EXPIRED': 'Expirado',
  'PENDING': 'Pendente',
  // Niveis de Risco
  'HIGH': 'Alto Risco',
  'MEDIUM': 'Médio Risco',
  'LOW': 'Baixo Risco'
};

const translate = (key: string) => TRANSLATIONS[key] || key;

// ==================== Component ====================

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [learningStats, setLearningStats] = useState<LearningStats | null>(null);
  const [wellbeingStats, setWellbeingStats] = useState<WellbeingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('geral');
  const [viewMode, setViewMode] = useState<'manager' | 'collaborator'>('manager');

  const roles = user?.roles || [];
  const isManagement = roles.includes('ADMIN') || roles.includes('RH') || roles.includes('GESTOR_RH') || roles.includes('ANALISTA_DP');

  useEffect(() => {
    if (!isManagement) return;

    async function loadStats() {
      try {
        const [dashboardData, learningData, wellbeingData] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getLearningStats().catch(() => null),
          wellbeingApi.getStats().catch(() => null)
        ]);
        setStatsData(dashboardData);
        setLearningStats(learningData);
        setWellbeingStats(wellbeingData);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [isManagement]);

  // --- Data Transformation for Charts ---

  // Gender Data for Donut Chart
  const genderData = statsData?.genderDistribution
    ? Object.entries(statsData.genderDistribution).map(([name, value]) => ({
      name: translate(name),
      value
    }))
    : [];

  // Race Data for Bar Chart
  const raceData = statsData?.raceDistribution
    ? Object.entries(statsData.raceDistribution).map(([name, value]) => ({
      name: translate(name),
      value
    }))
    : [];

  // History Data for Stability & Turnover
  const historyData = statsData?.activeHistory
    ? Object.keys(statsData.activeHistory).map((month) => ({
      name: month,
      active: statsData.activeHistory[month],
      turnover: statsData.turnoverHistory?.[month] || 0,
      hired: statsData.hiringHistory?.[month] || 0,
      terminated: statsData.terminationHistory?.[month] || 0,
    }))
    : [];

  // Tenure Data
  const tenureData = statsData?.tenureDistribution
    ? Object.entries(statsData.tenureDistribution).map(([name, value]) => ({ name, value }))
    // Sort logic if needed, but backend sends ordered keys (LinkedHashMap) if done right.
    // However, JS object iteration order is complex. Better to rely on array from backend or keys array.
    // For now, assuming keys are mapped chronologically/logically.
    : [];

  const renderGeralTab = () => {
    const stats: StatCard[] = [
      {
        title: 'Total de Colaboradores',
        value: statsData?.totalEmployees || 0,
        subtext: 'Ativos',
        icon: Users,
        color: '#2563EB', // Blue
      },
      {
        title: 'Presentes Hoje',
        value: statsData?.presentToday || 0,
        subtext: 'Estimado',
        icon: UserCheck,
        color: '#16A34A', // Green
      },
      {
        title: 'Férias este Mês',
        value: statsData?.vacationsThisMonth || 0,
        subtext: 'Em gozo',
        icon: Calendar,
        color: '#CA8A04', // Yellow
      },
      {
        title: 'Pendências',
        value: statsData?.pendingIssues || 0,
        subtext: 'Ações requeridas',
        icon: AlertCircle,
        color: '#DC2626', // Red
      },
    ];

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover:shadow-md transition-all border-none shadow-sm bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                      <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                      <p className="text-xs text-gray-400 mt-1">{stat.subtext}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-opacity-10" style={{ backgroundColor: `${stat.color}15` }}>
                      <Icon className="w-6 h-6" style={{ color: stat.color }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm h-[400px]">
            <CardHeader>
              <CardTitle>Composição por Gênero</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm h-[400px]">
            <CardHeader>
              <CardTitle>Variação Mensal</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="active" fill="#2563EB" radius={[4, 4, 0, 0]} name="Ativos" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderDiversityTab = () => {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* KPI Cards for Diversity */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Representação Feminina</p>
                <p className="text-3xl font-bold mt-1">
                  {statsData?.femaleRepresentation || 0}%
                </p>
                <p className="text-xs text-gray-400 mt-1">Do total de colaboradores</p>
              </div>
              <div className="p-3 bg-pink-50 rounded-full">
                <Users className="w-6 h-6 text-pink-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Índice de Diversidade</p>
                <p className="text-3xl font-bold mt-1">
                  {statsData?.diversityIndex || 0}%
                </p>
                <p className="text-xs text-gray-400 mt-1">Baseado em etnia declarada</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-full">
                <Users className="w-6 h-6 text-indigo-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Idade Média</p>
                <p className="text-3xl font-bold mt-1">
                  {statsData?.averageAge || 0} anos
                </p>
                <p className="text-xs text-gray-400 mt-1">Colaboradores ativos</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-full">
                <Users className="w-6 h-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm h-[400px]">
            <CardHeader>
              <CardTitle>Distribuição por Gênero</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm h-[400px]">
            <CardHeader>
              <CardTitle>Diversidade Étnica</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={raceData}
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {raceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderHiringTab = () => {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Top: Stability Chart */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Estabilidade e Crescimento do Quadro</CardTitle>
            <p className="text-sm text-gray-500">
              Relação entre número total de colaboradores ativos e taxa de turnover mensal.
            </p>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={historyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" unit="%" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="active" name="Colaboradores Ativos" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={40} />
                <Line yAxisId="right" type="monotone" dataKey="turnover" name="Turnover" stroke="#DC2626" strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hiring vs Termination */}
          <Card className="border-none shadow-sm h-[400px]">
            <CardHeader>
              <CardTitle>Contratações vs Desligamentos</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="hired" name="Contratações" fill="#16A34A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="terminated" name="Desligamentos" fill="#DC2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tenure */}
          <Card className="border-none shadow-sm h-[400px]">
            <CardHeader>
              <CardTitle>Tempo de Casa</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={tenureData} margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" name="Colaboradores" fill="#60A5FA" radius={[0, 4, 4, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderLearningTab = () => {
    // Learning Data Transformation
    const statusData = learningStats?.statusDistribution
      ? Object.entries(learningStats.statusDistribution).map(([name, value]) => ({
        name: translate(name),
        value
      }))
      : [];

    const monthlyActivity = learningStats?.monthlyActivity || [];

    const stats: StatCard[] = [
      {
        title: 'Treinamentos Ativos',
        value: learningStats?.totalActiveEnrollments || 0,
        subtext: 'Em andamento',
        icon: BookOpen,
        color: '#2563EB',
      },
      {
        title: 'Concluídos (Mês)',
        value: learningStats?.completionsThisMonth || 0,
        subtext: 'Certificados emitidos',
        icon: CheckCircle,
        color: '#16A34A',
      },
      {
        title: 'Progresso Médio',
        value: `${Math.round(learningStats?.averageProgress || 0)}%`,
        subtext: 'Em cursos ativos',
        icon: TrendingUp,
        color: '#8B5CF6',
      },
      {
        title: 'Horas de Treinamento',
        value: Math.round(learningStats?.totalTrainingHours || 0),
        subtext: 'Total acumulado',
        icon: ClockIcon,
        color: '#F59E0B',
      },
    ];

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover:shadow-md transition-all border-none shadow-sm bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                      <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                      <p className="text-xs text-gray-400 mt-1">{stat.subtext}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-opacity-10" style={{ backgroundColor: `${stat.color}15` }}>
                      <Icon className="w-6 h-6" style={{ color: stat.color }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm h-[400px]">
            <CardHeader>
              <CardTitle>Evolução de Aprendizado</CardTitle>
              <p className="text-sm text-gray-500">Conclusões vs Novas Matrículas (Últimos 6 meses)</p>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="enrollments" name="Matrículas" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completions" name="Conclusões" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm h-[400px]">
            <CardHeader>
              <CardTitle>Status dos Treinamentos</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  barSize={32}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-200">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{data.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-black">{data.value}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Matrículas</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 12, 12, 0]}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderWellbeingTab = () => {
    // Transform Sentiment Data
    const sentimentData = wellbeingStats?.sentimentDistribution
      ? Object.entries(wellbeingStats.sentimentDistribution).map(([name, value]) => ({
        name: name === 'POSITIVE' ? 'Positivo' : name === 'NEGATIVE' ? 'Negativo' : 'Neutro',
        value
      }))
      : [];

    const stats: StatCard[] = [
      {
        title: 'Check-ins Totais',
        value: wellbeingStats?.totalCheckins || 0,
        subtext: 'Registros de humor',
        icon: UserCheck,
        color: '#2563EB',
      },
      {
        title: 'Média de Humor',
        value: wellbeingStats?.averageScore ? wellbeingStats.averageScore.toFixed(1) : 'N/A',
        subtext: 'Escala 1-5',
        icon: TrendingUp,
        color: wellbeingStats && wellbeingStats.averageScore >= 4 ? '#16A34A' : wellbeingStats && wellbeingStats.averageScore <= 2 ? '#DC2626' : '#CA8A04',
      },
      {
        title: 'Alto Risco',
        value: wellbeingStats?.highRiskCount || 0,
        subtext: 'Colaboradores em alerta',
        icon: AlertCircle,
        color: '#DC2626',
      },
      {
        title: 'Solicitações EAP',
        value: wellbeingStats?.totalEapRequests || 0,
        subtext: 'Pedidos de ajuda',
        icon: Users,
        color: '#8B5CF6',
      },
    ];

    // Prepare star (radar) data
    const totalCheckins = wellbeingStats?.totalCheckins || 1;
    const radarData = [
      { subject: 'Bem-estar', value: ((wellbeingStats?.sentimentDistribution['POSITIVE'] || 0) / totalCheckins) * 100, fullMark: 100 },
      { subject: 'Equilíbrio', value: ((wellbeingStats?.sentimentDistribution['NEUTRAL'] || 0) / totalCheckins) * 100, fullMark: 100 },
      { subject: 'Atenção', value: ((wellbeingStats?.sentimentDistribution['NEGATIVE'] || 0) / totalCheckins) * 100, fullMark: 100 },
      { subject: 'Satisfação', value: ((wellbeingStats?.averageScore || 0) / 5) * 100, fullMark: 100 },
      { subject: 'Engajamento', value: Math.min(((wellbeingStats?.totalCheckins || 0) / (statsData?.totalEmployees || 1)) * 100, 100), fullMark: 100 },
    ];

    // Mock trend data for the innovative "Pulse" chart based on current average
    const currentAvg = wellbeingStats?.averageScore || 3.5;
    const pulseData = [
      { date: '05/02', score: currentAvg * 0.95 },
      { date: '06/02', score: currentAvg * 1.05 },
      { date: '07/02', score: currentAvg * 0.90 },
      { date: '08/02', score: currentAvg * 1.10 },
      { date: '09/02', score: currentAvg * 1.00 },
      { date: '10/02', score: currentAvg * 0.95 },
      { date: '11/02', score: currentAvg }
    ];

    const handleMarkAsHandled = async (id: string) => {
      try {
        await wellbeingApi.markAsHandled(id);
        const wellbeingData = await wellbeingApi.getStats();
        setWellbeingStats(wellbeingData);
      } catch (error) {
        console.error('Error marking request as handled:', error);
      }
    };

    const pendingRequests = wellbeingStats?.eapRequests?.filter(req => !req.handled) || [];

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover:shadow-md transition-all border-none shadow-sm bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                      <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                      <p className="text-xs text-gray-400 mt-1">{stat.subtext}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-opacity-10" style={{ backgroundColor: `${stat.color}15` }}>
                      <Icon className="w-6 h-6" style={{ color: stat.color }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Dashboard Left: Mental Health Pulse Chart (Innovative) */}
          <div className="lg:col-span-12 xl:col-span-7 space-y-6">
            <Card className="border-none shadow-sm overflow-hidden bg-white h-[480px]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                    Pulso de Saúde Mental
                  </CardTitle>
                  <p className="text-sm text-gray-500">Estabilidade emocional da organização (Últimos 7 dias)</p>
                </div>
              </CardHeader>
              <CardContent className="h-[380px] p-0 relative">
                <div className="absolute top-4 right-8 z-10 bg-white/50 backdrop-blur-md p-3 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Índice Atual</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-indigo-600">{(wellbeingStats?.averageScore || 0).toFixed(1)}</span>
                    <span className={cn(
                      "text-xs font-bold italic",
                      (wellbeingStats?.averageScore || 0) >= 4 ? "text-green-500" :
                        (wellbeingStats?.averageScore || 0) >= 3 ? "text-yellow-600" : "text-red-500"
                    )}>
                      {(wellbeingStats?.averageScore || 0) >= 4 ? 'Saudável' :
                        (wellbeingStats?.averageScore || 0) >= 3 ? 'Atenção' : 'Crítico'}
                    </span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pulseData} margin={{ top: 40, right: 30, left: 60, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorWave" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPulse" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="50%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#4f46e5" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis
                      domain={[0, 5]}
                      axisLine={false}
                      tickLine={false}
                      ticks={[1.5, 3.5, 4.5]}
                      tick={(props) => {
                        const { x, y, payload } = props;
                        let label = "";
                        let emoji = "";
                        if (payload.value === 1.5) { emoji = "😟"; label = "1.0 - 2.9"; }
                        if (payload.value === 3.5) { emoji = "😐"; label = "3.0 - 3.9"; }
                        if (payload.value === 4.5) { emoji = "😊"; label = "4.0 - 5.0"; }

                        return (
                          <g transform={`translate(${x},${y})`}>
                            <text x={-10} y={-5} textAnchor="end" fill="#64748b" fontSize="14">{emoji}</text>
                            <text x={-10} y={10} textAnchor="end" fill="#94a3b8" fontSize="9" fontWeight="700">{label}</text>
                          </g>
                        );
                      }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
                              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 opacity-80 mb-1">{payload[0].payload.date}</p>
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-lg">
                                  <Activity className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                  <p className="text-2xl font-black">{payload[0].value.toFixed(1)}</p>
                                  <p className="text-[10px] text-indigo-200/60 font-bold uppercase">Nível de Bem-estar</p>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceArea y1={0} y2={2.9} fill="#fee2e2" fillOpacity={0.4} />
                    <ReferenceArea y1={2.9} y2={3.9} fill="#fef9c3" fillOpacity={0.4} />
                    <ReferenceArea y1={3.9} y2={5} fill="#f0fdf4" fillOpacity={0.4} />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="url(#colorPulse)"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorWave)"
                      animationDuration={2000}
                    />
                  </AreaChart>
                </ResponsiveContainer>

                <div className="absolute bottom-6 left-8 right-8 grid grid-cols-3 gap-4">
                  <div className="p-3 bg-green-50 rounded-2xl border border-green-100/50 text-center">
                    <p className="text-[9px] font-black text-green-600 uppercase tracking-widest">Saudável</p>
                    <p className="text-xs font-bold text-green-800 mt-0.5">4.0 - 5.0</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-2xl border border-yellow-100/50 text-center">
                    <p className="text-[9px] font-black text-yellow-600 uppercase tracking-widest">Atenção</p>
                    <p className="text-xs font-bold text-yellow-800 mt-0.5">3.0 - 3.9</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-2xl border border-red-100/50 text-center">
                    <p className="text-[9px] font-black text-red-600 uppercase tracking-widest">Crítico</p>
                    <p className="text-xs font-bold text-red-800 mt-0.5">0.0 - 2.9</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {useThemeStore.getState().tenantTheme?.modules?.moduleAiAnalytics !== false && (
              <Card className="border-none shadow-sm h-[328px] bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-500" />
                    Análise Multidimensional
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[240px] flex items-center gap-4">
                  <div className="flex-1 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#f1f5f9" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                        <Radar
                          name="Nível"
                          dataKey="value"
                          stroke="#6366f1"
                          fill="#6366f1"
                          fillOpacity={0.5}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-2/5 space-y-4 pr-6">
                    {[
                      { label: 'Positivo', key: 'POSITIVE', color: 'bg-green-500', icon: Smile },
                      { label: 'Neutro', key: 'NEUTRAL', color: 'bg-slate-400', icon: Meh },
                      { label: 'Negativo', key: 'NEGATIVE', color: 'bg-rose-500', icon: Frown }
                    ].map((s) => {
                      const val = ((wellbeingStats?.sentimentDistribution[s.key] || 0) / totalCheckins) * 100;
                      return (
                        <div key={s.key} className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase">
                            <span className="flex items-center gap-1.5">
                              <s.icon className="w-3 h-3" />
                              {s.label}
                            </span>
                            <span>{val.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${s.color} rounded-full transition-all duration-1000`} style={{ width: `${val}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Dashboard Right: EAP Requests List */}
          <div className="lg:col-span-12 xl:col-span-5">
            <Card className="border-none shadow-sm h-[825px] flex flex-col bg-white overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <div className="w-2 h-6 bg-purple-500 rounded-full" />
                      Solicitações de Ajuda (EAP)
                    </CardTitle>
                    <p className="text-sm text-gray-500">Fila de atendimento prioritária</p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none px-3 py-1 font-bold">
                    {pendingRequests.length} PENDENTES
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide">
                {pendingRequests.length > 0 ? (
                  <div className="space-y-4">
                    {pendingRequests.map((req, idx) => {
                      return (
                        <div key={idx} className="group flex flex-col p-5 rounded-3xl border transition-all bg-white border-slate-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 opacity-20 group-hover:opacity-100 transition-opacity" />

                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                {req.employeePhotoUrl ? (
                                  <img src={req.employeePhotoUrl} alt={req.employeeName} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm" />
                                ) : (
                                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center text-purple-600 font-black text-lg uppercase shadow-sm">
                                    {req.employeeName?.substring(0, 2) || '?'}
                                  </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 leading-tight">{req.employeeName || 'Desconhecido'}</p>
                                <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-tight">
                                  {new Date(req.createdAt).toLocaleDateString()} • {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleMarkAsHandled(req.id)}
                              className="px-4 py-2 text-xs font-black bg-purple-600 text-white hover:bg-purple-700 rounded-1xl shadow-lg shadow-purple-600/20 transition-all active:scale-95 flex items-center gap-2"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Atender
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                              <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Humor</p>
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <div key={s} className={`w-2 h-3 rounded-full ${s <= req.score ? (req.score <= 2 ? 'bg-rose-500' : req.score >= 4 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-slate-200'}`} />
                                  ))}
                                </div>
                                <span className="text-sm font-black text-slate-700">{req.score}.0</span>
                              </div>
                            </div>
                            {useThemeStore.getState().tenantTheme?.modules?.moduleAiAnalytics !== false && (
                              <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                                <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Risco</p>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-black uppercase ${req.riskLevel === 'HIGH' ? 'text-rose-600' : 'text-blue-600'}`}>
                                    {translate(req.riskLevel)}
                                  </span>
                                  <div className={`w-2 h-2 rounded-full ${req.riskLevel === 'HIGH' ? 'bg-rose-500 animate-pulse' : 'bg-blue-500'}`} />
                                </div>
                              </div>
                            )}
                          </div>

                          {req.notes && (
                            <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50 group-hover:bg-indigo-50/50 transition-colors">
                              <p className="text-[9px] text-indigo-400 uppercase font-black tracking-widest mb-2">Relato do Colaborador</p>
                              <p className="text-sm text-gray-700 italic leading-relaxed font-medium">"{req.notes}"</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Tudo limpo por aqui</p>
                    <p className="text-sm text-slate-400 mt-2">Nenhuma solicitação pendente no momento.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  if (loading && isManagement) {
    return <div className="flex h-96 items-center justify-center text-gray-400">Carregando painel de gestão...</div>;
  }

  if (!isManagement) {
    return <CollaboratorDashboard />;
  }

  const ViewToggle = () => (
    <div className="relative p-1.5 bg-gradient-to-b from-white to-slate-50 border border-slate-200/80 rounded-2xl flex items-center shadow-lg shadow-slate-200/50 w-fit backdrop-blur-xl">
      {/* Animated Sliding Background */}
      <div
        className={`absolute top-1.5 bottom-1.5 rounded-xl shadow-md transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) z-0 ${viewMode === 'manager'
          ? 'left-1.5 w-[calc(50%-6px)] bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 shadow-indigo-300/40 translate-x-0'
          : 'left-1.5 w-[calc(50%-6px)] bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 shadow-blue-300/40 translate-x-[104%]'
          }`}
      />

      <button
        onClick={() => setViewMode('manager')}
        className={`relative z-10 flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 min-w-[150px] group ${viewMode === 'manager'
          ? 'text-white'
          : 'text-slate-500 hover:text-slate-800'
          }`}
      >
        <div className={`relative p-1.5 rounded-lg transition-all duration-300 ${viewMode === 'manager'
          ? 'bg-white/20 backdrop-blur-sm'
          : 'bg-slate-100 group-hover:bg-slate-200'
          }`}>
          <ShieldCheck className="w-4 h-4" />
          {viewMode === 'manager' && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400 border border-indigo-500"></span>
            </span>
          )}
        </div>
        <span className="tracking-tight">Visão Gestor</span>
      </button>

      <button
        onClick={() => setViewMode('collaborator')}
        className={`relative z-10 flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 min-w-[150px] group ${viewMode === 'collaborator'
          ? 'text-white'
          : 'text-slate-500 hover:text-slate-800'
          }`}
      >
        <div className={`relative p-1.5 rounded-lg transition-all duration-300 ${viewMode === 'collaborator'
          ? 'bg-white/20 backdrop-blur-sm'
          : 'bg-slate-100 group-hover:bg-slate-200'
          }`}>
          <LineChart className="w-4 h-4" />
          {viewMode === 'collaborator' && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400 border border-blue-500"></span>
            </span>
          )}
        </div>
        <span className="tracking-tight">Minha Visão</span>
      </button>
    </div>
  );

  if (viewMode === 'collaborator') {
    return <CollaboratorDashboard extraHeaderContent={<div className="scale-90 origin-right"><ViewToggle /></div>} />;
  }

  return (
    <div className="space-y-8">
      {/* Header Moderno com Toggle Integrado */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-lg shadow-indigo-200">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Painel de Gestão
              </h1>
              <p className="text-slate-500 font-medium">
                Bem-vindo, {user?.name?.split(' ')[0] || 'Gestor'}. Acompanhe os indicadores da organização.
              </p>
            </div>
          </div>
        </div>

        {/* Seletor em Posição de Destaque */}
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pr-2">Modo de Visualização</span>
          <ViewToggle />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-gray-100/80 rounded-lg w-full sm:w-fit overflow-x-auto no-scrollbar whitespace-nowrap">
        {[
          { id: 'geral', label: 'Geral', icon: BarChart3 },
          { id: 'hiring', label: 'Contratação & Retenção', icon: Users },
          { id: 'diversity', label: 'Diversidade', icon: Brain },
          { id: 'disponibilidade', label: 'Disponibilidade', icon: Calendar },
          { id: 'learning', label: 'Aprendizagem', icon: GraduationCap, module: 'moduleLearning' },
          { id: 'wellbeing', label: 'Bem-estar', icon: CheckCircle, module: 'modulePerformance' }
        ].filter(tab => {
          if (tab.module) {
            const { tenantTheme } = useThemeStore.getState();
            return tenantTheme?.modules?.[tab.module as keyof typeof tenantTheme.modules] !== false;
          }
          return true;
        }).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>


      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'geral' && renderGeralTab()}
        {activeTab === 'hiring' && renderHiringTab()}
        {activeTab === 'diversity' && renderDiversityTab()}
        {activeTab === 'learning' && renderLearningTab()}
        {activeTab === 'wellbeing' && renderWellbeingTab()}
        {activeTab === 'disponibilidade' && <AvailabilityDashboard />}
      </div>
    </div>
  );
}
