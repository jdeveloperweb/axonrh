package com.axonrh.core.setup.repository;

import com.axonrh.core.setup.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PositionRepository extends JpaRepository<Position, UUID> {
    Optional<Position> findByTenantIdAndCode(UUID tenantId, String code);
    
    List<Position> findAllByTenantId(UUID tenantId);

    @Query("SELECT p FROM Position p LEFT JOIN FETCH p.department WHERE p.tenantId = :tenantId")
    List<Position> findAllByTenantIdWithDepartment(@Param("tenantId") UUID tenantId);
}
