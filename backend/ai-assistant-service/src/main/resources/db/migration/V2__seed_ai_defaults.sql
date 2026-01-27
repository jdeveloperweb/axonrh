-- Seed default AI Assistant data

DO $$
BEGIN
    IF to_regclass('public.ai_prompts') IS NOT NULL THEN
        INSERT INTO ai_prompts (id, tenant_id, name, category, prompt_template, is_system, variables) VALUES
        (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'hr_assistant_main', 'system',
        'Você é o Assistente de RH da AxonRH. Ajude com questões de recursos humanos, cálculos trabalhistas e consultas de dados.

Contexto da empresa: {company_context}
Dados do usuário: {user_context}
Data atual: {current_date}

Responda sempre em português brasileiro, seja preciso e cite legislação quando relevante.',
        true, '["company_context", "user_context", "current_date"]'),

        (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'calculation_assistant', 'calculation',
        'Você é um especialista em cálculos trabalhistas brasileiros. Realize cálculos precisos de:
- Férias (1/3 constitucional, abono pecuniário)
- Rescisão (aviso prévio, multa FGTS, verbas rescisórias)
- Horas extras (50%, 100%, adicional noturno)
- 13º salário
- Descontos legais (INSS, IRRF)

Dados para cálculo: {calculation_data}
Tipo de cálculo: {calculation_type}

Mostre o cálculo passo a passo e cite a base legal.',
        true, '["calculation_data", "calculation_type"]'),

        (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'query_builder', 'query',
        'Você é um especialista em transformar perguntas em linguagem natural em consultas SQL seguras.

Esquema do banco de dados:
{database_schema}

Pergunta do usuário: {user_question}

Gere apenas consultas SELECT. Nunca modifique dados. Aplique filtros de tenant_id automaticamente.
Retorne a query SQL e uma explicação do que ela faz.',
        true, '["database_schema", "user_question"]');
    END IF;

    IF to_regclass('public.ai_intents') IS NOT NULL THEN
        INSERT INTO ai_intents (id, name, category, training_phrases, action_type, confidence_threshold) VALUES
        (gen_random_uuid(), 'query_employee', 'data_query',
        '["mostrar funcionários", "listar colaboradores", "quem trabalha no departamento", "funcionários ativos"]',
        'database_query', 0.75),

        (gen_random_uuid(), 'calculate_vacation', 'calculation',
        '["calcular férias", "quanto vou receber de férias", "valor das minhas férias", "simulação de férias"]',
        'calculation', 0.80),

        (gen_random_uuid(), 'calculate_termination', 'calculation',
        '["calcular rescisão", "valor da rescisão", "quanto recebo se for demitido", "verbas rescisórias"]',
        'calculation', 0.80),

        (gen_random_uuid(), 'query_payroll', 'data_query',
        '["ver meu contracheque", "folha de pagamento", "quanto ganhei esse mês", "meus rendimentos"]',
        'database_query', 0.75),

        (gen_random_uuid(), 'hr_policy', 'information',
        '["política de férias", "regras de home office", "código de conduta", "benefícios da empresa"]',
        'knowledge_search', 0.70),

        (gen_random_uuid(), 'labor_law', 'information',
        '["o que diz a CLT sobre", "legislação trabalhista", "direitos do trabalhador", "lei de férias"]',
        'knowledge_search', 0.70);
    END IF;

    IF to_regclass('public.query_templates') IS NOT NULL THEN
        INSERT INTO query_templates (id, tenant_id, name, intent, sql_template, parameters, examples) VALUES
        (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'list_employees_by_department', 'query_employee',
        'SELECT e.id, e.full_name, e.email, e.hire_date, d.name as department, p.title as position
FROM employees e
JOIN departments d ON e.department_id = d.id
JOIN positions p ON e.position_id = p.id
WHERE e.tenant_id = :tenant_id AND e.status = ''ACTIVE''
AND (:department IS NULL OR d.name ILIKE :department)
ORDER BY e.full_name',
        '[{"name": "department", "type": "string", "required": false}]',
        '["listar funcionários do departamento de TI", "mostrar colaboradores de RH", "quem trabalha em vendas"]'),

        (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'employee_payroll_summary', 'query_payroll',
        'SELECT pp.reference_month, pp.gross_salary, pp.net_salary, pp.total_deductions, pp.total_benefits
FROM payroll_periods pp
JOIN employees e ON pp.employee_id = e.id
WHERE e.tenant_id = :tenant_id AND e.id = :employee_id
ORDER BY pp.reference_month DESC LIMIT :limit',
        '[{"name": "employee_id", "type": "uuid", "required": true}, {"name": "limit", "type": "integer", "required": false, "default": 12}]',
        '["ver meu contracheque", "histórico de pagamentos", "últimos salários"]'),

        (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'vacation_balance', 'calculate_vacation',
        'SELECT e.full_name, e.hire_date, v.available_days, v.used_days, v.pending_days, v.acquisition_period_start, v.acquisition_period_end
FROM vacation_balances v
JOIN employees e ON v.employee_id = e.id
WHERE e.tenant_id = :tenant_id AND e.id = :employee_id',
        '[{"name": "employee_id", "type": "uuid", "required": true}]',
        '["saldo de férias", "quantos dias de férias tenho", "meu período aquisitivo"]');
    END IF;

    IF to_regclass('public.ai_model_configs') IS NOT NULL THEN
        INSERT INTO ai_model_configs (id, tenant_id, provider, model_name, purpose, config, is_default) VALUES
        (gen_random_uuid(), NULL, 'openai', 'gpt-4-turbo-preview', 'chat',
        '{"temperature": 0.7, "max_tokens": 4096, "top_p": 1.0}', true),

        (gen_random_uuid(), NULL, 'openai', 'text-embedding-3-small', 'embedding',
        '{"dimensions": 1536}', true),

        (gen_random_uuid(), NULL, 'anthropic', 'claude-3-sonnet-20240229', 'chat',
        '{"temperature": 0.7, "max_tokens": 4096}', false);
    END IF;
END $$;
