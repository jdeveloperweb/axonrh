-- Add rules column to benefit_types
ALTER TABLE shared.benefit_types ADD COLUMN rules TEXT;

-- Create table for benefit dependents
CREATE TABLE shared.employee_benefit_dependents (
    id UUID PRIMARY KEY,
    employee_benefit_id UUID NOT NULL,
    dependent_id UUID NOT NULL,
    dependent_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_ebd_employee_benefit FOREIGN KEY (employee_benefit_id) REFERENCES shared.employee_benefits(id) ON DELETE CASCADE
);

CREATE INDEX idx_ebd_benefit ON shared.employee_benefit_dependents(employee_benefit_id);
CREATE INDEX idx_ebd_dependent ON shared.employee_benefit_dependents(dependent_id);
