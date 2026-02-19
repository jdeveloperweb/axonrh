package com.axonrh.employee.entity.enums;

/**
 * Status do processo de contratacao digital.
 */
public enum DigitalHiringStatus {

    /**
     * Link enviado, aguardando preenchimento de dados pessoais.
     */
    ADMISSION_PENDING,

    /**
     * Dados pessoais preenchidos, aguardando envio de documentos.
     */
    DOCUMENTS_PENDING,

    /**
     * Documentos enviados, em validacao pela IA e/ou RH.
     */
    DOCUMENTS_VALIDATING,

    /**
     * Documentos validados, aguardando assinatura do contrato.
     */
    SIGNATURE_PENDING,

    /**
     * Processo concluido — colaborador criado no employee-service.
     */
    COMPLETED,

    /**
     * Processo cancelado pelo RH.
     */
    CANCELLED
}
