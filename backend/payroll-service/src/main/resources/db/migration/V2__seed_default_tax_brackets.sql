-- =============================================
-- Faixas padrao INSS 2024 (progressivas)
-- Tenant UUID 'shared' - serao copiadas para cada tenant
-- =============================================

-- Nota: Estas faixas sao defaults que podem ser sobrescritas
-- por tenant via API /api/v1/payroll/tax-brackets

-- INSS Faixa 1: ate R$ 1.412,00 - 7,5%
-- INSS Faixa 2: de R$ 1.412,01 ate R$ 2.666,68 - 9%
-- INSS Faixa 3: de R$ 2.666,69 ate R$ 4.000,03 - 12%
-- INSS Faixa 4: de R$ 4.000,04 ate R$ 7.786,02 - 14%

-- IRRF Faixa 1: ate R$ 2.259,20 - Isento
-- IRRF Faixa 2: de R$ 2.259,21 ate R$ 2.826,65 - 7,5% (deducao R$ 169,44)
-- IRRF Faixa 3: de R$ 2.826,66 ate R$ 3.751,05 - 15% (deducao R$ 381,44)
-- IRRF Faixa 4: de R$ 3.751,06 ate R$ 4.664,68 - 22,5% (deducao R$ 662,77)
-- IRRF Faixa 5: acima de R$ 4.664,68 - 27,5% (deducao R$ 896,00)

-- As faixas padrao sao aplicadas via codigo (PayrollCalculationEngine)
-- quando nao ha faixas configuradas para o tenant.
-- Use a API de tax-brackets para personalizar por tenant.

-- Exemplo de insert para um tenant especifico:
-- INSERT INTO tax_brackets (tenant_id, tax_type, bracket_order, min_value, max_value, rate, deduction_amount, effective_from)
-- VALUES
--   ('TENANT_UUID', 'INSS', 1, 0.00, 1412.00, 7.50, 0.00, '2024-01-01'),
--   ('TENANT_UUID', 'INSS', 2, 1412.01, 2666.68, 9.00, 0.00, '2024-01-01'),
--   ('TENANT_UUID', 'INSS', 3, 2666.69, 4000.03, 12.00, 0.00, '2024-01-01'),
--   ('TENANT_UUID', 'INSS', 4, 4000.04, 7786.02, 14.00, 0.00, '2024-01-01');
