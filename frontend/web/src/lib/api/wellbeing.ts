
import { api } from './client';

export interface MoodCheckInRequest {
    employeeId: string;
    score: number; // 1-5
    notes?: string;
    wantsEapContact: boolean;
    source: 'WEB' | 'MOBILE';
}

export interface MoodCheckInResponse {
    id: string;
    analysis?: string;
    riskLevel?: string;
}

export const wellbeingApi = {
    checkIn: async (data: MoodCheckInRequest): Promise<MoodCheckInResponse> => {
        const response = await api.post('/employees/wellbeing/check-in', data);
        return response.data;
    },

    getHistory: async (employeeId: string) => {
        const response = await api.get(`/employees/wellbeing/history/${employeeId}`);
        return response.data;
    }
};
