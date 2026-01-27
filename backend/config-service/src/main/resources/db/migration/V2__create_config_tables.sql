-- =====================================================
-- AxonRH - Migration V2: Tabelas de configuracao do tenant
-- =====================================================

CREATE TABLE IF NOT EXISTS shared.tenant_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    logo_url VARCHAR(500),
    logo_dark_url VARCHAR(500),
    favicon_url VARCHAR(500),

    primary_color VARCHAR(7) DEFAULT '#1976D2',
    secondary_color VARCHAR(7) DEFAULT '#424242',
    accent_color VARCHAR(7) DEFAULT '#FF4081',
    background_color VARCHAR(7) DEFAULT '#FFFFFF',
    surface_color VARCHAR(7) DEFAULT '#FAFAFA',
    text_primary_color VARCHAR(7) DEFAULT '#212121',
    text_secondary_color VARCHAR(7) DEFAULT '#757575',

    dark_primary_color VARCHAR(7),
    dark_secondary_color VARCHAR(7),
    dark_background_color VARCHAR(7),
    dark_surface_color VARCHAR(7),
    dark_text_primary_color VARCHAR(7),
    dark_text_secondary_color VARCHAR(7),

    login_background_url VARCHAR(500),
    login_welcome_message VARCHAR(500),
    login_footer_text VARCHAR(255),
    show_powered_by BOOLEAN DEFAULT true,
    custom_css TEXT,

    extra_settings JSONB,

    version INTEGER DEFAULT 1,
    published_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,

    CONSTRAINT uk_tenant_configs_tenant UNIQUE (tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_configs_tenant ON shared.tenant_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_configs_active ON shared.tenant_configs(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tenant_configs_version ON shared.tenant_configs(tenant_id, version);

CREATE TABLE IF NOT EXISTS shared.config_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    version INTEGER NOT NULL,
    config_snapshot JSONB NOT NULL,
    change_description VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    is_active BOOLEAN DEFAULT true,

    CONSTRAINT uk_config_versions_tenant_version UNIQUE (tenant_id, version)
);

CREATE INDEX IF NOT EXISTS idx_config_versions_tenant ON shared.config_versions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_config_versions_version ON shared.config_versions(version DESC);
CREATE INDEX IF NOT EXISTS idx_config_versions_created ON shared.config_versions(created_at DESC);
