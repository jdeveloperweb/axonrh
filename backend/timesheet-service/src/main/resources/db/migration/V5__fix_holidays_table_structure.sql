-- Ensure is_optional column exists in holidays table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='shared' AND table_name='holidays' AND column_name='is_optional') THEN
        ALTER TABLE shared.holidays ADD COLUMN is_optional BOOLEAN DEFAULT false;
    END IF;
END $$;
