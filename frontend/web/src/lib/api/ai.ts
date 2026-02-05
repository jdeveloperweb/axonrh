import { api, API_BASE_URL } from './client';
import { useAuthStore } from '@/stores/auth-store';

// ==================== Types ====================

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  type?: 'TEXT' | 'QUERY_RESULT' | 'CALCULATION' | 'ERROR' | 'SUGGESTION' | 'ACTION_CONFIRMATION';
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface Conversation {
  id: string;
  tenantId: string;
  userId: string;
  title?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  messages: ChatMessage[];
  summary?: string;
  context?: ConversationContext;
  metadata?: ConversationMetadata;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface ConversationContext {
  companyName?: string;
  userName?: string;
  userRole?: string;
  department?: string;
  permissions?: string[];
}

export interface ConversationMetadata {
  messageCount: number;
  totalTokensInput: number;
  totalTokensOutput: number;
  lastIntent?: string;
  topicsDiscussed?: string[];
  averageResponseTimeMs?: number;
  feedbackRating?: number;
}

export interface ChatResponse {
  id: string;
  content: string;
  role: 'assistant';
  type?: 'TEXT' | 'QUERY_RESULT' | 'CALCULATION' | 'ERROR' | 'SUGGESTION' | 'ACTION_CONFIRMATION';
  provider?: string;
  model?: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  responseTimeMs?: number;
  timestamp: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
  finishReason?: string;
  type?: string;
}

export interface KnowledgeDocument {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  documentType: DocumentType;
  sourceUrl?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  chunkCount?: number;
  isIndexed: boolean;
  indexedAt?: string;
  createdAt: string;
}

export type DocumentType =
  | 'HR_POLICY'
  | 'LABOR_LAW'
  | 'COMPANY_PROCEDURE'
  | 'FAQ'
  | 'TRAINING_MATERIAL'
  | 'BENEFIT_GUIDE'
  | 'EMPLOYEE_HANDBOOK'
  | 'FORM_TEMPLATE'
  | 'OTHER';

export interface SearchResult {
  documentId: string;
  documentTitle: string;
  content: string;
  chunkIndex: number;
  similarity: number;
}

export interface CalculationResult {
  type: string;
  grossValue: number;
  netValue: number;
  details: Record<string, unknown>;
  steps: string;
  legalBasis: string;
}

export interface VacationCalculation {
  salary: number;
  days?: number;
  withAbono?: boolean;
  dependents?: number;
}

export interface TerminationCalculation {
  salary: number;
  hireDate: string;
  terminationDate: string;
  terminationType: 'SEM_JUSTA_CAUSA' | 'JUSTA_CAUSA' | 'PEDIDO_DEMISSAO' | 'ACORDO';
  vacationDaysUsed?: number;
  workedNotice?: boolean;
  fgtsBalance?: number;
}

export interface OvertimeCalculation {
  hourlyRate: number;
  regularHours: number;
  overtime50Hours?: number;
  overtime100Hours?: number;
  nightHours?: number;
}

export interface AiFeedback {
  id: string;
  conversationId: string;
  messageId: string;
  rating: number;
  feedbackType: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  feedbackText?: string;
  categories?: string[];
  createdAt: string;
}

export interface FeedbackStats {
  averageRating: number;
  positiveCount: number;
  negativeCount: number;
  satisfactionRate: number;
}

export interface KnowledgeStats {
  indexedDocuments: number;
  totalChunks: number;
}

// ==================== Chat API ====================

export const chatApi = {
  send: (message: string, conversationId?: string) =>
    api.post<ChatResponse>('/ai/chat', { message, conversationId }),

  createConversation: (context?: ConversationContext) =>
    api.post<Conversation>('/ai/chat/conversations', context),

  listConversations: (page = 0, size = 20) =>
    api.get<{ content: Conversation[]; totalElements: number }>(
      `/ai/chat/conversations?page=${page}&size=${size}`
    ),

  getConversation: (id: string) =>
    api.get<Conversation>(`/ai/chat/conversations/${id}`),

  archiveConversation: (id: string) =>
    api.post<void>(`/ai/chat/conversations/${id}/archive`),

  updateConversation: (id: string, title: string) =>
    api.patch<void>(`/ai/chat/conversations/${id}`, { title }),

  deleteConversation: (id: string) =>
    api.delete<void>(`/ai/chat/conversations/${id}`),

  deleteAllConversations: () =>
    api.delete<void>('/ai/chat/conversations'),

  // Streaming chat using Server-Sent Events
  streamChat: async function* (
    message: string,
    conversationId?: string
  ): AsyncGenerator<StreamChunk> {
    const { accessToken } = useAuthStore.getState();
    const tenantId = localStorage.getItem('tenantId') || '';
    const userId = localStorage.getItem('userId') || '';

    console.debug('[ChatAPI] Starting stream chat:', { conversationId, tenantId, userId });

    const response = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
        'X-User-ID': userId,
      },
      body: JSON.stringify({ message, conversationId }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('[ChatAPI] Stream error response:', response.status, errorText);
      throw new Error(`Erro na comunicação (${response.status}): ${errorText.substring(0, 200)}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No reader available');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      let pendingData: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.debug('[ChatAPI] Stream reader done');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        console.debug('[ChatAPI] Raw buffer received:', buffer.substring(0, 200));

        // SSE lines can be separated by \n or \r\n
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) {
            // Empty line means end of event, process pending data
            if (pendingData !== null) {
              try {
                const chunk = JSON.parse(pendingData) as StreamChunk;
                console.debug('[ChatAPI] Yielding chunk:', { done: chunk.done, contentLength: chunk.content?.length });
                yield chunk;
                if (chunk.done) {
                  console.debug('[ChatAPI] Chunk marked as done, returning');
                  return;
                }
              } catch (err) {
                console.warn('[ChatAPI] Failed to parse SSE data:', pendingData, err);
              }
              pendingData = null;
            }
            continue;
          }

          // Skip event type lines
          if (trimmedLine.startsWith('event:')) {
            console.debug('[ChatAPI] Received event type:', trimmedLine);
            continue;
          }

          // Skip id lines
          if (trimmedLine.startsWith('id:')) {
            continue;
          }

          if (trimmedLine.startsWith('data:')) {
            const data = trimmedLine.slice(5).trim();
            if (data === '[DONE]') {
              console.debug('[ChatAPI] Received [DONE] marker');
              return;
            }
            pendingData = data;
          }
        }
      }

      // Process any remaining pending data
      if (pendingData !== null) {
        try {
          const chunk = JSON.parse(pendingData) as StreamChunk;
          yield chunk;
        } catch (err) {
          console.warn('[ChatAPI] Failed to parse final SSE data:', pendingData, err);
        }
      }
    } catch (error) {
      console.error('[ChatAPI] Error reading stream:', error);
      throw error;
    } finally {
      reader.releaseLock();
    }
  },
};

// ==================== Knowledge API ====================

export const knowledgeApi = {
  uploadDocument: (file: File, type: DocumentType, title?: string, description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    // Não definir Content-Type manualmente - deixar o axios configurar o boundary automaticamente
    return api.post<KnowledgeDocument>('/ai/knowledge/documents', formData);
  },

  listDocuments: (page = 0, size = 20) =>
    api.get<{ content: KnowledgeDocument[]; totalElements: number }>(
      `/ai/knowledge/documents?page=${page}&size=${size}`
    ),

  getDocument: (id: string) =>
    api.get<KnowledgeDocument>(`/ai/knowledge/documents/${id}`),

  deleteDocument: (id: string) =>
    api.delete<void>(`/ai/knowledge/documents/${id}`),

  search: (query: string, limit = 5) =>
    api.get<SearchResult[]>(`/ai/knowledge/search?query=${encodeURIComponent(query)}&limit=${limit}`),

  getStats: () =>
    api.get<KnowledgeStats>('/ai/knowledge/stats'),
};

// ==================== Calculation API ====================

export const calculationApi = {
  vacation: (data: VacationCalculation) =>
    api.post<CalculationResult>('/ai/calculations/vacation', data),

  termination: (data: TerminationCalculation) =>
    api.post<CalculationResult>('/ai/calculations/termination', data),

  overtime: (data: OvertimeCalculation) =>
    api.post<CalculationResult>('/ai/calculations/overtime', data),
};

// ==================== Feedback API ====================

export const feedbackApi = {
  submit: (data: {
    conversationId: string;
    messageId: string;
    rating: number;
    feedbackText?: string;
    categories?: string[];
  }) => api.post<AiFeedback>('/ai/feedback', data),

  list: (page = 0, size = 20) =>
    api.get<{ content: AiFeedback[]; totalElements: number }>(
      `/ai/feedback?page=${page}&size=${size}`
    ),

  getByConversation: (conversationId: string) =>
    api.get<AiFeedback[]>(`/ai/feedback/conversation/${conversationId}`),

  getStats: (days = 30) =>
    api.get<FeedbackStats>(`/ai/feedback/stats?days=${days}`),
};

// ==================== Helper Functions ====================

export function formatCalculationSteps(steps: string): string {
  return steps.split('\n').map(line => {
    if (line.match(/^\d+\./)) {
      return `• ${line}`;
    }
    return line;
  }).join('\n');
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function getDocumentTypeLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    HR_POLICY: 'Política de RH',
    LABOR_LAW: 'Legislação Trabalhista',
    COMPANY_PROCEDURE: 'Procedimento da Empresa',
    FAQ: 'Perguntas Frequentes',
    TRAINING_MATERIAL: 'Material de Treinamento',
    BENEFIT_GUIDE: 'Guia de Benefícios',
    EMPLOYEE_HANDBOOK: 'Manual do Funcionário',
    FORM_TEMPLATE: 'Modelo de Formulário',
    OTHER: 'Outro',
  };
  return labels[type] || type;
}

export const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'HR_POLICY', label: 'Política de RH' },
  { value: 'LABOR_LAW', label: 'Legislação Trabalhista' },
  { value: 'COMPANY_PROCEDURE', label: 'Procedimento da Empresa' },
  { value: 'FAQ', label: 'Perguntas Frequentes' },
  { value: 'TRAINING_MATERIAL', label: 'Material de Treinamento' },
  { value: 'BENEFIT_GUIDE', label: 'Guia de Benefícios' },
  { value: 'EMPLOYEE_HANDBOOK', label: 'Manual do Funcionário' },
  { value: 'FORM_TEMPLATE', label: 'Modelo de Formulário' },
  { value: 'OTHER', label: 'Outro' },
];

export const TERMINATION_TYPES = [
  { value: 'SEM_JUSTA_CAUSA', label: 'Demissão sem Justa Causa' },
  { value: 'JUSTA_CAUSA', label: 'Demissão por Justa Causa' },
  { value: 'PEDIDO_DEMISSAO', label: 'Pedido de Demissão' },
  { value: 'ACORDO', label: 'Demissão por Acordo' },
] as const;

// ==================== Data Modification Types ====================

export type OperationType = 'INSERT' | 'UPDATE' | 'DELETE' | 'BULK_UPDATE' | 'BULK_DELETE';
export type OperationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'FAILED' | 'EXPIRED' | 'ROLLED_BACK' | 'CANCELLED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DataChange {
  fieldName: string;
  fieldLabel: string;
  oldValue: string | null;
  newValue: string | null;
  changeType: string;
  isSensitive?: boolean;
}

export interface DataModificationResponse {
  operationId: string;
  operationType: OperationType;
  status: OperationStatus;
  riskLevel: RiskLevel;
  targetTable: string;
  targetEntity: string;
  targetEntityName: string;
  targetId: string;
  description: string;
  confirmationMessage?: string;
  warningMessage?: string;
  changes: DataChange[];
  affectedRecordsCount: number;
  expiresAt?: string;
  createdAt?: string;
  requiresConfirmation: boolean;
}

export interface OperationConfirmationResponse {
  operationId: string;
  operationType?: OperationType;
  status: OperationStatus;
  success: boolean;
  message: string;
  targetEntity?: string;
  targetEntityName?: string;
  targetId?: string;
  affectedRecordsCount?: number;
  executedAt?: string;
  canRollback?: boolean;
  rollbackDeadline?: string;
}

// ==================== Data Operations API ====================

export const dataOperationsApi = {
  /**
   * Process a natural language command for data modification.
   * Creates a pending operation that requires confirmation.
   */
  processCommand: (command: string, conversationId?: string, context?: Record<string, unknown>) =>
    api.post<DataModificationResponse>('/ai/data-operations/process', {
      command,
      conversationId,
      context,
    }),

  /**
   * Confirm a pending operation.
   */
  confirmOperation: (operationId: string) =>
    api.post<OperationConfirmationResponse>(`/ai/data-operations/quick-confirm/${operationId}`),

  /**
   * Reject a pending operation.
   */
  rejectOperation: (operationId: string, reason?: string) =>
    api.post<OperationConfirmationResponse>(`/ai/data-operations/quick-reject/${operationId}`, null, {
      params: reason ? { reason } : undefined,
    }),

  /**
   * Rollback an executed operation.
   */
  rollbackOperation: (operationId: string) =>
    api.post<OperationConfirmationResponse>(`/ai/data-operations/${operationId}/rollback`),

  /**
   * Get a specific operation by ID.
   */
  getOperation: (operationId: string) =>
    api.get<DataModificationResponse>(`/ai/data-operations/${operationId}`),

  /**
   * List pending operations for the current user.
   */
  listPendingOperations: (page = 0, size = 20) =>
    api.get<{ content: DataModificationResponse[]; totalElements: number }>(
      `/ai/data-operations/pending?page=${page}&size=${size}`
    ),

  /**
   * List operations for a specific conversation.
   */
  listConversationOperations: (conversationId: string) =>
    api.get<DataModificationResponse[]>(`/ai/data-operations/conversation/${conversationId}`),

  /**
   * Get pending operations count.
   */
  countPendingOperations: () =>
    api.get<{ count: number }>('/ai/data-operations/pending/count'),

  /**
   * Cancel all pending operations for a conversation.
   */
  cancelConversationOperations: (conversationId: string) =>
    api.post<{ success: boolean; cancelled: number; message: string }>(
      `/ai/data-operations/conversation/${conversationId}/cancel`
    ),

  /**
   * Get operation statistics.
   */
  getStats: () =>
    api.get<{ byStatus: Record<string, number>; total: number }>('/ai/data-operations/stats'),
};

// ==================== Risk Level Helpers ====================

export function getRiskLevelLabel(level: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    LOW: 'Baixo',
    MEDIUM: 'Médio',
    HIGH: 'Alto',
    CRITICAL: 'Crítico',
  };
  return labels[level] || level;
}

export function getRiskLevelColor(level: RiskLevel): { bg: string; text: string; border: string } {
  const colors: Record<RiskLevel, { bg: string; text: string; border: string }> = {
    LOW: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    MEDIUM: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    HIGH: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    CRITICAL: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  };
  return colors[level] || colors.LOW;
}

export function getOperationTypeLabel(type: OperationType): string {
  const labels: Record<OperationType, string> = {
    INSERT: 'Criar',
    UPDATE: 'Atualizar',
    DELETE: 'Excluir',
    BULK_UPDATE: 'Atualização em Massa',
    BULK_DELETE: 'Exclusão em Massa',
  };
  return labels[type] || type;
}

export function getOperationStatusLabel(status: OperationStatus): string {
  const labels: Record<OperationStatus, string> = {
    PENDING: 'Pendente',
    APPROVED: 'Aprovado',
    REJECTED: 'Rejeitado',
    EXECUTED: 'Executado',
    FAILED: 'Falhou',
    EXPIRED: 'Expirado',
    ROLLED_BACK: 'Revertido',
    CANCELLED: 'Cancelado',
  };
  return labels[status] || status;
}
