-- ============================================================
-- V6: Adicionar coluna ethnicity na tabela employees
-- ============================================================

SET search_path TO shared;

-- Adicionar coluna ethnicity
ALTER TABLE employees 
ADD COLUMN ethnicity VARCHAR(20);

COMMENT ON COLUMN employees.ethnicity IS 'Etnia do colaborador: BRANCO, PARDO, PRETO, AMARELO, INDIGENA';
