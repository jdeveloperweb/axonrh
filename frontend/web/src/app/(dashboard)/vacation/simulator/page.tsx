'use client';

import { useState } from 'react';
import {
  Calculator,
  DollarSign,
  Calendar,
  Info,
  RefreshCw,
  Wallet,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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
  const router = useRouter();
  const [baseSalary, setBaseSalary] = useState<number>(5000);
  const [vacationDays, setVacationDays] = useState<number>(30);
  const [sellDays, setSellDays] = useState<number>(0);
  const [advance13th, setAdvance13th] = useState<boolean>(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const calculateSimulation = () => {
    const dailyRate = baseSalary / 30;
    const vacationSalary = dailyRate * vacationDays;
    const vacationBonus = vacationSalary / 3;
    const sellValue = sellDays > 0 ? (dailyRate * sellDays) + ((dailyRate * sellDays) / 3) : 0;
    const salary13th = advance13th ? baseSalary / 2 : 0;
    const grossTotal = vacationSalary + vacationBonus + sellValue + salary13th;

    let inssDeduction = 0;
    if (grossTotal <= 1412) inssDeduction = grossTotal * 0.075;
    else if (grossTotal <= 2666.68) inssDeduction = grossTotal * 0.09;
    else if (grossTotal <= 4000.03) inssDeduction = grossTotal * 0.12;
    else inssDeduction = Math.min(grossTotal * 0.14, 877.24);

    const irrfBase = grossTotal - inssDeduction;
    let irrfDeduction = 0;
    if (irrfBase <= 2259.20) irrfDeduction = 0;
    else if (irrfBase <= 2826.65) irrfDeduction = (irrfBase * 0.075) - 169.44;
    else if (irrfBase <= 3751.05) irrfDeduction = (irrfBase * 0.15) - 381.44;
    else if (irrfBase <= 4664.68) irrfDeduction = (irrfBase * 0.225) - 662.77;
    else irrfDeduction = (irrfBase * 0.275) - 896.00;

    if (irrfDeduction < 0) irrfDeduction = 0;
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
    <div className="p-6 space-y-6 animate-in fade-in duration-500">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Simulador de Férias</h1>
            <p className="text-[var(--color-text-secondary)]">
              Calcule o valor estimado dos seus benefícios de férias.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={resetSimulation}
          className="text-sm font-medium text-gray-500 hover:text-gray-900 gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Limpar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Inputs Section */}
        <div className="lg:col-span-8">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--color-primary)]/10">
                  <Calculator className="h-5 w-5 text-[var(--color-primary)]" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Configurar Simulação</CardTitle>
                  <CardDescription>Ajuste os valores para visualizar a estimativa.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Salário Base */}
              <div className="space-y-2">
                <Label htmlFor="salary" className="text-sm font-medium text-gray-700">Salário Base Mensal</Label>
                <Input
                  id="salary"
                  type="number"
                  className="h-12 text-lg font-bold bg-gray-50 border-gray-200 rounded-lg focus:border-[var(--color-primary)] tabular-nums"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(Number(e.target.value))}
                  min={0}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dias de Férias */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700">Tempo de Descanso</Label>
                    <span className="text-sm font-bold text-[var(--color-primary)]">{vacationDays} dias</span>
                  </div>
                  <Slider
                    value={[vacationDays]}
                    onValueChange={(value) => setVacationDays(value[0])}
                    min={5}
                    max={30}
                    step={1}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Mín. 5</span>
                    <span>Máx. 30</span>
                  </div>
                </div>

                {/* Abono Pecuniário */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700">Venda (Abono)</Label>
                    <span className="text-sm font-bold text-emerald-600">{sellDays} dias</span>
                  </div>
                  <Slider
                    value={[sellDays]}
                    onValueChange={(value) => setSellDays(value[0])}
                    min={0}
                    max={10}
                    step={1}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Sem venda</span>
                    <span>Limite 10</span>
                  </div>
                </div>
              </div>

              {/* Adiantamento 13º */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center transition-all", advance13th ? "bg-[var(--color-primary)] text-white shadow-md" : "bg-white text-gray-400 border border-gray-200")}>
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Adiantar 13º Salário</p>
                    <p className="text-xs text-gray-400">Receba 50% da gratificação agora.</p>
                  </div>
                </div>
                <Switch
                  checked={advance13th}
                  onCheckedChange={setAdvance13th}
                />
              </div>

              <Button
                className="w-full rounded-lg h-12 font-bold text-sm bg-[var(--color-primary)] hover:opacity-90 transition-opacity"
                onClick={calculateSimulation}
              >
                Calcular Estimativa
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-4">
          {result ? (
            <Card className="border-none bg-gray-900 text-white shadow-lg animate-in fade-in duration-300">
              <CardContent className="p-6 space-y-6">
                <div className="text-center space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">Líquido Estimado</p>
                  <h2 className="text-3xl font-bold tabular-nums">
                    {formatCurrency(result.netTotal)}
                  </h2>
                </div>

                <Separator className="bg-white/10" />

                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Proventos (+)</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Férias ({vacationDays}d)</span>
                        <span className="font-bold tabular-nums">{formatCurrency(result.vacationSalary)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">1/3 Constitucional</span>
                        <span className="font-bold tabular-nums">{formatCurrency(result.vacationBonus)}</span>
                      </div>
                      {result.sellValue > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Abono ({sellDays}d)</span>
                          <span className="font-bold tabular-nums text-emerald-400">{formatCurrency(result.sellValue)}</span>
                        </div>
                      )}
                      {result.salary13th > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Adto 50% 13º</span>
                          <span className="font-bold tabular-nums text-[var(--color-primary)]">{formatCurrency(result.salary13th)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">Descontos (-)</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">INSS</span>
                        <span className="font-bold tabular-nums text-rose-400">{formatCurrency(result.inssDeduction)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">IRRF</span>
                        <span className="font-bold tabular-nums text-rose-400">{formatCurrency(result.irrfDeduction)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-lg border border-white/10 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-medium uppercase">Pagamento Estimado</p>
                    <p className="font-bold text-sm">2 dias antes do início</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50">
              <Calculator className="h-10 w-10 text-gray-200 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">Resultado Pendente</h3>
              <p className="text-sm text-gray-400 max-w-[200px]">Preencha seus dados e clique em calcular.</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: Calendar,
            title: 'Ciclo Aquisitivo',
            desc: 'Após 12 meses, você conquista 30 dias de descanso. O RH tem até 12 meses para concedê-los.',
            color: 'text-[var(--color-primary)]',
            bg: 'bg-blue-50'
          },
          {
            icon: DollarSign,
            title: 'Direito Constitucional',
            desc: 'Todo período usufruído garante 1/3 extra sobre o salário, conforme a Constituição Federal.',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
          },
          {
            icon: Info,
            title: 'Regras de Fracionamento',
            desc: 'Máximo de 3 períodos: um de pelo menos 14 dias e os demais com no mínimo 5 dias cada.',
            color: 'text-purple-600',
            bg: 'bg-purple-50'
          }
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-sm bg-white hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center mb-4", item.bg)}>
                <item.icon className={cn("h-5 w-5", item.color)} />
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">{item.title}</h4>
              <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
