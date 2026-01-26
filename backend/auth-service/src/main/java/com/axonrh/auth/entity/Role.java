package com.axonrh.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Entidade de Role (Papel) para RBAC.
 * Papeis pre-definidos: ADMIN, GESTOR_RH, ANALISTA_DP, LIDER, COLABORADOR, CONTADOR
 */
@Entity
@Table(name = "roles", schema = "shared")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id")
    private UUID tenantId; // null = role global do sistema

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 255)
    private String description;

    // Se e um papel do sistema (nao pode ser editado/deletado)
    @Column(name = "is_system_role")
    @Builder.Default
    private boolean systemRole = false;

    // Nivel hierarquico (para heranca de permissoes)
    @Column(name = "hierarchy_level")
    @Builder.Default
    private int hierarchyLevel = 0;

    @Column(name = "is_active")
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Relacionamentos
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "role_permissions",
            schema = "shared",
            joinColumns = @JoinColumn(name = "role_id"),
            inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    @Builder.Default
    private Set<Permission> permissions = new HashSet<>();

    // Papeis pre-definidos do sistema
    public static final String ADMIN = "ADMIN";
    public static final String GESTOR_RH = "GESTOR_RH";
    public static final String ANALISTA_DP = "ANALISTA_DP";
    public static final String LIDER = "LIDER";
    public static final String COLABORADOR = "COLABORADOR";
    public static final String CONTADOR = "CONTADOR";
}
