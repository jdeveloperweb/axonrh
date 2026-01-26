package com.axonrh.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade de Permission para controle granular de acesso.
 * Formato: RESOURCE:ACTION (ex: EMPLOYEE:READ, EMPLOYEE:CREATE)
 */
@Entity
@Table(name = "permissions", schema = "shared")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Recurso (ex: EMPLOYEE, TIMESHEET, VACATION)
    @Column(nullable = false, length = 50)
    private String resource;

    // Acao (ex: CREATE, READ, UPDATE, DELETE, APPROVE)
    @Column(nullable = false, length = 30)
    private String action;

    // Nome legivel (ex: "Visualizar Colaboradores")
    @Column(name = "display_name", length = 100)
    private String displayName;

    @Column(length = 255)
    private String description;

    // Modulo ao qual pertence
    @Column(length = 50)
    private String module;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Retorna o codigo completo da permissao (RESOURCE:ACTION)
     */
    public String getCode() {
        return resource + ":" + action;
    }

    // Constantes de recursos
    public static final String RESOURCE_EMPLOYEE = "EMPLOYEE";
    public static final String RESOURCE_TIMESHEET = "TIMESHEET";
    public static final String RESOURCE_VACATION = "VACATION";
    public static final String RESOURCE_PERFORMANCE = "PERFORMANCE";
    public static final String RESOURCE_LEARNING = "LEARNING";
    public static final String RESOURCE_REPORT = "REPORT";
    public static final String RESOURCE_CONFIG = "CONFIG";
    public static final String RESOURCE_USER = "USER";
    public static final String RESOURCE_ROLE = "ROLE";

    // Constantes de acoes
    public static final String ACTION_CREATE = "CREATE";
    public static final String ACTION_READ = "READ";
    public static final String ACTION_UPDATE = "UPDATE";
    public static final String ACTION_DELETE = "DELETE";
    public static final String ACTION_APPROVE = "APPROVE";
    public static final String ACTION_EXPORT = "EXPORT";
    public static final String ACTION_IMPORT = "IMPORT";
}
