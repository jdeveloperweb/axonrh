package com.axonrh.integration.esocial.entity.enums;

/**
 * Tipos de eventos do eSocial.
 */
public enum ESocialEventType {
    // Eventos de Tabelas
    S_1000("S-1000", "Informacoes do Empregador/Contribuinte"),
    S_1005("S-1005", "Tabela de Estabelecimentos e Obras"),
    S_1010("S-1010", "Tabela de Rubricas"),
    S_1020("S-1020", "Tabela de Lotacoes Tributarias"),
    S_1070("S-1070", "Tabela de Processos Administrativos/Judiciais"),

    // Eventos Nao Periodicos
    S_2190("S-2190", "Registro Preliminar de Trabalhador"),
    S_2200("S-2200", "Cadastramento Inicial do Vinculo e Admissao"),
    S_2205("S-2205", "Alteracao de Dados Cadastrais do Trabalhador"),
    S_2206("S-2206", "Alteracao de Contrato de Trabalho"),
    S_2210("S-2210", "Comunicacao de Acidente de Trabalho"),
    S_2220("S-2220", "Monitoramento da Saude do Trabalhador"),
    S_2230("S-2230", "Afastamento Temporario"),
    S_2240("S-2240", "Condicoes Ambientais do Trabalho"),
    S_2298("S-2298", "Reintegracao"),
    S_2299("S-2299", "Desligamento"),
    S_2300("S-2300", "Trabalhador Sem Vinculo de Emprego - Inicio"),
    S_2306("S-2306", "Trabalhador Sem Vinculo - Alteracao Contratual"),
    S_2399("S-2399", "Trabalhador Sem Vinculo - Termino"),
    S_2400("S-2400", "Cadastro de Beneficiario - Entes Publicos"),
    S_2405("S-2405", "Alteracao de Dados Cadastrais do Beneficiario"),
    S_2410("S-2410", "Cadastro de Beneficio - Entes Publicos - Inicio"),
    S_2416("S-2416", "Alteracao do Cadastro de Beneficio"),
    S_2418("S-2418", "Reativacao de Beneficio"),
    S_2420("S-2420", "Cadastro de Beneficio - Entes Publicos - Termino"),
    S_2500("S-2500", "Processo Trabalhista"),
    S_2501("S-2501", "Informacoes de Tributos Decorrentes de Processo Trabalhista"),

    // Eventos Periodicos
    S_1200("S-1200", "Remuneracao de Trabalhador vinculado ao RGPS"),
    S_1202("S-1202", "Remuneracao de Servidor vinculado a RPPS"),
    S_1207("S-1207", "Beneficios - Entes Publicos"),
    S_1210("S-1210", "Pagamentos de Rendimentos do Trabalho"),
    S_1260("S-1260", "Comercializacao da Producao Rural PF"),
    S_1270("S-1270", "Contratacao de Trabalhadores Avulsos Nao Portuarios"),
    S_1280("S-1280", "Informacoes Complementares aos Eventos Periodicos"),
    S_1298("S-1298", "Reabertura dos Eventos Periodicos"),
    S_1299("S-1299", "Fechamento dos Eventos Periodicos"),

    // Eventos de SST
    S_2210_SST("S-2210", "CAT - Comunicacao de Acidente de Trabalho"),
    S_2220_SST("S-2220", "ASO - Monitoramento da Saude do Trabalhador"),
    S_2240_SST("S-2240", "Condicoes Ambientais do Trabalho - Agentes Nocivos"),

    // Eventos Totalizadores
    S_5001("S-5001", "Informacoes das contribuicoes sociais consolidadas por trabalhador"),
    S_5002("S-5002", "Imposto de Renda Retido na Fonte consolidado por trabalhador"),
    S_5003("S-5003", "Informacoes do FGTS por Trabalhador"),
    S_5011("S-5011", "Informacoes das contribuicoes sociais consolidadas por contribuinte"),
    S_5012("S-5012", "Informacoes do IRRF consolidadas por contribuinte"),
    S_5013("S-5013", "Informacoes do FGTS consolidadas por contribuinte");

    private final String code;
    private final String description;

    ESocialEventType(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public static ESocialEventType fromCode(String code) {
        for (ESocialEventType type : values()) {
            if (type.code.equals(code)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Tipo de evento desconhecido: " + code);
    }
}
