-- Add missing created_by column to setup_progress table
ALTER TABLE setup_progress
    ADD COLUMN IF NOT EXISTS created_by UUID;
