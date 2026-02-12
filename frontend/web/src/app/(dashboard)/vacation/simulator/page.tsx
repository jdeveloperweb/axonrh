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
      <div className="w-full px-6 lg:px-10 py-10 space-y-10 animate-in fade-in duration-700">

        {/* Header following Design System Screenshot */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="h-12 w-12 rounded-full border-slate-200 bg-white shadow-sm hover:shadow-md transition-all flex items-center justify-center"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#FF7A00]" />
                <span className="text-[10px] font-black text-[#FF7A00] uppercase tracking-[0.3em]">Painel Financeiro</span>
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-900 leading-none">
                Simulador de <span className="text-[#FF7A00] italic">Benefícios</span>
              </h1>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={resetSimulation}
            className="rounded-xl h-10 px-4 font-black text-[10px] uppercase tracking-widest text-slate-300 hover:text-slate-900 transition-all gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Limpar Dados
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Inputs Section */}
          <div className="lg:col-span-12 xl:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
              <div className="md:col-span-12">
                <Card className="border-2 border-slate-100 shadow-xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden bg-white">
                  <CardHeader className="p-10 pb-6 border-b border-slate-50">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-[#FF7A00]/10 flex items-center justify-center">
                        <Calculator className="h-6 w-6 text-[#FF7A00]" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Configurar Simulação</CardTitle>
                        <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ajuste os valores para visualizar a estimativa.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-10 space-y-12">
                    {/* Salário Base */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between ml-1">
                        <Label htmlFor="salary" className="text-xs font-black text-slate-900 uppercase tracking-widest">Salário Base Mensal</Label>
                        <Info className="h-4 w-4 text-slate-200" />
                      </div>
                      <div className="relative group">
                        <Input
                          id="salary"
                          type="number"
                          className="h-24 pl-10 pr-10 text-4xl font-black bg-slate-50/50 border-transparent rounded-[1.5rem] focus:bg-white focus:border-[#FF7A00]/20 transition-all tabular-nums placeholder:text-slate-100"
                          value={baseSalary}
                          onChange={(e) => setBaseSalary(Number(e.target.value))}
                          min={0}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      {/* Dias de Férias */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempo de Descanso</Label>
                          <span className="text-[#FF7A00] font-black text-sm uppercase">{vacationDays} dias</span>
                        </div>
                        <Slider
                          value={[vacationDays]}
                          onValueChange={(value) => setVacationDays(value[0])}
                          min={5}
                          max={30}
                          step={1}
                          className="py-4"
                        />
                        <div className="flex justify-between text-[10px] font-black text-slate-200 uppercase tracking-tighter">
                          <span>MÍN. 5</span>
                          <span>MÁX. 30</span>
                        </div>
                      </div>

                      {/* Abono Pecuniário */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Venda (Abono)</Label>
                          <span className="text-emerald-500 font-black text-sm uppercase">{sellDays} dias</span>
                        </div>
                        <Slider
                          value={[sellDays]}
                          onValueChange={(value) => setSellDays(value[0])}
                          min={0}
                          max={10}
                          step={1}
                          className="py-4"
                        />
                        <div className="flex justify-between text-[10px] font-black text-slate-200 uppercase tracking-tighter">
                          <span>SEM VENDA</span>
                          <span>LIMITE 10</span>
                        </div>
                      </div>
                    </div>

                    {/* Adiantamento 13º */}
                    <div className="flex items-center justify-between p-10 rounded-[2.5rem] bg-slate-50/50 border-2 border-transparent hover:border-slate-100 transition-all group">
                      <div className="flex items-center gap-8">
                        <div className={cn("h-16 w-16 rounded-[1.5rem] flex items-center justify-center transition-all", advance13th ? "bg-[#FF7A00] text-white shadow-xl shadow-[#FF7A00]/30" : "bg-white text-slate-200 border border-slate-50 shadow-sm group-hover:scale-110")}>
                          <Wallet className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-slate-900 uppercase text-xs tracking-widest">Adiantar 13º Salário</p>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.05em]">Receba 50% da gratificação agora.</p>
                        </div>
                      </div>
                      <Switch
                        checked={advance13th}
                        onCheckedChange={setAdvance13th}
                        className="data-[state=checked]:bg-[#FF7A00]"
                      />
                    </div>

                    <Button
                      size="xl"
                      className="w-full rounded-[1.5rem] h-20 uppercase font-black tracking-[0.2em] shadow-2xl shadow-[#FF7A00]/20 transition-all active:scale-95 text-sm bg-[#FF7A00] hover:bg-[#FF7A00]/90"
                      onClick={calculateSimulation}
                    >
                      Calcular Estimativa
                      <ChevronRight className="ml-3 h-5 w-5" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-12 xl:col-span-4">
            {result ? (
              <div className="space-y-8 animate-in zoom-in-95 duration-500">
                <div className="relative group">
                  <div className="absolute -inset-2 bg-[#FF7A00]/20 rounded-[3rem] blur-xl opacity-50" />
                  <Card className="relative border-none bg-slate-900 rounded-[3rem] text-white overflow-hidden shadow-2xl">
                    <div className="p-12 space-y-12">
                      <div className="space-y-2 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF7A00]">Líquido Estimado</p>
                        <h2 className="text-6xl font-black tracking-tighter tabular-nums">
                          {formatCurrency(result.netTotal)}
                        </h2>
                      </div>

                      <Separator className="bg-white/5" />

                      <div className="space-y-10">
                        <div className="space-y-5">
                          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-500">Proventos (+)</p>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center px-2">
                              <span className="text-xs font-bold text-slate-500">FÉRIAS ({vacationDays}d)</span>
                              <span className="font-black tabular-nums">{formatCurrency(result.vacationSalary)}</span>
                            </div>
                            <div className="flex justify-between items-center px-2">
                              <span className="text-xs font-bold text-slate-400">1/3 CONSTITUCIONAL</span>
                              <span className="font-black tabular-nums">{formatCurrency(result.vacationBonus)}</span>
                            </div>
                            {result.sellValue > 0 && (
                              <div className="flex justify-between items-center px-2">
                                <span className="text-xs font-bold text-slate-400">ABONO ({sellDays}d)</span>
                                <span className="font-black tabular-nums text-emerald-400">{formatCurrency(result.sellValue)}</span>
                              </div>
                            )}
                            {result.salary13th > 0 && (
                              <div className="flex justify-between items-center px-2">
                                <span className="text-xs font-bold text-slate-400">ADTO 50% 13º</span>
                                <span className="font-black tabular-nums text-[#FF7A00]">{formatCurrency(result.salary13th)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-5">
                          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-rose-500">Descontos (-)</p>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center px-2">
                              <span className="text-xs font-bold text-slate-500">INSS</span>
                              <span className="font-black tabular-nums text-rose-400">{formatCurrency(result.inssDeduction)}</span>
                            </div>
                            <div className="flex justify-between items-center px-2">
                              <span className="text-xs font-bold text-slate-500">IRRF</span>
                              <span className="font-black tabular-nums text-rose-400">{formatCurrency(result.irrfDeduction)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 flex items-center gap-6">
                        <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                          <ShieldCheck className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Data Estimada</p>
                          <p className="font-black text-sm">2 dias antes do início</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-12 text-center rounded-[3rem] border-4 border-dashed border-slate-100 bg-slate-50/20 group">
                <div className="h-24 w-24 rounded-[2rem] bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center mb-10 transition-transform group-hover:scale-110">
                  <Calculator className="h-10 w-10 text-slate-100" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Resultado Pendente</h3>
                  <p className="text-sm font-bold text-slate-300 max-w-[240px] mx-auto leading-relaxed uppercase tracking-widest">Preencha seus dados ao lado e clique em calcular.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Grid Refined */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            {
              icon: Calendar,
              title: 'Ciclo Aquisitivo',
              desc: 'Após 12 meses, você conquista 30 dias de descanso. O RH tem até 12 meses para concedê-los.',
              color: 'text-[#FF7A00]'
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
            <div key={i} className="group p-10 rounded-[2.5rem] bg-white border-2 border-slate-50 shadow-sm hover:shadow-2xl transition-all">
              <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110", item.color === 'text-[#FF7A00]' ? 'bg-[#FF7A00]/5' : item.color === 'text-emerald-500' ? 'bg-emerald-50' : 'bg-blue-50')}>
                <item.icon className={cn("h-7 w-7", item.color)} />
              </div>
              <h4 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">{item.title}</h4>
              <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-widest">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
