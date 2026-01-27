-- =====================================================
-- AxonRH - Migration V5: Dados Iniciais (Seeds)
-- Data: Janeiro 2026
-- =====================================================

-- =====================================================
-- SEED: Tenant de Demonstracao
-- =====================================================
ALTER TABLE shared.tenant_configs
    ADD COLUMN IF NOT EXISTS cor_primaria VARCHAR(7) DEFAULT '#1a56db',
    ADD COLUMN IF NOT EXISTS cor_secundaria VARCHAR(7) DEFAULT '#6b7280',
    ADD COLUMN IF NOT EXISTS cor_destaque VARCHAR(7) DEFAULT '#10b981',
    ADD COLUMN IF NOT EXISTS cor_fundo VARCHAR(7) DEFAULT '#ffffff',
    ADD COLUMN IF NOT EXISTS cor_texto VARCHAR(7) DEFAULT '#1f2937',
    ADD COLUMN IF NOT EXISTS fonte_principal VARCHAR(100) DEFAULT 'Inter',
    ADD COLUMN IF NOT EXISTS estilo_botoes VARCHAR(20) DEFAULT 'rounded'
        CHECK (estilo_botoes IN ('rounded', 'square', 'pill')),
    ADD COLUMN IF NOT EXISTS tema_escuro JSONB DEFAULT '{
        "cor_fundo": "#111827",
        "cor_texto": "#f3f4f6",
        "cor_card": "#1f2937",
        "cor_borda": "#374151"
    }',
    ADD COLUMN IF NOT EXISTS login_config JSONB DEFAULT '{
        "background_type": "color",
        "background_value": "#f3f4f6",
        "form_position": "center",
        "welcome_text": "Bem-vindo ao Sistema",
        "show_logo": true,
        "show_remember_me": true
    }';

INSERT INTO shared.tenants (
    id,
    name,
    trade_name,
    subdomain,
    schema_name,
    status,
    plan,
    max_employees,
    max_users,
    max_storage_gb,
    contact_name,
    contact_email,
    activated_at,
    settings,
    features
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Empresa Exemplo LTDA',
    'Empresa Exemplo',
    'exemplo',
    'tenant_exemplo',
    'ACTIVE',
    'ENTERPRISE',
    1000,
    100,
    50,
    'Administrador',
    'admin@exemplo.com.br',
    NOW(),
    '{
        "timezone": "America/Sao_Paulo",
        "locale": "pt-BR",
        "currency": "BRL",
        "date_format": "DD/MM/YYYY",
        "time_format": "HH:mm"
    }',
    '["employees", "timesheet", "vacation", "performance", "learning", "ai_assistant", "analytics"]'
) ON CONFLICT (subdomain) DO NOTHING;

-- =====================================================
-- SEED: Configuracao Visual do Tenant de Demonstracao
-- =====================================================
INSERT INTO shared.tenant_configs (
    id,
    tenant_id,
    version,
    is_active,
    cor_primaria,
    cor_secundaria,
    cor_destaque,
    cor_fundo,
    cor_texto,
    fonte_principal,
    estilo_botoes,
    tema_escuro,
    login_config
) VALUES (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    1,
    true,
    '#2563eb',
    '#64748b',
    '#10b981',
    '#f8fafc',
    '#0f172a',
    'Inter',
    'rounded',
    '{
        "cor_fundo": "#0f172a",
        "cor_texto": "#f1f5f9",
        "cor_card": "#1e293b",
        "cor_borda": "#334155",
        "cor_primaria": "#3b82f6"
    }',
    '{
        "background_type": "gradient",
        "background_value": "linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)",
        "form_position": "right",
        "welcome_text": "Bem-vindo ao AxonRH",
        "subtitle_text": "Sistema Integrado de Gestao de RH",
        "show_logo": true,
        "show_remember_me": true,
        "show_forgot_password": true
    }'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- SEED: Setup Progress para Tenant de Demonstracao (Completo)
-- =====================================================
INSERT INTO shared.setup_progress (
    id,
    tenant_id,
    current_step,
    status,
    step1_company_data,
    step2_org_structure,
    step3_labor_rules,
    step4_visual_identity,
    step5_modules,
    step6_users,
    step7_integrations,
    step8_data_import,
    step9_review,
    completed_at,
    activated_at
) VALUES (
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    9,
    'ACTIVATED',
    '{"completed": true, "company_name": "Empresa Exemplo LTDA"}',
    '{"completed": true, "departments": 5, "positions": 15}',
    '{"completed": true, "work_schedules": 3}',
    '{"completed": true}',
    '{"completed": true, "enabled_modules": ["employees", "timesheet", "vacation", "performance", "learning", "ai_assistant"]}',
    '{"completed": true, "users_created": 5}',
    '{"completed": true}',
    '{"completed": true, "employees_imported": 0}',
    '{"completed": true, "reviewed_by": "Sistema"}',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- =====================================================
-- MENSAGEM DE CONCLUSAO
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'AxonRH - Seeds iniciais inseridos com sucesso!';
    RAISE NOTICE 'Tenant de demonstracao: exemplo.axonrh.com.br';
END $$;
