package com.axonrh.integration.certificate.repository;

import com.axonrh.integration.certificate.entity.DigitalCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DigitalCertificateRepository extends JpaRepository<DigitalCertificate, UUID> {

    Optional<DigitalCertificate> findByTenantIdAndId(UUID tenantId, UUID id);

    List<DigitalCertificate> findByTenantId(UUID tenantId);

    @Query("SELECT c FROM DigitalCertificate c WHERE c.tenantId = :tenantId " +
           "AND c.isActive = true AND c.validUntil > CURRENT_DATE " +
           "ORDER BY c.validUntil DESC")
    Optional<DigitalCertificate> findActiveCertificate(@Param("tenantId") UUID tenantId);

    @Query("SELECT c FROM DigitalCertificate c WHERE c.tenantId = :tenantId " +
           "AND c.isActive = true AND c.validUntil > CURRENT_DATE")
    List<DigitalCertificate> findAllActiveCertificates(@Param("tenantId") UUID tenantId);

    @Query("SELECT c FROM DigitalCertificate c WHERE c.isActive = true " +
           "AND c.validUntil BETWEEN CURRENT_DATE AND :expirationDate")
    List<DigitalCertificate> findExpiringCertificates(@Param("expirationDate") LocalDate expirationDate);

    @Query("SELECT c FROM DigitalCertificate c WHERE c.isActive = true " +
           "AND c.validUntil < CURRENT_DATE")
    List<DigitalCertificate> findExpiredCertificates();
}
