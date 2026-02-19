-- V19 - Tabelas para Contratacao Digital
-- Processo de contratacao digital completo (recrutamento -> colaborador)

CREATE TABLE IF NOT EXISTS shared.digital_hiring_processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Vinculo com recrutamento
    candidate_id UUID,
    vacancy_id UUID,

    -- Token de acesso publico
    access_token VARCHAR(64) NOT NULL UNIQUE,
    link_expires_at TIMESTAMP,
    link_accessed_at TIMESTAMP,
    password_hash VARCHAR(255),

    -- Dados do candidato
    candidate_name VARCHAR(200) NOT NULL,
    candidate_email VARCHAR(200) NOT NULL,
    candidate_cpf VARCHAR(11),
    candidate_phone VARCHAR(20),

    -- Cargo / departamento
    department_id UUID REFERENCES shared.departments(id),
    position_id UUID REFERENCES shared.positions(id),
    employment_type VARCHAR(30),
    base_salary NUMERIC(12,2),
    expected_hire_date DATE,

    -- Status e progresso
    status VARCHAR(30) NOT NULL DEFAULT 'ADMISSION_PENDING',
    current_step INTEGER DEFAULT 1,

    -- Dados preenchidos pelo candidato (JSON)
    personal_data JSONB,
    work_data JSONB,

    -- Contrato e assinatura
    contract_html TEXT,
    contract_generated_at TIMESTAMP,
    contract_signed_at TIMESTAMP,
    contract_signed BOOLEAN DEFAULT FALSE,
    signature_ip VARCHAR(50),
    signature_user_agent VARCHAR(500),
    confidentiality_html TEXT,
    policy_html TEXT,

    -- IA
    ai_consistency_score INTEGER,
    ai_alerts JSONB,

    -- Colaborador criado
    employee_id UUID REFERENCES shared.employees(id),
    registration_number VARCHAR(20),

    -- Auditoria
    notes TEXT,
    cancel_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,

    CONSTRAINT chk_digital_hiring_status CHECK (
        status IN ('ADMISSION_PENDING', 'DOCUMENTS_PENDING', 'DOCUMENTS_VALIDATING',
                   'SIGNATURE_PENDING', 'COMPLETED', 'CANCELLED')
    )
);

CREATE TABLE IF NOT EXISTS shared.digital_hiring_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    digital_hiring_process_id UUID NOT NULL REFERENCES shared.digital_hiring_processes(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size BIGINT,
    content_type VARCHAR(100),
    validation_status VARCHAR(20) DEFAULT 'PENDING',
    validation_message TEXT,
    ocr_data JSONB,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validated_at TIMESTAMP
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_digital_hiring_tenant ON shared.digital_hiring_processes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_digital_hiring_status ON shared.digital_hiring_processes(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_digital_hiring_token ON shared.digital_hiring_processes(access_token);
CREATE INDEX IF NOT EXISTS idx_digital_hiring_candidate ON shared.digital_hiring_processes(tenant_id, candidate_id);
CREATE INDEX IF NOT EXISTS idx_digital_hiring_email ON shared.digital_hiring_processes(tenant_id, candidate_email);
CREATE INDEX IF NOT EXISTS idx_digital_hiring_docs_process ON shared.digital_hiring_documents(digital_hiring_process_id);
