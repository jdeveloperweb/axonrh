ALTER TABLE employee_wellbeing ADD COLUMN handled BOOLEAN DEFAULT FALSE;
ALTER TABLE employee_wellbeing ADD COLUMN handled_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE employee_wellbeing ADD COLUMN handled_by UUID;
