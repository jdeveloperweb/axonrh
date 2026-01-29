import { api } from './client';

// types for Admission Process
export type AdmissionStatus =
    | 'LINK_GENERATED'
    | 'DATA_FILLING'
    | 'DOCUMENTS_PENDING'
    | 'DOCUMENTS_VALIDATING'
    | 'CONTRACT_PENDING'
    | 'SIGNATURE_PENDING'
    | 'ESOCIAL_PENDING'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'EXPIRED'
    | 'REJECTED';

export interface AdmissionProcess {
    id: string;
    tenantId: string;
    accessToken: string;
    publicLink: string;
    linkExpiresAt: string;
    linkValid: boolean;
    candidateName: string;
    candidateEmail: string;
    candidateCpf: string;
    candidatePhone?: string;
    expectedHireDate?: string;
    department?: {
        id: string;
        name: string;
    };
    position?: {
        id: string;
        name?: string;
        title: string;
    };
    status: AdmissionStatus;
    statusDescription: string;
    currentStep: number;
    totalSteps: number;
    progressPercent: number;
    documents: AdmissionDocument[];
    pendingDocuments: number;
    validatedDocuments: number;
    contractDocumentUrl?: string;
    contractGeneratedAt?: string;
    contractSignedAt?: string;
    contractSigned: boolean;
    esocialEventId?: string;
    esocialSentAt?: string;
    esocialReceipt?: string;
    employeeId?: string;
    createdAt: string;
    completedAt?: string;
    notes?: string;
}

export interface AdmissionDocument {
    id: string;
    documentType: string;
    fileName: string;
    status: string;
    validationMessage?: string;
    uploadedAt: string;
    hasOcrData: boolean;
}

export interface AdmissionCreateRequest {
    candidateName: string;
    candidateEmail: string;
    candidateCpf: string;
    candidatePhone?: string;
    expectedHireDate?: string;
    departmentId?: string;
    positionId?: string;
    linkValidityDays?: number;
    notes?: string;
}

export interface AdmissionListParams {
    page?: number;
    size?: number;
    status?: AdmissionStatus;
    search?: string;
}

export interface AdmissionListResponse {
    content: AdmissionProcess[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export interface DocumentRequirement {
    type: string;
    required: boolean;
    uploaded: boolean;
    status: string;
}

export interface RequiredDocumentsResponse {
    requirements: DocumentRequirement[];
    allRequiredUploaded: boolean;
    totalRequired: number;
    totalUploaded: number;
}

export const admissionsApi = {
    // Admin methods (standard)
    create: async (data: AdmissionCreateRequest): Promise<AdmissionProcess> => {
        return api.post<AdmissionCreateRequest, AdmissionProcess>('/admissions', data);
    },
    list: async (params: AdmissionListParams = {}): Promise<AdmissionListResponse> => {
        const searchParams = new URLSearchParams();
        if (params.page !== undefined) searchParams.set('page', params.page.toString());
        if (params.size !== undefined) searchParams.set('size', params.size.toString());
        if (params.status) searchParams.set('status', params.status);
        if (params.search) searchParams.set('search', params.search);
        return api.get<AdmissionListResponse, AdmissionListResponse>(`/admissions?${searchParams.toString()}`);
    },
    getById: async (id: string): Promise<AdmissionProcess> => {
        return api.get<AdmissionProcess, AdmissionProcess>(`/admissions/${id}`);
    },
    resendLink: async (id: string): Promise<{ message: string; link: string }> => {
        return api.post<unknown, { message: string; link: string }>(`/admissions/${id}/resend-link`);
    },
    cancel: async (id: string, reason?: string): Promise<void> => {
        await api.post(`/admissions/${id}/cancel`, { reason });
    },
    complete: async (id: string): Promise<AdmissionProcess> => {
        return api.post<unknown, AdmissionProcess>(`/admissions/${id}/complete`);
    },

    // Public methods for the candidate wizard
    public: {
        access: async (token: string): Promise<AdmissionProcess> => {
            return api.get<AdmissionProcess, AdmissionProcess>(`/admissions/public/${token}`);
        },
        getDocuments: async (token: string): Promise<AdmissionDocument[]> => {
            return api.get<AdmissionDocument[], AdmissionDocument[]>(`/admissions/public/${token}/documents`);
        },
        saveData: async (token: string, data: any): Promise<void> => {
            await api.post(`/admissions/public/${token}/data`, data);
        },
        validateDocuments: async (token: string): Promise<{ allValid: boolean }> => {
            return api.post<unknown, { allValid: boolean }>(`/admissions/public/${token}/validate-documents`);
        },
        getContract: async (token: string): Promise<{ contractHtml: string }> => {
            return api.get<{ contractHtml: string }, { contractHtml: string }>(`/admissions/public/${token}/contract`);
        },
        signContract: async (token: string, data: any): Promise<void> => {
            await api.post(`/admissions/public/${token}/sign`, data);
        },
        uploadDocument: async (token: string, file: File, type: string): Promise<any> => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);
            return api.post(`/admissions/public/${token}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
    }
};
