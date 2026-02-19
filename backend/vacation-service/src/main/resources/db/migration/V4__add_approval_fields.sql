ALTER TABLE leave_requests ADD COLUMN approved_at TIMESTAMP;
ALTER TABLE leave_requests ADD COLUMN approved_by UUID;
