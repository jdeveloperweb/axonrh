import { api } from './client';

// ==================== Types ====================

export type SetupStatus = 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';
export type CompanySize = 'MICRO' | 'SMALL' | 'MEDIUM' | 'LARGE';
export type TaxRegime = 'SIMPLES' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL';
export type ImportType = 'EMPLOYEES' | 'DEPARTMENTS' | 'POSITIONS' | 'WORK_SCHEDULES' | 'PAYROLL_HISTORY' | 'TIME_RECORDS' | 'VACATION_BALANCE';
export type ImportStatus = 'PENDING' | 'VALIDATING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';

export interface SetupProgress {
  id: string;
  tenantId: string;
  currentStep: number;
  totalSteps: number;
  status: SetupStatus;
  step1CompanyData: boolean;
  step2OrgStructure: boolean;
  step3LaborRules: boolean;
  step4Branding: boolean;
  step5Modules: boolean;
  step6Users: boolean;
  step7Integrations: boolean;
  step8DataImport: boolean;
  step9Review: boolean;
  startedAt: string;
  completedAt?: string;
  lastActivityAt: string;
}

export interface SetupSummary {
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  progressPercentage: number;
  status: string;
  steps: StepInfo[];
  startedAt: string;
  completedAt?: string;
}

export interface StepInfo {
  number: number;
  name: string;
  completed: boolean;
  required: boolean;
}

export interface SetupInitRequest {
  corporateName: string;
  cnpj: string;
  email: string;
}

export interface SetupInitResponse {
  tenantId: string;
  setupUrl: string;
}

export interface CompanyProfile {
  id?: string;
  tenantId?: string;
  legalName: string;
  tradeName?: string;
  cnpj: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  email?: string;
  phone?: string;
  website?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressZipCode?: string;
  addressCountry?: string;
  companySize?: CompanySize;
  industry?: string;
  cnaeCode?: string;
  foundingDate?: string;
  employeeCount?: number;
  taxRegime?: TaxRegime;
  legalRepresentativeName?: string;
  legalRepresentativeCpf?: string;
  legalRepresentativeRole?: string;
  accountantName?: string;
  accountantCrc?: string;
  accountantEmail?: string;
  accountantPhone?: string;
  geofenceEnabled?: boolean;
  geofenceLatitude?: number;
  geofenceLongitude?: number;
  geofenceRadius?: number;
}

export interface ImportJob {
  id: string;
  tenantId: string;
  importType: ImportType;
  fileName?: string;
  fileSize?: number;
  status: ImportStatus;
  totalRows: number;
  processedRows: number;
  successRows: number;
  errorRows: number;
  validationErrors?: string;
  processingErrors?: string;
  rollbackAvailable: boolean;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface ImportTemplate {
  name: string;
  columns: TemplateColumn[];
  sampleData: Record<string, string>[];
}

export interface TemplateColumn {
  name: string;
  description: string;
  required: boolean;
}

export interface LaborRulesConfig {
  defaultWeeklyHours: number;
  defaultDailyHours: number;
  workWeekType: string;
  overtimeCalculationMethod: string;
  overtime50Percent: boolean;
  overtime100Percent: boolean;
  overtimeLimitDaily: number;
  overtimeLimitMonthly?: number;
  overtimeRequiresApproval: boolean;
  toleranceMinutes: number;
  punchRoundingMinutes: number;
  requireLunchPunch: boolean;
  minLunchDuration: number;
  maxLunchDuration: number;
  nightShiftStart: string;
  nightShiftEnd: string;
  nightShiftReduction: boolean;
  nightShiftAdditional: number;
  vacationAnnualDays: number;
  vacationProportional: boolean;
  vacationAbonoEnabled: boolean;
  vacationMaxSplit: number;
  vacationMinPeriod: number;
  vacationAdvanceSalary: boolean;
  transportVoucherEnabled: boolean;
  transportVoucherDiscount: number;
  mealVoucherEnabled: boolean;
  mealVoucherDiscount: number;
  followNationalHolidays: boolean;
  followStateHolidays: boolean;
  followMunicipalHolidays: boolean;
}

export interface BrandingConfig {
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  darkBackgroundColor: string;
  darkTextColor: string;
  fontFamily: string;
  headingFontFamily?: string;
  customCss?: string;
  loginBackgroundUrl?: string;
  loginMessage?: string;
  welcomeMessage?: string;
}

export interface ModuleConfig {
  moduleEmployees: boolean;
  moduleTimesheet: boolean;
  moduleVacation: boolean;
  modulePayroll: boolean;
  modulePerformance: boolean;
  moduleLearning: boolean;
  moduleRecruitment: boolean;
  moduleBenefits: boolean;
  moduleEsocial: boolean;
  moduleAccounting: boolean;
  moduleBanking: boolean;
  moduleAiAssistant: boolean;
  moduleAiAnalytics: boolean;
  moduleMobileApp: boolean;
  moduleKiosk: boolean;
}

export interface Department {
  id?: string;
  tenantId?: string;
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  managerId?: string;
  isActive?: boolean;
}

export interface Position {
  id?: string;
  tenantId?: string;
  code: string;
  title: string;
  description?: string;
  cboCode?: string;
  level?: string;
  departmentId?: string;
  salaryRangeMin?: number;
  salaryRangeMax?: number;
  isActive?: boolean;
}

export interface Department {
  id?: string;
  tenantId?: string;
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  managerId?: string;
  isActive?: boolean;
}

export interface Position {
  id?: string;
  tenantId?: string;
  code: string;
  title: string;
  description?: string;
  cboCode?: string;
  level?: string;
  departmentId?: string;
  salaryRangeMin?: number;
  salaryRangeMax?: number;
  isActive?: boolean;
}

export interface Department {
  id?: string;
  tenantId?: string;
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  managerId?: string;
  isActive?: boolean;
}

export interface Position {
  id?: string;
  tenantId?: string;
  code: string;
  title: string;
  description?: string;
  cboCode?: string;
  level?: string;
  departmentId?: string;
  salaryRangeMin?: number;
  salaryRangeMax?: number;
  isActive?: boolean;
}

// ==================== Setup Wizard API ====================

export const setupApi = {
  getProgress: () =>
    api.get<SetupProgress, SetupProgress>('/setup/progress'),

  getSummary: () =>
    api.get<SetupSummary, SetupSummary>('/setup/summary'),

  getStepData: (step: number) =>
    api.get<Record<string, unknown>, Record<string, unknown>>(`/setup/steps/${step}`),

  saveStepData: (step: number, data: Record<string, unknown>) =>
    api.post<SetupProgress, SetupProgress>(`/setup/steps/${step}/save`, data),

  completeStep: (step: number, data?: Record<string, unknown>) =>
    api.post<SetupProgress, SetupProgress>(`/setup/steps/${step}/complete`, data || {}),

  goToStep: (step: number) =>
    api.post<SetupProgress, SetupProgress>(`/setup/steps/${step}/goto`),

  finishSetup: () =>
    api.post<SetupProgress, SetupProgress>('/setup/finish'),

  // Company Profile
  getCompanyProfile: () =>
    api.get<CompanyProfile, CompanyProfile>('/setup/company'),

  saveCompanyProfile: (profile: CompanyProfile) =>
    api.post<CompanyProfile, CompanyProfile>('/setup/company', profile),

  // Org Structure
  getDepartments: () =>
    api.get<Department[], Department[]>('/setup/org/departments'),

  saveDepartment: (department: Department) =>
    api.post<Department, Department>('/setup/org/departments', department),

  deleteDepartment: (id: string) =>
    api.delete<void, void>(`/setup/org/departments/${id}`),

  getPositions: () =>
    api.get<Position[], Position[]>('/setup/org/positions'),

  savePosition: (position: Position) =>
    api.post<Position, Position>('/setup/org/positions', position),

  deletePosition: (id: string) =>
    api.delete<void, void>(`/setup/org/positions/${id}`),

  initSetup: (data: SetupInitRequest) =>
    api.post<SetupInitResponse, SetupInitResponse>('/setup/init', data),
};

// ==================== Import API ====================

export const importApi = {
  upload: (type: ImportType, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    // Não definir Content-Type manualmente - deixar o axios configurar o boundary automaticamente
    return api.post<ImportJob, ImportJob>('/setup/import/upload', formData);
  },

  process: (jobId: string) =>
    api.post<void, void>(`/setup/import/jobs/${jobId}/process`),

  rollback: (jobId: string) =>
    api.post<ImportJob, ImportJob>(`/setup/import/jobs/${jobId}/rollback`),

  listJobs: () =>
    api.get<ImportJob[], ImportJob[]>('/setup/import/jobs'),

  getJob: (jobId: string) =>
    api.get<ImportJob, ImportJob>(`/setup/import/jobs/${jobId}`),

  getTemplate: (type: ImportType) =>
    api.get<ImportTemplate, ImportTemplate>(`/setup/import/templates/${type}`),

  getImportTypes: () =>
    api.get<ImportType[], ImportType[]>('/setup/import/types'),
};

// ==================== Setup Steps ====================

export const SETUP_STEPS = [
  { number: 1, key: 'company', name: 'Dados da Empresa', required: true },
  { number: 2, key: 'org', name: 'Estrutura Organizacional', required: true },
  { number: 3, key: 'labor', name: 'Regras Trabalhistas', required: true },
  { number: 4, key: 'branding', name: 'Identidade Visual', required: false },
  { number: 5, key: 'modules', name: 'Módulos', required: true },
  { number: 6, key: 'users', name: 'Usuários', required: true },
  { number: 7, key: 'integrations', name: 'Integrações', required: false },
  { number: 8, key: 'import', name: 'Importação de Dados', required: false },
  { number: 9, key: 'review', name: 'Revisão e Ativação', required: true },
] as const;

export const BRAZIL_STATES = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' },
] as const;

export const INDUSTRIES = [
  'Tecnologia',
  'Varejo',
  'Indústria',
  'Serviços',
  'Construção Civil',
  'Saúde',
  'Educação',
  'Financeiro',
  'Agronegócio',
  'Logística',
  'Alimentício',
  'Têxtil',
  'Automotivo',
  'Telecomunicações',
  'Energia',
  'Outro',
] as const;

// ==================== Validation Helpers ====================

export function validateCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]/g, '');
  if (cnpj.length !== 14) return false;

  // Check for known invalid patterns
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  // Calculate check digits
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1));
}

export function formatCNPJ(cnpj: string): string {
  cnpj = cnpj.replace(/[^\d]/g, '');
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

export function formatCPF(cpf: string): string {
  cpf = cpf.replace(/[^\d]/g, '');
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatPhone(phone: string): string {
  phone = phone.replace(/[^\d]/g, '');
  if (phone.length === 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

export function formatZipCode(zipCode: string): string {
  zipCode = zipCode.replace(/[^\d]/g, '');
  return zipCode.replace(/(\d{5})(\d{3})/, '$1-$2');
}
