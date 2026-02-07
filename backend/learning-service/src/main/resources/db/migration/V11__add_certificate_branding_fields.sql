-- Migration para adicionar campos de marca da empresa nos certificados e configurações
ALTER TABLE shared.certificates ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE shared.certificates ADD COLUMN IF NOT EXISTS certificate_title VARCHAR(255);

ALTER TABLE shared.certificate_configs ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE shared.certificate_configs ADD COLUMN IF NOT EXISTS certificate_title VARCHAR(255);
