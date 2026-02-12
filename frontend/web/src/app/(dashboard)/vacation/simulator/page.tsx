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
  Sparkles,
  Wallet,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  PieChart
} from 'lucide-react';
import { useRouter } from 'next/navigation';
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
    <TooltipProvider>
      <div className="container max-w-7xl py-10 space-y-12 animate-in fade-in duration-700">
        {/* Modern Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="h-14 w-14 rounded-2xl border-slate-100 bg-white shadow-sm hover:shadow-md transition-all"
            >
              <ArrowLeft className="h-6 w-6 text-slate-600" />
            </Button>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Painel Financeiro</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900">Simulador de <span className="text-primary italic">Benefícios</span></h1>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={resetSimulation}
            className="rounded-xl h-12 px-6 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Limpar Dados
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Inputs Section */}
          <div className="lg:col-span-7 space-y-10">
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-10 pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calculator className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black text-slate-900 uppercase">Configurar Simulação</CardTitle>
                    <CardDescription className="font-medium text-slate-400">Ajuste os valores para visualizar a estimativa.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-10 space-y-10">
                {/* Salário Base */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="salary" className="text-sm font-black text-slate-900 uppercase tracking-widest">Salário Base Mensal</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-slate-300" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-900 text-white border-none p-3 rounded-xl max-w-xs">
                        <p className="text-xs font-medium">Insira seu salário bruto mensal sem descontos para um cálculo mais preciso do seu benefício.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative group">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 group-focus-within:text-primary transition-colors">R$</span>
                    <Input
                      id="salary"
                      type="number"
                      className="h-20 pl-16 pr-8 text-3xl font-black bg-slate-50 border-none rounded-[1.5rem] focus:ring-primary/20 transition-all tabular-nums"
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(Number(e.target.value))}
                      min={0}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Dias de Férias */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">Tempo de Descanso</Label>
                      <span className="px-3 py-1 bg-primary/10 text-primary font-black text-sm rounded-lg tabular-nums">{vacationDays} dias</span>
                    </div>
                    <Slider
                      value={[vacationDays]}
                      onValueChange={(value) => setVacationDays(value[0])}
                      min={5}
                      max={30}
                      step={1}
                      className="py-4"
                    />
                    <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-tighter">
                      <span>Mín. 5</span>
                      <span>Máx. 30</span>
                    </div>
                  </div>

                  {/* Abono Pecuniário */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">Venda (Abono)</Label>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 font-black text-sm rounded-lg tabular-nums">{sellDays} dias</span>
                    </div>
                    <Slider
                      value={[sellDays]}
                      onValueChange={(value) => setSellDays(value[0])}
                      min={0}
                      max={10}
                      step={1}
                      className="py-4"
                    />
                    <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-tighter">
                      <span>Sem Venda</span>
                      <span>Limite 10</span>
                    </div>
                  </div>
                </div>

                {/* Adiantamento 13º */}
                <div className="group flex items-center justify-between p-8 rounded-[2rem] bg-slate-50 hover:bg-primary/5 transition-all cursor-pointer select-none" onClick={() => setAdvance13th(!advance13th)}>
                  <div className="flex items-center gap-6">
                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-all", advance13th ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white text-slate-300")}>
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-slate-900 uppercase text-xs tracking-widest">Adiantar 13º Salário</p>
                      <p className="text-xs font-medium text-slate-400">Receba 50% da gratificação agora.</p>
                    </div>
                  </div>
                  <Switch
                    checked={advance13th}
                    onCheckedChange={setAdvance13th}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>

                <Button
                  size="xl"
                  className="w-full rounded-2xl h-16 uppercase font-black tracking-widest shadow-xl shadow-primary/20 transition-transform active:scale-95 text-xs"
                  onClick={calculateSimulation}
                >
                  Calcular Estimativa
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-5 space-y-10">
            {result ? (
              <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-slate-900 text-white overflow-hidden animate-in zoom-in-95 duration-500">
                <CardHeader className="p-10">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <PieChart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black uppercase text-white">Resultado</CardTitle>
                      <CardDescription className="text-slate-400 font-medium">Detalhamento dos valores apurados.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-10 pt-0 space-y-10">
                  <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl space-y-2 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80">Total Líquido Estimado</p>
                    <h2 className="text-5xl font-black tracking-tighter tabular-nums text-white">
                      {formatCurrency(result.netTotal)}
                    </h2>
                  </div>

                  <div className="space-y-8">
                    {/* Proventos */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                        <TrendingUp className="h-3 w-3" />
                        Créditos (+)
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-2">
                          <span className="text-sm font-medium text-slate-400">Férias ({vacationDays}d)</span>
                          <span className="font-black tabular-nums">{formatCurrency(result.vacationSalary)}</span>
                        </div>
                        <div className="flex justify-between items-center px-2">
                          <span className="text-sm font-medium text-slate-400">1/3 Constitucional</span>
                          <span className="font-black tabular-nums">{formatCurrency(result.vacationBonus)}</span>
                        </div>
                        {result.sellValue > 0 && (
                          <div className="flex justify-between items-center px-2">
                            <span className="text-sm font-medium text-slate-400">Abono ({sellDays}d)</span>
                            <span className="font-black tabular-nums text-emerald-400">{formatCurrency(result.sellValue)}</span>
                          </div>
                        )}
                        {result.salary13th > 0 && (
                          <div className="flex justify-between items-center px-2">
                            <span className="text-sm font-medium text-slate-400">Adiantamento 50% 13º</span>
                            <span className="font-black tabular-nums text-primary">{formatCurrency(result.salary13th)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Descontos */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-500">
                        <TrendingDown className="h-3 w-3" />
                        Débitos (-)
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-2">
                          <span className="text-sm font-medium text-slate-400">Previdência (INSS)</span>
                          <span className="font-black tabular-nums text-rose-400">- {formatCurrency(result.inssDeduction)}</span>
                        </div>
                        <div className="flex justify-between items-center px-2">
                          <span className="text-sm font-medium text-slate-400">Imp. de Renda (IRRF)</span>
                          <span className="font-black tabular-nums text-rose-400">- {formatCurrency(result.irrfDeduction)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <div className="flex items-center gap-4 p-5 rounded-2xl bg-white text-slate-900 shadow-xl">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-tighter">Data Estimada do Crédito</p>
                        <p className="text-sm font-black">2 dias antes do início</p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-12 text-center space-y-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                <div className="relative">
                  <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                  <Calculator className="h-20 w-20 text-slate-300 relative" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Resultado Pendente</h3>
                  <p className="text-slate-400 font-medium max-w-[280px] mx-auto leading-relaxed">Preencha seus dados ao lado e clique em calcular para gerar sua simulação.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Calendar,
              title: 'Ciclo Aquisitivo',
              desc: 'Após 12 meses, você conquista 30 dias de descanso. O RH tem até 12 meses para concedê-los.',
              color: 'text-primary'
            },
            {
              icon: DollarSign,
              title: 'Direito Constitucional',
              desc: 'Todo período usufruído garante 1/3 extra sobre o salário, conforme a Constituição Federal.',
              color: 'text-emerald-500'
            },
            {
              icon: Info,
              title: 'Regras de Fracionamento',
              desc: 'Máximo de 3 períodos: um de pelo menos 14 dias e os demais com no mínimo 5 dias cada.',
              color: 'text-blue-500'
            }
          ].map((item, i) => (
            <div key={i} className="group p-8 rounded-[2rem] bg-white border-2 border-slate-50 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className={cn("h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", item.color === 'text-primary' ? 'bg-primary/5' : item.color === 'text-emerald-500' ? 'bg-emerald-50' : 'bg-blue-50')}>
                <item.icon className={cn("h-6 w-6", item.color)} />
              </div>
              <h4 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight leading-none">{item.title}</h4>
              <p className="text-sm font-medium text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

