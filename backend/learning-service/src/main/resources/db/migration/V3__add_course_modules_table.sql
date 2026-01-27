-- =====================================================
-- Add missing course_modules table
-- =====================================================

CREATE SCHEMA IF NOT EXISTS shared;
SET search_path TO shared;

CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    category_id UUID REFERENCES training_categories(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    objectives TEXT,
    target_audience TEXT,
    prerequisites TEXT,
    thumbnail_url VARCHAR(500),
    duration_minutes INTEGER,
    course_type VARCHAR(50) NOT NULL,
    modality VARCHAR(50),
    difficulty_level VARCHAR(20),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    is_mandatory BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT false,
    max_participants INTEGER,
    min_participants INTEGER,
    price DECIMAL(15,2) DEFAULT 0,
    external_url VARCHAR(500),
    external_provider VARCHAR(100),
    certificate_template_id UUID,
    passing_score DECIMAL(5,2) DEFAULT 70.00,
    allow_retake BOOLEAN DEFAULT true,
    max_retakes INTEGER DEFAULT 3,
    instructor_id UUID,
    instructor_name VARCHAR(255),
    tags TEXT[],
    created_by UUID,
    published_at TIMESTAMP,
    archived_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_courses_tenant ON courses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_type ON courses(course_type);

CREATE TABLE IF NOT EXISTS course_modules (
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

CREATE INDEX IF NOT EXISTS idx_course_modules_course ON course_modules(course_id);
