// AxonRH - Inicializacao MongoDB
// Collections para logs e historico de IA

// Mudar para o banco axonrh_logs
db = db.getSiblingDB('axonrh_logs');

// Collection para logs de auditoria
db.createCollection('audit_logs', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['tenant_id', 'user_id', 'action', 'timestamp'],
            properties: {
                tenant_id: { bsonType: 'string' },
                user_id: { bsonType: 'string' },
                action: { bsonType: 'string' },
                resource: { bsonType: 'string' },
                resource_id: { bsonType: 'string' },
                details: { bsonType: 'object' },
                ip_address: { bsonType: 'string' },
                user_agent: { bsonType: 'string' },
                timestamp: { bsonType: 'date' }
            }
        }
    }
});

// Indices para audit_logs
db.audit_logs.createIndex({ tenant_id: 1, timestamp: -1 });
db.audit_logs.createIndex({ user_id: 1, timestamp: -1 });
db.audit_logs.createIndex({ action: 1, timestamp: -1 });
db.audit_logs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 157680000 }); // 5 anos TTL

// Collection para historico de conversas com IA
db.createCollection('ai_conversations', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['tenant_id', 'user_id', 'created_at'],
            properties: {
                tenant_id: { bsonType: 'string' },
                user_id: { bsonType: 'string' },
                session_id: { bsonType: 'string' },
                messages: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'object',
                        required: ['role', 'content', 'timestamp'],
                        properties: {
                            role: { enum: ['user', 'assistant', 'system'] },
                            content: { bsonType: 'string' },
                            timestamp: { bsonType: 'date' },
                            tokens_used: { bsonType: 'int' }
                        }
                    }
                },
                context: { bsonType: 'object' },
                created_at: { bsonType: 'date' },
                updated_at: { bsonType: 'date' }
            }
        }
    }
});

// Indices para ai_conversations
db.ai_conversations.createIndex({ tenant_id: 1, user_id: 1, created_at: -1 });
db.ai_conversations.createIndex({ session_id: 1 });

// Collection para queries geradas pela IA
db.createCollection('ai_query_logs', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['tenant_id', 'user_id', 'natural_query', 'timestamp'],
            properties: {
                tenant_id: { bsonType: 'string' },
                user_id: { bsonType: 'string' },
                natural_query: { bsonType: 'string' },
                generated_sql: { bsonType: 'string' },
                execution_time_ms: { bsonType: 'int' },
                result_count: { bsonType: 'int' },
                success: { bsonType: 'bool' },
                error_message: { bsonType: 'string' },
                timestamp: { bsonType: 'date' }
            }
        }
    }
});

// Indices para ai_query_logs
db.ai_query_logs.createIndex({ tenant_id: 1, timestamp: -1 });
db.ai_query_logs.createIndex({ user_id: 1, timestamp: -1 });
db.ai_query_logs.createIndex({ success: 1, timestamp: -1 });

print('AxonRH MongoDB initialized successfully!');
print('Collections created: audit_logs, ai_conversations, ai_query_logs');
