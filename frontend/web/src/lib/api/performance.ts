import { api } from './client';

// ==================== Types ====================

export type CycleStatus = 'DRAFT' | 'ACTIVE' | 'EVALUATION' | 'CALIBRATION' | 'COMPLETED' | 'CANCELLED';
export type CycleType = 'ANNUAL' | 'SEMI_ANNUAL' | 'QUARTERLY' | 'PROBATION' | 'PROJECT';
export type EvaluationType = 'SELF' | 'MANAGER' | 'PEERS_180' | 'FULL_360';
export type EvaluatorType = 'SELF' | 'MANAGER' | 'PEER' | 'SUBORDINATE';
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
  selfEvaluationStart?: string;
  selfEvaluationEnd?: string;
  managerEvaluationStart?: string;
  managerEvaluationEnd?: string;
  calibrationStartDate?: string;
  calibrationEndDate?: string;
  evaluationType: EvaluationType;
  includeSelfEvaluation: boolean;
  includeManagerEvaluation: boolean;
  includePeerEvaluation: boolean;
  includeSubordinateEvaluation: boolean;
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
  evaluatorType: EvaluatorType;
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
  progress?: number;
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

export type DiscAssessmentStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
export type DiscProfileType = 'DOMINANCE' | 'INFLUENCE' | 'STEADINESS' | 'CONSCIENTIOUSNESS';

export interface DiscEvaluation {
  id: string;
  employeeId: string;
  employeeName?: string;
  dScore: number;
  iScore: number;
  sScore: number;
  cScore: number;
  primaryProfile: DiscProfileType;
  secondaryProfile?: DiscProfileType;
  profileDescription?: string;
  status: DiscAssessmentStatus;
  dueDate?: string;
  completedAt: string;
  createdAt?: string;
}

export interface DiscQuestion {
  id: string;
  text: string;
  order: number;
  options: {
    id: string;
    text: string;
    value: 'D' | 'I' | 'S' | 'C';
  }[];
}

export interface DiscAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  assignedBy: string;
  assignedByName: string;
  dueDate?: string;
  status: DiscAssessmentStatus;
  evaluationId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface DiscStatistics {
  totalEvaluations: number;
  completedEvaluations: number;
  pendingEvaluations: number;
  overdueEvaluations: number;
  dominanceCount: number;
  influenceCount: number;
  steadinessCount: number;
  conscientiousnessCount: number;
}

// ==================== Cycles API ====================

export const cyclesApi = {
  create: (data: Partial<EvaluationCycle>) =>
    api.post<EvaluationCycle>('/performance/cycles', data),

  list: () =>
    api.get<EvaluationCycle[], EvaluationCycle[]>('/performance/cycles'),

  get: (id: string) =>
    api.get<EvaluationCycle, EvaluationCycle>(`/performance/cycles/${id}`),

  update: (id: string, data: Partial<EvaluationCycle>) =>
    api.put<EvaluationCycle, EvaluationCycle>(`/performance/cycles/${id}`, data),

  delete: (id: string) =>
    api.delete(`/performance/cycles/${id}`),

  getActive: () =>
    api.get<EvaluationCycle[], EvaluationCycle[]>('/performance/cycles/active'),

  activate: (id: string) =>
    api.post<unknown, EvaluationCycle>(`/performance/cycles/${id}/activate`),

  complete: (id: string) =>
    api.post<unknown, EvaluationCycle>(`/performance/cycles/${id}/complete`),

  getStatistics: (id: string) =>
    api.get<EvaluationStatistics, EvaluationStatistics>(`/performance/cycles/${id}/statistics`),

  getNineBox: (id: string) =>
    api.get<NineBoxMatrix, NineBoxMatrix>(`/performance/cycles/${id}/ninebox`),
};

// ==================== Evaluations API ====================

export const evaluationsApi = {
  create: (data: Partial<Evaluation>) =>
    api.post<Evaluation, Evaluation>('/performance/evaluations', data),

  get: (id: string): Promise<Evaluation> =>
    api.get<Evaluation, Evaluation>(`/performance/evaluations/${id}`),


  getPending: (evaluatorId: string) =>
    api.get<Evaluation[], Evaluation[]>(`/performance/evaluations/pending?evaluatorId=${evaluatorId}`),

  getByEmployee: (employeeId: string) =>
    api.get<Evaluation[], Evaluation[]>(`/performance/evaluations/employee/${employeeId}`),

  getByCycle: (cycleId: string, page = 0, size = 20) =>
    api.get<{ content: Evaluation[]; totalElements: number }, { content: Evaluation[]; totalElements: number }>(`/performance/cycles/${cycleId}/evaluations?page=${page}&size=${size}`),

  start: (id: string) =>
    api.post<unknown, Evaluation>(`/performance/evaluations/${id}/start`),

  saveAnswers: (id: string, answers: EvaluationAnswer[]) =>
    api.put<EvaluationAnswer[], Evaluation>(`/performance/evaluations/${id}/answers`, answers),

  submit: (id: string, data: { feedback: string; strengths: string; improvements: string }) =>
    api.post<{ feedback: string; strengths: string; improvements: string }, Evaluation>(`/performance/evaluations/${id}/submit`, data),

  calibrate: (id: string, data: { newScore: number; notes: string }) =>
    api.post<{ newScore: number; notes: string }, Evaluation>(`/performance/evaluations/${id}/calibrate`, data),

  complete: (id: string) =>
    api.post<unknown, Evaluation>(`/performance/evaluations/${id}/complete`),

  acknowledge: (id: string, comments: string) =>
    api.post<{ comments: string }, Evaluation>(`/performance/evaluations/${id}/acknowledge`, { comments }),

  getOverdue: () =>
    api.get<Evaluation[], Evaluation[]>('/performance/evaluations/overdue'),
};

// ==================== Goals API ====================

export const goalsApi = {
  create: (data: Partial<Goal>) =>
    api.post<Goal, Goal>('/performance/goals', data),

  get: (id: string) =>
    api.get<Goal, Goal>(`/performance/goals/${id}`),

  update: (id: string, data: Partial<Goal>) =>
    api.put<Goal, Goal>(`/performance/goals/${id}`, data),

  delete: (id: string) =>
    api.delete(`/performance/goals/${id}`),

  getByEmployee: (employeeId: string) =>
    api.get<Goal[], Goal[]>(`/performance/goals/employee/${employeeId}`),

  getByDepartment: (departmentId: string) =>
    api.get<Goal[], Goal[]>(`/performance/goals/department/${departmentId}`),

  getByCycle: (cycleId: string, page = 0, size = 20) =>
    api.get<{ content: Goal[]; totalElements: number }, { content: Goal[]; totalElements: number }>(`/performance/goals/cycle/${cycleId}?page=${page}&size=${size}`),

  getByStatus: (employeeId: string, status: GoalStatus) =>
    api.get<Goal[], Goal[]>(`/performance/goals/employee/${employeeId}/status/${status}`),

  getOverdue: () =>
    api.get<Goal[], Goal[]>('/performance/goals/overdue'),

  getAtRisk: () =>
    api.get<Goal[], Goal[]>('/performance/goals/at-risk'),

  getKeyResults: (goalId: string) =>
    api.get<Goal[], Goal[]>(`/performance/goals/${goalId}/key-results`),

  createKeyResult: (goalId: string, data: Partial<Goal>) =>
    api.post<Goal, Goal>(`/performance/goals/${goalId}/key-results`, data),

  getCompanyOKRs: (cycleId: string) =>
    api.get<Goal[], Goal[]>(`/performance/goals/company-okrs/${cycleId}`),

  updateProgress: (id: string, data: { newValue: number; notes?: string; updatedBy: string }) =>
    api.post<{ newValue: number; notes?: string; updatedBy: string }, Goal>(`/performance/goals/${id}/progress`, data),

  complete: (id: string) =>
    api.post<unknown, Goal>(`/performance/goals/${id}/complete`),

  cancel: (id: string) =>
    api.post<unknown, Goal>(`/performance/goals/${id}/cancel`),

  markAtRisk: (id: string) =>
    api.post<unknown, Goal>(`/performance/goals/${id}/at-risk`),

  getStatistics: (employeeId: string) =>
    api.get<GoalStatistics, GoalStatistics>(`/performance/goals/employee/${employeeId}/statistics`),
};

// ==================== PDI API ====================

export const pdisApi = {
  create: (data: Partial<PDI>) =>
    api.post<PDI, PDI>('/performance/pdis', data),

  get: (id: string) =>
    api.get<PDI, PDI>(`/performance/pdis/${id}`),

  update: (id: string, data: Partial<PDI>) =>
    api.put<PDI, PDI>(`/performance/pdis/${id}`, data),

  delete: (id: string) =>
    api.delete(`/performance/pdis/${id}`),

  list: (page = 0, size = 20) =>
    api.get<{ content: PDI[]; totalElements: number }, { content: PDI[]; totalElements: number }>(`/performance/pdis?page=${page}&size=${size}`),

  getByEmployee: (employeeId: string) =>
    api.get<PDI[], PDI[]>(`/performance/pdis/employee/${employeeId}`),

  getActive: (employeeId: string) =>
    api.get<PDI[], PDI[]>(`/performance/pdis/employee/${employeeId}/active`),

  getByTeam: (managerId: string) =>
    api.get<PDI[], PDI[]>(`/performance/pdis/team/${managerId}`),

  getPendingApproval: (managerId: string) =>
    api.get<PDI[], PDI[]>(`/performance/pdis/pending-approval/${managerId}`),

  getOverdue: () =>
    api.get<PDI[], PDI[]>('/performance/pdis/overdue'),

  submitForApproval: (id: string) =>
    api.post<unknown, PDI>(`/performance/pdis/${id}/submit`),

  approve: (id: string, approverId: string) =>
    api.post<unknown, PDI>(`/performance/pdis/${id}/approve?approverId=${approverId}`),

  activate: (id: string) =>
    api.post<unknown, PDI>(`/performance/pdis/${id}/activate`),

  complete: (id: string) =>
    api.post<unknown, PDI>(`/performance/pdis/${id}/complete`),

  cancel: (id: string) =>
    api.post<unknown, PDI>(`/performance/pdis/${id}/cancel`),

  addAction: (id: string, action: Partial<PDIAction>) =>
    api.post<PDIAction, PDI>(`/performance/pdis/${id}/actions`, action),

  removeAction: (pdiId: string, actionId: string) =>
    api.delete<PDI>(`/performance/pdis/${pdiId}/actions/${actionId}`),

  startAction: (pdiId: string, actionId: string) =>
    api.post<unknown, PDI>(`/performance/pdis/${pdiId}/actions/${actionId}/start`),

  completeAction: (pdiId: string, actionId: string, data: { notes?: string; hoursSpent?: number }) =>
    api.post<{ notes?: string; hoursSpent?: number }, PDI>(`/performance/pdis/${pdiId}/actions/${actionId}/complete`, data),

  updateActionProgress: (pdiId: string, actionId: string, progress: number) =>
    api.post<{ progress: number }, PDI>(`/performance/pdis/${pdiId}/actions/${actionId}/progress`, { progress }),

  createFromEvaluation: (data: {
    evaluationId: string;
    employeeId: string;
    employeeName: string;
    managerId: string;
    managerName: string;
    focusAreas?: string;
  }) =>
    api.post<unknown, PDI>('/performance/pdis/from-evaluation', data),

  getManagerStatistics: (managerId: string) =>
    api.get<PDIStatistics, PDIStatistics>(`/performance/pdis/manager/${managerId}/statistics`),
};

// ==================== DISC API ====================

export const discApi = {
  // Questions
  getQuestions: () =>
    api.get<DiscQuestion[], DiscQuestion[]>('/performance/disc/questions'),

  // Evaluations
  getLatest: (employeeId: string) =>
    api.get<DiscEvaluation, DiscEvaluation>(`/performance/disc/employee/${employeeId}/latest`),

  getHistory: (employeeId: string) =>
    api.get<DiscEvaluation[], DiscEvaluation[]>(`/performance/disc/employee/${employeeId}/history`),

  getById: (evaluationId: string) =>
    api.get<DiscEvaluation, DiscEvaluation>(`/performance/disc/${evaluationId}`),

  list: (page = 0, size = 20, status?: DiscAssessmentStatus) => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (status) params.append('status', status);
    return api.get<{ content: DiscEvaluation[]; totalElements: number }, { content: DiscEvaluation[]; totalElements: number }>(`/performance/disc?${params}`);
  },

  submit: (employeeId: string, employeeName: string, answers: Record<string, string>) =>
    api.post<DiscEvaluation, DiscEvaluation>('/performance/disc', { employeeId, employeeName, answers }),

  start: (evaluationId: string) =>
    api.post<unknown, DiscEvaluation>(`/performance/disc/${evaluationId}/start`),

  // Assignments
  assign: (data: {
    employeeId: string;
    employeeName: string;
    assignedBy: string;
    assignedByName: string;
    dueDate?: string;
  }) =>
    api.post<DiscAssignment, DiscAssignment>('/performance/disc/assign', data),

  assignBulk: (data: {
    employeeIds: string[];
    employeeNames: Record<string, string>;
    assignedBy: string;
    assignedByName: string;
    dueDate?: string;
  }) =>
    api.post<DiscAssignment[], DiscAssignment[]>('/performance/disc/assign/bulk', data),

  cancelAssignment: (assignmentId: string) =>
    api.delete(`/performance/disc/assignment/${assignmentId}`),

  listAssignments: (page = 0, size = 20, pendingOnly = false) => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (pendingOnly) params.append('pendingOnly', 'true');
    return api.get<{ content: DiscAssignment[]; totalElements: number }, { content: DiscAssignment[]; totalElements: number }>(`/performance/disc/assignments?${params}`);
  },

  getPendingForEmployee: (employeeId: string) =>
    api.get<DiscAssignment[], DiscAssignment[]>(`/performance/disc/employee/${employeeId}/pending`),

  // Statistics
  getStatistics: () =>
    api.get<DiscStatistics, DiscStatistics>('/performance/disc/statistics'),

  // Deletion
  deleteEvaluation: (id: string) =>
    api.delete(`/performance/disc/${id}`),

  // Helpers
  hasCompleted: (employeeId: string) =>
    api.get<boolean, boolean>(`/performance/disc/employee/${employeeId}/has-completed`),

  hasPending: (employeeId: string) =>
    api.get<boolean, boolean>(`/performance/disc/employee/${employeeId}/has-pending`),
};

