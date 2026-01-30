#!/bin/bash

# ==============================================================================
# Script de Remoção Segura de Colaborador (AxonRH)
# Uso: ./scripts/remove-employee.sh <CPF_APENAS_NUMEROS>
# ==============================================================================

if [ -z "$1" ]; then
    echo "ERRO: CPF não informado."
    echo "Uso: ./scripts/remove-employee.sh 05948080730"
    exit 1
fi

CPF=$1

echo "------------------------------------------------------------"
echo "Iniciando remoção segura do colaborador CPF: $CPF"
echo "------------------------------------------------------------"

# Bloco SQL para execução dentro do container
SQL=$(cat <<EOF
-- Aumenta o search_path para incluir todos os schemas possíveis
SELECT string_agg(schema_name, ',') FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema' \gset schemas_
SET search_path TO :schemas_paths, public;

DO \$\$
DECLARE
    v_employee_id UUID;
    v_user_id UUID;
    v_cpf VARCHAR := '$CPF';
    v_schema RECORD;
BEGIN
    -- 1. Localizar o Colaborador (sempre no shared)
    SELECT id, user_id INTO v_employee_id, v_user_id 
    FROM shared.employees 
    WHERE cpf = v_cpf OR cpf = regexp_replace(v_cpf, '[^0-9]', '', 'g');

    IF v_employee_id IS NULL THEN
        RAISE EXCEPTION 'Colaborador com CPF % não encontrado na tabela shared.employees.', v_cpf;
    END IF;

    RAISE NOTICE 'Colaborador encontrado: % (ID: %)', v_cpf, v_employee_id;

    -- Iterar por todos os schemas de tenant e shared para limpar dados
    FOR v_schema IN 
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = 'shared' OR schema_name LIKE 'tenant_%'
    LOOP
        EXECUTE format('SET search_path TO %I, public', v_schema.schema_name);
        
        -- Limpeza Férias
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema.schema_name AND table_name = 'vacation_requests') THEN
            EXECUTE 'DELETE FROM vacation_requests WHERE employee_id = $1' USING v_employee_id;
            EXECUTE 'DELETE FROM vacation_periods WHERE employee_id = $1' USING v_employee_id;
            EXECUTE 'DELETE FROM collective_vacation_employees WHERE employee_id = $1' USING v_employee_id;
        END IF;

        -- Limpeza Ponto
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema.schema_name AND table_name = 'time_records') THEN
            EXECUTE 'DELETE FROM time_records WHERE employee_id = $1' USING v_employee_id;
            EXECUTE 'DELETE FROM time_adjustments WHERE employee_id = $1' USING v_employee_id;
            EXECUTE 'DELETE FROM daily_summaries WHERE employee_id = $1' USING v_employee_id;
            EXECUTE 'DELETE FROM overtime_banks WHERE employee_id = $1' USING v_employee_id;
        END IF;

        -- Limpeza Performance
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema.schema_name AND table_name = 'evaluations') THEN
            EXECUTE 'DELETE FROM feedback_records WHERE to_employee_id = $1 OR from_employee_id = $1' USING v_employee_id;
            EXECUTE 'DELETE FROM goals WHERE employee_id = $1' USING v_employee_id;
            EXECUTE 'DELETE FROM pdis WHERE employee_id = $1' USING v_employee_id;
            EXECUTE 'DELETE FROM evaluations WHERE evaluatee_id = $1 OR evaluator_id = $1' USING v_employee_id;
        END IF;

        -- Limpeza Learning
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema.schema_name AND table_name = 'enrollments') THEN
            EXECUTE 'DELETE FROM path_enrollments WHERE enrollment_id IN (SELECT id FROM enrollments WHERE employee_id = $1)' USING v_employee_id;
            EXECUTE 'DELETE FROM enrollments WHERE employee_id = $1' USING v_employee_id;
        END IF;

        -- Limpeza Notifications
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema.schema_name AND table_name = 'notifications') THEN
            EXECUTE 'DELETE FROM notifications WHERE recipient_id = $1' USING v_user_id;
        END IF;

        -- Limpeza Employee Service (específicas por schema)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema.schema_name AND table_name = 'employee_documents') THEN
            EXECUTE 'DELETE FROM employee_documents WHERE employee_id = $1' USING v_employee_id;
            EXECUTE 'DELETE FROM employee_dependents WHERE employee_id = $1' USING v_employee_id;
            EXECUTE 'DELETE FROM employee_history WHERE employee_id = $1' USING v_employee_id;
            EXECUTE 'DELETE FROM employee_contracts WHERE employee_id = $1' USING v_employee_id;
        END IF;
    END LOOP;

    -- Remoção Final (Auth e Employee no shared)
    RAISE NOTICE 'Removendo registros finais no schema shared...';
    DELETE FROM shared.employees WHERE id = v_employee_id;
    IF v_user_id IS NOT NULL THEN
        DELETE FROM shared.users WHERE id = v_user_id;
    END IF;

    RAISE NOTICE 'REMOÇÃO CONCLUÍDA COM SUCESSO!';
END \$\$;
EOF
)

# Executar via Docker no container do Postgres
echo "$SQL" | docker exec -i axonrh-postgres psql -U axonrh -d axonrh

if [ $? -eq 0 ]; then
    echo "Script finalizado com sucesso."
else
    echo "Erro ao executar a remoção no banco de dados."
fi
