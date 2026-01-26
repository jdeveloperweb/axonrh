-- ============================================================
-- T096-T102: Tabelas do Employee Service
-- Schema: shared (metadados) e tenant_* (dados por tenant)
-- ============================================================

-- ============================================================
-- T100: Tabela de Departamentos
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES departments(id),
    manager_id UUID,
    cost_center_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,

    CONSTRAINT uk_departments_code_tenant UNIQUE (tenant_id, code)
);

CREATE INDEX idx_departments_tenant ON departments(tenant_id);
CREATE INDEX idx_departments_parent ON departments(parent_id);
CREATE INDEX idx_departments_active ON departments(tenant_id, is_active);

COMMENT ON TABLE departments IS 'Departamentos/areas da empresa';

-- ============================================================
-- T101: Tabela de Cargos (Positions)
-- ============================================================
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(20) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    cbo_code VARCHAR(10),
    salary_range_min DECIMAL(15,2),
    salary_range_max DECIMAL(15,2),
    level VARCHAR(20),
    department_id UUID REFERENCES departments(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,

    CONSTRAINT uk_positions_code_tenant UNIQUE (tenant_id, code)
);

CREATE INDEX idx_positions_tenant ON positions(tenant_id);
CREATE INDEX idx_positions_department ON positions(department_id);
CREATE INDEX idx_positions_cbo ON positions(cbo_code);

COMMENT ON TABLE positions IS 'Cargos disponiveis na empresa';
COMMENT ON COLUMN positions.cbo_code IS 'Codigo Brasileiro de Ocupacoes';

-- ============================================================
-- T102: Tabela de Centros de Custo
-- ============================================================
CREATE TABLE IF NOT EXISTS cost_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES cost_centers(id),
    budget_annual DECIMAL(15,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,

    CONSTRAINT uk_cost_centers_code_tenant UNIQUE (tenant_id, code)
);

CREATE INDEX idx_cost_centers_tenant ON cost_centers(tenant_id);
CREATE INDEX idx_cost_centers_parent ON cost_centers(parent_id);

COMMENT ON TABLE cost_centers IS 'Centros de custo para alocacao de despesas';

-- ============================================================
-- T096: Tabela de Colaboradores (Employees)
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Dados Pessoais
    registration_number VARCHAR(20),
    cpf VARCHAR(11) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    social_name VARCHAR(200),
    birth_date DATE NOT NULL,
    gender VARCHAR(20),
    marital_status VARCHAR(20),
    nationality VARCHAR(50) DEFAULT 'Brasileira',
    birth_city VARCHAR(100),
    birth_state VARCHAR(2),
    mother_name VARCHAR(200),
    father_name VARCHAR(200),

    -- Documentos
    rg_number VARCHAR(20),
    rg_issuer VARCHAR(20),
    rg_state VARCHAR(2),
    rg_issue_date DATE,
    pis_pasep VARCHAR(15),
    ctps_number VARCHAR(20),
    ctps_series VARCHAR(10),
    ctps_state VARCHAR(2),
    ctps_issue_date DATE,
    voter_title VARCHAR(20),
    voter_zone VARCHAR(10),
    voter_section VARCHAR(10),
    military_certificate VARCHAR(20),
    driver_license VARCHAR(20),
    driver_license_category VARCHAR(5),
    driver_license_expiry DATE,

    -- Contato
    email VARCHAR(200) NOT NULL,
    personal_email VARCHAR(200),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),

    -- Endereco
    address_street VARCHAR(200),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zip_code VARCHAR(10),
    address_country VARCHAR(50) DEFAULT 'Brasil',

    -- Dados Profissionais
    department_id UUID REFERENCES departments(id),
    position_id UUID REFERENCES positions(id),
    cost_center_id UUID REFERENCES cost_centers(id),
    manager_id UUID REFERENCES employees(id),
    hire_date DATE NOT NULL,
    termination_date DATE,
    employment_type VARCHAR(30) NOT NULL,
    work_regime VARCHAR(30),
    weekly_hours INTEGER DEFAULT 44,
    shift VARCHAR(50),

    -- Dados Bancarios
    bank_code VARCHAR(10),
    bank_name VARCHAR(100),
    bank_agency VARCHAR(10),
    bank_agency_digit VARCHAR(2),
    bank_account VARCHAR(20),
    bank_account_digit VARCHAR(2),
    bank_account_type VARCHAR(20),
    pix_key VARCHAR(100),
    pix_key_type VARCHAR(20),

    -- Salario e Beneficios
    base_salary DECIMAL(15,2),
    salary_type VARCHAR(20),

    -- Foto
    photo_url VARCHAR(500),

    -- Status e Controle
    status VARCHAR(20) DEFAULT 'ACTIVE',
    user_id UUID,
    is_active BOOLEAN DEFAULT TRUE,

    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,

    CONSTRAINT uk_employees_cpf_tenant UNIQUE (tenant_id, cpf),
    CONSTRAINT uk_employees_email_tenant UNIQUE (tenant_id, email),
    CONSTRAINT uk_employees_registration_tenant UNIQUE (tenant_id, registration_number)
);

CREATE INDEX idx_employees_tenant ON employees(tenant_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_position ON employees(position_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_status ON employees(tenant_id, status);
CREATE INDEX idx_employees_name ON employees(tenant_id, full_name);
CREATE INDEX idx_employees_hire_date ON employees(tenant_id, hire_date);
CREATE INDEX idx_employees_cpf ON employees(cpf);

COMMENT ON TABLE employees IS 'Cadastro completo de colaboradores';
COMMENT ON COLUMN employees.employment_type IS 'CLT, PJ, ESTAGIARIO, TEMPORARIO, APRENDIZ';
COMMENT ON COLUMN employees.work_regime IS 'PRESENCIAL, REMOTO, HIBRIDO';
COMMENT ON COLUMN employees.status IS 'ACTIVE, INACTIVE, ON_LEAVE, TERMINATED, PENDING';

-- ============================================================
-- T097: Tabela de Documentos do Colaborador
-- ============================================================
CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

    document_type VARCHAR(50) NOT NULL,
    document_name VARCHAR(200) NOT NULL,
    file_name VARCHAR(200) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    description TEXT,

    expiration_date DATE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    verified_by UUID,

    ocr_extracted_data JSONB,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_employee_documents_employee ON employee_documents(employee_id);
CREATE INDEX idx_employee_documents_type ON employee_documents(tenant_id, document_type);
CREATE INDEX idx_employee_documents_expiration ON employee_documents(expiration_date) WHERE expiration_date IS NOT NULL;

COMMENT ON TABLE employee_documents IS 'Documentos digitalizados dos colaboradores';
COMMENT ON COLUMN employee_documents.document_type IS 'RG, CPF, CTPS, CNH, CERTIDAO_NASCIMENTO, COMPROVANTE_RESIDENCIA, etc';
COMMENT ON COLUMN employee_documents.ocr_extracted_data IS 'Dados extraidos automaticamente via OCR';

-- ============================================================
-- T098: Tabela de Dependentes
-- ============================================================
CREATE TABLE IF NOT EXISTS employee_dependents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

    full_name VARCHAR(200) NOT NULL,
    relationship VARCHAR(30) NOT NULL,
    birth_date DATE NOT NULL,
    cpf VARCHAR(11),
    gender VARCHAR(20),

    -- Beneficios
    is_ir_dependent BOOLEAN DEFAULT FALSE,
    is_health_plan_dependent BOOLEAN DEFAULT FALSE,
    is_allowance_dependent BOOLEAN DEFAULT FALSE,

    -- Documentos
    birth_certificate_number VARCHAR(50),

    -- Controle
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_employee_dependents_employee ON employee_dependents(employee_id);
CREATE INDEX idx_employee_dependents_ir ON employee_dependents(employee_id, is_ir_dependent) WHERE is_ir_dependent = TRUE;

COMMENT ON TABLE employee_dependents IS 'Dependentes dos colaboradores';
COMMENT ON COLUMN employee_dependents.relationship IS 'SPOUSE, CHILD, PARENT, OTHER';

-- ============================================================
-- T099: Tabela de Historico do Colaborador
-- ============================================================
CREATE TABLE IF NOT EXISTS employee_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

    change_type VARCHAR(50) NOT NULL,
    changed_field VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    change_reason TEXT,
    effective_date DATE,

    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by UUID,

    metadata JSONB
);

CREATE INDEX idx_employee_history_employee ON employee_history(employee_id);
CREATE INDEX idx_employee_history_type ON employee_history(tenant_id, change_type);
CREATE INDEX idx_employee_history_date ON employee_history(changed_at DESC);
CREATE INDEX idx_employee_history_field ON employee_history(changed_field);

COMMENT ON TABLE employee_history IS 'Historico de alteracoes dos colaboradores para auditoria';
COMMENT ON COLUMN employee_history.change_type IS 'CREATE, UPDATE, DELETE, PROMOTION, TRANSFER, SALARY_CHANGE, TERMINATION';

-- ============================================================
-- Tabela de Contratos
-- ============================================================
CREATE TABLE IF NOT EXISTS employee_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

    contract_type VARCHAR(30) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    trial_period_end DATE,

    base_salary DECIMAL(15,2),
    salary_type VARCHAR(20),
    weekly_hours INTEGER,

    document_url VARCHAR(500),
    signed_at TIMESTAMP,
    signed_by_employee BOOLEAN DEFAULT FALSE,
    signed_by_company BOOLEAN DEFAULT FALSE,

    status VARCHAR(20) DEFAULT 'ACTIVE',
    termination_reason TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_employee_contracts_employee ON employee_contracts(employee_id);
CREATE INDEX idx_employee_contracts_status ON employee_contracts(tenant_id, status);

COMMENT ON TABLE employee_contracts IS 'Contratos de trabalho dos colaboradores';

-- ============================================================
-- Funcao para atualizar updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cost_centers_updated_at BEFORE UPDATE ON cost_centers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_documents_updated_at BEFORE UPDATE ON employee_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_dependents_updated_at BEFORE UPDATE ON employee_dependents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_contracts_updated_at BEFORE UPDATE ON employee_contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
