import { api } from './client';

// ==================== Enums ====================

export type VacancyStatus = 'DRAFT' | 'OPEN' | 'PAUSED' | 'CLOSED' | 'CANCELLED';
export type VacancyType = 'INTERNAL' | 'EXTERNAL' | 'BOTH';
export type CandidateStatus = 'NEW' | 'SCREENING' | 'INTERVIEW' | 'APPROVED' | 'REJECTED' | 'HIRED' | 'WITHDRAWN';
export type CandidateSource = 'WEBSITE' | 'LINKEDIN' | 'REFERRAL' | 'JOB_BOARD' | 'OTHER';
export type EmploymentType = 'CLT' | 'PJ' | 'ESTAGIARIO' | 'TEMPORARIO' | 'APRENDIZ' | 'AUTONOMO' | 'TERCEIRIZADO';
export type WorkRegime = 'PRESENCIAL' | 'REMOTO' | 'HIBRIDO';

// ==================== Interfaces ====================

export interface JobVacancy {
    id: string;
    positionId: string;
    positionCode?: string;
    positionTitle?: string;
    departmentName?: string;
    title: string;
    description?: string;
    responsibilities?: string;
    requirements?: string;
    benefits?: string;
    vacancyType?: VacancyType;
    employmentType?: EmploymentType;
    workRegime?: WorkRegime;
    location?: string;
    salaryRangeMin?: number;
    salaryRangeMax?: number;
    hideSalary?: boolean;
    maxCandidates?: number;
    deadline?: string;
    status: VacancyStatus;
    publishedAt?: string;
    closedAt?: string;
    publicCode?: string;
    candidateCount?: number;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateVacancyData {
    positionId: string;
    title: string;
    description?: string;
    responsibilities?: string;
    requirements?: string;
    benefits?: string;
    vacancyType?: VacancyType;
    employmentType?: EmploymentType;
    workRegime?: WorkRegime;
    location?: string;
    salaryRangeMin?: number;
    salaryRangeMax?: number;
    hideSalary?: boolean;
    maxCandidates?: number;
    deadline?: string;
}

export interface TalentCandidate {
    id: string;
    vacancyId?: string;
    vacancyTitle?: string;
    fullName: string;
    email: string;
    phone?: string;
    mobile?: string;
    city?: string;
    state?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    resumeFileName?: string;
    resumeFilePath?: string;
    resumeFileType?: string;
    resumeParsedData?: Record<string, unknown>;
    skills?: string;
    education?: string;
    experienceSummary?: string;
    certifications?: string;
    languages?: string;
    aiInsight?: string;
    status: CandidateStatus;
    statusNotes?: string;
    rating?: number;
    notes?: string;
    source?: CandidateSource;
    referralName?: string;
    appliedAt?: string;
    lastStatusChange?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateCandidateData {
    fullName: string;
    email: string;
    phone?: string;
    mobile?: string;
    city?: string;
    state?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    source?: CandidateSource;
    referralName?: string;
}

export interface CandidateStatusUpdate {
    status: CandidateStatus;
    notes?: string;
    rating?: number;
}

export interface PublicVacancy {
    id: string;
    publicCode: string;
    title: string;
    positionTitle?: string;
    departmentName?: string;
    description?: string;
    responsibilities?: string;
    requirements?: string;
    benefits?: string;
    employmentType?: EmploymentType;
    workRegime?: WorkRegime;
    location?: string;
    salaryRangeMin?: number;
    salaryRangeMax?: number;
    deadline?: string;
    publishedAt?: string;
    companyName?: string;
    companyLogo?: string;
}

export interface PublicApplicationData {
    fullName: string;
    email: string;
    phone?: string;
    city?: string;
    state?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
}

export interface TalentPoolStats {
    totalVacancies: number;
    openVacancies: number;
    draftVacancies: number;
    closedVacancies: number;
    totalCandidates: number;
    newCandidates: number;
    inProcessCandidates: number;
    approvedCandidates: number;
    hiredCandidates: number;
    candidatesByStatus: Record<string, number>;
    candidatesByVacancy: Record<string, number>;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

// ==================== API Methods - Vagas ====================

export const talentPoolApi = {
    // ========== Vagas ==========

    getVacancies: async (): Promise<JobVacancy[]> => {
        return api.get<unknown, JobVacancy[]>('/talent-pool/vacancies');
    },

    getVacanciesPaginated: async (page = 0, size = 20): Promise<PageResponse<JobVacancy>> => {
        return api.get<unknown, PageResponse<JobVacancy>>(`/talent-pool/vacancies/paginated?page=${page}&size=${size}`);
    },

    getVacanciesByStatus: async (status: VacancyStatus): Promise<JobVacancy[]> => {
        return api.get<unknown, JobVacancy[]>(`/talent-pool/vacancies/status/${status}`);
    },

    getVacancy: async (id: string): Promise<JobVacancy> => {
        return api.get<unknown, JobVacancy>(`/talent-pool/vacancies/${id}`);
    },

    createVacancy: async (data: CreateVacancyData): Promise<JobVacancy> => {
        return api.post<CreateVacancyData, JobVacancy>('/talent-pool/vacancies', data);
    },

    updateVacancy: async (id: string, data: CreateVacancyData): Promise<JobVacancy> => {
        return api.put<CreateVacancyData, JobVacancy>(`/talent-pool/vacancies/${id}`, data);
    },

    publishVacancy: async (id: string): Promise<JobVacancy> => {
        return api.post<unknown, JobVacancy>(`/talent-pool/vacancies/${id}/publish`, {});
    },

    pauseVacancy: async (id: string): Promise<JobVacancy> => {
        return api.post<unknown, JobVacancy>(`/talent-pool/vacancies/${id}/pause`, {});
    },

    reopenVacancy: async (id: string): Promise<JobVacancy> => {
        return api.post<unknown, JobVacancy>(`/talent-pool/vacancies/${id}/reopen`, {});
    },

    closeVacancy: async (id: string): Promise<JobVacancy> => {
        return api.post<unknown, JobVacancy>(`/talent-pool/vacancies/${id}/close`, {});
    },

    deleteVacancy: async (id: string): Promise<void> => {
        await api.delete(`/talent-pool/vacancies/${id}`);
    },

    // ========== Candidatos ==========

    getCandidates: async (): Promise<TalentCandidate[]> => {
        return api.get<unknown, TalentCandidate[]>('/talent-pool/candidates');
    },

    getCandidatesPaginated: async (page = 0, size = 20): Promise<PageResponse<TalentCandidate>> => {
        return api.get<unknown, PageResponse<TalentCandidate>>(`/talent-pool/candidates/paginated?page=${page}&size=${size}`);
    },

    getCandidatesByVacancy: async (vacancyId: string): Promise<TalentCandidate[]> => {
        return api.get<unknown, TalentCandidate[]>(`/talent-pool/candidates/vacancy/${vacancyId}`);
    },

    getCandidatesByStatus: async (status: CandidateStatus): Promise<TalentCandidate[]> => {
        return api.get<unknown, TalentCandidate[]>(`/talent-pool/candidates/status/${status}`);
    },

    getCandidate: async (id: string): Promise<TalentCandidate> => {
        return api.get<unknown, TalentCandidate>(`/talent-pool/candidates/${id}`);
    },

    addCandidate: async (vacancyId: string, data: CreateCandidateData, resumeFile?: File): Promise<TalentCandidate> => {
        const formData = new FormData();
        formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
        if (resumeFile) {
            formData.append('resume', resumeFile);
        }
        // Não definir Content-Type manualmente - deixar o axios configurar o boundary automaticamente
        return api.post<FormData, TalentCandidate>(`/talent-pool/candidates/vacancy/${vacancyId}`, formData);
    },

    updateCandidate: async (id: string, data: CreateCandidateData): Promise<TalentCandidate> => {
        return api.put<CreateCandidateData, TalentCandidate>(`/talent-pool/candidates/${id}`, data);
    },

    updateCandidateStatus: async (id: string, data: CandidateStatusUpdate): Promise<TalentCandidate> => {
        return api.patch<CandidateStatusUpdate, TalentCandidate>(`/talent-pool/candidates/${id}/status`, data);
    },

    uploadResume: async (id: string, file: File): Promise<TalentCandidate> => {
        const formData = new FormData();
        formData.append('file', file);
        // Não definir Content-Type manualmente - deixar o axios configurar o boundary automaticamente
        return api.post<FormData, TalentCandidate>(`/talent-pool/candidates/${id}/resume`, formData);
    },

    downloadResume: async (id: string): Promise<Blob> => {
        return api.get<unknown, Blob>(`/talent-pool/candidates/${id}/resume/download`, {
            responseType: 'blob'
        });
    },

    deleteCandidate: async (id: string): Promise<void> => {
        await api.delete(`/talent-pool/candidates/${id}`);
    },

    // ========== Estatísticas ==========

    getStats: async (): Promise<TalentPoolStats> => {
        return api.get<unknown, TalentPoolStats>('/talent-pool/candidates/stats');
    },

    // ========== Público (sem autenticação) ==========

    getPublicVacancies: async (): Promise<PublicVacancy[]> => {
        return api.get<unknown, PublicVacancy[]>('/public/careers/vacancies');
    },

    getPublicVacancy: async (publicCode: string): Promise<PublicVacancy> => {
        return api.get<unknown, PublicVacancy>(`/public/careers/vacancies/${publicCode}`);
    },

    applyToVacancy: async (publicCode: string, data: PublicApplicationData, resumeFile?: File): Promise<TalentCandidate> => {
        if (resumeFile) {
            const formData = new FormData();
            formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
            formData.append('resume', resumeFile);
            // Não definir Content-Type manualmente - deixar o axios configurar o boundary automaticamente
            return api.post<FormData, TalentCandidate>(`/public/careers/vacancies/${publicCode}/apply`, formData);
        } else {
            return api.post<PublicApplicationData, TalentCandidate>(`/public/careers/vacancies/${publicCode}/apply/json`, data);
        }
    },
};

// ==================== Helpers ====================

export const getVacancyStatusLabel = (status: VacancyStatus): string => {
    const labels: Record<VacancyStatus, string> = {
        DRAFT: 'Rascunho',
        OPEN: 'Aberta',
        PAUSED: 'Pausada',
        CLOSED: 'Fechada',
        CANCELLED: 'Cancelada',
    };
    return labels[status] || status;
};

export const getVacancyStatusColor = (status: VacancyStatus): string => {
    const colors: Record<VacancyStatus, string> = {
        DRAFT: 'bg-gray-100 text-gray-800',
        OPEN: 'bg-green-100 text-green-800',
        PAUSED: 'bg-yellow-100 text-yellow-800',
        CLOSED: 'bg-blue-100 text-blue-800',
        CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getCandidateStatusLabel = (status: CandidateStatus): string => {
    const labels: Record<CandidateStatus, string> = {
        NEW: 'Novo',
        SCREENING: 'Em Triagem',
        INTERVIEW: 'Entrevista',
        APPROVED: 'Aprovado',
        REJECTED: 'Rejeitado',
        HIRED: 'Contratado',
        WITHDRAWN: 'Desistiu',
    };
    return labels[status] || status;
};

export const getCandidateStatusColor = (status: CandidateStatus): string => {
    const colors: Record<CandidateStatus, string> = {
        NEW: 'bg-blue-100 text-blue-800',
        SCREENING: 'bg-purple-100 text-purple-800',
        INTERVIEW: 'bg-indigo-100 text-indigo-800',
        APPROVED: 'bg-green-100 text-green-800',
        REJECTED: 'bg-red-100 text-red-800',
        HIRED: 'bg-emerald-100 text-emerald-800',
        WITHDRAWN: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getEmploymentTypeLabel = (type: EmploymentType): string => {
    const labels: Record<EmploymentType, string> = {
        CLT: 'CLT',
        PJ: 'PJ',
        ESTAGIARIO: 'Estágio',
        TEMPORARIO: 'Temporário',
        APRENDIZ: 'Aprendiz',
        AUTONOMO: 'Autônomo',
        TERCEIRIZADO: 'Terceirizado',
    };
    return labels[type] || type;
};

export const getWorkRegimeLabel = (regime: WorkRegime): string => {
    const labels: Record<WorkRegime, string> = {
        PRESENCIAL: 'Presencial',
        REMOTO: 'Remoto',
        HIBRIDO: 'Híbrido',
    };
    return labels[regime] || regime;
};

export const getSourceLabel = (source: CandidateSource): string => {
    const labels: Record<CandidateSource, string> = {
        WEBSITE: 'Site',
        LINKEDIN: 'LinkedIn',
        REFERRAL: 'Indicação',
        JOB_BOARD: 'Portal de Vagas',
        OTHER: 'Outro',
    };
    return labels[source] || source;
};
