package com.axonrh.ai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

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
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(nullable = false)
    private Integer score;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private String sentiment;

    @Column(length = 500)
    private String keywords;

    @Column(name = "risk_level")
    private String riskLevel;

    @Column(name = "wants_eap_contact", nullable = false)
    @Builder.Default
    private Boolean wantsEapContact = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
