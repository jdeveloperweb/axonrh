-- =====================================================
-- AxonRH - Migration V9: Garantir tabela de tentativas de login
-- Data: Janeiro 2026
-- =====================================================

-- =====================================================
-- TABELA: shared.login_attempts
-- Descricao: Log de tentativas de login
-- =====================================================
CREATE TABLE IF NOT EXISTS shared.login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    email VARCHAR(255) NOT NULL,
    tenant_id UUID,
    user_id UUID,

    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100),

    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    location VARCHAR(100),

    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON shared.login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user ON shared.login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON shared.login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted ON shared.login_attempts(attempted_at);

COMMENT ON TABLE shared.login_attempts IS 'Auditoria de tentativas de login';
