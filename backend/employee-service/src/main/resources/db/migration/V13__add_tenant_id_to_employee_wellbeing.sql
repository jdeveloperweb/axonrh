-- V13: Adiciona coluna tenant_id na tabela employee_wellbeing para suporte multi-tenant

-- Adiciona a coluna tenant_id (inicialmente nullable para permitir update dos registros existentes)
ALTER TABLE employee_wellbeing ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Atualiza registros existentes com tenant_id do employee relacionado
UPDATE employee_wellbeing ew
SET tenant_id = (
    SELECT e.tenant_id FROM shared.employees e WHERE e.id = ew.employee_id LIMIT 1
)
WHERE ew.tenant_id IS NULL
  AND EXISTS (SELECT 1 FROM shared.employees e WHERE e.id = ew.employee_id);

-- Remove registros órfãos (sem employee correspondente) que não podem ter tenant_id
DELETE FROM employee_wellbeing WHERE tenant_id IS NULL;

-- Torna a coluna obrigatória
ALTER TABLE employee_wellbeing ALTER COLUMN tenant_id SET NOT NULL;

-- Cria índice para melhorar performance das consultas por tenant
CREATE INDEX IF NOT EXISTS idx_employee_wellbeing_tenant_id ON employee_wellbeing(tenant_id);
