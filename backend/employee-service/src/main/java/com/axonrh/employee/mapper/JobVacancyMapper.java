package com.axonrh.employee.mapper;

import com.axonrh.employee.dto.JobVacancyRequest;
import com.axonrh.employee.dto.JobVacancyResponse;
import com.axonrh.employee.dto.PublicVacancyResponse;
import com.axonrh.employee.entity.JobVacancy;
import com.axonrh.employee.entity.Position;
import com.axonrh.employee.entity.enums.VacancyStatus;
import com.axonrh.employee.entity.enums.VacancyType;
import org.springframework.stereotype.Component;

/**
 * Mapper para conversão entre entidade JobVacancy e DTOs.
 */
@Component
public class JobVacancyMapper {

    /**
     * Converte request para entidade
     */
    public JobVacancy toEntity(JobVacancyRequest request, Position position) {
        return JobVacancy.builder()
                .position(position)
                .title(request.getTitle())
                .description(request.getDescription())
                .responsibilities(request.getResponsibilities())
                .requirements(request.getRequirements())
                .benefits(request.getBenefits())
                .vacancyType(request.getVacancyType() != null ? request.getVacancyType() : VacancyType.EXTERNAL)
                .employmentType(request.getEmploymentType())
                .workRegime(request.getWorkRegime())
                .location(request.getLocation())
                .salaryRangeMin(request.getSalaryRangeMin())
                .salaryRangeMax(request.getSalaryRangeMax())
                .hideSalary(request.getHideSalary() != null ? request.getHideSalary() : false)
                .maxCandidates(request.getMaxCandidates() != null ? request.getMaxCandidates() : 0)
                .deadline(request.getDeadline())
                .status(VacancyStatus.DRAFT)
                .aiAnalysisEnabled(request.getAiAnalysisEnabled() != null ? request.getAiAnalysisEnabled() : true)
                .isActive(true)
                .build();
    }

    /**
     * Atualiza entidade com dados do request
     */
    public void updateEntity(JobVacancy vacancy, JobVacancyRequest request, Position position) {
        vacancy.setPosition(position);
        vacancy.setTitle(request.getTitle());
        vacancy.setDescription(request.getDescription());
        vacancy.setResponsibilities(request.getResponsibilities());
        vacancy.setRequirements(request.getRequirements());
        vacancy.setBenefits(request.getBenefits());
        if (request.getVacancyType() != null) {
            vacancy.setVacancyType(request.getVacancyType());
        }
        vacancy.setEmploymentType(request.getEmploymentType());
        vacancy.setWorkRegime(request.getWorkRegime());
        vacancy.setLocation(request.getLocation());
        vacancy.setSalaryRangeMin(request.getSalaryRangeMin());
        vacancy.setSalaryRangeMax(request.getSalaryRangeMax());
        if (request.getHideSalary() != null) {
            vacancy.setHideSalary(request.getHideSalary());
        }
        if (request.getMaxCandidates() != null) {
            vacancy.setMaxCandidates(request.getMaxCandidates());
        }
        if (request.getAiAnalysisEnabled() != null) {
            vacancy.setAiAnalysisEnabled(request.getAiAnalysisEnabled());
        }
        vacancy.setDeadline(request.getDeadline());
    }

    /**
     * Converte entidade para response
     */
    public JobVacancyResponse toResponse(JobVacancy vacancy) {
        return JobVacancyResponse.builder()
                .id(vacancy.getId())
                .positionId(vacancy.getPosition() != null ? vacancy.getPosition().getId() : null)
                .positionCode(vacancy.getPosition() != null ? vacancy.getPosition().getCode() : null)
                .positionTitle(vacancy.getPosition() != null ? vacancy.getPosition().getTitle() : null)
                .departmentName(vacancy.getPosition() != null && vacancy.getPosition().getDepartment() != null
                        ? vacancy.getPosition().getDepartment().getName() : null)
                .title(vacancy.getTitle())
                .description(vacancy.getDescription())
                .responsibilities(vacancy.getResponsibilities())
                .requirements(vacancy.getRequirements())
                .benefits(vacancy.getBenefits())
                .vacancyType(vacancy.getVacancyType())
                .employmentType(vacancy.getEmploymentType())
                .workRegime(vacancy.getWorkRegime())
                .location(vacancy.getLocation())
                .salaryRangeMin(vacancy.getSalaryRangeMin())
                .salaryRangeMax(vacancy.getSalaryRangeMax())
                .hideSalary(vacancy.getHideSalary())
                .maxCandidates(vacancy.getMaxCandidates())
                .deadline(vacancy.getDeadline())
                .status(vacancy.getStatus())
                .publishedAt(vacancy.getPublishedAt())
                .closedAt(vacancy.getClosedAt())
                .publicCode(vacancy.getPublicCode())
                .candidateCount(0)
                .isActive(vacancy.getIsActive())
                .aiAnalysisEnabled(vacancy.getAiAnalysisEnabled())
                .createdAt(vacancy.getCreatedAt())
                .updatedAt(vacancy.getUpdatedAt())
                .build();
    }

    /**
     * Converte entidade para response público (sem dados sensíveis)
     */
    public PublicVacancyResponse toPublicResponse(JobVacancy vacancy, String companyName, String companyLogo) {
        PublicVacancyResponse.PublicVacancyResponseBuilder builder = PublicVacancyResponse.builder()
                .id(vacancy.getId())
                .publicCode(vacancy.getPublicCode())
                .title(vacancy.getTitle())
                .positionTitle(vacancy.getPosition() != null ? vacancy.getPosition().getTitle() : null)
                .departmentName(vacancy.getPosition() != null && vacancy.getPosition().getDepartment() != null
                        ? vacancy.getPosition().getDepartment().getName() : null)
                .description(vacancy.getDescription())
                .responsibilities(vacancy.getResponsibilities())
                .requirements(vacancy.getRequirements())
                .benefits(vacancy.getBenefits())
                .employmentType(vacancy.getEmploymentType())
                .workRegime(vacancy.getWorkRegime())
                .location(vacancy.getLocation())
                .deadline(vacancy.getDeadline())
                .publishedAt(vacancy.getPublishedAt())
                .companyName(companyName)
                .companyLogo(companyLogo);

        // Só inclui salário se não estiver oculto
        if (vacancy.getHideSalary() == null || !vacancy.getHideSalary()) {
            builder.salaryRangeMin(vacancy.getSalaryRangeMin());
            builder.salaryRangeMax(vacancy.getSalaryRangeMax());
        }

        return builder.build();
    }
}
