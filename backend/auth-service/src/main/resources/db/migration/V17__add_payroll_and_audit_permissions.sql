-- Migracao para adicionar permissoes de Folha de Pagamento
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('PAYROLL', 'READ', 'Visualizar Folha', 'Permite visualizar dados da folha de pagamento', 'payroll'),
('PAYROLL', 'CREATE', 'Processar Folha', 'Permite calcular e processar a folha de pagamento', 'payroll'),
('PAYROLL', 'UPDATE', 'Editar Folha', 'Permite ajustar dados da folha processada', 'payroll'),
('PAYROLL', 'APPROVE', 'Fechar Folha', 'Permite fechar e consolidar a competencia da folha', 'payroll'),
('PAYROLL', 'EXPORT', 'Exportar Holerites', 'Permite exportar holerites e relatorios da folha', 'payroll')
ON CONFLICT DO NOTHING;

-- Modulo: Audit
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('AUDIT', 'READ', 'Visualizar Auditoria', 'Permite visualizar os logs de auditoria do sistema', 'admin')
ON CONFLICT DO NOTHING;

-- Atribuir por padrao ao ADMIN
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM shared.permissions
WHERE resource IN ('PAYROLL', 'AUDIT')
ON CONFLICT DO NOTHING;

-- Atribuir ao ANALISTA_DP
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333333', id FROM shared.permissions
WHERE resource = 'PAYROLL'
ON CONFLICT DO NOTHING;
