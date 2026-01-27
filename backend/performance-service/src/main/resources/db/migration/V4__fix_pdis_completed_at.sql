-- Fix missing column in pdis table
-- Fixes: Schema-validation: missing column [completed_at] in table [pdis]

ALTER TABLE pdis
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Align overall_progress type in pdis if necessary (Entity uses Integer)
ALTER TABLE pdis 
    ALTER COLUMN overall_progress TYPE INTEGER;
