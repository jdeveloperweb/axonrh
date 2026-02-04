CREATE TABLE employee_wellbeing (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL,
    score INTEGER NOT NULL,
    notes TEXT,
    sentiment VARCHAR(255),
    keywords VARCHAR(500),
    risk_level VARCHAR(255),
    wants_eap_contact BOOLEAN NOT NULL DEFAULT FALSE,
    source VARCHAR(20),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wellbeing_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE INDEX idx_employee_wellbeing_employee_id ON employee_wellbeing(employee_id);
CREATE INDEX idx_employee_wellbeing_created_at ON employee_wellbeing(created_at);
