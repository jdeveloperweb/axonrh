-- ============================================================
-- V5: Adicionar coluna race na tabela employees
-- ============================================================

SET search_path TO shared;

-- Adicionar coluna race
ALTER TABLE employees 
ADD COLUMN race VARCHAR(20);

COMMENT ON COLUMN employees.race IS 'Raça/Cor do colaborador: BRANCA, PRETA, PARDA, AMARELA, INDIGENA, NAO_DECLARADA';
