import { api, Page } from './client';
import {
    BenefitType,
    BenefitTypeRequest,
    EmployeeBenefit,
    EmployeeBenefitRequest,
    BenefitHistory
} from '@/types/benefits';

export const benefitsApi = {
    // Tipos de Benefícios
    getTypes: async (page = 0, size = 20): Promise<Page<BenefitType>> => {
        return await api.get(`/benefits/types?page=${page}&size=${size}`);
    },

    getAllActiveTypes: async (): Promise<BenefitType[]> => {
        return await api.get('/benefits/types/active');
    },

    getTypeById: async (id: string): Promise<BenefitType> => {
        return await api.get(`/benefits/types/${id}`);
    },

    createType: async (data: BenefitTypeRequest): Promise<BenefitType> => {
        return await api.post('/benefits/types', data);
    },

    updateType: async (id: string, data: BenefitTypeRequest): Promise<BenefitType> => {
        return await api.put(`/benefits/types/${id}`, data);
    },

    activateType: async (id: string): Promise<BenefitType> => {
        return await api.patch(`/benefits/types/${id}/activate`);
    },

    deactivateType: async (id: string): Promise<BenefitType> => {
        return await api.patch(`/benefits/types/${id}/deactivate`);
    },

    // Benefícios de Colaboradores
    getEmployeeBenefits: async (page = 0, size = 20): Promise<Page<EmployeeBenefit>> => {
        return await api.get(`/benefits/employees?page=${page}&size=${size}`);
    },

    getBenefitsByEmployee: async (employeeId: string): Promise<EmployeeBenefit[]> => {
        return await api.get(`/benefits/employees/employee/${employeeId}`);
    },

    getActiveBenefitsByEmployee: async (employeeId: string): Promise<EmployeeBenefit[]> => {
        return await api.get(`/benefits/employees/employee/${employeeId}/active`);
    },

    assignBenefit: async (data: EmployeeBenefitRequest): Promise<EmployeeBenefit> => {
        return await api.post('/benefits/employees', data);
    },

    updateEmployeeBenefit: async (id: string, data: EmployeeBenefitRequest): Promise<EmployeeBenefit> => {
        return await api.put(`/benefits/employees/${id}`, data);
    },

    activateEmployeeBenefit: async (id: string): Promise<EmployeeBenefit> => {
        return await api.patch(`/benefits/employees/${id}/activate`);
    },

    deactivateEmployeeBenefit: async (id: string): Promise<EmployeeBenefit> => {
        return await api.patch(`/benefits/employees/${id}/deactivate`);
    },

    cancelEmployeeBenefit: async (id: string): Promise<EmployeeBenefit> => {
        return await api.patch(`/benefits/employees/${id}/cancel`);
    },

    getEmployeeHistory: async (employeeId: string, page = 0, size = 20): Promise<Page<BenefitHistory>> => {
        return await api.get(`/benefits/employees/employee/${employeeId}/history?page=${page}&size=${size}`);
    }
};
