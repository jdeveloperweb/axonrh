-- Migration V23: Adicionar permissao de visualizar eventos passados (arquivo)
-- Data: Marco 2026

-- 1. Inserir a nova permissao
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('EVENT', 'ARCHIVE_READ', 'Visualizar Eventos Passados', 'Permite acessar o filtro de eventos passados/arquivados', 'wellbeing')
ON CONFLICT (resource, action) DO UPDATE SET display_name = EXCLUDED.display_name, module = EXCLUDED.module;

-- 2. Atribuir ao ADMIN
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM shared.permissions
WHERE resource = 'EVENT' AND action = 'ARCHIVE_READ'
ON CONFLICT DO NOTHING;

-- 3. Atribuir ao GESTOR_RH e ANALISTA_DP por padrao
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM shared.roles r, shared.permissions p
WHERE r.name IN ('GESTOR_RH', 'ANALISTA_DP', 'RH')
AND p.resource = 'EVENT' AND p.action = 'ARCHIVE_READ'
ON CONFLICT DO NOTHING;
