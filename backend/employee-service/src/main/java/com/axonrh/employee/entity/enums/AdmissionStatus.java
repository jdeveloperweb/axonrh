package com.axonrh.employee.entity.enums;

/**
 * Status do processo de admissao digital.
 */
public enum AdmissionStatus {

    /**
     * Link gerado, aguardando acesso do candidato.
     */
    LINK_GENERATED,

    /**
     * Candidato acessou e esta preenchendo dados.
     */
    DATA_FILLING,

    /**
     * Aguardando envio de documentos.
     */
    DOCUMENTS_PENDING,

    /**
     * Documentos enviados, aguardando validacao.
     */
    DOCUMENTS_VALIDATING,

    /**
     * Aguardando geracao do contrato.
     */
    CONTRACT_PENDING,

    /**
     * Contrato gerado, aguardando assinatura.
     */
    SIGNATURE_PENDING,

    /**
     * Assinado, aguardando envio eSocial.
     */
    ESOCIAL_PENDING,

    /**
     * Processo concluido com sucesso.
     */
    COMPLETED,

    /**
     * Processo cancelado.
     */
    CANCELLED,

    /**
     * Link expirado.
     */
    EXPIRED,

    /**
     * Rejeitado (documentos invalidos, etc).
     */
    REJECTED
}
