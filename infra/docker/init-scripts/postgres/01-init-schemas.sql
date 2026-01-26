-- AxonRH - Inicializacao de Schemas PostgreSQL
-- Executado automaticamente na criacao do container

-- Habilitar extensoes necessarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Schema shared: Metadados globais (tenants, configs)
CREATE SCHEMA IF NOT EXISTS shared;

-- Schema tenant_exemplo: Tenant de demonstracao
CREATE SCHEMA IF NOT EXISTS tenant_exemplo;

-- Schema analytics: Data warehouse (OLAP)
CREATE SCHEMA IF NOT EXISTS analytics;

-- Comentarios nos schemas
COMMENT ON SCHEMA shared IS 'Metadados globais do sistema - tenants e configuracoes';
COMMENT ON SCHEMA tenant_exemplo IS 'Schema do tenant de demonstracao';
COMMENT ON SCHEMA analytics IS 'Data warehouse para relatorios e analytics (OLAP)';

-- Tabela de controle de tenants
CREATE TABLE IF NOT EXISTS shared.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    subdomain VARCHAR(50) UNIQUE NOT NULL,
    schema_name VARCHAR(63) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL')),
    plan VARCHAR(50) DEFAULT 'TRIAL',
    max_employees INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice para busca por subdomain
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON shared.tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON shared.tenants(status);

-- Inserir tenant de exemplo
INSERT INTO shared.tenants (name, subdomain, schema_name, status, plan, max_employees)
VALUES ('Empresa Exemplo', 'exemplo', 'tenant_exemplo', 'ACTIVE', 'ENTERPRISE', 1000)
ON CONFLICT (subdomain) DO NOTHING;

-- Log de inicializacao
DO $$
BEGIN
    RAISE NOTICE 'AxonRH Database initialized successfully!';
    RAISE NOTICE 'Schemas created: shared, tenant_exemplo, analytics';
END $$;
