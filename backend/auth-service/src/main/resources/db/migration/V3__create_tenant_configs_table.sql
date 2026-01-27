-- =====================================================
-- AxonRH - Migration V3: Tabela de Configuracoes de Tenant (White-label)
-- Data: Janeiro 2026
-- =====================================================

-- =====================================================
-- TABELA: shared.tenant_configs
-- Descricao: Configuracoes de identidade visual e personalizacao
-- =====================================================
CREATE TABLE IF NOT EXISTS shared.tenant_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES shared.tenants(id) ON DELETE CASCADE,

    -- Versionamento de Configuracao
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,

    -- Logotipos
    logo_url VARCHAR(500),
    logo_compact_url VARCHAR(500),
    favicon_url VARCHAR(500),

    -- Paleta de Cores (formato hexadecimal)
    cor_primaria VARCHAR(7) DEFAULT '#1a56db',
    cor_secundaria VARCHAR(7) DEFAULT '#6b7280',
    cor_destaque VARCHAR(7) DEFAULT '#10b981',
    cor_fundo VARCHAR(7) DEFAULT '#ffffff',
    cor_texto VARCHAR(7) DEFAULT '#1f2937',
    cor_erro VARCHAR(7) DEFAULT '#ef4444',
    cor_sucesso VARCHAR(7) DEFAULT '#22c55e',
    cor_alerta VARCHAR(7) DEFAULT '#f59e0b',

    -- Tipografia
    fonte_principal VARCHAR(100) DEFAULT 'Inter',
    fonte_secundaria VARCHAR(100) DEFAULT 'Inter',
    fonte_url VARCHAR(500),

    -- Estilos de Componentes
    estilo_botoes VARCHAR(20) DEFAULT 'rounded'
        CHECK (estilo_botoes IN ('rounded', 'square', 'pill')),
    estilo_cards VARCHAR(20) DEFAULT 'shadow'
        CHECK (estilo_cards IN ('shadow', 'border', 'flat')),
    estilo_inputs VARCHAR(20) DEFAULT 'outlined'
        CHECK (estilo_inputs IN ('outlined', 'filled', 'underlined')),

    -- Configuracao do Tema Escuro
    tema_escuro JSONB DEFAULT '{
        "cor_fundo": "#111827",
        "cor_texto": "#f3f4f6",
        "cor_card": "#1f2937",
        "cor_borda": "#374151"
    }',

    -- Configuracao da Tela de Login
    login_config JSONB DEFAULT '{
        "background_type": "color",
        "background_value": "#f3f4f6",
        "form_position": "center",
        "welcome_text": "Bem-vindo ao Sistema",
        "show_logo": true,
        "show_remember_me": true
    }',

    -- Templates de Email
    email_templates JSONB DEFAULT '{
        "header_color": "#1a56db",
        "footer_text": "AxonRH - Sistema de Gestao de RH",
        "show_logo": true
    }',

    -- Configuracoes de Relatorios
    reports_config JSONB DEFAULT '{
        "header_show_logo": true,
        "footer_show_page_number": true,
        "watermark_enabled": false
    }',

    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Indices
CREATE INDEX idx_tenant_configs_tenant_id ON shared.tenant_configs(tenant_id);
CREATE INDEX idx_tenant_configs_active ON shared.tenant_configs(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX idx_tenant_configs_version ON shared.tenant_configs(tenant_id, version);

-- Trigger para updated_at
CREATE TRIGGER trg_tenant_configs_updated_at
    BEFORE UPDATE ON shared.tenant_configs
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at_column();

-- Constraint: apenas uma config ativa por tenant
CREATE UNIQUE INDEX idx_tenant_configs_unique_active
    ON shared.tenant_configs(tenant_id)
    WHERE is_active = true;

-- Comentarios
COMMENT ON TABLE shared.tenant_configs IS 'Configuracoes de identidade visual e personalizacao (white-label)';
COMMENT ON COLUMN shared.tenant_configs.version IS 'Numero da versao para historico de alteracoes';
COMMENT ON COLUMN shared.tenant_configs.is_active IS 'Indica se esta e a configuracao ativa do tenant';
COMMENT ON COLUMN shared.tenant_configs.tema_escuro IS 'Configuracoes especificas para o modo escuro';
COMMENT ON COLUMN shared.tenant_configs.login_config IS 'Personalizacao da tela de login';

-- =====================================================
-- TABELA: shared.tenant_config_history
-- Descricao: Historico de alteracoes nas configuracoes
-- =====================================================
CREATE TABLE IF NOT EXISTS shared.tenant_config_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_config_id UUID NOT NULL REFERENCES shared.tenant_configs(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES shared.tenants(id) ON DELETE CASCADE,

    -- Dados da Alteracao
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,

    -- Auditoria
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by UUID,
    change_reason VARCHAR(500)
);

-- Indices
CREATE INDEX idx_tenant_config_history_tenant ON shared.tenant_config_history(tenant_id);
CREATE INDEX idx_tenant_config_history_config ON shared.tenant_config_history(tenant_config_id);
CREATE INDEX idx_tenant_config_history_changed_at ON shared.tenant_config_history(changed_at);

COMMENT ON TABLE shared.tenant_config_history IS 'Historico de alteracoes nas configuracoes de tema';
