'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
    Sparkles,
    CheckCircle2,
    Heart,
    Star,
    Coffee,
    Zap,
    Users,
    X,
    Upload,
    Loader2,
} from 'lucide-react';
import { talentPoolApi, PublicVacancy, getEmploymentTypeLabel, getWorkRegimeLabel, PublicApplicationData } from '@/lib/api/talent-pool';
import { useThemeStore } from '@/stores/theme-store';
import { cn, getPhotoUrl } from '@/lib/utils';
import { configApi } from '@/lib/api/config';

export default function CareersPage() {
    const params = useParams();
    const tenantId = params.tenantId as string;

    const [vacancies, setVacancies] = useState<PublicVacancy[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [regimeFilter, setRegimeFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { tenantTheme, setTenantTheme } = useThemeStore();

    useEffect(() => {
        if (!tenantId) return;

        // Garantir que o setup_tenant_id está definido para as chamadas de API públicas
        localStorage.setItem('setup_tenant_id', tenantId);

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

        fetchVacancies();
        fetchBranding();
    }, [tenantId, tenantTheme, setTenantTheme]);

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
                            <a href="#cultura" className="text-sm font-medium text-gray-600 hover:text-[var(--color-primary)] transition-colors">Nossa Cultura</a>
                            <a href="#beneficios" className="text-sm font-medium text-gray-600 hover:text-[var(--color-primary)] transition-colors">Benefícios</a>
                            <a href="#vagas" className="text-sm font-medium text-gray-600 hover:text-[var(--color-primary)] transition-colors">Vagas Abertas</a>
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
            <section id="vagas" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
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
                                href={`/careers/${tenantId}/${vacancy.publicCode}`}
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

            {/* Cultura Section */}
            <section id="cultura" className="bg-white py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Nossa Cultura</h2>
                        <div className="w-20 h-1.5 bg-[var(--color-primary)] mx-auto rounded-full mb-6" />
                        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                            O que nos move e como trabalhamos para construir algo extraordinário todos os dias.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Foco em Pessoas */}
                        <div className="group rounded-[2rem] bg-gray-50 hover:bg-white hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                            <div className="h-48 relative overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
                                    alt="Foco em Pessoas"
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-4 left-6 p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/20">
                                    <Heart className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="p-8 pt-6">
                                <h4 className="text-xl font-bold mb-4">Foco em Pessoas</h4>
                                <p className="text-gray-500 leading-relaxed">
                                    Acreditamos que o sucesso da nossa empresa é o reflexo direto do bem-estar e crescimento do nosso time.
                                </p>
                            </div>
                        </div>

                        {/* Inovação Ágil */}
                        <div className="group rounded-[2rem] bg-gray-50 hover:bg-white hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                            <div className="h-48 relative overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80"
                                    alt="Inovação Ágil"
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-4 left-6 p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/20">
                                    <Zap className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="p-8 pt-6">
                                <h4 className="text-xl font-bold mb-4">Inovação Ágil</h4>
                                <p className="text-gray-500 leading-relaxed">
                                    Incentivamos a experimentação e aprendizado contínuo, sempre buscando formas melhores de resolver problemas.
                                </p>
                            </div>
                        </div>

                        {/* Excelência */}
                        <div className="group rounded-[2rem] bg-gray-50 hover:bg-white hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                            <div className="h-48 relative overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80"
                                    alt="Excelência"
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-4 left-6 p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/20">
                                    <Star className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="p-8 pt-6">
                                <h4 className="text-xl font-bold mb-4">Excelência</h4>
                                <p className="text-gray-500 leading-relaxed">
                                    Buscamos a qualidade em cada detalhe, entregando resultados que superam as expectativas.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefícios Section */}
            <section id="beneficios" className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2">
                            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Benefícios que você vai amar</h2>
                            <p className="text-gray-500 text-lg mb-10 leading-relaxed">
                                Cuidamos de quem constrói o nosso negócio. Oferecemos um pacote abrangente para garantir sua qualidade de vida.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {[
                                    { icon: Coffee, title: 'Ambiente Flexível', desc: 'Trabalho híbrido ou remoto conforme o time.' },
                                    { icon: Heart, title: 'Saúde e Bem-estar', desc: 'Plano de saúde e odontológico premium.' },
                                    { icon: Zap, title: 'Crescimento', desc: 'Subsídio para cursos e certificações.' },
                                    { icon: Users, title: 'Cultura Inclusiva', desc: 'Eventos de integração e squads diversos.' }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                            <item.icon className="w-5 h-5 text-[var(--color-primary)]" />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-gray-900">{item.title}</h5>
                                            <p className="text-sm text-gray-500">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:w-1/2 relative">
                            <div className="aspect-square bg-gradient-to-br from-[var(--color-primary)]/10 to-blue-600/10 rounded-full flex items-center justify-center p-12">
                                <div className="w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden relative group">
                                    <img
                                        src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=800&q=80"
                                        alt="Benefícios AxonRH"
                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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
                            onClick={() => setIsModalOpen(true)}
                            className="px-8 py-4 rounded-2xl font-bold text-white transition-all shadow-xl hover:scale-105"
                            style={{ backgroundColor: primaryColor }}
                        >
                            Cadastrar no Banco de Talentos
                        </button>
                    </div>
                </div>
            </section>

            {/* Talent Pool Modal */}
            <TalentPoolModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                tenantId={tenantId}
                primaryColor={primaryColor}
                vacancies={vacancies}
            />

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

function TalentPoolModal({ isOpen, onClose, tenantId, primaryColor, vacancies = [] }: {
    isOpen: boolean;
    onClose: () => void;
    tenantId: string;
    primaryColor: string;
    vacancies?: PublicVacancy[];
}) {
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

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

    if (!isOpen) return null;

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formData.fullName.trim()) errors.fullName = 'Nome completo é obrigatório';
        if (!formData.email.trim()) {
            errors.email = 'Email é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Email inválido';
        }
        if (!resumeFile && !submitted) errors.resume = 'O currículo é obrigatório';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) return;

        setSubmitting(true);
        try {
            // Tenta encontrar uma vaga de Banco de Talentos
            const talentPoolVacancy = vacancies.find(v =>
                v.publicCode.toLowerCase().includes('banco') ||
                v.title.toLowerCase().includes('banco')
            );

            const codeToUse = talentPoolVacancy?.publicCode || 'BANCO';

            await talentPoolApi.applyToVacancy(codeToUse, formData, resumeFile || undefined);
            setSubmitted(true);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            const msg = error.response?.data?.message || 'Erro ao enviar candidatura. Certifique-se de que existe uma vaga configurada para o Banco de Talentos.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
                >
                    <X className="w-6 h-6 text-gray-400" />
                </button>

                {submitted ? (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">Candidatura Enviada!</h3>
                        <p className="text-gray-500 mb-10 text-lg">
                            Seu perfil agora faz parte do nosso Banco de Talentos. Entraremos em contato assim que surgir uma oportunidade que combine com você.
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all hover:scale-[1.02]"
                            style={{ backgroundColor: primaryColor }}
                        >
                            Fechar
                        </button>
                    </div>
                ) : (
                    <div className="p-8 sm:p-12">
                        <div className="mb-10 text-center">
                            <h3 className="text-3xl font-bold text-gray-900 mb-3">Banco de Talentos</h3>
                            <p className="text-gray-500">Preencha seus dados para futuras oportunidades</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Nome Completo *</label>
                                    <input
                                        type="text"
                                        required
                                        className={cn(
                                            "w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 transition-all",
                                            formErrors.fullName ? "ring-2 ring-red-500/20" : "focus:ring-[var(--color-primary)]/20"
                                        )}
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                    {formErrors.fullName && <p className="mt-1 text-xs text-red-500 font-bold">{formErrors.fullName}</p>}
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Profissional *</label>
                                    <input
                                        type="email"
                                        required
                                        className={cn(
                                            "w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 transition-all",
                                            formErrors.email ? "ring-2 ring-red-500/20" : "focus:ring-[var(--color-primary)]/20"
                                        )}
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                    {formErrors.email && <p className="mt-1 text-xs text-red-500 font-bold">{formErrors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Telefone / WhatsApp</label>
                                    <input
                                        type="tel"
                                        className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Cidade / Estado</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                        placeholder="Ex: São Paulo, SP"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">LinkedIn (URL)</label>
                                    <input
                                        type="url"
                                        className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                                        value={formData.linkedinUrl}
                                        onChange={e => setFormData({ ...formData, linkedinUrl: e.target.value })}
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Currículo (PDF ou Docx) *</label>
                                    <div className={cn(
                                        "relative border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center justify-center gap-3",
                                        resumeFile ? "border-green-200 bg-green-50/30" : "border-gray-200 bg-gray-50/50 hover:bg-gray-100/50",
                                        formErrors.resume && "border-red-200 bg-red-50/30"
                                    )}>
                                        <input
                                            type="file"
                                            accept=".pdf,.docx"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={e => setResumeFile(e.target.files?.[0] || null)}
                                        />
                                        {resumeFile ? (
                                            <>
                                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                                                    <CheckCircle2 className="w-6 h-6" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-bold text-gray-900">{resumeFile.name}</p>
                                                    <p className="text-xs text-gray-500">Clique para trocar o arquivo</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400">
                                                    <Upload className="w-6 h-6" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-bold text-gray-900">Clique ou arraste seu currículo</p>
                                                    <p className="text-xs text-gray-500">PDF ou Word (máx 5MB)</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {formErrors.resume && <p className="mt-2 text-xs text-red-500 font-bold">{formErrors.resume}</p>}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-5 rounded-[1.5rem] font-bold text-white shadow-xl transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    'Concluir Inscrição'
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

