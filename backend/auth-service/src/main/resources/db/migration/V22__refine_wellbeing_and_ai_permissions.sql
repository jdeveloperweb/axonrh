-- Migration V22: Refinamento de Permissões de Bem-estar e Inteligência Artificial
-- Data: 18 de Março de 2026

-- 1. Bem-estar (WELLBEING)
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('WELLBEING', 'READ', 'Visualizar Painel', 'Permite acessar o painel de bem-estar e ver métricas gerais', 'Bem-estar'),
('WELLBEING', 'WRITE', 'Gerenciar Conteúdo', 'Permite criar e gerenciar campanhas, workshops e guias preventivos', 'Bem-estar'),
('WELLBEING', 'ATTEND', 'Atender Colaboradores', 'Permite realizar a triagem e atendimento de solicitações EAP', 'Bem-estar')
ON CONFLICT (resource, action) DO UPDATE SET 
    display_name = EXCLUDED.display_name, 
    description = EXCLUDED.description,
    module = EXCLUDED.module;

-- 2. Assistente IA (AI_ASSISTANT) - Garantir que o nome está correto e no grupo certo
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('AI_ASSISTANT', 'READ', 'Acessar AxonIA', 'Permite interagir com a assistente de inteligência artificial', 'AI-Assistant')
ON CONFLICT (resource, action) DO UPDATE SET 
    display_name = EXCLUDED.display_name, 
    description = EXCLUDED.description,
    module = EXCLUDED.module;

-- 3. Garantir que o ADMIN tenha todas as novas permissões
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM shared.permissions
WHERE resource IN ('WELLBEING', 'AI_ASSISTANT')
ON CONFLICT DO NOTHING;

-- 4. GESTOR_RH e RH devem ter acesso completo ao Bem-estar por padrão
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '22222222-2222-2222-2222-222222222222', id FROM shared.permissions
WHERE resource = 'WELLBEING'
ON CONFLICT DO NOTHING;

-- 5. Associar Acesso ao Bem-estar (READ) ao COLABORADOR
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '55555555-5555-5555-5555-555555555555', id FROM shared.permissions
WHERE resource = 'WELLBEING' AND action = 'READ'
ON CONFLICT DO NOTHING;
