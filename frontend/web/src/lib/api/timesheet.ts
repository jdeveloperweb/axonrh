import { api } from './client';

// ==================== Types ====================

export interface TimeRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  recordDate: string;
  recordTime: string;
  recordDatetime: string;
  recordType: 'ENTRY' | 'EXIT' | 'BREAK_START' | 'BREAK_END';
  recordTypeLabel: string;
  source: 'WEB' | 'MOBILE' | 'REP' | 'BIOMETRIC' | 'FACIAL' | 'MANUAL' | 'IMPORT';
  sourceLabel: string;
  status: 'VALID' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ADJUSTED';
  statusLabel: string;
  latitude?: number;
  longitude?: number;
  geofenceId?: string;
  geofenceName?: string;
  withinGeofence?: boolean;
  photoUrl?: string;
  facialMatchConfidence?: number;
  deviceInfo?: string;
  notes?: string;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface DailySummary {
  id: string;
  employeeId: string;
  summaryDate: string;
  dayOfWeek: string;
  workScheduleId?: string;
  firstEntry?: string;
  lastExit?: string;
  breakStart?: string;
  breakEnd?: string;
  scheduledEntry?: string;
  scheduledExit?: string;
  scheduledBreakStart?: string;
  scheduledBreakEnd?: string;
  expectedWorkMinutes: number;
  expectedWorkFormatted: string;
  workedMinutes: number;
  workedFormatted: string;
  breakMinutes: number;
  breakFormatted: string;
  overtimeMinutes: number;
  overtimeFormatted: string;
  deficitMinutes: number;
  deficitFormatted: string;
  nightShiftMinutes: number;
  nightShiftFormatted: string;
  lateArrivalMinutes: number;
  lateArrivalFormatted: string;
  earlyDepartureMinutes: number;
  earlyDepartureFormatted: string;
  isAbsent: boolean;
  absenceType?: string;
  hasPendingRecords: boolean;
  hasMissingRecords: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isClosed: boolean;
  notes?: string;
  balanceMinutes: number;
  balanceFormatted: string;
  isPositive: boolean;
}

export interface TimeAdjustment {
  id: string;
  employeeId: string;
  employeeName: string;
  adjustmentType: 'ADD' | 'MODIFY' | 'DELETE';
  adjustmentTypeLabel: string;
  originalRecordId?: string;
  recordDate: string;
  recordType: 'ENTRY' | 'EXIT' | 'BREAK_START' | 'BREAK_END';
  recordTypeLabel: string;
  originalTime?: string;
  requestedTime: string;
  justification: string;
  attachmentUrls: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  statusLabel: string;
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  approvalNotes?: string;
  createdAt: string;
}

export interface WorkSchedule {
  id: string;
  name: string;
  description?: string;
  scheduleType: 'FIXED' | 'FLEXIBLE' | 'SHIFT' | 'PART_TIME' | 'INTERMITTENT';
  scheduleTypeLabel: string;
  workRegime?: 'PRESENCIAL' | 'REMOTO' | 'HIBRIDO';
  workRegimeLabel?: string;
  weeklyHoursMinutes: number;
  weeklyHoursFormatted: string;
  toleranceMinutes: number;
  minBreakMinutes: number;
  maxDailyOvertimeMinutes: number;
  overtimeBankEnabled: boolean;
  overtimeBankExpirationMonths: number;
  nightShiftStart?: string;
  nightShiftEnd?: string;
  nightShiftAdditionalPercent: number;
  unionAgreementName?: string;
  active: boolean;
  days: ScheduleDay[];
}

export interface ScheduleDay {
  dayOfWeek: string;
  dayOfWeekLabel: string;
  isWorkDay: boolean;
  entryTime?: string;
  exitTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  expectedWorkMinutes?: number;
}

export interface Geofence {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  address?: string;
  city?: string;
  state?: string;
  locationType: string;
  locationTypeLabel: string;
  requireWifi: boolean;
  wifiSsid?: string;
  active: boolean;
}

export interface OvertimeBankMovement {
  id: string;
  employeeId: string;
  type: 'CREDIT' | 'DEBIT' | 'ADJUSTMENT' | 'EXPIRATION' | 'PAYOUT';
  typeLabel: string;
  referenceDate: string;
  minutes: number;
  minutesFormatted: string;
  balanceAfter: number;
  balanceAfterFormatted: string;
  expirationDate?: string;
  description?: string;
  multiplier?: number;
  originalMinutes?: number;
  approvedBy?: string;
  createdAt: string;
}

export interface OvertimeBankSummary {
  employeeId: string;
  employeeName?: string;
  currentBalanceMinutes: number;
  currentBalanceFormatted: string;
  isPositive: boolean;
  totalCreditMinutes: number;
  totalCreditFormatted: string;
  totalDebitMinutes: number;
  totalDebitFormatted: string;
  totalExpiredMinutes: number;
  totalExpiredFormatted: string;
  expiringMinutes: number;
  expiringFormatted: string;
  daysUntilNextExpiration?: number;
  recentMovements: OvertimeBankMovement[];
}

export interface PeriodTotals {
  workedMinutes: number;
  workedFormatted: string;
  overtimeMinutes: number;
  overtimeFormatted: string;
  deficitMinutes: number;
  deficitFormatted: string;
  nightShiftMinutes: number;
  nightShiftFormatted: string;
  lateArrivalMinutes: number;
  lateArrivalFormatted: string;
  absences: number;
}

// ==================== Request Types ====================

export interface TimeRecordRequest {
  employeeId: string;
  recordType: 'ENTRY' | 'EXIT' | 'BREAK_START' | 'BREAK_END';
  source: 'WEB' | 'MOBILE' | 'REP' | 'BIOMETRIC' | 'FACIAL' | 'MANUAL' | 'IMPORT';
  latitude?: number;
  longitude?: number;
  photoBase64?: string;
  deviceInfo?: string;
  notes?: string;
}

export interface TimeAdjustmentRequest {
  adjustmentType: 'ADD' | 'MODIFY' | 'DELETE';
  originalRecordId?: string;
  recordDate: string;
  recordType: 'ENTRY' | 'EXIT' | 'BREAK_START' | 'BREAK_END';
  requestedTime: string;
  justification: string;
  attachmentUrls?: string[];
}

export interface WorkScheduleRequest {
  name: string;
  description?: string;
  scheduleType: string;
  workRegime?: string;
  weeklyHoursMinutes: number;
  toleranceMinutes?: number;
  minBreakMinutes?: number;
  maxDailyOvertimeMinutes?: number;
  overtimeBankEnabled?: boolean;
  overtimeBankExpirationMonths?: number;
  nightShiftStart?: string;
  nightShiftEnd?: string;
  nightShiftAdditionalPercent?: number;
  unionAgreementId?: string;
  days: ScheduleDayRequest[];
}

export interface ScheduleDayRequest {
  dayOfWeek: string;
  isWorkDay: boolean;
  entryTime?: string;
  exitTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
}

export interface GeofenceRequest {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  address?: string;
  city?: string;
  state?: string;
  locationType?: string;
  departmentIds?: string[];
  employeeIds?: string[];
  requireWifi?: boolean;
  wifiSsid?: string;
  wifiBssid?: string;
}

// ==================== API Client ====================

export const timesheetApi = {
  // ==================== Time Records ====================

  /**
   * Register a time punch
   */
  registerTimeRecord: async (data: TimeRecordRequest): Promise<TimeRecord> => {
    return api.post<TimeRecordRequest, TimeRecord>('/timesheet/records', data);
  },

  /**
   * Get today's records for current employee
   */
  getTodayRecords: async (): Promise<TimeRecord[]> => {
    return api.get<TimeRecord[], TimeRecord[]>('/timesheet/records/today');
  },

  /**
   * Get records for a specific date
   */
  getRecordsByDate: async (employeeId: string, date: string): Promise<TimeRecord[]> => {
    return api.get<TimeRecord[], TimeRecord[]>(`/timesheet/records/employee/${employeeId}`, {
      params: { date }
    });
  },

  /**
   * Get pending records for approval
   */
  getPendingRecords: async (page = 0, size = 20): Promise<{ content: TimeRecord[]; totalElements: number }> => {
    return api.get<unknown, { content: TimeRecord[]; totalElements: number }>('/timesheet/records/pending', {
      params: { page, size }
    });
  },

  /**
   * Approve a pending record
   */
  approveRecord: async (recordId: string, notes?: string): Promise<TimeRecord> => {
    return api.post<unknown, TimeRecord>(`/timesheet/records/${recordId}/approve`, null, {
      params: { notes }
    });
  },

  /**
   * Reject a pending record
   */
  rejectRecord: async (recordId: string, reason: string): Promise<TimeRecord> => {
    return api.post<unknown, TimeRecord>(`/timesheet/records/${recordId}/reject`, null, {
      params: { reason }
    });
  },

  // ==================== Timesheet / Daily Summary ====================

  /**
   * Get timesheet for a period
   */
  getTimesheet: async (
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<DailySummary[]> => {
    return api.get<DailySummary[], DailySummary[]>(`/timesheet/timesheet/employee/${employeeId}`, {
      params: { startDate, endDate }
    });
  },

  /**
   * Get period totals
   */
  getPeriodTotals: async (
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<PeriodTotals> => {
    return api.get<PeriodTotals, PeriodTotals>(`/timesheet/timesheet/employee/${employeeId}/totals`, {
      params: { startDate, endDate }
    });
  },

  /**
   * Close a period (for payroll)
   */
  closePeriod: async (
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<void> => {
    await api.post(`/timesheet/timesheet/employee/${employeeId}/close`, null, {
      params: { startDate, endDate }
    });
  },

  /**
   * Export timesheet (PDF/Excel)
   */
  exportTimesheet: async (
    employeeId: string,
    startDate: string,
    endDate: string,
    format: 'pdf' | 'excel'
  ): Promise<Blob> => {
    return api.get(`/timesheet/timesheet/employee/${employeeId}/export`, {
      params: { startDate, endDate, format },
      responseType: 'blob',
      headers: {
        Accept: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
  },

  /**
   * Export mass timesheet (PDF/Excel)
   */
  exportMassTimesheet: async (
    startDate: string,
    endDate: string,
    format: 'pdf' | 'excel'
  ): Promise<Blob> => {
    return api.get('/timesheet/timesheet/export/mass', {
      params: { startDate, endDate, format },
      responseType: 'blob',
      headers: {
        Accept: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
  },

  // ==================== Adjustments ====================

  /**
   * Create adjustment request
   */
  createAdjustment: async (data: TimeAdjustmentRequest): Promise<TimeAdjustment> => {
    return api.post<TimeAdjustmentRequest, TimeAdjustment>('/timesheet/adjustments', data);
  },

  /**
   * Get pending adjustments
   */
  getPendingAdjustments: async (
    page = 0,
    size = 20
  ): Promise<{ content: TimeAdjustment[]; totalElements: number }> => {
    return api.get<unknown, { content: TimeAdjustment[]; totalElements: number }>('/timesheet/adjustments/pending', {
      params: { page, size }
    });
  },

  /**
   * Get my adjustments
   */
  getMyAdjustments: async (
    page = 0,
    size = 20
  ): Promise<{ content: TimeAdjustment[]; totalElements: number }> => {
    return api.get<unknown, { content: TimeAdjustment[]; totalElements: number }>('/timesheet/adjustments/my', {
      params: { page, size }
    });
  },

  /**
   * Approve adjustment
   */
  approveAdjustment: async (adjustmentId: string, notes?: string): Promise<TimeAdjustment> => {
    return api.post<unknown, TimeAdjustment>(`/timesheet/adjustments/${adjustmentId}/approve`, null, {
      params: { notes }
    });
  },

  /**
   * Reject adjustment
   */
  rejectAdjustment: async (adjustmentId: string, reason: string): Promise<TimeAdjustment> => {
    return api.post<unknown, TimeAdjustment>(`/timesheet/adjustments/${adjustmentId}/reject`, null, {
      params: { reason }
    });
  },

  /**
   * Cancel my adjustment
   */
  cancelAdjustment: async (adjustmentId: string): Promise<TimeAdjustment> => {
    return api.post<unknown, TimeAdjustment>(`/timesheet/adjustments/${adjustmentId}/cancel`);
  },

  // ==================== Work Schedules ====================

  /**
   * List work schedules
   */
  listSchedules: async (): Promise<WorkSchedule[]> => {
    return api.get<WorkSchedule[], WorkSchedule[]>('/timesheet/schedules');
  },

  /**
   * Get schedule by ID
   */
  getSchedule: async (scheduleId: string): Promise<WorkSchedule> => {
    return api.get<unknown, WorkSchedule>(`/timesheet/schedules/${scheduleId}`);
  },

  /**
   * Create work schedule
   */
  createSchedule: async (data: WorkScheduleRequest): Promise<WorkSchedule> => {
    return api.post<WorkScheduleRequest, WorkSchedule>('/timesheet/schedules', data);
  },

  /**
   * Update work schedule
   */
  updateSchedule: async (scheduleId: string, data: WorkScheduleRequest): Promise<WorkSchedule> => {
    return api.put<WorkScheduleRequest, WorkSchedule>(`/timesheet/schedules/${scheduleId}`, data);
  },

  /**
   * Delete work schedule
   */
  deleteSchedule: async (scheduleId: string): Promise<void> => {
    await api.delete(`/timesheet/schedules/${scheduleId}`);
  },

  /**
   * Assign schedule to employee
   */
  assignSchedule: async (
    employeeId: string,
    scheduleId: string,
    validFrom: string,
    validUntil?: string
  ): Promise<void> => {
    await api.post(`/timesheet/schedules/${scheduleId}/assign`, null, {
      params: { employeeId, validFrom, validUntil }
    });
  },

  // ==================== Geofences ====================

  /**
   * List geofences
   */
  listGeofences: async (): Promise<Geofence[]> => {
    return api.get<Geofence[], Geofence[]>('/timesheet/geofences');
  },

  /**
   * Get my allowed geofences
   */
  getMyAllowedGeofences: async (): Promise<Geofence[]> => {
    return api.get<Geofence[], Geofence[]>('/timesheet/geofences/my-allowed');
  },

  /**
   * Create geofence
   */
  createGeofence: async (data: GeofenceRequest): Promise<Geofence> => {
    return api.post<GeofenceRequest, Geofence>('/timesheet/geofences', data);
  },

  /**
   * Update geofence
   */
  updateGeofence: async (geofenceId: string, data: GeofenceRequest): Promise<Geofence> => {
    return api.put<GeofenceRequest, Geofence>(`/timesheet/geofences/${geofenceId}`, data);
  },

  /**
   * Delete geofence
   */
  deleteGeofence: async (geofenceId: string): Promise<void> => {
    await api.delete(`/timesheet/geofences/${geofenceId}`);
  },

  // ==================== Overtime Bank ====================

  /**
   * Get current balance
   */
  getOvertimeBalance: async (employeeId: string): Promise<{ balanceMinutes: number; balanceFormatted: string; isPositive: boolean }> => {
    return api.get<unknown, { balanceMinutes: number; balanceFormatted: string; isPositive: boolean }>(`/timesheet/overtime-bank/employee/${employeeId}/balance`);
  },

  /**
   * Get overtime bank summary
   */
  getOvertimeSummary: async (
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<OvertimeBankSummary> => {
    return api.get<unknown, OvertimeBankSummary>(`/timesheet/overtime-bank/employee/${employeeId}/summary`, {
      params: { startDate, endDate }
    });
  },

  /**
   * Get overtime bank movements
   */
  getOvertimeMovements: async (
    employeeId: string,
    page = 0,
    size = 20
  ): Promise<{ content: OvertimeBankMovement[]; totalElements: number }> => {
    return api.get<unknown, { content: OvertimeBankMovement[]; totalElements: number }>(`/timesheet/overtime-bank/employee/${employeeId}/movements`, {
      params: { page, size }
    });
  },

  /**
   * Add debit (compensation)
   */
  addOvertimeDebit: async (
    employeeId: string,
    date: string,
    minutes: number,
    description?: string
  ): Promise<OvertimeBankMovement> => {
    return api.post<unknown, OvertimeBankMovement>(`/timesheet/overtime-bank/employee/${employeeId}/debit`, null, {
      params: { date, minutes, description }
    });
  },

  // ==================== Holidays ====================

  /**
   * List all holidays
   */
  listHolidays: async (): Promise<any[]> => {
    return api.get<any[], any[]>('/timesheet/holidays');
  },

  /**
   * Import holidays automatically
   */
  importHolidays: async (year?: number): Promise<number> => {
    return api.post<unknown, number>('/timesheet/holidays/import', null, {
      params: { year }
    });
  },

  /**
   * Delete a holiday
   */
  deleteHoliday: async (id: string): Promise<void> => {
    await api.delete(`/timesheet/holidays/${id}`);
  },

  // ==================== Statistics ====================

  /**
   * Get timesheet statistics for dashboard
   */
  getStatistics: async (): Promise<{
    pendingRecords: number;
    pendingAdjustments: number;
    employeesWithIssues: number;
    todayRecords: number;
  }> => {
    return api.get<unknown, {
      pendingRecords: number;
      pendingAdjustments: number;
      employeesWithIssues: number;
      todayRecords: number;
    }>('/timesheet/statistics');
  },
};

export default timesheetApi;
