-- Add missing columns to setup_progress table if they don't exist
ALTER TABLE setup_progress ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE setup_progress ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 1;
ALTER TABLE setup_progress ADD COLUMN IF NOT EXISTS total_steps INTEGER DEFAULT 9;
ALTER TABLE setup_progress ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'IN_PROGRESS';

-- Step data columns
ALTER TABLE setup_progress ADD COLUMN IF NOT EXISTS step1_company_data JSONB DEFAULT '{"completed": false}';
ALTER TABLE setup_progress ADD COLUMN IF NOT EXISTS step2_org_structure JSONB DEFAULT '{"completed": false}';
ALTER TABLE setup_progress ADD COLUMN IF NOT EXISTS step3_labor_rules JSONB DEFAULT '{"completed": false}';
ALTER TABLE setup_progress ADD COLUMN IF NOT EXISTS step4_branding JSONB DEFAULT '{"completed": false}';
ALTER TABLE setup_progress ADD COLUMN IF NOT EXISTS step5_modules JSONB DEFAULT '{"completed": false}';
ALTER TABLE setup_progress ADD COLUMN IF NOT EXISTS step6_users JSONB DEFAULT '{"completed": false}';
ALTER TABLE setup_progress ADD COLUMN IF NOT EXISTS step7_integrations JSONB DEFAULT '{"completed": false}';
ALTER TABLE setup_progress ADD COLUMN IF NOT EXISTS step8_data_import JSONB DEFAULT '{"completed": false}';
ALTER TABLE setup_progress ADD COLUMN IF NOT EXISTS step9_review JSONB DEFAULT '{"completed": false}';

-- Timestamps and metadata
ALTER TABLE setup_progress ADD COLUMN IF NOT EXISTS started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE setup_progress ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE setup_progress ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE setup_progress ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE setup_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
