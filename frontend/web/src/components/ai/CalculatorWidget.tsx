'use client';

import { useState } from 'react';
import {
  calculationApi,
  CalculationResult,
  VacationCalculation,
  TerminationCalculation,
  OvertimeCalculation,
  formatCurrency,
  TERMINATION_TYPES,
} from '@/lib/api/ai';

type CalculationType = 'vacation' | 'termination' | 'overtime';

export default function CalculatorWidget() {
  const [activeTab, setActiveTab] = useState<CalculationType>('vacation');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async (data: VacationCalculation | TerminationCalculation | OvertimeCalculation) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let calcResult: CalculationResult;

      switch (activeTab) {
        case 'vacation':
          calcResult = (await calculationApi.vacation(data as VacationCalculation)).data;
          break;
        case 'termination':
          calcResult = (await calculationApi.termination(data as TerminationCalculation)).data;
          break;
        case 'overtime':
          calcResult = (await calculationApi.overtime(data as OvertimeCalculation)).data;
          break;
      }

      setResult(calcResult);
    } catch (err) {
      setError('Erro ao realizar cálculo. Tente novamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b">
        <TabButton
          active={activeTab === 'vacation'}
          onClick={() => { setActiveTab('vacation'); setResult(null); }}
        >
          Férias
        </TabButton>
        <TabButton
          active={activeTab === 'termination'}
          onClick={() => { setActiveTab('termination'); setResult(null); }}
        >
          Rescisão
        </TabButton>
        <TabButton
          active={activeTab === 'overtime'}
          onClick={() => { setActiveTab('overtime'); setResult(null); }}
        >
          Horas Extras
        </TabButton>
      </div>

      {/* Form */}
      <div className="p-6">
        {activeTab === 'vacation' && (
          <VacationForm onSubmit={handleCalculate} isLoading={isLoading} />
        )}
        {activeTab === 'termination' && (
          <TerminationForm onSubmit={handleCalculate} isLoading={isLoading} />
        )}
        {activeTab === 'overtime' && (
          <OvertimeForm onSubmit={handleCalculate} isLoading={isLoading} />
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {result && <ResultDisplay result={result} />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function VacationForm({ onSubmit, isLoading }: {
  onSubmit: (data: VacationCalculation) => void;
  isLoading: boolean;
}) {
  const [salary, setSalary] = useState('');
  const [days, setDays] = useState('30');
  const [withAbono, setWithAbono] = useState(false);
  const [dependents, setDependents] = useState('0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      salary: parseFloat(salary.replace(',', '.')),
      days: parseInt(days),
      withAbono,
      dependents: parseInt(dependents),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Salário Base (R$)
        </label>
        <input
          type="text"
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
          placeholder="3.000,00"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dias de Férias
        </label>
        <select
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="30">30 dias</option>
          <option value="20">20 dias</option>
          <option value="15">15 dias</option>
          <option value="10">10 dias</option>
        </select>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="abono"
          checked={withAbono}
          onChange={(e) => setWithAbono(e.target.checked)}
          className="h-4 w-4 text-blue-600 rounded border-gray-300"
        />
        <label htmlFor="abono" className="ml-2 text-sm text-gray-700">
          Abono pecuniário (vender 1/3 das férias)
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Número de Dependentes
        </label>
        <input
          type="number"
          value={dependents}
          onChange={(e) => setDependents(e.target.value)}
          min="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !salary}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
      >
        {isLoading ? 'Calculando...' : 'Calcular Férias'}
      </button>
    </form>
  );
}

function TerminationForm({ onSubmit, isLoading }: {
  onSubmit: (data: TerminationCalculation) => void;
  isLoading: boolean;
}) {
  const [salary, setSalary] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [terminationDate, setTerminationDate] = useState(new Date().toISOString().split('T')[0]);
  const [terminationType, setTerminationType] = useState<TerminationCalculation['terminationType']>('SEM_JUSTA_CAUSA');
  const [workedNotice, setWorkedNotice] = useState(false);
  const [fgtsBalance, setFgtsBalance] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      salary: parseFloat(salary.replace(',', '.')),
      hireDate,
      terminationDate,
      terminationType,
      workedNotice,
      fgtsBalance: fgtsBalance ? parseFloat(fgtsBalance.replace(',', '.')) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Salário Base (R$)
        </label>
        <input
          type="text"
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
          placeholder="3.000,00"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data de Admissão
          </label>
          <input
            type="date"
            value={hireDate}
            onChange={(e) => setHireDate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data de Demissão
          </label>
          <input
            type="date"
            value={terminationDate}
            onChange={(e) => setTerminationDate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Rescisão
        </label>
        <select
          value={terminationType}
          onChange={(e) => setTerminationType(e.target.value as TerminationCalculation['terminationType'])}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {TERMINATION_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="workedNotice"
          checked={workedNotice}
          onChange={(e) => setWorkedNotice(e.target.checked)}
          className="h-4 w-4 text-blue-600 rounded border-gray-300"
        />
        <label htmlFor="workedNotice" className="ml-2 text-sm text-gray-700">
          Aviso prévio trabalhado
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Saldo FGTS (R$) - opcional
        </label>
        <input
          type="text"
          value={fgtsBalance}
          onChange={(e) => setFgtsBalance(e.target.value)}
          placeholder="10.000,00"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !salary || !hireDate}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
      >
        {isLoading ? 'Calculando...' : 'Calcular Rescisão'}
      </button>
    </form>
  );
}

function OvertimeForm({ onSubmit, isLoading }: {
  onSubmit: (data: OvertimeCalculation) => void;
  isLoading: boolean;
}) {
  const [hourlyRate, setHourlyRate] = useState('');
  const [regularHours, setRegularHours] = useState('220');
  const [overtime50, setOvertime50] = useState('0');
  const [overtime100, setOvertime100] = useState('0');
  const [nightHours, setNightHours] = useState('0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      hourlyRate: parseFloat(hourlyRate.replace(',', '.')),
      regularHours: parseFloat(regularHours),
      overtime50Hours: parseFloat(overtime50),
      overtime100Hours: parseFloat(overtime100),
      nightHours: parseFloat(nightHours),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Valor da Hora (R$)
        </label>
        <input
          type="text"
          value={hourlyRate}
          onChange={(e) => setHourlyRate(e.target.value)}
          placeholder="15,00"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Horas Normais Trabalhadas
        </label>
        <input
          type="number"
          value={regularHours}
          onChange={(e) => setRegularHours(e.target.value)}
          step="0.5"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Horas Extras 50%
          </label>
          <input
            type="number"
            value={overtime50}
            onChange={(e) => setOvertime50(e.target.value)}
            step="0.5"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Horas Extras 100%
          </label>
          <input
            type="number"
            value={overtime100}
            onChange={(e) => setOvertime100(e.target.value)}
            step="0.5"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Horas Noturnas
        </label>
        <input
          type="number"
          value={nightHours}
          onChange={(e) => setNightHours(e.target.value)}
          step="0.5"
          min="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !hourlyRate}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
      >
        {isLoading ? 'Calculando...' : 'Calcular Horas Extras'}
      </button>
    </form>
  );
}

function ResultDisplay({ result }: { result: CalculationResult }) {
  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">
        Resultado do Cálculo
      </h4>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white p-3 rounded-lg border">
          <p className="text-sm text-gray-500">Valor Bruto</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(result.grossValue)}
          </p>
        </div>
        <div className="bg-white p-3 rounded-lg border">
          <p className="text-sm text-gray-500">Valor Líquido</p>
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(result.netValue)}
          </p>
        </div>
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700">
          Ver memória de cálculo
        </summary>
        <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto whitespace-pre-wrap">
          {result.steps}
        </pre>
      </details>

      <p className="mt-4 text-xs text-gray-500 italic">
        Base Legal: {result.legalBasis}
      </p>
    </div>
  );
}
