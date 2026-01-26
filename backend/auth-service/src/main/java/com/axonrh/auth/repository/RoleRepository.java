package com.axonrh.auth.repository;

import com.axonrh.auth.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository para operacoes com roles.
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {

    Optional<Role> findByName(String name);

    Optional<Role> findByNameAndTenantId(String name, UUID tenantId);

    List<Role> findByTenantIdOrTenantIdIsNull(UUID tenantId);

    List<Role> findBySystemRoleTrue();

    @Query("SELECT r FROM Role r LEFT JOIN FETCH r.permissions WHERE r.name = :name")
    Optional<Role> findByNameWithPermissions(@Param("name") String name);

    boolean existsByNameAndTenantId(String name, UUID tenantId);
}
