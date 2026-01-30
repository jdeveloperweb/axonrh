-- SCRIPT DE LIMPEZA TOTAL REVISADO - AXONRH
-- Remove dados de demo mas mantém estrutura necessária para o sistema rodar

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- 1. Remover todos os schemas de tenants dinâmicos
    FOR r IN (SELECT nspname FROM pg_namespace WHERE nspname LIKE 'tenant_%') LOOP
        EXECUTE 'DROP SCHEMA IF EXISTS ' || quote_ident(r.nspname) || ' CASCADE';
    END LOOP;

    -- 2. Limpar dados de negócio do schema shared (preservando estrutura base)
    TRUNCATE shared.tenants CASCADE;
    TRUNCATE shared.users CASCADE;
    TRUNCATE shared.setup_progress CASCADE;
    TRUNCATE shared.company_profiles CASCADE;
    TRUNCATE shared.labor_rules_config CASCADE;
    TRUNCATE shared.branding_config CASCADE;
    TRUNCATE shared.module_config CASCADE;
    TRUNCATE shared.integration_config CASCADE;
    TRUNCATE shared.import_jobs CASCADE;
    
    -- 3. Limpar tabelas globais no public
    TRUNCATE public.notifications CASCADE;

    -- 4. Garantir que as Roles e Permissões permaneçam (são estruturais)
    -- Estas tabelas NÃO serão truncadas para evitar erros de inicialização dos serviços.
    
    -- 5. Remover registros do Flyway para forçar a re-execução apenas do que for necessário 
    -- (Opcional: se você quiser que o Flyway re-insira os seeds de Roles/Permissions, 
    --  precisamos apagar o histórico. Mas vamos manter por segurança).
END $$;

-- 6. Recriar o Usuário de Entrada (Obrigatório para você conseguir acessar o Setup)
-- Mas vamos criar ele SEM vínculo de tenant, para o Setup Wizard capturar.
-- Ou melhor: Deixar o sistema criar o admin no primeiro acesso se ele tiver essa lógica.
-- Como o V7 insere o admin@exemplo.com.br, ele será o seu ponto de partida.
