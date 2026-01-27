-- =====================================================
-- Learning Service - Schema de Banco de Dados
-- =====================================================

CREATE SCHEMA IF NOT EXISTS shared;
SET search_path TO shared;

-- Categorias de treinamento
CREATE TABLE training_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    parent_id UUID REFERENCES training_categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(tenant_id, name)
);

CREATE INDEX idx_training_categories_tenant ON training_categories(tenant_id);

-- Cursos/Treinamentos
CREATE TABLE courses (
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
    course_type VARCHAR(50) NOT NULL, -- ONLINE, PRESENCIAL, HIBRIDO, EXTERNAL
    modality VARCHAR(50), -- SINCRONO, ASSINCRONO, AUTODIDATA
    difficulty_level VARCHAR(20), -- INICIANTE, INTERMEDIARIO, AVANCADO
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, ARCHIVED
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

CREATE INDEX idx_courses_tenant ON courses(tenant_id);
CREATE INDEX idx_courses_category ON courses(category_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_type ON courses(course_type);

-- Modulos do curso
CREATE TABLE course_modules (
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

CREATE INDEX idx_course_modules_course ON course_modules(course_id);

-- Licoes/Aulas
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(50) NOT NULL, -- VIDEO, DOCUMENTO, APRESENTACAO, QUIZ, SCORM, ARTIGO
    content_url VARCHAR(500),
    content_text TEXT,
    duration_minutes INTEGER,
    sequence_order INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT true,
    is_downloadable BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_lessons_module ON lessons(module_id);

-- Quizzes/Avaliacoes
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    quiz_type VARCHAR(30) NOT NULL, -- LESSON_QUIZ, MODULE_QUIZ, FINAL_EXAM
    time_limit_minutes INTEGER,
    passing_score DECIMAL(5,2) DEFAULT 70.00,
    max_attempts INTEGER DEFAULT 3,
    shuffle_questions BOOLEAN DEFAULT false,
    shuffle_answers BOOLEAN DEFAULT false,
    show_correct_answers BOOLEAN DEFAULT true,
    show_score_immediately BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_quizzes_lesson ON quizzes(lesson_id);
CREATE INDEX idx_quizzes_course ON quizzes(course_id);

-- Perguntas do quiz
CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(30) NOT NULL, -- SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, ESSAY, FILL_BLANK
    points DECIMAL(5,2) DEFAULT 1.00,
    explanation TEXT,
    sequence_order INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quiz_questions_quiz ON quiz_questions(quiz_id);

-- Opcoes de resposta
CREATE TABLE quiz_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    sequence_order INTEGER NOT NULL,
    feedback TEXT
);

CREATE INDEX idx_quiz_options_question ON quiz_options(question_id);

-- Matriculas
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    course_id UUID NOT NULL REFERENCES courses(id),
    employee_id UUID NOT NULL,
    employee_name VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'ENROLLED', -- ENROLLED, IN_PROGRESS, COMPLETED, FAILED, CANCELLED, EXPIRED
    enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    due_date DATE,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    final_score DECIMAL(5,2),
    certificate_id UUID,
    certificate_issued_at TIMESTAMP,
    approved_by UUID,
    approved_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(course_id, employee_id)
);

CREATE INDEX idx_enrollments_tenant ON enrollments(tenant_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_employee ON enrollments(employee_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);

-- Progresso do aluno
CREATE TABLE lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id),
    status VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED', -- NOT_STARTED, IN_PROGRESS, COMPLETED
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    time_spent_seconds INTEGER DEFAULT 0,
    last_position_seconds INTEGER DEFAULT 0, -- Para videos
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(enrollment_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_enrollment ON lesson_progress(enrollment_id);

-- Tentativas de quiz
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(id),
    attempt_number INTEGER NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    score DECIMAL(5,2),
    passed BOOLEAN,
    time_spent_seconds INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quiz_attempts_enrollment ON quiz_attempts(enrollment_id);
CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);

-- Respostas do quiz
CREATE TABLE quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES quiz_questions(id),
    selected_options UUID[],
    text_answer TEXT,
    is_correct BOOLEAN,
    points_earned DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quiz_answers_attempt ON quiz_answers(attempt_id);

-- Certificados
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    enrollment_id UUID NOT NULL REFERENCES enrollments(id),
    course_id UUID NOT NULL REFERENCES courses(id),
    employee_id UUID NOT NULL,
    employee_name VARCHAR(255),
    certificate_number VARCHAR(100) NOT NULL UNIQUE,
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    final_score DECIMAL(5,2),
    duration_hours INTEGER,
    pdf_url VARCHAR(500),
    verification_code VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_certificates_tenant ON certificates(tenant_id);
CREATE INDEX idx_certificates_employee ON certificates(employee_id);
CREATE INDEX idx_certificates_verification ON certificates(verification_code);

-- Turmas (para treinamentos presenciais)
CREATE TABLE training_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    course_id UUID NOT NULL REFERENCES courses(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_id UUID,
    instructor_name VARCHAR(255),
    location VARCHAR(255),
    room VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    max_participants INTEGER,
    min_participants INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_training_classes_tenant ON training_classes(tenant_id);
CREATE INDEX idx_training_classes_course ON training_classes(course_id);
CREATE INDEX idx_training_classes_dates ON training_classes(start_date, end_date);

-- Participantes da turma
CREATE TABLE class_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES training_classes(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES enrollments(id),
    employee_id UUID NOT NULL,
    employee_name VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'REGISTERED', -- REGISTERED, CONFIRMED, ATTENDED, ABSENT, CANCELLED
    attendance_status VARCHAR(30), -- PRESENT, ABSENT, LATE, EXCUSED
    check_in_at TIMESTAMP,
    check_out_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, employee_id)
);

CREATE INDEX idx_class_participants_class ON class_participants(class_id);
CREATE INDEX idx_class_participants_employee ON class_participants(employee_id);

-- Trilhas de aprendizagem
CREATE TABLE learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    objectives TEXT,
    thumbnail_url VARCHAR(500),
    duration_hours INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, ARCHIVED
    is_mandatory BOOLEAN DEFAULT false,
    target_positions UUID[],
    target_departments UUID[],
    created_by UUID,
    published_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_learning_paths_tenant ON learning_paths(tenant_id);
CREATE INDEX idx_learning_paths_status ON learning_paths(status);

-- Cursos da trilha
CREATE TABLE learning_path_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id),
    sequence_order INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT true,
    unlock_after_days INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(path_id, course_id)
);

CREATE INDEX idx_lp_courses_path ON learning_path_courses(path_id);

-- Matriculas em trilhas
CREATE TABLE path_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    path_id UUID NOT NULL REFERENCES learning_paths(id),
    employee_id UUID NOT NULL,
    employee_name VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'ENROLLED', -- ENROLLED, IN_PROGRESS, COMPLETED
    enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(path_id, employee_id)
);

CREATE INDEX idx_path_enrollments_tenant ON path_enrollments(tenant_id);
CREATE INDEX idx_path_enrollments_path ON path_enrollments(path_id);
CREATE INDEX idx_path_enrollments_employee ON path_enrollments(employee_id);

-- Avaliacoes de treinamento (NPS)
CREATE TABLE training_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id),
    course_id UUID NOT NULL REFERENCES courses(id),
    employee_id UUID NOT NULL,
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    content_rating INTEGER CHECK (content_rating >= 1 AND content_rating <= 5),
    instructor_rating INTEGER CHECK (instructor_rating >= 1 AND instructor_rating <= 5),
    platform_rating INTEGER CHECK (platform_rating >= 1 AND platform_rating <= 5),
    nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
    would_recommend BOOLEAN,
    comments TEXT,
    improvement_suggestions TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_training_evaluations_course ON training_evaluations(course_id);
CREATE INDEX idx_training_evaluations_enrollment ON training_evaluations(enrollment_id);

-- Configuracoes de LMS por tenant
CREATE TABLE lms_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE,
    allow_self_enrollment BOOLEAN DEFAULT true,
    require_manager_approval BOOLEAN DEFAULT false,
    auto_assign_mandatory BOOLEAN DEFAULT true,
    certificate_expiry_months INTEGER DEFAULT 24,
    default_due_days INTEGER DEFAULT 30,
    max_concurrent_enrollments INTEGER DEFAULT 5,
    gamification_enabled BOOLEAN DEFAULT true,
    points_per_course_completion INTEGER DEFAULT 100,
    points_per_lesson_completion INTEGER DEFAULT 10,
    scorm_enabled BOOLEAN DEFAULT false,
    external_lms_url VARCHAR(500),
    external_lms_api_key VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Gamificacao - Pontos
CREATE TABLE learning_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    points INTEGER NOT NULL,
    reason VARCHAR(100) NOT NULL, -- COURSE_COMPLETED, LESSON_COMPLETED, QUIZ_PASSED, STREAK_BONUS
    reference_id UUID,
    reference_type VARCHAR(50),
    earned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_learning_points_tenant_employee ON learning_points(tenant_id, employee_id);
CREATE INDEX idx_learning_points_earned ON learning_points(earned_at);

-- Badges/Conquistas
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    criteria_type VARCHAR(50) NOT NULL, -- COURSES_COMPLETED, POINTS_EARNED, STREAK_DAYS, CATEGORY_MASTER
    criteria_value INTEGER NOT NULL,
    criteria_category_id UUID REFERENCES training_categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_badges_tenant ON badges(tenant_id);

-- Badges conquistadas
CREATE TABLE employee_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    badge_id UUID NOT NULL REFERENCES badges(id),
    earned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, badge_id)
);

CREATE INDEX idx_employee_badges_employee ON employee_badges(employee_id);
