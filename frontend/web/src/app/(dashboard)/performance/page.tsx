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
} from 'lucide-react';
import Link from 'next/link';

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      {/* Management Section */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gerenciamento (RH/Gestores)
          </CardTitle>
          <CardDescription>
            Envie avaliações e acompanhe o desempenho da equipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <Card className="hover:shadow-md transition-all cursor-pointer opacity-60">
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
        </CardContent>
      </Card>

      {/* Goals Section */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas e Objetivos
          </CardTitle>
          <CardDescription>
            Acompanhe suas metas e o progresso da equipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">Funcionalidade de metas em desenvolvimento</p>
            <Button variant="outline" disabled>
              Em breve
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
