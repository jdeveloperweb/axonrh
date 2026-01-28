'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  Calendar,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  UserCheck,
  UserMinus,
  Briefcase
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { dashboardApi, DashboardStats } from '@/lib/api/dashboard';

// ==================== Types ====================

interface StatCard {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ElementType;
  color: string; // Hex or var
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// ==================== Component ====================

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('geral');

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await dashboardApi.getStats();
        setStatsData(data);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // --- Data Transformation for Charts ---

  // Gender Data for Donut Chart
  const genderData = statsData?.genderDistribution
    ? Object.entries(statsData.genderDistribution).map(([name, value]) => ({ name, value }))
    : [];

  // Race Data for Bar Chart
  const raceData = statsData?.raceDistribution
    ? Object.entries(statsData.raceDistribution).map(([name, value]) => ({ name, value }))
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
            <CardContent className="h-[320px] flex items-center justify-center text-gray-400">
              <p>Gráfico de histórico em desenvolvimento</p>
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

  if (loading) {
    return <div className="flex h-96 items-center justify-center">Carregando dashboard...</div>;
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
      <div className="flex items-center gap-2 bg-white p-1 rounded-lg w-fit shadow-sm border border-gray-100">
        {[
          { id: 'geral', label: 'Geral' },
          { id: 'hiring', label: 'Contratação & Retenção' },
          { id: 'diversity', label: 'Diversidade' },
          { id: 'learning', label: 'Aprendizagem' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                ? 'bg-white shadow text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'geral' && renderGeralTab()}
        {activeTab === 'diversity' && renderDiversityTab()}
        {/* Placeholders for other tabs */}
        {(activeTab === 'hiring' || activeTab === 'learning') && (
          <div className="flex items-center justify-center h-60 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">Módulo em desenvolvimento</p>
          </div>
        )}
      </div>
    </div>
  );
}
