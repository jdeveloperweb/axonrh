package com.axonrh.employee.repository;

import com.axonrh.employee.entity.JobVacancy;
import com.axonrh.employee.entity.enums.VacancyStatus;
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
public interface JobVacancyRepository extends JpaRepository<JobVacancy, UUID> {

    // Buscar por tenant e ID com pre-fetch
    @Query("SELECT v FROM JobVacancy v LEFT JOIN FETCH v.position p LEFT JOIN FETCH p.department WHERE v.tenantId = :tenantId AND v.id = :id")
    Optional<JobVacancy> findByTenantIdAndId(@Param("tenantId") UUID tenantId, @Param("id") UUID id);

    // Buscar por código público (sem tenant - acesso público)
    Optional<JobVacancy> findByPublicCodeAndStatus(String publicCode, VacancyStatus status);

    // Buscar por código público
    Optional<JobVacancy> findByPublicCode(String publicCode);

    // Verificar existência do código público
    boolean existsByPublicCode(String publicCode);

    // Listar vagas ativas do tenant com pre-fetch
    @Query("SELECT v FROM JobVacancy v LEFT JOIN FETCH v.position p LEFT JOIN FETCH p.department " +
           "WHERE v.tenantId = :tenantId AND v.isActive = true ORDER BY v.createdAt DESC")
    List<JobVacancy> findByTenantIdAndIsActiveTrueOrderByCreatedAtDesc(@Param("tenantId") UUID tenantId);

    // Listar vagas por status
    List<JobVacancy> findByTenantIdAndStatusAndIsActiveTrueOrderByCreatedAtDesc(UUID tenantId, VacancyStatus status);

    // Listar vagas paginadas
    Page<JobVacancy> findByTenantIdAndIsActiveTrue(UUID tenantId, Pageable pageable);

    // Listar vagas por status paginadas
    Page<JobVacancy> findByTenantIdAndStatusAndIsActiveTrue(UUID tenantId, VacancyStatus status, Pageable pageable);

    // Listar vagas por cargo
    List<JobVacancy> findByTenantIdAndPositionIdAndIsActiveTrue(UUID tenantId, UUID positionId);

    // Contar vagas por status
    long countByTenantIdAndStatusAndIsActiveTrue(UUID tenantId, VacancyStatus status);

    // Contar todas vagas ativas
    long countByTenantIdAndIsActiveTrue(UUID tenantId);

    // Buscar vagas abertas (para página pública)
    @Query("SELECT v FROM JobVacancy v WHERE v.status = 'OPEN' AND v.isActive = true " +
           "AND (v.deadline IS NULL OR v.deadline >= CURRENT_DATE) ORDER BY v.publishedAt DESC")
    List<JobVacancy> findAllOpenVacancies();

    // Buscar vagas abertas por tenant
    @Query("SELECT v FROM JobVacancy v WHERE v.tenantId = :tenantId AND v.status = 'OPEN' AND v.isActive = true " +
           "AND (v.deadline IS NULL OR v.deadline >= CURRENT_DATE) ORDER BY v.publishedAt DESC")
    List<JobVacancy> findOpenVacanciesByTenant(@Param("tenantId") UUID tenantId);

    // Verificar se há vaga aberta para o cargo
    boolean existsByTenantIdAndPositionIdAndStatusAndIsActiveTrue(UUID tenantId, UUID positionId, VacancyStatus status);

    // Estatísticas - contar por status
    @Query("SELECT v.status, COUNT(v) FROM JobVacancy v WHERE v.tenantId = :tenantId AND v.isActive = true GROUP BY v.status")
    List<Object[]> countByStatusGrouped(@Param("tenantId") UUID tenantId);
}
