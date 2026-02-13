export type BenefitCategory = 'EARNING' | 'DEDUCTION';
export type CalculationType = 'FIXED_VALUE' | 'SALARY_PERCENTAGE';
export type EmployeeBenefitStatus = 'ACTIVE' | 'INACTIVE' | 'SCHEDULED' | 'CANCELLED';

export interface BenefitType {
    id: string;
    name: string;
    description?: string;
    category: BenefitCategory;
    calculationType: CalculationType;
    defaultValue?: number;
    defaultPercentage?: number;
    isActive: boolean;
    payrollCode?: string;
    payrollNature?: string;
    incidenceInss?: boolean;
    incidenceFgts?: boolean;
    incidenceIrrf?: boolean;
    externalProvider?: string;
    integrationConfig?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface BenefitTypeRequest {
    name: string;
    description?: string;
    category: BenefitCategory;
    calculationType: CalculationType;
    defaultValue?: number;
    defaultPercentage?: number;
    payrollCode?: string;
    payrollNature?: string;
    incidenceInss?: boolean;
    incidenceFgts?: boolean;
    incidenceIrrf?: boolean;
    externalProvider?: string;
    integrationConfig?: string;
}

export interface EmployeeBenefit {
    id: string;
    employeeId: string;
    employeeName: string;
    benefitTypeId: string;
    benefitTypeName: string;
    benefitCategory: BenefitCategory;
    calculationType: CalculationType;
    fixedValue?: number;
    percentage?: number;
    startDate: string;
    endDate?: string;
    status: EmployeeBenefitStatus;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface EmployeeBenefitRequest {
    employeeId: string;
    employeeName: string;
    benefitTypeId: string;
    fixedValue?: number;
    percentage?: number;
    startDate: string;
    endDate?: string;
    notes?: string;
}

export interface BenefitHistory {
    id: string;
    employeeBenefitId: string;
    changeDate: string;
    changeType: string;
    oldValue?: string;
    newValue?: string;
    changedBy: string;
    notes?: string;
}
