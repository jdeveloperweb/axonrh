-- Notification Service Database Schema

-- =====================================================
-- Email Templates
-- =====================================================
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    category VARCHAR(50),
    variables JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(tenant_id, code)
);

CREATE INDEX idx_email_templates_tenant ON email_templates(tenant_id);
CREATE INDEX idx_email_templates_code ON email_templates(tenant_id, code);
CREATE INDEX idx_email_templates_category ON email_templates(tenant_id, category);

-- =====================================================
-- Email Logs
-- =====================================================
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    template_id UUID REFERENCES email_templates(id),
    template_code VARCHAR(100),
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(200),
    cc_emails TEXT[],
    bcc_emails TEXT[],
    subject VARCHAR(500) NOT NULL,
    body_html TEXT,
    body_text TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    provider VARCHAR(50) DEFAULT 'AWS_SES',
    message_id VARCHAR(200),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    bounced_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_logs_tenant ON email_logs(tenant_id);
CREATE INDEX idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX idx_email_logs_status ON email_logs(tenant_id, status);
CREATE INDEX idx_email_logs_created ON email_logs(tenant_id, created_at DESC);
CREATE INDEX idx_email_logs_message_id ON email_logs(message_id);

-- =====================================================
-- Push Notification Tokens
-- =====================================================
CREATE TABLE push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    employee_id UUID,
    token VARCHAR(500) NOT NULL,
    device_type VARCHAR(20) NOT NULL, -- ANDROID, IOS, WEB
    device_name VARCHAR(100),
    device_model VARCHAR(100),
    os_version VARCHAR(50),
    app_version VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(tenant_id, token)
);

CREATE INDEX idx_push_tokens_tenant ON push_tokens(tenant_id);
CREATE INDEX idx_push_tokens_user ON push_tokens(tenant_id, user_id);
CREATE INDEX idx_push_tokens_employee ON push_tokens(tenant_id, employee_id);
CREATE INDEX idx_push_tokens_active ON push_tokens(tenant_id, is_active);

-- =====================================================
-- Push Notification Logs
-- =====================================================
CREATE TABLE push_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    token_id UUID REFERENCES push_tokens(id),
    user_id UUID,
    employee_id UUID,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    image_url VARCHAR(500),
    action_url VARCHAR(500),
    category VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    provider VARCHAR(50) DEFAULT 'FIREBASE',
    message_id VARCHAR(200),
    error_message TEXT,
    sent_at TIMESTAMP,
    received_at TIMESTAMP,
    clicked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_push_logs_tenant ON push_logs(tenant_id);
CREATE INDEX idx_push_logs_user ON push_logs(tenant_id, user_id);
CREATE INDEX idx_push_logs_status ON push_logs(tenant_id, status);
CREATE INDEX idx_push_logs_created ON push_logs(tenant_id, created_at DESC);

-- =====================================================
-- In-App Notifications
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    employee_id UUID,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    icon VARCHAR(100),
    image_url VARCHAR(500),
    action_type VARCHAR(50),
    action_url VARCHAR(500),
    action_data JSONB,
    priority VARCHAR(20) DEFAULT 'NORMAL',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    is_archived BOOLEAN DEFAULT false,
    archived_at TIMESTAMP,
    expires_at TIMESTAMP,
    source_type VARCHAR(50),
    source_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX idx_notifications_user ON notifications(tenant_id, user_id);
CREATE INDEX idx_notifications_unread ON notifications(tenant_id, user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(tenant_id, user_id, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(tenant_id, type);
CREATE INDEX idx_notifications_source ON notifications(source_type, source_id);

-- =====================================================
-- Notification Preferences
-- =====================================================
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    employee_id UUID,

    -- Email preferences
    email_enabled BOOLEAN DEFAULT true,
    email_digest_frequency VARCHAR(20) DEFAULT 'INSTANT', -- INSTANT, DAILY, WEEKLY
    email_digest_time TIME DEFAULT '09:00:00',

    -- Push preferences
    push_enabled BOOLEAN DEFAULT true,
    push_sound_enabled BOOLEAN DEFAULT true,
    push_vibration_enabled BOOLEAN DEFAULT true,

    -- In-app preferences
    in_app_enabled BOOLEAN DEFAULT true,
    in_app_sound_enabled BOOLEAN DEFAULT false,

    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '07:00:00',

    -- Category preferences (JSONB for flexibility)
    category_preferences JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(tenant_id, user_id)
);

CREATE INDEX idx_notification_prefs_tenant ON notification_preferences(tenant_id);
CREATE INDEX idx_notification_prefs_user ON notification_preferences(tenant_id, user_id);

-- =====================================================
-- Notification Categories
-- =====================================================
CREATE TABLE notification_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(20),
    default_email_enabled BOOLEAN DEFAULT true,
    default_push_enabled BOOLEAN DEFAULT true,
    default_in_app_enabled BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_categories_tenant ON notification_categories(tenant_id);
CREATE UNIQUE INDEX idx_notification_categories_code ON notification_categories(COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'), code);

-- =====================================================
-- Scheduled Notifications
-- =====================================================
CREATE TABLE scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Target
    target_type VARCHAR(20) NOT NULL, -- USER, ROLE, DEPARTMENT, ALL
    target_ids UUID[],

    -- Content
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    email_template_id UUID REFERENCES email_templates(id),

    -- Channels
    send_email BOOLEAN DEFAULT false,
    send_push BOOLEAN DEFAULT false,
    send_in_app BOOLEAN DEFAULT true,

    -- Schedule
    scheduled_at TIMESTAMP NOT NULL,
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    recurrence_type VARCHAR(20), -- ONCE, DAILY, WEEKLY, MONTHLY
    recurrence_config JSONB,

    -- Status
    status VARCHAR(20) DEFAULT 'SCHEDULED', -- SCHEDULED, PROCESSING, SENT, CANCELLED, FAILED
    sent_at TIMESTAMP,
    sent_count INTEGER DEFAULT 0,
    error_message TEXT,

    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_scheduled_notifications_tenant ON scheduled_notifications(tenant_id);
CREATE INDEX idx_scheduled_notifications_status ON scheduled_notifications(status, scheduled_at);
CREATE INDEX idx_scheduled_notifications_scheduled ON scheduled_notifications(tenant_id, scheduled_at) WHERE status = 'SCHEDULED';

-- =====================================================
-- Notification Batches (for bulk sends)
-- =====================================================
CREATE TABLE notification_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(200),
    type VARCHAR(50) NOT NULL, -- EMAIL, PUSH, IN_APP, MULTI_CHANNEL
    status VARCHAR(20) DEFAULT 'PENDING',
    total_count INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_batches_tenant ON notification_batches(tenant_id);
CREATE INDEX idx_notification_batches_status ON notification_batches(tenant_id, status);

-- =====================================================
-- SMS Logs (optional SMS support)
-- =====================================================
CREATE TABLE sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    message VARCHAR(160) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    provider VARCHAR(50),
    message_id VARCHAR(200),
    error_message TEXT,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cost DECIMAL(10, 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sms_logs_tenant ON sms_logs(tenant_id);
CREATE INDEX idx_sms_logs_phone ON sms_logs(phone_number);
CREATE INDEX idx_sms_logs_status ON sms_logs(tenant_id, status);

-- =====================================================
-- Insert Default Categories
-- =====================================================
INSERT INTO notification_categories (code, name, description, icon, is_system, display_order) VALUES
('SYSTEM', 'Sistema', 'Notificações do sistema', 'settings', true, 1),
('SECURITY', 'Segurança', 'Alertas de segurança', 'shield', true, 2),
('TIMESHEET', 'Ponto', 'Notificações de ponto e jornada', 'clock', true, 3),
('VACATION', 'Férias', 'Solicitações e aprovações de férias', 'beach', true, 4),
('PERFORMANCE', 'Desempenho', 'Avaliações e metas', 'chart', true, 5),
('LEARNING', 'Treinamento', 'Cursos e certificações', 'book', true, 6),
('PAYROLL', 'Folha', 'Informações de pagamento', 'wallet', true, 7),
('APPROVAL', 'Aprovações', 'Solicitações pendentes de aprovação', 'check-circle', true, 8),
('REMINDER', 'Lembretes', 'Lembretes e alertas', 'bell', true, 9),
('ANNOUNCEMENT', 'Comunicados', 'Comunicados da empresa', 'megaphone', true, 10);

-- =====================================================
-- Insert Default Email Templates
-- =====================================================
INSERT INTO email_templates (tenant_id, code, name, subject, body_html, body_text, category, variables, is_system) VALUES
('00000000-0000-0000-0000-000000000000', 'WELCOME', 'Boas-vindas',
'Bem-vindo(a) ao {{company_name}}!',
'<h1>Olá {{employee_name}},</h1><p>Seja bem-vindo(a) à equipe {{company_name}}!</p><p>Seu acesso foi criado com sucesso. Use o link abaixo para definir sua senha:</p><p><a href="{{reset_link}}">Definir Senha</a></p><p>Atenciosamente,<br>Equipe RH</p>',
'Olá {{employee_name}},\n\nSeja bem-vindo(a) à equipe {{company_name}}!\n\nSeu acesso foi criado com sucesso. Use o link abaixo para definir sua senha:\n{{reset_link}}\n\nAtenciosamente,\nEquipe RH',
'SYSTEM', '["employee_name", "company_name", "reset_link"]', true),

('00000000-0000-0000-0000-000000000000', 'PASSWORD_RESET', 'Redefinição de Senha',
'Redefinição de Senha - {{company_name}}',
'<h1>Olá {{employee_name}},</h1><p>Recebemos uma solicitação para redefinir sua senha.</p><p>Clique no link abaixo para criar uma nova senha:</p><p><a href="{{reset_link}}">Redefinir Senha</a></p><p>Este link expira em {{expiration_hours}} horas.</p><p>Se você não solicitou esta alteração, ignore este email.</p>',
'Olá {{employee_name}},\n\nRecebemos uma solicitação para redefinir sua senha.\n\nClique no link abaixo para criar uma nova senha:\n{{reset_link}}\n\nEste link expira em {{expiration_hours}} horas.\n\nSe você não solicitou esta alteração, ignore este email.',
'SECURITY', '["employee_name", "company_name", "reset_link", "expiration_hours"]', true),

('00000000-0000-0000-0000-000000000000', 'VACATION_REQUEST', 'Solicitação de Férias',
'Nova Solicitação de Férias - {{employee_name}}',
'<h1>Nova Solicitação de Férias</h1><p><strong>Colaborador:</strong> {{employee_name}}</p><p><strong>Período:</strong> {{start_date}} a {{end_date}}</p><p><strong>Dias:</strong> {{total_days}}</p><p><a href="{{approval_link}}">Clique aqui para aprovar ou rejeitar</a></p>',
'Nova Solicitação de Férias\n\nColaborador: {{employee_name}}\nPeríodo: {{start_date}} a {{end_date}}\nDias: {{total_days}}\n\nAcesse o sistema para aprovar ou rejeitar.',
'VACATION', '["employee_name", "start_date", "end_date", "total_days", "approval_link"]', true),

('00000000-0000-0000-0000-000000000000', 'VACATION_APPROVED', 'Férias Aprovadas',
'Suas Férias foram Aprovadas!',
'<h1>Férias Aprovadas!</h1><p>Olá {{employee_name}},</p><p>Suas férias foram aprovadas!</p><p><strong>Período:</strong> {{start_date}} a {{end_date}}</p><p><strong>Aprovado por:</strong> {{approver_name}}</p>',
'Férias Aprovadas!\n\nOlá {{employee_name}},\n\nSuas férias foram aprovadas!\n\nPeríodo: {{start_date}} a {{end_date}}\nAprovado por: {{approver_name}}',
'VACATION', '["employee_name", "start_date", "end_date", "approver_name"]', true),

('00000000-0000-0000-0000-000000000000', 'EVALUATION_PENDING', 'Avaliação Pendente',
'Avaliação de Desempenho Pendente',
'<h1>Avaliação Pendente</h1><p>Olá {{employee_name}},</p><p>Você tem uma avaliação de desempenho pendente.</p><p><strong>Ciclo:</strong> {{cycle_name}}</p><p><strong>Prazo:</strong> {{due_date}}</p><p><a href="{{evaluation_link}}">Clique aqui para realizar a avaliação</a></p>',
'Avaliação Pendente\n\nOlá {{employee_name}},\n\nVocê tem uma avaliação de desempenho pendente.\n\nCiclo: {{cycle_name}}\nPrazo: {{due_date}}\n\nAcesse o sistema para realizar a avaliação.',
'PERFORMANCE', '["employee_name", "cycle_name", "due_date", "evaluation_link"]', true),

('00000000-0000-0000-0000-000000000000', 'COURSE_ENROLLED', 'Matrícula em Curso',
'Você foi matriculado em um novo curso!',
'<h1>Nova Matrícula</h1><p>Olá {{employee_name}},</p><p>Você foi matriculado no curso:</p><p><strong>{{course_name}}</strong></p><p><strong>Prazo:</strong> {{due_date}}</p><p><a href="{{course_link}}">Clique aqui para começar</a></p>',
'Nova Matrícula\n\nOlá {{employee_name}},\n\nVocê foi matriculado no curso:\n{{course_name}}\n\nPrazo: {{due_date}}\n\nAcesse o sistema para começar.',
'LEARNING', '["employee_name", "course_name", "due_date", "course_link"]', true),

('00000000-0000-0000-0000-000000000000', 'COURSE_COMPLETED', 'Curso Concluído',
'Parabéns! Você concluiu o curso!',
'<h1>Parabéns!</h1><p>Olá {{employee_name}},</p><p>Você concluiu o curso <strong>{{course_name}}</strong> com sucesso!</p><p><strong>Nota:</strong> {{score}}</p><p><a href="{{certificate_link}}">Baixar Certificado</a></p>',
'Parabéns!\n\nOlá {{employee_name}},\n\nVocê concluiu o curso {{course_name}} com sucesso!\n\nNota: {{score}}\n\nAcesse o sistema para baixar seu certificado.',
'LEARNING', '["employee_name", "course_name", "score", "certificate_link"]', true);
