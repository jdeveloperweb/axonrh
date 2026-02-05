'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Briefcase,
    MapPin,
    Clock,
    Building2,
    DollarSign,
    ArrowRight,
    Search,
    Filter,
} from 'lucide-react';
import { talentPoolApi, PublicVacancy, getEmploymentTypeLabel, getWorkRegimeLabel } from '@/lib/api/talent-pool';
import { useThemeStore } from '@/stores/theme-store';
import { cn, getPhotoUrl } from '@/lib/utils';
import { configApi } from '@/lib/api/config';

export default function CareersPage() {
    const [vacancies, setVacancies] = useState<PublicVacancy[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [regimeFilter, setRegimeFilter] = useState('');
    const { tenantTheme, setTenantTheme } = useThemeStore();

    useEffect(() => {
        const fetchVacancies = async () => {
            try {
                const data = await talentPoolApi.getPublicVacancies();
                setVacancies(data);
            } catch (error) {
                console.error('Error fetching vacancies:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchBranding = async () => {
            if (!tenantTheme) {
                const tenantId = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ||
                    localStorage.getItem('tenantId') ||
                    localStorage.getItem('setup_tenant_id');

                if (tenantId) {
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
            }
        };

        fetchVacancies();
        fetchBranding();
    }, [tenantTheme, setTenantTheme]);

    const filteredVacancies = vacancies.filter(v => {
        const matchSearch = v.title.toLowerCase().includes(search.toLowerCase()) ||
            v.positionTitle?.toLowerCase().includes(search.toLowerCase()) ||
            v.description?.toLowerCase().includes(search.toLowerCase());
        const matchLocation = !locationFilter || v.location?.toLowerCase().includes(locationFilter.toLowerCase());
        const matchRegime = !regimeFilter || v.workRegime === regimeFilter;
        return matchSearch && matchLocation && matchRegime;
    });

    // Obter localizações únicas para filtro
    const locations = [...new Set(vacancies.map(v => v.location).filter(Boolean))];

    const primaryColor = tenantTheme?.colors?.primary || '#1976D2';

    return (
        <div className="min-h-screen bg-[var(--color-surface-variant)]/30">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {tenantTheme?.logoUrl ? (
                                <img
                                    src={getPhotoUrl(tenantTheme.logoUrl, undefined, 'logo') || ''}
                                    alt="Logo"
                                    className="h-10 w-auto object-contain"
                                    style={{ maxWidth: `${tenantTheme.logoWidth || 150}px` }}
                                />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                                        style={{ background: `linear-gradient(135deg, ${primaryColor}, #6366f1)` }}
                                    >
                                        <Briefcase className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-xl font-bold tracking-tight text-gray-900">
                                        Axon<span style={{ color: primaryColor }}>RH</span>
                                    </span>
                                </div>
                            )}
                            <div className="hidden sm:block h-6 w-px bg-gray-200 mx-2" />
                            <div className="hidden sm:block">
                                <h1 className="text-sm font-semibold text-gray-900">Trabalhe Conosco</h1>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Oportunidades de Carreira</p>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center gap-6">
                            <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Nossa Cultura</a>
                            <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Benefícios</a>
                            <Link
                                href="/login"
                                className="px-4 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:opacity-90 transition-all"
                                style={{ backgroundColor: primaryColor }}
                            >
                                Área do Candidato
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section
                className="relative overflow-hidden text-white py-20 sm:py-28"
                style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, #4f46e5 100%)`
                }}
            >
                {/* Abstract shapes */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-black/10 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4 text-yellow-300" />
                            <span>Venha construir o futuro conosco</span>
                        </div>
                        <h2 className="text-4xl sm:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
                            Faça parte do <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-white">nosso time</span>
                        </h2>
                        <p className="text-lg sm:text-xl text-blue-50/90 mb-10 leading-relaxed">
                            Estamos sempre em busca de talentos excepcionais para fazer a diferença.
                            Confira nossas vagas abertas e encontre a oportunidade perfeita para você se desenvolver e brilhar.
                        </p>
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Briefcase className="w-5 h-5 text-yellow-300" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{vacancies.length}</p>
                                    <p className="text-xs text-blue-100 uppercase tracking-wider">Vagas Abertas</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <MapPin className="w-5 h-5 text-yellow-300" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{locations.length || 1}</p>
                                    <p className="text-xs text-blue-100 uppercase tracking-wider">Localidades</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Search and Filters */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
                <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-4 sm:p-2 border border-gray-100">
                    <div className="flex flex-col md:flex-row items-stretch gap-2">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" />
                            <input
                                type="text"
                                placeholder="Pela primeira vez: qual o cargo dos seus sonhos?"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50/50 rounded-xl border-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all text-gray-900 placeholder:text-gray-400"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 md:w-auto">
                            <div className="relative min-w-[200px]">
                                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <select
                                    value={locationFilter}
                                    onChange={(e) => setLocationFilter(e.target.value)}
                                    className="w-full pl-10 pr-10 py-4 bg-gray-50/50 rounded-xl border-none focus:ring-2 focus:ring-[var(--color-primary)]/20 appearance-none text-gray-700 font-medium cursor-pointer"
                                >
                                    <option value="">Todas as localidades</option>
                                    {locations.map(loc => (
                                        <option key={loc} value={loc}>{loc}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative min-w-[200px]">
                                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <select
                                    value={regimeFilter}
                                    onChange={(e) => setRegimeFilter(e.target.value)}
                                    className="w-full pl-10 pr-10 py-4 bg-gray-50/50 rounded-xl border-none focus:ring-2 focus:ring-[var(--color-primary)]/20 appearance-none text-gray-700 font-medium cursor-pointer"
                                >
                                    <option value="">Todos os regimes</option>
                                    <option value="PRESENCIAL">Presencial</option>
                                    <option value="REMOTO">Remoto</option>
                                    <option value="HIBRIDO">Híbrido</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Vacancies List */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Vagas em Destaque</h3>
                        <p className="text-gray-500 mt-1">
                            Mostrando {filteredVacancies.length} {filteredVacancies.length === 1 ? 'oportunidade' : 'oportunidades'} encontradas
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-100 border-t-[var(--color-primary)]" />
                        <p className="text-gray-400 font-medium">Buscando melhores oportunidades...</p>
                    </div>
                ) : filteredVacancies.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm p-16 text-center border border-gray-100">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Briefcase className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Ainda não encontramos essa vaga
                        </h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            {search || locationFilter || regimeFilter
                                ? 'Tente ajustar os filtros ou usar palavras-chave mais genéricas.'
                                : 'No momento não há vagas disponíveis. Siga-nos para saber de novas oportunidades!'}
                        </p>
                        {(search || locationFilter || regimeFilter) && (
                            <button
                                onClick={() => { setSearch(''); setLocationFilter(''); setRegimeFilter(''); }}
                                className="mt-8 text-sm font-bold text-[var(--color-primary)] hover:underline"
                            >
                                Limpar todos os filtros
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {filteredVacancies.map(vacancy => (
                            <Link
                                key={vacancy.id}
                                href={`/careers/${vacancy.publicCode}`}
                                className="group block bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-5">
                                            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--color-primary)]/5 transition-colors">
                                                <Briefcase className="w-7 h-7 text-gray-400 group-hover:text-[var(--color-primary)] transition-colors" />
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    {vacancy.workRegime && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100">
                                                            {getWorkRegimeLabel(vacancy.workRegime)}
                                                        </span>
                                                    )}
                                                    {vacancy.employmentType && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-600 border border-purple-100">
                                                            {getEmploymentTypeLabel(vacancy.employmentType)}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors">
                                                    {vacancy.title}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3 text-sm text-gray-500 font-medium">
                                                    {vacancy.departmentName && (
                                                        <span className="flex items-center gap-1.5 leading-none">
                                                            <Building2 className="w-4 h-4 text-gray-400" />
                                                            {vacancy.departmentName}
                                                        </span>
                                                    )}
                                                    {vacancy.location && (
                                                        <span className="flex items-center gap-1.5 leading-none">
                                                            <MapPin className="w-4 h-4 text-gray-400" />
                                                            {vacancy.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {vacancy.description && (
                                            <p className="text-gray-500 mt-5 line-clamp-2 text-sm leading-relaxed max-w-3xl">
                                                {vacancy.description}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap items-center gap-4 mt-6">
                                            {(vacancy.salaryRangeMin || vacancy.salaryRangeMax) && (
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg text-emerald-700 text-xs font-bold">
                                                    <DollarSign className="w-3.5 h-3.5" />
                                                    {vacancy.salaryRangeMin && vacancy.salaryRangeMax
                                                        ? `R$ ${vacancy.salaryRangeMin.toLocaleString('pt-BR')} - R$ ${vacancy.salaryRangeMax.toLocaleString('pt-BR')}`
                                                        : vacancy.salaryRangeMin
                                                            ? `A partir de R$ ${vacancy.salaryRangeMin.toLocaleString('pt-BR')}`
                                                            : `Até R$ ${vacancy.salaryRangeMax?.toLocaleString('pt-BR')}`
                                                    }
                                                </div>
                                            )}
                                            {vacancy.deadline && (
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-lg text-orange-700 text-xs font-bold">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    Inscrições até {new Date(vacancy.deadline).toLocaleDateString('pt-BR')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[var(--color-primary)] font-bold text-sm bg-[var(--color-primary)]/5 px-6 py-3 rounded-xl group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all">
                                        Conhecer Vaga
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* CTA Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
                <div className="bg-gray-900 rounded-[2.5rem] p-8 sm:p-16 text-center overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)]/20 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px]" />

                    <div className="relative z-10">
                        <h3 className="text-3xl sm:text-4xl font-bold text-white mb-6">Não encontrou o que procurava?</h3>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
                            Mesmo se não houver uma vaga aberta hoje que seja a sua cara, adoraríamos conhecer você para futuras oportunidades.
                        </p>
                        <button
                            className="px-8 py-4 rounded-2xl font-bold text-white transition-all shadow-xl hover:scale-105"
                            style={{ backgroundColor: primaryColor }}
                        >
                            Cadastrar no Banco de Talentos
                        </button>
                    </div>
                </div>
            </section>

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
