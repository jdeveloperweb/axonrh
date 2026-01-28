import { api } from './client';

export interface DashboardStats {
    totalEmployees: number;
    presentToday: number;
    vacationsThisMonth: number;
    pendingIssues: number;
    employeeChange: number;
    presenceChange: number;
    pendingChange: number;

    // Diversity
    femaleRepresentation: number;
    diversityIndex: number;
    averageAge: number;

    genderDistribution: Record<string, number>;
    raceDistribution: Record<string, number>;
    // Partial typing for now as we might not use all maps yet

}

export const dashboardApi = {
    getStats: () => api.get<DashboardStats, DashboardStats>('/dashboard/stats'),
};
