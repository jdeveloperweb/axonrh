import { api } from './client';

// Types
export interface DepartmentDTO {
    id: string;
    code: string;
    name: string;
    description?: string;
    isActive: boolean;
    parent?: {
        id: string;
        code: string;
        name: string;
    };
    manager?: {
        id: string;
        registrationNumber: string;
        fullName: string;
        email: string;
        positionName?: string;
    };
    costCenter?: {
        id: string;
        code: string;
        name: string;
    };
    employeeCount: number;
    subdepartmentCount: number;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
}

export interface CreateDepartmentDTO {
    code: string;
    name: string;
    description?: string;
    parentId?: string;
    managerId?: string;
    costCenterId?: string;
}

export interface UpdateDepartmentDTO {
    code?: string;
    name?: string;
    description?: string;
    parentId?: string;
    managerId?: string;
    costCenterId?: string;
    isActive?: boolean;
}

export interface AssignManagerDTO {
    departmentId: string;
    managerId?: string;
}

// API Functions
export const departmentsApi = {
    // List all active departments
    list: async (): Promise<DepartmentDTO[]> => {
        return api.get<DepartmentDTO[], DepartmentDTO[]>('/departments');
    },

    // Get department by ID
    getById: async (id: string): Promise<DepartmentDTO> => {
        return api.get<DepartmentDTO, DepartmentDTO>(`/departments/${id}`);
    },

    // Create department
    create: async (data: CreateDepartmentDTO): Promise<DepartmentDTO> => {
        return api.post<CreateDepartmentDTO, DepartmentDTO>('/departments', data);
    },

    // Update department
    update: async (id: string, data: UpdateDepartmentDTO): Promise<DepartmentDTO> => {
        return api.put<UpdateDepartmentDTO, DepartmentDTO>(`/departments/${id}`, data);
    },

    // Delete department (soft delete)
    delete: async (id: string): Promise<void> => {
        await api.delete(`/departments/${id}`);
    },

    // Assign manager to department
    assignManager: async (departmentId: string, managerId: string): Promise<DepartmentDTO> => {
        return api.put<AssignManagerDTO, DepartmentDTO>(`/departments/${departmentId}/manager`, {
            departmentId,
            managerId,
        });
    },

    // Remove manager from department
    removeManager: async (departmentId: string): Promise<DepartmentDTO> => {
        return api.delete<DepartmentDTO, DepartmentDTO>(`/departments/${departmentId}/manager`);
    },

    // Get departments by manager
    getByManager: async (managerId: string): Promise<DepartmentDTO[]> => {
        return api.get<DepartmentDTO[], DepartmentDTO[]>(`/departments/manager/${managerId}`);
    },
};
