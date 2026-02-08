-- Add progress column to pdi_actions table
ALTER TABLE pdi_actions ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
