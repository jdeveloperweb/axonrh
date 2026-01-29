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
}

export const processesApi = {
    admissions: admissionsApi,
    terminations: {
        getByEmployeeId: async (employeeId: string): Promise<TerminationProcess> => {
            return api.get<any, TerminationProcess>(`/terminations/employee/${employeeId}`);
        },
        initiate: async (data: TerminationRequest): Promise<TerminationProcess> => {
            return api.post<TerminationRequest, TerminationProcess>('/terminations', data);
        },
        complete: async (id: string): Promise<TerminationProcess> => {
            return api.post<any, TerminationProcess>(`/terminations/${id}/complete`, {});
        }
    }
};

// Aliases for compatibility
export { admissionsApi };
