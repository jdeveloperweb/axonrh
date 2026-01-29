import { api } from './client';

// Types
export interface Employee {
  id: string;
  registrationNumber: string;
  cpf: string;
  fullName: string;
  socialName?: string;
  email?: string;
  personalEmail?: string;
  phone?: string;
  mobile?: string;
  personalPhone?: string; // Mantido para compatibilidade
  birthDate?: string;
  gender?: string;
  ethnicity?: string;
  maritalStatus?: string;
  nationality?: string;
  photoUrl?: string;
  hireDate: string;
  admissionDate?: string; // Mantido para compatibilidade temporaria se necessario

  terminationDate?: string;
  employmentType: string;
  status: EmployeeStatus;
  baseSalary?: number;
  salary?: number; // Mantido para compatibilidade
  weeklyHours?: number;
  workHoursPerWeek?: number; // Mantido para compatibilidade
  department?: {
    id: string;
    name: string;
    code?: string;
  };
  position?: {
    id: string;
    name?: string;
    title?: string;
    code?: string;
  };
  costCenter?: {
    id: string;
    name: string;
    code: string;
  };
  manager?: {
    id: string;
    name: string;
    fullName?: string; // Como alias
    photoUrl?: string;
  };
  address?: EmployeeAddress;
  documents?: EmployeeDocument[];
  dependents?: EmployeeDependent[];
  createdAt: string;
  updatedAt: string;
}

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'PENDING';

export interface EmployeeAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

export interface EmployeeDocument {
  id: string;
  type: string;
  number: string;
  issuingAuthority?: string;
  issueDate?: string;
  expirationDate?: string;
  fileUrl?: string;
}

export interface EmployeeDependent {
  id: string;
  name: string;
  relationship: string;
  birthDate: string;
  cpf?: string;
  isIRDependent: boolean;
  isHealthPlanDependent: boolean;
}

export interface EmployeeListParams {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  status?: EmployeeStatus;
  departmentId?: string;
  positionId?: string;
}

export interface EmployeeListResponse {
  content: Employee[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface EmployeeCreateRequest {
  cpf: string;
  fullName: string;
  socialName?: string;
  email: string;  // Obrigatório no backend
  personalEmail?: string;
  phone?: string;
  mobile?: string;  // Renomeado de personalPhone
  birthDate: string;  // Obrigatório no backend
  gender?: string;
  ethnicity?: string;
  maritalStatus?: string;
  nationality?: string;
  hireDate: string;  // Renomeado de admissionDate
  employmentType: string;
  baseSalary?: number;  // Renomeado de salary
  weeklyHours?: number;  // Renomeado de workHoursPerWeek
  departmentId?: string;
  positionId?: string;
  costCenterId?: string;
  managerId?: string;
  // Campos de endereço planos (não objeto aninhado)
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressZipCode?: string;
  addressCountry?: string;
}

export interface EmployeeUpdateRequest extends Partial<EmployeeCreateRequest> {
  status?: EmployeeStatus;
  ethnicity?: string;
}

export interface Department {
  id: string;
  name: string;
  code?: string;
  description?: string;
  parentId?: string;
  managerId?: string;
  managerName?: string;
  employeeCount?: number;
  isActive: boolean;
}

export interface Position {
  id: string;
  title: string;
  code?: string;
  departmentId?: string;
  salaryRangeMin?: number;
  salaryRangeMax?: number;
  cboCode?: string;
  isActive: boolean;
}

export interface CostCenter {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface OrgNode {
  id: string;
  name: string;
  position: string;
  department: string;
  photoUrl?: string;
  email?: string;
  children: OrgNode[];
  expanded?: boolean;
  level?: number;
}

// API Functions
export const employeesApi = {
  // List employees with pagination and filters
  list: async (params: EmployeeListParams = {}): Promise<EmployeeListResponse> => {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.set('page', params.page.toString());
    if (params.size !== undefined) searchParams.set('size', params.size.toString());
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.search) searchParams.set('search', params.search);
    if (params.status) searchParams.set('status', params.status);
    if (params.departmentId) searchParams.set('departmentId', params.departmentId);
    if (params.positionId) searchParams.set('positionId', params.positionId);

    return api.get<EmployeeListResponse, EmployeeListResponse>(`/employees?${searchParams.toString()}`);
  },

  // Get single employee
  getById: async (id: string): Promise<Employee> => {
    const response = await api.get<Employee, Employee>(`/employees/${id}`);
    return response;
  },

  // Create employee
  create: async (data: EmployeeCreateRequest): Promise<Employee> => {
    return api.post<EmployeeCreateRequest, Employee>('/employees', data);
  },

  // Update employee
  update: async (id: string, data: EmployeeUpdateRequest): Promise<Employee> => {
    return api.put<EmployeeUpdateRequest, Employee>(`/employees/${id}`, data);
  },

  // Delete employee (soft delete)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/employees/${id}`);
  },

  // Get employee history
  getHistory: async (id: string): Promise<Record<string, unknown>[]> => {
    return api.get<Record<string, unknown>[], Record<string, unknown>[]>(`/employees/${id}/history`);
  },

  // Upload employee photo
  uploadPhoto: async (id: string, file: File): Promise<{ photoUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<FormData, { photoUrl: string }>(`/employees/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Get employee documents
  getDocuments: async (id: string): Promise<EmployeeDocument[]> => {
    return api.get<EmployeeDocument[], EmployeeDocument[]>(`/employees/${id}/documents`);
  },

  // Upload employee document
  uploadDocument: async (id: string, file: File, type: string): Promise<EmployeeDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.post<FormData, EmployeeDocument>(`/employees/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Get employee dependents
  getDependents: async (id: string): Promise<EmployeeDependent[]> => {
    return api.get<EmployeeDependent[], EmployeeDependent[]>(`/employees/${id}/dependents`);
  },

  // Add dependent
  addDependent: async (id: string, dependent: Omit<EmployeeDependent, 'id'>): Promise<EmployeeDependent> => {
    return api.post<unknown, EmployeeDependent>(`/employees/${id}/dependents`, dependent);
  },

  // Update dependent
  updateDependent: async (employeeId: string, dependentId: string, data: Partial<EmployeeDependent>): Promise<EmployeeDependent> => {
    return api.put<unknown, EmployeeDependent>(`/employees/${employeeId}/dependents/${dependentId}`, data);
  },

  // Remove dependent
  removeDependent: async (employeeId: string, dependentId: string): Promise<void> => {
    await api.delete(`/employees/${employeeId}/dependents/${dependentId}`);
  },

  // Get departments
  getDepartments: async (): Promise<Department[]> => {
    return api.get<Department[], Department[]>('/departments');
  },

  // Get positions
  getPositions: async (departmentId?: string): Promise<Position[]> => {
    const url = departmentId ? `/positions/active?departmentId=${departmentId}` : '/positions/active';
    return api.get<Position[], Position[]>(url);
  },

  // Get cost centers
  getCostCenters: async (): Promise<CostCenter[]> => {
    return api.get<CostCenter[], CostCenter[]>('/cost-centers');
  },

  // Get org chart data
  getOrgChart: async (): Promise<OrgNode> => {
    return api.get<unknown, OrgNode>('/employees/org-chart');
  },

  // Export employees
  export: async (format: 'xlsx' | 'csv' | 'pdf', params?: EmployeeListParams): Promise<Blob> => {
    const searchParams = new URLSearchParams();
    searchParams.set('format', format);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.departmentId) searchParams.set('departmentId', params.departmentId);

    return api.get<unknown, Blob>(`/employees/export?${searchParams.toString()}`, {
      responseType: 'blob',
    });
  },

  // Validate CPF
  validateCpf: async (cpf: string): Promise<{ valid: boolean; message?: string }> => {
    return api.get<unknown, { valid: boolean; message?: string }>(`/employees/validate-cpf/${cpf}`);
  },

  // Search address by CEP
  searchCep: async (cep: string): Promise<EmployeeAddress> => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      return {
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
        zipCode: data.cep || cep,
        number: '',
        country: 'Brasil'
      };
    } catch (error) {
      console.error('ViaCEP error:', error);
      throw new Error('Falha ao buscar CEP na ViaCEP');
    }
  },
};
