package com.axonrh.timesheet.entity;

import com.axonrh.timesheet.entity.enums.OvertimeBankType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * T130 - Banco de horas.
 * Registra creditos e debitos de horas extras/compensacoes.
 */
@Entity
@Table(name = "overtime_bank", indexes = {
    @Index(name = "idx_overtime_bank_employee", columnList = "employee_id"),
    @Index(name = "idx_overtime_bank_tenant_date", columnList = "tenant_id, reference_date"),
    @Index(name = "idx_overtime_bank_expiration", columnList = "expiration_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OvertimeBank {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    // Tipo de movimentacao
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private OvertimeBankType type;

    // Data de referencia
    @Column(name = "reference_date", nullable = false)
    private LocalDate referenceDate;

    // Minutos (positivo = credito, negativo = debito)
    @Column(name = "minutes", nullable = false)
    private Integer minutes;

    // Saldo acumulado apos esta movimentacao
    @Column(name = "balance_after", nullable = false)
    private Integer balanceAfter;

    // Data de expiracao das horas (CLT: 6 meses)
    @Column(name = "expiration_date")
    private LocalDate expirationDate;

    // Indica se as horas ja expiraram
    @Column(name = "expired")
    @Builder.Default
    private Boolean expired = false;

    // Referencia ao registro de ponto que originou (se CREDIT)
    @Column(name = "time_record_id")
    private UUID timeRecordId;

    // Descricao/observacao
    @Column(name = "description", length = 500)
    private String description;

    // Fator multiplicador (ex: 1.5 para hora extra 50%, 2.0 para feriado)
    @Column(name = "multiplier")
    @Builder.Default
    private Double multiplier = 1.0;

    // Minutos originais antes do multiplicador
    @Column(name = "original_minutes")
    private Integer originalMinutes;

    // Aprovacao (para ajustes manuais e pagamentos)
    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    // Auditoria
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by")
    private UUID createdBy;
}
