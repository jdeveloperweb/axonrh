import { api } from './api';
import {
    BenefitType,
    BenefitTypeRequest,
    EmployeeBenefit,
    EmployeeBenefitRequest,
    BenefitHistory
} from '@/types/benefits';

export const benefitsApi = {
    // Tipos de Benefícios
    getTypes: async (page = 0, size = 20) => {
        const response = await api.get(`/benefits/api/v1/benefits/types?page=${page}&size=${size}`);
        return response.data;
    },

    getAllActiveTypes: async () => {
        const response = await api.get('/benefits/api/v1/benefits/types/active');
        return response.data as BenefitType[];
    },

    getTypeById: async (id: string) => {
        const response = await api.get(`/benefits/api/v1/benefits/types/${id}`);
        return response.data as BenefitType;
    },

    createType: async (data: BenefitTypeRequest) => {
        const response = await api.post('/benefits/api/v1/benefits/types', data);
        return response.data as BenefitType;
    },

    updateType: async (id: string, data: BenefitTypeRequest) => {
        const response = await api.put(`/benefits/api/v1/benefits/types/${id}`, data);
        return response.data as BenefitType;
    },

    activateType: async (id: string) => {
        const response = await api.patch(`/benefits/api/v1/benefits/types/${id}/activate`);
        return response.data;
    },

    deactivateType: async (id: string) => {
        const response = await api.patch(`/benefits/api/v1/benefits/types/${id}/deactivate`);
        return response.data;
    },

    // Benefícios de Colaboradores
    getEmployeeBenefits: async (page = 0, size = 20) => {
        const response = await api.get(`/benefits/api/v1/benefits/employees?page=${page}&size=${size}`);
        return response.data;
    },

    getBenefitsByEmployee: async (employeeId: string) => {
        const response = await api.get(`/benefits/api/v1/benefits/employees/employee/${employeeId}`);
        return response.data as EmployeeBenefit[];
    },

    getActiveBenefitsByEmployee: async (employeeId: string) => {
        const response = await api.get(`/benefits/api/v1/benefits/employees/employee/${employeeId}/active`);
        return response.data as EmployeeBenefit[];
    },

    assignBenefit: async (data: EmployeeBenefitRequest) => {
        const response = await api.post('/benefits/api/v1/benefits/employees', data);
        return response.data as EmployeeBenefit;
    },

    updateEmployeeBenefit: async (id: string, data: EmployeeBenefitRequest) => {
        const response = await api.put(`/benefits/api/v1/benefits/employees/${id}`, data);
        return response.data as EmployeeBenefit;
    },

    activateEmployeeBenefit: async (id: string) => {
        const response = await api.patch(`/benefits/api/v1/benefits/employees/${id}/activate`);
        return response.data;
    },

    deactivateEmployeeBenefit: async (id: string) => {
        const response = await api.patch(`/benefits/api/v1/benefits/employees/${id}/deactivate`);
        return response.data;
    },

    cancelEmployeeBenefit: async (id: string) => {
        const response = await api.patch(`/benefits/api/v1/benefits/employees/${id}/cancel`);
        return response.data;
    },

    getEmployeeHistory: async (employeeId: string, page = 0, size = 20) => {
        const response = await api.get(`/benefits/api/v1/benefits/employees/employee/${employeeId}/history?page=${page}&size=${size}`);
        return response.data;
    }
};
