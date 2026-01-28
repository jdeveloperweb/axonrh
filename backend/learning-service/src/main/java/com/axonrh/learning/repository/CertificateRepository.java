package com.axonrh.learning.repository;

import com.axonrh.learning.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, UUID> {

    Optional<Certificate> findByTenantIdAndId(UUID tenantId, UUID id);

    List<Certificate> findByTenantIdAndEmployeeId(UUID tenantId, UUID employeeId);

    Optional<Certificate> findByVerificationCode(String verificationCode);

    boolean existsByVerificationCode(String verificationCode);
}
