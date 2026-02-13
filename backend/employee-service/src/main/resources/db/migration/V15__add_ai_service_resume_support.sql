-- Add ai_insight column to talent_candidates
ALTER TABLE shared.talent_candidates ADD COLUMN IF NOT EXISTS ai_insight TEXT;
COMMENT ON COLUMN shared.talent_candidates.ai_insight IS 'Insight gerado pela IA com comentario e pontos fortes';
