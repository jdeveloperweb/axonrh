import { api } from './client';

// ==================== Enums ====================

export type DigitalHiringStatus =
    | 'ADMISSION_PENDING'
    | 'DOCUMENTS_PENDING'
    | 'DOCUMENTS_VALIDATING'
    | 'SIGNATURE_PENDING'
    | 'COMPLETED'
    | 'CANCELLED';

export const digitalHiringStatusLabels: Record<DigitalHiringStatus, string> = {
    ADMISSION_PENDING: 'Em Admissão',
    DOCUMENTS_PENDING: 'Aguardando Documentos',
    DOCUMENTS_VALIDATING: 'Em Validação',
    SIGNATURE_PENDING: 'Aguardando Assinatura',
    COMPLETED: 'Concluído',
    CANCELLED: 'Cancelado',
};

export const digitalHiringStatusColors: Record<DigitalHiringStatus, string> = {
    ADMISSION_PENDING: 'bg-blue-100 text-blue-800',
    DOCUMENTS_PENDING: 'bg-orange-100 text-orange-800',
    DOCUMENTS_VALIDATING: 'bg-purple-100 text-purple-800',
    SIGNATURE_PENDING: 'bg-indigo-100 text-indigo-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
};

// ==================== Types ====================

export interface DigitalHiringProcess {
    id: string;
    tenantId: string;
    candidateId?: string;
    vacancyId?: string;
    accessToken: string;
    publicLink: string;
    linkExpiresAt: string;
    linkValid: boolean;

    // Candidate info
    candidateName: string;
    candidateEmail: string;
    candidateCpf?: string;
    candidatePhone?: string;

    // Position info
    department?: { id: string; name: string };
    position?: { id: string; title: string };
    employmentType?: string;
    baseSalary?: number;
    expectedHireDate?: string;

    // Process tracking
    status: DigitalHiringStatus;
    currentStep: number;
    totalSteps: number;
    progressPercent: number;

    // Personal data (filled by candidate)
    personalData?: DigitalHiringPersonalData;

    // Documents
    documents: DigitalHiringDocument[];
    pendingDocuments: number;
    validatedDocuments: number;

    // Work data
    workData?: DigitalHiringWorkData;

    // Contract
    contractHtml?: string;
    contractGeneratedAt?: string;
    contractSignedAt?: string;
    contractSigned: boolean;
    signatureIp?: string;
    signatureUserAgent?: string;
    signatureTimestamp?: string;

    // AI analysis
    aiConsistencyScore?: number;
    aiAlerts?: DigitalHiringAiAlert[];

    // Employee created
    employeeId?: string;
    registrationNumber?: string;

    // Audit
    createdAt: string;
    updatedAt?: string;
    completedAt?: string;
    cancelledAt?: string;
    cancelReason?: string;
    notes?: string;
}

export interface DigitalHiringPersonalData {
    fullName: string;
    cpf: string;
    rg?: string;
    rgOrgaoEmissor?: string;
    birthDate?: string;
    gender?: string;
    maritalStatus?: string;
    nationality?: string;
    phone?: string;
    email?: string;

    // Address
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;

    // Bank info
    bankCode?: string;
    bankName?: string;
    bankAgency?: string;
    bankAccount?: string;
    bankAccountType?: string;
    bankPix?: string;

    // Emergency contact
    emergencyName?: string;
    emergencyPhone?: string;
    emergencyRelationship?: string;
}

export interface DigitalHiringWorkData {
    pis?: string;
    ctpsNumero?: string;
    ctpsSerie?: string;
    ctpsUf?: string;
    hasDependents?: boolean;
    dependents?: DigitalHiringDependent[];

    // Benefits
    selectedBenefits?: string[];
    transportVoucher?: boolean;
    mealVoucher?: boolean;
    healthInsurance?: boolean;
    dentalInsurance?: boolean;
}

export interface DigitalHiringDependent {
    fullName: string;
    cpf?: string;
    birthDate?: string;
    relationship: string;
}

export interface DigitalHiringDocument {
    id: string;
    documentType: string;
    fileName: string;
    fileSize?: number;
    fileUrl?: string;
    status: 'PENDING' | 'UPLOADING' | 'UPLOADED' | 'VALIDATING' | 'VALID' | 'INVALID' | 'ERROR';
    validationMessage?: string;
    ocrData?: Record<string, unknown>;
    uploadedAt?: string;
    validatedAt?: string;
}

export interface DigitalHiringAiAlert {
    id: string;
    type: 'WARNING' | 'ERROR' | 'INFO';
    field?: string;
    message: string;
    suggestion?: string;
    createdAt: string;
    resolved: boolean;
}

export interface DigitalHiringCreateRequest {
    candidateName: string;
    candidateEmail: string;
    candidateCpf?: string;
    candidatePhone?: string;
    candidateId?: string;
    vacancyId?: string;
    departmentId?: string;
    positionId?: string;
    employmentType?: string;
    baseSalary?: number;
    expectedHireDate?: string;
    linkValidityDays?: number;
    notes?: string;
}

export interface DigitalHiringListParams {
    page?: number;
    size?: number;
    status?: DigitalHiringStatus;
    search?: string;
}

export interface DigitalHiringListResponse {
    content: DigitalHiringProcess[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export interface DigitalHiringStats {
    total: number;
    admissionPending: number;
    documentsPending: number;
    documentsValidating: number;
    signaturePending: number;
    completed: number;
    cancelled: number;
    averageCompletionDays: number;
}

export interface ContractGenerateRequest {
    positionTitle: string;
    baseSalary: number;
    employmentType: string;
    departmentName?: string;
    startDate?: string;
}

export interface ContractSignatureRequest {
    acceptedTerms: boolean;
    signatureText: string;
    acceptedConfidentiality: boolean;
    acceptedInternalPolicy: boolean;
    ipAddress?: string;
    userAgent?: string;
}

export interface DocumentUploadResponse {
    documentId: string;
    validationStatus: string;
    ocrData?: Record<string, unknown>;
    aiAlerts?: DigitalHiringAiAlert[];
}

export interface AiValidationResult {
    consistencyScore: number;
    alerts: DigitalHiringAiAlert[];
    suggestions: string[];
}

export interface AiChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

// ==================== API Methods ====================

export const digitalHiringApi = {
    // ========== Admin (HR) Methods ==========

    create: async (data: DigitalHiringCreateRequest): Promise<DigitalHiringProcess> => {
        return api.post<DigitalHiringCreateRequest, DigitalHiringProcess>('/digital-hiring', data);
    },

    list: async (params: DigitalHiringListParams = {}): Promise<DigitalHiringListResponse> => {
        const searchParams = new URLSearchParams();
        if (params.page !== undefined) searchParams.set('page', params.page.toString());
        if (params.size !== undefined) searchParams.set('size', params.size.toString());
        if (params.status) searchParams.set('status', params.status);
        if (params.search) searchParams.set('search', params.search);
        return api.get<DigitalHiringListResponse, DigitalHiringListResponse>(`/digital-hiring?${searchParams.toString()}`);
    },

    getById: async (id: string): Promise<DigitalHiringProcess> => {
        return api.get<DigitalHiringProcess, DigitalHiringProcess>(`/digital-hiring/${id}`);
    },

    getStats: async (): Promise<DigitalHiringStats> => {
        return api.get<DigitalHiringStats, DigitalHiringStats>('/digital-hiring/stats');
    },

    resendEmail: async (id: string): Promise<{ message: string; link: string }> => {
        return api.post<unknown, { message: string; link: string }>(`/digital-hiring/${id}/resend-email`);
    },

    forceAdvance: async (id: string): Promise<DigitalHiringProcess> => {
        return api.post<unknown, DigitalHiringProcess>(`/digital-hiring/${id}/force-advance`);
    },

    requestCorrection: async (id: string, message: string): Promise<void> => {
        await api.post(`/digital-hiring/${id}/request-correction`, { message });
    },

    cancel: async (id: string, reason?: string): Promise<void> => {
        await api.post(`/digital-hiring/${id}/cancel`, { reason });
    },

    updateEmail: async (id: string, email: string): Promise<void> => {
        await api.patch(`/digital-hiring/${id}/email`, { email });
    },

    complete: async (id: string): Promise<DigitalHiringProcess> => {
        return api.post<unknown, DigitalHiringProcess>(`/digital-hiring/${id}/complete`);
    },

    // AI features for HR
    getAiAnalysis: async (id: string): Promise<AiValidationResult> => {
        return api.get<AiValidationResult, AiValidationResult>(`/digital-hiring/${id}/ai-analysis`);
    },

    generateContract: async (id: string, data?: ContractGenerateRequest): Promise<{ contractHtml: string }> => {
        return api.post<ContractGenerateRequest | undefined, { contractHtml: string }>(`/digital-hiring/${id}/generate-contract`, data);
    },

    // ========== Public Methods (Candidate Portal) ==========

    public: {
        access: async (token: string): Promise<DigitalHiringProcess> => {
            return api.get<DigitalHiringProcess, DigitalHiringProcess>(`/digital-hiring/public/${token}`);
        },

        createPassword: async (token: string, data: { cpf: string; password: string }): Promise<{ sessionToken: string }> => {
            return api.post<{ cpf: string; password: string }, { sessionToken: string }>(`/digital-hiring/public/${token}/create-password`, data);
        },

        login: async (token: string, data: { cpf: string; password: string }): Promise<{ sessionToken: string }> => {
            return api.post<{ cpf: string; password: string }, { sessionToken: string }>(`/digital-hiring/public/${token}/login`, data);
        },

        // Step 1 - Personal Data
        savePersonalData: async (token: string, data: DigitalHiringPersonalData): Promise<void> => {
            await api.post(`/digital-hiring/public/${token}/personal-data`, data);
        },

        // Step 2 - Documents
        getDocuments: async (token: string): Promise<DigitalHiringDocument[]> => {
            return api.get<DigitalHiringDocument[], DigitalHiringDocument[]>(`/digital-hiring/public/${token}/documents`);
        },

        uploadDocument: async (token: string, file: File, type: string): Promise<DocumentUploadResponse> => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);
            return api.post<FormData, DocumentUploadResponse>(`/digital-hiring/public/${token}/documents/upload`, formData);
        },

        validateDocuments: async (token: string): Promise<{ allValid: boolean; alerts: DigitalHiringAiAlert[] }> => {
            return api.post<unknown, { allValid: boolean; alerts: DigitalHiringAiAlert[] }>(`/digital-hiring/public/${token}/documents/validate`);
        },

        // Step 3 - Work Data
        saveWorkData: async (token: string, data: DigitalHiringWorkData): Promise<void> => {
            await api.post(`/digital-hiring/public/${token}/work-data`, data);
        },

        // Step 4 - Contract & Signature
        getContract: async (token: string): Promise<{ contractHtml: string; confidentialityHtml: string; policyHtml: string }> => {
            return api.get<unknown, { contractHtml: string; confidentialityHtml: string; policyHtml: string }>(`/digital-hiring/public/${token}/contract`);
        },

        signContract: async (token: string, data: ContractSignatureRequest): Promise<void> => {
            await api.post(`/digital-hiring/public/${token}/sign`, data);
        },

        // AI Assistant chat
        aiChat: async (token: string, message: string): Promise<AiChatMessage> => {
            return api.post<{ message: string }, AiChatMessage>(`/digital-hiring/public/${token}/ai-chat`, { message });
        },

        // AI validation
        validateData: async (token: string): Promise<AiValidationResult> => {
            return api.post<unknown, AiValidationResult>(`/digital-hiring/public/${token}/validate`);
        },
    },

    // ========== Integration Triggers ==========

    /** Trigger: called when candidate status moves to APPROVED in talent-pool */
    triggerFromRecruitment: async (candidateId: string, vacancyId?: string): Promise<DigitalHiringProcess> => {
        return api.post<{ candidateId: string; vacancyId?: string }, DigitalHiringProcess>(
            '/digital-hiring/trigger',
            { candidateId, vacancyId }
        );
    },
};

// ==================== Helpers ====================

export const getDigitalHiringStatusLabel = (status: DigitalHiringStatus): string => {
    return digitalHiringStatusLabels[status] || status;
};

export const getDigitalHiringStatusColor = (status: DigitalHiringStatus): string => {
    return digitalHiringStatusColors[status] || 'bg-gray-100 text-gray-800';
};

export const documentRequirements = [
    { type: 'RG', label: 'RG (Identidade)', required: true, description: 'Frente e verso' },
    { type: 'CPF', label: 'CPF', required: true, description: 'Documento legível' },
    { type: 'COMPROVANTE_RESIDENCIA', label: 'Comprovante de Residência', required: true, description: 'Últimos 3 meses' },
    { type: 'CERTIFICADO_RESERVISTA', label: 'Certificado de Reservista', required: false, description: 'Masculino, 18-45 anos' },
    { type: 'DIPLOMA', label: 'Diploma / Certificado', required: false, description: 'Último grau de escolaridade' },
    { type: 'CTPS', label: 'Carteira de Trabalho', required: false, description: 'Página de identificação' },
    { type: 'FOTO_3X4', label: 'Foto 3x4', required: true, description: 'Fundo branco, recente' },
    { type: 'TITULO_ELEITOR', label: 'Título de Eleitor', required: false, description: 'Documento legível' },
    { type: 'CNH', label: 'CNH', required: false, description: 'Se possuir' },
    { type: 'CERTIDAO_NASCIMENTO', label: 'Certidão de Nascimento', required: false, description: 'Ou casamento' },
    { type: 'CERTIDAO_CASAMENTO', label: 'Certidão de Casamento', required: false, description: 'Se casado(a)' },
];

export const calculateProgress = (process: DigitalHiringProcess): number => {
    let progress = 0;
    if (process.personalData?.fullName) progress += 20;
    if (process.validatedDocuments > 0) progress += Math.min(30, (process.validatedDocuments / 4) * 30);
    if (process.workData?.pis) progress += 20;
    if (process.contractSigned) progress += 20;
    if (process.employeeId) progress += 10;
    return Math.min(100, Math.round(progress));
};
