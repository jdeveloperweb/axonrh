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
    <div className="space-y-10 pb-12">
      {/* Header Dinâmico */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            Minha Performance
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            Seu centro de desenvolvimento, metas e avaliações
          </p>
        </div>

        {hasAdminAccess && (
          <Badge variant="outline" className="py-1.5 px-3 border-primary/20 bg-primary/5 text-primary flex items-center gap-2 w-fit">
            <ShieldCheck className="h-4 w-4" />
            Acesso Administrativo (RH)
          </Badge>
        )}
      </div>

      {/* 1. VISÃO DO COLABORADOR (Sempre visível para todos) */}
      <section>
        <EmployeePerformanceView />
      </section>

      {/* 2. VISÃO DO GESTOR (Se ele for gestor) */}
      {isManager && !hasAdminAccess && (
        <section className="pt-8 border-t border-slate-100">
          <ManagerTeamView />
        </section>
      )}

      {/* 3. VISÃO ADMINISTRATIVA (Apenas ADMIN ou RH) */}
      {hasAdminAccess && (
        <section className="space-y-8 pt-8 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight">Painel de Gestão (RH)</h2>
            <div className="flex gap-2">
              <Link href="/performance/cycles/manage">
                <Button variant="outline" size="sm">Configurações de Ciclos</Button>
              </Link>
            </div>
          </div>

          <TooltipProvider>
            <Card className="border-none shadow-premium bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Gerenciamento Global
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5 ml-2">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Área exclusiva para o RH gerenciar em toda a organização</p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
                <CardDescription>
                  Envie avaliações e acompanhe o desempenho da empresa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href="/performance/disc/manage">
                    <Card className="hover:shadow-md transition-all cursor-pointer h-full border-slate-100">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-2 rounded-lg bg-red-500/10">
                            <BrainCircuit className="h-5 w-5 text-red-500" />
                          </div>
                          <Badge variant="outline">DISC</Badge>
                        </div>
                        <h4 className="font-bold mb-1">Painel DISC</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Analytics global de perfis comportamentais
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          Gerenciar
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/performance/pdi/manage">
                    <Card className="hover:shadow-md transition-all cursor-pointer h-full border-slate-100">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-2 rounded-lg bg-green-500/10">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                          </div>
                          <Badge variant="outline">PDI</Badge>
                        </div>
                        <h4 className="font-bold mb-1">Painel PDI</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Acompanhamento global de planos de desenvolvimento
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          Gerenciar
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/performance/cycles/manage">
                    <Card className="hover:shadow-md transition-all cursor-pointer h-full border-slate-100">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-2 rounded-lg bg-blue-500/10">
                            <ClipboardCheck className="h-5 w-5 text-blue-500" />
                          </div>
                          <Badge variant="outline">Ciclos</Badge>
                        </div>
                        <h4 className="font-bold mb-1">Ciclos Ativos</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Gestão das janelas de avaliação 360 e 9box
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          Gerenciar
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TooltipProvider>

          {/* Analytics Global */}
          <div className="pt-4">
            <div className="mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
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
