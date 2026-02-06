-- =====================================================
-- Enhanced DISC Assessment Tables
-- V6 - Complete DISC Implementation
-- =====================================================

-- Tabela de questionarios DISC
CREATE TABLE disc_questionnaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_disc_questionnaires_tenant ON disc_questionnaires(tenant_id);

-- Tabela de perguntas DISC
CREATE TABLE disc_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    questionnaire_id UUID REFERENCES disc_questionnaires(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_disc_questions_tenant ON disc_questions(tenant_id);
CREATE INDEX idx_disc_questions_questionnaire ON disc_questions(questionnaire_id);

-- Tabela de opcoes de resposta DISC
CREATE TABLE disc_question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES disc_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    disc_type VARCHAR(1) NOT NULL CHECK (disc_type IN ('D', 'I', 'S', 'C')),
    option_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_disc_options_question ON disc_question_options(question_id);

-- Adicionar colunas na tabela de avaliacoes DISC existente
ALTER TABLE disc_evaluations
ADD COLUMN IF NOT EXISTS questionnaire_id UUID REFERENCES disc_questionnaires(id),
ADD COLUMN IF NOT EXISTS requested_by UUID,
ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS employee_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Alterar status para incluir mais estados
ALTER TABLE disc_evaluations
ALTER COLUMN status TYPE VARCHAR(30);

-- Criar tabela de atribuicoes de avaliacoes DISC
CREATE TABLE disc_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    questionnaire_id UUID REFERENCES disc_questionnaires(id),
    employee_id UUID NOT NULL,
    employee_name VARCHAR(255),
    assigned_by UUID NOT NULL,
    assigned_by_name VARCHAR(255),
    due_date DATE,
    status VARCHAR(30) DEFAULT 'PENDING',
    evaluation_id UUID REFERENCES disc_evaluations(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_disc_assignments_tenant ON disc_assignments(tenant_id);
CREATE INDEX idx_disc_assignments_employee ON disc_assignments(employee_id);
CREATE INDEX idx_disc_assignments_status ON disc_assignments(status);

-- Tabela de descricoes de perfil DISC
CREATE TABLE disc_profile_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    profile_type VARCHAR(20) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    strengths TEXT,
    weaknesses TEXT,
    communication_style TEXT,
    work_environment TEXT,
    motivators TEXT,
    stressors TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_disc_profile_desc_type ON disc_profile_descriptions(profile_type);

-- Inserir questionario padrao
INSERT INTO disc_questionnaires (id, tenant_id, name, description, is_active, is_default)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'Questionario DISC Padrao',
    'Questionario DISC completo com 28 perguntas para analise comportamental',
    true,
    true
);

-- Inserir perguntas do questionario DISC padrao (28 perguntas)
-- Bloco 1-7: Perguntas sobre comportamento em grupo e lideranca
INSERT INTO disc_questions (id, tenant_id, questionnaire_id, question_text, question_order) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Quando estou em um grupo, eu costumo...', 1),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Diante de um conflito, minha reacao e...', 2),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'No trabalho, valorizo mais...', 3),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Minha forma de comunicacao e...', 4),
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Quando preciso tomar uma decisao importante, eu...', 5),
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Em relacao a mudancas, eu geralmente...', 6),
('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Minha abordagem para resolver problemas e...', 7),

-- Bloco 8-14: Perguntas sobre trabalho em equipe e relacionamentos
('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Quando trabalho em equipe, eu prefiro...', 8),
('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Sob pressao, eu tendo a...', 9),
('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Minha maior motivacao no trabalho e...', 10),
('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Quando recebo feedback negativo, eu...', 11),
('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Em reunioes, eu geralmente...', 12),
('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Quando tenho um prazo apertado, eu...', 13),
('10000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Meu estilo de lideranca e mais...', 14),

-- Bloco 15-21: Perguntas sobre organizacao e planejamento
('10000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Na organizacao do meu trabalho, eu...', 15),
('10000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Quando alguem discorda de mim, eu...', 16),
('10000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Minha abordagem para novos projetos e...', 17),
('10000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Em situacoes sociais no trabalho, eu...', 18),
('10000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Quando preciso de ajuda, eu...', 19),
('10000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Minha relacao com regras e procedimentos e...', 20),
('10000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Ao delegar tarefas, eu costumo...', 21),

-- Bloco 22-28: Perguntas sobre valores e preferencias
('10000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Quando cometo um erro, eu...', 22),
('10000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Minha forma de celebrar conquistas e...', 23),
('10000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Em relacao ao ambiente de trabalho ideal, eu prefiro...', 24),
('10000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Quando tenho muitas tarefas, eu...', 25),
('10000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Minha atitude em relacao a riscos e...', 26),
('10000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Quando preciso influenciar alguem, eu...', 27),
('10000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'Minha principal caracteristica profissional e...', 28);

-- Inserir opcoes para cada pergunta
-- Pergunta 1
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000001', 'Assumir a lideranca e definir o rumo', 'D', 1),
('10000000-0000-0000-0000-000000000001', 'Conversar e animar o ambiente', 'I', 2),
('10000000-0000-0000-0000-000000000001', 'Ouvir e apoiar os outros', 'S', 3),
('10000000-0000-0000-0000-000000000001', 'Observar e analisar os detalhes', 'C', 4);

-- Pergunta 2
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000002', 'Enfrentar e resolver logo', 'D', 1),
('10000000-0000-0000-0000-000000000002', 'Tentar persuadir e apaziguar', 'I', 2),
('10000000-0000-0000-0000-000000000002', 'Evitar e buscar a harmonia', 'S', 3),
('10000000-0000-0000-0000-000000000002', 'Analisar os fatos logicamente', 'C', 4);

-- Pergunta 3
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000003', 'Resultados e desafios', 'D', 1),
('10000000-0000-0000-0000-000000000003', 'Reconhecimento e interacao', 'I', 2),
('10000000-0000-0000-0000-000000000003', 'Seguranca e estabilidade', 'S', 3),
('10000000-0000-0000-0000-000000000003', 'Precisao e qualidade', 'C', 4);

-- Pergunta 4
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000004', 'Direta e assertiva', 'D', 1),
('10000000-0000-0000-0000-000000000004', 'Entusiasta e persuasiva', 'I', 2),
('10000000-0000-0000-0000-000000000004', 'Calma e atenciosa', 'S', 3),
('10000000-0000-0000-0000-000000000004', 'Detalhada e especifica', 'C', 4);

-- Pergunta 5
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000005', 'Decido rapidamente e sigo em frente', 'D', 1),
('10000000-0000-0000-0000-000000000005', 'Consulto outras pessoas e busco consenso', 'I', 2),
('10000000-0000-0000-0000-000000000005', 'Penso bem antes de agir', 'S', 3),
('10000000-0000-0000-0000-000000000005', 'Analiso todas as opcoes detalhadamente', 'C', 4);

-- Pergunta 6
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000006', 'Abraco as mudancas e lidero a transicao', 'D', 1),
('10000000-0000-0000-0000-000000000006', 'Vejo o lado positivo e motivo os outros', 'I', 2),
('10000000-0000-0000-0000-000000000006', 'Preciso de tempo para me adaptar', 'S', 3),
('10000000-0000-0000-0000-000000000006', 'Questiono e avalio os riscos', 'C', 4);

-- Pergunta 7
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000007', 'Ir direto ao ponto e agir rapidamente', 'D', 1),
('10000000-0000-0000-0000-000000000007', 'Fazer um brainstorm com a equipe', 'I', 2),
('10000000-0000-0000-0000-000000000007', 'Buscar solucoes que funcionaram antes', 'S', 3),
('10000000-0000-0000-0000-000000000007', 'Pesquisar e analisar todas as opcoes', 'C', 4);

-- Pergunta 8
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000008', 'Liderar e direcionar as acoes', 'D', 1),
('10000000-0000-0000-0000-000000000008', 'Colaborar e manter o clima positivo', 'I', 2),
('10000000-0000-0000-0000-000000000008', 'Apoiar e garantir a harmonia', 'S', 3),
('10000000-0000-0000-0000-000000000008', 'Garantir a qualidade e os padroes', 'C', 4);

-- Pergunta 9
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000009', 'Ficar mais focado e determinado', 'D', 1),
('10000000-0000-0000-0000-000000000009', 'Buscar apoio e compartilhar a carga', 'I', 2),
('10000000-0000-0000-0000-000000000009', 'Manter a calma e seguir o plano', 'S', 3),
('10000000-0000-0000-0000-000000000009', 'Verificar cada detalhe com mais cuidado', 'C', 4);

-- Pergunta 10
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000010', 'Alcancar metas e obter resultados', 'D', 1),
('10000000-0000-0000-0000-000000000010', 'Ser reconhecido e trabalhar com pessoas', 'I', 2),
('10000000-0000-0000-0000-000000000010', 'Ter estabilidade e um bom ambiente', 'S', 3),
('10000000-0000-0000-0000-000000000010', 'Fazer um trabalho de alta qualidade', 'C', 4);

-- Pergunta 11
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000011', 'Aceito e sigo em frente rapidamente', 'D', 1),
('10000000-0000-0000-0000-000000000011', 'Fico um pouco chateado mas logo supero', 'I', 2),
('10000000-0000-0000-0000-000000000011', 'Reflito e busco entender o ponto de vista', 'S', 3),
('10000000-0000-0000-0000-000000000011', 'Analiso o feedback detalhadamente', 'C', 4);

-- Pergunta 12
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000012', 'Conduzo a discussao e defino proximos passos', 'D', 1),
('10000000-0000-0000-0000-000000000012', 'Participo ativamente e compartilho ideias', 'I', 2),
('10000000-0000-0000-0000-000000000012', 'Ouco mais do que falo', 'S', 3),
('10000000-0000-0000-0000-000000000012', 'Tomo notas e faco perguntas especificas', 'C', 4);

-- Pergunta 13
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000013', 'Priorizo e foco no essencial', 'D', 1),
('10000000-0000-0000-0000-000000000013', 'Mobilizo a equipe para ajudar', 'I', 2),
('10000000-0000-0000-0000-000000000013', 'Trabalho de forma constante e consistente', 'S', 3),
('10000000-0000-0000-0000-000000000013', 'Planejo cada etapa cuidadosamente', 'C', 4);

-- Pergunta 14
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000014', 'Orientado a resultados e desafiador', 'D', 1),
('10000000-0000-0000-0000-000000000014', 'Inspirador e motivacional', 'I', 2),
('10000000-0000-0000-0000-000000000014', 'Apoiador e facilitador', 'S', 3),
('10000000-0000-0000-0000-000000000014', 'Detalhista e orientado a processos', 'C', 4);

-- Pergunta 15
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000015', 'Priorizo pelo impacto e resultados', 'D', 1),
('10000000-0000-0000-0000-000000000015', 'Mantenho flexibilidade e criatividade', 'I', 2),
('10000000-0000-0000-0000-000000000015', 'Sigo uma rotina estabelecida', 'S', 3),
('10000000-0000-0000-0000-000000000015', 'Organizo tudo de forma sistematica', 'C', 4);

-- Pergunta 16
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000016', 'Defendo meu ponto de vista com firmeza', 'D', 1),
('10000000-0000-0000-0000-000000000016', 'Tento encontrar um meio-termo', 'I', 2),
('10000000-0000-0000-0000-000000000016', 'Considero o ponto de vista do outro', 'S', 3),
('10000000-0000-0000-0000-000000000016', 'Peco mais informacoes e dados', 'C', 4);

-- Pergunta 17
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000017', 'Comecar logo e ajustar no caminho', 'D', 1),
('10000000-0000-0000-0000-000000000017', 'Reunir o time e criar entusiasmo', 'I', 2),
('10000000-0000-0000-0000-000000000017', 'Entender bem o contexto antes de comecar', 'S', 3),
('10000000-0000-0000-0000-000000000017', 'Criar um plano detalhado primeiro', 'C', 4);

-- Pergunta 18
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000018', 'Mantenho as conversas breves e objetivas', 'D', 1),
('10000000-0000-0000-0000-000000000018', 'Adoro interagir e conhecer pessoas', 'I', 2),
('10000000-0000-0000-0000-000000000018', 'Converso com pessoas que ja conheco', 'S', 3),
('10000000-0000-0000-0000-000000000018', 'Prefiro conversas mais profundas com poucos', 'C', 4);

-- Pergunta 19
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000019', 'Tento resolver sozinho primeiro', 'D', 1),
('10000000-0000-0000-0000-000000000019', 'Peco ajuda abertamente', 'I', 2),
('10000000-0000-0000-0000-000000000019', 'Espero ate realmente precisar', 'S', 3),
('10000000-0000-0000-0000-000000000019', 'Busco especialistas no assunto', 'C', 4);

-- Pergunta 20
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000020', 'Questiono se fazem sentido para os resultados', 'D', 1),
('10000000-0000-0000-0000-000000000020', 'Tento tornar os processos mais leves', 'I', 2),
('10000000-0000-0000-0000-000000000020', 'Sigo as regras estabelecidas', 'S', 3),
('10000000-0000-0000-0000-000000000020', 'Valorizo e respeito cada procedimento', 'C', 4);

-- Pergunta 21
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000021', 'Dar direcoes claras e esperar resultados', 'D', 1),
('10000000-0000-0000-0000-000000000021', 'Explicar o contexto e motivar a pessoa', 'I', 2),
('10000000-0000-0000-0000-000000000021', 'Dar suporte continuo durante a execucao', 'S', 3),
('10000000-0000-0000-0000-000000000021', 'Detalhar cada passo e verificar o andamento', 'C', 4);

-- Pergunta 22
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000022', 'Corrijo rapidamente e sigo em frente', 'D', 1),
('10000000-0000-0000-0000-000000000022', 'Admito e tento amenizar a situacao', 'I', 2),
('10000000-0000-0000-0000-000000000022', 'Me sinto mal e busco entender o que aconteceu', 'S', 3),
('10000000-0000-0000-0000-000000000022', 'Analiso o que deu errado para nao repetir', 'C', 4);

-- Pergunta 23
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000023', 'Focar rapidamente no proximo desafio', 'D', 1),
('10000000-0000-0000-0000-000000000023', 'Celebrar com a equipe e compartilhar', 'I', 2),
('10000000-0000-0000-0000-000000000023', 'Agradecer a todos que contribuiram', 'S', 3),
('10000000-0000-0000-0000-000000000023', 'Documentar o que funcionou bem', 'C', 4);

-- Pergunta 24
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000024', 'Dinamico com muitos desafios', 'D', 1),
('10000000-0000-0000-0000-000000000024', 'Colaborativo e com bastante interacao', 'I', 2),
('10000000-0000-0000-0000-000000000024', 'Tranquilo e com boa convivencia', 'S', 3),
('10000000-0000-0000-0000-000000000024', 'Organizado e com processos claros', 'C', 4);

-- Pergunta 25
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000025', 'Priorizo e elimino as menos importantes', 'D', 1),
('10000000-0000-0000-0000-000000000025', 'Divido com a equipe e delego', 'I', 2),
('10000000-0000-0000-0000-000000000025', 'Faco uma de cada vez com calma', 'S', 3),
('10000000-0000-0000-0000-000000000025', 'Crio uma lista organizada por prioridade', 'C', 4);

-- Pergunta 26
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000026', 'Assumo riscos calculados para ter resultados', 'D', 1),
('10000000-0000-0000-0000-000000000026', 'Gosto de arriscar quando vejo potencial', 'I', 2),
('10000000-0000-0000-0000-000000000026', 'Prefiro a seguranca do conhecido', 'S', 3),
('10000000-0000-0000-0000-000000000026', 'Analiso todos os riscos antes de decidir', 'C', 4);

-- Pergunta 27
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000027', 'Sou direto sobre o que preciso', 'D', 1),
('10000000-0000-0000-0000-000000000027', 'Uso meu carisma e persuasao', 'I', 2),
('10000000-0000-0000-0000-000000000027', 'Construo relacionamento primeiro', 'S', 3),
('10000000-0000-0000-0000-000000000027', 'Apresento dados e fatos concretos', 'C', 4);

-- Pergunta 28
INSERT INTO disc_question_options (question_id, option_text, disc_type, option_order) VALUES
('10000000-0000-0000-0000-000000000028', 'Determinacao e foco em resultados', 'D', 1),
('10000000-0000-0000-0000-000000000028', 'Comunicacao e relacionamento', 'I', 2),
('10000000-0000-0000-0000-000000000028', 'Confiabilidade e trabalho em equipe', 'S', 3),
('10000000-0000-0000-0000-000000000028', 'Precisao e atencao aos detalhes', 'C', 4);

-- Inserir descricoes de perfil DISC padrao
INSERT INTO disc_profile_descriptions (tenant_id, profile_type, title, description, strengths, weaknesses, communication_style, work_environment, motivators, stressors, is_default) VALUES
(NULL, 'DOMINANCE', 'Dominante',
 'Pessoas com perfil Dominante (D) sao orientadas a resultados, diretas e assertivas. Gostam de desafios e de assumir o controle das situacoes. Sao competitivas e buscam eficiencia.',
 'Tomada de decisao rapida, Visao orientada a metas, Disposicao para assumir riscos, Capacidade de liderar sob pressao',
 'Pode ser impaciente com detalhes, Pode parecer insensivel, Dificuldade em delegar',
 'Comunicacao direta e objetiva. Prefere ir direto ao ponto sem rodeios.',
 'Ambiente dinamico, desafiador, com autonomia e oportunidades de lideranca.',
 'Novos desafios, Autoridade, Resultados tangiveis, Reconhecimento por conquistas',
 'Falta de controle, Rotina, Falta de desafios, Restricoes excessivas',
 true),

(NULL, 'INFLUENCE', 'Influente',
 'Pessoas com perfil Influente (I) sao comunicativas, entusiastas e persuasivas. Gostam de interagir com pessoas e criar um ambiente positivo. Sao otimistas e criativas.',
 'Otimismo e entusiasmo, Facilidade em persuadir, Criatividade, Habilidade de networking',
 'Pode ter dificuldade com detalhes, Pode ser desorganizado, Tende a evitar conflitos',
 'Comunicacao expressiva e emocional. Gosta de historias e conexoes pessoais.',
 'Ambiente colaborativo, social, com reconhecimento e variedade de tarefas.',
 'Reconhecimento publico, Interacao social, Liberdade de expressao, Ambiente positivo',
 'Isolamento, Rejeicao, Rotina rigida, Falta de reconhecimento',
 true),

(NULL, 'STEADINESS', 'Estavel',
 'Pessoas com perfil Estavel (S) sao calmas, pacientes e leais. Valorizam a cooperacao e a estabilidade. Sao otimos ouvintes e construtores de equipe.',
 'Excelente ouvinte, Persistencia e consistencia, Habilidade conciliadora, Confiavel',
 'Pode resistir a mudancas, Dificuldade em confrontar, Pode ser muito cauteloso',
 'Comunicacao calma e atenciosa. Prefere conversas um a um.',
 'Ambiente estavel, harmonioso, com relacionamentos de longo prazo.',
 'Seguranca, Reconhecimento sincero, Ambiente de equipe, Estabilidade',
 'Mudancas bruscas, Conflitos, Pressao excessiva, Instabilidade',
 true),

(NULL, 'CONSCIENTIOUSNESS', 'Conforme',
 'Pessoas com perfil Conforme (C) sao analiticas, precisas e detalhistas. Valorizam a qualidade e seguem regras e padroes. Sao sistematicas e cuidadosas.',
 'Analise profunda, Padroes elevados de qualidade, Planejamento sistematico, Atencao aos detalhes',
 'Pode ser muito critico, Pode ter dificuldade com ambiguidade, Tendencia ao perfeccionismo',
 'Comunicacao detalhada e baseada em fatos. Prefere informacoes escritas.',
 'Ambiente organizado, com processos claros e tempo para analise.',
 'Qualidade, Precisao, Conhecimento, Ambiente organizado',
 'Erros, Falta de padroes, Decisoes precipitadas, Criticas ao trabalho',
 true);
