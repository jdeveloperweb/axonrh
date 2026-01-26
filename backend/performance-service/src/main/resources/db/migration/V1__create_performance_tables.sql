-- =====================================================
-- T173-T178: Tabelas do Performance Service
-- Sistema de avaliacao de desempenho
-- =====================================================

-- =====================================================
-- T173: Ciclos de Avaliacao
-- =====================================================
CREATE TABLE evaluation_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(1000),

    -- Tipo de ciclo
    cycle_type VARCHAR(20) NOT NULL, -- QUARTERLY, SEMIANNUAL, ANNUAL, CUSTOM

    -- Periodo do ciclo
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- Fases com datas
    self_evaluation_start DATE,
    self_evaluation_end DATE,
    manager_evaluation_start DATE,
    manager_evaluation_end DATE,
    calibration_start DATE,
    calibration_end DATE,
    feedback_start DATE,
    feedback_end DATE,

    -- Tipo de avaliacao
    evaluation_type VARCHAR(20) NOT NULL, -- SELF, MANAGER, PEERS_180, FULL_360
    include_self_evaluation BOOLEAN DEFAULT TRUE,
    include_manager_evaluation BOOLEAN DEFAULT TRUE,
    include_peer_evaluation BOOLEAN DEFAULT FALSE,
    include_subordinate_evaluation BOOLEAN DEFAULT FALSE,

    -- Configuracoes
    min_peer_evaluators INTEGER DEFAULT 3,
    anonymous_peer_evaluation BOOLEAN DEFAULT TRUE,
    require_calibration BOOLEAN DEFAULT FALSE,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, ACTIVE, SELF_EVAL, MANAGER_EVAL, CALIBRATION, FEEDBACK, COMPLETED, CANCELLED

    -- Formulario padrao
    default_form_id UUID,

    -- Escopo
    scope VARCHAR(20) DEFAULT 'ALL', -- ALL, DEPARTMENT, SELECTED
    department_ids TEXT, -- JSON array
    employee_ids TEXT, -- JSON array

    -- Estatisticas
    total_evaluations INTEGER DEFAULT 0,
    completed_evaluations INTEGER DEFAULT 0,

    -- Auditoria
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by UUID,

    CONSTRAINT uk_evaluation_cycle UNIQUE (tenant_id, name, start_date)
);

CREATE INDEX idx_evaluation_cycles_tenant ON evaluation_cycles(tenant_id);
CREATE INDEX idx_evaluation_cycles_status ON evaluation_cycles(tenant_id, status);
CREATE INDEX idx_evaluation_cycles_dates ON evaluation_cycles(start_date, end_date);

-- =====================================================
-- T174: Formularios de Avaliacao
-- =====================================================
CREATE TABLE evaluation_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    version INTEGER DEFAULT 1,

    -- Tipo
    form_type VARCHAR(20) NOT NULL, -- PERFORMANCE, COMPETENCY, GOALS, MIXED

    -- Configuracoes
    total_weight DECIMAL(5, 2) DEFAULT 100.00,
    passing_score DECIMAL(5, 2) DEFAULT 70.00,

    -- Escala de notas
    scale_type VARCHAR(20) DEFAULT 'NUMERIC', -- NUMERIC, DESCRIPTIVE, MIXED
    scale_min INTEGER DEFAULT 1,
    scale_max INTEGER DEFAULT 5,

    -- Status
    active BOOLEAN DEFAULT TRUE,
    is_template BOOLEAN DEFAULT FALSE,

    -- Auditoria
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by UUID
);

CREATE INDEX idx_evaluation_forms_tenant ON evaluation_forms(tenant_id);

-- Secoes do formulario
CREATE TABLE form_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES evaluation_forms(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    section_order INTEGER NOT NULL,
    weight DECIMAL(5, 2) DEFAULT 0,
    section_type VARCHAR(20) NOT NULL, -- COMPETENCIES, GOALS, BEHAVIORS, OPEN_QUESTIONS
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_form_sections_form ON form_sections(form_id);

-- Questoes do formulario
CREATE TABLE form_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES form_sections(id) ON DELETE CASCADE,
    question_text VARCHAR(1000) NOT NULL,
    question_type VARCHAR(20) NOT NULL, -- RATING, TEXT, MULTIPLE_CHOICE, YES_NO
    question_order INTEGER NOT NULL,
    weight DECIMAL(5, 2) DEFAULT 0,
    required BOOLEAN DEFAULT TRUE,
    competency_id UUID, -- Referencia a competencia se aplicavel
    goal_id UUID, -- Referencia a meta se aplicavel
    options TEXT, -- JSON array para multipla escolha
    help_text VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_form_questions_section ON form_questions(section_id);

-- =====================================================
-- T175: Avaliacoes
-- =====================================================
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    cycle_id UUID NOT NULL REFERENCES evaluation_cycles(id),
    form_id UUID NOT NULL REFERENCES evaluation_forms(id),

    -- Avaliado
    evaluatee_id UUID NOT NULL,
    evaluatee_name VARCHAR(200),
    evaluatee_department_id UUID,
    evaluatee_department_name VARCHAR(200),
    evaluatee_position VARCHAR(200),

    -- Avaliador
    evaluator_id UUID NOT NULL,
    evaluator_name VARCHAR(200),
    evaluator_type VARCHAR(20) NOT NULL, -- SELF, MANAGER, PEER, SUBORDINATE

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, SUBMITTED, CALIBRATED, COMPLETED

    -- Notas
    overall_score DECIMAL(5, 2),
    calibrated_score DECIMAL(5, 2),
    final_score DECIMAL(5, 2),

    -- 9Box
    performance_rating INTEGER, -- 1-3
    potential_rating INTEGER, -- 1-3
    nine_box_position VARCHAR(20), -- STAR, HIGH_POTENTIAL, SOLID_PERFORMER, etc.

    -- Datas
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    calibrated_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Calibracao
    calibrated_by UUID,
    calibration_notes VARCHAR(1000),

    -- Feedback
    feedback_scheduled_at TIMESTAMP,
    feedback_completed_at TIMESTAMP,
    feedback_notes VARCHAR(2000),

    -- Auditoria
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,

    CONSTRAINT uk_evaluation UNIQUE (cycle_id, evaluatee_id, evaluator_id, evaluator_type)
);

CREATE INDEX idx_evaluations_tenant ON evaluations(tenant_id);
CREATE INDEX idx_evaluations_cycle ON evaluations(cycle_id);
CREATE INDEX idx_evaluations_evaluatee ON evaluations(evaluatee_id);
CREATE INDEX idx_evaluations_evaluator ON evaluations(evaluator_id);
CREATE INDEX idx_evaluations_status ON evaluations(status);

-- Respostas da avaliacao
CREATE TABLE evaluation_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES form_questions(id),

    -- Resposta
    rating_value INTEGER,
    text_value VARCHAR(2000),
    selected_options TEXT, -- JSON array

    -- Peso e nota calculada
    weight DECIMAL(5, 2),
    weighted_score DECIMAL(5, 2),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_evaluation_answers ON evaluation_answers(evaluation_id);

-- =====================================================
-- T176: Competencias
-- =====================================================
CREATE TABLE competencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(1000),

    -- Categoria
    category VARCHAR(50), -- TECHNICAL, BEHAVIORAL, LEADERSHIP, ORGANIZATIONAL

    -- Hierarquia
    parent_id UUID REFERENCES competencies(id),
    level INTEGER DEFAULT 0,

    -- Configuracoes
    is_core BOOLEAN DEFAULT FALSE, -- Competencia essencial da empresa
    is_leadership BOOLEAN DEFAULT FALSE, -- Competencia de lideranca

    -- Niveis de proficiencia
    proficiency_levels TEXT, -- JSON array com descricoes de cada nivel

    -- Status
    active BOOLEAN DEFAULT TRUE,

    -- Auditoria
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by UUID
);

CREATE INDEX idx_competencies_tenant ON competencies(tenant_id);
CREATE INDEX idx_competencies_category ON competencies(tenant_id, category);

-- Competencias por cargo
CREATE TABLE position_competencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    position_id UUID NOT NULL,
    competency_id UUID NOT NULL REFERENCES competencies(id),
    required_level INTEGER DEFAULT 3, -- Nivel esperado 1-5
    weight DECIMAL(5, 2) DEFAULT 1.0,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_position_competency UNIQUE (position_id, competency_id)
);

CREATE INDEX idx_position_competencies ON position_competencies(position_id);

-- =====================================================
-- T177: Metas
-- =====================================================
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Vinculo
    employee_id UUID,
    team_id UUID,
    department_id UUID,
    company_wide BOOLEAN DEFAULT FALSE,

    -- Periodo
    cycle_id UUID REFERENCES evaluation_cycles(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- Meta
    title VARCHAR(500) NOT NULL,
    description VARCHAR(2000),

    -- SMART
    specific VARCHAR(1000),
    measurable VARCHAR(500),
    achievable VARCHAR(500),
    relevant VARCHAR(500),
    time_bound VARCHAR(200),

    -- Metrica
    metric_type VARCHAR(20), -- PERCENTAGE, NUMBER, CURRENCY, BOOLEAN, MILESTONE
    target_value DECIMAL(15, 2),
    current_value DECIMAL(15, 2) DEFAULT 0,
    unit VARCHAR(50),

    -- Progresso
    progress_percentage DECIMAL(5, 2) DEFAULT 0,

    -- Peso e prioridade
    weight DECIMAL(5, 2) DEFAULT 1.0,
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, ACTIVE, ON_TRACK, AT_RISK, BEHIND, COMPLETED, CANCELLED

    -- Cascata (meta pai)
    parent_goal_id UUID REFERENCES goals(id),

    -- Datas
    completed_at TIMESTAMP,

    -- Auditoria
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by UUID
);

CREATE INDEX idx_goals_tenant ON goals(tenant_id);
CREATE INDEX idx_goals_employee ON goals(employee_id);
CREATE INDEX idx_goals_cycle ON goals(cycle_id);
CREATE INDEX idx_goals_status ON goals(status);

-- Atualizacoes de progresso das metas
CREATE TABLE goal_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    previous_value DECIMAL(15, 2),
    new_value DECIMAL(15, 2),
    previous_progress DECIMAL(5, 2),
    new_progress DECIMAL(5, 2),
    notes VARCHAR(1000),
    evidence_urls TEXT, -- JSON array
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

CREATE INDEX idx_goal_updates ON goal_updates(goal_id);

-- =====================================================
-- T178: PDI (Plano de Desenvolvimento Individual)
-- =====================================================
CREATE TABLE pdis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    employee_name VARCHAR(200),

    -- Periodo
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- Vinculo com avaliacao
    evaluation_id UUID REFERENCES evaluations(id),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, ACTIVE, IN_PROGRESS, COMPLETED, CANCELLED

    -- Aprovacao
    approved_by UUID,
    approved_at TIMESTAMP,

    -- Progresso geral
    overall_progress DECIMAL(5, 2) DEFAULT 0,

    -- Observacoes
    manager_notes VARCHAR(2000),
    employee_notes VARCHAR(2000),

    -- Auditoria
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by UUID
);

CREATE INDEX idx_pdis_tenant ON pdis(tenant_id);
CREATE INDEX idx_pdis_employee ON pdis(employee_id);
CREATE INDEX idx_pdis_status ON pdis(status);

-- Acoes do PDI
CREATE TABLE pdi_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pdi_id UUID NOT NULL REFERENCES pdis(id) ON DELETE CASCADE,

    -- Competencia a desenvolver
    competency_id UUID REFERENCES competencies(id),
    competency_name VARCHAR(200),
    current_level INTEGER,
    target_level INTEGER,

    -- Acao
    title VARCHAR(500) NOT NULL,
    description VARCHAR(2000),
    action_type VARCHAR(30), -- TRAINING, COURSE, MENTORING, PROJECT, READING, CERTIFICATION, OTHER

    -- Datas
    due_date DATE,
    completed_at TIMESTAMP,

    -- Progresso
    progress_percentage DECIMAL(5, 2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, CANCELLED

    -- Recursos
    estimated_hours INTEGER,
    estimated_cost DECIMAL(10, 2),
    resources_needed VARCHAR(1000),

    -- Evidencias
    evidence_urls TEXT, -- JSON array

    -- Auditoria
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_pdi_actions ON pdi_actions(pdi_id);

-- =====================================================
-- Sessoes de Calibracao
-- =====================================================
CREATE TABLE calibration_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    cycle_id UUID NOT NULL REFERENCES evaluation_cycles(id),
    name VARCHAR(200) NOT NULL,
    description VARCHAR(1000),

    -- Escopo
    department_id UUID,
    department_name VARCHAR(200),

    -- Participantes (gestores)
    facilitator_id UUID,
    participant_ids TEXT, -- JSON array

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED, IN_PROGRESS, COMPLETED

    -- Datas
    scheduled_date TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Resultados
    evaluations_calibrated INTEGER DEFAULT 0,
    notes VARCHAR(2000),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_calibration_sessions ON calibration_sessions(cycle_id);

-- =====================================================
-- Feedbacks
-- =====================================================
CREATE TABLE feedback_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Participantes
    from_employee_id UUID NOT NULL,
    from_employee_name VARCHAR(200),
    to_employee_id UUID NOT NULL,
    to_employee_name VARCHAR(200),

    -- Tipo
    feedback_type VARCHAR(20) NOT NULL, -- RECOGNITION, IMPROVEMENT, GENERAL, EVALUATION

    -- Vinculo
    evaluation_id UUID REFERENCES evaluations(id),
    goal_id UUID REFERENCES goals(id),
    competency_id UUID REFERENCES competencies(id),

    -- Conteudo
    title VARCHAR(200),
    content VARCHAR(4000) NOT NULL,
    is_positive BOOLEAN,

    -- Visibilidade
    visibility VARCHAR(20) DEFAULT 'PRIVATE', -- PRIVATE, MANAGER, PUBLIC
    is_anonymous BOOLEAN DEFAULT FALSE,

    -- Status
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_to ON feedback_records(to_employee_id);
CREATE INDEX idx_feedback_from ON feedback_records(from_employee_id);

-- =====================================================
-- Comentarios
-- =====================================================
COMMENT ON TABLE evaluation_cycles IS 'Ciclos de avaliacao de desempenho';
COMMENT ON TABLE evaluation_forms IS 'Formularios de avaliacao';
COMMENT ON TABLE evaluations IS 'Avaliacoes individuais';
COMMENT ON TABLE competencies IS 'Banco de competencias da empresa';
COMMENT ON TABLE goals IS 'Metas individuais, de equipe e organizacionais';
COMMENT ON TABLE pdis IS 'Planos de Desenvolvimento Individual';
COMMENT ON TABLE calibration_sessions IS 'Sessoes de calibracao entre gestores';
COMMENT ON TABLE feedback_records IS 'Registros de feedback continuo';
