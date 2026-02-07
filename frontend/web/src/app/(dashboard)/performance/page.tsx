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
  const isRH = roles.includes('RH');
  const isManager = roles.includes('MANAGER') || roles.includes('GESTOR');
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
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* VISÃO DO GESTOR (Equipe) */}
          {isManager && (
            <section className="pt-4">
              <ManagerTeamView />
            </section>
          )}

          {/* VISÃO ADMINISTRATIVA (RH/ADMIN) */}
          {hasAdminAccess && (
            <section className={`space-y-10 ${isManager ? 'pt-12 border-t-2 border-slate-100' : 'pt-4'}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                  <Settings className="h-6 w-6 text-slate-400" />
                  Painel Administrativo
                </h2>
                <Link href="/performance/cycles/manage">
                  <Button variant="outline" size="sm" className="font-bold border-2 hover:bg-slate-50">
                    Configurações de Ciclos
                  </Button>
                </Link>
              </div>

              <TooltipProvider>
                <Card className="border-0 shadow-xl bg-white overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
                    <CardTitle className="text-xl font-bold text-slate-900">
                      Ferramentas de Gestão Global
                    </CardTitle>
                    <CardDescription>
                      Acesso rápido aos painéis de administração do RH
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <Link href="/performance/disc/manage">
                        <div className="group cursor-pointer space-y-4 rounded-xl p-4 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                          <div className="flex items-center justify-between">
                            <div className="p-3 rounded-lg bg-red-100 text-red-600 group-hover:scale-110 transition-transform">
                              <BrainCircuit className="h-6 w-6" />
                            </div>
                            <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg text-slate-900 mb-1">Painel DISC</h4>
                            <p className="text-sm text-slate-500 font-medium">Analytics global de perfis comportamentais</p>
                          </div>
                        </div>
                      </Link>

                      <Link href="/performance/pdi/manage">
                        <div className="group cursor-pointer space-y-4 rounded-xl p-4 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                          <div className="flex items-center justify-between">
                            <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform">
                              <TrendingUp className="h-6 w-6" />
                            </div>
                            <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg text-slate-900 mb-1">Painel PDI</h4>
                            <p className="text-sm text-slate-500 font-medium">Acompanhamento de planos de desenvolvimento</p>
                          </div>
                        </div>
                      </Link>

                      <Link href="/performance/cycles/manage">
                        <div className="group cursor-pointer space-y-4 rounded-xl p-4 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                          <div className="flex items-center justify-between">
                            <div className="p-3 rounded-lg bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
                              <ClipboardCheck className="h-6 w-6" />
                            </div>
                            <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg text-slate-900 mb-1">Ciclos de Avaliação</h4>
                            <p className="text-sm text-slate-500 font-medium">Gestão das janelas de avaliação 360 e 9box</p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </TooltipProvider>


            </section>
          )}
        </div>
      )}
    </div>
  );
}
