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
    const response = await api.post('/admissions', data);
    return response.data;
  },

  // List admission processes
  list: async (params: AdmissionListParams = {}): Promise<AdmissionListResponse> => {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.set('page', params.page.toString());
    if (params.size !== undefined) searchParams.set('size', params.size.toString());
    if (params.status) searchParams.set('status', params.status);
    if (params.search) searchParams.set('search', params.search);

    const response = await api.get(`/admissions?${searchParams.toString()}`);
    return response.data;
  },

  // Get admission by ID
  getById: async (id: string): Promise<AdmissionProcess> => {
    const response = await api.get(`/admissions/${id}`);
    return response.data;
  },

  // Resend admission link
  resendLink: async (id: string): Promise<{ message: string; link: string }> => {
    const response = await api.post(`/admissions/${id}/resend-link`);
    return response.data;
  },

  // Cancel admission
  cancel: async (id: string, reason?: string): Promise<void> => {
    await api.post(`/admissions/${id}/cancel`, { reason });
  },

  // Get process documents
  getDocuments: async (id: string): Promise<AdmissionDocument[]> => {
    const response = await api.get(`/admissions/${id}/documents`);
    return response.data;
  },

  // Get contract preview
  getContractPreview: async (id: string): Promise<string> => {
    const response = await api.get(`/admissions/${id}/contract-preview`);
    return response.data;
  },

  // Complete admission
  complete: async (id: string): Promise<AdmissionProcess> => {
    const response = await api.post(`/admissions/${id}/complete`);
    return response.data;
  },

  // Get statistics
  getStatistics: async (startDate?: string, endDate?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const response = await api.get(`/admissions/statistics?${params.toString()}`);
    return response.data;
  },

  // Get count by status
  getCountByStatus: async (): Promise<Record<AdmissionStatus, number>> => {
    const response = await api.get('/admissions/statistics/by-status');
    return response.data;
  },

  // Public API (for candidates)
  public: {
    // Access by token
    access: async (token: string): Promise<AdmissionProcess> => {
      const response = await api.get(`/admissions/public/${token}`);
      return response.data;
    },

    // Save candidate data
    saveData: async (token: string, data: Record<string, any>): Promise<AdmissionProcess> => {
      const response = await api.post(`/admissions/public/${token}/data`, data);
      return response.data;
    },

    // Upload document
    uploadDocument: async (token: string, file: File, documentType: string): Promise<any> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      const response = await api.post(`/admissions/public/${token}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },

    // Get documents
    getDocuments: async (token: string): Promise<any[]> => {
      const response = await api.get(`/admissions/public/${token}/documents`);
      return response.data;
    },

    // Get required documents status
    getRequiredDocuments: async (token: string): Promise<RequiredDocumentsResponse> => {
      const response = await api.get(`/admissions/public/${token}/required-documents`);
      return response.data;
    },

    // Validate all documents
    validateDocuments: async (token: string): Promise<any> => {
      const response = await api.post(`/admissions/public/${token}/validate-documents`);
      return response.data;
    },

    // Get contract
    getContract: async (token: string): Promise<any> => {
      const response = await api.get(`/admissions/public/${token}/contract`);
      return response.data;
    },

    // Sign contract
    signContract: async (token: string, signatureData: Record<string, any>): Promise<AdmissionProcess> => {
      const response = await api.post(`/admissions/public/${token}/sign-contract`, signatureData);
      return response.data;
    },
  },
};
