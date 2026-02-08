'use client';

import { useState, useEffect } from 'react';

import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BrainCircuit,
  ClipboardCheck,
  TrendingUp,
  Settings,
  Send,
  BarChart3,
  HelpCircle,
  LayoutDashboard,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { PerformanceAnalytics } from '@/components/performance/PerformanceAnalytics';
import { EmployeePerformanceView } from '@/components/performance/EmployeePerformanceView';
import { ManagerTeamView } from '@/components/performance/ManagerTeamView';

export default function PerformancePage() {
  const { user } = useAuthStore();

  const roles = user?.roles || [];
  const isAdmin = roles.includes('ADMIN');
  const isRH = roles.includes('RH') || roles.includes('GESTOR_RH') || roles.includes('ANALISTA_DP');
  const isManager = roles.includes('MANAGER') || roles.includes('GESTOR') || roles.includes('LIDER');
  const hasAdminAccess = isAdmin || isRH;

  const [viewMode, setViewMode] = useState<'employee' | 'manager'>('employee');

  useEffect(() => {
    if (hasAdminAccess || isManager) {
      setViewMode('manager');
    }
  }, [hasAdminAccess, isManager]);

  const canViewManagement = hasAdminAccess || isManager;

  return (
    <div className="space-y-8 pb-16">
      {/* Header Dinâmico */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight flex items-center gap-4 text-slate-900">
              <div className={`p-3 rounded-2xl shadow-xl transition-all duration-500 ${viewMode === 'manager'
                ? 'bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-500/30'
                : 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/30'
                }`}>
                {viewMode === 'manager' ? (
                  <LayoutDashboard className="h-8 w-8 text-white" />
                ) : (
                  <TrendingUp className="h-8 w-8 text-white" />
                )}
              </div>
              {viewMode === 'manager' ? 'Gestão de Performance' : 'Minha Performance'}
            </h1>
            <p className="text-lg text-slate-600 font-medium ml-1">
              {viewMode === 'manager'
                ? 'Painel de controle para gestores e RH'
                : 'Seu centro de desenvolvimento, metas e avaliações'}
            </p>
          </div>

          {canViewManagement && (
            <div className="flex bg-slate-100 p-1.5 rounded-xl shadow-inner self-start md:self-center">
              <button
                onClick={() => setViewMode('manager')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${viewMode === 'manager'
                  ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
              >
                <ShieldCheck className="h-4 w-4" />
                Visão Gestor
              </button>
              <button
                onClick={() => setViewMode('employee')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${viewMode === 'employee'
                  ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-black/5'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
              >
                <TrendingUp className="h-4 w-4" />
                Minha Visão
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 1. VISÃO DO COLABORADOR */}
      {viewMode === 'employee' && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <EmployeePerformanceView />
        </section>
      )}

      {/* 2. VISÃO DO GESTOR/RH */}
      {viewMode === 'manager' && canViewManagement && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700">

          {/* Indicadores Globais (RH/ADMIN) */}
          {hasAdminAccess && (
            <section className="animate-in fade-in slide-in-from-top-4 duration-500">
              <PerformanceAnalytics />
            </section>
          )}

          {/* VISÃO DO GESTOR (Equipe) */}
          {isManager && (
            <section className="relative">
              <ManagerTeamView />
            </section>
          )}

          {/* PAINEL DE CONTROLE DE FERRAMENTAS (RH/ADMIN) */}
          {hasAdminAccess && (
            <section className={`space-y-8 ${isManager ? 'pt-16 border-t-2 border-slate-100/50' : 'pt-4'}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black tracking-tighter text-slate-900 flex items-center gap-3">
                    <Settings className="h-8 w-8 text-indigo-500" />
                    Console de Administração
                  </h2>
                  <p className="text-slate-500 font-medium">Configurações globais e ferramentas do sistema de performance</p>
                </div>
                <Link href="/performance/cycles/manage">
                  <Button variant="outline" className="font-bold border-2 hover:bg-slate-50 rounded-xl px-6">
                    Módulos e Ciclos
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Link href="/performance/disc/manage">
                  <Card className="group cursor-pointer border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden bg-white ring-1 ring-slate-100 h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all duration-500">
                          <BrainCircuit className="h-7 w-7" />
                        </div>
                        <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-rose-50 transition-colors">
                          <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                      <CardTitle className="text-xl font-black group-hover:text-rose-600 transition-colors">Painel DISC</CardTitle>
                      <CardDescription className="text-sm font-medium leading-relaxed">
                        Gerencie perfis comportamentais e inteligência emocional do time.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                        <span>Acessar Analytics</span>
                        <div className="h-1 w-1 rounded-full bg-rose-200" />
                        <span className="text-slate-400">Dados Reais</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/performance/pdi/manage">
                  <Card className="group cursor-pointer border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden bg-white ring-1 ring-slate-100 h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
                          <TrendingUp className="h-7 w-7" />
                        </div>
                        <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                          <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                      <CardTitle className="text-xl font-black group-hover:text-emerald-600 transition-colors">Painel PDI</CardTitle>
                      <CardDescription className="text-sm font-medium leading-relaxed">
                        Acompanhe trilhas de desenvolvimento e crescimento individual.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                        <span>Gestão de Planos</span>
                        <div className="h-1 w-1 rounded-full bg-emerald-200" />
                        <span className="text-slate-400">Monitoramento</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/performance/cycles/manage">
                  <Card className="group cursor-pointer border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden bg-white ring-1 ring-slate-100 h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                          <ClipboardCheck className="h-7 w-7" />
                        </div>
                        <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                          <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                      <CardTitle className="text-xl font-black group-hover:text-blue-600 transition-colors">Avaliações</CardTitle>
                      <CardDescription className="text-sm font-medium leading-relaxed">
                        Ciclos de avaliação 360, competências e metodologia 9Box.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                        <span>Ciclos Ativos</span>
                        <div className="h-1 w-1 rounded-full bg-blue-200" />
                        <span className="text-slate-400">Configuração</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
