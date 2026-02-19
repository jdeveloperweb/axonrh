-- =====================================================
-- V2: Tabela de Licenças e Afastamentos (Leave Requests)
-- =====================================================

CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    employee_name VARCHAR(200),
    
    -- Dados da Licença
    type VARCHAR(30) NOT NULL, -- VACATION, MEDICAL, MATERNITY, PATERNITY, BEREAVEMENT, MARRIAGE, MILITARY, UNPAID, OTHER
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INTEGER NOT NULL,
    
    -- Campos específicos para licença médica
    certificate_url VARCHAR(500),
    cid VARCHAR(20),
    cid_description VARCHAR(500),
    doctor_name VARCHAR(200),
    crm VARCHAR(50),
    
    -- Workflow e Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, CANCELLED, etc (VacationRequestStatus)
    reason VARCHAR(1000),
    attachment_url VARCHAR(500),
    
    -- Auditoria
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant ON leave_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(tenant_id, status);

-- Comentários
COMMENT ON TABLE leave_requests IS 'Solicitações de licenças e afastamentos diversos';
