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

-- Insert default system prompts
INSERT INTO ai_prompts (id, tenant_id, name, category, prompt_template, is_system, variables) VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'hr_assistant_main', 'system',
'Você é o Assistente de RH da AxonRH. Ajude com questões de recursos humanos, cálculos trabalhistas e consultas de dados.

Contexto da empresa: {company_context}
Dados do usuário: {user_context}
Data atual: {current_date}

Responda sempre em português brasileiro, seja preciso e cite legislação quando relevante.',
true, '["company_context", "user_context", "current_date"]'),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'calculation_assistant', 'calculation',
'Você é um especialista em cálculos trabalhistas brasileiros. Realize cálculos precisos de:
- Férias (1/3 constitucional, abono pecuniário)
- Rescisão (aviso prévio, multa FGTS, verbas rescisórias)
- Horas extras (50%, 100%, adicional noturno)
- 13º salário
- Descontos legais (INSS, IRRF)

Dados para cálculo: {calculation_data}
Tipo de cálculo: {calculation_type}

Mostre o cálculo passo a passo e cite a base legal.',
true, '["calculation_data", "calculation_type"]'),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'query_builder', 'query',
'Você é um especialista em transformar perguntas em linguagem natural em consultas SQL seguras.

Esquema do banco de dados:
{database_schema}

Pergunta do usuário: {user_question}

Gere apenas consultas SELECT. Nunca modifique dados. Aplique filtros de tenant_id automaticamente.
Retorne a query SQL e uma explicação do que ela faz.',
true, '["database_schema", "user_question"]');

-- Insert default intents
INSERT INTO ai_intents (id, name, category, training_phrases, action_type, confidence_threshold) VALUES
(gen_random_uuid(), 'query_employee', 'data_query',
'["mostrar funcionários", "listar colaboradores", "quem trabalha no departamento", "funcionários ativos"]',
'database_query', 0.75),

(gen_random_uuid(), 'calculate_vacation', 'calculation',
'["calcular férias", "quanto vou receber de férias", "valor das minhas férias", "simulação de férias"]',
'calculation', 0.80),

(gen_random_uuid(), 'calculate_termination', 'calculation',
'["calcular rescisão", "valor da rescisão", "quanto recebo se for demitido", "verbas rescisórias"]',
'calculation', 0.80),

(gen_random_uuid(), 'query_payroll', 'data_query',
'["ver meu contracheque", "folha de pagamento", "quanto ganhei esse mês", "meus rendimentos"]',
'database_query', 0.75),

(gen_random_uuid(), 'hr_policy', 'information',
'["política de férias", "regras de home office", "código de conduta", "benefícios da empresa"]',
'knowledge_search', 0.70),

(gen_random_uuid(), 'labor_law', 'information',
'["o que diz a CLT sobre", "legislação trabalhista", "direitos do trabalhador", "lei de férias"]',
'knowledge_search', 0.70);

-- Insert default query templates
INSERT INTO query_templates (id, tenant_id, name, intent, sql_template, parameters, examples) VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'list_employees_by_department', 'query_employee',
'SELECT e.id, e.full_name, e.email, e.hire_date, d.name as department, p.title as position
FROM employees e
JOIN departments d ON e.department_id = d.id
JOIN positions p ON e.position_id = p.id
WHERE e.tenant_id = :tenant_id AND e.status = ''ACTIVE''
AND (:department IS NULL OR d.name ILIKE :department)
ORDER BY e.full_name',
'[{"name": "department", "type": "string", "required": false}]',
'["listar funcionários do departamento de TI", "mostrar colaboradores de RH", "quem trabalha em vendas"]'),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'employee_payroll_summary', 'query_payroll',
'SELECT pp.reference_month, pp.gross_salary, pp.net_salary, pp.total_deductions, pp.total_benefits
FROM payroll_periods pp
JOIN employees e ON pp.employee_id = e.id
WHERE e.tenant_id = :tenant_id AND e.id = :employee_id
ORDER BY pp.reference_month DESC LIMIT :limit',
'[{"name": "employee_id", "type": "uuid", "required": true}, {"name": "limit", "type": "integer", "required": false, "default": 12}]',
'["ver meu contracheque", "histórico de pagamentos", "últimos salários"]'),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'vacation_balance', 'calculate_vacation',
'SELECT e.full_name, e.hire_date, v.available_days, v.used_days, v.pending_days, v.acquisition_period_start, v.acquisition_period_end
FROM vacation_balances v
JOIN employees e ON v.employee_id = e.id
WHERE e.tenant_id = :tenant_id AND e.id = :employee_id',
'[{"name": "employee_id", "type": "uuid", "required": true}]',
'["saldo de férias", "quantos dias de férias tenho", "meu período aquisitivo"]');

-- Insert default model configs
INSERT INTO ai_model_configs (id, tenant_id, provider, model_name, purpose, config, is_default) VALUES
(gen_random_uuid(), NULL, 'openai', 'gpt-4-turbo-preview', 'chat',
'{"temperature": 0.7, "max_tokens": 4096, "top_p": 1.0}', true),

(gen_random_uuid(), NULL, 'openai', 'text-embedding-3-small', 'embedding',
'{"dimensions": 1536}', true),

(gen_random_uuid(), NULL, 'anthropic', 'claude-3-sonnet-20240229', 'chat',
'{"temperature": 0.7, "max_tokens": 4096}', false);
