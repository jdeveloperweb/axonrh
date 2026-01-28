package com.axonrh.employee.repository;

import com.axonrh.employee.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, UUID> {

    List<Department> findByTenantIdAndIsActiveTrueOrderByName(UUID tenantId);

    Optional<Department> findByTenantIdAndId(UUID tenantId, UUID id);

    Optional<Department> findByTenantIdAndCode(UUID tenantId, String code);

    boolean existsByTenantIdAndCode(UUID tenantId, String code);

    List<Department> findByTenantIdAndParentIsNullAndIsActiveTrue(UUID tenantId);

    List<Department> findByTenantIdAndParentIdAndIsActiveTrue(UUID tenantId, UUID parentId);

    @Query("SELECT d FROM Department d LEFT JOIN FETCH d.parent WHERE d.tenantId = :tenantId AND d.isActive = true")
    List<Department> findAllWithParent(@Param("tenantId") UUID tenantId);

    long countByTenantIdAndIsActiveTrue(UUID tenantId);
    
    long countByTenantIdAndParentId(UUID tenantId, UUID parentId);
    
    List<Department> findByTenantIdAndManagerId(UUID tenantId, UUID managerId);
}
