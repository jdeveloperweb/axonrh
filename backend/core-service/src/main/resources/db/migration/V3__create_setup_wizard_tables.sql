-- Setup Wizard Tables

-- =====================================================
-- Setup Progress Tracking
-- =====================================================
CREATE TABLE setup_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE,
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER DEFAULT 9,
    status VARCHAR(20) DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, COMPLETED, PAUSED

    -- Step completion flags
    step1_company_data BOOLEAN DEFAULT false,
    step2_org_structure BOOLEAN DEFAULT false,
    step3_labor_rules BOOLEAN DEFAULT false,
    step4_branding BOOLEAN DEFAULT false,
    step5_modules BOOLEAN DEFAULT false,
    step6_users BOOLEAN DEFAULT false,
    step7_integrations BOOLEAN DEFAULT false,
    step8_data_import BOOLEAN DEFAULT false,
    step9_review BOOLEAN DEFAULT false,

    -- Progress data (JSON)
    step1_data JSONB,
    step2_data JSONB,
    step3_data JSONB,
    step4_data JSONB,
    step5_data JSONB,
    step6_data JSONB,
    step7_data JSONB,
    step8_data JSONB,
    step9_data JSONB,

    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_setup_progress_tenant ON setup_progress(tenant_id);
CREATE INDEX idx_setup_progress_status ON setup_progress(status);

-- =====================================================
-- Company Profile (Step 1)
-- =====================================================
CREATE TABLE company_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE,

    -- Legal Information
    legal_name VARCHAR(200) NOT NULL,
    trade_name VARCHAR(200),
    cnpj VARCHAR(14) NOT NULL,
    state_registration VARCHAR(20),
    municipal_registration VARCHAR(20),

    -- Contact
    email VARCHAR(255),
    phone VARCHAR(20),
    website VARCHAR(255),

    -- Address
    address_street VARCHAR(200),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zip_code VARCHAR(8),
    address_country VARCHAR(50) DEFAULT 'Brasil',

    -- Company Details
    company_size VARCHAR(20), -- MICRO, SMALL, MEDIUM, LARGE
    industry VARCHAR(100),
    cnae_code VARCHAR(10),
    founding_date DATE,
    employee_count INTEGER,

    -- Tax Regime
    tax_regime VARCHAR(50), -- SIMPLES, LUCRO_PRESUMIDO, LUCRO_REAL

    -- Responsible
    legal_representative_name VARCHAR(200),
    legal_representative_cpf VARCHAR(11),
    legal_representative_role VARCHAR(100),

    -- Accounting
    accountant_name VARCHAR(200),
    accountant_crc VARCHAR(20),
    accountant_email VARCHAR(255),
    accountant_phone VARCHAR(20),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_company_profiles_tenant ON company_profiles(tenant_id);
CREATE INDEX idx_company_profiles_cnpj ON company_profiles(cnpj);

-- =====================================================
-- Labor Rules Configuration (Step 3)
-- =====================================================
CREATE TABLE labor_rules_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE,

    -- Work Schedule
    default_weekly_hours INTEGER DEFAULT 44,
    default_daily_hours INTEGER DEFAULT 8,
    work_week_type VARCHAR(20) DEFAULT 'STANDARD', -- STANDARD, 6X1, 12X36, CUSTOM

    -- Overtime
    overtime_calculation_method VARCHAR(20) DEFAULT 'STANDARD',
    overtime_50_percent BOOLEAN DEFAULT true,
    overtime_100_percent BOOLEAN DEFAULT true,
    overtime_limit_daily INTEGER DEFAULT 2,
    overtime_limit_monthly INTEGER,
    overtime_requires_approval BOOLEAN DEFAULT true,

    -- Time & Attendance
    tolerance_minutes INTEGER DEFAULT 10,
    punch_rounding_minutes INTEGER DEFAULT 5,
    require_lunch_punch BOOLEAN DEFAULT true,
    min_lunch_duration INTEGER DEFAULT 60,
    max_lunch_duration INTEGER DEFAULT 120,

    -- Night Shift
    night_shift_start TIME DEFAULT '22:00:00',
    night_shift_end TIME DEFAULT '05:00:00',
    night_shift_reduction BOOLEAN DEFAULT true,
    night_shift_additional DECIMAL(5,2) DEFAULT 20.00,

    -- Vacation
    vacation_annual_days INTEGER DEFAULT 30,
    vacation_proportional BOOLEAN DEFAULT true,
    vacation_abono_enabled BOOLEAN DEFAULT true,
    vacation_max_split INTEGER DEFAULT 3,
    vacation_min_period INTEGER DEFAULT 5,
    vacation_advance_salary BOOLEAN DEFAULT true,

    -- Benefits
    transport_voucher_enabled BOOLEAN DEFAULT true,
    transport_voucher_discount DECIMAL(5,2) DEFAULT 6.00,
    meal_voucher_enabled BOOLEAN DEFAULT false,
    meal_voucher_discount DECIMAL(5,2) DEFAULT 20.00,

    -- Holidays
    follow_national_holidays BOOLEAN DEFAULT true,
    follow_state_holidays BOOLEAN DEFAULT true,
    follow_municipal_holidays BOOLEAN DEFAULT true,
    custom_holidays JSONB DEFAULT '[]',

    -- Union
    union_name VARCHAR(200),
    union_cnpj VARCHAR(14),
    collective_agreement_expiry DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_labor_rules_config_tenant ON labor_rules_config(tenant_id);

-- =====================================================
-- Branding Configuration (Step 4)
-- =====================================================
CREATE TABLE branding_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE,

    -- Logo
    logo_url VARCHAR(500),
    logo_dark_url VARCHAR(500),
    favicon_url VARCHAR(500),

    -- Colors
    primary_color VARCHAR(7) DEFAULT '#3B82F6',
    secondary_color VARCHAR(7) DEFAULT '#10B981',
    accent_color VARCHAR(7) DEFAULT '#F59E0B',
    background_color VARCHAR(7) DEFAULT '#FFFFFF',
    text_color VARCHAR(7) DEFAULT '#1F2937',

    -- Dark Mode Colors
    dark_background_color VARCHAR(7) DEFAULT '#1F2937',
    dark_text_color VARCHAR(7) DEFAULT '#F9FAFB',

    -- Typography
    font_family VARCHAR(100) DEFAULT 'Inter',
    heading_font_family VARCHAR(100),

    -- Custom CSS
    custom_css TEXT,

    -- Email Branding
    email_header_html TEXT,
    email_footer_html TEXT,
    email_signature TEXT,

    -- Portal Customization
    login_background_url VARCHAR(500),
    login_message TEXT,
    welcome_message TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_branding_config_tenant ON branding_config(tenant_id);

-- =====================================================
-- Module Configuration (Step 5)
-- =====================================================
CREATE TABLE module_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE,

    -- Core Modules
    module_employees BOOLEAN DEFAULT true,
    module_timesheet BOOLEAN DEFAULT true,
    module_vacation BOOLEAN DEFAULT true,
    module_payroll BOOLEAN DEFAULT false,

    -- Advanced Modules
    module_performance BOOLEAN DEFAULT false,
    module_learning BOOLEAN DEFAULT false,
    module_recruitment BOOLEAN DEFAULT false,
    module_benefits BOOLEAN DEFAULT false,

    -- Integration Modules
    module_esocial BOOLEAN DEFAULT false,
    module_accounting BOOLEAN DEFAULT false,
    module_banking BOOLEAN DEFAULT false,

    -- AI Features
    module_ai_assistant BOOLEAN DEFAULT false,
    module_ai_analytics BOOLEAN DEFAULT false,

    -- Mobile
    module_mobile_app BOOLEAN DEFAULT false,
    module_kiosk BOOLEAN DEFAULT false,

    -- Feature Flags
    features JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_module_config_tenant ON module_config(tenant_id);

-- =====================================================
-- Integration Configuration (Step 7)
-- =====================================================
CREATE TABLE integration_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE,

    -- eSocial
    esocial_enabled BOOLEAN DEFAULT false,
    esocial_environment VARCHAR(20) DEFAULT 'PRODUCAO_RESTRITA',
    esocial_certificate_id UUID,
    esocial_employer_type VARCHAR(20),
    esocial_process_type VARCHAR(20),

    -- Banking
    banking_enabled BOOLEAN DEFAULT false,
    banking_primary_bank VARCHAR(3),
    banking_account_type VARCHAR(20),
    banking_agency VARCHAR(10),
    banking_account VARCHAR(20),
    banking_agreement_code VARCHAR(50),

    -- Accounting
    accounting_enabled BOOLEAN DEFAULT false,
    accounting_system VARCHAR(50),
    accounting_export_format VARCHAR(20),
    accounting_chart_mapping JSONB,

    -- SSO
    sso_enabled BOOLEAN DEFAULT false,
    sso_provider VARCHAR(50),
    sso_client_id VARCHAR(200),
    sso_tenant_id VARCHAR(200),
    sso_domain VARCHAR(200),

    -- API
    api_enabled BOOLEAN DEFAULT false,
    api_rate_limit INTEGER DEFAULT 1000,
    api_allowed_ips TEXT[],

    -- Webhooks
    webhooks_enabled BOOLEAN DEFAULT false,
    webhooks_secret_key VARCHAR(200),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_integration_config_tenant ON integration_config(tenant_id);

-- =====================================================
-- Data Import Jobs (Step 8)
-- =====================================================
CREATE TABLE import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    import_type VARCHAR(50) NOT NULL, -- EMPLOYEES, DEPARTMENTS, POSITIONS, PAYROLL_HISTORY
    file_name VARCHAR(255),
    file_size INTEGER,
    file_url VARCHAR(500),

    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, VALIDATING, PROCESSING, COMPLETED, FAILED, ROLLED_BACK

    total_rows INTEGER DEFAULT 0,
    processed_rows INTEGER DEFAULT 0,
    success_rows INTEGER DEFAULT 0,
    error_rows INTEGER DEFAULT 0,

    validation_errors JSONB DEFAULT '[]',
    processing_errors JSONB DEFAULT '[]',

    rollback_available BOOLEAN DEFAULT false,
    rollback_data JSONB,
    rolled_back_at TIMESTAMP,

    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_import_jobs_tenant ON import_jobs(tenant_id);
CREATE INDEX idx_import_jobs_status ON import_jobs(tenant_id, status);
CREATE INDEX idx_import_jobs_type ON import_jobs(tenant_id, import_type);

-- =====================================================
-- Import Templates
-- =====================================================
CREATE TABLE import_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,

    import_type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    columns JSONB NOT NULL, -- Column definitions with validations
    sample_data JSONB,

    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_import_templates_type ON import_templates(import_type);

-- =====================================================
-- Activation Checklist (Step 9)
-- =====================================================
CREATE TABLE activation_checklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    check_code VARCHAR(50) NOT NULL,
    check_name VARCHAR(200) NOT NULL,
    check_description TEXT,
    category VARCHAR(50),

    is_required BOOLEAN DEFAULT true,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    completed_by UUID,

    validation_query TEXT,
    validation_result JSONB,

    display_order INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, check_code)
);

CREATE INDEX idx_activation_checklist_tenant ON activation_checklist(tenant_id);
CREATE INDEX idx_activation_checklist_status ON activation_checklist(tenant_id, is_completed);

-- =====================================================
-- Insert Default Import Templates
-- =====================================================
INSERT INTO import_templates (import_type, name, description, columns, is_system) VALUES
('EMPLOYEES', 'Colaboradores - Padrão', 'Template padrão para importação de colaboradores',
'[
  {"name": "nome", "label": "Nome Completo", "type": "text", "required": true, "maxLength": 200},
  {"name": "cpf", "label": "CPF", "type": "cpf", "required": true},
  {"name": "email", "label": "E-mail", "type": "email", "required": false},
  {"name": "data_nascimento", "label": "Data de Nascimento", "type": "date", "required": true},
  {"name": "data_admissao", "label": "Data de Admissão", "type": "date", "required": true},
  {"name": "cargo", "label": "Cargo", "type": "text", "required": true},
  {"name": "departamento", "label": "Departamento", "type": "text", "required": true},
  {"name": "salario", "label": "Salário", "type": "currency", "required": true},
  {"name": "tipo_contrato", "label": "Tipo de Contrato", "type": "enum", "options": ["CLT", "PJ", "ESTAGIO", "TEMPORARIO"], "required": true},
  {"name": "jornada", "label": "Jornada Semanal (horas)", "type": "number", "required": false, "default": 44},
  {"name": "pis", "label": "PIS", "type": "text", "required": false},
  {"name": "ctps", "label": "CTPS", "type": "text", "required": false}
]', true),

('DEPARTMENTS', 'Departamentos - Padrão', 'Template padrão para importação de departamentos',
'[
  {"name": "codigo", "label": "Código", "type": "text", "required": true, "maxLength": 20},
  {"name": "nome", "label": "Nome", "type": "text", "required": true, "maxLength": 100},
  {"name": "departamento_pai", "label": "Departamento Pai (código)", "type": "text", "required": false},
  {"name": "gestor_cpf", "label": "CPF do Gestor", "type": "cpf", "required": false},
  {"name": "centro_custo", "label": "Centro de Custo", "type": "text", "required": false}
]', true),

('POSITIONS', 'Cargos - Padrão', 'Template padrão para importação de cargos',
'[
  {"name": "codigo", "label": "Código", "type": "text", "required": true, "maxLength": 20},
  {"name": "nome", "label": "Nome do Cargo", "type": "text", "required": true, "maxLength": 100},
  {"name": "cbo", "label": "CBO", "type": "text", "required": false, "maxLength": 10},
  {"name": "nivel", "label": "Nível", "type": "enum", "options": ["JUNIOR", "PLENO", "SENIOR", "ESPECIALISTA", "GERENTE", "DIRETOR"], "required": false},
  {"name": "salario_min", "label": "Salário Mínimo", "type": "currency", "required": false},
  {"name": "salario_max", "label": "Salário Máximo", "type": "currency", "required": false},
  {"name": "descricao", "label": "Descrição", "type": "text", "required": false}
]', true);

-- =====================================================
-- Insert Default Activation Checks
-- =====================================================
INSERT INTO activation_checklist (tenant_id, check_code, check_name, check_description, category, is_required, display_order) VALUES
('00000000-0000-0000-0000-000000000000', 'COMPANY_DATA', 'Dados da Empresa', 'Informações da empresa preenchidas', 'SETUP', true, 1),
('00000000-0000-0000-0000-000000000000', 'ORG_STRUCTURE', 'Estrutura Organizacional', 'Pelo menos um departamento criado', 'SETUP', true, 2),
('00000000-0000-0000-0000-000000000000', 'POSITIONS', 'Cargos', 'Pelo menos um cargo cadastrado', 'SETUP', true, 3),
('00000000-0000-0000-0000-000000000000', 'WORK_SCHEDULE', 'Jornada de Trabalho', 'Pelo menos uma jornada configurada', 'SETUP', true, 4),
('00000000-0000-0000-0000-000000000000', 'ADMIN_USER', 'Usuário Administrador', 'Usuário administrador configurado', 'USERS', true, 5),
('00000000-0000-0000-0000-000000000000', 'EMPLOYEES', 'Colaboradores', 'Pelo menos um colaborador cadastrado', 'DATA', false, 6),
('00000000-0000-0000-0000-000000000000', 'LABOR_RULES', 'Regras Trabalhistas', 'Regras trabalhistas configuradas', 'SETUP', true, 7),
('00000000-0000-0000-0000-000000000000', 'BRANDING', 'Identidade Visual', 'Logo e cores configurados', 'SETUP', false, 8),
('00000000-0000-0000-0000-000000000000', 'MODULES', 'Módulos', 'Módulos selecionados', 'SETUP', true, 9),
('00000000-0000-0000-0000-000000000000', 'ESOCIAL_CERT', 'Certificado eSocial', 'Certificado digital configurado para eSocial', 'INTEGRATION', false, 10);
