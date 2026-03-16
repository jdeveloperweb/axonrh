-- Migration V24: Adicionar permissao de gerenciar política de privacidade
-- Data: Março 2026

-- 1. Inserir a nova permissao
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('SETTINGS', 'PRIVACY_WRITE', 'Gerenciar Política de Privacidade', 'Permite editar o conteúdo da política de privacidade da empresa', 'core')
ON CONFLICT (resource, action) DO UPDATE SET display_name = EXCLUDED.display_name, module = EXCLUDED.module;

-- 2. Atribuir ao ADMIN
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM shared.permissions
WHERE resource = 'SETTINGS' AND action = 'PRIVACY_WRITE'
ON CONFLICT DO NOTHING;

-- 3. Atribuir ao GESTOR_RH e RH por padrao
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM shared.roles r, shared.permissions p
WHERE r.name IN ('GESTOR_RH', 'RH')
AND p.resource = 'SETTINGS' AND p.action = 'PRIVACY_WRITE'
ON CONFLICT DO NOTHING;
