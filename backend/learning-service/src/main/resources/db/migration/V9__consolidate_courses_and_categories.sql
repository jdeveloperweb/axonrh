-- =====================================================
-- Consolidação de Cursos e Categorias (Cleanup)
-- Resolve duplicidade de categorias e uniformiza títulos de cursos
-- garantindo que o conteúdo da V8 seja aplicado aos cursos corretos.
-- =====================================================

DO $$
DECLARE
    r_cat RECORD;
    r_course RECORD;
    v_correct_cat_id UUID;
    v_correct_course_id UUID;
BEGIN
    -- 1. Consolidar Categorias Duplicadas por Nome (dentro de cada tenant)
    -- Para cada tenant, se houver categorias com mesmo nome, movemos os cursos para uma e deletamos a outra.
    FOR r_cat IN 
        SELECT tenant_id, LOWER(TRIM(name)) as clean_name, count(*) 
        FROM shared.training_categories 
        GROUP BY tenant_id, LOWER(TRIM(name)) 
        HAVING count(*) > 1
    LOOP
        -- Escolhemos o ID da categoria mais antiga como a "correta"
        SELECT id INTO v_correct_cat_id 
        FROM shared.training_categories 
        WHERE tenant_id = r_cat.tenant_id AND LOWER(TRIM(name)) = r_cat.clean_name 
        ORDER BY created_at ASC LIMIT 1;

        -- Move os cursos das outras categorias duplicadas para a correta
        UPDATE shared.courses 
        SET category_id = v_correct_cat_id 
        WHERE category_id IN (
            SELECT id FROM shared.training_categories 
            WHERE tenant_id = r_cat.tenant_id 
            AND LOWER(TRIM(name)) = r_cat.clean_name 
            AND id != v_correct_cat_id
        );

        -- Deleta as categorias duplicadas
        DELETE FROM shared.training_categories 
        WHERE tenant_id = r_cat.tenant_id 
        AND LOWER(TRIM(name)) = r_cat.clean_name 
        AND id != v_correct_cat_id;
    END LOOP;

    -- 2. Corrigir Títulos de Cursos para Casamento com V8
    -- Alguns migrations inseriram 'Liderança Alpha: O Guia de Gestão' e outros 'Liderança Alpha: Gestão de Times Remotos'
    -- Vamos uniformizar para o título esperado na V8 e remover duplicados se existirem
    
    -- Liderança
    UPDATE shared.courses SET title = 'Liderança Alpha: Gestão de Times Remotos' 
    WHERE title IN ('Liderança Alpha: O Guia de Gestão', 'Liderança Alpha: O Guia Estratégico');

    -- Onboarding
    UPDATE shared.courses SET title = 'Bem-vindo à Axon: Guia Definitivo de Imersão' 
    WHERE title IN ('Bem-vindo à Axon: Onboarding', 'Cultura Axon: Onboarding Definitivo', 'Bem-vindo à Axon');

    -- Se após o update houver duplicatas (mesmo tenant, mesmo título), removemos a que tem menos módulos
    FOR r_course IN 
        SELECT tenant_id, title, count(*) 
        FROM shared.courses 
        GROUP BY tenant_id, title 
        HAVING count(*) > 1
    LOOP
        -- Identifica o curso com MAIS módulos (o mais completo)
        SELECT c.id INTO v_correct_course_id 
        FROM shared.courses c
        LEFT JOIN shared.course_modules m ON c.id = m.course_id
        WHERE c.tenant_id = r_course.tenant_id AND c.title = r_course.title
        GROUP BY c.id
        ORDER BY count(m.id) DESC, c.created_at ASC
        LIMIT 1;

        -- Remove os outros duplicados
        DELETE FROM shared.courses 
        WHERE tenant_id = r_course.tenant_id 
        AND title = r_course.title 
        AND id != v_correct_course_id;
    END LOOP;

    RAISE NOTICE 'Consolidação de cursos e categorias concluída.';
END $$;
