-- =====================================================
-- Integration Service - Schema de Banco de Dados
-- =====================================================

-- Configuracao de certificados digitais
CREATE TABLE digital_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    certificate_type VARCHAR(20) NOT NULL, -- A1, A3
    subject_cn VARCHAR(255),
    issuer VARCHAR(255),
    serial_number VARCHAR(100),
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    thumbprint VARCHAR(100),
    pfx_data BYTEA, -- Certificado criptografado
    password_encrypted VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(tenant_id, thumbprint)
);

CREATE INDEX idx_certificates_tenant ON digital_certificates(tenant_id);
CREATE INDEX idx_certificates_active ON digital_certificates(tenant_id, is_active);

-- Eventos eSocial
CREATE TABLE esocial_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    event_type VARCHAR(10) NOT NULL, -- S-2200, S-2206, S-2299, etc.
    event_version VARCHAR(10) NOT NULL,
    reference_id UUID NOT NULL, -- ID da entidade relacionada (employee_id, etc.)
    reference_type VARCHAR(50) NOT NULL, -- EMPLOYEE, CONTRACT, TERMINATION
    xml_content TEXT NOT NULL,
    xml_signed TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, SENT, ACCEPTED, REJECTED, ERROR
    receipt_number VARCHAR(100),
    protocol_number VARCHAR(100),
    transmission_date TIMESTAMP,
    processing_date TIMESTAMP,
    return_code VARCHAR(20),
    return_message TEXT,
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_esocial_events_tenant ON esocial_events(tenant_id);
CREATE INDEX idx_esocial_events_type ON esocial_events(event_type);
CREATE INDEX idx_esocial_events_status ON esocial_events(status);
CREATE INDEX idx_esocial_events_reference ON esocial_events(reference_id, reference_type);

-- Lotes eSocial
CREATE TABLE esocial_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    batch_type VARCHAR(30) NOT NULL, -- SYNCHRONOUS, ASYNCHRONOUS
    group_id VARCHAR(10) NOT NULL, -- 1 (Eventos Periodicos), 2 (Nao Periodicos), etc.
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    events_count INTEGER DEFAULT 0,
    sent_at TIMESTAMP,
    protocol_number VARCHAR(100),
    receipt_date TIMESTAMP,
    processing_status VARCHAR(30),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_esocial_batches_tenant ON esocial_batches(tenant_id);
CREATE INDEX idx_esocial_batches_status ON esocial_batches(status);

-- Relacao eventos-lotes
CREATE TABLE esocial_batch_events (
    batch_id UUID NOT NULL REFERENCES esocial_batches(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES esocial_events(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL,
    PRIMARY KEY (batch_id, event_id)
);

-- Configuracoes eSocial por tenant
CREATE TABLE esocial_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE,
    environment VARCHAR(20) NOT NULL DEFAULT 'PRODUCTION', -- PRODUCTION, RESTRICTED_PRODUCTION
    employer_type VARCHAR(20) NOT NULL, -- CNPJ, CPF
    employer_registration VARCHAR(20) NOT NULL, -- CNPJ ou CPF
    software_house_cnpj VARCHAR(20),
    software_house_contact VARCHAR(255),
    auto_send_enabled BOOLEAN DEFAULT false,
    retry_enabled BOOLEAN DEFAULT true,
    max_retries INTEGER DEFAULT 3,
    retry_delay_minutes INTEGER DEFAULT 60,
    certificate_id UUID REFERENCES digital_certificates(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Arquivos CNAB (remessa/retorno bancario)
CREATE TABLE cnab_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    file_type VARCHAR(20) NOT NULL, -- REMESSA, RETORNO
    bank_code VARCHAR(10) NOT NULL,
    layout_version VARCHAR(20) NOT NULL, -- CNAB240, CNAB400
    service_type VARCHAR(50) NOT NULL, -- PAGAMENTO_SALARIO, PAGAMENTO_FORNECEDOR, COBRANCA
    file_name VARCHAR(255) NOT NULL,
    file_content TEXT,
    file_hash VARCHAR(100),
    total_records INTEGER,
    total_value DECIMAL(15,2),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, GENERATED, SENT, PROCESSED, ERROR
    processed_records INTEGER,
    error_records INTEGER,
    transmission_date TIMESTAMP,
    return_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_cnab_files_tenant ON cnab_files(tenant_id);
CREATE INDEX idx_cnab_files_type ON cnab_files(file_type);
CREATE INDEX idx_cnab_files_status ON cnab_files(status);

-- Registros individuais do CNAB
CREATE TABLE cnab_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES cnab_files(id) ON DELETE CASCADE,
    record_type VARCHAR(20) NOT NULL, -- HEADER, DETAIL, TRAILER
    segment_type VARCHAR(5), -- A, B, C, J, etc.
    sequence_number INTEGER NOT NULL,
    reference_id UUID, -- ID da entidade relacionada
    reference_type VARCHAR(50), -- EMPLOYEE, SUPPLIER
    beneficiary_name VARCHAR(255),
    beneficiary_document VARCHAR(20),
    bank_account VARCHAR(50),
    value DECIMAL(15,2),
    due_date DATE,
    status VARCHAR(30) DEFAULT 'PENDING',
    return_code VARCHAR(10),
    return_message VARCHAR(255),
    raw_data TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cnab_records_file ON cnab_records(file_id);
CREATE INDEX idx_cnab_records_reference ON cnab_records(reference_id, reference_type);

-- Configuracoes bancarias
CREATE TABLE bank_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    bank_code VARCHAR(10) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    agency VARCHAR(20) NOT NULL,
    account_number VARCHAR(30) NOT NULL,
    account_digit VARCHAR(5),
    account_type VARCHAR(20) NOT NULL, -- CORRENTE, POUPANCA
    agreement_code VARCHAR(50),
    layout_version VARCHAR(20) NOT NULL,
    sftp_host VARCHAR(255),
    sftp_port INTEGER DEFAULT 22,
    sftp_username VARCHAR(100),
    sftp_password_encrypted VARCHAR(500),
    sftp_remote_path VARCHAR(255),
    auto_transmission BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(tenant_id, bank_code, agency, account_number)
);

CREATE INDEX idx_bank_configs_tenant ON bank_configs(tenant_id);

-- Integracoes contabeis
CREATE TABLE accounting_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    integration_type VARCHAR(50) NOT NULL, -- ERP, CONTABILIDADE, FISCAL
    provider VARCHAR(100) NOT NULL, -- SAP, TOTVS, SENIOR, etc.
    api_url VARCHAR(500),
    api_key_encrypted VARCHAR(500),
    auth_type VARCHAR(30), -- API_KEY, OAUTH2, BASIC
    oauth_client_id VARCHAR(255),
    oauth_client_secret_encrypted VARCHAR(500),
    oauth_token_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    sync_interval_minutes INTEGER DEFAULT 60,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_accounting_tenant ON accounting_integrations(tenant_id);

-- Lancamentos contabeis
CREATE TABLE accounting_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    integration_id UUID REFERENCES accounting_integrations(id),
    entry_type VARCHAR(50) NOT NULL, -- FOLHA, PROVISAO_FERIAS, PROVISAO_13, RESCISAO
    reference_month DATE NOT NULL,
    cost_center VARCHAR(50),
    account_debit VARCHAR(50) NOT NULL,
    account_credit VARCHAR(50) NOT NULL,
    value DECIMAL(15,2) NOT NULL,
    description VARCHAR(255),
    reference_id UUID,
    reference_type VARCHAR(50),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, SENT, CONFIRMED, ERROR
    external_id VARCHAR(100),
    sent_at TIMESTAMP,
    confirmed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accounting_entries_tenant ON accounting_entries(tenant_id);
CREATE INDEX idx_accounting_entries_month ON accounting_entries(reference_month);
CREATE INDEX idx_accounting_entries_status ON accounting_entries(status);

-- Webhooks configurados
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    url VARCHAR(500) NOT NULL,
    secret_key VARCHAR(255),
    events TEXT[] NOT NULL, -- Lista de eventos que disparam o webhook
    http_method VARCHAR(10) DEFAULT 'POST',
    headers JSONB,
    is_active BOOLEAN DEFAULT true,
    retry_enabled BOOLEAN DEFAULT true,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_webhooks_tenant ON webhooks(tenant_id);
CREATE INDEX idx_webhooks_active ON webhooks(tenant_id, is_active);

-- Historico de chamadas de webhook
CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    response_time_ms INTEGER,
    attempt_number INTEGER DEFAULT 1,
    success BOOLEAN,
    error_message TEXT,
    delivered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_date ON webhook_deliveries(delivered_at);

-- Jobs de integracao agendados
CREATE TABLE integration_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    job_type VARCHAR(50) NOT NULL, -- ESOCIAL_SYNC, CNAB_EXPORT, ACCOUNTING_SYNC
    schedule_cron VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP,
    last_run_status VARCHAR(30),
    last_run_message TEXT,
    next_run_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_integration_jobs_tenant ON integration_jobs(tenant_id);
CREATE INDEX idx_integration_jobs_next_run ON integration_jobs(next_run_at) WHERE is_active = true;
