package com.axonrh.employee.mapper;

import com.axonrh.employee.dto.PublicCandidateApplicationRequest;
import com.axonrh.employee.dto.TalentCandidateRequest;
import com.axonrh.employee.dto.TalentCandidateResponse;
import com.axonrh.employee.entity.JobVacancy;
import com.axonrh.employee.entity.TalentCandidate;
import com.axonrh.employee.entity.enums.CandidateSource;
import com.axonrh.employee.entity.enums.CandidateStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Mapper para conversão entre entidade TalentCandidate e DTOs.
 */
@Component
public class TalentCandidateMapper {

    /**
     * Converte request para entidade
     */
    public TalentCandidate toEntity(TalentCandidateRequest request, JobVacancy vacancy) {
        return TalentCandidate.builder()
                .vacancy(vacancy)
                .fullName(request.getFullName())
                .email(request.getEmail().toLowerCase().trim())
                .phone(request.getPhone())
                .mobile(request.getMobile())
                .city(request.getCity())
                .state(request.getState() != null ? request.getState().toUpperCase() : null)
                .linkedinUrl(request.getLinkedinUrl())
                .portfolioUrl(request.getPortfolioUrl())
                .source(request.getSource() != null ? request.getSource() : CandidateSource.WEBSITE)
                .referralName(request.getReferralName())
                .status(CandidateStatus.NEW)
                .appliedAt(LocalDateTime.now())
                .isActive(true)
                .build();
    }

    /**
     * Converte request público para entidade
     */
    public TalentCandidate toEntity(PublicCandidateApplicationRequest request, JobVacancy vacancy) {
        return TalentCandidate.builder()
                .vacancy(vacancy)
                .fullName(request.getFullName())
                .email(request.getEmail().toLowerCase().trim())
                .phone(request.getPhone())
                .mobile(request.getPhone()) // Usa phone como mobile também
                .city(request.getCity())
                .state(request.getState() != null ? request.getState().toUpperCase() : null)
                .linkedinUrl(request.getLinkedinUrl())
                .portfolioUrl(request.getPortfolioUrl())
                .source(CandidateSource.WEBSITE)
                .status(CandidateStatus.NEW)
                .appliedAt(LocalDateTime.now())
                .isActive(true)
                .build();
    }

    /**
     * Atualiza entidade com dados do request
     */
    public void updateEntity(TalentCandidate candidate, TalentCandidateRequest request) {
        candidate.setFullName(request.getFullName());
        candidate.setEmail(request.getEmail().toLowerCase().trim());
        candidate.setPhone(request.getPhone());
        candidate.setMobile(request.getMobile());
        candidate.setCity(request.getCity());
        candidate.setState(request.getState() != null ? request.getState().toUpperCase() : null);
        candidate.setLinkedinUrl(request.getLinkedinUrl());
        candidate.setPortfolioUrl(request.getPortfolioUrl());
        if (request.getSource() != null) {
            candidate.setSource(request.getSource());
        }
        candidate.setReferralName(request.getReferralName());
    }

    /**
     * Converte entidade para response
     */
    public TalentCandidateResponse toResponse(TalentCandidate candidate) {
        return TalentCandidateResponse.builder()
                .id(candidate.getId())
                .vacancyId(candidate.getVacancy() != null ? candidate.getVacancy().getId() : null)
                .vacancyTitle(candidate.getVacancy() != null ? candidate.getVacancy().getTitle() : null)
                .fullName(candidate.getFullName())
                .email(candidate.getEmail())
                .phone(candidate.getPhone())
                .mobile(candidate.getMobile())
                .city(candidate.getCity())
                .state(candidate.getState())
                .linkedinUrl(candidate.getLinkedinUrl())
                .portfolioUrl(candidate.getPortfolioUrl())
                .resumeFileName(candidate.getResumeFileName())
                .resumeFilePath(candidate.getResumeFilePath())
                .resumeFileType(candidate.getResumeFileType())
                .resumeParsedData(candidate.getResumeParsedData())
                .skills(candidate.getSkills())
                .education(candidate.getEducation())
                .experienceSummary(candidate.getExperienceSummary())
                .certifications(candidate.getCertifications())
                .languages(candidate.getLanguages())
                .status(candidate.getStatus())
                .statusNotes(candidate.getStatusNotes())
                .rating(candidate.getRating())
                .notes(candidate.getNotes())
                .source(candidate.getSource())
                .referralName(candidate.getReferralName())
                .appliedAt(candidate.getAppliedAt())
                .lastStatusChange(candidate.getLastStatusChange())
                .isActive(candidate.getIsActive())
                .createdAt(candidate.getCreatedAt())
                .updatedAt(candidate.getUpdatedAt())
                .build();
    }
}
