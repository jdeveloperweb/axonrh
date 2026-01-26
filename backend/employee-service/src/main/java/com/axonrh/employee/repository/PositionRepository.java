package com.axonrh.employee.repository;

import com.axonrh.employee.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PositionRepository extends JpaRepository<Position, UUID> {

    List<Position> findByTenantIdAndIsActiveTrueOrderByTitle(UUID tenantId);

    Optional<Position> findByTenantIdAndId(UUID tenantId, UUID id);

    Optional<Position> findByTenantIdAndCode(UUID tenantId, String code);

    boolean existsByTenantIdAndCode(UUID tenantId, String code);

    List<Position> findByTenantIdAndDepartmentIdAndIsActiveTrue(UUID tenantId, UUID departmentId);

    long countByTenantIdAndIsActiveTrue(UUID tenantId);
}
