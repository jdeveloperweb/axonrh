-- =====================================================
-- AxonRH - Migration V7: Seeds de Roles e Permissions
-- Data: Janeiro 2026
-- =====================================================

-- =====================================================
-- PERMISSIONS: Criar todas as permissoes do sistema
-- =====================================================

-- Modulo: Employees
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('EMPLOYEE', 'CREATE', 'Criar Colaborador', 'Permite cadastrar novos colaboradores', 'employees'),
('EMPLOYEE', 'READ', 'Visualizar Colaborador', 'Permite visualizar dados de colaboradores', 'employees'),
('EMPLOYEE', 'UPDATE', 'Editar Colaborador', 'Permite editar dados de colaboradores', 'employees'),
('EMPLOYEE', 'DELETE', 'Excluir Colaborador', 'Permite excluir colaboradores', 'employees'),
('EMPLOYEE', 'EXPORT', 'Exportar Colaboradores', 'Permite exportar lista de colaboradores', 'employees'),
('EMPLOYEE', 'IMPORT', 'Importar Colaboradores', 'Permite importar colaboradores em massa', 'employees')
ON CONFLICT DO NOTHING;

-- Modulo: Timesheet
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('TIMESHEET', 'CREATE', 'Registrar Ponto', 'Permite registrar ponto', 'timesheet'),
('TIMESHEET', 'READ', 'Visualizar Ponto', 'Permite visualizar registros de ponto', 'timesheet'),
('TIMESHEET', 'UPDATE', 'Ajustar Ponto', 'Permite ajustar registros de ponto', 'timesheet'),
('TIMESHEET', 'APPROVE', 'Aprovar Ajustes', 'Permite aprovar ajustes de ponto', 'timesheet'),
('TIMESHEET', 'EXPORT', 'Exportar Espelho', 'Permite exportar espelho de ponto', 'timesheet')
ON CONFLICT DO NOTHING;

-- Modulo: Vacation
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('VACATION', 'CREATE', 'Solicitar Ferias', 'Permite solicitar ferias', 'vacation'),
('VACATION', 'READ', 'Visualizar Ferias', 'Permite visualizar ferias', 'vacation'),
('VACATION', 'UPDATE', 'Editar Ferias', 'Permite editar solicitacoes de ferias', 'vacation'),
('VACATION', 'APPROVE', 'Aprovar Ferias', 'Permite aprovar solicitacoes de ferias', 'vacation'),
('VACATION', 'DELETE', 'Cancelar Ferias', 'Permite cancelar ferias', 'vacation')
ON CONFLICT DO NOTHING;

-- Modulo: Performance
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('PERFORMANCE', 'CREATE', 'Criar Avaliacao', 'Permite criar ciclos de avaliacao', 'performance'),
('PERFORMANCE', 'READ', 'Visualizar Avaliacao', 'Permite visualizar avaliacoes', 'performance'),
('PERFORMANCE', 'UPDATE', 'Editar Avaliacao', 'Permite editar avaliacoes', 'performance'),
('PERFORMANCE', 'APPROVE', 'Calibrar Avaliacao', 'Permite calibrar avaliacoes', 'performance')
ON CONFLICT DO NOTHING;

-- Modulo: Learning
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('LEARNING', 'CREATE', 'Criar Curso', 'Permite criar cursos e trilhas', 'learning'),
('LEARNING', 'READ', 'Visualizar Cursos', 'Permite visualizar cursos', 'learning'),
('LEARNING', 'UPDATE', 'Editar Curso', 'Permite editar cursos', 'learning'),
('LEARNING', 'DELETE', 'Excluir Curso', 'Permite excluir cursos', 'learning')
ON CONFLICT DO NOTHING;

-- Modulo: Reports
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('REPORT', 'READ', 'Visualizar Relatorios', 'Permite visualizar relatorios', 'reports'),
('REPORT', 'EXPORT', 'Exportar Relatorios', 'Permite exportar relatorios', 'reports'),
('REPORT', 'CREATE', 'Criar Relatorio Custom', 'Permite criar relatorios customizados', 'reports')
ON CONFLICT DO NOTHING;

-- Modulo: Config
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('CONFIG', 'READ', 'Visualizar Configuracoes', 'Permite visualizar configuracoes', 'config'),
('CONFIG', 'UPDATE', 'Editar Configuracoes', 'Permite editar configuracoes', 'config')
ON CONFLICT DO NOTHING;

-- Modulo: Users
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('USER', 'CREATE', 'Criar Usuario', 'Permite criar usuarios', 'admin'),
('USER', 'READ', 'Visualizar Usuario', 'Permite visualizar usuarios', 'admin'),
('USER', 'UPDATE', 'Editar Usuario', 'Permite editar usuarios', 'admin'),
('USER', 'DELETE', 'Desativar Usuario', 'Permite desativar usuarios', 'admin')
ON CONFLICT DO NOTHING;

-- Modulo: Roles
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
('ROLE', 'CREATE', 'Criar Papel', 'Permite criar papeis customizados', 'admin'),
('ROLE', 'READ', 'Visualizar Papeis', 'Permite visualizar papeis', 'admin'),
('ROLE', 'UPDATE', 'Editar Papel', 'Permite editar papeis', 'admin'),
('ROLE', 'DELETE', 'Excluir Papel', 'Permite excluir papeis customizados', 'admin')
ON CONFLICT DO NOTHING;

-- =====================================================
-- ROLES: Criar roles pre-definidos do sistema
-- =====================================================

-- Admin
INSERT INTO shared.roles (id, name, description, is_system_role, hierarchy_level)
VALUES ('11111111-1111-1111-1111-111111111111', 'ADMIN', 'Administrador do sistema com acesso total', true, 100)
ON CONFLICT DO NOTHING;

-- Gestor RH
INSERT INTO shared.roles (id, name, description, is_system_role, hierarchy_level)
VALUES ('22222222-2222-2222-2222-222222222222', 'GESTOR_RH', 'Gestor de Recursos Humanos', true, 80)
ON CONFLICT DO NOTHING;

-- Analista DP
INSERT INTO shared.roles (id, name, description, is_system_role, hierarchy_level)
VALUES ('33333333-3333-3333-3333-333333333333', 'ANALISTA_DP', 'Analista de Departamento Pessoal', true, 70)
ON CONFLICT DO NOTHING;

-- Lider
INSERT INTO shared.roles (id, name, description, is_system_role, hierarchy_level)
VALUES ('44444444-4444-4444-4444-444444444444', 'LIDER', 'Lider de Equipe', true, 50)
ON CONFLICT DO NOTHING;

-- Colaborador
INSERT INTO shared.roles (id, name, description, is_system_role, hierarchy_level)
VALUES ('55555555-5555-5555-5555-555555555555', 'COLABORADOR', 'Colaborador padrao', true, 10)
ON CONFLICT DO NOTHING;

-- Contador
INSERT INTO shared.roles (id, name, description, is_system_role, hierarchy_level)
VALUES ('66666666-6666-6666-6666-666666666666', 'CONTADOR', 'Contador/Escritorio externo', true, 60)
ON CONFLICT DO NOTHING;

-- =====================================================
-- ROLE_PERMISSIONS: Associar permissoes aos roles
-- =====================================================

-- ADMIN: todas as permissoes
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM shared.permissions
ON CONFLICT DO NOTHING;

-- GESTOR_RH: permissoes de RH
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '22222222-2222-2222-2222-222222222222', id FROM shared.permissions
WHERE module IN ('employees', 'performance', 'learning', 'reports')
ON CONFLICT DO NOTHING;

-- ANALISTA_DP: permissoes de DP
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333333', id FROM shared.permissions
WHERE module IN ('employees', 'timesheet', 'vacation', 'reports')
ON CONFLICT DO NOTHING;

-- LIDER: permissoes limitadas da equipe
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '44444444-4444-4444-4444-444444444444', id FROM shared.permissions
WHERE (resource = 'EMPLOYEE' AND action = 'READ')
   OR (resource = 'TIMESHEET' AND action IN ('READ', 'APPROVE'))
   OR (resource = 'VACATION' AND action IN ('READ', 'APPROVE'))
   OR (resource = 'PERFORMANCE' AND action IN ('READ', 'CREATE', 'UPDATE'))
ON CONFLICT DO NOTHING;

-- COLABORADOR: apenas autoatendimento
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '55555555-5555-5555-5555-555555555555', id FROM shared.permissions
WHERE (resource = 'TIMESHEET' AND action IN ('CREATE', 'READ'))
   OR (resource = 'VACATION' AND action IN ('CREATE', 'READ'))
   OR (resource = 'LEARNING' AND action = 'READ')
ON CONFLICT DO NOTHING;

-- CONTADOR: permissoes de visualizacao e exportacao
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '66666666-6666-6666-6666-666666666666', id FROM shared.permissions
WHERE (resource IN ('EMPLOYEE', 'TIMESHEET', 'VACATION') AND action IN ('READ', 'EXPORT'))
   OR (resource = 'REPORT' AND action IN ('READ', 'EXPORT'))
ON CONFLICT DO NOTHING;

-- =====================================================
-- SEED: Usuario admin para tenant de demonstracao
-- =====================================================
INSERT INTO shared.users (
    id, tenant_id, name, email, password_hash, status, email_verified_at
) VALUES (
    'd1111111-1111-1111-1111-111111111111',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- tenant_exemplo
    'Administrador',
    'admin@exemplo.com.br',
    -- Senha: Admin@123 (hash Argon2)
    '$argon2id$v=19$m=65536,t=3,p=1$c29tZXNhbHQ$RdescudvJCsgt3ub+b+dWRWJTmaaJObG',
    'ACTIVE',
    NOW()
) ON CONFLICT DO NOTHING;

-- Associar admin ao role ADMIN
INSERT INTO shared.user_roles (user_id, role_id)
VALUES ('d1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

DO $$
BEGIN
    RAISE NOTICE 'Roles e Permissions criados com sucesso!';
    RAISE NOTICE 'Usuario admin criado: admin@exemplo.com.br / Admin@123';
END $$;
