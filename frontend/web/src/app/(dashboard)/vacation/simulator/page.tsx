'use client';

import { useState } from 'react';
import {
  Calculator,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  Info,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SimulationResult {
  vacationSalary: number;
  vacationBonus: number;
  sellValue: number;
  salary13th: number;
  grossTotal: number;
  inssDeduction: number;
  irrfDeduction: number;
  netTotal: number;
}

export default function VacationSimulatorPage() {
  const [baseSalary, setBaseSalary] = useState<number>(5000);
  const [vacationDays, setVacationDays] = useState<number>(30);
  const [sellDays, setSellDays] = useState<number>(0);
  const [advance13th, setAdvance13th] = useState<boolean>(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const calculateSimulation = () => {
    // Valor por dia
    const dailyRate = baseSalary / 30;

    // Ferias (proporcional aos dias)
    const vacationSalary = dailyRate * vacationDays;

    // 1/3 constitucional
    const vacationBonus = vacationSalary / 3;

    // Abono pecuniario (dias vendidos)
    const sellValue = sellDays > 0 ? (dailyRate * sellDays) + ((dailyRate * sellDays) / 3) : 0;

    // 13o adiantado (50%)
    const salary13th = advance13th ? baseSalary / 2 : 0;

    // Total bruto
    const grossTotal = vacationSalary + vacationBonus + sellValue + salary13th;

    // INSS (tabela 2024 simplificada)
    let inssDeduction = 0;
    if (grossTotal <= 1412) {
      inssDeduction = grossTotal * 0.075;
    } else if (grossTotal <= 2666.68) {
      inssDeduction = grossTotal * 0.09;
    } else if (grossTotal <= 4000.03) {
      inssDeduction = grossTotal * 0.12;
    } else {
      inssDeduction = Math.min(grossTotal * 0.14, 877.24);
    }

    // Base IRRF
    const irrfBase = grossTotal - inssDeduction;

    // IRRF (tabela 2024 simplificada)
    let irrfDeduction = 0;
    if (irrfBase <= 2259.20) {
      irrfDeduction = 0;
    } else if (irrfBase <= 2826.65) {
      irrfDeduction = (irrfBase * 0.075) - 169.44;
    } else if (irrfBase <= 3751.05) {
      irrfDeduction = (irrfBase * 0.15) - 381.44;
    } else if (irrfBase <= 4664.68) {
      irrfDeduction = (irrfBase * 0.225) - 662.77;
    } else {
      irrfDeduction = (irrfBase * 0.275) - 896.00;
    }

    if (irrfDeduction < 0) irrfDeduction = 0;

    // Total liquido
    const netTotal = grossTotal - inssDeduction - irrfDeduction;

    setResult({
      vacationSalary,
      vacationBonus,
      sellValue,
      salary13th,
      grossTotal,
      inssDeduction,
      irrfDeduction,
      netTotal,
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const resetSimulation = () => {
    setBaseSalary(5000);
    setVacationDays(30);
    setSellDays(0);
    setAdvance13th(false);
    setResult(null);
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Simulador de Férias</h1>
            <p className="text-muted-foreground">
              Calcule quanto você vai receber de férias
            </p>
          </div>
          <Button variant="outline" onClick={resetSimulation}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Limpar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Dados para Simulação
              </CardTitle>
              <CardDescription>
                Informe os valores para calcular suas férias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Salário Base */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="salary">Salário Base Mensal</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Seu salário bruto mensal (sem descontos)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id="salary"
                    type="number"
                    className="pl-10"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(Number(e.target.value))}
                    min={0}
                  />
                </div>
              </div>

              {/* Dias de Férias */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>Dias de Férias</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Quantidade de dias que você vai tirar de férias</p>
                        <p className="text-xs mt-1">Mínimo: 5 dias por fração (se fracionado)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="font-bold text-lg">{vacationDays} dias</span>
                </div>
                <Slider
                  value={[vacationDays]}
                  onValueChange={(value) => setVacationDays(value[0])}
                  min={5}
                  max={30}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5 dias</span>
                  <span>30 dias</span>
                </div>
              </div>

              {/* Abono Pecuniário */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>Vender dias (Abono Pecuniário)</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Você pode vender até 1/3 das férias (10 dias)</p>
                        <p className="text-xs mt-1">O valor é pago junto com as férias</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="font-bold text-lg">{sellDays} dias</span>
                </div>
                <Slider
                  value={[sellDays]}
                  onValueChange={(value) => setSellDays(value[0])}
                  min={0}
                  max={10}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0 dias</span>
                  <span>10 dias (máximo)</span>
                </div>
              </div>

              {/* Adiantamento 13º */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="advance13th">Adiantar 13º Salário</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Receba 50% do 13º junto com as férias</p>
                        <p className="text-xs mt-1">
                          A outra metade será paga em dezembro
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receber 50% antecipado junto com as férias
                  </p>
                </div>
                <Switch
                  id="advance13th"
                  checked={advance13th}
                  onCheckedChange={setAdvance13th}
                />
              </div>

              <Button className="w-full" size="lg" onClick={calculateSimulation}>
                <Calculator className="mr-2 h-4 w-4" />
                Calcular
              </Button>
            </CardContent>
          </Card>

          {/* Result Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Resultado da Simulação
              </CardTitle>
              <CardDescription>
                Valores estimados com base nas informações fornecidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-6">
                  {/* Proventos */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-green-600 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Proventos
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Férias ({vacationDays} dias)
                        </span>
                        <span className="font-medium">
                          {formatCurrency(result.vacationSalary)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">1/3 Constitucional</span>
                        <span className="font-medium">
                          {formatCurrency(result.vacationBonus)}
                        </span>
                      </div>
                      {result.sellValue > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Abono Pecuniário ({sellDays} dias)
                          </span>
                          <span className="font-medium">
                            {formatCurrency(result.sellValue)}
                          </span>
                        </div>
                      )}
                      {result.salary13th > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Adiantamento 13º (50%)
                          </span>
                          <span className="font-medium">
                            {formatCurrency(result.salary13th)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Total Bruto */}
                  <div className="flex justify-between text-lg">
                    <span className="font-medium">Total Bruto</span>
                    <span className="font-bold">{formatCurrency(result.grossTotal)}</span>
                  </div>

                  <Separator />

                  {/* Descontos */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-red-600 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Descontos
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">INSS</span>
                        <span className="font-medium text-red-600">
                          - {formatCurrency(result.inssDeduction)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IRRF</span>
                        <span className="font-medium text-red-600">
                          - {formatCurrency(result.irrfDeduction)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Total Líquido */}
                  <div className="p-4 rounded-lg bg-primary/10">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium">Total Líquido</span>
                      <span className="text-3xl font-bold text-primary">
                        {formatCurrency(result.netTotal)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Valor aproximado a receber 2 dias antes do início das férias
                    </p>
                  </div>

                  {/* Disclaimer */}
                  <p className="text-xs text-muted-foreground text-center">
                    * Valores estimados. O cálculo real pode variar de acordo com
                    outros descontos (vale-transporte, plano de saúde, pensão alimentícia, etc.)
                  </p>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Preencha os dados e clique em Calcular</p>
                  <p className="text-sm mt-2">
                    para ver a simulação dos valores das suas férias
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-primary" />
                Direito a Férias
              </h3>
              <p className="text-sm text-muted-foreground">
                Após 12 meses de trabalho (período aquisitivo), você tem direito a 30 dias de
                férias nos próximos 12 meses (período concessivo).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                1/3 Constitucional
              </h3>
              <p className="text-sm text-muted-foreground">
                Todo trabalhador tem direito a receber 1/3 a mais do salário durante as férias,
                conforme a Constituição Federal.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-500" />
                Fracionamento
              </h3>
              <p className="text-sm text-muted-foreground">
                As férias podem ser divididas em até 3 períodos, sendo que um deles deve ter
                no mínimo 14 dias e os demais no mínimo 5 dias cada.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
