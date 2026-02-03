-- =====================================================
-- Seed de Treinamentos Completos para a Axon Academy
-- =====================================================

DO $$
DECLARE
    v_tenant_id UUID;
    v_cat_lideranca UUID;
    v_cat_tech UUID;
    v_cat_cultura UUID;
    v_cat_seguranca UUID;
    v_course_id UUID;
    v_module_id UUID;
    v_lesson_id UUID;
BEGIN
    -- Busca o ID do primeiro tenant disponível
    SELECT id INTO v_tenant_id FROM shared.tenants LIMIT 1;

    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'Nenhum tenant encontrado. Seed abortado.';
        RETURN;
    END IF;

    -- 1. Inserir Categorias
    INSERT INTO shared.training_categories (tenant_id, name, description, icon, color)
    VALUES (v_tenant_id, 'Liderança', 'Desenvolvimento de gestores e líderes', 'User', '#3b82f6')
    ON CONFLICT (tenant_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_cat_lideranca;

    INSERT INTO shared.training_categories (tenant_id, name, description, icon, color)
    VALUES (v_tenant_id, 'Tecnologia', 'Habilidades técnicas e ferramentas', 'LayoutGrid', '#10b981')
    ON CONFLICT (tenant_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_cat_tech;

    INSERT INTO shared.training_categories (tenant_id, name, description, icon, color)
    VALUES (v_tenant_id, 'Cultura', 'Cultura Axon e Soft Skills', 'GraduationCap', '#8b5cf6')
    ON CONFLICT (tenant_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_cat_cultura;

    INSERT INTO shared.training_categories (tenant_id, name, description, icon, color)
    VALUES (v_tenant_id, 'Segurança', 'Segurança da informação e conformidade', 'Shield', '#ef4444')
    ON CONFLICT (tenant_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_cat_seguranca;

    -- 2. CURSO: Onboarding Axon (OBRIGATÓRIO)
    INSERT INTO shared.courses (tenant_id, category_id, title, description, objectives, target_audience, course_type, modality, difficulty_level, status, is_mandatory, duration_minutes, instructor_name, thumbnail_url)
    VALUES (v_tenant_id, v_cat_cultura, 'Bem-vindo à Axon: Guia Definitivo de Imersão', 
            'A jornada completa para entender quem somos, como trabalhamos e para onde estamos indo.', 
            'Integrar novos talentos transmitindo cultura, valores e processos operacionais.', 'Novos Colaboradores', 
            'ONLINE', 'AUTODIDATA', 'INICIANTE', 'PUBLISHED', true, 240, 'Recursos Humanos',
            'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop')
    RETURNING id INTO v_course_id;

    -- Módulo 1: Nossa História, Visão e Valores
    INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
    VALUES (v_course_id, 'DNA Axon: Cultura e Propósito', 1, 60) RETURNING id INTO v_module_id;
    
    INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
    VALUES (v_module_id, 'Nossa Jornada e Pilares Culturais', 'ARTIGO', 1, 40, 
            '# Bem-vindo à AxonRH: O Futuro da Gestão de Pessoas\n\nNascemos em 2020 com um propósito audacioso: **humanizar as organizações através da tecnologia**. A Axon surgiu para resolver a burocracia que impedia o RH de cuidar do que realmente importa: as pessoas.\n\n### Nossos Pilares Culturais\n1. **Inovação Constante:** Não aceitamos o "sempre foi feito assim". Se algo pode ser melhorado, nós o faremos.\n2. **Foco no Usuário:** Desenvolvemos com empatia, ouvindo quem usa nossa plataforma todos os dias.\n3. **Transparência Radical:** Acreditamos que a informação livre gera times mais inteligentes e autônomos.\n4. **Diversidade e Inclusão:** Acreditamos que times diversos são inerentemente mais criativos e resilientes.\n\n## O que esperar da sua jornada\nVocê terá autonomia, ferramentas de ponta e um time que torce por você. Seja bem-vindo à família!');

    -- Módulo 2: Benefícios
    INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
    VALUES (v_course_id, 'Seu Bem-estar: Benefícios Axon', 2, 60) RETURNING id INTO v_module_id;
    
    INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
    VALUES (v_module_id, 'Guia de Benefícios Completo', 'ARTIGO', 1, 45, 
            '# Cuidando de quem cuida da Axon\n\nNosso pacote de benefícios foi desenhado para garantir sua tranquilidade e crescimento.\n\n- **Cartão Flash:** R$ 1.200,00 flexíveis (Refeição, Alimentação, Mobilidade, Educação).\n- **Saúde Bradesco Premium:** Plano nacional sem co-participação.\n- **Home Office:** R$ 250,00 mensais + Verba Setup única de R$ 2.000,00.\n- **Educação:** R$ 8.000,00 anuais para cursos e certificações.\n- **Gympass & ZenApp:** Saúde física e mental em dia.');

    -- 3. CURSO: Segurança da Informação (OBRIGATÓRIO)
    INSERT INTO shared.courses (tenant_id, category_id, title, description, course_type, difficulty_level, status, is_mandatory, duration_minutes, instructor_name, thumbnail_url)
    VALUES (v_tenant_id, v_cat_seguranca, 'Cibersegurança e LGPD: Defesa Prática', 
            'Domine as práticas essenciais para proteger os dados e a infraestrutura da Axon.', 
            'ONLINE', 'INICIANTE', 'PUBLISHED', true, 180, 'Time de Segurança',
            'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop')
    RETURNING id INTO v_course_id;

    INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
    VALUES (v_course_id, 'Proteção de Dados e Ameaças', 1, 120) RETURNING id INTO v_module_id;
    
    INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
    VALUES (v_module_id, 'LGPD e Combate ao Phishing', 'ARTIGO', 1, 90, 
            '# Segurança em Primeiro Lugar\n\n## LGPD (Lei Geral de Proteção de Dados)\nLidamos com informações sensíveis de milhares de colaboradores. Seguir a LGPD não é apenas uma obrigação legal, é um compromisso ético com a privacidade.\n\n## Como identificar Phishing\n1. Verifique o remetente cuidadosamente.\n2. Desconfie de urgência excessiva.\n3. Nunca forneça sua senha ou código MFA.\n4. Na dúvida, reporte no canal #is-security-breach.');

    -- 4. CURSO: Liderança Alpha
    INSERT INTO shared.courses (tenant_id, category_id, title, description, course_type, difficulty_level, status, is_mandatory, duration_minutes, instructor_name, thumbnail_url)
    VALUES (v_tenant_id, v_cat_lideranca, 'Liderança Alpha: Gestão de Times Remotos', 
            'Formação para gestores que buscam alta performance e engajamento em modelos flexíveis.', 
            'ONLINE', 'AVANCADO', 'PUBLISHED', false, 300, 'Dr. Rodrigo Porto',
            'https://images.unsplash.com/photo-15222071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop')
    RETURNING id INTO v_course_id;

    INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
    VALUES (v_course_id, 'Rituais, Feedback e Cultura', 1, 150) RETURNING id INTO v_module_id;
    
    INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
    VALUES (v_module_id, 'Framework de Liderança Distribuída', 'ARTIGO', 1, 120, 
            '# Liderando no Remoto\n\nA gestão moderna exige **confiança sobre controle**.\n\n- **1:1s:** O ritual mais importante para ouvir o colaborador.\n- **Sinceridade Radical:** Combine desafio direto com cuidado pessoal.\n- **Feedback SBI:** Seja específico na Situação, Comportamento e Impacto.');

    -- 5. CURSO: IA Generativa
    INSERT INTO shared.courses (tenant_id, category_id, title, description, course_type, difficulty_level, status, is_mandatory, duration_minutes, instructor_name, thumbnail_url)
    VALUES (v_tenant_id, v_cat_tech, 'IA Generativa para Negócios: Do Zero ao Pro', 
            'Aprenda a dominar LLMs e ferramentas de IA para revolucionar sua produtividade.', 
            'ONLINE', 'INTERMEDIARIO', 'PUBLISHED', false, 360, 'Eng. Carlos AI',
            'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop')
    RETURNING id INTO v_course_id;

    INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
    VALUES (v_course_id, 'Prompt Engineering e Aplicações', 1, 180) RETURNING id INTO v_module_id;
    
    INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
    VALUES (v_module_id, 'Dominando a Arte do Prompt', 'ARTIGO', 1, 120, 
            '# Engenharia de Prompts\n\nAprenda o framework **CO-STAR** para obter resultados incríveis:\n- **C (Context):** Forneça o contexto.\n- **O (Objective):** Defina o objetivo.\n- **S (Style):** Defina o estilo de escrita.\n- **T (Tone):** Defina o tom.\n- **A (Audience):** Defina o público.\n- **R (Response):** Defina o formato da resposta.\n\nSempre peça para a IA "pensar passo a passo" para tarefas complexas.');

    -- 6. CURSO: Comunicação Não-Violenta (CNV)
    INSERT INTO shared.courses (tenant_id, category_id, title, description, course_type, difficulty_level, status, is_mandatory, duration_minutes, instructor_name, thumbnail_url)
    VALUES (v_tenant_id, v_cat_cultura, 'Comunicação Não-Violenta e Empatia', 
            'Transforme conflitos em conexões produtivas através do diálogo empático.', 
            'ONLINE', 'INTERMEDIARIO', 'PUBLISHED', false, 180, 'Ana Clara Reghin',
            'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=800&auto=format&fit=crop')
    RETURNING id INTO v_course_id;

    INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
    VALUES (v_course_id, 'Os 4 Passos da CNV', 1, 90) RETURNING id INTO v_module_id;
    
    INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
    VALUES (v_module_id, 'A Gramática da Conexão', 'ARTIGO', 1, 60, 
            '# Aplicando CNV no Trabalho\n\n1. **Observação:** Descreva o fato sem julgar.\n2. **Sentimento:** Expresse como se sente.\n3. **Necessidade:** Identifique o valor não atendido.\n4. **Pedido:** Faça uma solicitação positiva e concreta.\n\nLembre-se: O objetivo da CNV não é conseguir o que se quer, mas estabelecer uma conexão de qualidade.');

    -- 7. CURSO: Vendas de Alta Conversão
    INSERT INTO shared.courses (tenant_id, category_id, title, description, course_type, difficulty_level, status, is_mandatory, duration_minutes, instructor_name, thumbnail_url)
    VALUES (v_tenant_id, v_cat_tech, 'Vendas de Alta Conversão', 
            'Técnicas modernas de vendas, gatilhos mentais e fechamento.', 
            'ONLINE', 'INTERMEDIARIO', 'PUBLISHED', false, 200, 'Marcos Oliveira',
            'https://images.unsplash.com/photo-1556761175-5973bcad5cca?q=80&w=800&auto=format&fit=crop')
    RETURNING id INTO v_course_id;

    INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
    VALUES (v_course_id, 'Neurovendas e SPIN Selling', 1, 100) RETURNING id INTO v_module_id;
    
    INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
    VALUES (v_module_id, 'Venda Consultiva de Impacto', 'ARTIGO', 1, 80, 
            '# O Método SPIN\n- **S (Situação):** Entenda o contexto.\n- **P (Problema):** Descubra a dor.\n- **I (Implicação):** Mostre o custo de não agir.\n- **N (Necessidade):** Ajude o cliente a ver o valor.\n\nVender é ajudar o cliente a resolver um problema que ele muitas vezes ainda não quantificou.');

    -- 8. CURSO: Excel para Negócios
    INSERT INTO shared.courses (tenant_id, category_id, title, description, course_type, difficulty_level, status, is_mandatory, duration_minutes, instructor_name, thumbnail_url)
    VALUES (v_tenant_id, v_cat_tech, 'Excel para Negócios: De Fórmulas a Dashboards', 
            'Domine o Excel e torne-se uma referência em análise de dados.', 
            'ONLINE', 'INICIANTE', 'PUBLISHED', false, 480, 'Beatriz Silva',
            'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop')
    RETURNING id INTO v_course_id;

    INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
    VALUES (v_course_id, 'Análise de Dados e Automação', 1, 240) RETURNING id INTO v_module_id;
    
    INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
    VALUES (v_module_id, 'PROCX, Dashboards e Tabelas Dinâmicas', 'ARTIGO', 1, 180, 
            '# O Poder das Planilhas Inteligentes\n\n- **PROCX:** A evolução definitiva do PROCV.\n- **Tabelas Dinâmicas:** Resuma milhares de dados em segundos.\n- **Dashboards:** Use segmentação de dados e gráficos dinâmicos para criar relatórios executivos de alto impacto.\n\nTransforme dados brutos em decisões estratégicas!');

    RAISE NOTICE 'Seed de cursos completo, rico e expandido com sucesso.';

END $$;
