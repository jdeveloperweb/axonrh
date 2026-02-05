'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Briefcase,
    MapPin,
    Clock,
    Building2,
    DollarSign,
    ArrowLeft,
    CheckCircle,
    Upload,
    FileText,
    X,
    Loader2,
    Globe,
    User,
    Mail,
    Phone,
    Linkedin,
    Sparkles,
    ShieldCheck,
} from 'lucide-react';
import { talentPoolApi, PublicVacancy, PublicApplicationData, getEmploymentTypeLabel, getWorkRegimeLabel } from '@/lib/api/talent-pool';
import { useThemeStore } from '@/stores/theme-store';
import { cn, getPhotoUrl } from '@/lib/utils';
import { configApi } from '@/lib/api/config';

export default function VacancyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const tenantId = params.tenantId as string;
    const publicCode = params.publicCode as string;
    const { tenantTheme, setTenantTheme } = useThemeStore();

    const [vacancy, setVacancy] = useState<PublicVacancy | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [resumeFile, setResumeFile] = useState<File | null>(null);

    const [formData, setFormData] = useState<PublicApplicationData>({
        fullName: '',
        email: '',
        phone: '',
        city: '',
        state: '',
        linkedinUrl: 'https://linkedin.com/in/',
        portfolioUrl: '',
    });

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!tenantId) return;

        // Garantir que o setup_tenant_id está definido para as chamadas de API públicas
        localStorage.setItem('setup_tenant_id', tenantId);

        const fetchVacancy = async () => {
            try {
                const data = await talentPoolApi.getPublicVacancy(publicCode);
                setVacancy(data);
            } catch (err: unknown) {
                const error = err as { response?: { data?: { message?: string } } };
                setError(error.response?.data?.message || 'Vaga não encontrada');
            } finally {
                setLoading(false);
            }
        };

        const fetchBranding = async () => {
            // Re-fleta se o tenantTheme for nulo ou se o tenantId for diferente do atual
            if (!tenantTheme || tenantTheme.tenantId !== tenantId) {
                try {
                    const config = await configApi.getThemeConfig(tenantId);
                    setTenantTheme({
                        tenantId: config.tenantId,
                        logoUrl: config.logoUrl,
                        logoWidth: (config.extraSettings?.logoWidth as number) || 150,
                        colors: {
                            primary: config.primaryColor || '#1976D2',
                            secondary: config.secondaryColor || '#424242',
                            accent: config.accentColor || '#FF4081',
                            background: config.backgroundColor || '#FFFFFF',
                            surface: config.surfaceColor || '#FAFAFA',
                            textPrimary: config.textPrimaryColor || '#212121',
                            textSecondary: config.textSecondaryColor || '#757575',
                        },
                        baseFontSize: (config.extraSettings?.baseFontSize as number) || 16,
                        customCss: config.customCss,
                        faviconUrl: config.faviconUrl
                    });
                } catch (e) {
                    console.error('Error fetching branding:', e);
                }
            }
        };

        if (publicCode) {
            fetchVacancy();
            fetchBranding();
        }
    }, [tenantId, publicCode, tenantTheme, setTenantTheme]);

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.fullName.trim()) {
            errors.fullName = 'Nome é obrigatório';
        }

        if (!formData.email.trim()) {
            errors.email = 'Email é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Email inválido';
        }

        if (formData.linkedinUrl && !formData.linkedinUrl.includes('linkedin.com')) {
            errors.linkedinUrl = 'URL do LinkedIn inválida';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setSubmitting(true);

        try {
            await talentPoolApi.applyToVacancy(publicCode, formData, resumeFile || undefined);
            setSubmitted(true);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            const message = error.response?.data?.message || 'Erro ao enviar candidatura';
            setFormErrors({ submit: message });
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!validTypes.includes(file.type)) {
                setFormErrors({ ...formErrors, resume: 'Apenas arquivos PDF ou Word são aceitos' });
                return;
            }
            if (file.size > 10 * 1024 * 1024) { // 10MB
                setFormErrors({ ...formErrors, resume: 'Arquivo muito grande (máximo 10MB)' });
                return;
            }
            setResumeFile(file);
            const newErrors = { ...formErrors };
            delete newErrors.resume;
            setFormErrors(newErrors);
        }
    };

    const primaryColor = tenantTheme?.colors?.primary || '#1976D2';

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
                <div
                    className="w-12 h-12 border-4 border-gray-100 border-t-transparent rounded-full animate-spin"
                    style={{ borderTopColor: primaryColor }}
                />
                <p className="text-gray-400 font-medium">Carregando detalhes da vaga...</p>
            </div>
        );
    }

    if (error || !vacancy) {
        return (
            <div className="min-h-screen bg-[var(--color-surface-variant)]/30 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md text-center border border-gray-100">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <X className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Vaga não encontrada</h2>
                    <p className="text-gray-500 mb-8 leading-relaxed">{error || 'Esta vaga pode ter sido encerrada ou o link está incorreto.'}</p>
                    <Link
                        href={`/careers/${tenantId}`}
                        className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all font-bold"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Ver todas as vagas
                    </Link>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-[var(--color-surface-variant)]/30 flex items-center justify-center p-4">
                <div className="bg-white rounded-[2.5rem] shadow-2xl p-12 max-w-lg text-center border border-gray-100 relative overflow-hidden">
                    <div
                        className="absolute top-0 left-0 w-full h-2"
                        style={{ backgroundColor: primaryColor }}
                    />
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Candidatura enviada!</h2>
                    <p className="text-gray-500 mb-10 leading-relaxed text-lg">
                        Recebemos sua candidatura para a vaga de <br />
                        <strong className="text-gray-900">{vacancy.title}</strong>. <br />
                        Nossa equipe irá analisar seu perfil e entraremos em contato em breve através do seu email.
                    </p>
                    <Link
                        href={`/careers/${tenantId}`}
                        className="inline-flex items-center justify-center gap-2 px-10 py-4 text-white rounded-2xl font-bold shadow-xl hover:scale-105 transition-all"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Ver outras oportunidades
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-surface-variant)]/30 pb-20">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <Link
                        href={`/careers/${tenantId}`}
                        className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors bg-gray-50 px-4 py-2 rounded-xl"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para vagas
                    </Link>
                    {tenantTheme?.logoUrl && (
                        <img
                            src={getPhotoUrl(tenantTheme.logoUrl, undefined, 'logo') || ''}
                            alt="Logo"
                            className="h-8 w-auto object-contain hidden sm:block"
                        />
                    )}
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* Vacancy Details */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Summary Card */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 sm:p-10">
                            <div className="flex flex-col sm:flex-row items-start gap-6">
                                <div
                                    className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                                    style={{ background: `linear-gradient(135deg, ${primaryColor}, #6366f1)` }}
                                >
                                    <Briefcase className="w-10 h-10 text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-widest">
                                        {vacancy.workRegime && (
                                            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                                {getWorkRegimeLabel(vacancy.workRegime)}
                                            </span>
                                        )}
                                        {vacancy.employmentType && (
                                            <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-100">
                                                {getEmploymentTypeLabel(vacancy.employmentType)}
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight">
                                        {vacancy.title}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-sm text-gray-500 font-medium">
                                        {vacancy.departmentName && (
                                            <span className="flex items-center gap-2 leading-none bg-gray-50 px-3 py-1.5 rounded-lg">
                                                <Building2 className="w-4 h-4 text-gray-400" />
                                                {vacancy.departmentName}
                                            </span>
                                        )}
                                        {vacancy.location && (
                                            <span className="flex items-center gap-2 leading-none bg-gray-50 px-3 py-1.5 rounded-lg">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                {vacancy.location}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                {(vacancy.salaryRangeMin || vacancy.salaryRangeMax) && (
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                            <DollarSign className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Salário</p>
                                            <p className="font-bold text-gray-900">
                                                {vacancy.salaryRangeMin && vacancy.salaryRangeMax
                                                    ? `R$ ${vacancy.salaryRangeMin.toLocaleString('pt-BR')} - R$ ${vacancy.salaryRangeMax.toLocaleString('pt-BR')}`
                                                    : vacancy.salaryRangeMin
                                                        ? `A partir de R$ ${vacancy.salaryRangeMin.toLocaleString('pt-BR')}`
                                                        : `Até R$ ${vacancy.salaryRangeMax?.toLocaleString('pt-BR')}`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {vacancy.deadline && (
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                            <Clock className="w-6 h-6 text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Inscrições Até</p>
                                            <p className="font-bold text-gray-900">
                                                {new Date(vacancy.deadline).toLocaleDateString('pt-BR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content sections */}
                        <div className="space-y-8">
                            {[
                                { title: 'Sobre a Vaga', icon: Sparkles, content: vacancy.description, color: 'text-amber-500', bg: 'bg-amber-50' },
                                { title: 'Responsabilidades', icon: CheckCircle, content: vacancy.responsibilities, color: 'text-blue-500', bg: 'bg-blue-50' },
                                { title: 'Requisitos', icon: ShieldCheck, content: vacancy.requirements, color: 'text-purple-500', bg: 'bg-purple-50' },
                                { title: 'Benefícios', icon: DollarSign, content: vacancy.benefits, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                            ].map((section, idx) => section.content && (
                                <div key={idx} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 100}ms` }}>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className={`w-10 h-10 ${section.bg} rounded-xl flex items-center justify-center`}>
                                            <section.icon className={`w-5 h-5 ${section.color}`} />
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                                    </div>
                                    <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                                        {section.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Application Form Sidebar */}
                    <div className="lg:col-span-5">
                        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 sm:p-10 sticky top-28 overflow-hidden relative">
                            <div
                                className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)]/5 rounded-full -mt-16 -mr-16 blur-2xl"
                            />

                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Envie seu Currículo</h2>
                            <p className="text-gray-500 text-sm mb-8 font-medium">Complete as informações abaixo para se candidatar</p>

                            {formErrors.submit && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm flex items-center gap-3">
                                    <X className="w-5 h-5 flex-shrink-0" />
                                    {formErrors.submit}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">
                                        Nome Completo *
                                    </label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" />
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all text-gray-900 font-medium placeholder:text-gray-300 ${formErrors.fullName ? 'ring-2 ring-red-100' : ''
                                                }`}
                                            placeholder="Seu nome completo"
                                        />
                                    </div>
                                    {formErrors.fullName && (
                                        <p className="mt-1.5 text-xs text-red-600 font-bold ml-1">{formErrors.fullName}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">
                                        Email corporativo ou pessoal *
                                    </label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all text-gray-900 font-medium placeholder:text-gray-300 ${formErrors.email ? 'ring-2 ring-red-100' : ''
                                                }`}
                                            placeholder="seu@email.com"
                                        />
                                    </div>
                                    {formErrors.email && (
                                        <p className="mt-1.5 text-xs text-red-600 font-bold ml-1">{formErrors.email}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">
                                            Telefone
                                        </label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" />
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, '');
                                                    let formatted = '';
                                                    if (value.length > 0) {
                                                        formatted = '(' + value.substring(0, 2);
                                                        if (value.length > 2) {
                                                            formatted += ') ' + value.substring(2, 7);
                                                        }
                                                        if (value.length > 7) {
                                                            formatted += '-' + value.substring(7, 11);
                                                        }
                                                    }
                                                    setFormData({ ...formData, phone: formatted });
                                                }}
                                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all text-gray-900 font-medium placeholder:text-gray-300"
                                                placeholder="(00) 00000-0000"
                                                maxLength={15}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">
                                            Cidade/UF
                                        </label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" />
                                            <input
                                                type="text"
                                                value={formData.city ? `${formData.city}${formData.state ? ` / ${formData.state}` : ''}` : ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val.includes('/')) {
                                                        const [city, state] = val.split('/').map(s => s.trim());
                                                        setFormData({ ...formData, city, state: state?.toUpperCase().slice(0, 2) || '' });
                                                    } else {
                                                        setFormData({ ...formData, city: val });
                                                    }
                                                }}
                                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all text-gray-900 font-medium placeholder:text-gray-300"
                                                placeholder="Sua cidade"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">
                                        Perfil LinkedIn
                                    </label>
                                    <div className="relative group">
                                        <Linkedin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" />
                                        <input
                                            type="url"
                                            value={formData.linkedinUrl}
                                            onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                                            className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all text-gray-900 font-medium placeholder:text-gray-300 ${formErrors.linkedinUrl ? 'ring-2 ring-red-100' : ''
                                                }`}
                                            placeholder="linkedin.com/in/seu-perfil"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">
                                        Seu Currículo (PDF ou Word) *
                                    </label>
                                    <div className={cn(
                                        "border-2 border-dashed rounded-[2rem] p-8 text-center transition-all cursor-pointer group",
                                        resumeFile
                                            ? "border-green-200 bg-green-50/50"
                                            : "border-gray-100 bg-gray-50 hover:bg-gray-100/50 hover:border-[var(--color-primary)]/30"
                                    )}>
                                        {resumeFile ? (
                                            <div className="flex flex-col items-center">
                                                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-3">
                                                    <FileText className="w-7 h-7 text-green-600" />
                                                </div>
                                                <p className="text-sm font-bold text-gray-900 truncate max-w-full px-4 mb-2">
                                                    {resumeFile.name}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.preventDefault(); setResumeFile(null); }}
                                                    className="text-xs font-bold text-red-500 hover:text-red-700 underline"
                                                >
                                                    Remover arquivo
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer block w-full h-full">
                                                <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3 group-hover:text-[var(--color-primary)]/50 transition-colors" />
                                                <p className="text-sm font-bold text-gray-700">Clique para anexar</p>
                                                <p className="text-xs text-gray-400 mt-1 font-medium">Até 10MB</p>
                                                <input
                                                    type="file"
                                                    accept=".pdf,.doc,.docx"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>
                                    {formErrors.resume && (
                                        <p className="mt-1.5 text-xs text-red-600 font-bold ml-1">{formErrors.resume}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-4 rounded-[1.5rem] font-bold text-white shadow-xl hover:scale-[1.02] transform transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-6"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Processando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            <span>Enviar Candidatura</span>
                                        </>
                                    )}
                                </button>

                                <div className="flex items-center gap-2 justify-center mt-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>Seus dados estão protegidos</span>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-2">
                            {tenantTheme?.logoUrl ? (
                                <img
                                    src={getPhotoUrl(tenantTheme.logoUrl, undefined, 'logo') || ''}
                                    alt="Logo"
                                    className="h-8 w-auto grayscale opacity-50"
                                />
                            ) : (
                                <span className="text-xl font-bold text-gray-300">AxonRH</span>
                            )}
                        </div>
                        <div className="flex gap-8 text-sm font-medium text-gray-400">
                            <a href="#" className="hover:text-gray-900 transition-colors">Política de Privacidade</a>
                            <a href="#" className="hover:text-gray-900 transition-colors">Termos de Uso</a>
                            <a href="#" className="hover:text-gray-900 transition-colors">LinkedIn</a>
                        </div>
                        <p className="text-sm text-gray-400">
                            © {new Date().getFullYear()} {tenantTheme?.tenantId || 'AxonRH'}. Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
