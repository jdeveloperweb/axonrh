CREATE TABLE integration_configs (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    target_url TEXT NOT NULL,
    http_method VARCHAR(10) NOT NULL DEFAULT 'POST',
    headers_template TEXT, -- JSON structure with FreeMarker templates
    body_template TEXT, -- Request body with FreeMarker templates
    response_mapping TEXT, -- Rules to map response to internal events (JSON)
    active BOOLEAN NOT NULL DEFAULT TRUE,
    retry_count INT DEFAULT 3,
    timeout_seconds INT DEFAULT 30,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by UUID
);

CREATE TABLE integration_logs (
    id UUID PRIMARY KEY,
    integration_config_id UUID REFERENCES integration_configs(id),
    request_payload TEXT,
    request_headers TEXT,
    response_payload TEXT,
    response_status INT,
    status VARCHAR(20) NOT NULL, -- SUCCESS, FAILED, PENDING
    error_message TEXT,
    execution_time_ms BIGINT,
    triggered_at TIMESTAMP NOT NULL DEFAULT NOW(),
    correlation_id VARCHAR(255)
);

CREATE INDEX idx_integration_logs_config_id ON integration_logs(integration_config_id);
CREATE INDEX idx_integration_logs_status ON integration_logs(status);
