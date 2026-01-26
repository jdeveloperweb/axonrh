-- =====================================================
-- AxonRH - Migration V6: Tabelas de Autenticacao
-- Data: Janeiro 2026
-- =====================================================

-- =====================================================
-- TABELA: shared.users
-- Descricao: Usuarios do sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS shared.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES shared.tenants(id) ON DELETE CASCADE,

    -- Identificacao
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),

    -- Status
    status VARCHAR(20) DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED')),

    -- 2FA
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(100),

    -- Controle de bloqueio
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    last_login_at TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,

    -- Constraints
    CONSTRAINT uk_users_email_tenant UNIQUE (email, tenant_id)
);

CREATE INDEX idx_users_email ON shared.users(email);
CREATE INDEX idx_users_tenant ON shared.users(tenant_id);
CREATE INDEX idx_users_status ON shared.users(status);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON shared.users
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at_column();

-- =====================================================
-- TABELA: shared.roles
-- Descricao: Papeis para RBAC
-- =====================================================
CREATE TABLE IF NOT EXISTS shared.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES shared.tenants(id) ON DELETE CASCADE, -- null = role global

    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    is_system_role BOOLEAN DEFAULT false,
    hierarchy_level INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT uk_roles_name_tenant UNIQUE (name, tenant_id)
);

CREATE INDEX idx_roles_tenant ON shared.roles(tenant_id);
CREATE INDEX idx_roles_name ON shared.roles(name);

CREATE TRIGGER trg_roles_updated_at
    BEFORE UPDATE ON shared.roles
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at_column();

-- =====================================================
-- TABELA: shared.permissions
-- Descricao: Permissoes granulares
-- =====================================================
CREATE TABLE IF NOT EXISTS shared.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    resource VARCHAR(50) NOT NULL,
    action VARCHAR(30) NOT NULL,
    display_name VARCHAR(100),
    description VARCHAR(255),
    module VARCHAR(50),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT uk_permissions_resource_action UNIQUE (resource, action)
);

CREATE INDEX idx_permissions_resource ON shared.permissions(resource);
CREATE INDEX idx_permissions_module ON shared.permissions(module);

-- =====================================================
-- TABELA: shared.user_roles
-- Descricao: Relacionamento N:N usuarios x roles
-- =====================================================
CREATE TABLE IF NOT EXISTS shared.user_roles (
    user_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES shared.roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID,

    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON shared.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON shared.user_roles(role_id);

-- =====================================================
-- TABELA: shared.role_permissions
-- Descricao: Relacionamento N:N roles x permissions
-- =====================================================
CREATE TABLE IF NOT EXISTS shared.role_permissions (
    role_id UUID NOT NULL REFERENCES shared.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES shared.permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON shared.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON shared.role_permissions(permission_id);

-- =====================================================
-- TABELA: shared.refresh_tokens
-- Descricao: Tokens de refresh para renovacao de sessao
-- =====================================================
CREATE TABLE IF NOT EXISTS shared.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(500) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,

    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP WITH TIME ZONE,
    replaced_by_token VARCHAR(500),

    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_token ON shared.refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user ON shared.refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON shared.refresh_tokens(expires_at);

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

CREATE INDEX idx_login_attempts_email ON shared.login_attempts(email);
CREATE INDEX idx_login_attempts_user ON shared.login_attempts(user_id);
CREATE INDEX idx_login_attempts_ip ON shared.login_attempts(ip_address);
CREATE INDEX idx_login_attempts_attempted ON shared.login_attempts(attempted_at);

-- Particionar por data para melhor performance (ultimos 90 dias)
-- Em producao, considerar criar particoes automaticas

COMMENT ON TABLE shared.users IS 'Usuarios do sistema com dados de autenticacao';
COMMENT ON TABLE shared.roles IS 'Papeis para controle de acesso baseado em roles (RBAC)';
COMMENT ON TABLE shared.permissions IS 'Permissoes granulares no formato RESOURCE:ACTION';
COMMENT ON TABLE shared.refresh_tokens IS 'Tokens para renovacao de sessao (7 dias)';
COMMENT ON TABLE shared.login_attempts IS 'Auditoria de tentativas de login';
