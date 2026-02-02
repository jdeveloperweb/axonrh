'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, MoreHorizontal, User, MapPin, Briefcase, FileText, Users, History, Mail, Phone, Calendar, Building2, Camera, Download, DollarSign, Plus, UserX, Copy, ExternalLink, Clock, AlertTriangle, MessageCircle, Check } from 'lucide-react';
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageCropDialog } from '@/components/ui/image-crop-dialog';
import { employeesApi, Employee, EmployeeDocument } from '@/lib/api/employees';
import { userApi, UserDTO } from '@/lib/api/users';
import { timesheetApi, WorkSchedule } from '@/lib/api/timesheet';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatCpf, formatCurrency, formatPhone, calculateAge, formatRelativeTime, getPhotoUrl, isValidEmail } from '@/lib/utils';
import { TerminationModal } from '@/components/employees/TerminationModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DependentsTab } from '@/components/employees/DependentsTab';
import { ShieldCheck, ShieldAlert, Key, CreditCard } from 'lucide-react';
import { EmployeeBadge } from '@/components/employees/EmployeeBadge';
import { useThemeStore } from '@/stores/theme-store';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type TabKey = 'overview' | 'documents' | 'dependents' | 'timesheet' | 'history';

const statusColors = {
  ACTIVE: { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', label: 'Ativo' },
  INACTIVE: { bg: 'bg-slate-50 border-slate-100', text: 'text-slate-600', label: 'Inativo' },
  ON_LEAVE: { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700', label: 'Afastado' },
  TERMINATED: { bg: 'bg-rose-50 border-rose-100', text: 'text-rose-700', label: 'Desligado' },
  PENDING: { bg: 'bg-sky-50 border-sky-100', text: 'text-sky-700', label: 'Pendente' },
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
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // Platform Access State
  const [platformUser, setPlatformUser] = useState<UserDTO | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(false);

  // Theme & Branding from store
  const { tenantTheme } = useThemeStore();
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
    if (activeTab === 'timesheet') {
      const loadSchedules = async () => {
        try {
          setLoadingSchedules(true);
          const data = await timesheetApi.listSchedules();
          setSchedules(data);
        } catch (error) {
          console.error('Failed to load schedules:', error);
        } finally {
          setLoadingSchedules(false);
        }
      };
      loadSchedules();
    }
  }, [activeTab, fetchDocuments, fetchHistory]);

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
    { key: 'timesheet' as TabKey, label: 'Ponto / Jornada', icon: Clock },
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
    <div className="p-0 space-y-8 animate-fade-in">
      {/* 🚀 New Premium Header Design */}
      <div className="relative mb-24">
        {/* Banner mais neutro e elegante */}
        <div className="h-44 md:h-56 rounded-b-[2.5rem] bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[var(--color-primary)]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl" />

          <button
            onClick={() => router.back()}
            className="absolute top-6 left-6 p-2.5 bg-white/20 hover:bg-white/40 text-white rounded-xl transition-all backdrop-blur-md border border-white/20 shadow-lg z-10 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Content overlapping the banner */}
        <div className="absolute -bottom-16 left-6 right-6 md:left-12 md:right-12 flex flex-col md:flex-row items-end gap-6">
          {/* Photo Profile with Ring & Action */}
          <div className="relative group shrink-0">
            <div className="w-36 h-36 md:w-44 md:h-44 rounded-[2.5rem] border-[6px] border-white dark:border-slate-900 shadow-2xl overflow-hidden bg-slate-100 relative">
              {employee.photoUrl ? (
                <img
                  src={getPhotoUrl(employee.photoUrl, employee.updatedAt) || ''}
                  alt={employee.fullName}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
                />
              ) : (
                <div className="w-full h-full bg-slate-200 text-slate-400 flex items-center justify-center text-5xl font-bold">
                  {employee.fullName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Overlay on hover for Photo Change */}
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                <Camera className="w-8 h-8 text-white" />
                <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
              </label>
            </div>

            {/* Status Floating Badge */}
            <div className={`absolute -top-2 -right-2 px-4 py-1.5 rounded-2xl text-xs font-black uppercase tracking-widest ${statusInfo.bg} ${statusInfo.text} border-2 shadow-xl ring-4 ring-white dark:ring-slate-900`}>
              {statusInfo.label}
            </div>
          </div>

          {/* Info Block & Primary Actions */}
          <div className="flex-1 flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-2 w-full">
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                  {employee.socialName || employee.fullName}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <span className="flex items-center gap-1.5 text-lg font-medium text-slate-500 dark:text-slate-400">
                    <Briefcase className="w-5 h-5 text-[var(--color-primary)]" />
                    {employee.position?.title || employee.position?.name || 'Sem cargo'}
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300 hidden md:block" />
                  <span className="flex items-center gap-1.5 text-lg font-medium text-slate-500 dark:text-slate-400">
                    <Building2 className="w-5 h-5 text-[var(--color-primary)]" />
                    {employee.department?.name || 'Sem departamento'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {platformUser ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                    Acesso Ativo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Sem Acesso
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800/50 text-slate-500 rounded-full text-xs font-mono border border-slate-100 dark:border-slate-700 shadow-sm">
                  ID: #{employee.registrationNumber}
                </span>
              </div>
            </div>

            {/* Desktop Actions Row */}
            <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl">
              <Button
                variant="ghost"
                onClick={handleGenerateBadge}
                disabled={generatingBadge}
                className="h-11 px-4 text-slate-600 dark:text-slate-300 hover:text-[var(--color-primary)] hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all gap-2"
              >
                <CreditCard className="w-4.5 h-4.5" />
                <span className="text-sm font-bold uppercase tracking-tight">{generatingBadge ? 'Gerando...' : 'Crachá'}</span>
              </Button>

              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

              <Button
                variant="ghost"
                onClick={() => router.push(`/employees/${employeeId}/edit`)}
                className="h-11 px-4 text-[var(--color-primary)] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all gap-2"
              >
                <Edit className="w-4.5 h-4.5" />
                <span className="text-sm font-bold uppercase tracking-tight">Editar</span>
              </Button>

              {employee.status !== 'TERMINATED' && (
                <Button
                  variant="ghost"
                  onClick={() => setTerminationModalOpen(true)}
                  className="h-11 px-4 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all gap-2"
                >
                  <UserX className="w-4.5 h-4.5" />
                  <span className="text-sm font-bold uppercase tracking-tight">Desligar</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 space-y-8">
        {/* Quick Info Dashboard Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { label: 'Matrícula', value: employee.registrationNumber, icon: User, color: 'bg-blue-50 text-blue-600' },
            { label: 'CPF', value: formatCpf(employee.cpf), icon: FileText, color: 'bg-indigo-50 text-indigo-600' },
            {
              label: 'Admissão',
              value: (employee.hireDate || employee.admissionDate) ? formatDate((employee.hireDate || employee.admissionDate)!) : '-',
              icon: Calendar,
              color: 'bg-emerald-50 text-emerald-600'
            },
            {
              label: 'E-mail',
              value: employee.email || '-',
              icon: Mail,
              color: 'bg-violet-50 text-violet-600',
              action: employee.email ? () => {
                navigator.clipboard.writeText(employee.email!);
                toast({ title: 'Copiado', description: 'E-mail copiado para a área de transferência' });
              } : undefined,
              actionIcon: Copy
            },
            {
              label: 'Telefone',
              value: formatPhone(employee.phone || employee.mobile || employee.personalPhone || ''),
              icon: Phone,
              color: 'bg-emerald-50 text-emerald-600',
              action: (employee.phone || employee.mobile || employee.personalPhone) ? () => {
                const tel = (employee.phone || employee.mobile || employee.personalPhone || '').replace(/\D/g, '');
                window.open(`https://wa.me/55${tel}`, '_blank');
              } : undefined,
              actionIcon: MessageCircle
            },
            { label: 'Contrato', value: employee.employmentType, icon: Building2, color: 'bg-slate-50 text-slate-600' },
          ].map((item, idx) => (
            <Card key={idx} className="group hover:scale-105 transition-all duration-300 border-none shadow-sm hover:shadow-md bg-white dark:bg-slate-800 overflow-hidden relative">
              <div className={`absolute top-0 left-0 w-1 h-full ${item.color.split(' ')[1].replace('text', 'bg')}`} />
              <CardContent className="p-4 flex flex-col gap-2">
                <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center mb-1 group-hover:rotate-12 transition-transform`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{item.label}</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{item.value}</p>
                  </div>
                  {item.action && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        item.action?.();
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {item.actionIcon && <item.actionIcon className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sleek Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 scrollbar-hide overflow-x-auto">
          <nav className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all whitespace-nowrap relative
                    ${isActive
                      ? 'text-[var(--color-primary)]'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}
                  `}
                >
                  <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--color-primary)] rounded-t-full animate-scale-in" />
                  )}
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
                            <span
                              key={role}
                              className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider"
                            >
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

        {activeTab === 'timesheet' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[var(--color-primary)]" />
                Configuração de Jornada de Trabalho
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-4">
                <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-bold">Atenção</p>
                  <p>Vincular uma escala define os horários de entrada, saída e regras de banco de horas para este colaborador.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Escala de Trabalho Atual</Label>
                  <div className="flex gap-2">
                    <Select
                      defaultValue={employee.workScheduleId}
                      onValueChange={async (value) => {
                        try {
                          await timesheetApi.assignSchedule(employeeId, value, new Date().toISOString().split('T')[0]);
                          toast({ title: 'Sucesso', description: 'Escala atribuída com sucesso!' });
                          fetchEmployee();
                        } catch (e) {
                          toast({ title: 'Erro', description: 'Falha ao atribuir escala', variant: 'destructive' });
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione uma escala..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma escala</SelectItem>
                        {loadingSchedules ? (
                          <SelectItem value="loading">Carregando...</SelectItem>
                        ) : (
                          schedules.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name} ({s.weeklyHoursFormatted})</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Vigência da Escala (Início)</Label>
                  <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>

              <div className="pt-6 border-t flex justify-end">
                <Button onClick={() => router.push('/settings/labor')} variant="outline" className="text-xs">
                  Gerenciar Modelos de Escala
                </Button>
              </div>
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
              colors={tenantTheme?.colors}
              companyLogo={tenantTheme?.logoUrl ? getPhotoUrl(tenantTheme.logoUrl, undefined, 'logo') || undefined : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
