import { api } from './client';

export interface Position {
    id: string;
    code: string;
    title: string;
    description?: string;
    responsibilities?: string;
    cboCode?: string;
    salaryRangeMin?: number;
    salaryRangeMax?: number;
    level?: string;
    departmentId: string;
    departmentName?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreatePositionData {
    code: string;
    title: string;
    description?: string;
    responsibilities?: string;
    cboCode?: string;
    salaryRangeMin?: number;
    salaryRangeMax?: number;
    level?: string;
    departmentId: string;
}

export interface UpdatePositionData extends Partial<CreatePositionData> { }

export const positionsApi = {
    getPositions: async (page = 0, size = 20) => {
        const response = await api.get(`/v1/positions?page=${page}&size=${size}`);
        return response.data;
    },

    getActivePositions: async () => {
        const response = await api.get('/v1/positions/active');
        return response.data;
    },

    getPosition: async (id: string) => {
        const response = await api.get(`/v1/positions/${id}`);
        return response.data;
    },

    createPosition: async (data: CreatePositionData) => {
        const response = await api.post('/v1/positions', data);
        return response.data;
    },

    updatePosition: async (id: string, data: UpdatePositionData) => {
        const response = await api.put(`/v1/positions/${id}`, data);
        return response.data;
    },

    deletePosition: async (id: string) => {
        await api.delete(`/v1/positions/${id}`);
    },
};
