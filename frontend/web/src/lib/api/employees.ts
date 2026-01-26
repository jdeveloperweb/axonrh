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
  personalPhone?: string;
  birthDate?: string;
  gender?: string;
  maritalStatus?: string;
  nationality?: string;
  photoUrl?: string;
  admissionDate: string;
  terminationDate?: string;
  employmentType: string;
  status: EmployeeStatus;
  salary?: number;
  workHoursPerWeek?: number;
  department?: {
    id: string;
    name: string;
    code?: string;
  };
  position?: {
    id: string;
    name: string;
    code?: string;
  };
  costCenter?: {
    id: string;
    name: string;
    code: string;
  };
  manager?: {
    id: string;
    fullName: string;
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
  email?: string;
  personalEmail?: string;
  phone?: string;
  personalPhone?: string;
  birthDate?: string;
  gender?: string;
  maritalStatus?: string;
  nationality?: string;
  admissionDate: string;
  employmentType: string;
  salary?: number;
  workHoursPerWeek?: number;
  departmentId?: string;
  positionId?: string;
  costCenterId?: string;
  managerId?: string;
  address?: EmployeeAddress;
}

export interface EmployeeUpdateRequest extends Partial<EmployeeCreateRequest> {
  status?: EmployeeStatus;
}

export interface Department {
  id: string;
  name: string;
  code?: string;
  parentId?: string;
  managerId?: string;
  active: boolean;
}

export interface Position {
  id: string;
  name: string;
  code?: string;
  departmentId?: string;
  baseSalary?: number;
  workHoursPerWeek?: number;
  cboCode?: string;
  active: boolean;
}

export interface CostCenter {
  id: string;
  name: string;
  code: string;
  active: boolean;
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

    const response = await api.get(`/employees?${searchParams.toString()}`);
    return response.data;
  },

  // Get single employee
  getById: async (id: string): Promise<Employee> => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  // Create employee
  create: async (data: EmployeeCreateRequest): Promise<Employee> => {
    const response = await api.post('/employees', data);
    return response.data;
  },

  // Update employee
  update: async (id: string, data: EmployeeUpdateRequest): Promise<Employee> => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },

  // Delete employee (soft delete)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/employees/${id}`);
  },

  // Get employee history
  getHistory: async (id: string): Promise<any[]> => {
    const response = await api.get(`/employees/${id}/history`);
    return response.data;
  },

  // Upload employee photo
  uploadPhoto: async (id: string, file: File): Promise<{ photoUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/employees/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Get employee documents
  getDocuments: async (id: string): Promise<EmployeeDocument[]> => {
    const response = await api.get(`/employees/${id}/documents`);
    return response.data;
  },

  // Upload employee document
  uploadDocument: async (id: string, file: File, type: string): Promise<EmployeeDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const response = await api.post(`/employees/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Get employee dependents
  getDependents: async (id: string): Promise<EmployeeDependent[]> => {
    const response = await api.get(`/employees/${id}/dependents`);
    return response.data;
  },

  // Add dependent
  addDependent: async (id: string, dependent: Omit<EmployeeDependent, 'id'>): Promise<EmployeeDependent> => {
    const response = await api.post(`/employees/${id}/dependents`, dependent);
    return response.data;
  },

  // Update dependent
  updateDependent: async (employeeId: string, dependentId: string, data: Partial<EmployeeDependent>): Promise<EmployeeDependent> => {
    const response = await api.put(`/employees/${employeeId}/dependents/${dependentId}`, data);
    return response.data;
  },

  // Remove dependent
  removeDependent: async (employeeId: string, dependentId: string): Promise<void> => {
    await api.delete(`/employees/${employeeId}/dependents/${dependentId}`);
  },

  // Get departments
  getDepartments: async (): Promise<Department[]> => {
    const response = await api.get('/departments');
    return response.data;
  },

  // Get positions
  getPositions: async (departmentId?: string): Promise<Position[]> => {
    const url = departmentId ? `/positions?departmentId=${departmentId}` : '/positions';
    const response = await api.get(url);
    return response.data;
  },

  // Get cost centers
  getCostCenters: async (): Promise<CostCenter[]> => {
    const response = await api.get('/cost-centers');
    return response.data;
  },

  // Get org chart data
  getOrgChart: async (): Promise<any> => {
    const response = await api.get('/employees/org-chart');
    return response.data;
  },

  // Export employees
  export: async (format: 'xlsx' | 'csv' | 'pdf', params?: EmployeeListParams): Promise<Blob> => {
    const searchParams = new URLSearchParams();
    searchParams.set('format', format);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.departmentId) searchParams.set('departmentId', params.departmentId);

    const response = await api.get(`/employees/export?${searchParams.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Validate CPF
  validateCpf: async (cpf: string): Promise<{ valid: boolean; message?: string }> => {
    const response = await api.get(`/employees/validate-cpf/${cpf}`);
    return response.data;
  },

  // Search address by CEP
  searchCep: async (cep: string): Promise<EmployeeAddress> => {
    const response = await api.get(`/address/cep/${cep}`);
    return response.data;
  },
};
