'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  setupApi,
  SetupProgress,
  CompanyProfile,
  SETUP_STEPS,
  BRAZIL_STATES,
  INDUSTRIES,
  validateCNPJ,
  formatCNPJ,
} from '@/lib/api/setup';

export default function SetupStepPage() {
  const router = useRouter();
  const params = useParams();
  const stepNumber = parseInt(params.step as string);

  const [progress, setProgress] = useState<SetupProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 - Company Data
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    legalName: '',
    cnpj: '',
  });

  // Step 3 - Labor Rules
  const [laborRules, setLaborRules] = useState({
    defaultWeeklyHours: 44,
    defaultDailyHours: 8,
    toleranceMinutes: 10,
    overtimeRequiresApproval: true,
    vacationAnnualDays: 30,
  });

  // Step 5 - Modules
  const [modules, setModules] = useState({
    moduleEmployees: true,
    moduleTimesheet: true,
    moduleVacation: true,
    modulePayroll: false,
    modulePerformance: false,
    moduleLearning: false,
    moduleAiAssistant: false,
  });

  useEffect(() => {
    loadStepData();
  }, [stepNumber]);

  const loadStepData = async () => {
    try {
      setLoading(true);
      const progressResponse = await setupApi.getProgress();
      setProgress(progressResponse);

      // Load step-specific data
      if (stepNumber === 1) {
        try {
          const company = await setupApi.getCompanyProfile();
          setCompanyProfile(company);
        } catch {
          // No company profile yet
        }
      } else {
        const stepData = await setupApi.getStepData(stepNumber);
        if (stepNumber === 3 && stepData) {
          setLaborRules({ ...laborRules, ...stepData });
        } else if (stepNumber === 5 && stepData) {
          setModules({ ...modules, ...stepData });
        }
      }
    } catch (error) {
      console.error('Error loading step data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAndContinue = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate and save based on step
      if (stepNumber === 1) {
        if (!companyProfile.legalName || !companyProfile.cnpj) {
          setError('Razão Social e CNPJ são obrigatórios');
          return;
        }
        if (!validateCNPJ(companyProfile.cnpj)) {
          setError('CNPJ inválido');
          return;
        }
        await setupApi.saveCompanyProfile(companyProfile);
      } else if (stepNumber === 3) {
        await setupApi.saveStepData(stepNumber, laborRules);
      } else if (stepNumber === 5) {
        await setupApi.saveStepData(stepNumber, modules);
      }

      // Complete step
      await setupApi.completeStep(stepNumber);

      // Navigate to next step or review
      if (stepNumber < 9) {
        router.push(`/setup/step/${stepNumber + 1}`);
      } else {
        router.push('/setup');
      }
    } catch (error: any) {
      const payload =
        stepNumber === 1
          ? companyProfile
          : stepNumber === 3
            ? laborRules
            : stepNumber === 5
              ? modules
              : null;
      console.error('Erro ao salvar etapa do setup', {
        stepNumber,
        payload,
        error,
      });
      setError(error.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    if (stepNumber > 1) {
      router.push(`/setup/step/${stepNumber - 1}`);
    } else {
      router.push('/setup');
    }
  };

  const skipStep = async () => {
    const step = SETUP_STEPS.find(s => s.number === stepNumber);
    if (step && !step.required) {
      await setupApi.goToStep(stepNumber + 1);
      router.push(`/setup/step/${stepNumber + 1}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentStep = SETUP_STEPS.find(s => s.number === stepNumber);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 py-10 px-4 sm:px-6 lg:px-10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Step Header */}
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                Etapa {stepNumber} de 9
              </p>
              <h1 className="text-3xl font-semibold text-slate-900">{currentStep?.name}</h1>
              <p className="mt-1 text-sm text-slate-500">
                Complete as informações para avançar no setup.
              </p>
            </div>
            {!currentStep?.required && (
              <button
                onClick={skipStep}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
              >
                Pular etapa
              </button>
            )}
          </div>

          {/* Progress */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Progresso</span>
              <span>{Math.round((stepNumber / 9) * 100)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-500 transition-all"
                style={{ width: `${(stepNumber / 9) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            <span className="mt-0.5 text-base">⚠️</span>
            <div>
              <p className="font-semibold">Não foi possível salvar.</p>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-slate-200/60 sm:p-8">
          {stepNumber === 1 && (
            <Step1CompanyData
              profile={companyProfile}
              onChange={setCompanyProfile}
            />
          )}
          {stepNumber === 2 && <Step2OrgStructure />}
          {stepNumber === 3 && (
            <Step3LaborRules
              rules={laborRules}
              onChange={setLaborRules}
            />
          )}
          {stepNumber === 4 && <Step4Branding />}
          {stepNumber === 5 && (
            <Step5Modules
              modules={modules}
              onChange={setModules}
            />
          )}
          {stepNumber === 6 && <Step6Users />}
          {stepNumber === 7 && <Step7Integrations />}
          {stepNumber === 8 && <Step8DataImport />}
          {stepNumber === 9 && <Step9Review />}
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={goBack}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-white"
          >
            Voltar
          </button>
          <button
            onClick={saveAndContinue}
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200/50 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Salvando...' : stepNumber === 9 ? 'Finalizar' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Step 1 - Company Data
function Step1CompanyData({
  profile,
  onChange,
}: {
  profile: CompanyProfile;
  onChange: (profile: CompanyProfile) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700">
            Razão Social *
          </label>
          <input
            type="text"
            value={profile.legalName}
            onChange={(e) => onChange({ ...profile, legalName: e.target.value })}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">
            Nome Fantasia
          </label>
          <input
            type="text"
            value={profile.tradeName || ''}
            onChange={(e) => onChange({ ...profile, tradeName: e.target.value })}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">
            CNPJ *
          </label>
          <input
            type="text"
            value={profile.cnpj}
            onChange={(e) => onChange({ ...profile, cnpj: e.target.value.replace(/\D/g, '') })}
            placeholder="00.000.000/0000-00"
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">
            Regime Tributário
          </label>
          <select
            value={profile.taxRegime || ''}
            onChange={(e) => onChange({ ...profile, taxRegime: e.target.value as any })}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Selecione</option>
            <option value="SIMPLES">Simples Nacional</option>
            <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
            <option value="LUCRO_REAL">Lucro Real</option>
          </select>
        </div>
      </div>

      <hr className="border-slate-200" />

      <div>
        <h3 className="text-lg font-semibold text-slate-900">Endereço</h3>
        <p className="text-sm text-slate-500">
          Informe o endereço fiscal principal da empresa.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700">Logradouro</label>
          <input
            type="text"
            value={profile.addressStreet || ''}
            onChange={(e) => onChange({ ...profile, addressStreet: e.target.value })}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Número</label>
          <input
            type="text"
            value={profile.addressNumber || ''}
            onChange={(e) => onChange({ ...profile, addressNumber: e.target.value })}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Bairro</label>
          <input
            type="text"
            value={profile.addressNeighborhood || ''}
            onChange={(e) => onChange({ ...profile, addressNeighborhood: e.target.value })}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Cidade</label>
          <input
            type="text"
            value={profile.addressCity || ''}
            onChange={(e) => onChange({ ...profile, addressCity: e.target.value })}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Estado</label>
          <select
            value={profile.addressState || ''}
            onChange={(e) => onChange({ ...profile, addressState: e.target.value })}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Selecione</option>
            {BRAZIL_STATES.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// Step 2 - Org Structure (simplified)
function Step2OrgStructure() {
  return (
    <div className="text-center py-8">
      <p className="text-gray-500">
        Configure a estrutura organizacional (departamentos e cargos) nesta etapa.
      </p>
      <p className="text-sm text-gray-400 mt-2">
        Você poderá importar dados ou criar manualmente.
      </p>
    </div>
  );
}

// Step 3 - Labor Rules
function Step3LaborRules({
  rules,
  onChange,
}: {
  rules: any;
  onChange: (rules: any) => void;
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Jornada de Trabalho</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700">
            Carga Horária Semanal
          </label>
          <input
            type="number"
            value={rules.defaultWeeklyHours}
            onChange={(e) => onChange({ ...rules, defaultWeeklyHours: parseInt(e.target.value) })}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">
            Tolerância (minutos)
          </label>
          <input
            type="number"
            value={rules.toleranceMinutes}
            onChange={(e) => onChange({ ...rules, toleranceMinutes: parseInt(e.target.value) })}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          type="checkbox"
          checked={rules.overtimeRequiresApproval}
          onChange={(e) => onChange({ ...rules, overtimeRequiresApproval: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <label className="ml-3 block text-sm font-medium text-slate-700">
          Horas extras requerem aprovação
        </label>
      </div>

      <hr className="border-slate-200" />

      <h3 className="text-lg font-semibold text-slate-900">Férias</h3>
      <div>
        <label className="block text-sm font-semibold text-slate-700">
          Dias de Férias Anuais
        </label>
        <input
          type="number"
          value={rules.vacationAnnualDays}
          onChange={(e) => onChange({ ...rules, vacationAnnualDays: parseInt(e.target.value) })}
          className="mt-2 block w-48 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
        />
      </div>
    </div>
  );
}

// Step 4 - Branding (simplified)
function Step4Branding() {
  return (
    <div className="text-center py-8">
      <p className="text-gray-500">
        Personalize a identidade visual do sistema com logo e cores.
      </p>
    </div>
  );
}

// Step 5 - Modules
function Step5Modules({
  modules,
  onChange,
}: {
  modules: any;
  onChange: (modules: any) => void;
}) {
  const moduleList = [
    { key: 'moduleEmployees', name: 'Colaboradores', desc: 'Cadastro e gestão de colaboradores', core: true },
    { key: 'moduleTimesheet', name: 'Ponto Eletrônico', desc: 'Controle de jornada e horas', core: true },
    { key: 'moduleVacation', name: 'Férias', desc: 'Gestão de férias e ausências', core: true },
    { key: 'modulePayroll', name: 'Folha de Pagamento', desc: 'Cálculo de folha e encargos', core: false },
    { key: 'modulePerformance', name: 'Desempenho', desc: 'Avaliações e metas', core: false },
    { key: 'moduleLearning', name: 'Treinamentos', desc: 'LMS e capacitação', core: false },
    { key: 'moduleAiAssistant', name: 'Assistente IA', desc: 'Consultas por linguagem natural', core: false },
  ];

  return (
    <div className="space-y-4">
      <p className="text-gray-600 mb-6">
        Selecione os módulos que serão utilizados na sua empresa:
      </p>
      {moduleList.map((mod) => (
        <div
          key={mod.key}
          className={`rounded-2xl border p-4 transition-all ${
            modules[mod.key]
              ? 'border-blue-500 bg-blue-50 shadow-sm shadow-blue-100'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
          } ${mod.core ? 'opacity-75' : ''}`}
          onClick={() => !mod.core && onChange({ ...modules, [mod.key]: !modules[mod.key] })}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-slate-900">{mod.name}</h4>
              <p className="text-sm text-slate-500">{mod.desc}</p>
            </div>
            <div>
              {mod.core ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  Incluído
                </span>
              ) : (
                <input
                  type="checkbox"
                  checked={modules[mod.key]}
                  onChange={() => {}}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600"
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Step 6 - Users (simplified)
function Step6Users() {
  return (
    <div className="text-center py-8">
      <p className="text-gray-500">
        Configure os usuários administradores do sistema.
      </p>
    </div>
  );
}

// Step 7 - Integrations (simplified)
function Step7Integrations() {
  return (
    <div className="text-center py-8">
      <p className="text-gray-500">
        Configure integrações com eSocial, contabilidade e outros sistemas.
      </p>
    </div>
  );
}

// Step 8 - Data Import (simplified)
function Step8DataImport() {
  return (
    <div className="text-center py-8">
      <p className="text-gray-500">
        Importe dados de colaboradores, departamentos e cargos.
      </p>
    </div>
  );
}

// Step 9 - Review (simplified)
function Step9Review() {
  return (
    <div className="text-center py-8">
      <p className="text-gray-500">
        Revise as configurações e ative o sistema.
      </p>
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <p className="text-green-700 font-medium">
          Tudo pronto para começar a usar o AxonRH!
        </p>
      </div>
    </div>
  );
}
