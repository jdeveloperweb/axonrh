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
            -- Identificação
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            registration_number VARCHAR(20),
            user_id UUID,
            
            -- Dados Pessoais
            cpf VARCHAR(11) NOT NULL,
            full_name VARCHAR(200) NOT NULL,
            social_name VARCHAR(200),
            birth_date DATE NOT NULL,
            gender VARCHAR(20),  -- MALE, FEMALE, NON_BINARY, OTHER
            ethnicity VARCHAR(20),
            race VARCHAR(20),
            marital_status VARCHAR(20),  -- SINGLE, MARRIED, DIVORCED, WIDOWED, STABLE_UNION
            nationality VARCHAR(50),
            birth_city VARCHAR(100),
            birth_state VARCHAR(2),
            mother_name VARCHAR(200),
            father_name VARCHAR(200),
            
            -- Documentos
            rg_number VARCHAR(20), rg_issuer VARCHAR(20), rg_state VARCHAR(2), rg_issue_date DATE,
            pis_pasep VARCHAR(15),
            ctps_number VARCHAR(20), ctps_series VARCHAR(10), ctps_state VARCHAR(2), ctps_issue_date DATE,
            voter_title VARCHAR(20), voter_zone VARCHAR(10), voter_section VARCHAR(10),
            military_certificate VARCHAR(20),
            driver_license VARCHAR(20), driver_license_category VARCHAR(5), driver_license_expiry DATE,
            
            -- Contato
            email VARCHAR(200) NOT NULL,
            personal_email VARCHAR(200),
            phone VARCHAR(20),
            mobile VARCHAR(20),
            emergency_contact_name VARCHAR(200),
            emergency_contact_phone VARCHAR(20),
            emergency_contact_relationship VARCHAR(50),
            
            -- Endereço (IMPORTANTE: endereço está na tabela employees!)
            address_street VARCHAR(200),
            address_number VARCHAR(20),
            address_complement VARCHAR(100),
            address_neighborhood VARCHAR(100),
            address_city VARCHAR(100),
            address_state VARCHAR(2),
            address_zip_code VARCHAR(10),
            address_country VARCHAR(50),
            
            -- Dados Profissionais (FKs)
            department_id UUID,      -- FK para departments
            position_id UUID,        -- FK para positions
            cost_center_id UUID,     -- FK para cost_centers
            manager_id UUID,         -- FK para employees (auto-relacionamento)
            hire_date DATE NOT NULL,
            termination_date DATE,
            employment_type VARCHAR(30) NOT NULL,  -- CLT, PJ, INTERN, TEMPORARY, OUTSOURCED
            work_regime VARCHAR(30),  -- FULL_TIME, PART_TIME, SHIFT_WORK, FLEXIBLE
            weekly_hours INTEGER,
            shift VARCHAR(50),
            
            -- Dados Bancários
            bank_code VARCHAR(10), bank_name VARCHAR(100),
            bank_agency VARCHAR(10), bank_agency_digit VARCHAR(2),
            bank_account VARCHAR(20), bank_account_digit VARCHAR(2),
            bank_account_type VARCHAR(20),  -- CHECKING, SAVINGS
            pix_key VARCHAR(100), pix_key_type VARCHAR(20),  -- CPF, EMAIL, PHONE, RANDOM
            
            -- Salário (IMPORTANTE: salário base está aqui!)
            base_salary DECIMAL(15,2),
            salary_type VARCHAR(20),  -- MONTHLY, HOURLY, DAILY
            
            -- Status
            status VARCHAR(20),  -- ACTIVE, INACTIVE, TERMINATED, ON_LEAVE
            is_active BOOLEAN,
            photo_url VARCHAR(500),
            created_at TIMESTAMP, updated_at TIMESTAMP,
            created_by UUID, updated_by UUID
        )

        -- TABELA: shared.departments
        -- Departamentos/áreas da empresa
        shared.departments (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            code VARCHAR(20) NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            parent_id UUID,          -- FK para departments (hierarquia)
            manager_id UUID,         -- ID do funcionário gestor
            cost_center_id UUID,     -- FK para cost_centers
            is_active BOOLEAN,
            created_at TIMESTAMP, updated_at TIMESTAMP,
            created_by UUID, updated_by UUID
        )

        -- TABELA: shared.positions
        -- Cargos/funções
        shared.positions (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            code VARCHAR(20) NOT NULL,
            title VARCHAR(100) NOT NULL,
            description TEXT,
            responsibilities TEXT,
            cbo_code VARCHAR(10),           -- Código CBO
            salary_range_min DECIMAL(15,2),
            salary_range_max DECIMAL(15,2),
            level VARCHAR(20),              -- JUNIOR, PLENO, SENIOR, MANAGER
            department_id UUID,             -- FK para departments
            is_active BOOLEAN,
            created_at TIMESTAMP, updated_at TIMESTAMP,
            created_by UUID, updated_by UUID
        )

        -- TABELA: shared.cost_centers
        -- Centros de custo
        shared.cost_centers (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            code VARCHAR(20) NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            parent_id UUID,              -- FK para cost_centers (hierarquia)
            budget_annual DECIMAL(15,2),
            is_active BOOLEAN,
            created_at TIMESTAMP, updated_at TIMESTAMP,
            created_by UUID, updated_by UUID
        )

        -- TABELA: shared.employee_dependents
        -- Dependentes dos funcionários
        shared.employee_dependents (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            employee_id UUID NOT NULL,   -- FK para employees
            full_name VARCHAR(200) NOT NULL,
            relationship VARCHAR(30) NOT NULL,  -- SPOUSE, CHILD, PARENT, OTHER
            birth_date DATE NOT NULL,
            cpf VARCHAR(11),
            gender VARCHAR(20),
            is_ir_dependent BOOLEAN,           -- Dependente para IR
            is_health_plan_dependent BOOLEAN,  -- Dependente no plano de saúde
            is_allowance_dependent BOOLEAN,    -- Dependente para salário família
            birth_certificate_number VARCHAR(50),
            is_active BOOLEAN,
            start_date DATE,
            end_date DATE,
            created_at TIMESTAMP, updated_at TIMESTAMP
        )

        -- TABELA: shared.admission_processes
        -- Processos de admissão digital
        shared.admission_processes (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            access_token VARCHAR(64) UNIQUE NOT NULL,
            candidate_name VARCHAR(200) NOT NULL,
            candidate_email VARCHAR(200) NOT NULL,
            candidate_cpf VARCHAR(11),
            candidate_phone VARCHAR(20),
            expected_hire_date DATE,
            department_id UUID,              -- FK para departments
            position_id UUID,                -- FK para positions
            status VARCHAR(30) NOT NULL,     -- LINK_GENERATED, DATA_FILLING, DOCUMENTS_PENDING, etc
            current_step INTEGER,
            employee_id UUID,                -- FK para employees (após conclusão)
            link_expires_at TIMESTAMP,
            link_accessed_at TIMESTAMP,
            contract_signed_at TIMESTAMP,
            esocial_sent_at TIMESTAMP,
            completed_at TIMESTAMP,
            created_at TIMESTAMP, updated_at TIMESTAMP
        )

        -- ==================== MÓDULO: FÉRIAS (VACATION SERVICE) ====================

        -- TABELA: vacation_requests
        -- Solicitações de férias
        vacation_requests (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            employee_id UUID NOT NULL,       -- FK para employees
            acquisition_period_start DATE NOT NULL,
            acquisition_period_end DATE NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            days_requested INTEGER NOT NULL,
            days_sold INTEGER,               -- Abono pecuniário (venda de dias)
            status VARCHAR(20) NOT NULL,     -- PENDING, APPROVED, REJECTED, CANCELLED
            approved_by UUID,
            approved_at TIMESTAMP,
            notes TEXT,
            created_at TIMESTAMP, updated_at TIMESTAMP
        )

        -- TABELA: vacation_periods
        -- Períodos aquisitivos de férias
        vacation_periods (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            employee_id UUID NOT NULL,       -- FK para employees
            acquisition_start DATE NOT NULL,
            acquisition_end DATE NOT NULL,
            enjoyment_deadline DATE NOT NULL,
            total_days INTEGER NOT NULL,
            used_days INTEGER,
            sold_days INTEGER,
            remaining_days INTEGER,
            status VARCHAR(20),              -- PENDING, ACTIVE, EXPIRED
            created_at TIMESTAMP, updated_at TIMESTAMP
        )

        -- ==================== MÓDULO: PONTO (TIMESHEET SERVICE) ====================

        -- TABELA: time_records
        -- Registros de ponto
        time_records (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            employee_id UUID NOT NULL,       -- FK para employees
            record_date DATE NOT NULL,
            clock_in TIMESTAMP,
            lunch_out TIMESTAMP,
            lunch_in TIMESTAMP,
            clock_out TIMESTAMP,
            total_hours DECIMAL(5,2),
            overtime_hours DECIMAL(5,2),
            night_hours DECIMAL(5,2),
            status VARCHAR(20),              -- COMPLETE, INCOMPLETE, PENDING_APPROVAL
            location_lat DECIMAL(10,8),
            location_lng DECIMAL(11,8),
            created_at TIMESTAMP, updated_at TIMESTAMP
        )

        -- TABELA: work_schedules
        -- Escalas de trabalho
        work_schedules (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            weekly_hours INTEGER NOT NULL,
            is_active BOOLEAN,
            created_at TIMESTAMP, updated_at TIMESTAMP
        )

        -- TABELA: overtime_bank
        -- Banco de horas
        overtime_bank (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            employee_id UUID NOT NULL,       -- FK para employees
            reference_month DATE NOT NULL,
            hours_balance DECIMAL(8,2),      -- Saldo de horas (positivo ou negativo)
            hours_worked DECIMAL(8,2),
            hours_compensated DECIMAL(8,2),
            hours_paid DECIMAL(8,2),
            created_at TIMESTAMP, updated_at TIMESTAMP
        )

        -- ==================== MÓDULO: FOLHA DE PAGAMENTO (PAYROLL SERVICE) ====================

        -- TABELA: payroll_periods
        -- Períodos de folha de pagamento
        payroll_periods (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            reference_month DATE NOT NULL,
            period_type VARCHAR(20),         -- MONTHLY, THIRTEENTH, VACATION, TERMINATION
            status VARCHAR(20) NOT NULL,     -- DRAFT, CALCULATED, APPROVED, PAID, CLOSED
            total_employees INTEGER,
            total_gross DECIMAL(15,2),
            total_net DECIMAL(15,2),
            total_deductions DECIMAL(15,2),
            total_benefits DECIMAL(15,2),
            payment_date DATE,
            closed_at TIMESTAMP,
            created_at TIMESTAMP, updated_at TIMESTAMP
        )

        -- TABELA: payroll_items
        -- Itens individuais da folha
        payroll_items (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            payroll_period_id UUID NOT NULL, -- FK para payroll_periods
            employee_id UUID NOT NULL,       -- FK para employees
            base_salary DECIMAL(15,2),
            gross_salary DECIMAL(15,2),
            net_salary DECIMAL(15,2),
            total_earnings DECIMAL(15,2),
            total_deductions DECIMAL(15,2),
            inss DECIMAL(15,2),
            irrf DECIMAL(15,2),
            fgts DECIMAL(15,2),
            status VARCHAR(20),
            created_at TIMESTAMP, updated_at TIMESTAMP
        )

        -- ==================== MÓDULO: DESEMPENHO (PERFORMANCE SERVICE) ====================

        -- TABELA: evaluations
        -- Avaliações de desempenho
        evaluations (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            employee_id UUID NOT NULL,       -- FK para employees (avaliado)
            evaluator_id UUID NOT NULL,      -- FK para employees (avaliador)
            cycle_id UUID,                   -- FK para evaluation_cycles
            evaluation_type VARCHAR(30),     -- SELF, MANAGER, PEER, SUBORDINATE, 360
            status VARCHAR(20),              -- PENDING, IN_PROGRESS, COMPLETED
            overall_score DECIMAL(5,2),
            strengths TEXT,
            improvement_areas TEXT,
            comments TEXT,
            completed_at TIMESTAMP,
            created_at TIMESTAMP, updated_at TIMESTAMP
        )

        -- TABELA: goals
        -- Metas/objetivos
        goals (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            employee_id UUID NOT NULL,       -- FK para employees
            title VARCHAR(200) NOT NULL,
            description TEXT,
            target_value DECIMAL(15,2),
            current_value DECIMAL(15,2),
            unit VARCHAR(50),
            weight DECIMAL(5,2),             -- Peso da meta (%)
            start_date DATE,
            due_date DATE,
            status VARCHAR(20),              -- NOT_STARTED, IN_PROGRESS, COMPLETED, CANCELLED
            completion_percentage DECIMAL(5,2),
            created_at TIMESTAMP, updated_at TIMESTAMP
        )

        -- ==================== MÓDULO: TREINAMENTO (LEARNING SERVICE) ====================

        -- TABELA: courses
        -- Cursos de treinamento
        courses (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            category VARCHAR(100),
            duration_hours INTEGER,
            instructor VARCHAR(200),
            is_mandatory BOOLEAN,
            is_active BOOLEAN,
            created_at TIMESTAMP, updated_at TIMESTAMP
        )

        -- TABELA: enrollments
        -- Matrículas em cursos
        enrollments (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            employee_id UUID NOT NULL,       -- FK para employees
            course_id UUID NOT NULL,         -- FK para courses
            enrollment_date DATE NOT NULL,
            start_date DATE,
            completion_date DATE,
            status VARCHAR(20),              -- ENROLLED, IN_PROGRESS, COMPLETED, CANCELLED
            progress_percentage DECIMAL(5,2),
            final_score DECIMAL(5,2),
            certificate_url VARCHAR(500),
            created_at TIMESTAMP, updated_at TIMESTAMP
        )

        -- ==================== MÓDULO: CORE (USUÁRIOS E TENANTS) ====================

        -- TABELA: shared.users
        -- Usuários do sistema
        shared.users (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            email VARCHAR(200) UNIQUE NOT NULL,
            password_hash VARCHAR(255),
            full_name VARCHAR(200),
            is_active BOOLEAN,
            is_verified BOOLEAN,
            employee_id UUID,                -- FK para employees
            last_login_at TIMESTAMP,
            created_at TIMESTAMP, updated_at TIMESTAMP
        )

        -- TABELA: shared.tenants
        -- Empresas/organizações
        shared.tenants (
            id UUID PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            cnpj VARCHAR(14) UNIQUE,
            is_active BOOLEAN,
            subscription_plan VARCHAR(50),
            subscription_expires_at TIMESTAMP,
            created_at TIMESTAMP, updated_at TIMESTAMP
        )

        -- ==================== EXEMPLOS DE QUERIES ÚTEIS ====================
        
        -- 1. Buscar funcionários com departamento, cargo e salário:
        -- SELECT e.full_name AS "Nome", d.name AS "Departamento", p.title AS "Cargo", 
        --        e.base_salary AS "Salário", e.email AS "Email"
        -- FROM shared.employees e
        -- LEFT JOIN shared.departments d ON e.department_id = d.id AND d.tenant_id = :tenant_id
        -- LEFT JOIN shared.positions p ON e.position_id = p.id AND p.tenant_id = :tenant_id
        -- WHERE e.tenant_id = :tenant_id AND e.is_active = true
        -- LIMIT 100
        
        -- 2. Buscar funcionários de um departamento específico:
        -- WHERE d.name ILIKE :dept_name  (parâmetro: "dept_name": "%TI%")
        
        -- 3. Buscar funcionários com endereço completo:
        -- SELECT e.full_name AS "Nome", 
        --        e.address_street AS "Rua", e.address_number AS "Número",
        --        e.address_city AS "Cidade", e.address_state AS "Estado"
        -- FROM shared.employees e 
        -- WHERE e.tenant_id = :tenant_id
        
        -- 4. Contar funcionários por departamento:
        -- SELECT d.name AS "Departamento", COUNT(e.id) AS "Total de Funcionários"
        -- FROM shared.departments d
        -- LEFT JOIN shared.employees e ON e.department_id = d.id AND e.tenant_id = :tenant_id AND e.is_active = true
        -- WHERE d.tenant_id = :tenant_id AND d.is_active = true
        -- GROUP BY d.name
        -- ORDER BY COUNT(e.id) DESC
        
        -- 5. Buscar funcionários com seus dependentes:
        -- SELECT e.full_name AS "Funcionário", dep.full_name AS "Dependente", 
        --        dep.relationship AS "Parentesco", dep.birth_date AS "Data Nascimento"
        -- FROM shared.employees e
        -- INNER JOIN shared.employee_dependents dep ON dep.employee_id = e.id AND dep.tenant_id = :tenant_id
        -- WHERE e.tenant_id = :tenant_id AND e.is_active = true AND dep.is_active = true
        
        -- 6. Buscar salários por faixa:
        -- SELECT e.full_name AS "Nome", p.title AS "Cargo", e.base_salary AS "Salário"
        -- FROM shared.employees e
        -- LEFT JOIN shared.positions p ON e.position_id = p.id AND p.tenant_id = :tenant_id
        -- WHERE e.tenant_id = :tenant_id AND e.base_salary BETWEEN :min_salary AND :max_salary
        
        -- 7. Buscar férias pendentes:
        -- SELECT e.full_name AS "Funcionário", vr.start_date AS "Início", 
        --        vr.end_date AS "Fim", vr.days_requested AS "Dias"
        -- FROM vacation_requests vr
        -- INNER JOIN shared.employees e ON vr.employee_id = e.id AND e.tenant_id = :tenant_id
        -- WHERE vr.tenant_id = :tenant_id AND vr.status = 'PENDING'
        
        -- 8. Buscar horas extras do mês:
        -- SELECT e.full_name AS "Funcionário", ob.hours_balance AS "Saldo de Horas"
        -- FROM overtime_bank ob
        -- INNER JOIN shared.employees e ON ob.employee_id = e.id AND e.tenant_id = :tenant_id
        -- WHERE ob.tenant_id = :tenant_id AND ob.reference_month = :month
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
