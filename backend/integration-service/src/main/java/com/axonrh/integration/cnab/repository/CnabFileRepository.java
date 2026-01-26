package com.axonrh.integration.cnab.repository;

import com.axonrh.integration.cnab.entity.CnabFile;
import com.axonrh.integration.cnab.entity.CnabFile.CnabFileStatus;
import com.axonrh.integration.cnab.entity.CnabFile.CnabFileType;
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
public interface CnabFileRepository extends JpaRepository<CnabFile, UUID> {

    Optional<CnabFile> findByTenantIdAndId(UUID tenantId, UUID id);

    Page<CnabFile> findByTenantId(UUID tenantId, Pageable pageable);

    List<CnabFile> findByTenantIdAndFileType(UUID tenantId, CnabFileType fileType);

    List<CnabFile> findByTenantIdAndStatus(UUID tenantId, CnabFileStatus status);

    Optional<CnabFile> findByTenantIdAndSequenceNumber(UUID tenantId, int sequenceNumber);

    @Query("SELECT COALESCE(MAX(f.sequenceNumber), 0) + 1 FROM CnabFile f " +
           "WHERE f.tenantId = :tenantId AND f.bankCode = :bankCode")
    int getNextSequenceNumber(@Param("tenantId") UUID tenantId, @Param("bankCode") String bankCode);

    @Query("SELECT f FROM CnabFile f WHERE f.tenantId = :tenantId " +
           "AND f.referenceDate BETWEEN :startDate AND :endDate")
    List<CnabFile> findByDateRange(@Param("tenantId") UUID tenantId,
                                   @Param("startDate") LocalDate startDate,
                                   @Param("endDate") LocalDate endDate);

    @Query("SELECT f FROM CnabFile f WHERE f.tenantId = :tenantId " +
           "AND f.fileType = 'REMESSA' AND f.status = 'TRANSMITTED'")
    List<CnabFile> findAwaitingReturn(@Param("tenantId") UUID tenantId);

    @Query("SELECT f.status, COUNT(f) FROM CnabFile f " +
           "WHERE f.tenantId = :tenantId GROUP BY f.status")
    List<Object[]> countByStatus(@Param("tenantId") UUID tenantId);

    @Query("SELECT SUM(f.totalAmount) FROM CnabFile f WHERE f.tenantId = :tenantId " +
           "AND f.fileType = 'REMESSA' AND f.status = 'PROCESSED' " +
           "AND f.referenceDate BETWEEN :startDate AND :endDate")
    java.math.BigDecimal sumProcessedAmount(@Param("tenantId") UUID tenantId,
                                            @Param("startDate") LocalDate startDate,
                                            @Param("endDate") LocalDate endDate);
}
