'use client';

import {
  Users,
  Clock,
  Calendar,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';

// ==================== Types ====================

interface StatCard {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
}

// ==================== Component ====================

export default function DashboardPage() {
  const { user } = useAuthStore();

  // Dados mockados - em producao viriam da API
  const stats: StatCard[] = [
    {
      title: 'Total de Colaboradores',
      value: 248,
      change: 3.2,
      icon: Users,
      color: 'var(--color-primary)',
    },
    {
      title: 'Presentes Hoje',
      value: 231,
      change: -1.5,
      icon: Clock,
      color: 'var(--color-success)',
    },
    {
      title: 'Ferias este Mes',
      value: 12,
      icon: Calendar,
      color: 'var(--color-warning)',
    },
    {
      title: 'Pendencias',
      value: 8,
      change: -25,
      icon: AlertCircle,
      color: 'var(--color-error)',
    },
  ];

  const recentActivities = [
    { id: 1, text: 'Maria Silva solicitou ferias', time: '10 min atras' },
    { id: 2, text: 'Joao Santos registrou ponto', time: '25 min atras' },
    { id: 3, text: 'Novo colaborador admitido: Ana Costa', time: '1h atras' },
    { id: 4, text: 'Ciclo de avaliacao encerrado', time: '2h atras' },
  ];

  const upcomingEvents = [
    { id: 1, title: 'Reuniao de alinhamento', date: 'Hoje, 14:00' },
    { id: 2, title: 'Fechamento do ponto', date: 'Amanha' },
    { id: 3, title: 'Aniversario: Carlos Oliveira', date: '25/01' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Ola, {user?.name?.split(' ')[0] || 'Usuario'}!
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          Bem-vindo ao painel de gestao de RH
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    {stat.change !== undefined && (
                      <div
                        className={`flex items-center gap-1 mt-2 text-sm ${
                          stat.change >= 0
                            ? 'text-[var(--color-success)]'
                            : 'text-[var(--color-error)]'
                        }`}
                      >
                        {stat.change >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {Math.abs(stat.change)}%
                      </div>
                    )}
                  </div>
                  <div
                    className="p-3 rounded-[var(--radius-lg)]"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Atividades Recentes</CardTitle>
            <button className="link text-sm flex items-center gap-1">
              Ver todas <ArrowRight className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {recentActivities.map((activity) => (
                <li
                  key={activity.id}
                  className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0"
                >
                  <span className="text-sm">{activity.text}</span>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    {activity.time}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Proximos Eventos</CardTitle>
            <button className="link text-sm flex items-center gap-1">
              Ver calendario <ArrowRight className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {upcomingEvents.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0"
                >
                  <span className="text-sm font-medium">{event.title}</span>
                  <span className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-variant)] px-2 py-1 rounded">
                    {event.date}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acoes Rapidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="btn-outline py-4 flex flex-col items-center gap-2">
              <Users className="w-6 h-6" />
              <span className="text-sm">Novo Colaborador</span>
            </button>
            <button className="btn-outline py-4 flex flex-col items-center gap-2">
              <Clock className="w-6 h-6" />
              <span className="text-sm">Registrar Ponto</span>
            </button>
            <button className="btn-outline py-4 flex flex-col items-center gap-2">
              <Calendar className="w-6 h-6" />
              <span className="text-sm">Solicitar Ferias</span>
            </button>
            <button className="btn-outline py-4 flex flex-col items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              <span className="text-sm">Relatorios</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
