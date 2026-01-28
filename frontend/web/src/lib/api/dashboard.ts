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

export interface LearningStats {
    totalActiveEnrollments: number;
    completionsThisMonth: number;
    averageProgress: number;
    totalTrainingHours: number;
    statusDistribution: Record<string, number>;
    monthlyActivity: Array<{
        month: string;
        completions: number;
        enrollments: number;
    }>;
}

export const dashboardApi = {
    getStats: () => api.get<DashboardStats, DashboardStats>('/dashboard/stats'),
    getLearningStats: () => api.get<LearningStats, LearningStats>('/learning/dashboard/stats'),
};
