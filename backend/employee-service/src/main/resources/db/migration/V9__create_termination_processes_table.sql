-- ============================================================
-- Criar tabela de processos de desligamento
-- ============================================================

SET search_path TO shared;

CREATE TABLE IF NOT EXISTS termination_processes (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES employees(id),
    termination_type VARCHAR(30) NOT NULL,
    notice_period VARCHAR(20) NOT NULL,
    last_work_day DATE NOT NULL,
    termination_date DATE NOT NULL,
    reason TEXT,
    
    -- Checklist de Devolução
    returned_laptop BOOLEAN DEFAULT FALSE,
    returned_mouse BOOLEAN DEFAULT FALSE,
    returned_keyboard BOOLEAN DEFAULT FALSE,
    returned_headset BOOLEAN DEFAULT FALSE,
    returned_badge BOOLEAN DEFAULT FALSE,
    returned_token BOOLEAN DEFAULT FALSE,
    other_equipment VARCHAR(200),
    equipment_notes TEXT,
    
    -- Checklist de Desligamento
    account_deactivated BOOLEAN DEFAULT FALSE,
    email_deactivated BOOLEAN DEFAULT FALSE,
    exit_interview_done BOOLEAN DEFAULT FALSE,
    esocial_sent BOOLEAN DEFAULT FALSE,
    
    -- Auditoria
    created_at TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    created_by UUID,
    completed_at TIMESTAMP WITHOUT TIME ZONE,
    completed_by UUID
);

COMMENT ON TABLE termination_processes IS 'Tabela que armazena os processos de desligamento de colaboradores';

-- Trigger para updated_at
CREATE TRIGGER update_termination_processes_updated_at BEFORE UPDATE ON termination_processes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
