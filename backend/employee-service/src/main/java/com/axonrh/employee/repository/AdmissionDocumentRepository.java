package com.axonrh.employee.repository;

import com.axonrh.employee.entity.AdmissionDocument;
import com.axonrh.employee.entity.enums.DocumentValidationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for AdmissionDocument entity.
 */
@Repository
public interface AdmissionDocumentRepository extends JpaRepository<AdmissionDocument, UUID> {

    List<AdmissionDocument> findByAdmissionProcessId(UUID processId);

    Optional<AdmissionDocument> findByAdmissionProcessIdAndDocumentType(UUID processId, String documentType);

    List<AdmissionDocument> findByAdmissionProcessIdAndValidationStatus(UUID processId, DocumentValidationStatus status);

    @Query("SELECT d FROM AdmissionDocument d WHERE d.admissionProcess.id = :processId ORDER BY d.createdAt DESC")
    List<AdmissionDocument> findByProcessIdOrderByCreatedAtDesc(UUID processId);

    long countByAdmissionProcessIdAndValidationStatus(UUID processId, DocumentValidationStatus status);

    boolean existsByAdmissionProcessIdAndDocumentType(UUID processId, String documentType);
}
