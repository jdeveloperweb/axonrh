-- =============================================
-- AxonRH Benefits Service - Schema Inicial
-- Modulo de Gestao de Beneficios
-- =============================================

-- Funcao para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- Tabela: benefit_types (Tipos de beneficio)
-- =============================================
CREATE TABLE IF NOT EXISTS benefit_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    category VARCHAR(20) NOT NULL CHECK (category IN ('EARNING', 'DEDUCTION')),
    calculation_type VARCHAR(30) NOT NULL CHECK (calculation_type IN ('FIXED_VALUE', 'SALARY_PERCENTAGE')),
    default_value NUMERIC(12,2),
    default_percentage NUMERIC(6,2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    CONSTRAINT uk_benefit_types_name_tenant UNIQUE (tenant_id, name)
);

CREATE INDEX idx_benefit_types_tenant ON benefit_types(tenant_id);
CREATE INDEX idx_benefit_types_active ON benefit_types(tenant_id, is_active);
CREATE INDEX idx_benefit_types_category ON benefit_types(tenant_id, category);

CREATE TRIGGER update_benefit_types_updated_at
    BEFORE UPDATE ON benefit_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Tabela: employee_benefits (Beneficios do colaborador)
-- =============================================
CREATE TABLE IF NOT EXISTS employee_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    employee_name VARCHAR(200) NOT NULL,
    benefit_type_id UUID NOT NULL REFERENCES benefit_types(id),
    fixed_value NUMERIC(12,2),
    percentage NUMERIC(6,2),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'SCHEDULED', 'CANCELLED')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID
);

CREATE INDEX idx_employee_benefits_tenant ON employee_benefits(tenant_id);
CREATE INDEX idx_employee_benefits_employee ON employee_benefits(tenant_id, employee_id);
CREATE INDEX idx_employee_benefits_status ON employee_benefits(tenant_id, status);
CREATE INDEX idx_employee_benefits_type ON employee_benefits(benefit_type_id);
CREATE INDEX idx_employee_benefits_period ON employee_benefits(tenant_id, employee_id, start_date, end_date);

CREATE TRIGGER update_employee_benefits_updated_at
    BEFORE UPDATE ON employee_benefits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Tabela: benefit_history (Historico de alteracoes)
-- =============================================
CREATE TABLE IF NOT EXISTS benefit_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    employee_benefit_id UUID NOT NULL,
    benefit_type_name VARCHAR(150) NOT NULL,
    action VARCHAR(30) NOT NULL,
    old_value NUMERIC(12,2),
    new_value NUMERIC(12,2),
    old_percentage NUMERIC(6,2),
    new_percentage NUMERIC(6,2),
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    notes TEXT,
    changed_at TIMESTAMP DEFAULT NOW(),
    changed_by UUID
);

CREATE INDEX idx_benefit_history_tenant ON benefit_history(tenant_id);
CREATE INDEX idx_benefit_history_employee ON benefit_history(tenant_id, employee_id);
CREATE INDEX idx_benefit_history_benefit ON benefit_history(employee_benefit_id);
CREATE INDEX idx_benefit_history_date ON benefit_history(tenant_id, changed_at);
