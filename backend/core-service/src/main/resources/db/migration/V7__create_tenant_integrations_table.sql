CREATE TABLE tenant_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- eSocial Configuration
    esocial_enabled BOOLEAN DEFAULT FALSE,
    esocial_environment VARCHAR(20), -- PRODUCTION, PRE_PRODUCTION
    esocial_certificate_id VARCHAR(255),
    
    -- Accounting software
    accounting_software VARCHAR(50), -- DOMINIO, ALTERDATA, CONTMATIC, ETC
    accounting_api_key TEXT,
    accounting_api_url TEXT,
    
    -- ERP Integration
    erp_system VARCHAR(50), -- SAP, TOTVS, ORACLE, SENIOR
    erp_api_url TEXT,
    erp_auth_token TEXT,
    
    -- Benefits
    benefits_provider VARCHAR(50), -- FLASH, ALELO, SODEXO, TICKET
    benefits_api_key TEXT,

    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_tenant_integrations_tenant_id ON tenant_integrations(tenant_id);
