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

// Types for Termination Process
export type TerminationType =
    | 'RESIGNATION'
    | 'TERMINATION_WITHOUT_CAUSE'
    | 'TERMINATION_WITH_CAUSE'
    | 'AGREEMENT'
    | 'RETIREMENT'
    | 'DEATH'
    | 'END_OF_CONTRACT';

export type NoticePeriod = 'WORKED' | 'PAID' | 'WAIVED';

export interface TerminationProcess {
    id: string;
    employeeId: string;
    employeeName: string;
    terminationType: TerminationType;
    noticePeriod: NoticePeriod;
    lastWorkDay: string;
    terminationDate: string;
    reason?: string;

    // Equipment checklist
    returnedLaptop: boolean;
    returnedMouse: boolean;
    returnedKeyboard: boolean;
    returnedHeadset: boolean;
    returnedBadge: boolean;
    returnedToken: boolean;
    otherEquipment?: string;
    equipmentNotes?: string;

    // Process checklist
    accountDeactivated: boolean;
    emailDeactivated: boolean;
    exitInterviewDone: boolean;
    esocialSent: boolean;

    createdAt: string;
    completedAt?: string;
}

export interface TerminationRequest {
    employeeId: string;
    terminationType: TerminationType;
    noticePeriod: NoticePeriod;
    lastWorkDay: string;
    terminationDate: string;
    reason?: string;

    returnedLaptop?: boolean;
    returnedMouse?: boolean;
    returnedKeyboard?: boolean;
    returnedHeadset?: boolean;
    returnedBadge?: boolean;
    returnedToken?: boolean;
    otherEquipment?: string;
    equipmentNotes?: string;

    accountDeactivated?: boolean;
    emailDeactivated?: boolean;
    exitInterviewDone?: boolean;
}

// API Functions
export const processesApi = {
    // Admission Processes
    admissions: {
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
    },

    // Termination Processes
    terminations: {
        getByEmployeeId: async (employeeId: string): Promise<TerminationProcess> => {
            return api.get<any, TerminationProcess>(`/terminations/employee/${employeeId}`);
        },
        initiate: async (data: TerminationRequest): Promise<TerminationProcess> => {
            return api.post<TerminationRequest, TerminationProcess>('/terminations', data);
        },
        complete: async (id: string): Promise<TerminationProcess> => {
            return api.post<any, TerminationProcess>(`/terminations/${id}/complete`, {});
        }
    }
};

// Aliases for compatibility
export const admissionsApi = processesApi.admissions;
