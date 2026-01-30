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
BEGIN;

DO \$\$
DECLARE
    v_employee_id UUID;
    v_user_id UUID;
    v_cpf VARCHAR := '$CPF';
    v_table_exists BOOLEAN;
BEGIN
    -- 1. Localizar o Colaborador
    SELECT id, user_id INTO v_employee_id, v_user_id 
    FROM shared.employees 
    WHERE cpf = v_cpf OR cpf = regexp_replace(v_cpf, '[^0-9]', '', 'g');

    IF v_employee_id IS NULL THEN
        RAISE EXCEPTION 'Colaborador com CPF % não encontrado na tabela shared.employees.', v_cpf;
    END IF;

    RAISE NOTICE 'Colaborador encontrado: % (ID: %)', v_cpf, v_employee_id;

    -- 2. Limpeza Vacation Service
    RAISE NOTICE 'Limpando dados de férias...';
    DELETE FROM vacation_requests WHERE employee_id = v_employee_id;
    DELETE FROM vacation_periods WHERE employee_id = v_employee_id;
    DELETE FROM collective_vacation_employees WHERE employee_id = v_employee_id;

    -- 3. Limpeza Timesheet Service
    RAISE NOTICE 'Limpando registros de ponto...';
    DELETE FROM time_records WHERE employee_id = v_employee_id;
    DELETE FROM time_adjustments WHERE employee_id = v_employee_id;
    DELETE FROM daily_summaries WHERE employee_id = v_employee_id;
    DELETE FROM overtime_banks WHERE employee_id = v_employee_id;

    -- 4. Limpeza Performance Service
    RAISE NOTICE 'Limpando avaliações de desempenho...';
    DELETE FROM feedback_records WHERE to_employee_id = v_employee_id OR from_employee_id = v_employee_id;
    DELETE FROM goals WHERE employee_id = v_employee_id;
    DELETE FROM pdis WHERE employee_id = v_employee_id;
    DELETE FROM evaluations WHERE evaluatee_id = v_employee_id OR evaluator_id = v_employee_id;

    -- 5. Limpeza Learning Service
    RAISE NOTICE 'Limpando matrículas de treinamento...';
    DELETE FROM path_enrollments WHERE enrollment_id IN (SELECT id FROM enrollments WHERE employee_id = v_employee_id);
    DELETE FROM enrollments WHERE employee_id = v_employee_id;

    -- 6. Limpeza Notification Service
    RAISE NOTICE 'Limpando notificações...';
    DELETE FROM notifications WHERE recipient_id = v_user_id;

    -- 7. Limpeza Employee Service (Tabelas com FK mas sem cascade global se houver)
    RAISE NOTICE 'Limpando documentos e dependentes...';
    DELETE FROM employee_documents WHERE employee_id = v_employee_id;
    DELETE FROM employee_dependents WHERE employee_id = v_employee_id;
    DELETE FROM employee_history WHERE employee_id = v_employee_id;
    DELETE FROM employee_contracts WHERE employee_id = v_employee_id;
    
    -- 8. Remoção do Registro Mestre
    RAISE NOTICE 'Removendo registro mestre do colaborador...';
    DELETE FROM shared.employees WHERE id = v_employee_id;

    -- 9. Remoção do Usuário (Auth Service)
    IF v_user_id IS NOT NULL THEN
        RAISE NOTICE 'Removendo usuário de acesso (ID: %)...', v_user_id;
        DELETE FROM shared.users WHERE id = v_user_id;
    END IF;

    RAISE NOTICE '------------------------------------------------------------';
    RAISE NOTICE 'REMOÇÃO CONCLUÍDA COM SUCESSO!';
    RAISE NOTICE '------------------------------------------------------------';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERRO DURANTE A REMOÇÃO: %', SQLERRM;
    ROLLBACK;
    RAISE;
END \$\$;

COMMIT;
EOF
)

# Executar via Docker no container do Postgres
echo "$SQL" | docker exec -i axonrh-postgres psql -U axonrh -d axonrh

if [ $? -eq 0 ]; then
    echo "Script finalizado com sucesso."
else
    echo "Erro ao executar a remoção no banco de dados."
fi
