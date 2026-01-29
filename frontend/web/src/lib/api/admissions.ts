import { api } from './client';
import { AdmissionProcess, AdmissionDocument } from './processes';

export type { AdmissionProcess, AdmissionDocument };

export const admissionsApi = {
    // Admin methods (standard)
    create: async (data: any): Promise<AdmissionProcess> => {
        return api.post<any, AdmissionProcess>('/admissions', data);
    },
    list: async (params: any = {}): Promise<any> => {
        const searchParams = new URLSearchParams();
        if (params.page !== undefined) searchParams.set('page', params.page.toString());
        if (params.size !== undefined) searchParams.set('size', params.size.toString());
        if (params.status) searchParams.set('status', params.status);
        if (params.search) searchParams.set('search', params.search);
        return api.get<any, any>(`/admissions?${searchParams.toString()}`);
    },
    getById: async (id: string): Promise<AdmissionProcess> => {
        return api.get<AdmissionProcess, AdmissionProcess>(`/admissions/${id}`);
    },

    // Public methods for the candidate wizard
    public: {
        access: async (token: string): Promise<AdmissionProcess> => {
            return api.get<AdmissionProcess, AdmissionProcess>(`/admissions/public/${token}`);
        },
        getDocuments: async (token: string): Promise<AdmissionDocument[]> => {
            const response = await api.get<AdmissionDocument[], AdmissionDocument[]>(`/admissions/public/${token}/documents`);
            return response;
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
