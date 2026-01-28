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

    // Hiring & Retention
    turnoverHistory: Record<string, number>;
    activeHistory: Record<string, number>;
    hiringHistory: Record<string, number>;
    terminationHistory: Record<string, number>;
    tenureDistribution: Record<string, number>;
}

export const dashboardApi = {
    getStats: () => api.get<DashboardStats, DashboardStats>('/dashboard/stats'),
};
