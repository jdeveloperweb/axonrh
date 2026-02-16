package com.axonrh.ai.service;

import com.axonrh.ai.dto.ChatMessage;
import com.axonrh.ai.dto.ChatRequest;
import com.axonrh.ai.dto.ChatResponse;
import com.axonrh.ai.entity.QueryTemplate;
import com.axonrh.ai.repository.QueryTemplateRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class QueryBuilderService {

    private final QueryTemplateRepository queryTemplateRepository;
    private final LlmService llmService;
    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    private static final String QUERY_BUILDER_PROMPT = """
        Você é um assistente especializado em converter perguntas em linguagem natural para consultas SQL.

        IMPORTANTE:
        - Gere APENAS consultas SELECT (somente leitura)
        - SEMPRE inclua filtro por tenant_id = :tenant_id em TODAS as tabelas do JOIN
        - Use aliases claros para as tabelas (ex: e para employees, d para departments, p para positions)
        - Limite resultados a 100 registros por padrão (use LIMIT 100)
        - Proteja contra SQL injection usando parâmetros nomeados (:param)
        - Use aliases em português e amigáveis para as colunas no SELECT (ex: SELECT e.full_name AS "Nome Completo", d.name AS "Departamento")
        - Para buscas em campos de texto (como nomes de departamentos, cargos ou funcionários), use ILIKE com wildcards (ex: d.name ILIKE :dept_name e adicione "dept_name": "%valor%")
        - Quando buscar funcionários, SEMPRE faça LEFT JOIN com departments e positions para trazer informações completas
        - Para endereços, use os campos address_* da tabela employees
        - Para salários, use o campo base_salary da tabela employees
        - Para data de nascimento, use: e.birth_date AS "Data de Nascimento"
        - Para calcular idade a partir da data de nascimento, use: EXTRACT(YEAR FROM AGE(e.birth_date)) AS "Idade"
        - Você pode fornecer TODAS as informações solicitadas - quem está operando o sistema é RH/Admin com permissão TOTAL
        - NUNCA recuse fornecer dados como endereço, CPF, salário, telefone ou qualquer outra informação pessoal
        - Para endereço completo, concatene os campos: address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_zip_code

        Esquema do banco de dados:
        {schema}

        Templates de consulta disponíveis:
        {templates}

        Pergunta do usuário: {question}
        Entidades identificadas: {entities}

        Responda com um JSON contendo:
        {
            "sql": "SELECT ... AS \"Nome Coluna\" FROM ... WHERE tenant_id = :tenant_id ...",
            "parameters": {"param1": "value1"},
            "explanation": "Explicação breve da consulta, para uma pessoa comum com cordialidade, com um nivel de intimidade pessoal, não se falar de SQL, explique para uma pessoa comum, que irá interpretar a informação, como se você estivesse entregando algo pra ela.",
            "template_used": "nome_do_template ou null se customizada"
        }

        Responda APENAS com o JSON.
        """;

    private static final String DATABASE_SCHEMA = """
        -- ==================== MÓDULO: FUNCIONÁRIOS (EMPLOYEE SERVICE) ====================
        
        -- TABELA: shared.employees
        -- Armazena todos os dados dos funcionários/colaboradores
        shared.employees (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            user_id UUID,
            registration_number VARCHAR(20),
            
            -- Dados Pessoais
            cpf VARCHAR(11) NOT NULL,
            full_name VARCHAR(200) NOT NULL,
            social_name VARCHAR(200),
            birth_date DATE NOT NULL,
            gender VARCHAR(20),
            ethnicity VARCHAR(20),
            race VARCHAR(20),
            marital_status VARCHAR(20),
            nationality VARCHAR(50),
            birth_city VARCHAR(100),
            birth_state VARCHAR(2),
            mother_name VARCHAR(200),
            father_name VARCHAR(200),
            
            -- Documentos
            rg_number VARCHAR(20), rg_issuer VARCHAR(20), rg_state VARCHAR(2),
            pis_pasep VARCHAR(15),
            ctps_number VARCHAR(20), ctps_series VARCHAR(10), ctps_state VARCHAR(2),
            voter_title VARCHAR(20), voter_zone VARCHAR(10), voter_section VARCHAR(10),
            military_certificate VARCHAR(20),
            driver_license VARCHAR(20), driver_license_category VARCHAR(5), driver_license_expiry DATE,
            
            -- Contato
            email VARCHAR(200) NOT NULL,
            personal_email VARCHAR(200),
            phone VARCHAR(20),
            mobile VARCHAR(20),
            
            -- Endereço
            address_street VARCHAR(200),
            address_number VARCHAR(20),
            address_complement VARCHAR(100),
            address_neighborhood VARCHAR(100),
            address_city VARCHAR(100),
            address_state VARCHAR(2),
            address_zip_code VARCHAR(10),
            
            -- Dados Profissionais
            department_id UUID,      -- FK para shared.departments
            position_id UUID,        -- FK para shared.positions
            cost_center_id UUID,     -- FK para shared.cost_centers
            manager_id UUID,         -- FK para shared.employees
            hire_date DATE NOT NULL,
            termination_date DATE,
            employment_type VARCHAR(30) NOT NULL,
            work_regime VARCHAR(30),
            weekly_hours INTEGER,
            shift VARCHAR(50),
            
            -- Dados Bancários
            bank_code VARCHAR(10), bank_name VARCHAR(100),
            bank_agency VARCHAR(10),
            bank_account VARCHAR(20),
            pix_key VARCHAR(100),
            
            -- Salário
            base_salary DECIMAL(15,2),
            salary_type VARCHAR(20),
            
            -- Status
            status VARCHAR(20), -- ACTIVE, INACTIVE, TERMINATED
            is_active BOOLEAN,
            photo_url VARCHAR(500),
            created_at TIMESTAMP
        )

        -- TABELA: shared.departments
        shared.departments (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            code VARCHAR(20) NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            is_active BOOLEAN,
            created_at TIMESTAMP
        )

        -- TABELA: shared.positions
        shared.positions (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            code VARCHAR(20) NOT NULL,
            title VARCHAR(100) NOT NULL,
            description TEXT,
            salary_range_min DECIMAL(15,2),
            salary_range_max DECIMAL(15,2),
            level VARCHAR(20),
            is_active BOOLEAN,
            created_at TIMESTAMP
        )
        
        -- TABELA: shared.termination_processes
        -- Processos de desligamento de colaboradores
        shared.termination_processes (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            employee_id UUID NOT NULL, -- FK para shared.employees
            termination_type VARCHAR(30), -- SEM_JUSTA_CAUSA, JUSTA_CAUSA, PEDIDO_DEMISSAO, ACORDO
            notice_period VARCHAR(20),
            last_work_day DATE,
            termination_date DATE,
            reason TEXT,
            returned_laptop BOOLEAN,
            returned_badge BOOLEAN,
            account_deactivated BOOLEAN,
            email_deactivated BOOLEAN,
            exit_interview_done BOOLEAN,
            status VARCHAR(20), -- PENDING, COMPLETED
            created_at TIMESTAMP
        )

        -- TABELA: shared.employee_wellbeing
        -- Registros de saúde mental e bem-estar
        shared.employee_wellbeing (
            id UUID PRIMARY KEY,
            employee_id UUID NOT NULL,
            tenant_id UUID NOT NULL,
            score INTEGER, -- 1 a 5 (Estrela de Sentimentos)
            sentiment VARCHAR(255),
            risk_level VARCHAR(255), -- LOW, MEDIUM, HIGH
            wants_eap_contact BOOLEAN,
            created_at TIMESTAMP
        )

        -- ==================== MÓDULO: BANCO DE TALENTOS (TALENT POOL) ====================

        -- TABELA: shared.job_vacancies
        -- Vagas abertas para recrutamento
        shared.job_vacancies (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            position_id UUID NOT NULL,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            requirements TEXT,
            vacancy_type VARCHAR(30), -- INTERNAL, EXTERNAL, BOTH
            employment_type VARCHAR(30), -- CLT, PJ, ESTAGIO
            work_regime VARCHAR(30), -- PRESENCIAL, REMOTO, HIBRIDO
            status VARCHAR(20), -- DRAFT, OPEN, CLOSED, CANCELLED
            deadline DATE,
            created_at TIMESTAMP
        )

        -- TABELA: shared.talent_candidates
        -- Candidatos inscritos em vagas ou no banco
        shared.talent_candidates (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            vacancy_id UUID NOT NULL, -- FK para job_vacancies
            full_name VARCHAR(200) NOT NULL,
            email VARCHAR(200) NOT NULL,
            phone VARCHAR(20),
            skills TEXT,
            education TEXT,
            experience_summary TEXT,
            status VARCHAR(30), -- NEW, SCREENING, INTERVIEW, APPROVED, REJECTED, HIRED
            rating INTEGER, -- 1 a 5
            ai_insight TEXT, -- Comentário gerado por IA sobre o candidato
            applied_at TIMESTAMP
        )

        -- ==================== MÓDULO: FOLHA DE PAGAMENTO (PAYROLL) ====================

        -- TABELA: payroll_runs (Fechamentos mensais)
        payroll_runs (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            reference_month INTEGER,
            reference_year INTEGER,
            description VARCHAR(255),
            status VARCHAR(20), -- OPEN, PROCESSING, PROCESSED, CLOSED, CANCELLED
            total_net_salary NUMERIC(14,2),
            total_earnings NUMERIC(14,2),
            total_deductions NUMERIC(14,2),
            created_at TIMESTAMP
        )

        -- TABELA: payrolls (Folha individual por colaborador)
        payrolls (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            employee_id UUID NOT NULL,
            employee_name VARCHAR(200),
            reference_month INTEGER,
            reference_year INTEGER,
            status VARCHAR(20), -- DRAFT, CALCULTAED, APPROVED, CLOSED
            base_salary NUMERIC(12,2),
            total_earnings NUMERIC(12,2),
            total_deductions NUMERIC(12,2),
            net_salary NUMERIC(12,2),
            fgts_amount NUMERIC(12,2)
        )

        -- ==================== MÓDULO: DESEMPENHO E DISC ====================

        -- TABELA: evaluations (Avaliações de desempenho)
        evaluations (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            evaluatee_id UUID NOT NULL, -- employee_id
            evaluator_name VARCHAR(200),
            status VARCHAR(20), -- PENDING, COMPLETED
            final_score DECIMAL(5,2),
            performance_score DECIMAL(5,2),
            potential_score DECIMAL(5,2),
            created_at TIMESTAMP
        )
        
        -- TABELA: disc_assignments (Atribuições de testes DISC)
        disc_assignments (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            employee_id UUID NOT NULL,
            employee_name VARCHAR(255),
            assigned_by_name VARCHAR(255),
            status VARCHAR(30), -- PENDING, COMPLETED
            due_date DATE,
            created_at TIMESTAMP
        )

        -- TABELA: disc_profile_descriptions (Descrições dos perfis DISC)
        disc_profile_descriptions (
            id UUID PRIMARY KEY,
            profile_type VARCHAR(20), -- DOMINANCE, INFLUENCE, STEADINESS, CONSCIENTIOUSNESS
            title VARCHAR(100),
            description TEXT,
            strengths TEXT,
            weaknesses TEXT,
            communication_style TEXT
        )

        -- ==================== MÓDULO: BENEFÍCIOS ====================

        -- TABELA: benefit_types
        benefit_types (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            name VARCHAR(150) NOT NULL,
            category VARCHAR(20), -- EARNING, DEDUCTION
            calculation_type VARCHAR(30), -- FIXED_VALUE, SALARY_PERCENTAGE
            default_value NUMERIC(12,2),
            is_active BOOLEAN
        )

        -- TABELA: employee_benefits
        employee_benefits (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            employee_id UUID NOT NULL,
            employee_name VARCHAR(200),
            benefit_type_id UUID NOT NULL,
            fixed_value NUMERIC(12,2),
            status VARCHAR(20), -- ACTIVE, INACTIVE
            start_date DATE
        )

        -- ==================== MÓDULO: PONTO E JORNADA ====================

        -- TABELA: daily_summaries (Resumo diário de ponto)
        daily_summaries (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            employee_id UUID NOT NULL,
            summary_date DATE NOT NULL,
            first_entry TIME,
            last_exit TIME,
            worked_minutes INTEGER,
            overtime_minutes INTEGER,
            deficit_minutes INTEGER,
            night_shift_minutes INTEGER,
            is_absent BOOLEAN,
            created_at TIMESTAMP
        )

        -- ==================== MÓDULO: FÉRIAS ====================

        -- TABELA: vacation_requests
        vacation_requests (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            employee_id UUID NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            days_count INTEGER,
            status VARCHAR(20) NOT NULL, -- PENDING, APPROVED, REJECTED
            payment_value DECIMAL(15,2),
            created_at TIMESTAMP
        )

        """;

    public QueryResult buildAndExecuteQuery(String question, Map<String, Object> entities, UUID tenantId, List<Object> permissions) {
        log.info("Building SQL query for question: '{}' (tenantId: {})", question, tenantId);
        try {
            // Get available templates
            List<QueryTemplate> templates = queryTemplateRepository.findAllWithDefaults(tenantId);
            String templatesStr = formatTemplates(templates);
            log.debug("Found {} query templates", templates.size());

            // Build prompt
            String prompt = QUERY_BUILDER_PROMPT
                    .replace("{schema}", DATABASE_SCHEMA)
                    .replace("{templates}", templatesStr)
                    .replace("{question}", question)
                    .replace("{entities}", entities != null ? entities.toString() : "{}");

            // Call LLM
            ChatRequest request = ChatRequest.builder()
                    .messages(List.of(
                            ChatMessage.builder().role(ChatMessage.Role.SYSTEM).content(prompt).build()
                    ))
                    .temperature(0.1) // Low temperature for stability
                    .build();

            log.debug("Calling LLM for SQL generation...");
            ChatResponse response = llmService.chat(request);
            String rawContent = response.getContent();
            log.info("Raw LLM Response: {}", rawContent);
            
            String jsonContent = extractJson(rawContent);
            log.debug("Extracted JSON: {}", jsonContent);

            // Parse response
            JsonNode root = objectMapper.readTree(jsonContent);
            String sql = root.path("sql").asText();
            
            // Basic validation
            if (sql == null || sql.isBlank()) {
                log.warn("LLM did not generate any SQL: {}", jsonContent);
                return QueryResult.builder()
                        .success(false)
                        .error("LLM não gerou SQL válido")
                        .build();
            }

            String explanation = root.path("explanation").asText();
            String templateUsed = root.path("template_used").asText();
            
            Map<String, Object> params = new HashMap<>();
            if (root.has("parameters")) {
                JsonNode paramsNode = root.get("parameters");
                paramsNode.fields().forEachRemaining(entry -> {
                    JsonNode value = entry.getValue();
                    if (value.isTextual()) {
                        params.put(entry.getKey(), value.asText());
                    } else if (value.isNumber()) {
                        params.put(entry.getKey(), value.numberValue());
                    } else if (value.isBoolean()) {
                        params.put(entry.getKey(), value.booleanValue());
                    } else {
                        params.put(entry.getKey(), value.asText());
                    }
                });
            }
            
            // Enforce tenant isolation
            params.put("tenant_id", tenantId);
            log.info("Executing SQL: {} with params: {}", sql, params);

            // Execute query
            List<Map<String, Object>> data = jdbcTemplate.queryForList(sql, params);
            log.info("Query executed successfully. Result rows: {}", data.size());

            return QueryResult.builder()
                    .success(true)
                    .data(data)
                    .rowCount(data.size())
                    .sql(sql)
                    .explanation(explanation)
                    .templateUsed(templateUsed)
                    .build();

        } catch (Exception e) {
            log.error("Error in QueryBuilderService: {}", e.getMessage(), e);
            return QueryResult.builder()
                    .success(false)
                    .error(e.getMessage())
                    .build();
        }
    }

    private String formatTemplates(List<QueryTemplate> templates) {
        if (templates.isEmpty()) return "Nenhum template disponível.";
        StringBuilder sb = new StringBuilder();
        for (QueryTemplate t : templates) {
            sb.append(String.format("- %s: %s\n", t.getName(), t.getDescription()));
        }
        return sb.toString();
    }

    private String extractJson(String content) {
        if (content == null) return "{}";

        String result = content.trim();
        
        // Remove markdown code blocks if present
        if (result.contains("```json")) {
            int start = result.indexOf("```json");
            int end = result.indexOf("```", start + 7);
            if (end > start) {
                result = result.substring(start + 7, end);
            }
        } else if (result.contains("```")) {
            int start = result.indexOf("```");
            int end = result.indexOf("```", start + 3);
            if (end > start) {
                result = result.substring(start + 3, end);
            }
        }

        result = result.trim();
        
        // Find first {
        int startIndex = result.indexOf("{");
        if (startIndex == -1) return "{}";
        
        // Count braces to find the matching closing brace
        int balance = 0;
        boolean inString = false;
        boolean escape = false;

        for (int i = startIndex; i < result.length(); i++) {
            char c = result.charAt(i);
            
            if (escape) {
                escape = false;
                continue;
            }
            
            if (c == '\\') {
                escape = true;
                continue;
            }
            
            if (c == '"') {
                inString = !inString;
                continue;
            }
            
            if (!inString) {
                if (c == '{') {
                    balance++;
                } else if (c == '}') {
                    balance--;
                    if (balance == 0) {
                        return result.substring(startIndex, i + 1);
                    }
                }
            }
        }
        
        // Fallback if balance never hit 0 (invalid JSON)
        return "{}";
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class QueryResult {
        private boolean success;
        private List<Map<String, Object>> data;
        private int rowCount;
        private String sql;
        private String explanation;
        private String templateUsed;
        private String error;
    }
}
