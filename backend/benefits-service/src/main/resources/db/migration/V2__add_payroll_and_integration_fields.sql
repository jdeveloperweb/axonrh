-- V2__add_payroll_and_integration_fields.sql
ALTER TABLE shared.benefit_types ADD COLUMN payroll_code VARCHAR(50);
ALTER TABLE shared.benefit_types ADD COLUMN payroll_nature VARCHAR(20);
ALTER TABLE shared.benefit_types ADD COLUMN incidence_inss BOOLEAN;
ALTER TABLE shared.benefit_types ADD COLUMN incidence_fgts BOOLEAN;
ALTER TABLE shared.benefit_types ADD COLUMN incidence_irrf BOOLEAN;
ALTER TABLE shared.benefit_types ADD COLUMN external_provider VARCHAR(50);
ALTER TABLE shared.benefit_types ADD COLUMN integration_config TEXT;
