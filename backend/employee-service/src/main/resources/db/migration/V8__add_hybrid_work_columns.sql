-- ============================================================
-- Adicionar colunas para trabalho hibrido
-- ============================================================

SET search_path TO shared;

-- Adicionar coluna hybrid_frequency na tabela employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hybrid_frequency INTEGER;

-- Criar tabela para os dias de trabalho hibrido (ElementCollection)
CREATE TABLE IF NOT EXISTS employee_hybrid_days (
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL,
    PRIMARY KEY (employee_id, day_of_week)
);

COMMENT ON TABLE employee_hybrid_days IS 'Dias da semana em que o colaborador trabalha de forma presencial (no regime hibrido)';
