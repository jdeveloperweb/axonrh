-- =====================================================
-- AxonRH - Migration V2: Tabela de Tenants
-- Data: Janeiro 2026
-- =====================================================

-- =====================================================
-- TABELA: shared.tenants
-- Descricao: Cadastro de empresas/clientes (tenants)
-- =====================================================
CREATE TABLE IF NOT EXISTS shared.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificacao
    name VARCHAR(200) NOT NULL,
    trade_name VARCHAR(200),
    cnpj VARCHAR(18) UNIQUE,

    -- Acesso
    subdomain VARCHAR(50) UNIQUE NOT NULL,
    custom_domain VARCHAR(255) UNIQUE,
    schema_name VARCHAR(63) NOT NULL UNIQUE,

    -- Status e Plano
    status VARCHAR(20) DEFAULT 'TRIAL'
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL', 'CANCELLED')),
    plan VARCHAR(50) DEFAULT 'TRIAL'
        CHECK (plan IN ('TRIAL', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM')),

    -- Limites do Plano
    max_employees INTEGER DEFAULT 50,
    max_users INTEGER DEFAULT 10,
    max_storage_gb INTEGER DEFAULT 5,

    -- Datas
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    activated_at TIMESTAMP WITH TIME ZONE,
    suspended_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,

    -- Contato Principal
    contact_name VARCHAR(200),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),

    -- Endereco
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zip_code VARCHAR(10),

    -- Metadata
    settings JSONB DEFAULT '{}',
    features JSONB DEFAULT '[]',

    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON shared.tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON shared.tenants(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_status ON shared.tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_plan ON shared.tenants(plan);
CREATE INDEX IF NOT EXISTS idx_tenants_cnpj ON shared.tenants(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON shared.tenants(created_at);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION shared.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tenants_updated_at') THEN
        CREATE TRIGGER trg_tenants_updated_at
            BEFORE UPDATE ON shared.tenants
            FOR EACH ROW
            EXECUTE FUNCTION shared.update_updated_at_column();
    END IF;
END $$;

-- Comentarios
COMMENT ON TABLE shared.tenants IS 'Cadastro de empresas/clientes do sistema (multi-tenant)';
COMMENT ON COLUMN shared.tenants.subdomain IS 'Subdominio unico para acesso (ex: empresa.axonrh.com.br)';
COMMENT ON COLUMN shared.tenants.schema_name IS 'Nome do schema PostgreSQL deste tenant';
COMMENT ON COLUMN shared.tenants.settings IS 'Configuracoes gerais do tenant em JSON';
COMMENT ON COLUMN shared.tenants.features IS 'Lista de features habilitadas para o tenant';
