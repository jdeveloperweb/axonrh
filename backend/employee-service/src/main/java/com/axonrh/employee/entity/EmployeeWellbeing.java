package com.axonrh.employee.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "employee_wellbeing")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeWellbeing {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private UUID employeeId;

    @Column(nullable = false)
    private Integer score; // 1-5

    @Column(length = 1000, columnDefinition = "TEXT")
    private String notes;

    private String sentiment; // POSITIVE, NEGATIVE, NEUTRAL

    @Column(length = 500)
    private String keywords; // Comma separated

    private String riskLevel; // LOW, MEDIUM, HIGH

    private boolean wantsEapContact;

    @Column(length = 20)
    private String source; // WEB, MOBILE

    @CreationTimestamp
    private LocalDateTime createdAt;

    @Builder.Default
    private boolean handled = false;

    private LocalDateTime handledAt;

    private UUID handledBy;
}
