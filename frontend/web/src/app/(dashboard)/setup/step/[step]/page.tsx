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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Step Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Etapa {stepNumber} de 9</p>
              <h1 className="text-2xl font-bold text-gray-900">{currentStep?.name}</h1>
            </div>
            {!currentStep?.required && (
              <button
                onClick={skipStep}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Pular etapa
              </button>
            )}
          </div>

          {/* Progress */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(stepNumber / 9) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
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
        <div className="mt-6 flex justify-between">
          <button
            onClick={goBack}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Voltar
          </button>
          <button
            onClick={saveAndContinue}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Razão Social *
          </label>
          <input
            type="text"
            value={profile.legalName}
            onChange={(e) => onChange({ ...profile, legalName: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nome Fantasia
          </label>
          <input
            type="text"
            value={profile.tradeName || ''}
            onChange={(e) => onChange({ ...profile, tradeName: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            CNPJ *
          </label>
          <input
            type="text"
            value={profile.cnpj}
            onChange={(e) => onChange({ ...profile, cnpj: e.target.value.replace(/\D/g, '') })}
            placeholder="00.000.000/0000-00"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Regime Tributário
          </label>
          <select
            value={profile.taxRegime || ''}
            onChange={(e) => onChange({ ...profile, taxRegime: e.target.value as any })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Selecione</option>
            <option value="SIMPLES">Simples Nacional</option>
            <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
            <option value="LUCRO_REAL">Lucro Real</option>
          </select>
        </div>
      </div>

      <hr className="my-6" />

      <h3 className="text-lg font-medium text-gray-900">Endereço</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Logradouro</label>
          <input
            type="text"
            value={profile.addressStreet || ''}
            onChange={(e) => onChange({ ...profile, addressStreet: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Número</label>
          <input
            type="text"
            value={profile.addressNumber || ''}
            onChange={(e) => onChange({ ...profile, addressNumber: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Bairro</label>
          <input
            type="text"
            value={profile.addressNeighborhood || ''}
            onChange={(e) => onChange({ ...profile, addressNeighborhood: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Cidade</label>
          <input
            type="text"
            value={profile.addressCity || ''}
            onChange={(e) => onChange({ ...profile, addressCity: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Estado</label>
          <select
            value={profile.addressState || ''}
            onChange={(e) => onChange({ ...profile, addressState: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
      <h3 className="text-lg font-medium text-gray-900">Jornada de Trabalho</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Carga Horária Semanal
          </label>
          <input
            type="number"
            value={rules.defaultWeeklyHours}
            onChange={(e) => onChange({ ...rules, defaultWeeklyHours: parseInt(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tolerância (minutos)
          </label>
          <input
            type="number"
            value={rules.toleranceMinutes}
            onChange={(e) => onChange({ ...rules, toleranceMinutes: parseInt(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={rules.overtimeRequiresApproval}
          onChange={(e) => onChange({ ...rules, overtimeRequiresApproval: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-700">
          Horas extras requerem aprovação
        </label>
      </div>

      <hr className="my-6" />

      <h3 className="text-lg font-medium text-gray-900">Férias</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Dias de Férias Anuais
        </label>
        <input
          type="number"
          value={rules.vacationAnnualDays}
          onChange={(e) => onChange({ ...rules, vacationAnnualDays: parseInt(e.target.value) })}
          className="mt-1 block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
            modules[mod.key] ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
          } ${mod.core ? 'opacity-75' : ''}`}
          onClick={() => !mod.core && onChange({ ...modules, [mod.key]: !modules[mod.key] })}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{mod.name}</h4>
              <p className="text-sm text-gray-500">{mod.desc}</p>
            </div>
            <div>
              {mod.core ? (
                <span className="text-xs text-gray-500">Incluído</span>
              ) : (
                <input
                  type="checkbox"
                  checked={modules[mod.key]}
                  onChange={() => {}}
                  className="h-5 w-5 text-blue-600 rounded"
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
