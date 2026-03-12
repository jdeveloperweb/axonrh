-- Migracao para criar a tabela de logs de auditoria
CREATE TABLE shared.audit_logs (
    id UUID PRIMARY KEY,
    tenant_id UUID,
    user_id UUID,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255),
    ip_address VARCHAR(50),
    user_agent VARCHAR(255),
    details TEXT,
    status VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_tenant ON shared.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user ON shared.audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON shared.audit_logs(resource);
CREATE INDEX idx_audit_logs_created_at ON shared.audit_logs(created_at);
