-- Add missing columns to evaluations to align with JPA mappings
ALTER TABLE evaluations
    ADD COLUMN IF NOT EXISTS due_date DATE,
    ADD COLUMN IF NOT EXISTS performance_score DECIMAL(5, 2),
    ADD COLUMN IF NOT EXISTS potential_score DECIMAL(5, 2),
    ADD COLUMN IF NOT EXISTS overall_feedback TEXT,
    ADD COLUMN IF NOT EXISTS strengths TEXT,
    ADD COLUMN IF NOT EXISTS areas_for_improvement TEXT,
    ADD COLUMN IF NOT EXISTS goals_for_next_period TEXT,
    ADD COLUMN IF NOT EXISTS is_acknowledged BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS employee_comments TEXT;
