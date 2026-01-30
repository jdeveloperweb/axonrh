-- =====================================================
-- DISC Assessment Tables
-- =====================================================

CREATE TABLE disc_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    
    -- Scores (0-100 or raw counts)
    d_score INTEGER,
    i_score INTEGER,
    s_score INTEGER,
    c_score INTEGER,
    
    -- Result
    primary_profile VARCHAR(50), -- DOMINANCE, INFLUENCE, STEADINESS, CONSCIENTIOUSNESS
    secondary_profile VARCHAR(50),
    profile_description VARCHAR(255),
    
    -- Answers
    answers TEXT, -- JSON array of selected answers
    
    -- Status
    status VARCHAR(20) DEFAULT 'COMPLETED',
    
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_disc_evaluations_tenant ON disc_evaluations(tenant_id);
CREATE INDEX idx_disc_evaluations_employee ON disc_evaluations(employee_id);
