-- V4__create_dlq_table.sql
-- T092 - Criação da tabela de Dead Letter Queue para armazenamento de falhas no processamento de eventos Kafka

CREATE TABLE IF NOT EXISTS shared.dead_letter_queue (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    original_topic VARCHAR(200),
    tenant_id UUID,
    aggregate_id UUID,
    payload JSONB NOT NULL,
    failure_reason VARCHAR(500),
    exception_message TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'PENDING',
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dlq_tenant_status ON shared.dead_letter_queue(tenant_id, status);
CREATE INDEX idx_dlq_event_id ON shared.dead_letter_queue(event_id);
CREATE INDEX idx_dlq_status ON shared.dead_letter_queue(status);
