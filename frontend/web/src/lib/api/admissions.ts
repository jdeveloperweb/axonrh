import { api } from './client';

// Types
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

// API Functions
export const admissionsApi = {
  // Create admission process
  create: async (data: AdmissionCreateRequest): Promise<AdmissionProcess> => {
    return api.post<AdmissionCreateRequest, AdmissionProcess>('/admissions', data);
  },

  // List admission processes
  list: async (params: AdmissionListParams = {}): Promise<AdmissionListResponse> => {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.set('page', params.page.toString());
    if (params.size !== undefined) searchParams.set('size', params.size.toString());
    if (params.status) searchParams.set('status', params.status);
    if (params.search) searchParams.set('search', params.search);

    return api.get<AdmissionListResponse, AdmissionListResponse>(`/admissions?${searchParams.toString()}`);
  },

  // Get admission by ID
  getById: async (id: string): Promise<AdmissionProcess> => {
    return api.get<AdmissionProcess, AdmissionProcess>(`/admissions/${id}`);
  },

  // Resend admission link
  resendLink: async (id: string): Promise<{ message: string; link: string }> => {
    return api.post<any, { message: string; link: string }>(`/admissions/${id}/resend-link`);
  },

  // Cancel admission
  cancel: async (id: string, reason?: string): Promise<void> => {
    await api.post(`/admissions/${id}/cancel`, { reason });
  },

  // Get process documents
  getDocuments: async (id: string): Promise<AdmissionDocument[]> => {
    return api.get<AdmissionDocument[], AdmissionDocument[]>(`/admissions/${id}/documents`);
  },

  // Get contract preview
  getContractPreview: async (id: string): Promise<string> => {
    return api.get<string, string>(`/admissions/${id}/contract-preview`);
  },

  // Complete admission
  complete: async (id: string): Promise<AdmissionProcess> => {
    return api.post<any, AdmissionProcess>(`/admissions/${id}/complete`);
  },

  // Get statistics
  getStatistics: async (startDate?: string, endDate?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return api.get<any, any>(`/admissions/statistics?${params.toString()}`);
  },

  // Get count by status
  getCountByStatus: async (): Promise<Record<AdmissionStatus, number>> => {
    return api.get<Record<AdmissionStatus, number>, Record<AdmissionStatus, number>>('/admissions/statistics/by-status');
  },

  // Public API (for candidates)
  public: {
    // Access by token
    access: async (token: string): Promise<AdmissionProcess> => {
      return api.get<AdmissionProcess, AdmissionProcess>(`/admissions/public/${token}`);
    },

    // Save candidate data
    saveData: async (token: string, data: Record<string, any>): Promise<AdmissionProcess> => {
      return api.post<Record<string, any>, AdmissionProcess>(`/admissions/public/${token}/data`, data);
    },

    // Upload document
    uploadDocument: async (token: string, file: File, documentType: string): Promise<any> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      return api.post<FormData, any>(`/admissions/public/${token}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },

    // Get documents
    getDocuments: async (token: string): Promise<any[]> => {
      return api.get<any[], any[]>(`/admissions/public/${token}/documents`);
    },

    // Get required documents status
    getRequiredDocuments: async (token: string): Promise<RequiredDocumentsResponse> => {
      return api.get<RequiredDocumentsResponse, RequiredDocumentsResponse>(`/admissions/public/${token}/required-documents`);
    },

    // Validate all documents
    validateDocuments: async (token: string): Promise<any> => {
      return api.post<any, any>(`/admissions/public/${token}/validate-documents`);
    },

    // Get contract
    getContract: async (token: string): Promise<any> => {
      return api.get<any, any>(`/admissions/public/${token}/contract`);
    },

    // Sign contract
    signContract: async (token: string, signatureData: Record<string, any>): Promise<AdmissionProcess> => {
      return api.post<Record<string, any>, AdmissionProcess>(`/admissions/public/${token}/sign-contract`, signatureData);
    },
  },
};
