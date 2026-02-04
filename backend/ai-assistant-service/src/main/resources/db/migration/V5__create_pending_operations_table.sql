-- ============================================================================
-- V5: Create pending_operations table for AI data modifications with confirmation
-- ============================================================================
-- This table stores data modification operations that require user confirmation
-- before execution. It supports INSERT, UPDATE, DELETE operations on any entity
-- and tracks the full lifecycle from creation to execution/rollback.
-- ============================================================================

CREATE TABLE IF NOT EXISTS pending_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    conversation_id VARCHAR(100),
    message_id VARCHAR(100),

    -- Operation type and status
    operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE', 'BULK_UPDATE', 'BULK_DELETE')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXECUTED', 'FAILED', 'EXPIRED', 'ROLLED_BACK', 'CANCELLED')),

    -- Target information
    target_table VARCHAR(100) NOT NULL,
    target_entity VARCHAR(100),
    target_id UUID,

    -- Description and original request
    description TEXT,
    natural_language_request TEXT,

    -- Data snapshots (for auditing and rollback)
    original_data JSONB,
    new_data JSONB,
    changes_summary JSONB,

    -- SQL execution details
    generated_sql TEXT,
    sql_parameters JSONB,
    affected_records_count INTEGER DEFAULT 1,

    -- Risk assessment
    risk_level VARCHAR(20) DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    requires_approval BOOLEAN DEFAULT TRUE,

    -- Approval tracking
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_by UUID,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,

    -- Execution tracking
    executed_at TIMESTAMP WITH TIME ZONE,
    execution_result TEXT,
    execution_error TEXT,

    -- Rollback support
    rollback_sql TEXT,
    is_rolled_back BOOLEAN DEFAULT FALSE,
    rolled_back_at TIMESTAMP WITH TIME ZONE,
    rolled_back_by UUID,

    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Additional metadata
    metadata JSONB,

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

-- ============================================================================
-- Indexes for common queries
-- ============================================================================

-- Primary lookup by tenant and user
CREATE INDEX idx_pending_ops_tenant_user ON pending_operations(tenant_id, user_id);

-- Status-based queries (for listing pending/executed operations)
CREATE INDEX idx_pending_ops_status ON pending_operations(status);

-- Conversation-based queries
CREATE INDEX idx_pending_ops_conversation ON pending_operations(conversation_id);

-- Expiration check (for scheduled cleanup)
CREATE INDEX idx_pending_ops_expires ON pending_operations(expires_at) WHERE status = 'PENDING';

-- Target entity lookup (to check for conflicting operations)
CREATE INDEX idx_pending_ops_target ON pending_operations(tenant_id, target_table, target_id) WHERE status = 'PENDING';

-- Recent executed operations (for audit log)
CREATE INDEX idx_pending_ops_executed ON pending_operations(tenant_id, executed_at DESC) WHERE status IN ('EXECUTED', 'ROLLED_BACK');

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE pending_operations IS 'Stores data modification operations that require user confirmation before execution';
COMMENT ON COLUMN pending_operations.operation_type IS 'Type of database operation: INSERT, UPDATE, DELETE, BULK_UPDATE, BULK_DELETE';
COMMENT ON COLUMN pending_operations.status IS 'Lifecycle status: PENDING (awaiting confirmation), APPROVED (confirmed but not yet executed), REJECTED (user declined), EXECUTED (successfully run), FAILED (execution error), EXPIRED (timed out), ROLLED_BACK (undone), CANCELLED (user cancelled)';
COMMENT ON COLUMN pending_operations.original_data IS 'Snapshot of the data before modification (for UPDATE/DELETE)';
COMMENT ON COLUMN pending_operations.new_data IS 'The new data to be applied';
COMMENT ON COLUMN pending_operations.changes_summary IS 'Human-readable summary of changes with field labels';
COMMENT ON COLUMN pending_operations.risk_level IS 'Assessed risk: LOW (minor changes), MEDIUM (salary/sensitive data), HIGH (delete/bulk), CRITICAL (destructive bulk operations)';
COMMENT ON COLUMN pending_operations.rollback_sql IS 'SQL to undo the operation (generated for UPDATEs)';
COMMENT ON COLUMN pending_operations.expires_at IS 'When the pending operation expires and can no longer be confirmed';

-- ============================================================================
-- Add new intents for data modification
-- ============================================================================

INSERT INTO ai_intents (name, description, category, training_phrases, entities, action_type, confidence_threshold, is_active)
VALUES
    ('modify_data', 'Modificar dados de funcionários ou entidades do sistema', 'data_modification',
     '["alterar nome", "mudar salário", "atualizar departamento", "corrigir email", "modificar endereço", "trocar cargo", "alterar dados", "atualizar cadastro"]'::jsonb,
     '["employee_name", "field_name", "new_value"]'::jsonb,
     'ACTION_CONFIRMATION', 0.80, true),

    ('confirm_operation', 'Confirmar uma operação pendente', 'data_modification',
     '["confirmar", "sim", "pode fazer", "autorizo", "ok", "confirmo", "aprovado"]'::jsonb,
     '["operation_id"]'::jsonb,
     'ACTION_CONFIRMATION', 0.85, true),

    ('reject_operation', 'Rejeitar/cancelar uma operação pendente', 'data_modification',
     '["não", "cancelar", "não quero", "desistir", "abortar", "rejeitar"]'::jsonb,
     '["operation_id", "rejection_reason"]'::jsonb,
     'ACTION_CONFIRMATION', 0.85, true),

    ('list_pending', 'Listar operações pendentes', 'data_modification',
     '["operações pendentes", "o que está pendente", "minhas alterações", "confirmar alguma coisa"]'::jsonb,
     '[]'::jsonb,
     'DATABASE_QUERY', 0.80, true)
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description,
    training_phrases = EXCLUDED.training_phrases,
    action_type = EXCLUDED.action_type,
    is_active = true;

-- ============================================================================
-- Add system prompt for data modification
-- ============================================================================

INSERT INTO ai_prompts (id, tenant_id, name, description, category, prompt_template, variables, is_system, is_active, version)
VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000'::uuid,
    'data_modification_confirmation',
    'Prompt para confirmação de modificações de dados',
    'system',
    'Você identificou uma solicitação de modificação de dados. Apresente as alterações de forma clara e solicite confirmação explícita.

ALTERAÇÕES SOLICITADAS:
{{changes}}

IMPORTANTE:
- Liste cada campo que será alterado com valor atual e novo valor
- Destaque campos sensíveis (salário, dados pessoais)
- Informe o nível de risco da operação
- Peça confirmação clara: "Digite CONFIRMAR para prosseguir ou CANCELAR para desistir"
- Se o usuário confirmar, execute a operação
- Se cancelar, agradeça e encerre

Formato da resposta para confirmação:
### Confirmação de Alteração

**Funcionário:** {{employee_name}}

| Campo | Valor Atual | Novo Valor |
|-------|------------|------------|
{{changes_table}}

**Nível de Risco:** {{risk_level}}

Deseja confirmar esta alteração? Responda **CONFIRMAR** ou **CANCELAR**.',
    '["changes", "employee_name", "changes_table", "risk_level"]'::jsonb,
    true,
    true,
    1
)
ON CONFLICT DO NOTHING;
