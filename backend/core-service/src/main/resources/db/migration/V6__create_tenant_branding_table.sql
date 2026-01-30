-- Create tenant_branding table
CREATE TABLE IF NOT EXISTS shared.tenant_branding (
    tenant_id UUID PRIMARY KEY,
    logo_url VARCHAR(500),
    logo_width INTEGER DEFAULT 150,
    primary_color VARCHAR(7) DEFAULT '#1976D2',
    secondary_color VARCHAR(7) DEFAULT '#424242',
    accent_color VARCHAR(7) DEFAULT '#FF4081',
    font_family VARCHAR(100) DEFAULT 'Plus Jakarta Sans',
    base_font_size INTEGER DEFAULT 16,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);

-- Add comment to table
COMMENT ON TABLE shared.tenant_branding IS 'Configurações de identidade visual dos tenants (White-label)';
