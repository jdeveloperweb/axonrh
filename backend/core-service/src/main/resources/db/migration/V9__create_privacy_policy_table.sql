-- Migration V9: Criar tabela de política de privacidade
-- Data: Março 2026

CREATE TABLE privacy_policies (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    content TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    UNIQUE (tenant_id)
);
