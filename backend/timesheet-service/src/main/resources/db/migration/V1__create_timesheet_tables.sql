-- =====================================================
-- T127-T131: Tabelas do Timesheet Service
-- Sistema de registro de ponto, escalas e banco de horas
-- =====================================================

-- Extensao PostGIS para operacoes geograficas (apenas se disponivel no servidor)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'postgis') THEN
        CREATE EXTENSION IF NOT EXISTS postgis;
    END IF;
END $$;

-- =====================================================
-- T128: Escalas de trabalho
-- =====================================================
CREATE TABLE work_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    schedule_type VARCHAR(20) NOT NULL, -- FIXED, FLEXIBLE, SHIFT, PART_TIME, INTERMITTENT
    weekly_hours_minutes INTEGER NOT NULL,
    tolerance_minutes INTEGER DEFAULT 5,
    min_break_minutes INTEGER DEFAULT 60,
    max_daily_overtime_minutes INTEGER DEFAULT 120,
    valid_from DATE,
    valid_until DATE,
    overtime_bank_enabled BOOLEAN DEFAULT FALSE,
    overtime_bank_expiration_months INTEGER DEFAULT 6,
    night_shift_start TIME,
    night_shift_end TIME,
    night_shift_additional_percent INTEGER DEFAULT 20,
    union_agreement_id UUID,
    union_agreement_name VARCHAR(200),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_work_schedules_tenant ON work_schedules(tenant_id);
CREATE INDEX idx_work_schedules_name ON work_schedules(tenant_id, name);

-- Horarios por dia da semana
CREATE TABLE schedule_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_schedule_id UUID NOT NULL REFERENCES work_schedules(id) ON DELETE CASCADE,
    day_of_week VARCHAR(15) NOT NULL, -- MONDAY, TUESDAY, etc.
    is_work_day BOOLEAN DEFAULT TRUE,
    entry_time TIME,
    exit_time TIME,
    break_start_time TIME,
    break_end_time TIME,
    break2_start_time TIME,
    break2_end_time TIME,
    expected_work_minutes INTEGER,
    tolerance_minutes INTEGER,
    notes VARCHAR(255),
    UNIQUE(work_schedule_id, day_of_week)
);

-- Vinculo colaborador-escala
CREATE TABLE employee_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    work_schedule_id UUID NOT NULL REFERENCES work_schedules(id),
    valid_from DATE NOT NULL,
    valid_until DATE,
    notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

CREATE INDEX idx_employee_schedules_employee ON employee_schedules(employee_id);
CREATE INDEX idx_employee_schedules_tenant ON employee_schedules(tenant_id);

-- =====================================================
-- T131: Geofences (cercas geograficas)
-- =====================================================
CREATE TABLE geofences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    radius_meters INTEGER NOT NULL DEFAULT 100,
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    location_type VARCHAR(50), -- HEADQUARTERS, BRANCH, CLIENT, HOME_OFFICE, OTHER
    department_ids TEXT, -- JSON array
    employee_ids TEXT, -- JSON array
    require_wifi BOOLEAN DEFAULT FALSE,
    wifi_ssid VARCHAR(100),
    wifi_bssid VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_geofences_tenant ON geofences(tenant_id);
CREATE INDEX idx_geofences_active ON geofences(tenant_id, active);

-- =====================================================
-- T127: Registros de ponto
-- =====================================================
CREATE TABLE time_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    record_date DATE NOT NULL,
    record_time TIME NOT NULL,
    record_datetime TIMESTAMP NOT NULL,
    record_type VARCHAR(20) NOT NULL, -- ENTRY, EXIT, BREAK_START, BREAK_END
    source VARCHAR(20) NOT NULL, -- WEB, MOBILE, REP, BIOMETRIC, FACIAL, MANUAL, IMPORT
    status VARCHAR(20) NOT NULL DEFAULT 'VALID', -- VALID, PENDING_APPROVAL, APPROVED, REJECTED, ADJUSTED

    -- Localizacao
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geofence_id UUID REFERENCES geofences(id),
    within_geofence BOOLEAN,
    location_accuracy DOUBLE PRECISION,

    -- Foto (reconhecimento facial)
    photo_url VARCHAR(500),
    facial_match_confidence DOUBLE PRECISION,

    -- Dispositivo
    device_id VARCHAR(100),
    device_info VARCHAR(255),
    ip_address VARCHAR(50),

    -- REP
    rep_id VARCHAR(50),
    nsr BIGINT, -- Numero Sequencial de Registro

    -- Observacoes
    notes VARCHAR(500),
    rejection_reason VARCHAR(500),

    -- Aprovacao
    approved_by UUID,
    approved_at TIMESTAMP,

    -- Ajuste
    adjustment_id UUID,
    original_time TIME,

    -- Auditoria
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_time_records_employee_date ON time_records(employee_id, record_date);
CREATE INDEX idx_time_records_tenant_date ON time_records(tenant_id, record_date);
CREATE INDEX idx_time_records_status ON time_records(status);

-- =====================================================
-- T129: Ajustes de ponto
-- =====================================================
CREATE TABLE time_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    employee_name VARCHAR(200),
    adjustment_type VARCHAR(30) NOT NULL, -- ADD, MODIFY, DELETE
    original_record_id UUID REFERENCES time_records(id),
    record_date DATE NOT NULL,
    record_type VARCHAR(20) NOT NULL,
    original_time TIME,
    requested_time TIME NOT NULL,
    justification VARCHAR(1000) NOT NULL,
    attachment_urls TEXT, -- JSON array
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, CANCELLED
    approver_id UUID,
    approver_name VARCHAR(200),
    approved_at TIMESTAMP,
    approval_notes VARCHAR(500),
    created_record_id UUID REFERENCES time_records(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_time_adjustments_employee ON time_adjustments(employee_id);
CREATE INDEX idx_time_adjustments_tenant_status ON time_adjustments(tenant_id, status);
CREATE INDEX idx_time_adjustments_approver ON time_adjustments(approver_id, status);

-- =====================================================
-- T130: Banco de horas
-- =====================================================
CREATE TABLE overtime_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL, -- CREDIT, DEBIT, ADJUSTMENT, EXPIRATION, PAYOUT
    reference_date DATE NOT NULL,
    minutes INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    expiration_date DATE,
    expired BOOLEAN DEFAULT FALSE,
    time_record_id UUID REFERENCES time_records(id),
    description VARCHAR(500),
    multiplier DOUBLE PRECISION DEFAULT 1.0,
    original_minutes INTEGER,
    approved_by UUID,
    approved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

CREATE INDEX idx_overtime_bank_employee ON overtime_bank(employee_id);
CREATE INDEX idx_overtime_bank_tenant_date ON overtime_bank(tenant_id, reference_date);
CREATE INDEX idx_overtime_bank_expiration ON overtime_bank(expiration_date);

-- =====================================================
-- Resumo diario (espelho de ponto)
-- =====================================================
CREATE TABLE daily_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    summary_date DATE NOT NULL,
    work_schedule_id UUID REFERENCES work_schedules(id),

    -- Horarios
    first_entry TIME,
    last_exit TIME,
    break_start TIME,
    break_end TIME,

    -- Totais em minutos
    expected_work_minutes INTEGER,
    worked_minutes INTEGER DEFAULT 0,
    break_minutes INTEGER DEFAULT 0,
    overtime_minutes INTEGER DEFAULT 0,
    deficit_minutes INTEGER DEFAULT 0,
    night_shift_minutes INTEGER DEFAULT 0,

    -- Atrasos e faltas
    late_arrival_minutes INTEGER DEFAULT 0,
    early_departure_minutes INTEGER DEFAULT 0,
    is_absent BOOLEAN DEFAULT FALSE,
    absence_type VARCHAR(50),

    -- Status
    has_pending_records BOOLEAN DEFAULT FALSE,
    has_missing_records BOOLEAN DEFAULT FALSE,
    is_holiday BOOLEAN DEFAULT FALSE,
    holiday_name VARCHAR(100),

    -- Fechamento
    is_closed BOOLEAN DEFAULT FALSE,
    closed_at TIMESTAMP,
    closed_by UUID,

    notes VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,

    UNIQUE(tenant_id, employee_id, summary_date)
);

CREATE INDEX idx_daily_summaries_employee_date ON daily_summaries(employee_id, summary_date);
CREATE INDEX idx_daily_summaries_tenant_date ON daily_summaries(tenant_id, summary_date);

-- =====================================================
-- Feriados
-- =====================================================
CREATE TABLE holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    holiday_date DATE NOT NULL,
    holiday_type VARCHAR(20) NOT NULL, -- NATIONAL, STATE, MUNICIPAL, COMPANY
    state VARCHAR(2),
    city VARCHAR(100),
    recurring BOOLEAN DEFAULT FALSE, -- Se repete anualmente
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

CREATE INDEX idx_holidays_tenant_date ON holidays(tenant_id, holiday_date);
CREATE UNIQUE INDEX idx_holidays_unique ON holidays(tenant_id, holiday_date, holiday_type, COALESCE(state, ''), COALESCE(city, ''));

-- =====================================================
-- Configuracoes de tolerancia por sindicato/acordo
-- =====================================================
CREATE TABLE tolerance_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    entry_tolerance_minutes INTEGER DEFAULT 5,
    exit_tolerance_minutes INTEGER DEFAULT 5,
    break_tolerance_minutes INTEGER DEFAULT 0,
    daily_tolerance_minutes INTEGER DEFAULT 10, -- Tolerancia total diaria
    apply_tolerance_to_overtime BOOLEAN DEFAULT FALSE,
    union_agreement_id UUID,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by UUID
);

CREATE INDEX idx_tolerance_configs_tenant ON tolerance_configs(tenant_id);

-- =====================================================
-- Comentarios nas tabelas
-- =====================================================
COMMENT ON TABLE work_schedules IS 'Escalas e jornadas de trabalho';
COMMENT ON TABLE schedule_days IS 'Horarios por dia da semana de cada escala';
COMMENT ON TABLE employee_schedules IS 'Vinculo entre colaboradores e escalas';
COMMENT ON TABLE geofences IS 'Cercas geograficas para validacao de registro de ponto';
COMMENT ON TABLE time_records IS 'Registros individuais de ponto (marcacoes)';
COMMENT ON TABLE time_adjustments IS 'Solicitacoes de ajuste de ponto';
COMMENT ON TABLE overtime_bank IS 'Movimentacoes do banco de horas';
COMMENT ON TABLE daily_summaries IS 'Resumo diario calculado (espelho de ponto)';
COMMENT ON TABLE holidays IS 'Feriados nacionais, estaduais, municipais e da empresa';
COMMENT ON TABLE tolerance_configs IS 'Configuracoes de tolerancia por acordo/sindicato';
