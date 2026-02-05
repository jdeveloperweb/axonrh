-- ============================================================
-- V14: Tabelas do Banco de Talentos
-- Schema: shared
-- ============================================================

SET search_path TO shared;

-- ============================================================
-- Tabela de Vagas (Job Vacancies)
-- ============================================================
CREATE TABLE IF NOT EXISTS job_vacancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    position_id UUID NOT NULL REFERENCES positions(id),

    -- Informações da vaga
    title VARCHAR(200) NOT NULL,
    description TEXT,
    responsibilities TEXT,
    requirements TEXT,
    benefits TEXT,

    -- Detalhes
    vacancy_type VARCHAR(30) DEFAULT 'EXTERNAL', -- INTERNAL, EXTERNAL, BOTH
    employment_type VARCHAR(30), -- CLT, PJ, ESTAGIO, etc
    work_regime VARCHAR(30), -- PRESENCIAL, REMOTO, HIBRIDO
    location VARCHAR(200),

    -- Salário
    salary_range_min DECIMAL(15,2),
    salary_range_max DECIMAL(15,2),
    hide_salary BOOLEAN DEFAULT FALSE,

    -- Configurações
    max_candidates INTEGER DEFAULT 0, -- 0 = sem limite
    deadline DATE,

    -- Status
    status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, OPEN, PAUSED, CLOSED, CANCELLED
    published_at TIMESTAMP,
    closed_at TIMESTAMP,

    -- Código único para URL pública
    public_code VARCHAR(50) UNIQUE,

    -- Controle
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,

    CONSTRAINT uk_job_vacancies_tenant_position_status UNIQUE (tenant_id, position_id, status)
);

CREATE INDEX idx_job_vacancies_tenant ON job_vacancies(tenant_id);
CREATE INDEX idx_job_vacancies_position ON job_vacancies(position_id);
CREATE INDEX idx_job_vacancies_status ON job_vacancies(tenant_id, status);
CREATE INDEX idx_job_vacancies_public_code ON job_vacancies(public_code);

COMMENT ON TABLE job_vacancies IS 'Vagas abertas para cargos';
COMMENT ON COLUMN job_vacancies.vacancy_type IS 'INTERNAL, EXTERNAL, BOTH';
COMMENT ON COLUMN job_vacancies.status IS 'DRAFT, OPEN, PAUSED, CLOSED, CANCELLED';
COMMENT ON COLUMN job_vacancies.public_code IS 'Codigo unico para URL publica de candidatura';

-- ============================================================
-- Tabela de Candidatos do Banco de Talentos
-- ============================================================
CREATE TABLE IF NOT EXISTS talent_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    vacancy_id UUID NOT NULL REFERENCES job_vacancies(id),

    -- Dados Pessoais
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    mobile VARCHAR(20),

    -- Localização
    city VARCHAR(100),
    state VARCHAR(2),

    -- Links
    linkedin_url VARCHAR(500),
    portfolio_url VARCHAR(500),

    -- Currículo
    resume_file_name VARCHAR(200),
    resume_file_path VARCHAR(500),
    resume_file_type VARCHAR(50),

    -- Dados extraídos do currículo pela IA
    resume_parsed_data JSONB,
    -- Campos específicos extraídos para busca
    skills TEXT,
    education TEXT,
    experience_summary TEXT,
    certifications TEXT,
    languages TEXT,

    -- Status do candidato
    status VARCHAR(30) DEFAULT 'NEW', -- NEW, SCREENING, INTERVIEW, APPROVED, REJECTED, HIRED, WITHDRAWN
    status_notes TEXT,

    -- Avaliação
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,

    -- Metadados
    source VARCHAR(50) DEFAULT 'WEBSITE', -- WEBSITE, LINKEDIN, REFERRAL, OTHER
    referral_name VARCHAR(200),

    -- Controle
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_status_change TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraint: um candidato por email por vaga
    CONSTRAINT uk_talent_candidates_email_vacancy UNIQUE (email, vacancy_id)
);

CREATE INDEX idx_talent_candidates_tenant ON talent_candidates(tenant_id);
CREATE INDEX idx_talent_candidates_vacancy ON talent_candidates(vacancy_id);
CREATE INDEX idx_talent_candidates_status ON talent_candidates(tenant_id, status);
CREATE INDEX idx_talent_candidates_email ON talent_candidates(email);
CREATE INDEX idx_talent_candidates_applied ON talent_candidates(applied_at DESC);
CREATE INDEX idx_talent_candidates_rating ON talent_candidates(tenant_id, rating DESC NULLS LAST);

COMMENT ON TABLE talent_candidates IS 'Candidatos do banco de talentos';
COMMENT ON COLUMN talent_candidates.resume_parsed_data IS 'Dados extraidos do curriculo via IA em formato JSON';
COMMENT ON COLUMN talent_candidates.status IS 'NEW, SCREENING, INTERVIEW, APPROVED, REJECTED, HIRED, WITHDRAWN';

-- ============================================================
-- Tabela de Histórico de Status do Candidato
-- ============================================================
CREATE TABLE IF NOT EXISTS talent_candidate_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    candidate_id UUID NOT NULL REFERENCES talent_candidates(id) ON DELETE CASCADE,

    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    notes TEXT,

    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by UUID
);

CREATE INDEX idx_talent_candidate_history_candidate ON talent_candidate_history(candidate_id);
CREATE INDEX idx_talent_candidate_history_date ON talent_candidate_history(changed_at DESC);

COMMENT ON TABLE talent_candidate_history IS 'Historico de mudancas de status dos candidatos';

-- ============================================================
-- Triggers para updated_at
-- ============================================================
CREATE TRIGGER update_job_vacancies_updated_at BEFORE UPDATE ON job_vacancies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_talent_candidates_updated_at BEFORE UPDATE ON talent_candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Remover constraint única que impede múltiplas vagas abertas
-- ============================================================
ALTER TABLE job_vacancies DROP CONSTRAINT IF EXISTS uk_job_vacancies_tenant_position_status;
