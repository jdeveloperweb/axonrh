import { api } from './client';

export interface DashboardStats {
    totalEmployees: number;
    presentToday: number;
    vacationsThisMonth: number;
    pendingIssues: number;
    employeeChange: number;
    presenceChange: number;
    pendingChange: number;
}

export const dashboardApi = {
    getStats: () => api.get<DashboardStats, DashboardStats>('/dashboard/stats'),
};
