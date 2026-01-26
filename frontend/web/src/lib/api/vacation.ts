import { api } from './client';

// ==================== Types ====================

export interface VacationPeriod {
  id: string;
  employeeId: string;
  employeeName?: string;
  acquisitionStartDate: string;
  acquisitionEndDate: string;
  concessionStartDate: string;
  concessionEndDate: string;
  totalDays: number;
  usedDays: number;
  soldDays: number;
  remainingDays: number;
  status: 'OPEN' | 'SCHEDULED' | 'PARTIALLY_USED' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  statusLabel: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiration: number;
}

export interface VacationRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  vacationPeriodId: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  requestType: 'REGULAR' | 'COLLECTIVE' | 'FRACTIONED';
  requestTypeLabel: string;
  fractionNumber?: number;
  sellDays: boolean;
  soldDaysCount: number;
  advance13thSalary: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  statusLabel: string;
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  paymentDate?: string;
  paymentValue?: number;
  noticeDocumentUrl?: string;
  receiptDocumentUrl?: string;
  notes?: string;
  createdAt: string;
  canCancel: boolean;
}

export interface VacationSimulation {
  baseSalary: number;
  vacationDays: number;
  sellDays: number;
  advance13th: boolean;
  // Results
  vacationSalary: number;
  vacationBonus: number; // 1/3
  sellValue: number;
  salary13th?: number;
  grossTotal: number;
  inssDeduction: number;
  irrfDeduction: number;
  netTotal: number;
}

export interface TeamCalendarEntry {
  employeeId: string;
  employeeName: string;
  departmentName?: string;
  startDate: string;
  endDate: string;
  status: string;
  type: string;
}

// ==================== Request Types ====================

export interface VacationRequestCreateDTO {
  vacationPeriodId: string;
  startDate: string;
  endDate: string;
  fractioned?: boolean;
  fractionNumber?: number;
  sellDays?: boolean;
  soldDaysCount?: number;
  advance13thSalary?: boolean;
  notes?: string;
}

export interface VacationSimulationRequest {
  baseSalary: number;
  vacationDays: number;
  sellDays?: number;
  advance13th?: boolean;
}

// ==================== API Client ====================

export const vacationApi = {
  // ==================== Periods ====================

  /**
   * List periods for an employee
   */
  getEmployeePeriods: async (employeeId: string): Promise<VacationPeriod[]> => {
    const response = await api.get(`/api/v1/vacation/periods/employee/${employeeId}`);
    return response.data;
  },

  /**
   * Get my periods
   */
  getMyPeriods: async (): Promise<VacationPeriod[]> => {
    const response = await api.get('/api/v1/vacation/periods/my');
    return response.data;
  },

  /**
   * Get expiring periods
   */
  getExpiringPeriods: async (daysThreshold = 60): Promise<VacationPeriod[]> => {
    const response = await api.get('/api/v1/vacation/periods/expiring', {
      params: { days: daysThreshold }
    });
    return response.data;
  },

  // ==================== Requests ====================

  /**
   * Create vacation request
   */
  createRequest: async (data: VacationRequestCreateDTO): Promise<VacationRequest> => {
    const response = await api.post('/api/v1/vacation/requests', data);
    return response.data;
  },

  /**
   * Get my requests
   */
  getMyRequests: async (): Promise<VacationRequest[]> => {
    const response = await api.get('/api/v1/vacation/requests/my');
    return response.data;
  },

  /**
   * Get pending requests (for managers)
   */
  getPendingRequests: async (page = 0, size = 20): Promise<{ content: VacationRequest[]; totalElements: number }> => {
    const response = await api.get('/api/v1/vacation/requests/pending', {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * Approve request
   */
  approveRequest: async (requestId: string, notes?: string): Promise<VacationRequest> => {
    const response = await api.post(`/api/v1/vacation/requests/${requestId}/approve`, null, {
      params: { notes }
    });
    return response.data;
  },

  /**
   * Reject request
   */
  rejectRequest: async (requestId: string, reason: string): Promise<VacationRequest> => {
    const response = await api.post(`/api/v1/vacation/requests/${requestId}/reject`, null, {
      params: { reason }
    });
    return response.data;
  },

  /**
   * Cancel request
   */
  cancelRequest: async (requestId: string): Promise<VacationRequest> => {
    const response = await api.post(`/api/v1/vacation/requests/${requestId}/cancel`);
    return response.data;
  },

  /**
   * Generate notice document
   */
  generateNotice: async (requestId: string): Promise<string> => {
    const response = await api.post(`/api/v1/vacation/requests/${requestId}/notice`);
    return response.data.documentUrl;
  },

  /**
   * Generate receipt document
   */
  generateReceipt: async (requestId: string): Promise<string> => {
    const response = await api.post(`/api/v1/vacation/requests/${requestId}/receipt`);
    return response.data.documentUrl;
  },

  // ==================== Calendar ====================

  /**
   * Get team calendar
   */
  getTeamCalendar: async (
    year: number,
    month?: number,
    departmentId?: string
  ): Promise<TeamCalendarEntry[]> => {
    const response = await api.get('/api/v1/vacation/calendar/team', {
      params: { year, month, departmentId }
    });
    return response.data;
  },

  /**
   * Get my calendar entries
   */
  getMyCalendar: async (year: number): Promise<TeamCalendarEntry[]> => {
    const response = await api.get('/api/v1/vacation/calendar/my', {
      params: { year }
    });
    return response.data;
  },

  // ==================== Simulation ====================

  /**
   * Simulate vacation values
   */
  simulate: async (data: VacationSimulationRequest): Promise<VacationSimulation> => {
    const response = await api.post('/api/v1/vacation/simulate', data);
    return response.data;
  },

  // ==================== Statistics ====================

  /**
   * Get vacation statistics
   */
  getStatistics: async (): Promise<{
    pendingRequests: number;
    expiringPeriods: number;
    employeesOnVacation: number;
    upcomingVacations: number;
  }> => {
    const response = await api.get('/api/v1/vacation/statistics');
    return response.data;
  },
};

export default vacationApi;
