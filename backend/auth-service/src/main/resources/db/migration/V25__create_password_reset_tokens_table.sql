-- Migration V25: Tabela de tokens de reset de senha
CREATE TABLE IF NOT EXISTS shared.password_reset_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    token           VARCHAR(64) NOT NULL UNIQUE,
    expires_at      TIMESTAMP NOT NULL,
    used_at         TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prt_token     ON shared.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_prt_user_id   ON shared.password_reset_tokens(user_id);
