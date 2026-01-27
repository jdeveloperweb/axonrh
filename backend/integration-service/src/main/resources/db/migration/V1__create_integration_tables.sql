-- =====================================================
-- Integration Service - Schema de Banco de Dados
-- =====================================================

-- Configuracao de certificados digitais
CREATE TABLE digital_certificates (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- A1, A3
    certificate_data BYTEA NOT NULL,
    password VARCHAR(255) NOT NULL,
    serial_number VARCHAR(255),
    issuer_name VARCHAR(255),
    subject_name VARCHAR(255),
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_certificates_tenant ON digital_certificates(tenant_id);

-- Webhooks configurados
CREATE TABLE webhooks (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_url VARCHAR(255) NOT NULL,
    http_method VARCHAR(10) NOT NULL DEFAULT 'POST',
    event_type VARCHAR(50) NOT NULL,
    secret_key VARCHAR(255),
    headers TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    retry_count INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 30,
    last_triggered_at TIMESTAMP,
    last_status VARCHAR(50),
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_webhooks_tenant ON webhooks(tenant_id);
CREATE INDEX idx_webhooks_active ON webhooks(tenant_id, is_active);

-- Historico de chamadas de webhook
CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    webhook_id UUID NOT NULL REFERENCES webhooks(id),
    event_type VARCHAR(50) NOT NULL,
    request_url VARCHAR(255) NOT NULL,
    request_method VARCHAR(10),
    request_payload TEXT,
    status VARCHAR(50) NOT NULL,
    response_status_code INTEGER,
    response_body TEXT,
    error_message TEXT,
    duration_ms INTEGER,
    retry_count INTEGER DEFAULT 0,
    original_delivery_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_tenant ON webhook_deliveries(tenant_id);

-- Eventos eSocial
CREATE TABLE esocial_events (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_version VARCHAR(20) NOT NULL,
    reference_id UUID NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    xml_content TEXT NOT NULL,
    xml_signed TEXT,
    status VARCHAR(50) NOT NULL,
    receipt_number VARCHAR(100),
    protocol_number VARCHAR(100),
    transmission_date TIMESTAMP,
    processing_date TIMESTAMP,
    return_code VARCHAR(50),
    return_message TEXT,
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_esocial_events_tenant ON esocial_events(tenant_id);
CREATE INDEX idx_esocial_events_status ON esocial_events(status);

-- Arquivos CNAB (remessa/retorno bancario)
CREATE TABLE cnab_files (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    cnab_layout VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    bank_code VARCHAR(3) NOT NULL,
    bank_name VARCHAR(255),
    company_code VARCHAR(20),
    reference_date DATE NOT NULL,
    generation_date DATE NOT NULL,
    sequence_number INTEGER NOT NULL,
    total_records INTEGER,
    total_amount DECIMAL(15,2),
    status VARCHAR(50) NOT NULL,
    file_content BYTEA,
    return_file_name VARCHAR(255),
    return_file_content BYTEA,
    processed_at TIMESTAMP,
    error_message TEXT,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_cnab_files_tenant ON cnab_files(tenant_id);

-- Registros individuais do CNAB
CREATE TABLE cnab_records (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    cnab_file_id UUID NOT NULL REFERENCES cnab_files(id),
    record_type VARCHAR(50) NOT NULL,
    sequence_number INTEGER NOT NULL,
    employee_id UUID,
    employee_name VARCHAR(255),
    employee_cpf VARCHAR(11),
    bank_code VARCHAR(3),
    branch_code VARCHAR(5),
    branch_digit VARCHAR(1),
    account_number VARCHAR(12),
    account_digit VARCHAR(2),
    account_type VARCHAR(20),
    amount DECIMAL(15,2),
    payment_date DATE,
    payment_type VARCHAR(50),
    reference_code VARCHAR(50),
    description VARCHAR(40),
    status VARCHAR(50),
    return_code VARCHAR(2),
    return_message VARCHAR(255),
    processed_at TIMESTAMP,
    raw_content TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cnab_records_file ON cnab_records(cnab_file_id);

-- Exportacoes Contabeis
CREATE TABLE accounting_exports (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    export_type VARCHAR(50) NOT NULL,
    accounting_system VARCHAR(50) NOT NULL,
    reference_month DATE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    file_name VARCHAR(255),
    file_content BYTEA,
    total_entries INTEGER,
    total_debit DECIMAL(15,2),
    total_credit DECIMAL(15,2),
    error_message TEXT,
    exported_at TIMESTAMP,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accounting_exports_tenant ON accounting_exports(tenant_id);

-- Lancamentos contabeis
CREATE TABLE accounting_entries (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    accounting_export_id UUID NOT NULL REFERENCES accounting_exports(id),
    entry_date DATE NOT NULL,
    sequence_number INTEGER NOT NULL,
    entry_type VARCHAR(50) NOT NULL,
    debit_account VARCHAR(20),
    debit_account_name VARCHAR(255),
    credit_account VARCHAR(20),
    credit_account_name VARCHAR(255),
    cost_center VARCHAR(20),
    cost_center_name VARCHAR(255),
    amount DECIMAL(15,2) NOT NULL,
    description VARCHAR(200),
    history_code VARCHAR(10),
    document_number VARCHAR(30),
    employee_id UUID,
    employee_name VARCHAR(255),
    rubric_code VARCHAR(10),
    rubric_name VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accounting_entries_export ON accounting_entries(accounting_export_id);
