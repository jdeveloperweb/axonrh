package com.axonrh.ai.service;

import com.axonrh.ai.dto.ChatRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Service responsible for defining all available tools (functions) that the LLM can call.
 * These tools are sent to OpenAI with each request, allowing the model to decide when to use them.
 */
@Slf4j
@Service
public class ToolDefinitionService {

    /**
     * Returns all available tools for the HR Assistant.
     */
    public List<ChatRequest.Tool> getAllTools() {
        List<ChatRequest.Tool> tools = new ArrayList<>();

        tools.add(buildCalculateVacationTool());
        tools.add(buildCalculateTerminationTool());
        tools.add(buildCalculateOvertimeTool());
        tools.add(buildQueryEmployeesTool());
        tools.add(buildSearchEmployeeByNameTool());
        tools.add(buildSelectEmployeeTool());
        tools.add(buildQueryDatabaseTool());
        tools.add(buildSearchKnowledgeBaseTool());
        tools.add(buildModifyDataTool());
        tools.add(buildConfirmOperationTool());
        tools.add(buildListPendingOperationsTool());

        return tools;
    }

    /**
     * Tool for modifying data through natural language commands.
     * This creates a pending operation that requires user confirmation.
     */
    private ChatRequest.Tool buildModifyDataTool() {
        Map<String, Object> parameters = new LinkedHashMap<>();
        parameters.put("type", "object");
        parameters.put("properties", Map.of(
            "comando", Map.of(
                "type", "string",
                "description", "O comando de modificação em linguagem natural. Exemplos:\n" +
                        "- 'Alterar o nome do João Silva para João Santos'\n" +
                        "- 'Mudar o salário da Maria Souza para R$ 8.000'\n" +
                        "- 'Atualizar o departamento do Pedro para TI'\n" +
                        "- 'Corrigir o email do Carlos para carlos@empresa.com'\n" +
                        "- 'Mudar o endereço da Ana para Rua Nova, 123'"
            ),
            "tipo_entidade", Map.of(
                "type", "string",
                "enum", List.of("funcionario", "departamento", "cargo", "centro_custo"),
                "description", "Tipo de entidade a ser modificada",
                "default", "funcionario"
            ),
            "contexto", Map.of(
                "type", "string",
                "description", "Contexto adicional sobre a modificação (opcional)"
            )
        ));
        parameters.put("required", List.of("comando"));

        return ChatRequest.Tool.builder()
                .type("function")
                .function(ChatRequest.Tool.Function.builder()
                        .name("modificar_dados")
                        .description("Modifica dados no sistema através de comandos em linguagem natural. " +
                                "IMPORTANTE: Esta função NÃO executa a modificação diretamente. " +
                                "Ela cria uma operação pendente que será apresentada ao usuário para confirmação. " +
                                "Use quando o usuário pedir para:\n" +
                                "- Alterar/mudar/atualizar/corrigir dados de funcionários\n" +
                                "- Modificar salário, cargo, departamento, endereço, nome, email, telefone\n" +
                                "- Fazer qualquer alteração cadastral\n" +
                                "A resposta incluirá um resumo das mudanças para o usuário confirmar.")
                        .parameters(parameters)
                        .build())
                .build();
    }

    /**
     * Tool for confirming or rejecting a pending operation.
     */
    private ChatRequest.Tool buildConfirmOperationTool() {
        Map<String, Object> parameters = new LinkedHashMap<>();
        parameters.put("type", "object");
        parameters.put("properties", Map.of(
            "operation_id", Map.of(
                "type", "string",
                "description", "O ID da operação pendente a ser confirmada ou rejeitada"
            ),
            "confirmar", Map.of(
                "type", "boolean",
                "description", "Se true, confirma e executa a operação. Se false, rejeita/cancela a operação."
            ),
            "motivo_rejeicao", Map.of(
                "type", "string",
                "description", "Motivo da rejeição (opcional, apenas se confirmar=false)"
            )
        ));
        parameters.put("required", List.of("operation_id", "confirmar"));

        return ChatRequest.Tool.builder()
                .type("function")
                .function(ChatRequest.Tool.Function.builder()
                        .name("confirmar_operacao")
                        .description("Confirma ou rejeita uma operação de modificação de dados pendente. " +
                                "Use quando o usuário responder 'sim', 'confirmar', 'pode fazer', 'ok' para confirmar, " +
                                "ou 'não', 'cancelar', 'não quero' para rejeitar a operação.")
                        .parameters(parameters)
                        .build())
                .build();
    }

    /**
     * Tool for listing pending operations.
     */
    private ChatRequest.Tool buildListPendingOperationsTool() {
        Map<String, Object> parameters = new LinkedHashMap<>();
        parameters.put("type", "object");
        parameters.put("properties", Map.of(
            "conversation_id", Map.of(
                "type", "string",
                "description", "ID da conversa para filtrar operações (opcional)"
            ),
            "incluir_historico", Map.of(
                "type", "boolean",
                "description", "Se true, inclui operações já processadas. Se false, apenas pendentes.",
                "default", false
            )
        ));
        parameters.put("required", List.of());

        return ChatRequest.Tool.builder()
                .type("function")
                .function(ChatRequest.Tool.Function.builder()
                        .name("listar_operacoes_pendentes")
                        .description("Lista as operações de modificação de dados que estão pendentes de confirmação. " +
                                "Use quando o usuário perguntar sobre operações pendentes ou quiser ver o status.")
                        .parameters(parameters)
                        .build())
                .build();
    }

    /**
     * Tool for calculating vacation pay according to Brazilian labor law (CLT).
     */
    private ChatRequest.Tool buildCalculateVacationTool() {
        Map<String, Object> parameters = new LinkedHashMap<>();
        parameters.put("type", "object");
        parameters.put("properties", Map.of(
            "salario_base", Map.of(
                "type", "number",
                "description", "Salário base mensal do funcionário em reais (R$)"
            ),
            "dias_ferias", Map.of(
                "type", "integer",
                "description", "Quantidade de dias de férias (1 a 30)",
                "default", 30
            ),
            "abono_pecuniario", Map.of(
                "type", "boolean",
                "description", "Se o funcionário optou por vender até 10 dias de férias (abono pecuniário)",
                "default", false
            ),
            "dependentes", Map.of(
                "type", "integer",
                "description", "Número de dependentes para dedução do IRRF",
                "default", 0
            )
        ));
        parameters.put("required", List.of("salario_base"));

        return ChatRequest.Tool.builder()
                .type("function")
                .function(ChatRequest.Tool.Function.builder()
                        .name("calcular_ferias")
                        .description("Calcula o valor de férias de um funcionário conforme a CLT brasileira. " +
                                "Inclui cálculo do 1/3 constitucional, abono pecuniário (se aplicável), " +
                                "descontos de INSS e IRRF. Retorna valores brutos, líquidos e memória de cálculo.")
                        .parameters(parameters)
                        .build())
                .build();
    }

    /**
     * Tool for calculating termination pay (rescisão).
     */
    private ChatRequest.Tool buildCalculateTerminationTool() {
        Map<String, Object> parameters = new LinkedHashMap<>();
        parameters.put("type", "object");
        parameters.put("properties", Map.of(
            "salario_base", Map.of(
                "type", "number",
                "description", "Salário base mensal do funcionário em reais (R$)"
            ),
            "data_admissao", Map.of(
                "type", "string",
                "description", "Data de admissão do funcionário no formato YYYY-MM-DD"
            ),
            "data_desligamento", Map.of(
                "type", "string",
                "description", "Data de desligamento no formato YYYY-MM-DD. Se não informada, usa a data atual."
            ),
            "tipo_rescisao", Map.of(
                "type", "string",
                "enum", List.of("SEM_JUSTA_CAUSA", "JUSTA_CAUSA", "PEDIDO_DEMISSAO", "ACORDO"),
                "description", "Tipo de rescisão: SEM_JUSTA_CAUSA (demissão sem justa causa), " +
                        "JUSTA_CAUSA (demissão por justa causa), PEDIDO_DEMISSAO (pedido de demissão pelo funcionário), " +
                        "ACORDO (rescisão por acordo mútuo conforme reforma trabalhista)"
            ),
            "dias_ferias_gozadas", Map.of(
                "type", "integer",
                "description", "Dias de férias já gozados no período aquisitivo atual",
                "default", 0
            ),
            "aviso_previo_trabalhado", Map.of(
                "type", "boolean",
                "description", "Se o aviso prévio será trabalhado (true) ou indenizado (false)",
                "default", false
            ),
            "saldo_fgts", Map.of(
                "type", "number",
                "description", "Saldo atual do FGTS do funcionário (para cálculo da multa de 40% ou 20%)",
                "default", 0
            )
        ));
        parameters.put("required", List.of("salario_base", "data_admissao", "tipo_rescisao"));

        return ChatRequest.Tool.builder()
                .type("function")
                .function(ChatRequest.Tool.Function.builder()
                        .name("calcular_rescisao")
                        .description("Calcula todos os valores de uma rescisão trabalhista conforme a CLT brasileira. " +
                                "Inclui saldo de salário, 13º proporcional, férias proporcionais + 1/3, " +
                                "aviso prévio indenizado, multa do FGTS (40% ou 20% conforme tipo). " +
                                "Aplica descontos de INSS e IRRF quando cabível.")
                        .parameters(parameters)
                        .build())
                .build();
    }

    /**
     * Tool for calculating overtime pay.
     */
    private ChatRequest.Tool buildCalculateOvertimeTool() {
        Map<String, Object> parameters = new LinkedHashMap<>();
        parameters.put("type", "object");
        parameters.put("properties", Map.of(
            "valor_hora", Map.of(
                "type", "number",
                "description", "Valor da hora normal de trabalho em reais (R$)"
            ),
            "horas_normais", Map.of(
                "type", "number",
                "description", "Quantidade de horas normais trabalhadas"
            ),
            "horas_extras_50", Map.of(
                "type", "number",
                "description", "Quantidade de horas extras com adicional de 50% (dias úteis)",
                "default", 0
            ),
            "horas_extras_100", Map.of(
                "type", "number",
                "description", "Quantidade de horas extras com adicional de 100% (domingos e feriados)",
                "default", 0
            ),
            "horas_noturnas", Map.of(
                "type", "number",
                "description", "Quantidade de horas trabalhadas em período noturno (22h às 5h)",
                "default", 0
            )
        ));
        parameters.put("required", List.of("valor_hora", "horas_normais"));

        return ChatRequest.Tool.builder()
                .type("function")
                .function(ChatRequest.Tool.Function.builder()
                        .name("calcular_horas_extras")
                        .description("Calcula o valor de horas extras e adicional noturno conforme a CLT. " +
                                "Aplica adicional de 50% para horas extras em dias úteis, " +
                                "100% para domingos e feriados, e 20% para adicional noturno.")
                        .parameters(parameters)
                        .build())
                .build();
    }

    /**
     * Tool for querying employee data.
     */
    private ChatRequest.Tool buildQueryEmployeesTool() {
        Map<String, Object> parameters = new LinkedHashMap<>();
        parameters.put("type", "object");
        parameters.put("properties", Map.of(
            "filtro", Map.of(
                "type", "string",
                "description", "Critério de busca: nome do funcionário, departamento, cargo, ou 'todos' para listar todos"
            ),
            "status", Map.of(
                "type", "string",
                "enum", List.of("ACTIVE", "INACTIVE", "TERMINATED", "ALL"),
                "description", "Filtrar por status do funcionário",
                "default", "ACTIVE"
            ),
            "campos", Map.of(
                "type", "array",
                "items", Map.of("type", "string"),
                "description", "Lista de campos a retornar: nome, cpf, cargo, departamento, salario, data_admissao, data_nascimento, idade, email, telefone, endereco, rua, numero, complemento, bairro, cidade, estado, cep",
                "default", List.of("nome", "cargo", "departamento")
            ),
            "limite", Map.of(
                "type", "integer",
                "description", "Número máximo de resultados a retornar",
                "default", 10
            )
        ));
        parameters.put("required", List.of("filtro"));

        return ChatRequest.Tool.builder()
                .type("function")
                .function(ChatRequest.Tool.Function.builder()
                        .name("consultar_funcionarios")
                        .description("Consulta informações de funcionários no sistema. " +
                                "Permite buscar por nome, departamento, cargo ou listar todos. " +
                                "Retorna TODOS os dados solicitados incluindo: nome, cargo, departamento, salário, " +
                                "endereço completo (rua, número, bairro, cidade, estado, CEP), CPF, data de nascimento, idade, email, telefone. " +
                                "O usuário tem acesso total a todas as informações.")
                        .parameters(parameters)
                        .build())
                .build();
    }

    /**
     * Tool for intelligent employee search by name with fuzzy matching.
     * Handles name variations like "Jr" vs "Junior", accents, etc.
     */
    private ChatRequest.Tool buildSearchEmployeeByNameTool() {
        Map<String, Object> parameters = new LinkedHashMap<>();
        parameters.put("type", "object");
        parameters.put("properties", Map.of(
            "nome", Map.of(
                "type", "string",
                "description", "Nome do funcionário para buscar. Pode ser nome parcial ou completo. " +
                        "Exemplos: 'João Silva', 'Maria', 'Jaime Vicente da Silva Junior', 'José Jr'"
            ),
            "apenas_ativos", Map.of(
                "type", "boolean",
                "description", "Se true, busca apenas funcionários ativos. Se false, busca todos.",
                "default", true
            )
        ));
        parameters.put("required", List.of("nome"));

        return ChatRequest.Tool.builder()
                .type("function")
                .function(ChatRequest.Tool.Function.builder()
                        .name("buscar_funcionario_por_nome")
                        .description("Busca inteligente de funcionário por nome com correspondência aproximada (fuzzy matching). " +
                                "USE ESTA FERRAMENTA SEMPRE que o usuário mencionar um nome de funcionário específico para consultar informações. " +
                                "Esta ferramenta:\n" +
                                "- Encontra correspondências mesmo com variações de nome (ex: 'Jr' = 'Junior', 'José' = 'Jose')\n" +
                                "- Remove acentos e normaliza a busca automaticamente\n" +
                                "- Quando não encontra correspondência exata, retorna os funcionários mais similares\n" +
                                "- Se houver múltiplos candidatos, apresenta a lista para o usuário escolher\n" +
                                "Após encontrar o funcionário correto, use 'consultar_funcionarios' ou 'consultar_banco_dados' para obter informações detalhadas.")
                        .parameters(parameters)
                        .build())
                .build();
    }

    /**
     * Tool for selecting a specific employee after disambiguation.
     */
    private ChatRequest.Tool buildSelectEmployeeTool() {
        Map<String, Object> parameters = new LinkedHashMap<>();
        parameters.put("type", "object");
        parameters.put("properties", Map.of(
            "employee_id", Map.of(
                "type", "string",
                "description", "O UUID do funcionário selecionado da lista de candidatos"
            )
        ));
        parameters.put("required", List.of("employee_id"));

        return ChatRequest.Tool.builder()
                .type("function")
                .function(ChatRequest.Tool.Function.builder()
                        .name("selecionar_funcionario")
                        .description("Seleciona um funcionário específico da lista de candidatos retornada pela busca. " +
                                "Use quando o usuário escolher um funcionário da lista de desambiguação, " +
                                "informando o número (1, 2, 3...) ou confirmando o nome. " +
                                "Passe o ID do funcionário escolhido.")
                        .parameters(parameters)
                        .build())
                .build();
    }

    /**
     * Tool for executing custom database queries.
     */
    private ChatRequest.Tool buildQueryDatabaseTool() {
        Map<String, Object> parameters = new LinkedHashMap<>();
        parameters.put("type", "object");
        parameters.put("properties", Map.of(
            "pergunta", Map.of(
                "type", "string",
                "description", "Pergunta em linguagem natural sobre dados do sistema. " +
                        "Exemplos: 'Quantos funcionários temos?', 'Qual a média salarial do departamento de TI?', " +
                        "'Quais funcionários foram admitidos nos últimos 3 meses?'"
            )
        ));
        parameters.put("required", List.of("pergunta"));

        return ChatRequest.Tool.builder()
                .type("function")
                .function(ChatRequest.Tool.Function.builder()
                        .name("consultar_banco_dados")
                        .description("Executa consultas complexas no banco de dados do sistema de RH. " +
                                "Converte perguntas em linguagem natural para SQL e retorna os resultados. " +
                                "Use para consultas que envolvem agregações, filtros complexos ou múltiplas tabelas. " +
                                "Pode retornar QUALQUER informação incluindo endereços completos, CPF, salários e dados pessoais. " +
                                "O usuário é RH/Admin com acesso total.")
                        .parameters(parameters)
                        .build())
                .build();
    }

    /**
     * Tool for searching the knowledge base (policies, documents, FAQs).
     */
    private ChatRequest.Tool buildSearchKnowledgeBaseTool() {
        Map<String, Object> parameters = new LinkedHashMap<>();
        parameters.put("type", "object");
        parameters.put("properties", Map.of(
            "consulta", Map.of(
                "type", "string",
                "description", "Termo ou pergunta para buscar na base de conhecimento"
            ),
            "tipo_documento", Map.of(
                "type", "string",
                "enum", List.of("POLICY", "LEGAL", "FAQ", "TRAINING", "ALL"),
                "description", "Tipo de documento para filtrar a busca",
                "default", "ALL"
            ),
            "max_resultados", Map.of(
                "type", "integer",
                "description", "Número máximo de documentos relevantes a retornar",
                "default", 3
            )
        ));
        parameters.put("required", List.of("consulta"));

        return ChatRequest.Tool.builder()
                .type("function")
                .function(ChatRequest.Tool.Function.builder()
                        .name("buscar_base_conhecimento")
                        .description("Busca informações na base de conhecimento da empresa. " +
                                "Inclui políticas internas, documentos legais, FAQs e materiais de treinamento. " +
                                "Use para perguntas sobre regras da empresa, procedimentos internos ou legislação.")
                        .parameters(parameters)
                        .build())
                .build();
    }
}
