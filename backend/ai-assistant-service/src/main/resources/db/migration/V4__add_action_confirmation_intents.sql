-- Add new intents for action confirmation in AI Assistant
-- These intents allow the AI to propose actions and wait for user confirmation

DO $$
BEGIN
    IF to_regclass('public.ai_intents') IS NOT NULL THEN
        -- Intent to propose vacation approval
        INSERT INTO ai_intents (id, name, category, training_phrases, action_type, confidence_threshold)
        VALUES (gen_random_uuid(), 'propose_vacation_approval', 'workflow', 
        '["aprovar férias", "autorizar férias", "confirmar pedido de férias", "aprovar férias de um colaborador"]', 
        'ACTION_CONFIRMATION', 0.85)
        ON CONFLICT (name) DO UPDATE SET action_type = 'ACTION_CONFIRMATION';

        -- Intent to propose termination
        INSERT INTO ai_intents (id, name, category, training_phrases, action_type, confidence_threshold)
        VALUES (gen_random_uuid(), 'propose_termination', 'workflow', 
        '["demitir funcionário", "iniciar desligamento", "terminar contrato", "desligar colaborador"]', 
        'ACTION_CONFIRMATION', 0.85)
        ON CONFLICT (name) DO UPDATE SET action_type = 'ACTION_CONFIRMATION';

        -- Intents for execution (actual actions)
        INSERT INTO ai_intents (id, name, category, training_phrases, action_type, confidence_threshold)
        VALUES (gen_random_uuid(), 'execute_vacation_approval', 'workflow', 
        '["confirmar aprovação", "sim, aprove", "pode aprovar as férias"]', 
        'INFORMATION', 0.90)
        ON CONFLICT (name) DO NOTHING;

        INSERT INTO ai_intents (id, name, category, training_phrases, action_type, confidence_threshold)
        VALUES (gen_random_uuid(), 'execute_termination', 'workflow', 
        '["confirmar desligamento", "sim, inicie o desligamento", "pode demitir"]', 
        'INFORMATION', 0.90)
        ON CONFLICT (name) DO NOTHING;
    END IF;
END $$;
