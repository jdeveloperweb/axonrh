-- =====================================================
-- AxonRH - Migration V1 (Tenant): Tabelas Base do Tenant
-- Data: Janeiro 2026
-- Aplicar em cada schema de tenant
-- =====================================================

-- Funcao para atualizar updated_at (se nao existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TABELA: departments (Departamentos)
-- =====================================================
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Hierarquia
    parent_id UUID REFERENCES departments(id),
    level INTEGER DEFAULT 1,
    path TEXT,

    -- Responsavel
    manager_id UUID,

    -- Centro de Custo
    cost_center_id UUID,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_departments_parent ON departments(parent_id);
CREATE INDEX idx_departments_manager ON departments(manager_id);
CREATE INDEX idx_departments_active ON departments(is_active);

CREATE TRIGGER trg_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABELA: positions (Cargos)
-- =====================================================
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,

    -- CBO (Classificacao Brasileira de Ocupacoes)
    cbo_code VARCHAR(10),

    -- Nivel hierarquico
    level INTEGER DEFAULT 1,

    -- Faixa salarial
    salary_min DECIMAL(12, 2),
    salary_max DECIMAL(12, 2),

    -- Requisitos
    requirements JSONB DEFAULT '{}',

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_positions_cbo ON positions(cbo_code);
CREATE INDEX idx_positions_active ON positions(is_active);

CREATE TRIGGER trg_positions_updated_at
    BEFORE UPDATE ON positions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABELA: cost_centers (Centros de Custo)
-- =====================================================
CREATE TABLE IF NOT EXISTS cost_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Hierarquia
    parent_id UUID REFERENCES cost_centers(id),

    -- Orcamento
    budget_year INTEGER,
    budget_amount DECIMAL(15, 2),

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_cost_centers_parent ON cost_centers(parent_id);
CREATE INDEX idx_cost_centers_active ON cost_centers(is_active);

CREATE TRIGGER trg_cost_centers_updated_at
    BEFORE UPDATE ON cost_centers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABELA: work_schedules (Jornadas de Trabalho)
-- =====================================================
CREATE TABLE IF NOT EXISTS work_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Tipo de jornada
    schedule_type VARCHAR(30) DEFAULT 'STANDARD'
        CHECK (schedule_type IN ('STANDARD', 'FLEXIBLE', 'SHIFT', 'PART_TIME', '12X36')),

    -- Horas semanais
    weekly_hours DECIMAL(4, 2) DEFAULT 44.00,

    -- Horarios por dia da semana (JSONB)
    monday JSONB DEFAULT '{"start": "08:00", "end": "17:00", "break_start": "12:00", "break_end": "13:00"}',
    tuesday JSONB DEFAULT '{"start": "08:00", "end": "17:00", "break_start": "12:00", "break_end": "13:00"}',
    wednesday JSONB DEFAULT '{"start": "08:00", "end": "17:00", "break_start": "12:00", "break_end": "13:00"}',
    thursday JSONB DEFAULT '{"start": "08:00", "end": "17:00", "break_start": "12:00", "break_end": "13:00"}',
    friday JSONB DEFAULT '{"start": "08:00", "end": "17:00", "break_start": "12:00", "break_end": "13:00"}',
    saturday JSONB DEFAULT '{"start": null, "end": null}',
    sunday JSONB DEFAULT '{"start": null, "end": null}',

    -- Tolerancias
    tolerance_minutes INTEGER DEFAULT 5,
    overtime_start_after_minutes INTEGER DEFAULT 0,

    -- Adicional noturno
    night_shift_start TIME DEFAULT '22:00',
    night_shift_end TIME DEFAULT '05:00',

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_work_schedules_type ON work_schedules(schedule_type);
CREATE INDEX idx_work_schedules_active ON work_schedules(is_active);

CREATE TRIGGER trg_work_schedules_updated_at
    BEFORE UPDATE ON work_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABELA: holidays (Feriados)
-- =====================================================
CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    date DATE NOT NULL,

    -- Tipo
    holiday_type VARCHAR(20) DEFAULT 'NATIONAL'
        CHECK (holiday_type IN ('NATIONAL', 'STATE', 'MUNICIPAL', 'OPTIONAL', 'COMPANY')),

    -- Abrangencia
    state VARCHAR(2),
    city VARCHAR(100),

    -- Recorrencia
    is_recurring BOOLEAN DEFAULT true,

    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_holidays_date ON holidays(date);
CREATE INDEX idx_holidays_type ON holidays(holiday_type);
CREATE UNIQUE INDEX idx_holidays_unique ON holidays(date, holiday_type, COALESCE(state, ''), COALESCE(city, ''));

CREATE TRIGGER trg_holidays_updated_at
    BEFORE UPDATE ON holidays
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
