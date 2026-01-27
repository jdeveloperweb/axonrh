-- =====================================================
-- AxonRH - Migration V1: Criacao dos Schemas Base
-- Data: Janeiro 2026
-- =====================================================

-- Habilitar extensoes necessarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================================
-- SCHEMA SHARED: Metadados globais do sistema
-- =====================================================
CREATE SCHEMA IF NOT EXISTS shared;
COMMENT ON SCHEMA shared IS 'Metadados globais do sistema - tenants, configuracoes e dados compartilhados';

-- =====================================================
-- SCHEMA TENANT_EXEMPLO: Tenant de demonstracao
-- =====================================================
CREATE SCHEMA IF NOT EXISTS tenant_exemplo;
COMMENT ON SCHEMA tenant_exemplo IS 'Schema do tenant de demonstracao para testes e desenvolvimento';

-- =====================================================
-- SCHEMA ANALYTICS: Data warehouse para relatorios (OLAP)
-- =====================================================
CREATE SCHEMA IF NOT EXISTS analytics;
COMMENT ON SCHEMA analytics IS 'Data warehouse para relatorios e analytics (OLAP) - dados agregados e historicos';

-- Configurar search_path padrao
ALTER DATABASE axonrh_dev SET search_path TO shared, public;
