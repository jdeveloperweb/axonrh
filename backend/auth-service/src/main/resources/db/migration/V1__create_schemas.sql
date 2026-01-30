-- =====================================================
-- AxonRH - Migration V1: Criacao dos Schemas Base
-- Data: Janeiro 2026
-- =====================================================

-- Habilitar extensoes necessarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'postgis') THEN
        CREATE EXTENSION IF NOT EXISTS "postgis";
    END IF;
END $$;

-- =====================================================
-- SCHEMA SHARED: Metadados globais do sistema
-- =====================================================
CREATE SCHEMA IF NOT EXISTS shared;
COMMENT ON SCHEMA shared IS 'Metadados globais do sistema - tenants, configuracoes e dados compartilhados';

-- =====================================================
-- SCHEMA ANALYTICS: Data warehouse para relatorios (OLAP)
-- =====================================================
CREATE SCHEMA IF NOT EXISTS analytics;
COMMENT ON SCHEMA analytics IS 'Data warehouse para relatorios e analytics (OLAP) - dados agregados e historicos';

-- Configurar search_path padrao
ALTER DATABASE axonrh SET search_path TO shared, public;
