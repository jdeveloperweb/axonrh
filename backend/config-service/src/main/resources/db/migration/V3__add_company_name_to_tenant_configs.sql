ALTER TABLE shared.tenant_configs
    ADD COLUMN IF NOT EXISTS company_name VARCHAR(200);
