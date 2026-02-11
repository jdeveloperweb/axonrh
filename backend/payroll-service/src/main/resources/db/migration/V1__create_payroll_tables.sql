-- =============================================
-- AxonRH Payroll Service - Schema Inicial
-- Modulo de Folha de Pagamento
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
-- Tabela: payroll_runs (Fechamentos mensais)
-- =============================================
CREATE TABLE IF NOT EXISTS payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    reference_month INTEGER NOT NULL CHECK (reference_month BETWEEN 1 AND 12),
    reference_year INTEGER NOT NULL CHECK (reference_year >= 2020),
    description VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
        CHECK (status IN ('OPEN', 'PROCESSING', 'PROCESSED', 'CLOSED', 'CANCELLED')),
    total_employees INTEGER DEFAULT 0,
    processed_employees INTEGER DEFAULT 0,
    failed_employees INTEGER DEFAULT 0,
    total_earnings NUMERIC(14,2) DEFAULT 0,
    total_deductions NUMERIC(14,2) DEFAULT 0,
    total_net_salary NUMERIC(14,2) DEFAULT 0,
    total_fgts NUMERIC(14,2) DEFAULT 0,
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    closed_at TIMESTAMP,
    closed_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID
);

CREATE INDEX idx_payroll_runs_tenant ON payroll_runs(tenant_id);
CREATE INDEX idx_payroll_runs_competency ON payroll_runs(tenant_id, reference_year, reference_month);
CREATE INDEX idx_payroll_runs_status ON payroll_runs(tenant_id, status);

CREATE TRIGGER update_payroll_runs_updated_at
    BEFORE UPDATE ON payroll_runs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Tabela: payrolls (Folha individual por colaborador)
-- =============================================
CREATE TABLE IF NOT EXISTS payrolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    employee_name VARCHAR(200) NOT NULL,
    employee_cpf VARCHAR(11),
    department_name VARCHAR(150),
    position_name VARCHAR(150),
    reference_month INTEGER NOT NULL CHECK (reference_month BETWEEN 1 AND 12),
    reference_year INTEGER NOT NULL CHECK (reference_year >= 2020),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'CALCULATED', 'RECALCULATED', 'APPROVED', 'CLOSED', 'CANCELLED')),
    base_salary NUMERIC(12,2) NOT NULL,
    total_earnings NUMERIC(12,2) DEFAULT 0,
    total_deductions NUMERIC(12,2) DEFAULT 0,
    net_salary NUMERIC(12,2) DEFAULT 0,
    fgts_amount NUMERIC(12,2) DEFAULT 0,
    calculation_version INTEGER DEFAULT 1,
    notes TEXT,
    payroll_run_id UUID REFERENCES payroll_runs(id),
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID
);

CREATE INDEX idx_payrolls_tenant ON payrolls(tenant_id);
CREATE INDEX idx_payrolls_employee ON payrolls(tenant_id, employee_id);
CREATE INDEX idx_payrolls_competency ON payrolls(tenant_id, reference_year, reference_month);
CREATE INDEX idx_payrolls_status ON payrolls(tenant_id, status);
CREATE INDEX idx_payrolls_run ON payrolls(payroll_run_id);
CREATE UNIQUE INDEX idx_payrolls_unique_employee_competency
    ON payrolls(tenant_id, employee_id, reference_month, reference_year)
    WHERE status != 'CANCELLED';

CREATE TRIGGER update_payrolls_updated_at
    BEFORE UPDATE ON payrolls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Tabela: payroll_items (Proventos e Descontos)
-- =============================================
CREATE TABLE IF NOT EXISTS payroll_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    payroll_id UUID NOT NULL REFERENCES payrolls(id) ON DELETE CASCADE,
    type VARCHAR(15) NOT NULL CHECK (type IN ('EARNING', 'DEDUCTION')),
    code VARCHAR(30) NOT NULL,
    description VARCHAR(200) NOT NULL,
    reference_value NUMERIC(12,4),
    quantity NUMERIC(8,2),
    percentage NUMERIC(6,2),
    amount NUMERIC(12,2) NOT NULL,
    sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_payroll_items_payroll ON payroll_items(payroll_id);
CREATE INDEX idx_payroll_items_tenant ON payroll_items(tenant_id);

-- =============================================
-- Tabela: tax_brackets (Faixas tributarias configuraveis)
-- =============================================
CREATE TABLE IF NOT EXISTS tax_brackets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    tax_type VARCHAR(10) NOT NULL CHECK (tax_type IN ('INSS', 'IRRF')),
    bracket_order INTEGER NOT NULL,
    min_value NUMERIC(12,2) NOT NULL,
    max_value NUMERIC(12,2),
    rate NUMERIC(6,2) NOT NULL,
    deduction_amount NUMERIC(12,2) DEFAULT 0,
    effective_from DATE NOT NULL,
    effective_until DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tax_brackets_tenant ON tax_brackets(tenant_id);
CREATE INDEX idx_tax_brackets_type ON tax_brackets(tenant_id, tax_type, is_active);
CREATE INDEX idx_tax_brackets_effective ON tax_brackets(tenant_id, tax_type, effective_from, effective_until);

CREATE TRIGGER update_tax_brackets_updated_at
    BEFORE UPDATE ON tax_brackets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
