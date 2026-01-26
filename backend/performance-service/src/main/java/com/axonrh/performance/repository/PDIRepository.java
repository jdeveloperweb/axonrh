package com.axonrh.performance.repository;

import com.axonrh.performance.entity.PDI;
import com.axonrh.performance.entity.enums.PDIStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PDIRepository extends JpaRepository<PDI, UUID> {

    Optional<PDI> findByTenantIdAndId(UUID tenantId, UUID id);

    // PDIs do colaborador
    List<PDI> findByTenantIdAndEmployeeIdOrderByCreatedAtDesc(UUID tenantId, UUID employeeId);

    // PDIs ativos do colaborador
    List<PDI> findByTenantIdAndEmployeeIdAndStatus(UUID tenantId, UUID employeeId, PDIStatus status);

    // PDIs sob gestao de um gestor
    List<PDI> findByTenantIdAndManagerIdOrderByEndDateAsc(UUID tenantId, UUID managerId);

    // PDIs pendentes de aprovacao
    List<PDI> findByTenantIdAndManagerIdAndStatus(UUID tenantId, UUID managerId, PDIStatus status);

    // PDIs atrasados
    @Query("SELECT p FROM PDI p WHERE p.tenantId = :tenantId " +
           "AND p.endDate < :date " +
           "AND p.status NOT IN ('COMPLETED', 'CANCELLED')")
    List<PDI> findOverdue(@Param("tenantId") UUID tenantId, @Param("date") LocalDate date);

    // PDIs por avaliacao
    Optional<PDI> findByTenantIdAndEvaluationId(UUID tenantId, UUID evaluationId);

    // Estatisticas
    @Query("SELECT COUNT(p) FROM PDI p WHERE p.tenantId = :tenantId " +
           "AND p.managerId = :managerId AND p.status = :status")
    long countByManagerAndStatus(@Param("tenantId") UUID tenantId,
                                 @Param("managerId") UUID managerId,
                                 @Param("status") PDIStatus status);

    @Query("SELECT AVG(p.overallProgress) FROM PDI p WHERE p.tenantId = :tenantId " +
           "AND p.status = 'ACTIVE'")
    Double calculateAverageProgress(@Param("tenantId") UUID tenantId);

    // Paginacao
    Page<PDI> findByTenantId(UUID tenantId, Pageable pageable);
}
