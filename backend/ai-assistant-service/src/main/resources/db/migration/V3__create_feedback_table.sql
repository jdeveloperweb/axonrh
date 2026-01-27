-- Migration to ensure all expected AI tables exist
-- This is needed because V1 might have been applied without some tables in some environments

CREATE TABLE IF NOT EXISTS ai_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    prompt_template TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    UNIQUE(tenant_id, name, version)
);

CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    document_type VARCHAR(50) NOT NULL,
    source_url TEXT,
    file_path TEXT,
    file_size BIGINT,
    mime_type VARCHAR(100),
    content_hash VARCHAR(64),
    chunk_count INTEGER DEFAULT 0,
    is_indexed BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    indexed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER,
    embedding_id VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS query_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    intent VARCHAR(50) NOT NULL,
    entities JSONB DEFAULT '[]',
    sql_template TEXT NOT NULL,
    parameters JSONB DEFAULT '[]',
    required_permissions JSONB DEFAULT '[]',
    examples JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50),
    training_phrases JSONB DEFAULT '[]',
    entities JSONB DEFAULT '[]',
    response_template TEXT,
    action_type VARCHAR(50),
    action_config JSONB DEFAULT '{}',
    confidence_threshold DECIMAL(3,2) DEFAULT 0.70,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    conversation_id VARCHAR(100) NOT NULL,
    message_id VARCHAR(100) NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback_type VARCHAR(20),
    feedback_text TEXT,
    categories JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID,
    date DATE NOT NULL,
    total_conversations INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    total_tokens_input INTEGER DEFAULT 0,
    total_tokens_output INTEGER DEFAULT 0,
    total_queries INTEGER DEFAULT 0,
    successful_queries INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER,
    intent_distribution JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, user_id, date)
);

CREATE TABLE IF NOT EXISTS ai_actions_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    conversation_id VARCHAR(100),
    action_type VARCHAR(50) NOT NULL,
    action_description TEXT,
    entities_involved JSONB DEFAULT '{}',
    result_status VARCHAR(20),
    result_message TEXT,
    executed_query TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_model_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    provider VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    config JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure indexes exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_ai_prompts_tenant' AND n.nspname = 'public') THEN
        CREATE INDEX idx_ai_prompts_tenant ON ai_prompts(tenant_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_knowledge_docs_tenant' AND n.nspname = 'public') THEN
        CREATE INDEX idx_knowledge_docs_tenant ON knowledge_documents(tenant_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_ai_feedback_tenant' AND n.nspname = 'public') THEN
        CREATE INDEX idx_ai_feedback_tenant ON ai_feedback(tenant_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_ai_feedback_conversation' AND n.nspname = 'public') THEN
        CREATE INDEX idx_ai_feedback_conversation ON ai_feedback(conversation_id);
    END IF;
END $$;
