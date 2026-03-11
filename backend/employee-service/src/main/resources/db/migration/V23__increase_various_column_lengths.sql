-- Increase length of various columns to avoid "value too long" errors during import
ALTER TABLE shared.positions ALTER COLUMN code TYPE VARCHAR(100);
ALTER TABLE shared.positions ALTER COLUMN level TYPE VARCHAR(100);
ALTER TABLE shared.departments ALTER COLUMN code TYPE VARCHAR(100);

-- Also increase lengths for employee document fields that are often longer than expected
ALTER TABLE shared.employees ALTER COLUMN registration_number TYPE VARCHAR(50);
ALTER TABLE shared.employees ALTER COLUMN rg_issuer TYPE VARCHAR(100);
ALTER TABLE shared.employees ALTER COLUMN pis_pasep TYPE VARCHAR(20);
ALTER TABLE shared.employees ALTER COLUMN voter_title TYPE VARCHAR(50);
