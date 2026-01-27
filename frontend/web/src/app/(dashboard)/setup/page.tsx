'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  setupApi,
  SetupSummary,
  SETUP_STEPS,
} from '@/lib/api/setup';

export default function SetupWizardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<SetupSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
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
  };

  const goToStep = async (stepNumber: number) => {
    try {
      await setupApi.goToStep(stepNumber);
    } catch (error) {
      console.error('Error navigating to step:', error);
    } finally {
      router.push(`/setup/step/${stepNumber}`);
    }
  };

  const continueSetup = () => {
    if (summary) {
      const targetStep = Math.max(summary.currentStep || 1, 1);
      router.push(`/setup/step/${targetStep}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    isCurrent ? 'bg-blue-50' : ''
                  } ${!isAccessible ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => isAccessible && goToStep(step.number)}
                >
                  <div className="flex items-center">
                    {/* Step Number/Status */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted
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
                        <h3 className={`text-lg font-medium ${
                          isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-700'
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
