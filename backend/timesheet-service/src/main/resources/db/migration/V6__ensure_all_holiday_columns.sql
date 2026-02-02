-- Ensure all columns exist in holidays table
DO $$ 
BEGIN 
    -- Colunas básicas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='shared' AND table_name='holidays' AND column_name='tenant_id') THEN
        ALTER TABLE shared.holidays ADD COLUMN tenant_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='shared' AND table_name='holidays' AND column_name='holiday_date') THEN
        ALTER TABLE shared.holidays ADD COLUMN holiday_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='shared' AND table_name='holidays' AND column_name='name') THEN
        ALTER TABLE shared.holidays ADD COLUMN name VARCHAR(200);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='shared' AND table_name='holidays' AND column_name='type') THEN
        ALTER TABLE shared.holidays ADD COLUMN type VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='shared' AND table_name='holidays' AND column_name='is_optional') THEN
        ALTER TABLE shared.holidays ADD COLUMN is_optional BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='shared' AND table_name='holidays' AND column_name='created_at') THEN
        ALTER TABLE shared.holidays ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='shared' AND table_name='holidays' AND column_name='updated_at') THEN
        ALTER TABLE shared.holidays ADD COLUMN updated_at TIMESTAMP;
    END IF;

    -- Garantir restrição de unicidade se não houver
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='uk_holidays_tenant_date' AND table_name='holidays') THEN
        ALTER TABLE shared.holidays ADD CONSTRAINT uk_holidays_tenant_date UNIQUE(tenant_id, holiday_date);
    END IF;
END $$;
