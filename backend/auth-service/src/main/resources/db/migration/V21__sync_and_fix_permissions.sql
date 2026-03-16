-- Migration V21: Sincronizacao e Adicao de Permissoes Faltantes para controle total
-- Data: Marco 2026

-- 1. Dashboard (Metricas de Gestao)
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('DASHBOARD', 'MANAGEMENT_READ', 'Metricas de Gestao', 'Permite acessar a visao detalhada com metricas da organizacao', 'dashboard')
ON CONFLICT (resource, action) DO UPDATE SET display_name = EXCLUDED.display_name, module = EXCLUDED.module;

-- 2. Performance (Mais granularidade e correcoes)
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('PERFORMANCE', 'DELETE', 'Excluir Avaliacao', 'Permite excluir ciclos e avaliacoes', 'performance'),
('PERFORMANCE', 'MATRIX_READ', 'Matriz 9-Box', 'Permite visualizar a matriz 9-Box de talentos', 'performance'),
('PERFORMANCE', 'GOALS_READ', 'Visualizar Metas/OKRs', 'Permite visualizar metas e OKRs da equipe', 'performance'),
('PERFORMANCE', 'GOALS_WRITE', 'Gerenciar Metas/OKRs', 'Permite criar e editar metas e OKRs', 'performance'),
('PERFORMANCE', 'PDI_READ', 'Visualizar PDI', 'Permite visualizar Planos de Desenvolvimento Individual', 'performance'),
('PERFORMANCE', 'PDI_WRITE', 'Gerenciar PDI', 'Permite criar e gerenciar Planos de Desenvolvimento Individual', 'performance'),
('PERFORMANCE', 'CALIBRATE', 'Calibrar Avaliacoes', 'Permite realizar a calibracao de notas e competencias', 'performance')
ON CONFLICT (resource, action) DO UPDATE SET display_name = EXCLUDED.display_name, module = EXCLUDED.module;

-- 3. Learning (Mais granularidade)
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('LEARNING', 'ENROLL', 'Matricular Colaboradores', 'Permite realizar a matricula de colaboradores em cursos', 'learning'),
('LEARNING', 'CERTIFICATE', 'Gerenciar Certificados', 'Permite configurar modelos e emitir certificados', 'learning'),
('LEARNING', 'DELETE', 'Excluir Curso', 'Permite remover cursos e trilhas do sistema', 'learning')
ON CONFLICT (resource, action) DO UPDATE SET display_name = EXCLUDED.display_name, module = EXCLUDED.module;

-- 4. Bem-estar e Eventos (Agrupar em Wellbeing)
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('WELLBEING', 'READ', 'Visualizar Conteudo', 'Permite visualizar guias e conteudos de bem-estar', 'wellbeing'),
('WELLBEING', 'CREATE', 'Criar Conteudo', 'Permite publicar manuais e guias de saude', 'wellbeing'),
('EVENT', 'READ', 'Visualizar Eventos', 'Permite visualizar o calendario de eventos e palestras', 'wellbeing'),
('EVENT', 'CREATE', 'Agendar Evento', 'Permite criar eventos no calendario corporativo', 'wellbeing')
ON CONFLICT (resource, action) DO UPDATE SET display_name = EXCLUDED.display_name, module = EXCLUDED.module;

-- 5. Relatorios
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('REPORT', 'READ', 'Visualizar Relatorios', 'Permite visualizar relatorios do sistema', 'reports'),
('REPORT', 'EXPORT', 'Exportar Relatorios', 'Permite exportar dados de relatorios em Excel/PDF', 'reports'),
('REPORT', 'CREATE', 'Criar Relatorio Custom', 'Permite criar relatorios customizados', 'reports')
ON CONFLICT (resource, action) DO UPDATE SET display_name = EXCLUDED.display_name, module = EXCLUDED.module;

-- 6. Auditoria (Garantir que esteja no admin)
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('AUDIT', 'READ', 'Visualizar Auditoria', 'Permite visualizar os logs de auditoria do sistema', 'admin')
ON CONFLICT (resource, action) DO UPDATE SET display_name = EXCLUDED.display_name, module = EXCLUDED.module;

-- 7. Folha de Pagamento (Garantir todas aparecam)
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('PAYROLL', 'READ', 'Visualizar Folha', 'Permite visualizar os dados da folha de pagamento', 'payroll'),
('PAYROLL', 'CREATE', 'Processar Folha', 'Permite calcular e processar a folha de pagamento', 'payroll'),
('PAYROLL', 'UPDATE', 'Editar Folha', 'Permite ajustar dados da folha processada', 'payroll'),
('PAYROLL', 'APPROVE', 'Fechar Folha', 'Permite fechar e consolidar a competencia da folha', 'payroll'),
('PAYROLL', 'EXPORT', 'Exportar Holerites', 'Permite exportar holerites e relatorios da folha', 'payroll')
ON CONFLICT (resource, action) DO UPDATE SET display_name = EXCLUDED.display_name, module = EXCLUDED.module;

-- 8. Garantir que ADMIN tenha tudo novo
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM shared.permissions
ON CONFLICT DO NOTHING;

-- 9. Associar novas permissoes aos perfis padrao
-- GESTOR_RH: Performance, Learning, Reports, Dashboard, Wellbeing
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '22222222-2222-2222-2222-222222222222', id FROM shared.permissions
WHERE module IN ('performance', 'learning', 'reports', 'dashboard', 'wellbeing')
ON CONFLICT DO NOTHING;

-- ANALISTA_DP: Folha, Relatorios, Dashboard
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333333', id FROM shared.permissions
WHERE module IN ('payroll', 'reports', 'dashboard')
ON CONFLICT DO NOTHING;
