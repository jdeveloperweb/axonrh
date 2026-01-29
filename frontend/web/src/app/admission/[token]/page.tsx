'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  User,
  FileText,

  PenTool,
  CheckCircle,
  AlertCircle,
  Upload,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Check
} from 'lucide-react';
import { AdmissionDocument } from '@/lib/api/admissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { admissionsApi, AdmissionProcess } from '@/lib/api/admissions';
import { employeesApi } from '@/lib/api/employees';
import { useToast } from '@/hooks/use-toast';

interface Step {
  id: number;
  title: string;
  icon: React.ReactNode;
  status: 'pending' | 'current' | 'completed';
}

const documentTypes = [
  { type: 'RG', label: 'RG (Identidade)', required: true },
  { type: 'CPF', label: 'CPF', required: true },
  { type: 'COMPROVANTE_RESIDENCIA', label: 'Comprovante de Residência', required: true },
  { type: 'FOTO_3X4', label: 'Foto 3x4', required: true },
  { type: 'TITULO_ELEITOR', label: 'Título de Eleitor', required: false },
  { type: 'CTPS', label: 'Carteira de Trabalho', required: false },
  { type: 'CERTIDAO_NASCIMENTO', label: 'Certidão de Nascimento', required: false },
  { type: 'CERTIDAO_CASAMENTO', label: 'Certidão de Casamento', required: false },
  { type: 'CNH', label: 'CNH', required: false },
];

export default function AdmissionWizardPage() {
  const params = useParams();

  const { toast } = useToast();
  const token = params.token as string;

  // State
  const [process, setProcess] = useState<AdmissionProcess | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Form data
  const [personalData, setPersonalData] = useState({
    cpf: '',
    fullName: '',
    birthDate: '',
    gender: '',
    maritalStatus: '',
    nationality: 'Brasileira',
    phone: '',
    email: '',
    rg: '',
    rgOrgaoEmissor: '',
    ctpsNumero: '',
    ctpsSerie: '',
    ctpsUf: '',
    pis: '',
  });

  const [addressData, setAddressData] = useState({
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  });

  const [documents, setDocuments] = useState<Record<string, { file?: File; status: string; message?: string }>>({});
  const [contractAccepted, setContractAccepted] = useState(false);
  const [contractHtml, setContractHtml] = useState('');

  // Fetch process
  const fetchProcess = useCallback(async () => {
    try {
      setLoading(true);
      const data = await admissionsApi.public.access(token);
      setProcess(data);

      // Pre-fill data if exists
      if (data.candidateCpf) {
        setPersonalData(prev => ({ ...prev, cpf: data.candidateCpf }));
      }
      if (data.candidateName) {
        setPersonalData(prev => ({ ...prev, fullName: data.candidateName }));
      }
      if (data.candidateEmail) {
        setPersonalData(prev => ({ ...prev, email: data.candidateEmail }));
      }
      if (data.candidatePhone) {
        setPersonalData(prev => ({ ...prev, phone: data.candidatePhone || '' }));
      }

      // Set current step based on process status
      setCurrentStep(data.currentStep);

      // Load existing documents
      const docs = await admissionsApi.public.getDocuments(token);
      const docsMap: Record<string, { status: string; message?: string }> = {};
      (docs as unknown as AdmissionDocument[]).forEach((doc) => {
        docsMap[doc.documentType] = {
          status: doc.status,
          message: doc.validationMessage,
        };
      });
      setDocuments(docsMap);

    } catch (error: unknown) {
      const err = error as { response?: { status: number }; message?: string };
      if (err.response?.status === 410 || err.message?.includes('expirado')) {
        toast({
          title: 'Link Expirado',
          description: 'Este link de admissão expirou. Entre em contato com o RH.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o processo de admissão',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchProcess();
  }, [fetchProcess]);

  // Handle step change
  const handleNext = async () => {
    if (currentStep === 2) {
      // Save personal and address data
      try {
        setSubmitting(true);
        const data = {
          ...personalData,
          ...addressData,
        };
        await admissionsApi.public.saveData(token, data);
        setCurrentStep(3);
      } catch {
        toast({
          title: 'Erro',
          description: 'Falha ao salvar dados',
          variant: 'destructive',
        });
      } finally {
        setSubmitting(false);
      }
    } else if (currentStep === 3) {
      // Validate documents
      try {
        setSubmitting(true);
        const result = await admissionsApi.public.validateDocuments(token) as { allValid: boolean };
        if (result.allValid) {
          setCurrentStep(4);
          // Load contract
          const contract = await admissionsApi.public.getContract(token) as { contractHtml: string };
          setContractHtml(contract.contractHtml);
        } else {
          toast({
            title: 'Documentos Pendentes',
            description: 'Alguns documentos precisam ser revisados',
            variant: 'destructive',
          });
        }
      } catch {
        toast({
          title: 'Erro',
          description: 'Falha ao validar documentos',
          variant: 'destructive',
        });
      } finally {
        setSubmitting(false);
      }
    } else if (currentStep === 4) {
      // Sign contract
      if (!contractAccepted) {
        toast({
          title: 'Atenção',
          description: 'Você precisa aceitar os termos do contrato',
          variant: 'destructive',
        });
        return;
      }

      try {
        setSubmitting(true);
        await admissionsApi.public.signContract(token, {
          acceptedTerms: true,
          signatureText: personalData.fullName,
          ipAddress: '', // Would be captured server-side
          userAgent: navigator.userAgent,
        });
        setCurrentStep(5);
        toast({
          title: 'Sucesso!',
          description: 'Contrato assinado com sucesso. Sua admissão foi concluída!',
        });
      } catch {
        toast({
          title: 'Erro',
          description: 'Falha ao assinar contrato',
          variant: 'destructive',
        });
      } finally {
        setSubmitting(false);
      }
    } else {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleCepBlur = async () => {
    const cep = addressData.cep.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const address = await employeesApi.searchCep(cep);
        setAddressData(prev => ({
          ...prev,
          logradouro: address.street || prev.logradouro,
          bairro: address.neighborhood || prev.bairro,
          cidade: address.city || prev.cidade,
          estado: address.state || prev.estado,
        }));
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (type: string, file: File) => {
    try {
      setDocuments(prev => ({
        ...prev,
        [type]: { file, status: 'UPLOADING' },
      }));

      const result = await admissionsApi.public.uploadDocument(token, file, type) as { validationStatus: string; ocrData?: { message?: string } };

      setDocuments(prev => ({
        ...prev,
        [type]: {
          file,
          status: result.validationStatus,
          message: result.ocrData?.message,
        },
      }));

      toast({
        title: 'Documento enviado',
        description: `${type} enviado com sucesso`,
      });
    } catch {
      setDocuments(prev => ({
        ...prev,
        [type]: { status: 'ERROR', message: 'Falha no upload' },
      }));
      toast({
        title: 'Erro',
        description: 'Falha ao enviar documento',
        variant: 'destructive',
      });
    }
  };

  // Build steps
  const steps: Step[] = [
    {
      id: 1,
      title: 'Boas-vindas',
      icon: <User className="w-5 h-5" />,
      status: currentStep === 1 ? 'current' : currentStep > 1 ? 'completed' : 'pending',
    },
    {
      id: 2,
      title: 'Dados Pessoais',
      icon: <FileText className="w-5 h-5" />,
      status: currentStep === 2 ? 'current' : currentStep > 2 ? 'completed' : 'pending',
    },
    {
      id: 3,
      title: 'Documentos',
      icon: <Upload className="w-5 h-5" />,
      status: currentStep === 3 ? 'current' : currentStep > 3 ? 'completed' : 'pending',
    },
    {
      id: 4,
      title: 'Contrato',
      icon: <PenTool className="w-5 h-5" />,
      status: currentStep === 4 ? 'current' : currentStep > 4 ? 'completed' : 'pending',
    },
    {
      id: 5,
      title: 'Conclusão',
      icon: <CheckCircle className="w-5 h-5" />,
      status: currentStep === 5 ? 'current' : 'pending',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!process) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Link Inválido</h2>
            <p className="text-gray-600">
              Este link de admissão não é válido ou já expirou.
              Entre em contato com o departamento de RH.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-xl font-bold text-gray-900">Admissão Digital</h1>
          <p className="text-sm text-gray-600">
            {process.department?.name} • {process.position?.title}
          </p>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${step.status === 'completed'
                      ? 'bg-green-500 text-white'
                      : step.status === 'current'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                      }`}
                  >
                    {step.status === 'completed' ? <Check className="w-5 h-5" /> : step.icon}
                  </div>
                  <span className={`text-xs mt-2 ${step.status === 'current' ? 'text-blue-600 font-medium' : 'text-gray-500'
                    }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step 1: Welcome */}
        {currentStep === 1 && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Olá, {process.candidateName}!
              </h2>
              <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                Seja bem-vindo(a) ao processo de admissão digital. Nas próximas etapas,
                você irá preencher seus dados pessoais, enviar seus documentos e
                assinar seu contrato de trabalho.
              </p>
              <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Cargo:</strong> {process.position?.title || 'A definir'}<br />
                  <strong>Departamento:</strong> {process.department?.name || 'A definir'}<br />
                  <strong>Data prevista:</strong> {process.expectedHireDate || 'A definir'}
                </p>
              </div>
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Iniciar Processo
                <ChevronRight className="w-5 h-5" />
              </button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Personal Data */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={personalData.fullName}
                    onChange={(e) => setPersonalData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPF *
                  </label>
                  <input
                    type="text"
                    value={personalData.cpf}
                    onChange={(e) => setPersonalData(prev => ({ ...prev, cpf: e.target.value }))}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    value={personalData.birthDate}
                    onChange={(e) => setPersonalData(prev => ({ ...prev, birthDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sexo
                  </label>
                  <select
                    value={personalData.gender}
                    onChange={(e) => setPersonalData(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione</option>
                    <option value="MALE">Masculino</option>
                    <option value="FEMALE">Feminino</option>
                    <option value="OTHER">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado Civil
                  </label>
                  <select
                    value={personalData.maritalStatus}
                    onChange={(e) => setPersonalData(prev => ({ ...prev, maritalStatus: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione</option>
                    <option value="SINGLE">Solteiro(a)</option>
                    <option value="MARRIED">Casado(a)</option>
                    <option value="DIVORCED">Divorciado(a)</option>
                    <option value="WIDOWED">Viúvo(a)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone *
                  </label>
                  <input
                    type="text"
                    value={personalData.phone}
                    onChange={(e) => setPersonalData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    value={personalData.email}
                    onChange={(e) => setPersonalData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <hr />

              <h3 className="text-lg font-medium text-gray-900">Endereço</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CEP *
                  </label>
                  <input
                    type="text"
                    value={addressData.cep}
                    onChange={(e) => setAddressData(prev => ({ ...prev, cep: e.target.value }))}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logradouro *
                  </label>
                  <input
                    type="text"
                    value={addressData.logradouro}
                    onChange={(e) => setAddressData(prev => ({ ...prev, logradouro: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    value={addressData.numero}
                    onChange={(e) => setAddressData(prev => ({ ...prev, numero: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={addressData.complemento}
                    onChange={(e) => setAddressData(prev => ({ ...prev, complemento: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    value={addressData.bairro}
                    onChange={(e) => setAddressData(prev => ({ ...prev, bairro: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    value={addressData.cidade}
                    onChange={(e) => setAddressData(prev => ({ ...prev, cidade: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado *
                  </label>
                  <select
                    value={addressData.estado}
                    onChange={(e) => setAddressData(prev => ({ ...prev, estado: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione</option>
                    <option value="AC">Acre</option>
                    <option value="AL">Alagoas</option>
                    <option value="AP">Amapá</option>
                    <option value="AM">Amazonas</option>
                    <option value="BA">Bahia</option>
                    <option value="CE">Ceará</option>
                    <option value="DF">Distrito Federal</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="GO">Goiás</option>
                    <option value="MA">Maranhão</option>
                    <option value="MT">Mato Grosso</option>
                    <option value="MS">Mato Grosso do Sul</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="PA">Pará</option>
                    <option value="PB">Paraíba</option>
                    <option value="PR">Paraná</option>
                    <option value="PE">Pernambuco</option>
                    <option value="PI">Piauí</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="RN">Rio Grande do Norte</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="RO">Rondônia</option>
                    <option value="RR">Roraima</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="SP">São Paulo</option>
                    <option value="SE">Sergipe</option>
                    <option value="TO">Tocantins</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Documents */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Envio de Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Envie os documentos solicitados abaixo. Os campos marcados com * são obrigatórios.
              </p>

              <div className="space-y-4">
                {documentTypes.map((doc) => {
                  const docState = documents[doc.type];
                  const isUploaded = docState && docState.status !== 'ERROR';
                  const isValid = docState?.status === 'VALID';
                  const isPending = docState?.status === 'PENDING' || docState?.status === 'UPLOADING';

                  return (
                    <div
                      key={doc.type}
                      className={`border rounded-lg p-4 ${isValid ? 'border-green-300 bg-green-50' :
                        isUploaded ? 'border-yellow-300 bg-yellow-50' :
                          'border-gray-200'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isValid ? 'bg-green-100' :
                            isUploaded ? 'bg-yellow-100' :
                              'bg-gray-100'
                            }`}>
                            {isValid ? (
                              <Check className="w-5 h-5 text-green-600" />
                            ) : isPending ? (
                              <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
                            ) : (
                              <FileText className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {doc.label} {doc.required && <span className="text-red-500">*</span>}
                            </p>
                            {docState?.message && (
                              <p className="text-sm text-gray-600">{docState.message}</p>
                            )}
                          </div>
                        </div>

                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleDocumentUpload(doc.type, file);
                            }}
                          />
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isUploaded
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}>
                            <Upload className="w-4 h-4" />
                            {isUploaded ? 'Substituir' : 'Enviar'}
                          </span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Contract */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Contrato de Trabalho</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-96 overflow-y-auto mb-6">
                <div dangerouslySetInnerHTML={{ __html: contractHtml }} />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={contractAccepted}
                  onChange={(e) => setContractAccepted(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">
                  Li e aceito os termos do contrato de trabalho acima. Declaro que todas as
                  informações fornecidas são verdadeiras e autorizo o uso dos meus dados
                  pessoais para fins de admissão.
                </span>
              </label>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Completion */}
        {currentStep === 5 && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Parabéns!
              </h2>
              <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                Seu processo de admissão foi concluído com sucesso.
                O departamento de RH irá entrar em contato com as próximas instruções.
              </p>
              <div className="bg-green-50 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-green-800">
                  <strong>Próximos passos:</strong><br />
                  • Aguarde o contato do RH<br />
                  • Prepare-se para o primeiro dia<br />
                  • Traga seus documentos originais
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        {currentStep > 1 && currentStep < 5 && (
          <div className="flex justify-between mt-6">
            <button
              onClick={handleBack}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
              Voltar
            </button>
            <button
              onClick={handleNext}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando...
                </>
              ) : currentStep === 4 ? (
                <>
                  Assinar Contrato
                  <PenTool className="w-5 h-5" />
                </>
              ) : (
                <>
                  Próximo
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
