package com.axonrh.integration.accounting.repository;

import com.axonrh.integration.accounting.entity.AccountingExport;
import com.axonrh.integration.accounting.entity.AccountingExport.AccountingSystem;
import com.axonrh.integration.accounting.entity.AccountingExport.ExportType;
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
public interface AccountingExportRepository extends JpaRepository<AccountingExport, UUID> {

    Optional<AccountingExport> findByTenantIdAndId(UUID tenantId, UUID id);

    Page<AccountingExport> findByTenantId(UUID tenantId, Pageable pageable);

    List<AccountingExport> findByTenantIdAndExportType(UUID tenantId, ExportType exportType);

    List<AccountingExport> findByTenantIdAndAccountingSystem(UUID tenantId, AccountingSystem system);

    @Query("SELECT e FROM AccountingExport e WHERE e.tenantId = :tenantId " +
           "AND e.referenceMonth = :referenceMonth")
    List<AccountingExport> findByReferenceMonth(@Param("tenantId") UUID tenantId,
                                                @Param("referenceMonth") LocalDate referenceMonth);

    @Query("SELECT e FROM AccountingExport e WHERE e.tenantId = :tenantId " +
           "AND e.referenceMonth BETWEEN :startMonth AND :endMonth")
    List<AccountingExport> findByPeriod(@Param("tenantId") UUID tenantId,
                                        @Param("startMonth") LocalDate startMonth,
                                        @Param("endMonth") LocalDate endMonth);

    @Query("SELECT e.exportType, COUNT(e) FROM AccountingExport e " +
           "WHERE e.tenantId = :tenantId GROUP BY e.exportType")
    List<Object[]> countByExportType(@Param("tenantId") UUID tenantId);
}
