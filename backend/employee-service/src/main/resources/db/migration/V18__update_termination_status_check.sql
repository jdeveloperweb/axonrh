-- ============================================================
-- Atualizar constraint de status do processo de desligamento
-- para incluir o status 'ARCHIVED'
-- ============================================================

SET search_path TO shared;

-- Remove a constraint antiga se existir (o nome padrao do Hibernate e termination_processes_status_check)
ALTER TABLE termination_processes DROP CONSTRAINT IF EXISTS termination_processes_status_check;

-- Adiciona a nova constraint com todos os valores possiveis do enum TerminationStatus
ALTER TABLE termination_processes ADD CONSTRAINT termination_processes_status_check 
CHECK (status IN ('IN_PROGRESS', 'PENDING_EQUIPMENT', 'PENDING_FINANCIAL', 'PENDING_EXAMS', 'COMPLETED', 'CANCELLED', 'ARCHIVED'));
