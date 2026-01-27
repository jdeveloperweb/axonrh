-- =====================================================
-- Add missing course_modules table
-- =====================================================

CREATE SCHEMA IF NOT EXISTS shared;
SET search_path TO shared, public;

CREATE TABLE IF NOT EXISTS shared.course_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sequence_order INTEGER NOT NULL,
    duration_minutes INTEGER,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_course_modules_course ON shared.course_modules(course_id);
