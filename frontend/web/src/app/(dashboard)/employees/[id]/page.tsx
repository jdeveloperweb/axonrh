'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  MoreHorizontal,
  User,
  MapPin,
  Briefcase,
  FileText,
  Users,
  History,
  Mail,
  Phone,
  Calendar,
  Building2,
  Camera,
  Download,
  DollarSign,
  Plus
} from 'lucide-react';
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { employeesApi, Employee, EmployeeDocument, EmployeeDependent } from '@/lib/api/employees';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatCpf, formatCurrency, formatPhone, calculateAge, formatRelativeTime } from '@/lib/utils';

type TabKey = 'overview' | 'documents' | 'dependents' | 'history';

const statusColors = {
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ativo' },
  INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inativo' },
  ON_LEAVE: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Afastado' },
  TERMINATED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Desligado' },
  PENDING: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Pendente' },
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
  const [dependents, setDependents] = useState<EmployeeDependent[]>([]);
  interface HistoryEntry {
    action: string;
    description: string;
    createdAt: string;
    createdBy: string;
  }
  const [history, setHistory] = useState<HistoryEntry[]>([]);

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

  // Fetch dependents
  const fetchDependents = useCallback(async () => {
    try {
      const data = await employeesApi.getDependents(employeeId);
      setDependents(data);
    } catch (error) {
      console.error('Failed to load dependents:', error);
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

  useEffect(() => {
    if (activeTab === 'documents') fetchDocuments();
    if (activeTab === 'dependents') fetchDependents();
    if (activeTab === 'history') fetchHistory();
  }, [activeTab, fetchDocuments, fetchDependents, fetchHistory]);

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await employeesApi.uploadPhoto(employeeId, file);
      setEmployee(prev => prev ? { ...prev, photoUrl: result.photoUrl } : null);
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
          <button
            onClick={() => router.push(`/employees/${employeeId}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Edit className="w-4 h-4" />
            Editar
          </button>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Photo */}
            <div className="relative">
              {employee.photoUrl ? (
                <Image
                  src={employee.photoUrl}
                  alt={employee.fullName}
                  width={128}
                  height={128}
                  className="w-32 h-32 rounded-full object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-4xl font-bold">
                  {employee.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <label className="absolute bottom-0 right-0 p-2 bg-white border border-gray-200 rounded-full cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
                <Camera className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
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
                  <p className="font-medium text-[var(--color-text)]">{formatDate(employee.hireDate || employee.admissionDate)}</p>
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
                  <p className="text-sm text-[var(--color-text-secondary)]">Estado Civil</p>
                  <p className="font-medium text-[var(--color-text)]">{employee.maritalStatus || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Nacionalidade</p>
                  <p className="font-medium text-[var(--color-text)]">{employee.nationality || '-'}</p>
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

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employee.address ? (
                <div className="space-y-2">
                  <p className="font-medium text-[var(--color-text)]">
                    {employee.address.street}, {employee.address.number}
                    {employee.address.complement && ` - ${employee.address.complement}`}
                  </p>
                  <p className="text-[var(--color-text-secondary)]">
                    {employee.address.neighborhood}
                  </p>
                  <p className="text-[var(--color-text-secondary)]">
                    {employee.address.city} - {employee.address.state}
                  </p>
                  <p className="text-[var(--color-text-secondary)]">
                    CEP: {employee.address.zipCode}
                  </p>
                </div>
              ) : (
                <p className="text-[var(--color-text-secondary)]">Endereço não cadastrado</p>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Dependentes</CardTitle>
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          </CardHeader>
          <CardContent>
            {dependents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-secondary)] opacity-50" />
                <p className="text-[var(--color-text-secondary)]">Nenhum dependente cadastrado</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {dependents.map((dep) => (
                  <div key={dep.id} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <User className="w-5 h-5 text-[var(--color-text-secondary)]" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--color-text)]">{dep.name}</p>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          {dep.relationship} • {formatDate(dep.birthDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        {dep.isIRDependent && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">IR</span>
                        )}
                        {dep.isHealthPlanDependent && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Plano</span>
                        )}
                      </div>
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
    </div>
  );
}
