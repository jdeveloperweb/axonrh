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
  LineChart
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  ComposedChart, Line,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { dashboardApi, DashboardStats, LearningStats } from '@/lib/api/dashboard';
import { wellbeingApi, WellbeingStats } from '@/lib/api/wellbeing';
import { CollaboratorDashboard } from '@/components/dashboard/CollaboratorDashboard';

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
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
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

    const sentimentColors: Record<string, string> = {
      'Positivo': '#16A34A', // Green
      'Neutro': '#9CA3AF',   // Gray
      'Negativo': '#DC2626'  // Red
    };

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

    const handleMarkAsHandled = async (id: string) => {
      try {
        await wellbeingApi.markAsHandled(id);
        // Refresh data
        const wellbeingData = await wellbeingApi.getStats();
        setWellbeingStats(wellbeingData);
      } catch (error) {
        console.error('Error marking request as handled:', error);
      }
    };

    // Filter for Dashboard: Only show pending requests
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm h-[480px]">
            <CardHeader>
              <CardTitle>Estrela de Sentimentos</CardTitle>
              <p className="text-sm text-gray-500">Visão multidimensional do bem-estar</p>
            </CardHeader>
            <CardContent className="h-[400px] flex flex-col">
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Nível"
                      dataKey="value"
                      stroke="#4F46E5"
                      fill="#4F46E5"
                      fillOpacity={0.4}
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Mini Sentiment Breakdown */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { label: 'Positivo', key: 'POSITIVE', color: 'bg-green-500' },
                  { label: 'Neutro', key: 'NEUTRAL', color: 'bg-gray-400' },
                  { label: 'Negativo', key: 'NEGATIVE', color: 'bg-red-500' }
                ].map((s) => {
                  const val = ((wellbeingStats?.sentimentDistribution[s.key] || 0) / totalCheckins) * 100;
                  return (
                    <div key={s.key} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        <span>{s.label}</span>
                        <span>{val.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${s.color} transition-all duration-500`}
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm h-[480px] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Solicitações de Ajuda (EAP)</CardTitle>
                <p className="text-sm text-gray-500">Fila de atendimento prioritária</p>
              </div>
            </CardHeader>
            <CardContent className="h-[400px] overflow-y-auto pr-2">
              {pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {pendingRequests.map((req, idx) => {
                    return (
                      <div key={idx} className="flex flex-col p-4 rounded-xl border transition-all bg-white border-purple-100 shadow-sm border-l-4 border-l-purple-500">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {req.employeePhotoUrl ? (
                                <img src={req.employeePhotoUrl} alt={req.employeeName} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold uppercase">
                                  {req.employeeName?.substring(0, 2) || '?'}
                                </div>
                              )}
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 leading-none">{req.employeeName || 'Desconhecido'}</p>
                              <p className="text-xs text-gray-500 mt-1">{new Date(req.createdAt).toLocaleDateString()} às {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleMarkAsHandled(req.id)}
                            className="px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Atender
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Humor</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <div key={s} className={`w-1.5 h-2.5 rounded-sm ${s <= req.score ? (req.score <= 2 ? 'bg-red-400' : req.score >= 4 ? 'bg-green-400' : 'bg-yellow-400') : 'bg-gray-200'}`} />
                                ))}
                              </div>
                              <span className="text-xs font-medium text-gray-700">{req.score}/5</span>
                            </div>
                          </div>
                          <div className="px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Análise IA</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-xs font-bold ${req.sentiment === 'POSITIVE' ? 'text-green-600' : req.sentiment === 'NEGATIVE' ? 'text-red-600' : 'text-gray-600'}`}>
                                {req.sentiment === 'POSITIVE' ? 'Positivo' : req.sentiment === 'NEGATIVE' ? 'Negativo' : 'Neutro'}
                              </span>
                              <span className="text-gray-300">|</span>
                              <span className={`text-[10px] font-bold uppercase ${req.riskLevel === 'HIGH' ? 'text-red-500' : 'text-blue-500'}`}>
                                {translate(req.riskLevel)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {req.notes && (
                          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                            <p className="text-[10px] text-blue-400 uppercase font-bold mb-1">Relato do Colaborador</p>
                            <p className="text-sm text-gray-700 italic leading-relaxed">"{req.notes}"</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                  <div className="p-4 bg-green-50 rounded-full mb-4">
                    <CheckCircle className="w-12 h-12 text-green-400" />
                  </div>
                  <p className="font-medium text-gray-600">Nada pendente!</p>
                  <p className="text-sm text-center px-8">Todas as solicitações de contato já foram atendidas. Consulte o histórico no menu "Saúde Mental".</p>
                </div>
              )}
            </CardContent>
          </Card>
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
    <div className="bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm flex items-center gap-1">
      <button
        onClick={() => setViewMode('manager')}
        className={`relative flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${viewMode === 'manager'
          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-100'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
      >
        <ShieldCheck className={`w-4 h-4 ${viewMode === 'manager' ? 'text-indigo-100' : ''}`} />
        Visão Gestor
      </button>
      <button
        onClick={() => setViewMode('collaborator')}
        className={`relative flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${viewMode === 'collaborator'
          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-200 ring-2 ring-blue-100'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
      >
        <LineChart className={`w-4 h-4 ${viewMode === 'collaborator' ? 'text-blue-100' : ''}`} />
        Minha Visão
      </button>
    </div>
  );

  if (viewMode === 'collaborator') {
    return <CollaboratorDashboard extraHeaderContent={<ViewToggle />} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {user?.name?.split(' ')[0] || 'Usuário'}!
          </h1>
          <p className="text-gray-500">
            Bem-vindo ao painel de gestão.
          </p>
        </div>
        <ViewToggle />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-gray-100/80 rounded-lg w-full sm:w-fit overflow-x-auto no-scrollbar whitespace-nowrap">
        {[
          { id: 'geral', label: 'Geral', icon: BarChart3 },
          { id: 'hiring', label: 'Contratação & Retenção', icon: Users },
          { id: 'diversity', label: 'Diversidade', icon: Brain },
          { id: 'learning', label: 'Aprendizagem', icon: GraduationCap },
          { id: 'wellbeing', label: 'Bem-estar', icon: CheckCircle }
        ].map((tab) => {
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
      </div>
    </div>
  );
}
