import { api } from './client';

// ==================== eSocial Types ====================

export type ESocialEventType =
  | 'S_1000' | 'S_1005' | 'S_1010' | 'S_1020' | 'S_1070' | 'S_1080'
  | 'S_2190' | 'S_2200' | 'S_2205' | 'S_2206' | 'S_2210' | 'S_2220'
  | 'S_2230' | 'S_2240' | 'S_2250' | 'S_2260' | 'S_2298' | 'S_2299'
  | 'S_2300' | 'S_2306' | 'S_2399' | 'S_2400' | 'S_2405' | 'S_2410'
  | 'S_2416' | 'S_2418' | 'S_2420' | 'S_2500' | 'S_2501' | 'S_3000'
  | 'S_3500' | 'S_5001' | 'S_5002' | 'S_5003' | 'S_5011' | 'S_5012' | 'S_5013';

export type ESocialEventStatus =
  | 'PENDING' | 'VALIDATING' | 'VALIDATED' | 'SIGNING' | 'SIGNED'
  | 'TRANSMITTING' | 'TRANSMITTED' | 'PROCESSING' | 'PROCESSED'
  | 'ERROR' | 'REJECTED' | 'CANCELLED';

export interface ESocialEvent {
  id: string;
  eventType: ESocialEventType;
  status: ESocialEventStatus;
  employeeId?: string;
  employeeName?: string;
  xmlContent?: string;
  signedXml?: string;
  protocolNumber?: string;
  receiptNumber?: string;
  errorMessage?: string;
  retryCount: number;
  transmittedAt?: string;
  processedAt?: string;
  createdAt: string;
}

export interface ESocialStatistics {
  total: number;
  pending: number;
  transmitted: number;
  processed: number;
  error: number;
  byEventType: Record<string, number>;
}

export interface TransmissionResult {
  success: boolean;
  status: string;
  protocolNumber?: string;
  receiptNumber?: string;
  errorMessage?: string;
}

// ==================== CNAB Types ====================

export type CnabFileType = 'REMESSA' | 'RETORNO';
export type CnabLayout = 'CNAB_240' | 'CNAB_400';
export type CnabFileStatus = 'GENERATED' | 'TRANSMITTED' | 'PROCESSING' | 'PROCESSED' | 'PARTIAL' | 'REJECTED' | 'ERROR';
export type CnabRecordStatus = 'PENDING' | 'PROCESSED' | 'REJECTED' | 'CANCELLED' | 'RETURNED';

export interface CnabFile {
  id: string;
  fileType: CnabFileType;
  cnabLayout: CnabLayout;
  fileName: string;
  bankCode: string;
  bankName?: string;
  referenceDate: string;
  generationDate: string;
  sequenceNumber: number;
  totalRecords: number;
  totalAmount: number;
  status: CnabFileStatus;
  processedAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface CnabRecord {
  id: string;
  recordType: string;
  sequenceNumber: number;
  employeeId?: string;
  employeeName?: string;
  employeeCpf?: string;
  bankCode?: string;
  branchCode?: string;
  accountNumber?: string;
  amount?: number;
  paymentDate?: string;
  status: CnabRecordStatus;
  returnCode?: string;
  returnMessage?: string;
  processedAt?: string;
}

export interface PayrollPayment {
  employeeId: string;
  employeeName: string;
  cpf: string;
  bankCode: string;
  branchCode: string;
  branchDigit: string;
  accountNumber: string;
  accountDigit: string;
  amount: number;
  address: string;
  addressNumber: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  cepSuffix: string;
}

export interface BankConfig {
  bankCode: string;
  bankName: string;
  companyCode: string;
  convenio: string;
  cnpj: string;
  companyName: string;
  agencia: string;
  agenciaDigito: string;
  conta: string;
  contaDigito: string;
  address: string;
  addressNumber: string;
  city: string;
  state: string;
  cep: string;
  cepSuffix: string;
}

// ==================== Accounting Types ====================

export type AccountingExportType =
  | 'FOLHA_PAGAMENTO' | 'PROVISOES' | 'ENCARGOS'
  | 'BENEFICIOS' | 'RESCISOES' | 'COMPLETO';

export type AccountingSystem =
  | 'DOMINIO' | 'CONTMATIC' | 'SAGE' | 'TOTVS'
  | 'SAP' | 'ORACLE' | 'FORTES' | 'GENERIC_CSV' | 'GENERIC_XML';

export type AccountingExportStatus = 'PENDING' | 'GENERATING' | 'GENERATED' | 'EXPORTED' | 'ERROR';

export interface AccountingExport {
  id: string;
  exportType: AccountingExportType;
  accountingSystem: AccountingSystem;
  referenceMonth: string;
  periodStart: string;
  periodEnd: string;
  status: AccountingExportStatus;
  fileName?: string;
  totalEntries: number;
  totalDebit: number;
  totalCredit: number;
  errorMessage?: string;
  exportedAt?: string;
  createdAt: string;
}

export interface AccountingEntry {
  id: string;
  entryDate: string;
  sequenceNumber: number;
  entryType: string;
  debitAccount: string;
  debitAccountName?: string;
  creditAccount: string;
  creditAccountName?: string;
  costCenter?: string;
  amount: number;
  description?: string;
  employeeId?: string;
  employeeName?: string;
}

// ==================== Webhook Types ====================

export type WebhookEventType =
  | 'EMPLOYEE_CREATED' | 'EMPLOYEE_UPDATED' | 'EMPLOYEE_TERMINATED'
  | 'TIME_PUNCH' | 'TIME_PUNCH_ANOMALY' | 'OVERTIME_ALERT'
  | 'VACATION_REQUESTED' | 'VACATION_APPROVED' | 'VACATION_REJECTED' | 'VACATION_STARTED'
  | 'EVALUATION_COMPLETED' | 'GOAL_ACHIEVED' | 'PDI_CREATED'
  | 'COURSE_COMPLETED' | 'CERTIFICATE_ISSUED'
  | 'PAYROLL_PROCESSED' | 'PAYROLL_APPROVED'
  | 'ESOCIAL_TRANSMITTED' | 'ESOCIAL_PROCESSED'
  | 'CNAB_GENERATED' | 'CNAB_PROCESSED'
  | 'CUSTOM';

export type DeliveryStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'RETRYING';

export interface Webhook {
  id: string;
  name: string;
  description?: string;
  targetUrl: string;
  httpMethod: string;
  eventType: WebhookEventType;
  secretKey?: string;
  headers?: string;
  isActive: boolean;
  retryCount: number;
  timeoutSeconds: number;
  lastTriggeredAt?: string;
  lastStatus?: string;
  successCount: number;
  failureCount: number;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventType: WebhookEventType;
  requestUrl: string;
  requestMethod: string;
  requestPayload?: string;
  status: DeliveryStatus;
  responseStatusCode?: number;
  responseBody?: string;
  errorMessage?: string;
  durationMs?: number;
  retryCount: number;
  createdAt: string;
}

// ==================== Digital Certificate Types ====================

export type CertificateType = 'A1' | 'A3';

export interface DigitalCertificate {
  id: string;
  name: string;
  type: CertificateType;
  serialNumber?: string;
  issuerName?: string;
  subjectName?: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
}

// ==================== eSocial API ====================

export const esocialApi = {
  createEvent: (data: { eventType: ESocialEventType; employeeId?: string; eventData: Record<string, unknown> }) =>
    api.post<ESocialEvent>('/integration/esocial/events', data),

  listEvents: (page = 0, size = 20) =>
    api.get<{ content: ESocialEvent[]; totalElements: number }>(`/integration/esocial/events?page=${page}&size=${size}`),

  getEvent: (id: string) =>
    api.get<ESocialEvent>(`/integration/esocial/events/${id}`),

  getPendingEvents: () =>
    api.get<ESocialEvent[]>('/integration/esocial/events/pending'),

  getEventsByEmployee: (employeeId: string) =>
    api.get<ESocialEvent[]>(`/integration/esocial/events/employee/${employeeId}`),

  transmitEvent: (eventId: string) =>
    api.post<TransmissionResult>(`/integration/esocial/events/${eventId}/transmit`),

  transmitBatch: (eventIds: string[]) =>
    api.post<{ total: number; success: number; failed: number; results: TransmissionResult[] }>(
      '/integration/esocial/events/batch/transmit',
      { eventIds }
    ),

  consultEvent: (eventId: string) =>
    api.post<TransmissionResult>(`/integration/esocial/events/${eventId}/consult`),

  retryEvent: (eventId: string) =>
    api.post<ESocialEvent>(`/integration/esocial/events/${eventId}/retry`),

  cancelEvent: (eventId: string, reason: string) =>
    api.post<ESocialEvent>(`/integration/esocial/events/${eventId}/cancel`, { reason }),

  getStatistics: () =>
    api.get<ESocialStatistics>('/integration/esocial/statistics'),
};

// ==================== CNAB API ====================

export const cnabApi = {
  generatePayrollFile: (data: { payments: PayrollPayment[]; bankConfig: BankConfig; paymentDate: string }) =>
    api.post<CnabFile>('/integration/cnab/payroll', data),

  processReturnFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    // Não definir Content-Type manualmente - deixar o axios configurar o boundary automaticamente
    return api.post<CnabFile>('/integration/cnab/return', formData);
  },

  listFiles: (page = 0, size = 20) =>
    api.get<{ content: CnabFile[]; totalElements: number }>(`/integration/cnab/files?page=${page}&size=${size}`),

  getFile: (id: string) =>
    api.get<CnabFile>(`/integration/cnab/files/${id}`),

  getFileRecords: (fileId: string) =>
    api.get<CnabRecord[]>(`/integration/cnab/files/${fileId}/records`),

  downloadFile: (fileId: string) =>
    api.get<Blob>(`/integration/cnab/files/${fileId}/download`, { responseType: 'blob' }),
};

// ==================== Accounting API ====================

export const accountingApi = {
  generateExport: (data: {
    exportType: AccountingExportType;
    accountingSystem: AccountingSystem;
    referenceMonth: string;
    payrollEntries: Array<{
      employeeId: string;
      employeeName: string;
      costCenter?: string;
      costCenterName?: string;
      documentNumber?: string;
      items: Array<{
        rubricCode: string;
        rubricName: string;
        rubricType: string;
        amount: number;
        debitAccount: string;
        debitAccountName?: string;
        creditAccount: string;
        creditAccountName?: string;
        historyCode?: string;
      }>;
    }>;
  }) => api.post<AccountingExport>('/integration/accounting/exports', data),

  listExports: (page = 0, size = 20) =>
    api.get<{ content: AccountingExport[]; totalElements: number }>(`/integration/accounting/exports?page=${page}&size=${size}`),

  getExport: (id: string) =>
    api.get<AccountingExport>(`/integration/accounting/exports/${id}`),

  downloadExport: (exportId: string) =>
    api.get<Blob>(`/integration/accounting/exports/${exportId}/download`, { responseType: 'blob' }),

  getAccountingSystems: () =>
    api.get<AccountingSystem[]>('/integration/accounting/systems'),
};

// ==================== Webhook API ====================

export const webhooksApi = {
  create: (data: {
    name: string;
    description?: string;
    targetUrl: string;
    httpMethod?: string;
    eventType: WebhookEventType;
    secretKey?: string;
    headers?: string;
    retryCount?: number;
    timeoutSeconds?: number;
  }) => api.post<Webhook>('/integration/webhooks', data),

  list: () =>
    api.get<Webhook[]>('/integration/webhooks'),

  get: (id: string) =>
    api.get<Webhook>(`/integration/webhooks/${id}`),

  update: (id: string, data: Partial<Webhook>) =>
    api.put<Webhook>(`/integration/webhooks/${id}`, data),

  delete: (id: string) =>
    api.delete(`/integration/webhooks/${id}`),

  test: (id: string) =>
    api.post<WebhookDelivery>(`/integration/webhooks/${id}/test`),

  getDeliveryHistory: (webhookId: string) =>
    api.get<WebhookDelivery[]>(`/integration/webhooks/${webhookId}/deliveries`),

  retryDelivery: (deliveryId: string) =>
    api.post<WebhookDelivery>(`/integration/webhooks/deliveries/${deliveryId}/retry`),

  getEventTypes: () =>
    api.get<WebhookEventType[]>('/integration/webhooks/event-types'),
};

// ==================== Certificate API ====================

export const certificatesApi = {
  upload: (file: File, name: string, password: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('password', password);
    // Não definir Content-Type manualmente - deixar o axios configurar o boundary automaticamente
    return api.post<DigitalCertificate>('/integration/certificates', formData);
  },

  list: () =>
    api.get<DigitalCertificate[]>('/integration/certificates'),

  get: (id: string) =>
    api.get<DigitalCertificate>(`/integration/certificates/${id}`),

  activate: (id: string) =>
    api.post<DigitalCertificate>(`/integration/certificates/${id}/activate`),

  deactivate: (id: string) =>
    api.post<DigitalCertificate>(`/integration/certificates/${id}/deactivate`),

  delete: (id: string) =>
    api.delete(`/integration/certificates/${id}`),

  getExpiring: (days = 30) =>
    api.get<DigitalCertificate[]>(`/integration/certificates/expiring?days=${days}`),
};
