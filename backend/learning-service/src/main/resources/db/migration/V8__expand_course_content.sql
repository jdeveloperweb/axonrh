-- =====================================================
-- Expansão de Conteúdo dos Treinamentos
-- Adiciona múltiplos módulos e lições detalhadas para cada curso
-- =====================================================

DO $$
DECLARE
    r_tenant RECORD;
    v_tenant_id UUID;
    v_course_id UUID;
    v_module_id UUID;
BEGIN
    FOR r_tenant IN 
        SELECT id FROM shared.tenants 
        UNION 
        SELECT '00000000-0000-0000-0000-000000000000'::UUID
    LOOP
        v_tenant_id := r_tenant.id;

        -- 1. Expansão: Onboarding Axon
        SELECT id INTO v_course_id FROM shared.courses WHERE tenant_id = v_tenant_id AND title = 'Bem-vindo à Axon: Guia Definitivo de Imersão';
        
        IF v_course_id IS NOT NULL THEN
            -- Módulo 3: Ferramentas e Processos
            INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
            VALUES (v_course_id, 'Ecossistema Axon: Ferramentas e Processos', 3, 60) RETURNING id INTO v_module_id;
            
            INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
            VALUES (v_module_id, 'Configurando seu Workspace', 'ARTIGO', 1, 30, 
                    '# Seu Ambiente de Trabalho\n\nNa Axon, utilizamos as melhores ferramentas do mercado para garantir produtividade e transparência.\n\n1. **Slack:** Nossa sede oficial. Comunique-se, tire dúvidas e participe de canais de lazer.\n2. **Jira:** Onde a magia acontece. Todas as tarefas são mapeadas aqui.\n3. **Confluence:** Nossa Wiki. Documentação é sagrada.\n4. **Google Workspace:** E-mail e documentos colaborativos.');
            
            INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
            VALUES (v_module_id, 'Processos e Rituais de Gestão', 'ARTIGO', 2, 30, 
                    '# Como trabalhamos\n\n- **Dailies:** 15 minutos para alinhar o dia.\n- **Sprints:** Ciclos de 2 semanas de trabalho focado.\n- **Retrospectivas:** Momento de aprender com o que passou.');
        END IF;

        -- 2. Expansão: Liderança Alpha
        SELECT id INTO v_course_id FROM shared.courses WHERE tenant_id = v_tenant_id AND title = 'Liderança Alpha: Gestão de Times Remotos';
        
        IF v_course_id IS NOT NULL THEN
            -- Módulo 2: Inteligência Emocional e Feedback
            INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
            VALUES (v_course_id, 'Inteligência Emocional e a Arte do Feedback', 2, 90) RETURNING id INTO v_module_id;
            
            INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
            VALUES (v_module_id, 'O Ciclo do Feedback Construtivo', 'ARTIGO', 1, 45, 
                    '# Dando Feedback que Transforma\n\nFeedback não é sobre o passado, é sobre o futuro.\n\n### O Modelo SBI (Situation, Behavior, Impact)\n\n1. **Situação:** Descreva o contexto exato.\n2. **Comportamento:** O que o indivíduo fez (sem julgamentos).\n3. **Impacto:** Como aquilo afetou o time ou o projeto.');
            
            INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
            VALUES (v_module_id, 'Autoconfiança e Gestão de Conflitos', 'ARTIGO', 2, 45, 
                    '# Liderança Sob Pressão\n\nComo manter a calma e mediar conflitos entre membros do time de forma imparcial e produtiva.');
        END IF;

        -- 3. Expansão: IA Generativa
        SELECT id INTO v_course_id FROM shared.courses WHERE tenant_id = v_tenant_id AND title = 'IA Generativa para Negócios: Do Zero ao Pro';
        
        IF v_course_id IS NOT NULL THEN
            -- Módulo 2: Casos Reais e Automação
            INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
            VALUES (v_course_id, 'IA na Prática: Automação de Tarefas', 2, 120) RETURNING id INTO v_module_id;
            
            INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
            VALUES (v_module_id, 'Análise de Dados com Code Interpreter', 'ARTIGO', 1, 60, 
                    '# Transformando Dados em Insights\n\nUpload de planilhas e extração de gráficos e tendências usando IA de forma ética e segura.');
            
            INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
            VALUES (v_module_id, 'Criando Agentes Personalizados (GPTs)', 'ARTIGO', 2, 60, 
                    '# Seu Assistente Virtual\n\nComo configurar instruções customizadas para que a IA aja como um analista de RH ou um desenvolvedor sênior.');
        END IF;

        -- 4. Expansão: Cibersegurança
        SELECT id INTO v_course_id FROM shared.courses WHERE tenant_id = v_tenant_id AND title = 'Cibersegurança e LGPD: Defesa Prática';
        
        IF v_course_id IS NOT NULL THEN
            -- Módulo 2: Engenharia Social e Resposta a Incidentes
            INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
            VALUES (v_course_id, 'Engenharia Social e Resposta a Incidentes', 2, 60) RETURNING id INTO v_module_id;
            
            INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
            VALUES (v_module_id, 'Identificando Ataques de Engenharia Social', 'ARTIGO', 1, 30, 
                    '# Não seja a próxima vítima\n\nAtaques de engenharia social exploram o elo mais fraco da corrente: o ser humano.\n\n- **Phishing:** E-mails falsos.\n- **Vishing:** Chamadas de voz fraudulentas.\n- **Baiting:** Brindes ou arquivos infectados.');
        END IF;

        -- 5. Expansão: Excel para Negócios
        SELECT id INTO v_course_id FROM shared.courses WHERE tenant_id = v_tenant_id AND title = 'Excel para Negócios: De Fórmulas a Dashboards';
        
        IF v_course_id IS NOT NULL THEN
            -- Módulo 2: Fórmulas Avançadas e Dashboards
            INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
            VALUES (v_course_id, 'Fórmulas Avançadas e Dashboards Dinâmicos', 2, 120) RETURNING id INTO v_module_id;
            
            INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
            VALUES (v_module_id, 'PROCX e Fórmulas de Matrizes Dinâmicas', 'ARTIGO', 1, 60, 
                    '# O Fim do PROCV\n\nAprenda por que o PROCX é mais seguro e flexível para suas buscas de dados.');
        END IF;

    END LOOP;
END $$;
