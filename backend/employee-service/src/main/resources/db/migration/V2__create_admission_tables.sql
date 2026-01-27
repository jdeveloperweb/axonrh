-- ============================================================
-- T109-T114: Tabelas para Workflow de Admissao Digital
-- ============================================================

CREATE SCHEMA IF NOT EXISTS shared;
SET search_path TO shared;

-- ============================================================
-- Tabela de Processos de Admissao
-- ============================================================
CREATE TABLE IF NOT EXISTS admission_processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Token de acesso publico
    access_token VARCHAR(64) NOT NULL UNIQUE,

    -- Dados do candidato
    candidate_name VARCHAR(200) NOT NULL,
    candidate_email VARCHAR(200) NOT NULL,
    candidate_cpf VARCHAR(11),
    candidate_phone VARCHAR(20),

    -- Admissao
    expected_hire_date DATE,
    department_id UUID REFERENCES departments(id),
    position_id UUID REFERENCES positions(id),

    -- Status e progresso
    status VARCHAR(30) NOT NULL DEFAULT 'LINK_GENERATED',
    current_step INTEGER DEFAULT 1,

    -- Dados preenchidos pelo candidato
    candidate_data JSONB,

    -- Contrato
    contract_document_url VARCHAR(500),
    contract_generated_at TIMESTAMP,
    contract_signed_at TIMESTAMP,
    contract_signature_id VARCHAR(100),

    -- eSocial
    esocial_event_id VARCHAR(50),
    esocial_sent_at TIMESTAMP,
    esocial_receipt VARCHAR(100),

    -- Colaborador criado
    employee_id UUID REFERENCES employees(id),

    -- Validade do link
    link_expires_at TIMESTAMP,
    link_accessed_at TIMESTAMP,

    -- Notas
    notes TEXT,

    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    completed_at TIMESTAMP,
    completed_by UUID
);

CREATE INDEX idx_admission_processes_tenant ON admission_processes(tenant_id);
CREATE INDEX idx_admission_processes_token ON admission_processes(access_token);
CREATE INDEX idx_admission_processes_status ON admission_processes(tenant_id, status);
CREATE INDEX idx_admission_processes_email ON admission_processes(candidate_email);

COMMENT ON TABLE admission_processes IS 'Processos de admissao digital';

-- ============================================================
-- Tabela de Documentos da Admissao
-- ============================================================
CREATE TABLE IF NOT EXISTS admission_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    admission_process_id UUID NOT NULL REFERENCES admission_processes(id) ON DELETE CASCADE,

    -- Tipo e arquivo
    document_type VARCHAR(50) NOT NULL,
    original_file_name VARCHAR(200) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    public_url VARCHAR(1000),
    public_url_expires_at TIMESTAMP,

    -- Metadados
    file_size BIGINT,
    mime_type VARCHAR(100),
    file_hash VARCHAR(64),

    -- Validacao
    validation_status VARCHAR(30) DEFAULT 'PENDING',
    validation_message VARCHAR(500),
    validated_at TIMESTAMP,
    validated_by UUID,

    -- OCR
    ocr_data JSONB,
    ocr_confidence DECIMAL(5,4),
    ocr_processed_at TIMESTAMP,

    manually_verified BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admission_documents_process ON admission_documents(admission_process_id);
CREATE INDEX idx_admission_documents_type ON admission_documents(document_type);
CREATE INDEX idx_admission_documents_status ON admission_documents(validation_status);

COMMENT ON TABLE admission_documents IS 'Documentos enviados no processo de admissao';

-- ============================================================
-- Tabela de Templates de Contrato
-- ============================================================
CREATE TABLE IF NOT EXISTS contract_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    contract_type VARCHAR(30) NOT NULL,

    template_content TEXT NOT NULL,
    available_variables TEXT,

    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,

    CONSTRAINT uk_contract_templates_name_tenant UNIQUE (tenant_id, name, version)
);

CREATE INDEX idx_contract_templates_tenant ON contract_templates(tenant_id);
CREATE INDEX idx_contract_templates_type ON contract_templates(tenant_id, contract_type);

COMMENT ON TABLE contract_templates IS 'Templates de contrato de trabalho';

-- ============================================================
-- Tabela de Eventos eSocial
-- ============================================================
CREATE TABLE IF NOT EXISTS esocial_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Referencia
    employee_id UUID REFERENCES employees(id),
    admission_process_id UUID REFERENCES admission_processes(id),

    -- Evento
    event_type VARCHAR(20) NOT NULL,
    event_version VARCHAR(10),
    event_xml TEXT,

    -- Envio
    sent_at TIMESTAMP,
    receipt_number VARCHAR(100),
    protocol_number VARCHAR(100),

    -- Status
    status VARCHAR(30) DEFAULT 'PENDING',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Resposta
    response_xml TEXT,
    processed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_esocial_events_tenant ON esocial_events(tenant_id);
CREATE INDEX idx_esocial_events_employee ON esocial_events(employee_id);
CREATE INDEX idx_esocial_events_type ON esocial_events(event_type);
CREATE INDEX idx_esocial_events_status ON esocial_events(status);

COMMENT ON TABLE esocial_events IS 'Eventos enviados ao eSocial';
COMMENT ON COLUMN esocial_events.event_type IS 'S-2200, S-2205, S-2206, S-2299, etc';

-- ============================================================
-- Triggers
-- ============================================================
CREATE TRIGGER update_admission_processes_updated_at BEFORE UPDATE ON admission_processes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contract_templates_updated_at BEFORE UPDATE ON contract_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_esocial_events_updated_at BEFORE UPDATE ON esocial_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Dados iniciais - Template de contrato CLT padrao
-- ============================================================
DO $$
BEGIN
    IF to_regclass('shared.tenants') IS NOT NULL THEN
        INSERT INTO contract_templates (tenant_id, name, description, contract_type, template_content, available_variables, is_default)
        SELECT
            t.id,
            'Contrato CLT Padrao',
            'Contrato de trabalho por prazo indeterminado - CLT',
            'CLT',
            '<html>
<head><title>Contrato de Trabalho</title></head>
<body>
<h1>CONTRATO DE TRABALHO POR PRAZO INDETERMINADO</h1>

<p>Pelo presente instrumento particular de contrato de trabalho, de um lado <strong>{{EMPRESA_RAZAO_SOCIAL}}</strong>,
inscrita no CNPJ sob o n. {{EMPRESA_CNPJ}}, com sede em {{EMPRESA_ENDERECO}}, doravante denominada EMPREGADORA,
e de outro lado <strong>{{COLABORADOR_NOME}}</strong>, brasileiro(a), {{COLABORADOR_ESTADO_CIVIL}},
portador(a) do RG n. {{COLABORADOR_RG}} e CPF n. {{COLABORADOR_CPF}}, residente em {{COLABORADOR_ENDERECO}},
doravante denominado(a) EMPREGADO(A), celebram o presente CONTRATO DE TRABALHO, mediante as clausulas e condicoes seguintes:</p>

<h2>CLAUSULA 1 - DA FUNCAO</h2>
<p>O(A) EMPREGADO(A) exercera a funcao de <strong>{{CARGO}}</strong>, no departamento de {{DEPARTAMENTO}}.</p>

<h2>CLAUSULA 2 - DA REMUNERACAO</h2>
<p>O(A) EMPREGADO(A) recebera o salario mensal de <strong>R$ {{SALARIO}}</strong> ({{SALARIO_EXTENSO}}),
a ser pago ate o 5o dia util do mes subsequente ao trabalhado.</p>

<h2>CLAUSULA 3 - DA JORNADA DE TRABALHO</h2>
<p>A jornada de trabalho sera de {{CARGA_HORARIA}} horas semanais, de segunda a sexta-feira,
das {{HORARIO_ENTRADA}} as {{HORARIO_SAIDA}}, com intervalo de {{INTERVALO}} para refeicao.</p>

<h2>CLAUSULA 4 - DO INICIO</h2>
<p>O presente contrato tera inicio em <strong>{{DATA_ADMISSAO}}</strong>.</p>

<h2>CLAUSULA 5 - DO PERIODO DE EXPERIENCIA</h2>
<p>Os primeiros 45 (quarenta e cinco) dias serao considerados como periodo de experiencia,
podendo ser prorrogado por igual periodo.</p>

<h2>CLAUSULA 6 - DAS DISPOSICOES GERAIS</h2>
<p>O(A) EMPREGADO(A) compromete-se a cumprir as normas internas da empresa e a manter sigilo sobre
todas as informacoes confidenciais a que tiver acesso.</p>

<p>E, por estarem assim justos e contratados, assinam o presente instrumento em duas vias de igual
teor e forma, na presenca de duas testemunhas.</p>

<p>{{CIDADE}}, {{DATA_CONTRATO}}</p>

<br><br>
<p>_______________________________________<br>
<strong>{{EMPRESA_RAZAO_SOCIAL}}</strong><br>
EMPREGADORA</p>

<br><br>
<p>_______________________________________<br>
<strong>{{COLABORADOR_NOME}}</strong><br>
EMPREGADO(A)</p>

<br><br>
<p>Testemunhas:</p>
<p>1. _______________________ CPF: _______________</p>
<p>2. _______________________ CPF: _______________</p>
</body>
</html>',
            'EMPRESA_RAZAO_SOCIAL,EMPRESA_CNPJ,EMPRESA_ENDERECO,COLABORADOR_NOME,COLABORADOR_ESTADO_CIVIL,COLABORADOR_RG,COLABORADOR_CPF,COLABORADOR_ENDERECO,CARGO,DEPARTAMENTO,SALARIO,SALARIO_EXTENSO,CARGA_HORARIA,HORARIO_ENTRADA,HORARIO_SAIDA,INTERVALO,DATA_ADMISSAO,CIDADE,DATA_CONTRATO',
            TRUE
        FROM shared.tenants t
        WHERE EXISTS (SELECT 1 FROM shared.tenants)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
