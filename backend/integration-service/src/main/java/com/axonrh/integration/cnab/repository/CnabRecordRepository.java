package com.axonrh.integration.cnab.repository;

import com.axonrh.integration.cnab.entity.CnabRecord;
import com.axonrh.integration.cnab.entity.CnabRecord.RecordStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CnabRecordRepository extends JpaRepository<CnabRecord, UUID> {

    Optional<CnabRecord> findByTenantIdAndId(UUID tenantId, UUID id);

    List<CnabRecord> findByTenantIdAndCnabFileId(UUID tenantId, UUID cnabFileId);

    @Query("SELECT r FROM CnabRecord r WHERE r.cnabFile.id = :fileId " +
           "AND r.employeeCpf = :cpf AND r.recordType = 'DETALHE'")
    Optional<CnabRecord> findByFileAndCpf(@Param("fileId") UUID fileId,
                                          @Param("cpf") String cpf);

    List<CnabRecord> findByTenantIdAndEmployeeId(UUID tenantId, UUID employeeId);

    @Query("SELECT r FROM CnabRecord r WHERE r.tenantId = :tenantId " +
           "AND r.status = :status AND r.recordType = 'DETALHE'")
    List<CnabRecord> findByStatus(@Param("tenantId") UUID tenantId,
                                  @Param("status") RecordStatus status);

    @Query("SELECT r.status, COUNT(r) FROM CnabRecord r " +
           "WHERE r.cnabFile.id = :fileId AND r.recordType = 'DETALHE' " +
           "GROUP BY r.status")
    List<Object[]> countByStatusForFile(@Param("fileId") UUID fileId);

    @Query("SELECT SUM(r.amount) FROM CnabRecord r WHERE r.cnabFile.id = :fileId " +
           "AND r.recordType = 'DETALHE' AND r.status = 'PROCESSED'")
    java.math.BigDecimal sumProcessedAmountForFile(@Param("fileId") UUID fileId);

    long countByTenantIdAndCnabFileIdAndStatus(UUID tenantId, UUID cnabFileId, RecordStatus status);
}
