import { api } from './client';
import {
    admissionsApi,
    AdmissionProcess,
    AdmissionDocument,
    AdmissionStatus,
    AdmissionCreateRequest,
    AdmissionListParams,
    AdmissionListResponse,
    DocumentRequirement,
    RequiredDocumentsResponse
} from './admissions';

export type {
    AdmissionProcess,
    AdmissionDocument,
    AdmissionStatus,
    AdmissionCreateRequest,
    AdmissionListParams,
    AdmissionListResponse,
    DocumentRequirement,
    RequiredDocumentsResponse
};

// Types for Termination Process
export type TerminationType =
    | 'RESIGNATION'
    | 'TERMINATION_WITHOUT_CAUSE'
    | 'TERMINATION_WITH_CAUSE'
    | 'AGREEMENT'
    | 'RETIREMENT'
    | 'DEATH'
    | 'END_OF_CONTRACT';

export type NoticePeriod = 'WORKED' | 'PAID' | 'WAIVED';

export interface TerminationProcess {
    id: string;
    employeeId: string;
    employeeName: string;
    terminationType: TerminationType;
    noticePeriod: NoticePeriod;
    lastWorkDay: string;
    terminationDate: string;
    reason?: string;
    departmentName?: string;
    positionTitle?: string;
    photoUrl?: string;

    // Equipment checklist
    returnedLaptop: boolean;
    returnedMouse: boolean;
    returnedKeyboard: boolean;
    returnedHeadset: boolean;
    returnedBadge: boolean;
    returnedToken: boolean;
    otherEquipment?: string;
    equipmentNotes?: string;

    // Process checklist
    accountDeactivated: boolean;
    emailDeactivated: boolean;
    exitInterviewDone: boolean;
    esocialSent: boolean;

    createdAt: string;
    completedAt?: string;

    // Novos campos
    status?: string;
    dismissalExamDone: boolean;
    dismissalExamDate?: string;
    severancePayAmount?: number;
    severancePayDate?: string;
    severancePayMethod?: string;
    financialNotes?: string;
    generalNotes?: string;
}

export interface TerminationRequest {
    employeeId: string;
    terminationType: TerminationType;
    noticePeriod: NoticePeriod;
    lastWorkDay: string;
    terminationDate: string;
    reason?: string;

    returnedLaptop?: boolean;
    returnedMouse?: boolean;
    returnedKeyboard?: boolean;
    returnedHeadset?: boolean;
    returnedBadge?: boolean;
    returnedToken?: boolean;
    otherEquipment?: string;
    equipmentNotes?: string;

    accountDeactivated?: boolean;
    emailDeactivated?: boolean;
    exitInterviewDone?: boolean;

    // Novos campos
    status?: string;
    dismissalExamDone?: boolean;
    dismissalExamDate?: string;
    severancePayAmount?: number;
    severancePayDate?: string;
    severancePayMethod?: string;
    financialNotes?: string;
    generalNotes?: string;
}

export const processesApi = {
    admissions: admissionsApi,
    terminations: {
        list: async (): Promise<TerminationProcess[]> => {
            return api.get<unknown, TerminationProcess[]>('/terminations');
        },
        getByEmployeeId: async (employeeId: string): Promise<TerminationProcess> => {
            return api.get<unknown, TerminationProcess>(`/terminations/employee/${employeeId}`);
        },
        initiate: async (data: TerminationRequest): Promise<TerminationProcess> => {
            return api.post<TerminationRequest, TerminationProcess>('/terminations', data);
        },
        complete: async (id: string): Promise<TerminationProcess> => {
            return api.post<unknown, TerminationProcess>(`/terminations/${id}/complete`, {});
        },
        reopen: async (id: string): Promise<TerminationProcess> => {
            return api.post<unknown, TerminationProcess>(`/terminations/${id}/reopen`, {});
        }
    }
};

// Aliases for compatibility
export { admissionsApi };
