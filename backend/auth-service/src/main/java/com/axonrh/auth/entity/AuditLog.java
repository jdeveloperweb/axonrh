package com.axonrh.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade para rastreabilidade (Audit Log).
 * Registra quem fez o que, quando e onde.
 */
@Entity
@Table(name = "audit_logs", schema = "shared")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "user_name")
    private String userName;

    @Column(name = "user_email")
    private String userEmail;

    @Column(nullable = false)
    private String action; // Ex: CREATE, UPDATE, DELETE, LOGIN, EXPORT

    @Column(nullable = false)
    private String resource; // Ex: EMPLOYEE, ROLE, PAYROLL

    @Column(name = "resource_id")
    private String resourceId;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(columnDefinition = "TEXT")
    private String details; // JSON ou string descritiva das mudancas

    @Column(name = "status")
    private String status; // SUCCESS, FAILURE

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
