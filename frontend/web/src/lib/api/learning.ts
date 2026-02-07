import { api } from './client';

// ==================== Types ====================

export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type CourseType = 'ONLINE' | 'PRESENCIAL' | 'HIBRIDO' | 'EXTERNAL';
export type DifficultyLevel = 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO';
export type Modality = 'SINCRONO' | 'ASSINCRONO' | 'AUTODIDATA';
export type EnrollmentStatus = 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
export type ContentType = 'VIDEO' | 'DOCUMENTO' | 'APRESENTACAO' | 'QUIZ' | 'SCORM' | 'ARTIGO';

export interface TrainingCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string;
  isActive: boolean;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  contentType: ContentType;
  contentUrl?: string;
  contentText?: string;
  durationMinutes?: number;
  sequenceOrder: number;
  isRequired: boolean;
  isDownloadable: boolean;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  sequenceOrder: number;
  durationMinutes?: number;
  isRequired: boolean;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  categoryId?: string;
  categoryName?: string;
  title: string;
  description?: string;
  objectives?: string;
  targetAudience?: string;
  prerequisites?: string;
  thumbnailUrl?: string;
  durationMinutes?: number;
  courseType: CourseType;
  modality?: Modality;
  difficultyLevel?: DifficultyLevel;
  status: CourseStatus;
  isMandatory: boolean;
  requiresApproval: boolean;
  maxParticipants?: number;
  price: number;
  externalUrl?: string;
  externalProvider?: string;
  passingScore: number;
  allowRetake: boolean;
  maxRetakes: number;
  instructorId?: string;
  instructorName?: string;
  modules: CourseModule[];
  publishedAt?: string;
  createdAt: string;
}

export interface LessonProgress {
  id: string;
  lessonId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  startedAt?: string;
  completedAt?: string;
  timeSpentSeconds: number;
  lastPositionSeconds: number;
}

export interface Enrollment {
  id: string;
  courseId: string;
  courseName?: string;
  courseThumbnail?: string;
  employeeId: string;
  employeeName: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  startedAt?: string;
  completedAt?: string;
  dueDate?: string;
  progressPercentage: number;
  finalScore?: number;
  course?: Course;
  certificateId?: string;
  certificateIssuedAt?: string;
  lessonProgresses: LessonProgress[];
  createdAt: string;
}

export interface Certificate {
  id: string;
  enrollmentId: string;
  courseId: string;
  courseName?: string;
  employeeId: string;
  employeeName: string;
  certificateNumber: string;
  issuedAt: string;
  expiresAt?: string;
  finalScore?: number;
  durationHours?: number;
  pdfUrl?: string;
  verificationCode: string;
  instructorName?: string;
  instructorSignatureUrl?: string;
  generalSignerName?: string;
  generalSignatureUrl?: string;
  companyLogoUrl?: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description?: string;
  objectives?: string;
  thumbnailUrl?: string;
  durationHours?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isMandatory: boolean;
  courses: LearningPathCourse[];
  createdAt: string;
}

export interface LearningPathCourse {
  id: string;
  courseId: string;
  courseName?: string;
  sequenceOrder: number;
  isRequired: boolean;
  unlockAfterDays: number;
}

export interface PathEnrollment {
  id: string;
  pathId: string;
  pathName?: string;
  employeeId: string;
  employeeName: string;
  status: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED';
  enrolledAt: string;
  startedAt?: string;
  completedAt?: string;
  progressPercentage: number;
}

export interface TrainingEvaluation {
  id: string;
  enrollmentId: string;
  courseId: string;
  overallRating: number;
  contentRating: number;
  instructorRating?: number;
  platformRating: number;
  npsScore: number;
  wouldRecommend: boolean;
  comments?: string;
  improvementSuggestions?: string;
  isAnonymous: boolean;
  createdAt: string;
}

export interface CourseStatistics {
  totalModules: number;
  totalLessons: number;
  totalDurationMinutes: number;
  hasQuiz: boolean;
  totalEnrollments: number;
  completions: number;
  completionRate: number;
}

export interface EnrollmentStatistics {
  total: number;
  completed: number;
  inProgress: number;
  averageProgress: number;
}

// ==================== Courses API ====================

export const coursesApi = {
  create: (data: Partial<Course>) =>
    api.post<Course>('/learning/courses', data),

  get: (id: string) =>
    api.get<Course>(`/learning/courses/${id}`),

  update: (id: string, data: Partial<Course>) =>
    api.put<Course>(`/learning/courses/${id}`, data),

  delete: (id: string) =>
    api.delete(`/learning/courses/${id}`),

  list: (page = 0, size = 20) =>
    api.get<{ content: Course[]; totalElements: number }>(`/learning/courses?page=${page}&size=${size}`),

  listPublished: () =>
    api.get<Course[], Course[]>('/learning/courses/published'),

  listByCategory: (categoryId: string) =>
    api.get<Course[]>(`/learning/courses/category/${categoryId}`),

  listMandatory: () =>
    api.get<Course[]>('/learning/courses/mandatory'),

  search: (query: string, page = 0, size = 20) =>
    api.get<{ content: Course[]; totalElements: number }>(`/learning/courses/search?q=${query}&page=${page}&size=${size}`),

  publish: (id: string) =>
    api.post<Course>(`/learning/courses/${id}/publish`),

  archive: (id: string) =>
    api.post<Course>(`/learning/courses/${id}/archive`),

  getStatistics: (id: string) =>
    api.get<CourseStatistics>(`/learning/courses/${id}/statistics`),

  // Modules
  addModule: (courseId: string, data: Partial<CourseModule>) =>
    api.post<Course>(`/learning/courses/${courseId}/modules`, data),

  updateModule: (courseId: string, moduleId: string, data: Partial<CourseModule>) =>
    api.put<Course>(`/learning/courses/${courseId}/modules/${moduleId}`, data),

  removeModule: (courseId: string, moduleId: string) =>
    api.delete<Course>(`/learning/courses/${courseId}/modules/${moduleId}`),

  // Lessons
  addLesson: (courseId: string, moduleId: string, data: Partial<Lesson>) =>
    api.post<Course>(`/learning/courses/${courseId}/modules/${moduleId}/lessons`, data),

  removeLesson: (courseId: string, moduleId: string, lessonId: string) =>
    api.delete<Course>(`/learning/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`),
};

// ==================== Enrollments API ====================

export const enrollmentsApi = {
  enroll: (courseId: string, data: { employeeId: string; employeeName: string; dueDate?: string }) =>
    api.post<Enrollment>('/learning/enrollments', { courseId, ...data }),

  listAll: (page = 0, size = 20) =>
    api.get<{ content: Enrollment[]; totalElements: number }, { content: Enrollment[]; totalElements: number }>(`/learning/enrollments?page=${page}&size=${size}`),

  get: (id: string) =>
    api.get<Enrollment, Enrollment>(`/learning/enrollments/${id}`),

  getByEmployee: (employeeId: string) =>
    api.get<Enrollment[]>(`/learning/enrollments/employee/${employeeId}`),

  getActiveByEmployee: (employeeId: string) =>
    api.get<Enrollment[]>(`/learning/enrollments/employee/${employeeId}/active`),

  getByCourse: (courseId: string, page = 0, size = 20) =>
    api.get<{ content: Enrollment[]; totalElements: number }>(`/learning/enrollments/course/${courseId}?page=${page}&size=${size}`),

  getOverdue: () =>
    api.get<Enrollment[]>('/learning/enrollments/overdue'),

  start: (id: string) =>
    api.post<Enrollment>(`/learning/enrollments/${id}/start`),

  updateProgress: (id: string, lessonId: string, data: { status: string; timeSpent?: number; videoPosition?: number }) =>
    api.post<Enrollment>(`/learning/enrollments/${id}/lessons/${lessonId}/progress`, data),

  complete: (id: string, score: number) =>
    api.post<Enrollment>(`/learning/enrollments/${id}/complete`, { score }),

  cancel: (id: string, reason: string) =>
    api.post<Enrollment>(`/learning/enrollments/${id}/cancel`, { reason }),

  approve: (id: string, approverId: string) =>
    api.post<Enrollment>(`/learning/enrollments/${id}/approve?approverId=${approverId}`),

  unenroll: (id: string) =>
    api.delete(`/learning/enrollments/${id}`),

  getStatistics: (employeeId: string) =>
    api.get<EnrollmentStatistics>(`/learning/enrollments/employee/${employeeId}/statistics`),
};

// ==================== Certificates API ====================

export const certificatesApi = {
  get: (id: string) =>
    api.get<Certificate>(`/learning/certificates/${id}`),

  getByEmployee: (employeeId: string) =>
    api.get<Certificate[]>(`/learning/certificates/employee/${employeeId}`),

  verify: (code: string) =>
    api.get<Certificate>(`/learning/certificates/verify/${code}`),

  download: (id: string) =>
    api.get<{ url: string }>(`/learning/certificates/${id}/download`),
};

// ==================== Learning Paths API ====================

export const learningPathsApi = {
  create: (data: Partial<LearningPath>) =>
    api.post<LearningPath>('/learning/paths', data),

  get: (id: string) =>
    api.get<LearningPath>(`/learning/paths/${id}`),

  list: (page = 0, size = 20) =>
    api.get<{ content: LearningPath[]; totalElements: number }>(`/learning/paths?page=${page}&size=${size}`),

  listPublished: () =>
    api.get<LearningPath[]>('/learning/paths/published'),

  publish: (id: string) =>
    api.post<LearningPath>(`/learning/paths/${id}/publish`),

  enroll: (pathId: string, data: { employeeId: string; employeeName: string }) =>
    api.post<PathEnrollment>(`/learning/paths/${pathId}/enroll`, data),

  getEnrollments: (employeeId: string) =>
    api.get<PathEnrollment[]>(`/learning/paths/enrollments/employee/${employeeId}`),
};

// ==================== Categories API ====================

export const categoriesApi = {
  list: () =>
    api.get<TrainingCategory[]>('/learning/categories'),

  create: (data: Partial<TrainingCategory>) =>
    api.post<TrainingCategory>('/learning/categories', data),

  update: (id: string, data: Partial<TrainingCategory>) =>
    api.put<TrainingCategory>(`/learning/categories/${id}`, data),

  delete: (id: string) =>
    api.delete(`/learning/categories/${id}`),
};

// ==================== Evaluations API ====================

export const trainingEvaluationsApi = {
  submit: (enrollmentId: string, data: Partial<TrainingEvaluation>) =>
    api.post<TrainingEvaluation>('/learning/evaluations', { enrollmentId, ...data }),

  getByCourse: (courseId: string) =>
    api.get<TrainingEvaluation[]>(`/learning/evaluations/course/${courseId}`),

  getAverageRatings: (courseId: string) =>
    api.get<{
      averageOverall: number;
      averageContent: number;
      averageInstructor: number;
      averagePlatform: number;
      npsScore: number;
      totalResponses: number;
    }>(`/learning/evaluations/course/${courseId}/summary`),
};

// ==================== Certificate Configs API ====================

export interface CertificateConfig {
  id?: string;
  courseId?: string;
  instructorName?: string;
  instructorSignatureUrl?: string;
  generalSignerName?: string;
  generalSignatureUrl?: string;
  companyLogoUrl?: string;
  showCompanyLogo: boolean;
}

export const certificateConfigsApi = {
  get: (courseId?: string) =>
    api.get<CertificateConfig, CertificateConfig>(`/learning/certificate-configs${courseId ? `?courseId=${courseId}` : ''}`),

  save: (data: CertificateConfig) =>
    api.post<CertificateConfig, CertificateConfig>('/learning/certificate-configs', data),
};
