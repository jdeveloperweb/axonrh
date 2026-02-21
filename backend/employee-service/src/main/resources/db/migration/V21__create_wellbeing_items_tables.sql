CREATE TABLE events (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    location VARCHAR(255),
    url VARCHAR(512), -- Primary link (e.g. meeting or main material)
    category VARCHAR(50) DEFAULT 'GENERAL',
    status VARCHAR(50) DEFAULT 'UPCOMING',
    
    -- Speaker info (optional)
    speaker_name VARCHAR(255),
    speaker_role VARCHAR(255),
    speaker_bio TEXT,
    speaker_linkedin VARCHAR(255),
    speaker_avatar_url VARCHAR(512),
    
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_resources (
    id UUID PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    url VARCHAR(512),
    type VARCHAR(50),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_registrations (
    id UUID PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL,
    registration_date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, employee_id)
);

CREATE INDEX idx_events_tenant ON events(tenant_id);
CREATE INDEX idx_event_registrations_employee ON event_registrations(employee_id);
CREATE INDEX idx_event_resources_event ON event_resources(event_id);
