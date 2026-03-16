-- Migration V22: Adicao de permissao para reset administrativo de MFA
-- Data: Marco 2026

-- 1. Adicionar permissao
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('USER', 'MFA_RESET', 'Resetar MFA Administrativo', 'Permite que um administrador resete o segredo MFA de um usuario', 'admin')
ON CONFLICT (resource, action) DO UPDATE SET display_name = EXCLUDED.display_name, module = EXCLUDED.module;

-- 2. Garantir que ADMIN tenha a nova permissao
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM shared.permissions
WHERE resource = 'USER' AND action = 'MFA_RESET'
ON CONFLICT DO NOTHING;

-- 3. GESTOR_RH tambem pode resetar MFA
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '22222222-2222-2222-2222-222222222222', id FROM shared.permissions
WHERE resource = 'USER' AND action = 'MFA_RESET'
ON CONFLICT DO NOTHING;
