-- Migration V20: Correcoes de permissoes e associacoes para Colaboradores
-- Data: Marco 2026

-- 1. Adicionar permissao de leitura de eventos que estava faltando
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('EVENT', 'READ', 'Visualizar Eventos', 'Permite visualizar o calendario de eventos e palestras', 'wellbeing')
ON CONFLICT DO NOTHING;

-- 2. Garantir que o COLABORADOR tenha as permissoes basicas de visualizacao do seu proprio dashboard
-- Nota: O ID do role COLABORADOR eh '55555555-5555-5555-5555-555555555555'
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '55555555-5555-5555-5555-555555555555', id FROM shared.permissions
WHERE (resource = 'DASHBOARD' AND action = 'READ')
   OR (resource = 'WELLBEING' AND action = 'READ')
   OR (resource = 'EVENT' AND action = 'READ')
   OR (resource = 'AI_ASSISTANT' AND action = 'READ')
ON CONFLICT DO NOTHING;

-- 3. Garantir que GESTOR, LIDER, ANALISTA_DP e GESTOR_RH tambem tenham as novas permissoes
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM shared.roles r, shared.permissions p
WHERE r.name IN ('GESTOR_RH', 'ANALISTA_DP', 'LIDER', 'GESTOR', 'MANAGER', 'ADMIN')
AND p.resource IN ('DASHBOARD', 'AI_ASSISTANT', 'WELLBEING', 'EVENT')
AND p.action = 'READ'
ON CONFLICT DO NOTHING;
