-- Fix completed_at nullability in disc_evaluations
ALTER TABLE disc_evaluations ALTER COLUMN completed_at DROP NOT NULL;
ALTER TABLE disc_evaluations ALTER COLUMN completed_at DROP DEFAULT;

-- Fix incorrect default status from V5
ALTER TABLE disc_evaluations ALTER COLUMN status DROP DEFAULT;
ALTER TABLE disc_evaluations ALTER COLUMN status SET DEFAULT 'PENDING';
