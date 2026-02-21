-- V20 - Adiciona campos de confidencialidade e politica ao template
ALTER TABLE shared.contract_templates 
ADD COLUMN confidentiality_content TEXT,
ADD COLUMN policy_content TEXT;
