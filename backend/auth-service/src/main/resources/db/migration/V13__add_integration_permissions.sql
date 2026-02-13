-- =====================================================
-- AxonRH - Migration V13: Permissions for Integration Module
-- =====================================================

INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('INTEGRATION', 'READ', 'Visualizar Integrações', 'Permite visualizar configurações de integração', 'integration'),
('INTEGRATION', 'WRITE', 'Gerenciar Integrações', 'Permite criar, editar e excluir configurações de integração', 'integration'),
('INTEGRATION', 'EXECUTE', 'Executar Integrações', 'Permite executar integrações manualmente', 'integration')
ON CONFLICT DO NOTHING;

-- Assign to ADMIN role
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM shared.permissions
WHERE module = 'integration'
ON CONFLICT DO NOTHING;
