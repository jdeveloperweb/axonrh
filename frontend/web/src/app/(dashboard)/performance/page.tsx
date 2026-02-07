'use client';

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

  return (
    <div className="space-y-12 pb-16">
      {/* Header Dinâmico */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight flex items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-900 bg-clip-text text-transparent">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-xl shadow-indigo-500/30">
              <LayoutDashboard className="h-9 w-9 text-white" />
            </div>
            Minha Performance
          </h1>
          <p className="text-lg text-slate-600 font-medium ml-1">
            Seu centro de desenvolvimento, metas e avaliações
          </p>
        </div>

        {hasAdminAccess && (
          <Badge variant="outline" className="py-3 px-5 border-2 border-indigo-400/50 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 flex items-center gap-2 w-fit shadow-lg shadow-indigo-200/50 rounded-full backdrop-blur-sm">
            <ShieldCheck className="h-5 w-5" />
            <span className="font-bold">Acesso Administrativo (RH)</span>
          </Badge>
        )}
      </div>

      {/* 1. VISÃO DO COLABORADOR (Sempre visível para todos) */}
      <section>
        <EmployeePerformanceView />
      </section>

      {/* 2. VISÃO DO GESTOR (Se ele for gestor) */}
      {isManager && !hasAdminAccess && (
        <section className="pt-12 border-t-2 border-slate-100">
          <ManagerTeamView />
        </section>
      )}

      {/* 3. VISÃO ADMINISTRATIVA (Apenas ADMIN ou RH) */}
      {hasAdminAccess && (
        <section className="space-y-10 pt-12 border-t-2 border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Painel de Gestão (RH)</h2>
            <div className="flex gap-3">
              <Link href="/performance/cycles/manage">
                <Button variant="outline" size="sm" className="font-bold border-2 hover:bg-slate-50 shadow-md hover:shadow-lg transition-all duration-300">
                  Configurações de Ciclos
                </Button>
              </Link>
            </div>
          </div>

          <TooltipProvider>
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50 overflow-hidden group hover:shadow-3xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-black">
                  <div className="p-3 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl shadow-lg shadow-slate-500/30">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-slate-900">Gerenciamento Global</div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 -mt-1">
                          <HelpCircle className="h-5 w-5 text-slate-400 hover:text-slate-600 transition-colors" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Área exclusiva para o RH gerenciar em toda a organização</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardTitle>
                <CardDescription className="text-base font-medium text-slate-600 ml-1">
                  Envie avaliações e acompanhe o desempenho da empresa
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Link href="/performance/disc/manage">
                    <Card className="group/card border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 cursor-pointer h-full overflow-hidden hover:-translate-y-2">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-pink-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                      <CardContent className="pt-8 pb-6 relative">
                        <div className="flex items-center justify-between mb-6">
                          <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 shadow-xl shadow-red-500/40 group-hover/card:scale-110 group-hover/card:rotate-3 transition-all duration-500">
                            <BrainCircuit className="h-7 w-7 text-white" />
                          </div>
                          <Badge variant="outline" className="font-bold border-2 border-red-400/50 bg-red-50 text-red-700 px-3 py-1">DISC</Badge>
                        </div>
                        <h4 className="font-black text-xl mb-2 text-slate-900">Painel DISC</h4>
                        <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed">
                          Analytics global de perfis comportamentais
                        </p>
                        <Button variant="outline" size="sm" className="w-full font-bold border-2 hover:bg-slate-50 shadow-md hover:shadow-lg transition-all duration-300 group-hover/card:border-red-500 group-hover/card:text-red-700">
                          Gerenciar
                          <ArrowRight className="h-4 w-4 ml-2 group-hover/card:translate-x-1 transition-transform" />
                        </Button>
                      </CardContent>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-pink-600 transform scale-x-0 group-hover/card:scale-x-100 transition-transform duration-500" />
                    </Card>
                  </Link>

                  <Link href="/performance/pdi/manage">
                    <Card className="group/card border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 cursor-pointer h-full overflow-hidden hover:-translate-y-2">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-green-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                      <CardContent className="pt-8 pb-6 relative">
                        <div className="flex items-center justify-between mb-6">
                          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-xl shadow-emerald-500/40 group-hover/card:scale-110 group-hover/card:rotate-3 transition-all duration-500">
                            <TrendingUp className="h-7 w-7 text-white" />
                          </div>
                          <Badge variant="outline" className="font-bold border-2 border-emerald-400/50 bg-emerald-50 text-emerald-700 px-3 py-1">PDI</Badge>
                        </div>
                        <h4 className="font-black text-xl mb-2 text-slate-900">Painel PDI</h4>
                        <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed">
                          Acompanhamento global de planos de desenvolvimento
                        </p>
                        <Button variant="outline" size="sm" className="w-full font-bold border-2 hover:bg-slate-50 shadow-md hover:shadow-lg transition-all duration-300 group-hover/card:border-emerald-500 group-hover/card:text-emerald-700">
                          Gerenciar
                          <ArrowRight className="h-4 w-4 ml-2 group-hover/card:translate-x-1 transition-transform" />
                        </Button>
                      </CardContent>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-green-600 transform scale-x-0 group-hover/card:scale-x-100 transition-transform duration-500" />
                    </Card>
                  </Link>

                  <Link href="/performance/cycles/manage">
                    <Card className="group/card border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 cursor-pointer h-full overflow-hidden hover:-translate-y-2">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                      <CardContent className="pt-8 pb-6 relative">
                        <div className="flex items-center justify-between mb-6">
                          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/40 group-hover/card:scale-110 group-hover/card:rotate-3 transition-all duration-500">
                            <ClipboardCheck className="h-7 w-7 text-white" />
                          </div>
                          <Badge variant="outline" className="font-bold border-2 border-blue-400/50 bg-blue-50 text-blue-700 px-3 py-1">Ciclos</Badge>
                        </div>
                        <h4 className="font-black text-xl mb-2 text-slate-900">Ciclos Ativos</h4>
                        <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed">
                          Gestão das janelas de avaliação 360 e 9box
                        </p>
                        <Button variant="outline" size="sm" className="w-full font-bold border-2 hover:bg-slate-50 shadow-md hover:shadow-lg transition-all duration-300 group-hover/card:border-blue-500 group-hover/card:text-blue-700">
                          Gerenciar
                          <ArrowRight className="h-4 w-4 ml-2 group-hover/card:translate-x-1 transition-transform" />
                        </Button>
                      </CardContent>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 transform scale-x-0 group-hover/card:scale-x-100 transition-transform duration-500" />
                    </Card>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TooltipProvider>

          {/* Analytics Global */}
          <div className="pt-6">
            <div className="mb-6">
              <h3 className="text-2xl font-black flex items-center gap-3 text-slate-900">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg shadow-purple-500/30">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                Estatísticas da Organização
              </h3>
            </div>
            <PerformanceAnalytics />
          </div>
        </section>
      )}
    </div>
  );
}
