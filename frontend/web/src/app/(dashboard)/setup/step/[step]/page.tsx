'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  setupApi,
  importApi,
  SetupProgress,
  CompanyProfile,
  Department,
  Position,
  SETUP_STEPS,
  BRAZIL_STATES,
  INDUSTRIES,
  validateCNPJ,
  formatCNPJ,
} from '@/lib/api/setup';
import { Switch } from '@/components/ui/switch';
import { useThemeStore } from '@/stores/theme-store';


export default function SetupStepPage() {
  const router = useRouter();
  const params = useParams();
  const stepNumber = parseInt(params.step as string);

  const [progress, setProgress] = useState<SetupProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { fetchBranding } = useThemeStore();
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

  // Step 6 - Users
  const [users, setUsers] = useState<any[]>([
    { name: '', email: '', password: '', confirmPassword: '' }
  ]);

  // Step 4 - Branding
  const [branding, setBranding] = useState({
    logoUrl: '',
    logoWidth: 150,
    primaryColor: '#1976D2',
    secondaryColor: '#424242',
    accentColor: '#FF4081',
    fontFamily: 'Plus Jakarta Sans',
    baseFontSize: 16,
  });

  // Step 7 - Integrations
  const [integrations, setIntegrations] = useState({
    esocialEnabled: false,
    esocialEnvironment: 'PRE_PRODUCTION',
    esocialCertificateId: '',
    accountingSoftware: '',
    accountingApiKey: '',
    accountingApiUrl: '',
    erpSystem: '',
    erpApiUrl: '',
    erpAuthToken: '',
    benefitsProvider: '',
    benefitsApiKey: '',
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
        } else if (stepNumber === 4 && stepData) {
          setBranding({ ...branding, ...stepData });
        } else if (stepNumber === 5 && stepData) {
          setModules({ ...modules, ...stepData });
        } else if (stepNumber === 6 && stepData) {
          if (stepData.users && Array.isArray(stepData.users)) {
            setUsers(stepData.users);
          }
        } else if (stepNumber === 7 && stepData) {
          setIntegrations({ ...integrations, ...stepData });
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
      } else if (stepNumber === 4) {
        await setupApi.saveStepData(stepNumber, branding);
        // Atualiza o tema global imediatamente
        fetchBranding();
      } else if (stepNumber === 5) {
        await setupApi.saveStepData(stepNumber, modules);
      } else if (stepNumber === 6) {
        // Validate users
        const invalidUser = users.find(u => !u.name || !u.email || !u.password);
        if (invalidUser) {
          setError('Todos os campos dos usuários são obrigatórios');
          return;
        }
        const passwordMismatch = users.find(u => u.password !== u.confirmPassword);
        if (passwordMismatch) {
          setError('As senhas não coincidem para um ou mais usuários');
          return;
        }
        await setupApi.saveStepData(stepNumber, { users });
      } else if (stepNumber === 7) {
        await setupApi.saveStepData(stepNumber, integrations);
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
              : stepNumber === 6
                ? { users }
                : stepNumber === 7
                  ? integrations
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 py-10 px-4 sm:px-6 lg:px-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Step Header */}
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                Etapa {stepNumber} de 9
              </p>
              <h1 className="text-3xl font-semibold text-slate-900 font-heading">
                {currentStep?.name}
              </h1>
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
          {stepNumber === 4 && (
            <Step4Branding
              config={branding}
              onChange={setBranding}
            />
          )}
          {stepNumber === 5 && (
            <Step5Modules
              modules={modules}
              onChange={setModules}
            />
          )}
          {stepNumber === 6 && (
            <Step6Users
              users={users}
              onChange={setUsers}
            />
          )}
          {stepNumber === 7 && (
            <Step7Integrations
              data={integrations}
              onChange={setIntegrations}
            />
          )}
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

// Step 2 - Org Structure
function Step2OrgStructure() {
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // To trigger re-fetch

  // Manual Forms
  const [deptForm, setDeptForm] = useState({ code: '', name: '' });
  const [posForm, setPosForm] = useState({ code: '', title: '', departmentId: '' });

  // Import State
  const [importType, setImportType] = useState<'DEPARTMENTS' | 'POSITIONS'>('DEPARTMENTS');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [depts, pos] = await Promise.all([
        setupApi.getDepartments(),
        setupApi.getPositions(),
      ]);
      setDepartments(depts || []);
      setPositions(pos || []);
    } catch (err) {
      console.error('Failed to load org data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDepartment = async () => {
    if (!deptForm.code || !deptForm.name) return;
    try {
      setLoading(true);
      await setupApi.saveDepartment(deptForm);
      setDeptForm({ code: '', name: '' });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Erro ao salvar departamento');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm('Tem certeza?')) return;
    try {
      setLoading(true);
      await setupApi.deleteDepartment(id);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Erro ao excluir departamento');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPosition = async () => {
    if (!posForm.code || !posForm.title || !posForm.departmentId) return;
    try {
      setLoading(true);
      await setupApi.savePosition(posForm);
      setPosForm({ code: '', title: '', departmentId: '' });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Erro ao salvar cargo');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePosition = async (id: string) => {
    if (!confirm('Tem certeza?')) return;
    try {
      setLoading(true);
      await setupApi.deletePosition(id);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert('Erro ao excluir cargo');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const template = await importApi.getTemplate(importType);
      // Create CSV content
      const headers = template.columns.map((c) => c.name).join(',');
      const sample = template.sampleData
        .map((row) => template.columns.map((c) => row[c.name] || '').join(','))
        .join('\n');
      const csvContent = `${headers}\n${sample}`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template_${importType.toLowerCase()}.csv`;
      a.click();
    } catch (err) {
      alert('Erro ao baixar template');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setImportStatus('Enviando...');
      const job = await importApi.upload(importType, selectedFile);
      setImportStatus('Processando...');
      // Trigger process
      await importApi.process(job.id);

      // Wait a bit and refresh (naively)
      setTimeout(() => {
        setImportStatus('Concluído! Recarregando dados...');
        setRefreshKey((k) => k + 1);
        setSelectedFile(null);
        setTimeout(() => setImportStatus(null), 2000);
      }, 2000);
    } catch (err) {
      setImportStatus('Erro na importação');
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('manual')}
          className={`pb-2 text-sm font-medium transition ${activeTab === 'manual'
            ? 'border-b-2 border-blue-600 text-blue-600'
            : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          Entrada Manual
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`pb-2 text-sm font-medium transition ${activeTab === 'import'
            ? 'border-b-2 border-blue-600 text-blue-600'
            : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          Importar CSV
        </button>
      </div>

      {activeTab === 'manual' ? (
        <div className="space-y-8">
          {/* Departments */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Departamentos</h3>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="Código (ex: TI)"
                value={deptForm.code}
                onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Nome (ex: Tecnologia)"
                value={deptForm.name}
                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                onClick={handleAddDepartment}
                disabled={loading || !deptForm.code || !deptForm.name}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Adicionar
              </button>
            </div>
            {departments.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Código</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Nome</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {departments.map((d) => (
                      <tr key={d.id}>
                        <td className="px-4 py-2 text-sm text-slate-900">{d.code}</td>
                        <td className="px-4 py-2 text-sm text-slate-600">{d.name}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => d.id && handleDeleteDepartment(d.id)}
                            className="text-red-600 hover:underline text-xs"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Nenhum departamento cadastrado.</p>
            )}
          </div>

          <hr />

          {/* Positions */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Cargos</h3>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="Código"
                value={posForm.code}
                onChange={(e) => setPosForm({ ...posForm, code: e.target.value })}
                className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Título do Cargo"
                value={posForm.title}
                onChange={(e) => setPosForm({ ...posForm, title: e.target.value })}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <select
                value={posForm.departmentId}
                onChange={(e) => setPosForm({ ...posForm, departmentId: e.target.value })}
                className="w-48 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Selecione Depto</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <button
                onClick={handleAddPosition}
                disabled={loading || !posForm.code || !posForm.title || !posForm.departmentId}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Adicionar
              </button>
            </div>
            {positions.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-slate-200 max-h-64 overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Código</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Título</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Depto</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {positions.map((p) => {
                      const dept = departments.find(d => d.id === p.departmentId);
                      return (
                        <tr key={p.id}>
                          <td className="px-4 py-2 text-sm text-slate-900">{p.code}</td>
                          <td className="px-4 py-2 text-sm text-slate-600">{p.title}</td>
                          <td className="px-4 py-2 text-sm text-slate-500">{dept?.name || '-'}</td>
                          <td className="px-4 py-2 text-right">
                            <button
                              onClick={() => p.id && handleDeletePosition(p.id)}
                              className="text-red-600 hover:underline text-xs"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Nenhum cargo cadastrado.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Import Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-xl border border-slate-200 p-6">
              <h4 className="font-semibold text-slate-900">1. Baixar Modelo</h4>
              <p className="text-sm text-slate-500 mt-1 mb-4">Escolha o tipo de dado e baixe o modelo CSV.</p>
              <div className="flex flex-col gap-3">
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="importType"
                      checked={importType === 'DEPARTMENTS'}
                      onChange={() => setImportType('DEPARTMENTS')}
                      className="mr-2"
                    />
                    Departamentos
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="importType"
                      checked={importType === 'POSITIONS'}
                      onChange={() => setImportType('POSITIONS')}
                      className="mr-2"
                    />
                    Cargos
                  </label>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="w-full rounded-lg border border-blue-200 bg-blue-50 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                  Baixar Template CSV
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-6">
              <h4 className="font-semibold text-slate-900">2. Enviar Arquivo</h4>
              <p className="text-sm text-slate-500 mt-1 mb-4">Envie o arquivo preenchido para processamento.</p>
              <div className="space-y-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || !!importStatus}
                  className="w-full rounded-lg bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {importStatus || 'Enviar e Processar'}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200 text-sm text-yellow-800">
            <strong>Nota:</strong> A importação é processada em segundo plano. Aguarde a confirmação.
          </div>
        </div>
      )}
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

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <label className="text-sm font-medium text-slate-700">
          Horas extras requerem aprovação
        </label>
        <Switch
          checked={rules.overtimeRequiresApproval}
          onCheckedChange={(checked) => onChange({ ...rules, overtimeRequiresApproval: checked })}
        />
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

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700">{label}</label>
      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 shadow-sm transition-transform hover:scale-105 active:scale-95">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -inset-2 h-16 w-16 cursor-pointer border-none bg-transparent p-0"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ backgroundColor: value }}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono uppercase text-slate-700 shadow-sm transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />
      </div>
    </div>
  );
}

function Step4Branding({
  config,
  onChange,
}: {
  config: any;
  onChange: (config: any) => void;
}) {
  const fonts = [
    'Plus Jakarta Sans',
    'Outfit',
    'Inter',
    'Roboto',
    'Open Sans',
    'Montserrat'
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Logo da Empresa</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">URL do Logo</label>
              <input
                type="text"
                value={config.logoUrl}
                onChange={(e) => onChange({ ...config, logoUrl: e.target.value })}
                placeholder="https://suaempresa.com/logo.png"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Largura do Logo</label>
                <span className="text-xs font-mono text-blue-600">{config.logoWidth}px</span>
              </div>
              <input
                type="range"
                min="50"
                max="300"
                step="10"
                value={config.logoWidth}
                onChange={(e) => onChange({ ...config, logoWidth: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Cores da Marca</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <ColorInput
              label="Primária"
              value={config.primaryColor}
              onChange={(color: string) => onChange({ ...config, primaryColor: color })}
            />
            <ColorInput
              label="Secundária"
              value={config.secondaryColor}
              onChange={(color: string) => onChange({ ...config, secondaryColor: color })}
            />
            <ColorInput
              label="Destaque"
              value={config.accentColor}
              onChange={(color: string) => onChange({ ...config, accentColor: color })}
            />
          </div>
        </div>

        <hr className="border-slate-100" />

        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Tipografia</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fonte Principal</label>
              <select
                value={config.fontFamily}
                onChange={(e) => onChange({ ...config, fontFamily: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
              >
                {fonts.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Tamanho da Fonte Base</label>
                <span className="text-xs font-mono text-blue-600">{config.baseFontSize}px</span>
              </div>
              <input
                type="range"
                min="12"
                max="20"
                step="1"
                value={config.baseFontSize}
                onChange={(e) => onChange({ ...config, baseFontSize: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 sticky top-10 self-start">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">Visualização em Tempo Real</h4>

        <div
          className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200"
          style={{ fontFamily: config.fontFamily }}
        >
          {/* Mock Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b" style={{ backgroundColor: '#ffffff' }}>
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="Logo" style={{ width: config.logoWidth / 2 }} className="h-auto" />
            ) : (
              <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
            )}
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-full bg-slate-100" />
            </div>
          </div>

          {/* Mock Content */}
          <div className="p-6 space-y-4" style={{ fontSize: config.baseFontSize }}>
            <h5 className="font-bold text-xl" style={{ color: config.secondaryColor }}>Seja bem-vindo ao AxonRH</h5>
            <p className="text-slate-500 leading-relaxed">
              Esta é uma prévia de como o sistema será exibido para seus colaboradores.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: config.primaryColor }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div className="flex-1">
                  <div className="h-2 w-24 bg-slate-200 rounded mb-2" />
                  <div className="h-1.5 w-full bg-slate-100 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: config.accentColor }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="flex-1">
                  <div className="h-2 w-32 bg-slate-200 rounded mb-2" />
                  <div className="h-1.5 w-3/4 bg-slate-100 rounded" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                className="flex-1 py-2.5 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 text-xs uppercase"
                style={{ backgroundColor: config.primaryColor }}
              >
                Botão Primário
              </button>
              <button
                className="flex-1 py-2.5 rounded-xl font-bold border-2 transition-transform active:scale-95 text-xs uppercase"
                style={{
                  color: config.secondaryColor,
                  borderColor: config.secondaryColor,
                  backgroundColor: 'transparent'
                }}
              >
                Secundário
              </button>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 mt-4 text-center">
          * A visualização é aproximada e pode variar conforme a resolução da tela.
        </p>
      </div>
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
          className={`rounded-2xl border p-4 transition-all ${modules[mod.key]
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
                <Switch
                  checked={modules[mod.key]}
                  onCheckedChange={(checked) => onChange({ ...modules, [mod.key]: checked })}
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Step 6 - Users
function Step6Users({
  users,
  onChange,
}: {
  users: any[];
  onChange: (users: any[]) => void;
}) {
  const addUser = () => {
    onChange([...users, { name: '', email: '', password: '', confirmPassword: '' }]);
  };

  const removeUser = (index: number) => {
    if (users.length === 1) {
      alert('É necessário pelo menos um administrador.');
      return;
    }
    const newUsers = [...users];
    newUsers.splice(index, 1);
    onChange(newUsers);
  };

  const updateUser = (index: number, field: string, value: string) => {
    const newUsers = [...users];
    newUsers[index] = { ...newUsers[index], [field]: value };
    onChange(newUsers);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Administradores do Sistema</h3>
          <p className="text-sm text-slate-500">
            Cadastre os usuários que terão acesso total ao AxonRH.
          </p>
        </div>
        <button
          onClick={addUser}
          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          <span>+</span> Adicionar Admin
        </button>
      </div>

      <div className="space-y-6">
        {users.map((user, index) => (
          <div
            key={index}
            className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-6 transition-all hover:border-slate-300 hover:bg-white"
          >
            {users.length > 1 && (
              <button
                onClick={() => removeUser(index)}
                className="absolute right-4 top-4 text-slate-400 hover:text-red-500"
                title="Remover administrador"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700">Nome Completo</label>
                <input
                  type="text"
                  value={user.name}
                  onChange={(e) => updateUser(index, 'name', e.target.value)}
                  placeholder="Ex: João Silva"
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700">Email Corporativo</label>
                <input
                  type="email"
                  value={user.email}
                  onChange={(e) => updateUser(index, 'email', e.target.value)}
                  placeholder="admin@empresa.com"
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Senha</label>
                <input
                  type="password"
                  value={user.password}
                  onChange={(e) => updateUser(index, 'password', e.target.value)}
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Confirmar Senha</label>
                <input
                  type="password"
                  value={user.confirmPassword}
                  onChange={(e) => updateUser(index, 'confirmPassword', e.target.value)}
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        <div className="flex gap-3">
          <span className="text-lg">ℹ️</span>
          <p>
            <strong>Nota importante:</strong> Os usuários cadastrados aqui serão criados com o perfil de <strong>ADMIN</strong>.
            Eles terão acesso total a todas as configurações e dados do sistema.
          </p>
        </div>
      </div>
    </div>
  );
}

// Step 7 - Integrations
function Step7Integrations({
  data,
  onChange,
}: {
  data: any;
  onChange: (data: any) => void;
}) {
  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const integrationGroups = [
    {
      id: 'esocial',
      title: 'eSocial',
      description: 'Envio de eventos trabalhistas ao governo.',
      icon: '🏢',
      bgClass: 'bg-blue-50',
      textClass: 'text-blue-600',
      fields: (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-sm font-medium text-slate-700">Habilitar eSocial</span>
            <Switch
              checked={data.esocialEnabled}
              onCheckedChange={(checked) => updateField('esocialEnabled', checked)}
            />
          </div>

          {data.esocialEnabled && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Ambiente</label>
                <select
                  value={data.esocialEnvironment}
                  onChange={(e) => updateField('esocialEnvironment', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="PRE_PRODUCTION">Produção Restrita (Testes)</option>
                  <option value="PRODUCTION">Produção</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">ID do Certificado Digital</label>
                <input
                  type="text"
                  placeholder="ID enviado pelo serviço de certificados"
                  value={data.esocialCertificateId}
                  onChange={(e) => updateField('esocialCertificateId', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'accounting',
      title: 'Contabilidade',
      description: 'Exportação de dados para folha e contábil.',
      icon: '📊',
      bgClass: 'bg-green-50',
      textClass: 'text-green-600',
      fields: (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Software Contábil</label>
            <select
              value={data.accountingSoftware}
              onChange={(e) => updateField('accountingSoftware', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            >
              <option value="">Selecione o Sistema</option>
              <option value="DOMINIO">Domínio Sistemas</option>
              <option value="ALTERDATA">Alterdata</option>
              <option value="CONTMATIC">Contmatic</option>
              <option value="QUESTOR">Questor</option>
              <option value="OTHERS">Outros (via API)</option>
            </select>
          </div>

          {data.accountingSoftware && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">API Key / Token</label>
                <input
                  type="password"
                  value={data.accountingApiKey}
                  onChange={(e) => updateField('accountingApiKey', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'erp',
      title: 'ERP / Core',
      description: 'Sincronização de RH com o sistema central.',
      icon: '⚙️',
      bgClass: 'bg-indigo-50',
      textClass: 'text-indigo-600',
      fields: (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Sistema ERP</label>
            <select
              value={data.erpSystem}
              onChange={(e) => updateField('erpSystem', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            >
              <option value="">Selecione o ERP</option>
              <option value="SAP">SAP S/4HANA / Business One</option>
              <option value="TOTVS">TOTVS (Protheus/RM)</option>
              <option value="ORACLE">Oracle NetSuite</option>
              <option value="SENIOR">Senior Sistemas</option>
              <option value="CUSTOM">API Customizada</option>
            </select>
          </div>

          {data.erpSystem && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">URL da API do ERP</label>
                <input
                  type="text"
                  placeholder="https://api.empresa.com.br/v1"
                  value={data.erpApiUrl}
                  onChange={(e) => updateField('erpApiUrl', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'benefits',
      title: 'Benefícios',
      description: 'Gestão de cartões e convênios.',
      icon: '💳',
      bgClass: 'bg-purple-50',
      textClass: 'text-purple-600',
      fields: (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Operadora Principal</label>
            <select
              value={data.benefitsProvider}
              onChange={(e) => updateField('benefitsProvider', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            >
              <option value="">Selecione a Operadora</option>
              <option value="FLASH">Flash Benefícios</option>
              <option value="ALELO">Alelo</option>
              <option value="SODEXO">Sodexo / Pluxee</option>
              <option value="TICKET">Ticket</option>
              <option value="CAJU">Caju</option>
            </select>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-slate-900">Configurações de Integração</h3>
        <p className="text-sm text-slate-500 mt-1">
          Conecte o AxonRH com as ferramentas que sua empresa já utiliza.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrationGroups.map((group) => (
          <div
            key={group.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-2xl ${group.bgClass} ${group.textClass}`}>
                {group.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900">{group.title}</h4>
                <p className="text-xs text-slate-500">{group.description}</p>
                {group.fields}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs text-amber-800">
        <div className="flex gap-3">
          <span className="text-lg">💡</span>
          <p>
            <strong>Dica:</strong> Você poderá configurar mais detalhes e testar as conexões após o setup inicial, na área de
            "Configurações {'>'} Integrações" do sistema administrativo.
          </p>
        </div>
      </div>
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
