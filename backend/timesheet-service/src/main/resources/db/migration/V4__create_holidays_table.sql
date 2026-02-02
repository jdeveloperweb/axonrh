-- Create holidays table
CREATE TABLE IF NOT EXISTS shared.holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    holiday_date DATE NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL, -- NATIONAL, STATE, MUNICIPAL, OPTIONAL
    is_optional BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(tenant_id, holiday_date)
);

CREATE INDEX IF NOT EXISTS idx_holidays_tenant ON shared.holidays(tenant_id);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON shared.holidays(holiday_date);
