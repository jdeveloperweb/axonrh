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
# Heredoc com 'EOF' (aspas) para evitar que o shell tente interpretar o código SQL
SQL=$(cat <<'EOF'
DO $$
DECLARE
    v_employee_id UUID;
    v_user_id UUID;
    v_cpf VARCHAR := '__CPF_PLACEHOLDER__';
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
        RAISE NOTICE 'Verificando schema: %', v_schema.schema_name;
        
        -- Macros de limpeza granular por tabela para evitar erros de "relation does not exist"
        
        -- Férias
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema.schema_name AND table_name = 'vacation_requests') THEN
            EXECUTE format('DELETE FROM %I.vacation_requests WHERE employee_id = $1', v_schema.schema_name) USING v_employee_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema.schema_name AND table_name = 'vacation_periods') THEN
            EXECUTE format('DELETE FROM %I.vacation_periods WHERE employee_id = $1', v_schema.schema_name) USING v_employee_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema.schema_name AND table_name = 'collective_vacation_employees') THEN
            EXECUTE format('DELETE FROM %I.collective_vacation_employees WHERE employee_id = $1', v_schema.schema_name) USING v_employee_id;
        END IF;

        -- Ponto
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema.schema_name AND table_name = 'time_records') THEN
            EXECUTE format('DELETE FROM %I.time_records WHERE employee_id = $1', v_schema.schema_name) USING v_employee_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema.schema_name AND table_name = 'time_adjustments') THEN
            EXECUTE format('DELETE FROM %I.time_adjustments WHERE employee_id = $1', v_schema.schema_name) USING v_employee_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema.schema_name AND table_name = 'daily_summaries') THEN
            EXECUTE format('DELETE FROM %I.daily_summaries WHERE employee_id = $1', v_schema.schema_name) USING v_employee_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema.schema_name AND table_name = 'overtime_banks') THEN
            EXECUTE format('DELETE FROM %I.overtime_banks WHERE employee_id = $1', v_schema.schema_name) USING v_employee_id;
        END IF;

        -- Performance
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema.schema_name AND table_name = 'evaluations') THEN
            EXECUTE format('DELETE FROM %I.evaluations WHERE evaluatee_id = $1 OR evaluator_id = $1', v_schema.schema_name) USING v_employee_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema.schema_name AND table_name = 'feedback_records') THEN
            EXECUTE format('DELETE FROM %I.feedback_records WHERE to_employee_id = $1 OR from_employee_id = $1', v_schema.schema_name) USING v_employee_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema.schema_name AND table_name = 'goals') THEN
            EXECUTE format('DELETE FROM %I.goals WHERE employee_id = $1', v_schema.schema_name) USING v_employee_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema.schema_name AND table_name = 'pdis') THEN
            EXECUTE format('DELETE FROM %I.pdis WHERE employee_id = $1', v_schema.schema_name) USING v_employee_id;
        END IF;

        -- Learning
        -- Ajustado: A tabela path_enrollments parece usar employee_id diretamente ou ter estrutura diferente em alguns schemas
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema.schema_name AND table_name = 'path_enrollments') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = v_schema.schema_name AND table_name = 'path_enrollments' AND column_name = 'employee_id') THEN
                EXECUTE format('DELETE FROM %I.path_enrollments WHERE employee_id = $1', v_schema.schema_name) USING v_employee_id;
            ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = v_schema.schema_name AND table_name = 'path_enrollments' AND column_name = 'enrollment_id') THEN
                EXECUTE format('DELETE FROM %I.path_enrollments WHERE enrollment_id IN (SELECT id FROM %I.enrollments WHERE employee_id = $1)', v_schema.schema_name, v_schema.schema_name) USING v_employee_id;
            END IF;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema.schema_name AND table_name = 'enrollments') THEN
            EXECUTE format('DELETE FROM %I.enrollments WHERE employee_id = $1', v_schema.schema_name) USING v_employee_id;
        END IF;

        -- Notifications
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema.schema_name AND table_name = 'notifications') THEN
            EXECUTE format('DELETE FROM %I.notifications WHERE recipient_id = $1', v_schema.schema_name) USING v_user_id;
        END IF;

        -- Employee Service Específicos
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema.schema_name AND table_name = 'employee_documents') THEN
            EXECUTE format('DELETE FROM %I.employee_documents WHERE employee_id = $1', v_schema.schema_name) USING v_employee_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema.schema_name AND table_name = 'employee_dependents') THEN
            EXECUTE format('DELETE FROM %I.employee_dependents WHERE employee_id = $1', v_schema.schema_name) USING v_employee_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema.schema_name AND table_name = 'employee_history') THEN
            EXECUTE format('DELETE FROM %I.employee_history WHERE employee_id = $1', v_schema.schema_name) USING v_employee_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema.schema_name AND table_name = 'employee_contracts') THEN
            EXECUTE format('DELETE FROM %I.employee_contracts WHERE employee_id = $1', v_schema.schema_name) USING v_employee_id;
        END IF;
    END LOOP;

    -- Remoção Final (Auth e Employee no shared)
    RAISE NOTICE 'Finalizando: Removendo registros mestre no schema shared...';
    DELETE FROM shared.employees WHERE id = v_employee_id;
    IF v_user_id IS NOT NULL THEN
        DELETE FROM shared.users WHERE id = v_user_id;
    END IF;

    RAISE NOTICE 'REMOÇÃO CONCLUÍDA COM SUCESSO!';
END $$;
EOF
)

# Substitui o placeholder pelo CPF real
FINAL_SQL=$(echo "$SQL" | sed "s/__CPF_PLACEHOLDER__/$CPF/g")

# Executar via Docker no container do Postgres
echo "$FINAL_SQL" | docker exec -i axonrh-postgres psql -U axonrh -d axonrh

if [ $? -eq 0 ]; then
    echo "------------------------------------------------------------"
    echo "Script finalizado com sucesso."
else
    echo "Erro ao executar a remoção no banco de dados."
fi
