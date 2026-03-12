-- Migracao para adicionar permissoes granulares de novos modulos
INSERT INTO shared.permissions (resource, action, display_name, description, module) VALUES
-- Beneficios
('BENEFIT', 'READ', 'Visualizar Beneficios', 'Permite visualizar catalogo e elegibilidade de beneficios', 'benefits'),
('BENEFIT', 'CREATE', 'Criar Beneficio', 'Permite cadastrar novos planos e tipos de beneficios', 'benefits'),
('BENEFIT', 'UPDATE', 'Editar Beneficio', 'Permite alterar configuracoes de beneficios', 'benefits'),
('BENEFIT', 'DELETE', 'Excluir Beneficio', 'Permite remover beneficios do catalogo', 'benefits'),
('BENEFIT', 'APPROVE', 'Aprovar Solicitacao', 'Permite aprovar adesao de colaboradores a beneficios', 'benefits'),

-- Recrutamento Digital & Talent Pool
('HIRING', 'READ', 'Visualizar Vagas', 'Permite visualizar vagas e candidatos', 'digital-hiring'),
('HIRING', 'CREATE', 'Criar Vaga', 'Permite abrir novas posicoes no portal de vagas', 'digital-hiring'),
('HIRING', 'UPDATE', 'Editar Vaga', 'Permite alterar status e dados de vagas', 'digital-hiring'),
('HIRING', 'DELETE', 'Excluir Vaga', 'Permite remover vagas do portal', 'digital-hiring'),
('HIRING', 'MANAGE_STAGES', 'Gerir Etapas', 'Permite mover candidatos entre etapas do funil', 'digital-hiring'),

-- Admissao Digital
('ADMISSION', 'READ', 'Visualizar Admissoes', 'Permite acompanhar processos de admissao', 'admissions'),
('ADMISSION', 'CREATE', 'Iniciar Admissao', 'Permite iniciar novo processo de admissao digital', 'admissions'),
('ADMISSION', 'UPDATE', 'Validar Documentos', 'Permite revisar e validar documentos enviados por candidatos', 'admissions'),
('ADMISSION', 'APPROVE', 'Finalizar Admissao', 'Permite concluir a admissao e gerar matricula', 'admissions'),

-- Bem-estar & Eventos
('WELLBEING', 'READ', 'Visualizar Conteudo', 'Permite visualizar guias e conteudos de bem-estar', 'wellbeing'),
('WELLBEING', 'CREATE', 'Criar Conteudo', 'Permite publicar manuais e guias de saude', 'wellbeing'),
('EVENT', 'CREATE', 'Agendar Evento', 'Permite criar eventos no calendario corporativo', 'wellbeing'),

-- Integracoes & Webhooks
('INTEGRATION', 'READ', 'Visualizar Integracoes', 'Permite visualizar configuracoes de sistemas externos', 'admin'),
('INTEGRATION', 'UPDATE', 'Configurar Integracoes', 'Permite alterar chaves de API e webhooks', 'admin')
ON CONFLICT DO NOTHING;

-- Associar ao ADMIN
INSERT INTO shared.role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM shared.permissions
WHERE resource IN ('BENEFIT', 'HIRING', 'ADMISSION', 'WELLBEING', 'EVENT', 'INTEGRATION')
ON CONFLICT DO NOTHING;
