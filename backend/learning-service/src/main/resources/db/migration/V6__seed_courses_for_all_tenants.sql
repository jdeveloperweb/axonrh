-- =====================================================
-- Seed de Treinamentos Completos para a Axon Academy (DISTRIBUIÇÃO)
-- Garante que os cursos existam para TODOS os tenants no banco.
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
BEGIN
    -- Loop por todos os tenants disponíveis + tenant zero
    FOR r_tenant IN 
        SELECT id FROM shared.tenants 
        UNION 
        SELECT '00000000-0000-0000-0000-000000000000'::UUID
    LOOP
        v_tenant_id := r_tenant.id;

        -- 1. Inserir Categorias (Garante que existam para este tenant)
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

        -- 2. CURSO: Onboarding Axon
        IF NOT EXISTS (SELECT 1 FROM shared.courses WHERE tenant_id = v_tenant_id AND title = 'Bem-vindo à Axon: Guia Definitivo de Imersão') THEN
            INSERT INTO shared.courses (tenant_id, category_id, title, description, objectives, target_audience, course_type, modality, difficulty_level, status, is_mandatory, duration_minutes, instructor_name, thumbnail_url)
            VALUES (v_tenant_id, v_cat_cultura, 'Bem-vindo à Axon: Guia Definitivo de Imersão', 
                    'A imersão completa na cultura, história e benefícios da AxonRH.', 
                    'Integrar novos talentos.', 'Novos Colaboradores', 
                    'ONLINE', 'AUTODIDATA', 'INICIANTE', 'PUBLISHED', true, 240, 'Recursos Humanos',
                    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop')
            RETURNING id INTO v_course_id;

            INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes) VALUES (v_course_id, 'DNA Axon', 1, 60);
        END IF;

        -- 3. CURSO: Cibersegurança
        IF NOT EXISTS (SELECT 1 FROM shared.courses WHERE tenant_id = v_tenant_id AND title = 'Cibersegurança e LGPD: Defesa Prática') THEN
            INSERT INTO shared.courses (tenant_id, category_id, title, description, course_type, difficulty_level, status, is_mandatory, duration_minutes, instructor_name, thumbnail_url)
            VALUES (v_tenant_id, v_cat_seguranca, 'Cibersegurança e LGPD: Defesa Prática', 
                    'Domine as práticas essenciais para proteger os dados da Axon.', 
                    'ONLINE', 'INICIANTE', 'PUBLISHED', true, 180, 'Time de Segurança',
                    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop')
            RETURNING id INTO v_course_id;

            INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes) VALUES (v_course_id, 'Proteção de Dados', 1, 120);
        END IF;

        -- 4. CURSO: IA Generativa
        IF NOT EXISTS (SELECT 1 FROM shared.courses WHERE tenant_id = v_tenant_id AND title = 'IA Generativa para Negócios: Do Zero ao Pro') THEN
            INSERT INTO shared.courses (tenant_id, category_id, title, description, course_type, difficulty_level, status, is_mandatory, duration_minutes, instructor_name, thumbnail_url)
            VALUES (v_tenant_id, v_cat_tech, 'IA Generativa para Negócios: Do Zero ao Pro', 
                    'Aprenda a dominar ferramentas de IA para revolucionar sua produtividade.', 
                    'ONLINE', 'INTERMEDIARIO', 'PUBLISHED', false, 360, 'Eng. Carlos AI',
                    'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop')
            RETURNING id INTO v_course_id;
        END IF;

        -- 5. CURSO: Liderança Alpha
        IF NOT EXISTS (SELECT 1 FROM shared.courses WHERE tenant_id = v_tenant_id AND title = 'Liderança Alpha: Gestão de Times Remotos') THEN
            INSERT INTO shared.courses (tenant_id, category_id, title, description, course_type, difficulty_level, status, is_mandatory, duration_minutes, instructor_name, thumbnail_url)
            VALUES (v_tenant_id, v_cat_lideranca, 'Liderança Alpha: Gestão de Times Remotos', 
                    'Formação para gestores que buscam alta performance.', 
                    'ONLINE', 'AVANCADO', 'PUBLISHED', false, 300, 'Dr. Rodrigo Porto',
                    'https://images.unsplash.com/photo-15222071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop')
            RETURNING id INTO v_course_id;
        END IF;

    END LOOP;

    RAISE NOTICE 'Seed de cursos re-aplicado para TODOS os tenants com sucesso.';

END $$;
