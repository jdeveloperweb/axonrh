'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  setupApi,
  SetupSummary,
  SETUP_STEPS,
} from '@/lib/api/setup';

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [summary, setSummary] = useState<SetupSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    try {
      const data = await setupApi.getSummary();
      setSummary(data);

      // If setup is completed, redirect to dashboard
      const status = data.status as unknown;
      const isSetupCompleted =
        (typeof status === 'string' && status === 'COMPLETED') ||
        (typeof status === 'number' && status === 2) ||
        data.progressPercentage === 100;

      if (isSetupCompleted) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error loading setup summary:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const tenantId = searchParams.get('tenantId');
    if (tenantId) {
      localStorage.setItem('setup_tenant_id', tenantId);
    }
    loadSummary();
  }, [searchParams, loadSummary]);

  const goToStep = async (stepNumber: number) => {
    try {
      await setupApi.goToStep(stepNumber);
    } catch (error) {
      console.error('Error navigating to step:', error);
    } finally {
      router.push(`/setup/step/${stepNumber}`);
    }
  };

  const continueSetup = async () => {
    const targetStep = Math.max(summary?.currentStep || 1, 1);
    await goToStep(targetStep);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isFreshSetup = (summary?.completedSteps || 0) === 0;

  if (isFreshSetup) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-6 py-16 font-sans text-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-[#eef6ff] to-[#dfe9ff] pointer-events-none" />
        <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_55%)] pointer-events-none" />
        <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_20%_80%,_rgba(16,185,129,0.22),_transparent_55%)] pointer-events-none" />
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(15,23,42,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.12)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
        <div className="absolute -top-32 right-0 h-80 w-80 rounded-full bg-sky-300/40 blur-[140px] animate-[float_12s_ease-in-out_infinite] pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-emerald-300/40 blur-[160px] animate-[float_14s_ease-in-out_infinite] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 h-64 w-64 rounded-full bg-indigo-300/30 blur-[120px] animate-[float_16s_ease-in-out_infinite] pointer-events-none" />

        <div className="relative z-10 w-full max-w-6xl grid gap-12 lg:grid-cols-[1.15fr,0.85fr] items-center">
          <div className="flex flex-col gap-6 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 shadow-sm">
                Setup inteligente
              </span>
              <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight">
                <span className="text-slate-900">Axon</span>
                <span className="text-sky-600">RH</span>
              </h1>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-slate-900">
              Boas-vindas ao setup inteligente do seu ecossistema de RH
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0">
              Vamos guiar você pela configuração inicial para que o AxonRH fique pronto para
              operar com segurança, conformidade e personalização desde o primeiro acesso.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 text-left">
              {[
                {
                  title: 'Dados corporativos',
                  description: 'Cadastro fiscal, endereço e responsáveis oficiais.',
                },
                {
                  title: 'Regras e jornadas',
                  description: 'Parâmetros de trabalho, benefícios e políticas.',
                },
                {
                  title: 'Módulos e integrações',
                  description: 'Escolha das funcionalidades e conexões externas.',
                },
                {
                  title: 'Time inicial',
                  description: 'Usuários, permissões e perfis de acesso.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/60 bg-white/80 p-4 backdrop-blur shadow-lg shadow-slate-200/60"
                >
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full">
            <div className="relative">
              <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-sky-400/60 via-emerald-300/50 to-indigo-400/60 blur-lg opacity-70" />
              <div className="relative rounded-3xl border border-white/70 bg-white/85 shadow-2xl shadow-slate-200/70 backdrop-blur-xl p-8 sm:p-10 text-left">
                <h3 className="text-xl font-semibold text-slate-900">
                  Antes de começar
                </h3>
                <p className="mt-3 text-sm text-slate-600">
                  Este cadastro garante que o AxonRH aplique as regras corretas, configure
                  a identidade visual e habilite os módulos certos para o seu time.
                </p>
                <div className="mt-6 space-y-3 text-sm text-slate-600">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Tempo médio: 10 a 15 minutos.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-sky-500" />
                    <span>Você pode pausar e retomar quando quiser.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
                    <span>Precisando de ajuda? Consulte o manual do sistema.</span>
                  </div>
                </div>

                <div className="mt-6">
                  <a
                    href="/manual"
                    className="text-sm text-sky-600 hover:text-sky-500 hover:underline"
                  >
                    Acessar manual do sistema →
                  </a>
                </div>

                <div className="mt-8">
                  <button
                    onClick={continueSetup}
                    className="w-full px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-400/40"
                  >
                    Iniciar configuração
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 font-heading">
            Configuração Inicial do AxonRH
          </h1>
          <p className="mt-2 text-gray-600">
            Complete as etapas abaixo para configurar seu sistema de RH
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{summary?.completedSteps || 0} de {summary?.totalSteps || 9} etapas</span>
            <span>{Math.round(summary?.progressPercentage || 0)}% concluído</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${summary?.progressPercentage || 0}%` }}
            ></div>
          </div>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {SETUP_STEPS.map((step) => {
              const stepInfo = summary?.steps.find(s => s.number === step.number);
              const isCompleted = stepInfo?.completed || false;
              const safeCurrentStep = Math.max(summary?.currentStep || 1, 1);
              const isCurrent = safeCurrentStep === step.number;
              const isAccessible = step.number <= safeCurrentStep || isCompleted;

              return (
                <li
                  key={step.number}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${isCurrent ? 'bg-blue-50' : ''
                    } ${!isAccessible ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => isAccessible && goToStep(step.number)}
                >
                  <div className="flex items-center">
                    {/* Step Number/Status */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isCompleted
                      ? 'bg-green-100 text-green-600'
                      : isCurrent
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-400'
                      }`}>
                      {isCompleted ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="font-semibold">{step.number}</span>
                      )}
                    </div>

                    {/* Step Info */}
                    <div className="ml-4 flex-1">
                      <div className="flex items-center">
                        <h3 className={`text-lg font-medium ${isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-700'
                          }`}>
                          {step.name}
                        </h3>
                        {step.required && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded">
                            Obrigatório
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {getStepDescription(step.number)}
                      </p>
                    </div>

                    {/* Arrow */}
                    {isAccessible && (
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Continue Button */}
        <div className="mt-8 text-center">
          <button
            onClick={continueSetup}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            {summary?.completedSteps === 0 ? 'Iniciar Configuração' : 'Continuar Configuração'}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Precisa de ajuda?{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Consulte nossa documentação
            </a>
            {' '}ou{' '}
            <a href="#" className="text-blue-600 hover:underline">
              fale com o suporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function getStepDescription(step: number): string {
  const descriptions: Record<number, string> = {
    1: 'Informações da empresa, CNPJ, endereço e responsáveis',
    2: 'Departamentos, filiais e hierarquia organizacional',
    3: 'Jornada de trabalho, horas extras, férias e benefícios',
    4: 'Logo, cores e personalização visual do sistema',
    5: 'Escolha quais módulos serão utilizados',
    6: 'Administradores e usuários iniciais do sistema',
    7: 'eSocial, contabilidade e sistemas externos',
    8: 'Importação de colaboradores, departamentos e cargos',
    9: 'Verificação final e ativação do sistema',
  };
  return descriptions[step] || '';
}

export default function SetupWizardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SetupContent />
    </Suspense>
  );
}
