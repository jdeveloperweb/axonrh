
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

export interface EapRequest {
    id: string;
    employeeId: string;
    employeeName?: string;
    employeePhotoUrl?: string;
    score: number;
    notes: string;
    sentiment?: string;
    riskLevel: string;
    handled: boolean;
    createdAt: string;
}

export interface PreventionGuide {
    id: string;
    title: string;
    description: string;
    url: string;
    type: string;
}

export interface WellbeingCampaign {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    status: string;
}

export interface WellbeingStats {
    totalCheckins: number;
    averageScore: number;
    sentimentDistribution: Record<string, number>;
    highRiskCount: number;
    totalEapRequests: number;
    eapRequests: EapRequest[];
    preventionGuides: PreventionGuide[];
    activeCampaigns: WellbeingCampaign[];
}

export const wellbeingApi = {
    checkIn: async (data: MoodCheckInRequest): Promise<MoodCheckInResponse> => {
        return await api.post('/employees/wellbeing/check-in', data);
    },

    getHistory: async (employeeId: string) => {
        return await api.get(`/employees/wellbeing/history/${employeeId}`);
    },

    getStats: async (): Promise<WellbeingStats> => {
        return await api.get('/employees/wellbeing/stats');
    },

    markAsHandled: async (id: string): Promise<void> => {
        return await api.post(`/employees/wellbeing/${id}/handle`, {});
    }
};
