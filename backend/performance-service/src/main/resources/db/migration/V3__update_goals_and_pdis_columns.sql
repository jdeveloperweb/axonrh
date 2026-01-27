-- Add missing columns to goals and pdis to align with JPA mappings
-- Fixes: Schema-validation: missing column [goal_type] in table [goals]

-- Table: goals
ALTER TABLE goals
    ADD COLUMN IF NOT EXISTS goal_type VARCHAR(20) NOT NULL DEFAULT 'INDIVIDUAL',
    ADD COLUMN IF NOT EXISTS unit_of_measure VARCHAR(50),
    ADD COLUMN IF NOT EXISTS is_key_result BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS owner_id UUID,
    ADD COLUMN IF NOT EXISTS owner_name VARCHAR(200);

-- Table: pdis
ALTER TABLE pdis
    ADD COLUMN IF NOT EXISTS manager_id UUID,
    ADD COLUMN IF NOT EXISTS manager_name VARCHAR(200),
    ADD COLUMN IF NOT EXISTS title VARCHAR(200) NOT NULL DEFAULT 'Novo PDI',
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS objectives TEXT,
    ADD COLUMN IF NOT EXISTS focus_areas TEXT,
    ADD COLUMN IF NOT EXISTS expected_outcomes TEXT,
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- Table: pdi_actions
ALTER TABLE pdi_actions
    ADD COLUMN IF NOT EXISTS resource_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS resource_name VARCHAR(200),
    ADD COLUMN IF NOT EXISTS actual_hours INTEGER,
    ADD COLUMN IF NOT EXISTS mentor_id UUID,
    ADD COLUMN IF NOT EXISTS mentor_name VARCHAR(200),
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS completion_notes TEXT;
