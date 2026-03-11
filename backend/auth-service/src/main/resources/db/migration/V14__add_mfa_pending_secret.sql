-- Adiciona coluna para armazenar o segredo MFA pendente de confirmação
ALTER TABLE shared.users
    ADD COLUMN IF NOT EXISTS two_factor_pending_secret VARCHAR(100);
