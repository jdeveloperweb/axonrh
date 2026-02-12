package com.axonrh.payroll.repository;

import com.axonrh.payroll.entity.TaxBracket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface TaxBracketRepository extends JpaRepository<TaxBracket, UUID> {

    @Query("SELECT t FROM TaxBracket t WHERE t.tenantId = :tenantId AND t.taxType = :taxType " +
           "AND t.isActive = true AND t.effectiveFrom <= :referenceDate " +
           "AND (t.effectiveUntil IS NULL OR t.effectiveUntil >= :referenceDate) " +
           "ORDER BY t.bracketOrder ASC")
    List<TaxBracket> findActiveBrackets(
            @Param("tenantId") UUID tenantId,
            @Param("taxType") String taxType,
            @Param("referenceDate") LocalDate referenceDate);

    List<TaxBracket> findByTenantIdAndTaxTypeAndIsActiveTrueOrderByBracketOrderAsc(
            UUID tenantId, String taxType);

    List<TaxBracket> findByTenantIdAndIsActiveTrueOrderByMinValueAsc(UUID tenantId);
}
