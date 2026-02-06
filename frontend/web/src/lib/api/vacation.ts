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
    return api.get<VacationPeriod[], VacationPeriod[]>(`/vacations/periods/employee/${employeeId}`);
  },

  /**
   * Get my periods
   */
  getMyPeriods: async (): Promise<VacationPeriod[]> => {
    return api.get<unknown, VacationPeriod[]>('/vacations/periods/my-periods');
  },

  /**
   * Get expiring periods
   */
  getExpiringPeriods: async (daysThreshold = 60): Promise<VacationPeriod[]> => {
    return api.get<unknown, VacationPeriod[]>('/vacations/periods/expiring', {
      params: { daysThreshold }
    });
  },

  /**
   * Notify expiration
   */
  notifyExpiration: async (periodId: string): Promise<void> => {
    return api.post<unknown, void>(`/vacations/periods/${periodId}/notify`, {});
  },

  // ==================== Requests ====================

  /**
   * Create vacation request
   */
  createRequest: async (data: VacationRequestCreateDTO): Promise<VacationRequest> => {
    return api.post<VacationRequestCreateDTO, VacationRequest>('/vacations/requests', data);
  },

  /**
   * Get my requests
   */
  getMyRequests: async (): Promise<VacationRequest[]> => {
    return api.get<unknown, VacationRequest[]>('/vacations/requests/my-requests');
  },

  /**
   * Get pending requests (for managers)
   */
  getPendingRequests: async (page = 0, size = 20): Promise<{ content: VacationRequest[]; totalElements: number }> => {
    return api.get<unknown, { content: VacationRequest[]; totalElements: number }>('/vacations/requests/pending', {
      params: { page, size }
    });
  },

  /**
   * Approve request
   */
  approveRequest: async (requestId: string, notes?: string): Promise<VacationRequest> => {
    return api.put<unknown, VacationRequest>(`/vacations/requests/${requestId}/approve`, { notes });
  },

  /**
   * Reject request
   */
  rejectRequest: async (requestId: string, reason: string): Promise<VacationRequest> => {
    return api.put<unknown, VacationRequest>(`/vacations/requests/${requestId}/reject`, { reason });
  },

  /**
   * Cancel request
   */
  cancelRequest: async (requestId: string): Promise<VacationRequest> => {
    return api.put<unknown, VacationRequest>(`/vacations/requests/${requestId}/cancel`, {});
  },

  /**
   * Generate notice document
   */
  generateNotice: async (requestId: string): Promise<string> => {
    const response = await api.post<unknown, { documentUrl: string }>(`/vacations/requests/${requestId}/notice`);
    return response.documentUrl;
  },

  /**
   * Generate receipt document
   */
  generateReceipt: async (requestId: string): Promise<string> => {
    const response = await api.post<unknown, { documentUrl: string }>(`/vacations/requests/${requestId}/receipt`);
    return response.documentUrl;
  },

  // ==================== Calendar ====================

  /**
   * Get team calendar
   */
  getTeamCalendar: async (
    year: number,
    month?: number,
    departmentId?: string
  ): Promise<VacationRequest[]> => {
    return api.get<unknown, VacationRequest[]>('/vacations/calendar/team', {
      params: { year, month, departmentId }
    });
  },

  /**
   * Get my calendar entries
   */
  getMyCalendar: async (year: number): Promise<TeamCalendarEntry[]> => {
    // Not implemented in backend yet, reusing team?
    return api.get<unknown, TeamCalendarEntry[]>('/vacations/calendar/my', {
      params: { year }
    });
  },

  // ==================== Simulation ====================

  /**
   * Simulate vacation values
   */
  simulate: async (data: VacationSimulationRequest): Promise<VacationSimulation> => {
    return api.post<VacationSimulationRequest, VacationSimulation>('/vacation/simulate', data);
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
    return api.get<unknown, {
      pendingRequests: number;
      expiringPeriods: number;
      employeesOnVacation: number;
      upcomingVacations: number;
    }>('/vacation/statistics');
  },
};

export default vacationApi;
