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
  Clock as ClockIcon
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  ComposedChart, Line
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
  'PENDING': 'Pendente'
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

  const roles = user?.roles || [];
  const isManagement = roles.includes('ADMIN') || roles.includes('RH');

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
          <Card className="border-none shadow-sm h-[400px]">
            <CardHeader>
              <CardTitle>Mapa de Sentimentos</CardTitle>
              <p className="text-sm text-gray-500">Distribuição geral dos check-ins</p>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={sentimentColors[entry.name] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm h-[400px] overflow-hidden">
            <CardHeader>
              <CardTitle>Solicitações de Ajuda (EAP)</CardTitle>
              <p className="text-sm text-gray-500">Pedidos de contato recentes</p>
            </CardHeader>
            <CardContent className="h-[320px] overflow-y-auto pr-2">
              {wellbeingStats?.eapRequests && wellbeingStats.eapRequests.length > 0 ? (
                <div className="space-y-4">
                  {wellbeingStats.eapRequests.map((req, idx) => (
                    <div key={idx} className="flex items-start p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-purple-100 rounded-full mr-3">
                        <Users className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium text-gray-900">Colaborador ID: {req.employeeId.substring(0, 8)}...</p>
                          <span className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Score: {req.score} | Risco: {translate(req.riskLevel)}</p>
                        {req.notes && <p className="text-xs text-gray-500 italic mt-1">"{req.notes}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <CheckCircle className="w-12 h-12 mb-2 text-green-500" />
                  <p>Nenhuma solicitação pendente.</p>
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
