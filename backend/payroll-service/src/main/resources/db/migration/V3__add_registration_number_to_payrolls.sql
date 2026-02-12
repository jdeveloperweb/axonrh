-- Adicao da coluna registration_number na tabela payrolls
ALTER TABLE shared.payrolls ADD COLUMN IF NOT EXISTS registration_number VARCHAR(255);
