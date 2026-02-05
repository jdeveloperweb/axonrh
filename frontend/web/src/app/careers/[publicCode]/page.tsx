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
    Link as LinkIcon,
} from 'lucide-react';
import { talentPoolApi, PublicVacancy, PublicApplicationData, getEmploymentTypeLabel, getWorkRegimeLabel } from '@/lib/api/talent-pool';

export default function VacancyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const publicCode = params.publicCode as string;

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
        linkedinUrl: '',
        portfolioUrl: '',
    });

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
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

        if (publicCode) {
            fetchVacancy();
        }
    }, [publicCode]);

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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (error || !vacancy) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Vaga não encontrada</h2>
                    <p className="text-gray-600 mb-6">{error || 'Esta vaga pode ter sido encerrada ou o link está incorreto.'}</p>
                    <Link
                        href="/careers"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Ver todas as vagas
                    </Link>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Candidatura enviada!</h2>
                    <p className="text-gray-600 mb-6">
                        Recebemos sua candidatura para a vaga de <strong>{vacancy.title}</strong>.
                        Nossa equipe irá analisar seu perfil e entraremos em contato em breve.
                    </p>
                    <Link
                        href="/careers"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Ver outras vagas
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <Link
                        href="/careers"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para vagas
                    </Link>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Vacancy Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Header */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Briefcase className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                        {vacancy.title}
                                    </h1>
                                    {vacancy.departmentName && (
                                        <p className="text-gray-600 flex items-center gap-1 mb-3">
                                            <Building2 className="w-4 h-4" />
                                            {vacancy.departmentName}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-3">
                                        {vacancy.location && (
                                            <span className="flex items-center gap-1 text-gray-600">
                                                <MapPin className="w-4 h-4" />
                                                {vacancy.location}
                                            </span>
                                        )}
                                        {vacancy.workRegime && (
                                            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                                                {getWorkRegimeLabel(vacancy.workRegime)}
                                            </span>
                                        )}
                                        {vacancy.employmentType && (
                                            <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                                                {getEmploymentTypeLabel(vacancy.employmentType)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Salary and Deadline */}
                            <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-gray-100">
                                {(vacancy.salaryRangeMin || vacancy.salaryRangeMax) && (
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-green-600" />
                                        <div>
                                            <p className="text-sm text-gray-500">Faixa Salarial</p>
                                            <p className="font-semibold text-gray-900">
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
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-orange-600" />
                                        <div>
                                            <p className="text-sm text-gray-500">Prazo</p>
                                            <p className="font-semibold text-gray-900">
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

                        {/* Description */}
                        {vacancy.description && (
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sobre a Vaga</h2>
                                <div className="prose prose-gray max-w-none">
                                    <p className="text-gray-700 whitespace-pre-line">{vacancy.description}</p>
                                </div>
                            </div>
                        )}

                        {/* Responsibilities */}
                        {vacancy.responsibilities && (
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Responsabilidades</h2>
                                <div className="prose prose-gray max-w-none">
                                    <p className="text-gray-700 whitespace-pre-line">{vacancy.responsibilities}</p>
                                </div>
                            </div>
                        )}

                        {/* Requirements */}
                        {vacancy.requirements && (
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Requisitos</h2>
                                <div className="prose prose-gray max-w-none">
                                    <p className="text-gray-700 whitespace-pre-line">{vacancy.requirements}</p>
                                </div>
                            </div>
                        )}

                        {/* Benefits */}
                        {vacancy.benefits && (
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Benefícios</h2>
                                <div className="prose prose-gray max-w-none">
                                    <p className="text-gray-700 whitespace-pre-line">{vacancy.benefits}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Application Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Candidate-se</h2>

                            {formErrors.submit && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {formErrors.submit}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Nome */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nome Completo *
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                formErrors.fullName ? 'border-red-300' : 'border-gray-200'
                                            }`}
                                            placeholder="Seu nome completo"
                                        />
                                    </div>
                                    {formErrors.fullName && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.fullName}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email *
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                formErrors.email ? 'border-red-300' : 'border-gray-200'
                                            }`}
                                            placeholder="seu@email.com"
                                        />
                                    </div>
                                    {formErrors.email && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                                    )}
                                </div>

                                {/* Telefone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Telefone
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                </div>

                                {/* Cidade e Estado */}
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Cidade
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Sua cidade"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            UF
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase().slice(0, 2) })}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="SP"
                                            maxLength={2}
                                        />
                                    </div>
                                </div>

                                {/* LinkedIn */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        LinkedIn
                                    </label>
                                    <div className="relative">
                                        <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="url"
                                            value={formData.linkedinUrl}
                                            onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                formErrors.linkedinUrl ? 'border-red-300' : 'border-gray-200'
                                            }`}
                                            placeholder="linkedin.com/in/seu-perfil"
                                        />
                                    </div>
                                    {formErrors.linkedinUrl && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.linkedinUrl}</p>
                                    )}
                                </div>

                                {/* Portfolio */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Portfólio / Site
                                    </label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="url"
                                            value={formData.portfolioUrl}
                                            onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="https://seusite.com"
                                        />
                                    </div>
                                </div>

                                {/* Resume Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Currículo
                                    </label>
                                    <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                                        resumeFile ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-blue-300'
                                    }`}>
                                        {resumeFile ? (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-5 h-5 text-green-600" />
                                                    <span className="text-sm text-gray-700 truncate max-w-[150px]">
                                                        {resumeFile.name}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setResumeFile(null)}
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                >
                                                    <X className="w-4 h-4 text-gray-500" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer">
                                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-600">
                                                    Clique para enviar seu currículo
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    PDF ou Word (máx. 10MB)
                                                </p>
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
                                        <p className="mt-1 text-sm text-red-600">{formErrors.resume}</p>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Enviar Candidatura
                                        </>
                                    )}
                                </button>

                                <p className="text-xs text-gray-500 text-center">
                                    Ao se candidatar, você concorda com nossos termos de uso e política de privacidade.
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-8 mt-12">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <p className="text-gray-400">
                        Powered by <span className="text-white font-semibold">AxonRH</span>
                    </p>
                </div>
            </footer>
        </div>
    );
}
