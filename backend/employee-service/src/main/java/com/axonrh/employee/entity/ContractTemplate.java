package com.axonrh.employee.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * T112 - Template de contrato de trabalho.
 */
@Entity
@Table(name = "contract_templates")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    /**
     * Tipo de contrato (CLT, ESTAGIO, TEMPORARIO, etc).
     */
    @Column(name = "contract_type", nullable = false, length = 30)
    private String contractType;

    /**
     * Conteudo HTML do template com variaveis.
     * Variaveis: {{NOME}}, {{CPF}}, {{CARGO}}, {{SALARIO}}, etc.
     */
    @Column(name = "template_content", columnDefinition = "TEXT", nullable = false)
    private String templateContent;

    /**
     * Lista de variaveis disponiveis (CSV).
     */
    @Column(name = "available_variables", columnDefinition = "TEXT")
    private String availableVariables;

    /**
     * Versao do template.
     */
    @Column(name = "version")
    @Builder.Default
    private Integer version = 1;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_default")
    @Builder.Default
    private Boolean isDefault = false;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private UUID createdBy;
}
