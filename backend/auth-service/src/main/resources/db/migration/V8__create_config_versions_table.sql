-- =====================================================
-- AxonRH - Migration V8: Tabela de Versionamento de Configuracoes
-- Data: Janeiro 2026
-- =====================================================

-- =====================================================
-- TABELA: shared.config_versions
-- Descricao: Historico de versoes de configuracoes para rollback
-- =====================================================
CREATE TABLE IF NOT EXISTS shared.config_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES shared.tenants(id) ON DELETE CASCADE,

    version INTEGER NOT NULL,
    config_snapshot JSONB NOT NULL,
    change_description VARCHAR(500),

    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,

    CONSTRAINT uk_config_versions_tenant_version UNIQUE (tenant_id, version)
);

CREATE INDEX idx_config_versions_tenant ON shared.config_versions(tenant_id);
CREATE INDEX idx_config_versions_version ON shared.config_versions(version DESC);
CREATE INDEX idx_config_versions_created ON shared.config_versions(created_at DESC);

COMMENT ON TABLE shared.config_versions IS 'Historico de versoes de configuracoes de tenant para rollback';
COMMENT ON COLUMN shared.config_versions.config_snapshot IS 'Snapshot completo da configuracao em JSON';
COMMENT ON COLUMN shared.config_versions.change_description IS 'Descricao da mudanca realizada';

-- =====================================================
-- Adicionar colunas de versionamento na tenant_configs
-- =====================================================
ALTER TABLE shared.tenant_configs
    ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN shared.tenant_configs.version IS 'Versao atual da configuracao';
COMMENT ON COLUMN shared.tenant_configs.published_at IS 'Data/hora da ultima publicacao';

DO $$
BEGIN
    RAISE NOTICE 'Tabela config_versions criada com sucesso!';
    RAISE NOTICE 'Colunas de versionamento adicionadas a tenant_configs';
END $$;
