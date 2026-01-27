-- AI Assistant Service Database Schema
-- PostgreSQL for structured AI-related data

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- AI Prompts and Templates
CREATE TABLE ai_prompts (
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

CREATE INDEX idx_ai_prompts_tenant ON ai_prompts(tenant_id);
CREATE INDEX idx_ai_prompts_category ON ai_prompts(category);

-- Knowledge Base Documents (metadata - content stored in vector DB)
CREATE TABLE knowledge_documents (
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

CREATE INDEX idx_knowledge_docs_tenant ON knowledge_documents(tenant_id);
CREATE INDEX idx_knowledge_docs_type ON knowledge_documents(document_type);
CREATE INDEX idx_knowledge_docs_indexed ON knowledge_documents(is_indexed);

-- Document Chunks (for reference, actual embeddings in Milvus)
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER,
    embedding_id VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_doc_chunks_document ON document_chunks(document_id);
CREATE INDEX idx_doc_chunks_embedding ON document_chunks(embedding_id);

-- AI Query Templates (for NLU to SQL)
CREATE TABLE query_templates (
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

CREATE INDEX idx_query_templates_tenant ON query_templates(tenant_id);
CREATE INDEX idx_query_templates_intent ON query_templates(intent);

-- AI Intents (NLU)
CREATE TABLE ai_intents (
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

CREATE INDEX idx_ai_intents_category ON ai_intents(category);
CREATE INDEX idx_ai_intents_action ON ai_intents(action_type);

-- User Feedback on AI Responses
CREATE TABLE ai_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    conversation_id VARCHAR(100) NOT NULL,
    message_id VARCHAR(100) NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback_type VARCHAR(20), -- positive, negative, neutral
    feedback_text TEXT,
    categories JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_feedback_tenant ON ai_feedback(tenant_id);
CREATE INDEX idx_ai_feedback_conversation ON ai_feedback(conversation_id);
CREATE INDEX idx_ai_feedback_rating ON ai_feedback(rating);

-- AI Usage Analytics
CREATE TABLE ai_usage_stats (
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

CREATE INDEX idx_ai_usage_tenant_date ON ai_usage_stats(tenant_id, date);

-- AI Actions Audit Log
CREATE TABLE ai_actions_log (
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

CREATE INDEX idx_ai_actions_tenant ON ai_actions_log(tenant_id);
CREATE INDEX idx_ai_actions_user ON ai_actions_log(user_id);
CREATE INDEX idx_ai_actions_type ON ai_actions_log(action_type);
CREATE INDEX idx_ai_actions_date ON ai_actions_log(created_at);

-- AI Model Configurations
CREATE TABLE ai_model_configs (
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

CREATE INDEX idx_ai_model_configs_tenant ON ai_model_configs(tenant_id);
CREATE INDEX idx_ai_model_configs_provider ON ai_model_configs(provider);
