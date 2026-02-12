import { api, Page } from './client';

// ==================== Types ====================

export type PayrollStatus = 'DRAFT' | 'CALCULATED' | 'RECALCULATED' | 'CLOSED' | 'CANCELLED';
export type PayrollItemType = 'EARNING' | 'DEDUCTION';
export type PayrollItemCode = 'BASE_SALARY' | 'INSS' | 'IRRF' | 'FGTS' | 'OVERTIME_50' | 'OVERTIME_100' | 'NIGHT_SHIFT' | 'BONUS' | 'VACATION' | 'ABSENCE' | 'HEALTH_INSURANCE' | 'TRANSPORTATION_VOUCHER' | 'MEAL_VOUCHER';
export type PayrollRunStatus = 'OPEN' | 'PROCESSING' | 'PROCESSED' | 'CLOSED';

export interface PayrollItem {
    id: string;
    code: PayrollItemCode;
    name: string;
    type: PayrollItemType;
    baseValue: number;
    referenceValue?: number;
    multiplier?: number;
    calculatedValue: number;
}

export interface Payroll {
    id: string;
    employeeId: string;
    employeeName: string;
    month: number;
    year: number;
    competencyDate: string;
    status: PayrollStatus;
    statusLabel: string;
    totalEarnings: number;
    totalDeductions: number;
    netValue: number;
    fgtsValue: number;
    calculationVersion: number;
    calculatedAt: string;
    items: PayrollItem[];
}

export interface PayrollRun {
    id: string;
    referenceMonth: number;
    referenceYear: number;
    status: PayrollRunStatus;
    statusLabel: string;
    totalEmployees: number;
    processedEmployees: number;
    totalGrossValue: number;
    totalNetValue: number;
    startedAt: string;
    finishedAt?: string;
    createdBy: string;
}

export interface TaxBracket {
    id: string;
    taxType: 'INSS' | 'IRRF';
    description: string;
    minValue: number;
    maxValue?: number;
    rate: number;
    deductionAmount: number;
    effectiveFrom: string;
    effectiveUntil?: string;
    isActive: boolean;
}

export interface PayslipResponse {
    payrollId: string;
    employeeName: string;
    employeeRole: string;
    employeeDepartment: string;
    registrationNumber: string;
    month: number;
    year: number;
    items: PayrollItem[];
    totalEarnings: number;
    totalDeductions: number;
    netValue: number;
    baseSalary: number;
    inssBase: number;
    irrfBase: number;
    fgtsBase: number;
    fgtsMonth: number;
}

// ==================== Request Types ====================

export interface PayrollRequest {
    employeeId: string;
    month: number;
    year: number;
}

export interface PayrollBatchRequest {
    month: number;
    year: number;
    strategy: 'ALL' | 'DEPARTMENT' | 'SPECIFIC';
    departmentIds?: string[];
    employeeIds?: string[];
    description?: string;
}

// ==================== API Client ====================

export const payrollApi = {
    /**
     * Process individual payroll
     */
    processIndividual: async (data: PayrollRequest): Promise<Payroll> => {
        return api.post<PayrollRequest, Payroll>('/payroll/process', data);
    },

    /**
     * Process batch payroll
     */
    processBatch: async (data: PayrollBatchRequest): Promise<PayrollRun> => {
        return api.post<any, PayrollRun>('/payroll/process/batch', {
            referenceMonth: data.month,
            referenceYear: data.year,
            employeeIds: data.employeeIds,
            departmentIds: data.departmentIds,
            description: data.description
        });
    },

    /**
     * Get payroll by ID
     */
    getPayroll: async (id: string): Promise<Payroll> => {
        return api.get<unknown, Payroll>(`/payroll/${id}`);
    },

    /**
     * Get payslip (demonstrativo)
     */
    getPayslip: async (id: string): Promise<PayslipResponse> => {
        return api.get<unknown, PayslipResponse>(`/payroll/${id}/payslip`);
    },

    /**
     * List payrolls by competency
     */
    getCompetencyPayrolls: async (month: number, year: number): Promise<Payroll[]> => {
        const response = await api.get<Page<Payroll>, Page<Payroll>>('/payroll/competency', {
            params: { month, year }
        });
        return response.content;
    },

    /**
     * Get employee payroll history
     */
    getEmployeeHistory: async (employeeId: string): Promise<Payroll[]> => {
        return api.get<Payroll[], Payroll[]>(`/payroll/employees/${employeeId}/history`);
    },

    /**
     * Close competency
     */
    closeCompetency: async (month: number, year: number): Promise<void> => {
        await api.post('/payroll/close', null, {
            params: { month, year }
        });
    },

    /**
     * List payroll runs
     */
    getRuns: async (): Promise<PayrollRun[]> => {
        const response = await api.get<Page<PayrollRun>, Page<PayrollRun>>('/payroll/runs');
        return response.content;
    },

    // ==================== Tax Brackets ====================

    listTaxBrackets: async (): Promise<TaxBracket[]> => {
        return api.get<TaxBracket[], TaxBracket[]>('/payroll/tax-brackets');
    },

    createTaxBracket: async (data: Partial<TaxBracket>): Promise<TaxBracket> => {
        return api.post<Partial<TaxBracket>, TaxBracket>('/payroll/tax-brackets', data);
    },

    updateTaxBracket: async (id: string, data: Partial<TaxBracket>): Promise<TaxBracket> => {
        return api.put<Partial<TaxBracket>, TaxBracket>(`/payroll/tax-brackets/${id}`, data);
    },

    deleteTaxBracket: async (id: string): Promise<void> => {
        await api.delete(`/payroll/tax-brackets/${id}`);
    },
};

export default payrollApi;
