import { api } from './client';

// Types
export interface ManagerDTO {
    id: string;
    registrationNumber: string;
    fullName: string;
    email: string;
    positionName?: string;
    departmentName?: string;
    managedDepartments: ManagedDepartmentDTO[];
    totalSubordinates: number;
    totalManagedDepartments: number;
}

export interface ManagedDepartmentDTO {
    id: string;
    code: string;
    name: string;
    employeeCount: number;
}

export interface EmployeeBasicDTO {
    id: string;
    registrationNumber: string;
    fullName: string;
    email: string;
    positionName?: string;
    departmentName?: string;
}

// API Functions
export const managersApi = {
    // List all managers
    list: async (): Promise<ManagerDTO[]> => {
        return api.get<ManagerDTO[], ManagerDTO[]>('/managers');
    },

    // Get manager details
    getById: async (id: string): Promise<ManagerDTO> => {
        return api.get<ManagerDTO, ManagerDTO>(`/managers/${id}`);
    },

    // Get departments managed by a manager
    getDepartments: async (id: string): Promise<ManagedDepartmentDTO[]> => {
        return api.get<ManagedDepartmentDTO[], ManagedDepartmentDTO[]>(`/managers/${id}/departments`);
    },

    // Get subordinates of a manager
    getSubordinates: async (id: string): Promise<EmployeeBasicDTO[]> => {
        return api.get<EmployeeBasicDTO[], EmployeeBasicDTO[]>(`/managers/${id}/subordinates`);
    },
};
