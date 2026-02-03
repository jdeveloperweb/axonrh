-- =====================================================
-- Seed de Treinamentos (MODO ROBUSTO / FALLBACK)
-- Garante cursos no tenant zero (fallback do backend)
-- e tenta sincronizar com outros tenants de forma segura.
-- =====================================================

DO $$
DECLARE
    v_tenant_id UUID := '00000000-0000-0000-0000-000000000000';
    v_cat_lideranca UUID;
    v_cat_tech UUID;
    v_cat_cultura UUID;
    v_course_id UUID;
BEGIN
    -- 1. Inserir Categorias para o Tenant Zero
    INSERT INTO shared.training_categories (tenant_id, name, description, icon, color)
    VALUES (v_tenant_id, 'Liderança', 'Desenvolvimento de gestores', 'User', '#3b82f6')
    ON CONFLICT (tenant_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_cat_lideranca;

    INSERT INTO shared.training_categories (tenant_id, name, description, icon, color)
    VALUES (v_tenant_id, 'Tecnologia', 'Ferramentas e IA', 'Zap', '#10b981')
    ON CONFLICT (tenant_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_cat_tech;

    INSERT INTO shared.training_categories (tenant_id, name, description, icon, color)
    VALUES (v_tenant_id, 'Cultura', 'Onboarding e Soft Skills', 'GraduationCap', '#8b5cf6')
    ON CONFLICT (tenant_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_cat_cultura;

    -- 2. Inserir Cursos para o Tenant Zero
    IF NOT EXISTS (SELECT 1 FROM shared.courses WHERE tenant_id = v_tenant_id AND title = 'Liderança Alpha: O Guia de Gestão') THEN
        INSERT INTO shared.courses (tenant_id, category_id, title, description, course_type, difficulty_level, status, is_mandatory, duration_minutes, instructor_name, thumbnail_url)
        VALUES (v_tenant_id, v_cat_lideranca, 'Liderança Alpha: O Guia de Gestão', 
                'Formação para gestores que buscam alta performance em modelos flexíveis.', 
                'ONLINE', 'AVANCADO', 'PUBLISHED', true, 300, 'Dr. Rodrigo Porto',
                'https://images.unsplash.com/photo-15222071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop')
        RETURNING id INTO v_course_id;
        
        INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes) VALUES (v_course_id, 'Módulo Inicial', 1, 60);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM shared.courses WHERE tenant_id = v_tenant_id AND title = 'Bem-vindo à Axon: Onboarding') THEN
        INSERT INTO shared.courses (tenant_id, category_id, title, description, course_type, difficulty_level, status, is_mandatory, duration_minutes, instructor_name, thumbnail_url)
        VALUES (v_tenant_id, v_cat_cultura, 'Bem-vindo à Axon: Onboarding', 
                'A imersão completa na cultura, história e benefícios da AxonRH.', 
                'ONLINE', 'INICIANTE', 'PUBLISHED', true, 240, 'Recursos Humanos',
                'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop')
        RETURNING id INTO v_course_id;
        
        INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes) VALUES (v_course_id, 'Cultura Axon', 1, 60);
    END IF;

    RAISE NOTICE 'Seed de cursos (Fallback Zero) concluído.';

END $$;
