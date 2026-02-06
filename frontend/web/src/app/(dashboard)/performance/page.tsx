'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  ClipboardCheck,
  TrendingUp,
  ArrowRight,
  BrainCircuit,
  Settings,
  Send,
  BarChart3,
  HelpCircle,
  Award,
} from 'lucide-react';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

export default function PerformancePage() {
  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Gestão de Desempenho</h1>
          <p className="text-lg text-muted-foreground mt-1">
            Avaliações, metas e desenvolvimento profissional
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/performance/disc">
                <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-yellow-500 text-white">
                        <BrainCircuit className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold">Perfil DISC</h3>
                        <p className="text-xs text-muted-foreground">Avaliação comportamental</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full">
                      Acessar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Descubra seu perfil comportamental (Dominância, Influência, Estabilidade, Conformidade)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/performance/evaluations">
                <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        <ClipboardCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold">Avaliações 360°</h3>
                        <p className="text-xs text-muted-foreground">Feedback completo</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full">
                      Acessar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Receba e forneça feedback para seus pares, liderados e gestores</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/performance/pdi">
                <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                        <TrendingUp className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold">PDI</h3>
                        <p className="text-xs text-muted-foreground">Plano de desenvolvimento</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full">
                      Acessar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Crie e acompanhe seu Plano de Desenvolvimento Individual</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/performance/ninebox">
                <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
                        <BarChart3 className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold">Nine Box</h3>
                        <p className="text-xs text-muted-foreground">Matriz de talentos</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full">
                      Acessar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Visualize a matriz de Potencial vs Desempenho da equipe</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Management Section */}
      <TooltipProvider>
        <Card className="border-none shadow-lg bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Gerenciamento (RH/Gestores)
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-2">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Área exclusiva para gestão de ciclos e avaliações da equipe</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <CardDescription>
              Envie avaliações e acompanhe o desempenho da equipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/performance/disc/manage">
                    <Card className="hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-2 rounded-lg bg-red-500/10">
                            <BrainCircuit className="h-5 w-5 text-red-500" />
                          </div>
                          <Badge variant="outline">DISC</Badge>
                        </div>
                        <h4 className="font-bold mb-1">Gerenciar DISC</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Enviar e acompanhar avaliações comportamentais
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          <Send className="h-4 w-4 mr-2" />
                          Gerenciar
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Envie testes DISC para colaboradores e visualize os resultados consolidados</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/performance/pdi/manage">
                    <Card className="hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-2 rounded-lg bg-green-500/10">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                          </div>
                          <Badge variant="outline">PDI</Badge>
                        </div>
                        <h4 className="font-bold mb-1">Gerenciar PDI</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Enviar e acompanhar planos de desenvolvimento
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          <Send className="h-4 w-4 mr-2" />
                          Gerenciar
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Crie planos de desenvolvimento para colaboradores e acompanhe o progresso</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-not-allowed">
                    <Card className="hover:shadow-md transition-all opacity-60">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-2 rounded-lg bg-blue-500/10">
                            <ClipboardCheck className="h-5 w-5 text-blue-500" />
                          </div>
                          <Badge variant="outline">360°</Badge>
                        </div>
                        <h4 className="font-bold mb-1">Gerenciar Avaliações</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Criar ciclos e enviar avaliações 360°
                        </p>
                        <Button variant="outline" size="sm" className="w-full" disabled>
                          <Settings className="h-4 w-4 mr-2" />
                          Em breve
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Funcionalidade em desenvolvimento: Criação e gestão de ciclos 360°</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>

      {/* Analytics Section */}
      <TooltipProvider>
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Indicadores da Organização
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-2">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Visão geral da adesão aos programas de desempenho na empresa</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <CardDescription>
              Acompanhe a adesão e progresso dos colaboradores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* DISC Adhesion */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold flex items-center gap-2">
                      <BrainCircuit className="h-4 w-4 text-red-500" />
                      Adesão ao DISC
                    </h4>
                    <p className="text-xs text-muted-foreground">Colaboradores mapeados</p>
                  </div>
                  <span className="text-2xl font-black text-red-500">68%</span>
                </div>
                <Progress value={68} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>85/125 Colaboradores</span>
                  <span className="text-green-600 font-bold">+12% este mês</span>
                </div>
              </div>

              {/* PDI Active */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      PDIs Ativos
                    </h4>
                    <p className="text-xs text-muted-foreground">Planos em andamento</p>
                  </div>
                  <span className="text-2xl font-black text-green-500">45%</span>
                </div>
                <Progress value={45} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>56/125 Colaboradores</span>
                  <span className="text-amber-600 font-bold">Ação necessária</span>
                </div>
              </div>

              {/* High Potentials */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold flex items-center gap-2">
                      <Award className="h-4 w-4 text-purple-500" />
                      Novos Talentos
                    </h4>
                    <p className="text-xs text-muted-foreground">Identificados no ciclo</p>
                  </div>
                  <span className="text-2xl font-black text-purple-500">12</span>
                </div>
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-8 w-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                      U{i}
                    </div>
                  ))}
                  <div className="h-8 w-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                    +7
                  </div>
                </div>
                <div className="text-xs text-muted-foreground pt-1">
                  Colaboradores com desempenho excepcional
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    </div>
  );
}
