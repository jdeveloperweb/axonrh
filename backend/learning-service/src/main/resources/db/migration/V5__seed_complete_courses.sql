-- =====================================================
-- Seed de Treinamentos Completos para a Axon Academy
-- Versão Robusta: Insere para todos os tenants encontrados
-- =====================================================

DO $$
DECLARE
    r_tenant RECORD;
    v_tenant_id UUID;
    v_cat_lideranca UUID;
    v_cat_tech UUID;
    v_cat_cultura UUID;
    v_cat_seguranca UUID;
    v_course_id UUID;
    v_module_id UUID;
    v_lesson_id UUID;
BEGIN
    -- Loop por todos os tenants disponíveis
    -- Adicionamos o tenant zero como fallback caso a tabela esteja vazia ou seja usado como padrão
    FOR r_tenant IN 
        SELECT id FROM shared.tenants 
        UNION 
        SELECT '00000000-0000-0000-0000-000000000000'::UUID
    LOOP
        v_tenant_id := r_tenant.id;

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
        -- Verificamos se o curso já existe para evitar duplicatas em re-execuções (considerando o título por tenant)
        IF NOT EXISTS (SELECT 1 FROM shared.courses WHERE tenant_id = v_tenant_id AND title = 'Bem-vindo à Axon: Guia Definitivo de Imersão') THEN
            
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
                    '# Bem-vindo à AxonRH: O Futuro da Gestão de Pessoas\n\nNascemos em 2020 com um propósito audacioso: **humanizar as organizações através da tecnologia**. A Axon surgiu para resolver a burocracia que impedia o RH de cuidar do que realmente importa: as pessoas.');

            -- Módulo 2: Benefícios
            INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
            VALUES (v_course_id, 'Seu Bem-estar: Benefícios Axon', 2, 60) RETURNING id INTO v_module_id;
            
            INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
            VALUES (v_module_id, 'Guia de Benefícios Completo', 'ARTIGO', 1, 45, 
                    '# Cuidando de quem cuida da Axon\n\nNosso pacote de benefícios foi desenhado para garantir sua tranquilidade e crescimento.\n\n- **Cartão Flash:** R$ 1.200,00 flexíveis.\n- **Saúde Bradesco Premium:** Plano nacional.\n- **Home Office:** Auxílio mensal de R$ 250,00.');
        END IF;

        -- 3. CURSO: Segurança da Informação (OBRIGATÓRIO)
        IF NOT EXISTS (SELECT 1 FROM shared.courses WHERE tenant_id = v_tenant_id AND title = 'Cibersegurança e LGPD: Defesa Prática') THEN
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
                    '# Segurança em Primeiro Lugar\n\nLidamos com informações sensíveis de milhares de colaboradores. Seguir a LGPD não é apenas uma obrigação legal, é um compromisso ético com a privacidade.');
        END IF;

        -- 4. CURSO: Liderança Alpha
        IF NOT EXISTS (SELECT 1 FROM shared.courses WHERE tenant_id = v_tenant_id AND title = 'Liderança Alpha: Gestão de Times Remotos') THEN
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
                    '# Liderando no Remoto\n\nA gestão moderna exige **confiança sobre controle**.\n\n- **1:1s:** O ritual mais importante para ouvir o colaborador.\n- **Sinceridade Radical:** Combine desafio direto com cuidado pessoal.');
        END IF;

        -- 5. CURSO: IA Generativa
        IF NOT EXISTS (SELECT 1 FROM shared.courses WHERE tenant_id = v_tenant_id AND title = 'IA Generativa para Negócios: Do Zero ao Pro') THEN
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
                    '# Engenharia de Prompts\n\nAprenda o framework **CO-STAR** para obter resultados incríveis.');
        END IF;

        -- 6. CURSO: Comunicação Não-Violenta (CNV)
        IF NOT EXISTS (SELECT 1 FROM shared.courses WHERE tenant_id = v_tenant_id AND title = 'Comunicação Não-Violenta e Empatia') THEN
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
                    '# Aplicando CNV no Trabalho\n\n1. **Observação:** Descreva o fato sem julgar.\n2. **Sentimento:** Expresse como se sente.');
        END IF;

        -- 7. CURSO: Excel para Negócios
        IF NOT EXISTS (SELECT 1 FROM shared.courses WHERE tenant_id = v_tenant_id AND title = 'Excel para Negócios: De Fórmulas a Dashboards') THEN
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
                    '# O Poder das Planilhas Inteligentes\n\nTransforme dados brutos em decisões estratégicas!');
        END IF;

    END LOOP;

    RAISE NOTICE 'Seed de cursos completo e distribuído por todos os tenants com sucesso.';

END $$;
