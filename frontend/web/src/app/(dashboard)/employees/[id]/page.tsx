'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, MoreHorizontal, User, MapPin, Briefcase, FileText, Users, History, Mail, Phone, Calendar, Building2, Camera, Download, DollarSign, Plus, UserX, Copy, ExternalLink } from 'lucide-react';
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageCropDialog } from '@/components/ui/image-crop-dialog';
import { employeesApi, Employee, EmployeeDocument } from '@/lib/api/employees';
import { userApi, UserDTO } from '@/lib/api/users';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatCpf, formatCurrency, formatPhone, calculateAge, formatRelativeTime, getPhotoUrl, isValidEmail } from '@/lib/utils';
import { TerminationModal } from '@/components/employees/TerminationModal';
import { Button } from '@/components/ui/button';
import { DependentsTab } from '@/components/employees/DependentsTab';
import { ShieldCheck, ShieldAlert, Key, CreditCard } from 'lucide-react';
import { EmployeeBadge } from '@/components/employees/EmployeeBadge';
import { configApi, ThemeConfig } from '@/lib/api/config';
import { authApi } from '@/lib/api/auth';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type TabKey = 'overview' | 'documents' | 'dependents' | 'history';

const statusColors = {
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ativo' },
  INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inativo' },
  ON_LEAVE: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Afastado' },
  TERMINATED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Desligado' },
  PENDING: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Pendente' },
};

const raceTranslations: Record<string, string> = {
  'BRANCO': 'Branca',
  'PARDO': 'Parda',
  'PRETO': 'Preta',
  'AMARELO': 'Amarela',
  'INDIGENA': 'Indígena',
  'NAO_INFORMADO': 'Não informado'
};

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const employeeId = params.id as string;

  // State
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);

  interface HistoryEntry {
    action: string;
    description: string;
    createdAt: string;
    createdBy: string;
  }
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [terminationModalOpen, setTerminationModalOpen] = useState(false);

  // Platform Access State
  const [platformUser, setPlatformUser] = useState<UserDTO | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(false);

  // Theme & Logo for Badge
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | undefined>(undefined);
  const [companyLogo, setCompanyLogo] = useState<string | undefined>(undefined);
  const [generatingBadge, setGeneratingBadge] = useState(false);

  // Fetch employee
  const fetchEmployee = useCallback(async () => {
    try {
      setLoading(true);
      const data = await employeesApi.getById(employeeId);
      setEmployee(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados do colaborador',
        variant: 'destructive',
      });
      router.push('/employees');
      setLoading(false);
    }
  }, [employeeId, router, toast]);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      const data = await employeesApi.getDocuments(employeeId);
      setDocuments(data);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  }, [employeeId]);



  // Fetch history
  const fetchHistory = useCallback(async () => {
    try {
      const data = await employeesApi.getHistory(employeeId);
      setHistory(data as unknown as HistoryEntry[]);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  // Check platform access whenever employee data (email) changes
  useEffect(() => {
    const checkAccess = async () => {
      if (employee?.email && isValidEmail(employee.email)) {
        try {
          setCheckingAccess(true);
          const users = await userApi.list();
          const existingUser = users.find(u => u.email.toLowerCase() === employee.email!.toLowerCase());
          setPlatformUser(existingUser || null);
        } catch (error) {
          console.warn('⚠️ Não foi possível verificar acesso à plataforma:', error);
        } finally {
          setCheckingAccess(false);
        }
      }
    };
    checkAccess();
  }, [employee?.email]);

  useEffect(() => {
    if (activeTab === 'documents') fetchDocuments();
    if (activeTab === 'history') fetchHistory();
  }, [activeTab, fetchDocuments, fetchHistory]);

  // Fetch Theme Config
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const user = await authApi.me();
        if (user.tenantId) {
          const config = await configApi.getThemeConfig(user.tenantId);
          setThemeConfig(config);
          if (config.logoUrl) {
            // Ensure logo is loaded and accessible (CORS can be tricky, but we try)
            setCompanyLogo(config.logoUrl);
          }
        }
      } catch (error) {
        console.warn('Failed to load theme config for badge:', error);
      }
    };
    fetchTheme();
  }, []);

  const handleGenerateBadge = async () => {
    try {
      setGeneratingBadge(true);

      // Give React a moment to ensure the hidden badge is rendered
      await new Promise(resolve => setTimeout(resolve, 500));

      const badgeElement = document.getElementById('employee-badge-container');
      if (!badgeElement) {
        throw new Error('Container do crachá não encontrado');
      }

      const canvas = await html2canvas(badgeElement, {
        scale: 3, // High quality
        useCORS: true,
        backgroundColor: null,
      });

      const imgData = canvas.toDataURL('image/png');

      // CR80 size: 53.98mm x 85.6mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [53.98, 85.6]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 53.98, 85.6);
      pdf.save(`cracha-${employee?.fullName.toLowerCase().replace(/\s+/g, '-')}.pdf`);

      toast({
        title: 'Sucesso',
        description: 'Crachá gerado com sucesso!',
      });
    } catch (error) {
      console.error('Failed to generate badge:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao gerar o crachá em PDF',
        variant: 'destructive',
      });
    } finally {
      setGeneratingBadge(false);
    }
  };

  // Handle photo selection - opens crop dialog
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione uma imagem válida',
        variant: 'destructive',
      });
      return;
    }

    // Create preview URL and open crop dialog
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setShowCropDialog(true);
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  // Handle cropped image - upload to server
  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      // Convert blob to file
      const file = new File([croppedBlob], 'profile-photo.jpg', {
        type: 'image/jpeg',
      });

      // Upload to server
      const result = await employeesApi.uploadPhoto(employeeId, file);

      // Update employee state
      setEmployee(result);

      // Close dialog
      setShowCropDialog(false);
      setSelectedImage(null);

      toast({
        title: 'Sucesso',
        description: 'Foto atualizada com sucesso',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar foto',
        variant: 'destructive',
      });
    }
  };

  // Handle crop cancel
  const handleCropCancel = () => {
    setShowCropDialog(false);
    setSelectedImage(null);
  };

  const tabs = [
    { key: 'overview' as TabKey, label: 'Visão Geral', icon: User },
    { key: 'documents' as TabKey, label: 'Documentos', icon: FileText },
    { key: 'dependents' as TabKey, label: 'Dependentes', icon: Users },
    { key: 'history' as TabKey, label: 'Histórico', icon: History },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!employee) return null;

  const statusInfo = statusColors[employee.status] || statusColors.PENDING;

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">
              {employee.socialName || employee.fullName}
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              {employee.position?.title || employee.position?.name || 'Sem cargo'} • {employee.department?.name || 'Sem departamento'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.text}`}>
            {statusInfo.label}
          </span>
          {platformUser ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold border border-indigo-100 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              Acesso Ativo
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-sm font-medium border border-gray-100">
              <ShieldAlert className="w-3.5 h-3.5" />
              Sem Acesso
            </span>
          )}
          {employee.status !== 'TERMINATED' && (
            <Button
              variant="outline"
              onClick={() => setTerminationModalOpen(true)}
              className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <UserX className="w-4 h-4" />
              Desligar
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleGenerateBadge}
            disabled={generatingBadge}
            className="flex items-center gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <CreditCard className="w-4 h-4" />
            {generatingBadge ? 'Gerando...' : 'Gerar Crachá'}
          </Button>
          <Button
            onClick={() => router.push(`/employees/${employeeId}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Editar
          </Button>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Photo */}
            <div className="relative">
              {employee.photoUrl ? (
                <img
                  src={getPhotoUrl(employee.photoUrl, employee.updatedAt) || ''}
                  alt={employee.fullName}
                  className="w-32 h-32 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              {(true) && (
                <div className={`${employee.photoUrl ? 'hidden' : ''} w-32 h-32 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-4xl font-bold`}>
                  {employee.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <label className="absolute bottom-0 right-0 p-2 bg-white border border-gray-200 rounded-full cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
                <Camera className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Quick Info */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <User className="w-5 h-5 text-[var(--color-text-secondary)]" />
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Matrícula</p>
                  <p className="font-medium text-[var(--color-text)]">{employee.registrationNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FileText className="w-5 h-5 text-[var(--color-text-secondary)]" />
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">CPF</p>
                  <p className="font-medium text-[var(--color-text)]">{formatCpf(employee.cpf)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-[var(--color-text-secondary)]" />
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Admissão</p>
                  <p className="font-medium text-[var(--color-text)]">
                    {(() => {
                      const admissionDate = employee.hireDate || employee.admissionDate;
                      return admissionDate ? formatDate(admissionDate) : '-';
                    })()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Mail className="w-5 h-5 text-[var(--color-text-secondary)]" />
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">E-mail</p>
                  <p className="font-medium text-[var(--color-text)]">{employee.email || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Phone className="w-5 h-5 text-[var(--color-text-secondary)]" />
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Telefone</p>
                  <p className="font-medium text-[var(--color-text)]">{formatPhone(employee.phone || employee.mobile || employee.personalPhone || '')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-[var(--color-text-secondary)]" />
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Tipo Contrato</p>
                  <p className="font-medium text-[var(--color-text)]">{employee.employmentType}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Nome Completo</p>
                  <p className="font-medium text-[var(--color-text)]">{employee.fullName}</p>
                </div>
                {employee.socialName && (
                  <div>
                    <p className="text-sm text-[var(--color-text-secondary)]">Nome Social</p>
                    <p className="font-medium text-[var(--color-text)]">{employee.socialName}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Data de Nascimento</p>
                  <p className="font-medium text-[var(--color-text)]">
                    {employee.birthDate ? `${formatDate(employee.birthDate)} (${calculateAge(employee.birthDate)} anos)` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Sexo</p>
                  <p className="font-medium text-[var(--color-text)]">
                    {employee.gender === 'MALE' ? 'Masculino' : employee.gender === 'FEMALE' ? 'Feminino' : employee.gender || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Cor/Raça</p>
                  <p className="font-medium text-[var(--color-text)]">
                    {employee.race ?
                      (raceTranslations[employee.race] || employee.race) :
                      (employee.ethnicity ? (raceTranslations[employee.ethnicity] || employee.ethnicity) : '-')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Estado Civil</p>
                  <p className="font-medium text-[var(--color-text)]">{employee.maritalStatus || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Nacionalidade</p>
                  <p className="font-medium text-[var(--color-text)]">{employee.nationality || '-'}</p>
                </div>
                <div className="col-span-2 pt-4 border-t border-gray-100 mt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-indigo-500" />
                      <p className="text-sm font-bold text-gray-700">Acesso à Plataforma</p>
                    </div>
                    {checkingAccess ? (
                      <span className="text-xs text-gray-400 animate-pulse">Verificando...</span>
                    ) : platformUser ? (
                      <div className="flex flex-wrap gap-2">
                        {platformUser.roles.map(role => (
                          <span key={role} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                            {role}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Nenhum perfil atribuído</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">E-mail Pessoal</p>
                  <p className="font-medium text-[var(--color-text)]">{employee.personalEmail || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Telefone Pessoal</p>
                  <p className="font-medium text-[var(--color-text)]">{formatPhone(employee.mobile || employee.personalPhone || '')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address - Creative Redesign */}
          <Card className="col-span-1 lg:col-span-1 overflow-hidden border-none shadow-lg relative group h-[320px] w-full transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-0 h-full w-full relative">
              {employee.address ? (
                <>
                  {/* Map Background */}
                  <div className="absolute inset-0 z-0">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight={0}
                      marginWidth={0}
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(
                        `${employee.address.street}, ${employee.address.number}, ${employee.address.city} - ${employee.address.state}`
                      )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      title="Localização"
                      className="w-full h-full filter grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-110"
                    />
                  </div>

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none z-10 transition-opacity duration-300 group-hover:opacity-70" />

                  {/* Floating Info Card */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/40 z-20 transform transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                          <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider">Localização</span>
                        </div>

                        <h4 className="font-bold text-gray-900 text-base leading-tight">
                          {employee.address.street}, {employee.address.number}
                        </h4>
                        <p className="text-sm text-gray-600 font-medium">
                          {employee.address.neighborhood}
                          {employee.address.complement && <span className="text-gray-400 font-normal"> • {employee.address.complement}</span>}
                        </p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mt-1">
                          {employee.address.city} - {employee.address.state}
                        </p>
                        <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 bg-gray-100/80 rounded-md text-xs font-mono text-gray-600">
                          <span>CEP: {employee.address.zipCode}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => {
                            if (!employee.address) return;
                            const fullAddress = `${employee.address.street}, ${employee.address.number} - ${employee.address.neighborhood}, ${employee.address.city} - ${employee.address.state}, ${employee.address.zipCode}`;
                            navigator.clipboard.writeText(fullAddress);
                            toast({
                              title: "Endereço copiado",
                              description: "Endereço copiado para a área de transferência",
                            });
                          }}
                          className="p-2 rounded-full bg-white shadow-sm hover:bg-gray-50 text-gray-600 transition-colors border border-gray-100"
                          title="Copiar Endereço"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (!employee.address) return;
                            const query = encodeURIComponent(`${employee.address.street}, ${employee.address.number}, ${employee.address.city} - ${employee.address.state}`);
                            window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                          }}
                          className="p-2 rounded-full bg-[var(--color-primary)] shadow-sm hover:opacity-90 text-white transition-opacity border border-transparent"
                          title="Abrir no Google Maps"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-400">
                  <MapPin className="w-12 h-12 mb-2 opacity-20" />
                  <p>Endereço não cadastrado</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Dados Profissionais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Departamento</p>
                  <p className="font-medium text-[var(--color-text)]">{employee.department?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Cargo</p>
                  <p className="font-medium text-[var(--color-text)]">{employee.position?.title || employee.position?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Centro de Custo</p>
                  <p className="font-medium text-[var(--color-text)]">
                    {employee.costCenter ? `${employee.costCenter.code} - ${employee.costCenter.name}` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Gestor</p>
                  <p className="font-medium text-[var(--color-text)]">{employee.manager?.name || employee.manager?.fullName || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compensation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Remuneração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Salário Base</p>
                  <p className="font-medium text-[var(--color-text)]">{formatCurrency(employee.baseSalary || employee.salary || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Carga Horária</p>
                  <p className="font-medium text-[var(--color-text)]">{employee.weeklyHours || employee.workHoursPerWeek || 44}h semanais</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Tipo de Contrato</p>
                  <p className="font-medium text-[var(--color-text)]">{employee.employmentType}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Regime de Trabalho</p>
                  <p className="font-medium text-[var(--color-text)]">
                    {employee.workRegime === 'PRESENCIAL' ? 'Presencial' :
                      employee.workRegime === 'REMOTO' ? 'Home Office' :
                        employee.workRegime === 'HIBRIDO' ? `Híbrido (${employee.hybridFrequency}x na semana)` :
                          employee.workRegime || '-'}
                  </p>
                </div>
                {employee.workRegime === 'HIBRIDO' && employee.hybridWorkDays && employee.hybridWorkDays.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-sm text-[var(--color-text-secondary)]">Dias Presenciais</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {employee.hybridWorkDays.map((day) => (
                        <span key={day} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {day.charAt(0) + day.slice(1).toLowerCase().replace('terca', 'terça')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'documents' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Documentos</CardTitle>
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-secondary)] opacity-50" />
                <p className="text-[var(--color-text-secondary)]">Nenhum documento cadastrado</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <FileText className="w-5 h-5 text-[var(--color-text-secondary)]" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--color-text)]">{doc.type}</p>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          {doc.number} {doc.issuingAuthority && `• ${doc.issuingAuthority}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.fileUrl && (
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Download className="w-4 h-4 text-[var(--color-text-secondary)]" />
                        </button>
                      )}
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-[var(--color-text-secondary)]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'dependents' && (
        <DependentsTab employeeId={employeeId} />
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Alterações</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-secondary)] opacity-50" />
                <p className="text-[var(--color-text-secondary)]">Nenhuma alteração registrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((entry, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-[var(--color-primary)] rounded-full" />
                      {index < history.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-200 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium text-[var(--color-text)]">{entry.action}</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">{entry.description}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        {formatRelativeTime(entry.createdAt)} por {entry.createdBy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Image Crop Dialog */}
      {showCropDialog && selectedImage && (
        <ImageCropDialog
          image={selectedImage}
          onComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
        />
      )}

      {/* Termination Modal */}
      <TerminationModal
        isOpen={terminationModalOpen}
        onClose={() => setTerminationModalOpen(false)}
        employee={employee}
        onSuccess={fetchEmployee}
      />
      {/* Hidden Badge for Rendering */}
      <div
        style={{
          position: 'absolute',
          top: '-10000px',
          left: '-10000px'
        }}
      >
        <div id="employee-badge-container">
          <EmployeeBadge
            employee={employee}
            theme={themeConfig}
            companyLogo={companyLogo}
          />
        </div>
      </div>
    </div>
  );
}
