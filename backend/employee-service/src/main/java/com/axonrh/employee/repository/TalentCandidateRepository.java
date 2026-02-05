package com.axonrh.employee.repository;

import com.axonrh.employee.entity.TalentCandidate;
import com.axonrh.employee.entity.enums.CandidateStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TalentCandidateRepository extends JpaRepository<TalentCandidate, UUID> {

    // Buscar por tenant e ID
    Optional<TalentCandidate> findByTenantIdAndId(UUID tenantId, UUID id);

    // Verificar se já existe candidato com email na vaga
    boolean existsByEmailAndVacancyId(String email, UUID vacancyId);

    // Buscar candidato por email e vaga
    Optional<TalentCandidate> findByEmailAndVacancyId(String email, UUID vacancyId);

    // Listar candidatos por vaga
    List<TalentCandidate> findByVacancyIdAndIsActiveTrueOrderByAppliedAtDesc(UUID vacancyId);

    // Listar candidatos por vaga paginado
    Page<TalentCandidate> findByVacancyIdAndIsActiveTrue(UUID vacancyId, Pageable pageable);

    // Listar candidatos por tenant
    List<TalentCandidate> findByTenantIdAndIsActiveTrueOrderByAppliedAtDesc(UUID tenantId);

    // Listar candidatos por tenant paginado
    Page<TalentCandidate> findByTenantIdAndIsActiveTrue(UUID tenantId, Pageable pageable);

    // Listar candidatos por status
    List<TalentCandidate> findByTenantIdAndStatusAndIsActiveTrueOrderByAppliedAtDesc(UUID tenantId, CandidateStatus status);

    // Listar candidatos por status paginado
    Page<TalentCandidate> findByTenantIdAndStatusAndIsActiveTrue(UUID tenantId, CandidateStatus status, Pageable pageable);

    // Listar candidatos por vaga e status
    List<TalentCandidate> findByVacancyIdAndStatusAndIsActiveTrueOrderByAppliedAtDesc(UUID vacancyId, CandidateStatus status);

    // Contar candidatos por vaga
    long countByVacancyIdAndIsActiveTrue(UUID vacancyId);

    // Contar candidatos por tenant
    long countByTenantIdAndIsActiveTrue(UUID tenantId);

    // Contar candidatos por status
    long countByTenantIdAndStatusAndIsActiveTrue(UUID tenantId, CandidateStatus status);

    // Contar candidatos por vaga e status
    long countByVacancyIdAndStatusAndIsActiveTrue(UUID vacancyId, CandidateStatus status);

    // Buscar candidatos com rating
    List<TalentCandidate> findByTenantIdAndRatingGreaterThanEqualAndIsActiveTrueOrderByRatingDesc(UUID tenantId, Integer minRating);

    // Buscar candidatos por email (em qualquer vaga)
    List<TalentCandidate> findByTenantIdAndEmailAndIsActiveTrue(UUID tenantId, String email);

    // Buscar candidatos com skills específicas
    @Query("SELECT c FROM TalentCandidate c WHERE c.tenantId = :tenantId AND c.isActive = true " +
           "AND LOWER(c.skills) LIKE LOWER(CONCAT('%', :skill, '%')) ORDER BY c.appliedAt DESC")
    List<TalentCandidate> findBySkillContaining(@Param("tenantId") UUID tenantId, @Param("skill") String skill);

    // Estatísticas - contar por status
    @Query("SELECT c.status, COUNT(c) FROM TalentCandidate c WHERE c.tenantId = :tenantId AND c.isActive = true GROUP BY c.status")
    List<Object[]> countByStatusGrouped(@Param("tenantId") UUID tenantId);

    // Estatísticas - contar por vaga
    @Query("SELECT c.vacancy.title, COUNT(c) FROM TalentCandidate c WHERE c.tenantId = :tenantId AND c.isActive = true GROUP BY c.vacancy.title")
    List<Object[]> countByVacancyGrouped(@Param("tenantId") UUID tenantId);

    // Buscar candidatos recentes
    @Query("SELECT c FROM TalentCandidate c WHERE c.tenantId = :tenantId AND c.isActive = true " +
           "ORDER BY c.appliedAt DESC")
    Page<TalentCandidate> findRecentCandidates(@Param("tenantId") UUID tenantId, Pageable pageable);
}
