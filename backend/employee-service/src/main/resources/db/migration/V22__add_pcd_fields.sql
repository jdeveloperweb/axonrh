-- ============================================================
-- V15: Campos PCD (Pessoa com Deficiência)
-- ============================================================

SET search_path TO shared;

-- Adicionar campo em Vagas
ALTER TABLE job_vacancies ADD COLUMN IF NOT EXISTS is_exclusive_pcd BOOLEAN DEFAULT FALSE;

-- Adicionar campos em Candidatos
ALTER TABLE talent_candidates ADD COLUMN IF NOT EXISTS is_pcd BOOLEAN DEFAULT FALSE;
ALTER TABLE talent_candidates ADD COLUMN IF NOT EXISTS pcd_type VARCHAR(200);

COMMENT ON COLUMN job_vacancies.is_exclusive_pcd IS 'Indica se a vaga é exclusiva para PCD';
COMMENT ON COLUMN talent_candidates.is_pcd IS 'Indica se o candidato é PCD';
COMMENT ON COLUMN talent_candidates.pcd_type IS 'Descrição do tipo de deficiência do candidato';
