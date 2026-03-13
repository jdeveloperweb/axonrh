-- Migracao para adicionar permissoes de Dashboard e Assistente IA
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('DASHBOARD', 'READ', 'Visualizar Dashboard', 'Permite acessar o dashboard e ver indicadores basicos', 'dashboard'),
('AI_ASSISTANT', 'READ', 'Acessar AxonIA', 'Permite interagir com a assistente de inteligencia artificial', 'ai-assistant')
ON CONFLICT DO NOTHING;

-- Associar ao ADMIN (sempre tem tudo)
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM shared.permissions
WHERE resource IN ('DASHBOARD', 'AI_ASSISTANT')
ON CONFLICT DO NOTHING;

-- Associar ao GESTOR_RH por padrao
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '22222222-2222-2222-2222-222222222222', id FROM shared.permissions
WHERE resource IN ('DASHBOARD', 'AI_ASSISTANT')
ON CONFLICT DO NOTHING;

-- Associar ao ANALISTA_DP por padrao
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333333', id FROM shared.permissions
WHERE resource IN ('DASHBOARD', 'AI_ASSISTANT')
ON CONFLICT DO NOTHING;

-- Associar ao LIDER por padrao (apenas dashboard)
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '44444444-4444-4444-4444-444444444444', id FROM shared.permissions
WHERE resource = 'DASHBOARD'
ON CONFLICT DO NOTHING;

-- Associar ao COLABORADOR por padrao (apenas dashboard)
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '55555555-5555-5555-5555-555555555555', id FROM shared.permissions
WHERE resource = 'DASHBOARD'
ON CONFLICT DO NOTHING;
