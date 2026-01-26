package com.axonrh.vacation.entity;

import com.axonrh.vacation.entity.enums.VacationPeriodStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * T155 - Periodo Aquisitivo de Ferias.
 * Representa o direito a ferias adquirido pelo colaborador.
 */
@Entity
@Table(name = "vacation_periods", indexes = {
    @Index(name = "idx_vacation_periods_tenant", columnList = "tenant_id"),
    @Index(name = "idx_vacation_periods_employee", columnList = "employee_id"),
    @Index(name = "idx_vacation_periods_status", columnList = "tenant_id, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VacationPeriod {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_name", length = 200)
    private String employeeName;

    // Periodo Aquisitivo (12 meses de trabalho)
    @Column(name = "acquisition_start_date", nullable = false)
    private LocalDate acquisitionStartDate;

    @Column(name = "acquisition_end_date", nullable = false)
    private LocalDate acquisitionEndDate;

    // Periodo Concessivo (12 meses apos fim do aquisitivo para gozar)
    @Column(name = "concession_start_date", nullable = false)
    private LocalDate concessionStartDate;

    @Column(name = "concession_end_date", nullable = false)
    private LocalDate concessionEndDate;

    // Dias de direito
    @Column(name = "total_days", nullable = false)
    @Builder.Default
    private Integer totalDays = 30;

    @Column(name = "used_days", nullable = false)
    @Builder.Default
    private Integer usedDays = 0;

    @Column(name = "sold_days", nullable = false)
    @Builder.Default
    private Integer soldDays = 0; // Abono pecuniario (max 10 dias)

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private VacationPeriodStatus status = VacationPeriodStatus.OPEN;

    // Faltas que reduzem ferias (Art. 130 CLT)
    @Column(name = "absences_count")
    @Builder.Default
    private Integer absencesCount = 0;

    @Column(name = "expired_at")
    private LocalDate expiredAt;

    @Column(name = "completed_at")
    private LocalDate completedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    /**
     * Calcula dias restantes.
     */
    public int getRemainingDays() {
        return totalDays - usedDays - soldDays;
    }

    /**
     * Verifica se o periodo esta expirado.
     */
    public boolean isExpired() {
        return LocalDate.now().isAfter(concessionEndDate) && getRemainingDays() > 0;
    }

    /**
     * Verifica se pode solicitar ferias neste periodo.
     */
    public boolean canRequest() {
        return status == VacationPeriodStatus.OPEN
                || status == VacationPeriodStatus.SCHEDULED
                || status == VacationPeriodStatus.PARTIALLY_USED;
    }

    /**
     * Calcula dias de ferias baseado em faltas (Art. 130 CLT).
     */
    public static int calculateVacationDays(int absences) {
        if (absences <= 5) return 30;
        if (absences <= 14) return 24;
        if (absences <= 23) return 18;
        if (absences <= 32) return 12;
        return 0; // Mais de 32 faltas perde direito
    }

    /**
     * Verifica se esta proximo de expirar (dentro de X dias).
     */
    public boolean isExpiringSoon(int daysThreshold) {
        LocalDate threshold = LocalDate.now().plusDays(daysThreshold);
        return concessionEndDate.isBefore(threshold) || concessionEndDate.isEqual(threshold);
    }
}
