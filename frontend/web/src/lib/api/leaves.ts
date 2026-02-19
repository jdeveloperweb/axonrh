import { api } from './client';

export interface LeaveDashboardStats {
    totalEmployees: number;
    employeesOnLeave: number;
    maleEmployees: number;
    femaleEmployees: number;
    averageAge: number;
    maleAverageAge: number;
    femaleAverageAge: number;
    medicalLeavesCount: number;
    maleMedicalLeavesCount: number;
    femaleMedicalLeavesCount: number;
    medicalLeavePercentage: number;
    generations: Array<{ name: string; count: number }>;
    genderDistribution: Array<{ gender: string; count: number; percentage: number }>;
    reasonDistribution: Array<{ reason: string; count: number; percentage: number; employeesCount: number; currentOnLeave: number }>;
    cidDistribution: Array<{ chapter: string; cid: string; description: string; count: number; year: number }>;
    monthlyTrend?: Array<{ mouth: string; year: number; count: number }>;
}

export interface LeaveRequest {
    id: string;
    employeeId: string;
    employeeName: string;
    type: string;
    startDate: string;
    endDate: string;
    daysCount: number;
    cid?: string;
    cidDescription?: string;
    status: string;
    reason?: string;
}

export const leavesApi = {
    getDashboardStats: () => api.get<LeaveDashboardStats, LeaveDashboardStats>('/leaves/dashboard'),
    getLeaves: () => api.get<LeaveRequest[], LeaveRequest[]>('/leaves'),
    createLeave: (data: any) => api.post<LeaveRequest, LeaveRequest>('/leaves', data),
    updateStatus: (id: string, status: string, notes?: string) =>
        api.patch(`/leaves/${id}/status`, { status, notes }),
};
