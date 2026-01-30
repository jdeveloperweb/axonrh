-- =====================================================
-- AxonRH - Migration V4: Tabela de Progresso do Setup (Wizard)
-- Data: Janeiro 2026
-- =====================================================

-- =====================================================
-- TABELA: shared.setup_progress
-- Descricao: Controle do progresso do wizard de implantacao
-- =====================================================
CREATE TABLE IF NOT EXISTS shared.setup_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES shared.tenants(id) ON DELETE CASCADE,

    -- Progresso do Wizard
    current_step INTEGER DEFAULT 1 CHECK (current_step BETWEEN 1 AND 9),
    status VARCHAR(20) DEFAULT 'IN_PROGRESS'
        CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ACTIVATED')),

    -- Dados de cada etapa (JSONB para flexibilidade)
    -- Etapa 1: Dados da Empresa
    step1_company_data JSONB DEFAULT '{"completed": false}',

    -- Etapa 2: Estrutura Organizacional
    step2_org_structure JSONB DEFAULT '{"completed": false}',

    -- Etapa 3: Regras Trabalhistas
    step3_labor_rules JSONB DEFAULT '{"completed": false}',

    -- Etapa 4: Identidade Visual
    step4_visual_identity JSONB DEFAULT '{"completed": false}',

    -- Etapa 5: Modulos e Funcionalidades
    step5_modules JSONB DEFAULT '{"completed": false}',

    -- Etapa 6: Usuarios e Permissoes
    step6_users JSONB DEFAULT '{"completed": false}',

    -- Etapa 7: Integracoes
    step7_integrations JSONB DEFAULT '{"completed": false}',

    -- Etapa 8: Importacao de Dados
    step8_data_import JSONB DEFAULT '{"completed": false}',

    -- Etapa 9: Revisao e Ativacao
    step9_review JSONB DEFAULT '{"completed": false}',

    -- Validacoes
    validation_errors JSONB DEFAULT '[]',
    warnings JSONB DEFAULT '[]',

    -- Datas
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    activated_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Responsavel
    responsible_user_id UUID,
    responsible_user_name VARCHAR(200),

    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_setup_progress_tenant ON shared.setup_progress(tenant_id);
CREATE INDEX idx_setup_progress_status ON shared.setup_progress(status);
CREATE INDEX idx_setup_progress_current_step ON shared.setup_progress(current_step);

-- Trigger para updated_at
CREATE TRIGGER trg_setup_progress_updated_at
    BEFORE UPDATE ON shared.setup_progress
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at_column();

-- Comentarios
COMMENT ON TABLE shared.setup_progress IS 'Progresso do wizard de implantacao por tenant';
COMMENT ON COLUMN shared.setup_progress.current_step IS 'Etapa atual do wizard (1 a 9)';
COMMENT ON COLUMN shared.setup_progress.validation_errors IS 'Lista de erros de validacao pendentes';

-- =====================================================
-- TABELA: shared.setup_activity_log
-- Descricao: Log de atividades durante o setup
-- =====================================================
CREATE TABLE IF NOT EXISTS shared.setup_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setup_progress_id UUID NOT NULL REFERENCES shared.setup_progress(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES shared.tenants(id) ON DELETE CASCADE,

    -- Atividade
    step_number INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    details JSONB,

    -- Usuario
    user_id UUID,
    user_name VARCHAR(200),
    user_ip VARCHAR(45),

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_setup_activity_log_setup ON shared.setup_activity_log(setup_progress_id);
CREATE INDEX idx_setup_activity_log_tenant ON shared.setup_activity_log(tenant_id);
CREATE INDEX idx_setup_activity_log_created ON shared.setup_activity_log(created_at);

COMMENT ON TABLE shared.setup_activity_log IS 'Log de todas as atividades durante o processo de setup';
