package com.axonrh.learning.service;

import com.axonrh.learning.entity.Certificate;
import com.axonrh.learning.entity.CertificateConfig;
import com.axonrh.learning.entity.Enrollment;
import com.axonrh.learning.repository.CertificateRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final CertificateConfigService configService;

    public CertificateService(CertificateRepository certificateRepository, CertificateConfigService configService) {
        this.certificateRepository = certificateRepository;
        this.configService = configService;
    }

    public Certificate generate(UUID tenantId, Enrollment enrollment) {
        Certificate certificate = new Certificate();
        certificate.setTenantId(tenantId);
        certificate.setEnrollment(enrollment);
        certificate.setCourseId(enrollment.getCourse().getId());
        certificate.setCourseName(enrollment.getCourse().getTitle());
        certificate.setEmployeeId(enrollment.getEmployeeId());
        certificate.setEmployeeName(enrollment.getEmployeeName());
        
        // Buscar configurações (específica do curso e global)
        CertificateConfig specificConfig = configService.getConfig(tenantId, enrollment.getCourse().getId());
        CertificateConfig globalConfig = configService.getGlobalConfig(tenantId);

        // Fallback campo a campo
        certificate.setInstructorName(getValue(specificConfig.getInstructorName(), globalConfig.getInstructorName()));
        certificate.setInstructorSignatureUrl(getValue(specificConfig.getInstructorSignatureUrl(), globalConfig.getInstructorSignatureUrl()));
        certificate.setGeneralSignerName(getValue(specificConfig.getGeneralSignerName(), globalConfig.getGeneralSignerName()));
        certificate.setGeneralSignatureUrl(getValue(specificConfig.getGeneralSignatureUrl(), globalConfig.getGeneralSignatureUrl()));
        certificate.setCompanyLogoUrl(getValue(specificConfig.getCompanyLogoUrl(), globalConfig.getCompanyLogoUrl()));

        // Generate a simple unique code
        String uniqueCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        certificate.setVerificationCode(uniqueCode);
        certificate.setCertificateNumber("CERT-" + uniqueCode);
        
        certificate.setIssuedAt(LocalDateTime.now());
        certificate.setFinalScore(enrollment.getFinalScore());
        
        // Calculate duration in hours
        int durationMinutes = enrollment.getCourse().getDurationMinutes() != null ? enrollment.getCourse().getDurationMinutes() : 0;
        certificate.setDurationHours(durationMinutes / 60);

        certificate = certificateRepository.save(certificate);
        
        // Mock PDF URL using the generated ID
        certificate.setPdfUrl("/api/v1/learning/certificates/" + certificate.getId() + "/download");

        return certificateRepository.save(certificate);
    }

    public Certificate get(UUID tenantId, UUID certificateId) {
        return certificateRepository.findByTenantIdAndId(tenantId, certificateId)
                .orElseThrow(() -> new EntityNotFoundException("Certificado nao encontrado"));
    }

    public List<Certificate> listByEmployee(UUID tenantId, UUID employeeId) {
        return certificateRepository.findByTenantIdAndEmployeeId(tenantId, employeeId);
    }

    public Certificate verify(String code) {
        return certificateRepository.findByVerificationCode(code)
                .orElseThrow(() -> new EntityNotFoundException("Certificado invalido ou nao encontrado"));
    }

    private String getValue(String specific, String global) {
        return (specific != null && !specific.trim().isEmpty()) ? specific : global;
    }
}
