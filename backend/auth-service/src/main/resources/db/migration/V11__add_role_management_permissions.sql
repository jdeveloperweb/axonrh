
-- V11: Add permissions for Role Management
-- This migration adds necessary permissions for managing roles and permissions

-- Insert Permissions for Role Management
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('ROLE', 'READ', 'Visualizar Perfis', 'Permite visualizar perfis de acesso e suas permissões', 'settings'),
('ROLE', 'CREATE', 'Criar Perfis', 'Permite criar novos perfis de acesso', 'settings'),
('ROLE', 'UPDATE', 'Editar Perfis', 'Permite editar perfis de acesso existentes', 'settings'),
('ROLE', 'DELETE', 'Excluir Perfis', 'Permite excluir perfis de acesso', 'settings')
ON CONFLICT (resource, action) DO NOTHING;

-- Grant Role Management permissions to ADMIN role
-- Assuming ADMIN role ID is '11111111-1111-1111-1111-111111111111' based on V7 seed
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111111', id
FROM shared.permissions
WHERE resource = 'ROLE'
ON CONFLICT DO NOTHING;
