-- Migration para adicionar campos de assinatura e logo nos certificados
ALTER TABLE shared.certificates ADD COLUMN IF NOT EXISTS instructor_name VARCHAR(255);
ALTER TABLE shared.certificates ADD COLUMN IF NOT EXISTS instructor_signature_url VARCHAR(500);
ALTER TABLE shared.certificates ADD COLUMN IF NOT EXISTS general_signer_name VARCHAR(255);
ALTER TABLE shared.certificates ADD COLUMN IF NOT EXISTS general_signature_url VARCHAR(500);
ALTER TABLE shared.certificates ADD COLUMN IF NOT EXISTS company_logo_url VARCHAR(500);

-- Criar tabela de configurações de certificados
CREATE TABLE IF NOT EXISTS shared.certificate_configs (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    course_id UUID,
    instructor_name VARCHAR(255),
    instructor_signature_url VARCHAR(500),
    general_signer_name VARCHAR(255),
    general_signature_url VARCHAR(500),
    company_logo_url VARCHAR(500),
    show_company_logo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    UNIQUE(tenant_id, course_id)
);
