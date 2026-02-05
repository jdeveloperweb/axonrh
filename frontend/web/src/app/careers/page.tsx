'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

export default function CareersPage() {
    const [vacancies, setVacancies] = useState<PublicVacancy[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [regimeFilter, setRegimeFilter] = useState('');

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

        fetchVacancies();
    }, []);

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <Briefcase className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Trabalhe Conosco</h1>
                                <p className="text-sm text-gray-500">Encontre sua oportunidade</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="max-w-6xl mx-auto px-4 py-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        Faça parte do nosso time
                    </h2>
                    <p className="text-xl text-blue-100 max-w-2xl mb-8">
                        Estamos sempre em busca de talentos excepcionais para fazer a diferença.
                        Confira nossas vagas abertas e encontre a oportunidade perfeita para você.
                    </p>
                    <div className="flex items-center gap-4 text-blue-100">
                        <div className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5" />
                            <span>{vacancies.length} vagas abertas</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Search and Filters */}
            <section className="max-w-6xl mx-auto px-4 -mt-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar vagas por título, cargo ou palavra-chave..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                                className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="">Todas as localidades</option>
                                {locations.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                            <select
                                value={regimeFilter}
                                onChange={(e) => setRegimeFilter(e.target.value)}
                                className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="">Todos os regimes</option>
                                <option value="PRESENCIAL">Presencial</option>
                                <option value="REMOTO">Remoto</option>
                                <option value="HIBRIDO">Híbrido</option>
                            </select>
                        </div>
                    </div>
                </div>
            </section>

            {/* Vacancies List */}
            <section className="max-w-6xl mx-auto px-4 py-12">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                    </div>
                ) : filteredVacancies.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Nenhuma vaga encontrada
                        </h3>
                        <p className="text-gray-500">
                            {search || locationFilter || regimeFilter
                                ? 'Tente ajustar seus filtros de busca'
                                : 'No momento não há vagas disponíveis. Volte em breve!'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-gray-500 mb-6">
                            {filteredVacancies.length} {filteredVacancies.length === 1 ? 'vaga encontrada' : 'vagas encontradas'}
                        </p>
                        {filteredVacancies.map(vacancy => (
                            <Link
                                key={vacancy.id}
                                href={`/careers/${vacancy.publicCode}`}
                                className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 group"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Briefcase className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                                                    {vacancy.title}
                                                </h3>
                                                {vacancy.departmentName && (
                                                    <p className="text-gray-600 flex items-center gap-1">
                                                        <Building2 className="w-4 h-4" />
                                                        {vacancy.departmentName}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
                                            {vacancy.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {vacancy.location}
                                                </span>
                                            )}
                                            {vacancy.workRegime && (
                                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                                                    {getWorkRegimeLabel(vacancy.workRegime)}
                                                </span>
                                            )}
                                            {vacancy.employmentType && (
                                                <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded">
                                                    {getEmploymentTypeLabel(vacancy.employmentType)}
                                                </span>
                                            )}
                                            {(vacancy.salaryRangeMin || vacancy.salaryRangeMax) && (
                                                <span className="flex items-center gap-1 text-green-600">
                                                    <DollarSign className="w-4 h-4" />
                                                    {vacancy.salaryRangeMin && vacancy.salaryRangeMax
                                                        ? `R$ ${vacancy.salaryRangeMin.toLocaleString('pt-BR')} - R$ ${vacancy.salaryRangeMax.toLocaleString('pt-BR')}`
                                                        : vacancy.salaryRangeMin
                                                            ? `A partir de R$ ${vacancy.salaryRangeMin.toLocaleString('pt-BR')}`
                                                            : `Até R$ ${vacancy.salaryRangeMax?.toLocaleString('pt-BR')}`
                                                    }
                                                </span>
                                            )}
                                            {vacancy.deadline && (
                                                <span className="flex items-center gap-1 text-orange-600">
                                                    <Clock className="w-4 h-4" />
                                                    Até {new Date(vacancy.deadline).toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
                                        </div>
                                        {vacancy.description && (
                                            <p className="text-gray-600 mt-3 line-clamp-2">
                                                {vacancy.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-blue-600 font-medium group-hover:gap-3 transition-all">
                                        Ver vaga
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-8">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <p className="text-gray-400">
                        Powered by <span className="text-white font-semibold">AxonRH</span>
                    </p>
                </div>
            </footer>
        </div>
    );
}
