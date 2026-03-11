-- Adiciona colunas para o token de setup obrigatório de MFA (sem depender do Redis)
ALTER TABLE shared.users
    ADD COLUMN IF NOT EXISTS two_factor_setup_token VARCHAR(64),
    ADD COLUMN IF NOT EXISTS two_factor_setup_token_expires_at TIMESTAMP;
