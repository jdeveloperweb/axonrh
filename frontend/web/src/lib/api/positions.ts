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

export type UpdatePositionData = Partial<CreatePositionData>;

export interface PositionListResponse {
    content: Position[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}


export const positionsApi = {
    getPositions: async (page = 0, size = 20) => {
        return api.get<unknown, PositionListResponse>(`/positions?page=${page}&size=${size}`);
    },


    getActivePositions: async (departmentId?: string): Promise<Position[]> => {
        const url = departmentId ? `/positions/active?departmentId=${departmentId}` : '/positions/active';
        return api.get<unknown, Position[]>(url);
    },


    getPosition: async (id: string) => {
        return api.get<unknown, Position>(`/positions/${id}`);
    },


    createPosition: async (data: CreatePositionData) => {
        return api.post<CreatePositionData, Position>('/positions', data);
    },

    updatePosition: async (id: string, data: UpdatePositionData) => {
        return api.put<UpdatePositionData, Position>(`/positions/${id}`, data);
    },

    deletePosition: async (id: string) => {
        await api.delete(`/positions/${id}`);
    },
};
