package com.axonrh.core.setup.repository;

import com.axonrh.core.setup.entity.ImportJob;
import com.axonrh.core.setup.entity.ImportJob.ImportStatus;
import com.axonrh.core.setup.entity.ImportJob.ImportType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ImportJobRepository extends JpaRepository<ImportJob, UUID> {

    Optional<ImportJob> findByTenantIdAndId(UUID tenantId, UUID id);

    List<ImportJob> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<ImportJob> findByTenantIdAndImportType(UUID tenantId, ImportType importType);

    List<ImportJob> findByTenantIdAndStatus(UUID tenantId, ImportStatus status);

    @Query("SELECT j FROM ImportJob j WHERE j.tenantId = :tenantId " +
           "AND j.status = 'PROCESSING' ORDER BY j.startedAt ASC")
    List<ImportJob> findProcessingJobs(@Param("tenantId") UUID tenantId);

    @Query("SELECT j FROM ImportJob j WHERE j.tenantId = :tenantId " +
           "AND j.status = 'COMPLETED' AND j.rollbackAvailable = true " +
           "ORDER BY j.completedAt DESC")
    List<ImportJob> findRollbackableJobs(@Param("tenantId") UUID tenantId);

    @Query("SELECT j.status, COUNT(j) FROM ImportJob j " +
           "WHERE j.tenantId = :tenantId GROUP BY j.status")
    List<Object[]> countByStatus(@Param("tenantId") UUID tenantId);

    @Query("SELECT SUM(j.successRows) FROM ImportJob j WHERE j.tenantId = :tenantId " +
           "AND j.importType = :type AND j.status = 'COMPLETED'")
    Long countImportedRecords(@Param("tenantId") UUID tenantId, @Param("type") ImportType type);
}
