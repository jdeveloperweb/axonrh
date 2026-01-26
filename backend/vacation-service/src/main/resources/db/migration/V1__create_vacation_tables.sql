-- =====================================================
-- T155-T157: Tabelas do Vacation Service
-- Sistema de gestao de ferias
-- =====================================================

-- =====================================================
-- T155: Periodos Aquisitivos
-- =====================================================
CREATE TABLE vacation_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    employee_name VARCHAR(200),

    -- Periodo Aquisitivo
    acquisition_start_date DATE NOT NULL,
    acquisition_end_date DATE NOT NULL,

    -- Periodo Concessivo (12 meses apos fim do aquisitivo)
    concession_start_date DATE NOT NULL,
    concession_end_date DATE NOT NULL,

    -- Dias de direito
    total_days INTEGER NOT NULL DEFAULT 30,
    used_days INTEGER NOT NULL DEFAULT 0,
    remaining_days INTEGER GENERATED ALWAYS AS (total_days - used_days) STORED,
    sold_days INTEGER NOT NULL DEFAULT 0, -- Abono pecuniario (max 10 dias)

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- OPEN, SCHEDULED, PARTIALLY_USED, COMPLETED, EXPIRED, CANCELLED

    -- Faltas que reduzem ferias (Art. 130 CLT)
    absences_count INTEGER DEFAULT 0,

    -- Datas importantes
    expired_at DATE, -- Se expirou sem gozo
    completed_at DATE, -- Quando todas as ferias foram gozadas

    -- Auditoria
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by UUID,

    CONSTRAINT uk_vacation_period UNIQUE (tenant_id, employee_id, acquisition_start_date)
);

CREATE INDEX idx_vacation_periods_tenant ON vacation_periods(tenant_id);
CREATE INDEX idx_vacation_periods_employee ON vacation_periods(employee_id);
CREATE INDEX idx_vacation_periods_status ON vacation_periods(tenant_id, status);
CREATE INDEX idx_vacation_periods_expiring ON vacation_periods(concession_end_date, status);

-- =====================================================
-- T156: Solicitacoes de Ferias
-- =====================================================
CREATE TABLE vacation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    employee_name VARCHAR(200),
    vacation_period_id UUID NOT NULL REFERENCES vacation_periods(id),

    -- Periodo solicitado
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INTEGER NOT NULL,

    -- Tipo
    request_type VARCHAR(20) NOT NULL DEFAULT 'REGULAR', -- REGULAR, COLLECTIVE, FRACTIONED
    fraction_number INTEGER, -- 1, 2 ou 3 para ferias fracionadas

    -- Abono pecuniario
    sell_days BOOLEAN DEFAULT FALSE,
    sold_days_count INTEGER DEFAULT 0,

    -- Adiantamento 13o
    advance_13th_salary BOOLEAN DEFAULT FALSE,

    -- Workflow
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, CANCELLED, SCHEDULED, IN_PROGRESS, COMPLETED

    -- Aprovacao
    approver_id UUID,
    approver_name VARCHAR(200),
    approved_at TIMESTAMP,
    approval_notes VARCHAR(1000),
    rejection_reason VARCHAR(1000),

    -- Pagamento
    payment_date DATE,
    payment_value DECIMAL(15, 2),
    payment_13th_value DECIMAL(15, 2),

    -- Documentos
    notice_document_url VARCHAR(500), -- Aviso de ferias
    receipt_document_url VARCHAR(500), -- Recibo de ferias

    -- Observacoes
    notes VARCHAR(1000),

    -- Auditoria
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_vacation_requests_tenant ON vacation_requests(tenant_id);
CREATE INDEX idx_vacation_requests_employee ON vacation_requests(employee_id);
CREATE INDEX idx_vacation_requests_period ON vacation_requests(vacation_period_id);
CREATE INDEX idx_vacation_requests_status ON vacation_requests(tenant_id, status);
CREATE INDEX idx_vacation_requests_dates ON vacation_requests(start_date, end_date);

-- =====================================================
-- T157: Programacao de Ferias (Calendario)
-- =====================================================
CREATE TABLE vacation_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    year INTEGER NOT NULL,
    department_id UUID,
    department_name VARCHAR(200),

    -- Status do calendario
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, APPROVED, LOCKED

    -- Responsavel
    manager_id UUID,
    manager_name VARCHAR(200),

    -- Aprovacao
    approved_by UUID,
    approved_at TIMESTAMP,

    -- Observacoes
    notes VARCHAR(1000),

    -- Auditoria
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by UUID,

    CONSTRAINT uk_vacation_schedule UNIQUE (tenant_id, year, department_id)
);

CREATE INDEX idx_vacation_schedules_tenant ON vacation_schedules(tenant_id);
CREATE INDEX idx_vacation_schedules_year ON vacation_schedules(tenant_id, year);

-- Itens do calendario (planejamento por colaborador)
CREATE TABLE vacation_schedule_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vacation_schedule_id UUID NOT NULL REFERENCES vacation_schedules(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL,
    employee_name VARCHAR(200),
    vacation_period_id UUID REFERENCES vacation_periods(id),

    -- Periodo planejado
    planned_start_date DATE NOT NULL,
    planned_end_date DATE NOT NULL,
    planned_days INTEGER NOT NULL,

    -- Fracionamento
    fraction_number INTEGER DEFAULT 1, -- 1, 2 ou 3

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED', -- PLANNED, CONFIRMED, CHANGED, CANCELLED

    -- Se foi convertido em solicitacao
    vacation_request_id UUID REFERENCES vacation_requests(id),

    notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_schedule_items_schedule ON vacation_schedule_items(vacation_schedule_id);
CREATE INDEX idx_schedule_items_employee ON vacation_schedule_items(employee_id);

-- =====================================================
-- Ferias Coletivas
-- =====================================================
CREATE TABLE collective_vacations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(1000),

    -- Periodo
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INTEGER NOT NULL,

    -- Abrangencia
    scope VARCHAR(20) NOT NULL, -- ALL, DEPARTMENT, COST_CENTER, SELECTED
    department_ids TEXT, -- JSON array se scope = DEPARTMENT
    cost_center_ids TEXT, -- JSON array se scope = COST_CENTER
    employee_ids TEXT, -- JSON array se scope = SELECTED

    -- Colaboradores incluidos
    included_count INTEGER DEFAULT 0,
    excluded_count INTEGER DEFAULT 0,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, APPROVED, NOTIFIED, IN_PROGRESS, COMPLETED, CANCELLED

    -- Comunicacao ao sindicato
    union_notified BOOLEAN DEFAULT FALSE,
    union_notification_date DATE,
    union_notification_protocol VARCHAR(100),

    -- Comunicacao ao MTE
    mte_notified BOOLEAN DEFAULT FALSE,
    mte_notification_date DATE,
    mte_notification_protocol VARCHAR(100),

    -- Auditoria
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by UUID,
    approved_by UUID,
    approved_at TIMESTAMP
);

CREATE INDEX idx_collective_vacations_tenant ON collective_vacations(tenant_id);
CREATE INDEX idx_collective_vacations_dates ON collective_vacations(start_date, end_date);

-- Colaboradores em ferias coletivas
CREATE TABLE collective_vacation_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collective_vacation_id UUID NOT NULL REFERENCES collective_vacations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL,
    employee_name VARCHAR(200),
    vacation_period_id UUID REFERENCES vacation_periods(id),
    vacation_request_id UUID REFERENCES vacation_requests(id),

    -- Dias a descontar do periodo aquisitivo
    days_deducted INTEGER NOT NULL,

    -- Se excluido das ferias coletivas
    excluded BOOLEAN DEFAULT FALSE,
    exclusion_reason VARCHAR(500),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_collective_employees ON collective_vacation_employees(collective_vacation_id);

-- =====================================================
-- Configuracoes de Ferias
-- =====================================================
CREATE TABLE vacation_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Antecedencia minima para solicitar (dias)
    min_advance_days INTEGER DEFAULT 30,

    -- Antecedencia minima para pagamento (CLT = 2 dias antes)
    payment_advance_days INTEGER DEFAULT 2,

    -- Permitir fracionamento
    allow_fractioning BOOLEAN DEFAULT TRUE,
    max_fractions INTEGER DEFAULT 3,
    min_fraction_days INTEGER DEFAULT 5, -- Minimo 14 dias em uma das parcelas pela CLT

    -- Permitir abono pecuniario
    allow_selling_days BOOLEAN DEFAULT TRUE,
    max_sell_days INTEGER DEFAULT 10,

    -- Periodo de bloqueio (ex: fim de ano)
    blackout_periods TEXT, -- JSON array de {start, end}

    -- Aprovacao automatica
    auto_approve BOOLEAN DEFAULT FALSE,
    auto_approve_max_days INTEGER DEFAULT 5,

    -- Notificacoes
    notify_expiring_days INTEGER DEFAULT 60, -- Dias antes de expirar
    notify_manager BOOLEAN DEFAULT TRUE,
    notify_employee BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,

    CONSTRAINT uk_vacation_config UNIQUE (tenant_id)
);

-- =====================================================
-- Historico de alteracoes
-- =====================================================
CREATE TABLE vacation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- PERIOD, REQUEST, SCHEDULE
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- CREATED, UPDATED, APPROVED, REJECTED, CANCELLED, etc.
    old_values JSONB,
    new_values JSONB,
    notes VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    created_by_name VARCHAR(200)
);

CREATE INDEX idx_vacation_history_entity ON vacation_history(entity_type, entity_id);
CREATE INDEX idx_vacation_history_tenant ON vacation_history(tenant_id, created_at DESC);

-- =====================================================
-- Comentarios
-- =====================================================
COMMENT ON TABLE vacation_periods IS 'Periodos aquisitivos de ferias dos colaboradores';
COMMENT ON TABLE vacation_requests IS 'Solicitacoes de ferias (gozo)';
COMMENT ON TABLE vacation_schedules IS 'Calendarios de programacao de ferias por departamento';
COMMENT ON TABLE vacation_schedule_items IS 'Itens do calendario de ferias';
COMMENT ON TABLE collective_vacations IS 'Ferias coletivas';
COMMENT ON TABLE collective_vacation_employees IS 'Colaboradores em ferias coletivas';
COMMENT ON TABLE vacation_configs IS 'Configuracoes de ferias por tenant';
COMMENT ON TABLE vacation_history IS 'Historico de alteracoes em ferias';
