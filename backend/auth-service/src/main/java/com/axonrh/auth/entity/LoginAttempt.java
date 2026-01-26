package com.axonrh.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade para registrar tentativas de login (sucesso e falha).
 * Usado para auditoria e controle de bloqueio.
 */
@Entity
@Table(name = "login_attempts", schema = "shared")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(nullable = false)
    private boolean success;

    @Column(name = "failure_reason", length = 100)
    private String failureReason;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(length = 100)
    private String location;

    @CreationTimestamp
    @Column(name = "attempted_at", nullable = false, updatable = false)
    private LocalDateTime attemptedAt;

    // Motivos de falha
    public static final String REASON_INVALID_CREDENTIALS = "INVALID_CREDENTIALS";
    public static final String REASON_ACCOUNT_LOCKED = "ACCOUNT_LOCKED";
    public static final String REASON_ACCOUNT_DISABLED = "ACCOUNT_DISABLED";
    public static final String REASON_2FA_REQUIRED = "2FA_REQUIRED";
    public static final String REASON_2FA_INVALID = "2FA_INVALID";
    public static final String REASON_USER_NOT_FOUND = "USER_NOT_FOUND";
}
