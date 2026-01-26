import { api } from './client';

// ==================== Types ====================

export type CycleStatus = 'DRAFT' | 'ACTIVE' | 'EVALUATION' | 'CALIBRATION' | 'COMPLETED' | 'CANCELLED';
export type CycleType = 'ANNUAL' | 'SEMI_ANNUAL' | 'QUARTERLY' | 'PROBATION' | 'PROJECT';
export type EvaluationType = 'SELF' | 'MANAGER' | 'PEER' | 'SUBORDINATE' | 'EXTERNAL';
export type EvaluationStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'CALIBRATED' | 'COMPLETED' | 'CANCELLED';
export type GoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_HOLD' | 'AT_RISK' | 'COMPLETED' | 'CANCELLED';
export type GoalType = 'INDIVIDUAL' | 'TEAM' | 'DEPARTMENT' | 'COMPANY';
export type PDIStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type PDIActionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type PDIActionType = 'TRAINING' | 'COURSE' | 'CERTIFICATION' | 'MENTORING' | 'COACHING' | 'PROJECT' | 'JOB_ROTATION' | 'SHADOWING' | 'READING' | 'WORKSHOP' | 'CONFERENCE' | 'FEEDBACK' | 'OTHER';

export interface EvaluationCycle {
  id: string;
  name: string;
  description?: string;
  cycleType: CycleType;
  status: CycleStatus;
  startDate: string;
  endDate: string;
  evaluationStartDate?: string;
  evaluationEndDate?: string;
  calibrationStartDate?: string;
  calibrationEndDate?: string;
  allowSelfEvaluation: boolean;
  allowPeerEvaluation: boolean;
  allow360Evaluation: boolean;
  createdAt: string;
}

export interface EvaluationAnswer {
  id?: string;
  questionId: string;
  questionText: string;
  sectionName: string;
  score?: number;
  textAnswer?: string;
  weight: number;
  comments?: string;
}

export interface Evaluation {
  id: string;
  cycleId: string;
  cycleName?: string;
  formId: string;
  employeeId: string;
  employeeName: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluationType: EvaluationType;
  status: EvaluationStatus;
  dueDate?: string;
  startedAt?: string;
  submittedAt?: string;
  calibratedAt?: string;
  finalScore?: number;
  calibratedScore?: number;
  performanceScore?: number;
  potentialScore?: number;
  calibrationNotes?: string;
  overallFeedback?: string;
  strengths?: string;
  areasForImprovement?: string;
  goalsForNextPeriod?: string;
  isAcknowledged: boolean;
  acknowledgedAt?: string;
  employeeComments?: string;
  answers: EvaluationAnswer[];
  createdAt: string;
}

export interface NineBoxPosition {
  position: string;
  label: string;
  description: string;
  performanceLevel: number;
  potentialLevel: number;
  color: string;
}

export interface NineBoxEmployee {
  employeeId: string;
  employeeName: string;
  departmentName?: string;
  positionTitle?: string;
  photoUrl?: string;
  performanceScore: number;
  potentialScore: number;
  performanceLevel: number;
  potentialLevel: number;
  position: NineBoxPosition;
  evaluationId?: string;
}

export interface NineBoxStatistics {
  totalEmployees: number;
  hiPoCount: number;
  atRiskCount: number;
  starCount: number;
  hiPoPercentage: number;
  atRiskPercentage: number;
}

export interface NineBoxMatrix {
  cycleId: string;
  cycleName: string;
  employees: NineBoxEmployee[];
  positionGroups: Record<string, NineBoxEmployee[]>;
  statistics: NineBoxStatistics;
}

export interface GoalUpdate {
  id: string;
  previousValue: number;
  newValue: number;
  progressPercentage: number;
  notes?: string;
  updatedBy: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  cycleId?: string;
  employeeId?: string;
  departmentId?: string;
  title: string;
  description?: string;
  goalType: GoalType;
  status: GoalStatus;
  weight?: number;
  targetValue?: number;
  currentValue: number;
  unitOfMeasure?: string;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  progressPercentage: number;
  isKeyResult: boolean;
  parentGoalId?: string;
  ownerId?: string;
  ownerName?: string;
  updates: GoalUpdate[];
  createdAt: string;
}

export interface PDIAction {
  id?: string;
  title: string;
  description?: string;
  actionType: PDIActionType;
  status: PDIActionStatus;
  dueDate?: string;
  completedAt?: string;
  competencyId?: string;
  competencyName?: string;
  resourceUrl?: string;
  resourceName?: string;
  estimatedHours?: number;
  actualHours?: number;
  mentorId?: string;
  mentorName?: string;
  notes?: string;
  completionNotes?: string;
  createdAt?: string;
}

export interface PDI {
  id: string;
  employeeId: string;
  employeeName: string;
  managerId?: string;
  managerName?: string;
  evaluationId?: string;
  title: string;
  description?: string;
  objectives?: string;
  status: PDIStatus;
  startDate?: string;
  endDate?: string;
  approvedAt?: string;
  approvedBy?: string;
  completedAt?: string;
  overallProgress: number;
  focusAreas?: string;
  expectedOutcomes?: string;
  notes?: string;
  actions: PDIAction[];
  createdAt: string;
}

export interface EvaluationStatistics {
  total: number;
  pending: number;
  inProgress: number;
  submitted: number;
  calibrated: number;
  completed: number;
  completionRate: number;
}

export interface GoalStatistics {
  total: number;
  completed: number;
  inProgress: number;
  atRisk: number;
  notStarted: number;
  averageProgress: number;
  completionRate: number;
}

export interface PDIStatistics {
  pendingApproval: number;
  active: number;
  completed: number;
  overdue: number;
  averageProgress: number;
}

// ==================== Cycles API ====================

export const cyclesApi = {
  create: (data: Partial<EvaluationCycle>) =>
    api.post<EvaluationCycle>('/performance/cycles', data),

  list: () =>
    api.get<EvaluationCycle[]>('/performance/cycles'),

  get: (id: string) =>
    api.get<EvaluationCycle>(`/performance/cycles/${id}`),

  getActive: () =>
    api.get<EvaluationCycle[]>('/performance/cycles/active'),

  activate: (id: string) =>
    api.post<EvaluationCycle>(`/performance/cycles/${id}/activate`),

  complete: (id: string) =>
    api.post<EvaluationCycle>(`/performance/cycles/${id}/complete`),

  getStatistics: (id: string) =>
    api.get<EvaluationStatistics>(`/performance/cycles/${id}/statistics`),

  getNineBox: (id: string) =>
    api.get<NineBoxMatrix>(`/performance/cycles/${id}/ninebox`),
};

// ==================== Evaluations API ====================

export const evaluationsApi = {
  create: (data: Partial<Evaluation>) =>
    api.post<Evaluation>('/performance/evaluations', data),

  get: (id: string): Promise<Evaluation> =>
    api.get<Evaluation>(`/performance/evaluations/${id}`) as unknown as Promise<Evaluation>,
  

  getPending: (evaluatorId: string) =>
    api.get<Evaluation[]>(`/performance/evaluations/pending?evaluatorId=${evaluatorId}`),

  getByEmployee: (employeeId: string) =>
    api.get<Evaluation[]>(`/performance/evaluations/employee/${employeeId}`),

  getByCycle: (cycleId: string, page = 0, size = 20) =>
    api.get<{ content: Evaluation[]; totalElements: number }>(`/performance/cycles/${cycleId}/evaluations?page=${page}&size=${size}`),

  start: (id: string) =>
    api.post<Evaluation>(`/performance/evaluations/${id}/start`),

  saveAnswers: (id: string, answers: EvaluationAnswer[]) =>
    api.put<Evaluation>(`/performance/evaluations/${id}/answers`, answers),

  submit: (id: string, data: { feedback: string; strengths: string; improvements: string }) =>
    api.post<Evaluation>(`/performance/evaluations/${id}/submit`, data),

  calibrate: (id: string, data: { newScore: number; notes: string }) =>
    api.post<Evaluation>(`/performance/evaluations/${id}/calibrate`, data),

  complete: (id: string) =>
    api.post<Evaluation>(`/performance/evaluations/${id}/complete`),

  acknowledge: (id: string, comments: string) =>
    api.post<Evaluation>(`/performance/evaluations/${id}/acknowledge`, { comments }),

  getOverdue: () =>
    api.get<Evaluation[]>('/performance/evaluations/overdue'),
};

// ==================== Goals API ====================

export const goalsApi = {
  create: (data: Partial<Goal>) =>
    api.post<Goal>('/goals', data),

  get: (id: string) =>
    api.get<Goal>(`/goals/${id}`),

  update: (id: string, data: Partial<Goal>) =>
    api.put<Goal>(`/goals/${id}`, data),

  delete: (id: string) =>
    api.delete(`/goals/${id}`),

  getByEmployee: (employeeId: string) =>
    api.get<Goal[]>(`/goals/employee/${employeeId}`),

  getByDepartment: (departmentId: string) =>
    api.get<Goal[]>(`/goals/department/${departmentId}`),

  getByCycle: (cycleId: string, page = 0, size = 20) =>
    api.get<{ content: Goal[]; totalElements: number }>(`/goals/cycle/${cycleId}?page=${page}&size=${size}`),

  getByStatus: (employeeId: string, status: GoalStatus) =>
    api.get<Goal[]>(`/goals/employee/${employeeId}/status/${status}`),

  getOverdue: () =>
    api.get<Goal[]>('/goals/overdue'),

  getAtRisk: () =>
    api.get<Goal[]>('/goals/at-risk'),

  getKeyResults: (goalId: string) =>
    api.get<Goal[]>(`/goals/${goalId}/key-results`),

  createKeyResult: (goalId: string, data: Partial<Goal>) =>
    api.post<Goal>(`/goals/${goalId}/key-results`, data),

  getCompanyOKRs: (cycleId: string) =>
    api.get<Goal[]>(`/goals/company-okrs/${cycleId}`),

  updateProgress: (id: string, data: { newValue: number; notes?: string; updatedBy: string }) =>
    api.post<Goal>(`/goals/${id}/progress`, data),

  complete: (id: string) =>
    api.post<Goal>(`/goals/${id}/complete`),

  cancel: (id: string) =>
    api.post<Goal>(`/goals/${id}/cancel`),

  markAtRisk: (id: string) =>
    api.post<Goal>(`/goals/${id}/at-risk`),

  getStatistics: (employeeId: string) =>
    api.get<GoalStatistics>(`/goals/employee/${employeeId}/statistics`),
};

// ==================== PDI API ====================

export const pdisApi = {
  create: (data: Partial<PDI>) =>
    api.post<PDI>('/pdis', data),

  get: (id: string) =>
    api.get<PDI>(`/pdis/${id}`),

  update: (id: string, data: Partial<PDI>) =>
    api.put<PDI>(`/pdis/${id}`, data),

  delete: (id: string) =>
    api.delete(`/pdis/${id}`),

  list: (page = 0, size = 20) =>
    api.get<{ content: PDI[]; totalElements: number }>(`/pdis?page=${page}&size=${size}`),

  getByEmployee: (employeeId: string) =>
    api.get<PDI[]>(`/pdis/employee/${employeeId}`),

  getActive: (employeeId: string) =>
    api.get<PDI[]>(`/pdis/employee/${employeeId}/active`),

  getByTeam: (managerId: string) =>
    api.get<PDI[]>(`/pdis/team/${managerId}`),

  getPendingApproval: (managerId: string) =>
    api.get<PDI[]>(`/pdis/pending-approval/${managerId}`),

  getOverdue: () =>
    api.get<PDI[]>('/pdis/overdue'),

  submitForApproval: (id: string) =>
    api.post<PDI>(`/pdis/${id}/submit`),

  approve: (id: string, approverId: string) =>
    api.post<PDI>(`/pdis/${id}/approve?approverId=${approverId}`),

  activate: (id: string) =>
    api.post<PDI>(`/pdis/${id}/activate`),

  complete: (id: string) =>
    api.post<PDI>(`/pdis/${id}/complete`),

  cancel: (id: string) =>
    api.post<PDI>(`/pdis/${id}/cancel`),

  addAction: (id: string, action: Partial<PDIAction>) =>
    api.post<PDI>(`/pdis/${id}/actions`, action),

  removeAction: (pdiId: string, actionId: string) =>
    api.delete<PDI>(`/pdis/${pdiId}/actions/${actionId}`),

  startAction: (pdiId: string, actionId: string) =>
    api.post<PDI>(`/pdis/${pdiId}/actions/${actionId}/start`),

  completeAction: (pdiId: string, actionId: string, data: { notes?: string; hoursSpent?: number }) =>
    api.post<PDI>(`/pdis/${pdiId}/actions/${actionId}/complete`, data),

  createFromEvaluation: (data: {
    evaluationId: string;
    employeeId: string;
    employeeName: string;
    managerId: string;
    managerName: string;
    focusAreas?: string;
  }) =>
    api.post<PDI>('/pdis/from-evaluation', data),

  getManagerStatistics: (managerId: string) =>
    api.get<PDIStatistics>(`/pdis/manager/${managerId}/statistics`),
};
