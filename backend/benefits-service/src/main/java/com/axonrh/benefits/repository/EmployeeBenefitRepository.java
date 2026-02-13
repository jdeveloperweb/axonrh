package com.axonrh.benefits.repository;

import com.axonrh.benefits.entity.EmployeeBenefit;
import com.axonrh.benefits.enums.EmployeeBenefitStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeBenefitRepository extends JpaRepository<EmployeeBenefit, UUID>, JpaSpecificationExecutor<EmployeeBenefit> {

    Page<EmployeeBenefit> findByTenantId(UUID tenantId, Pageable pageable);

    List<EmployeeBenefit> findByTenantIdAndEmployeeId(UUID tenantId, UUID employeeId);

    List<EmployeeBenefit> findByTenantIdAndEmployeeIdAndStatus(UUID tenantId, UUID employeeId, EmployeeBenefitStatus status);

    Optional<EmployeeBenefit> findByTenantIdAndId(UUID tenantId, UUID id);

    @Query("SELECT eb FROM EmployeeBenefit eb JOIN FETCH eb.benefitType " +
           "WHERE eb.tenantId = :tenantId AND eb.employeeId = :employeeId " +
           "AND eb.status = 'ACTIVE' " +
           "AND eb.startDate <= :endDate " +
           "AND (eb.endDate IS NULL OR eb.endDate >= :startDate)")
    List<EmployeeBenefit> findActiveByEmployeeInPeriod(
            @Param("tenantId") UUID tenantId,
            @Param("employeeId") UUID employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT CASE WHEN COUNT(eb) > 0 THEN true ELSE false END " +
           "FROM EmployeeBenefit eb " +
           "WHERE eb.tenantId = :tenantId " +
           "AND eb.employeeId = :employeeId " +
           "AND eb.benefitType.id = :benefitTypeId " +
           "AND eb.status IN ('ACTIVE', 'SCHEDULED') " +
           "AND eb.startDate <= :endDate " +
           "AND (eb.endDate IS NULL OR eb.endDate >= :startDate)")
    boolean existsOverlappingBenefit(
            @Param("tenantId") UUID tenantId,
            @Param("employeeId") UUID employeeId,
            @Param("benefitTypeId") UUID benefitTypeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT CASE WHEN COUNT(eb) > 0 THEN true ELSE false END " +
           "FROM EmployeeBenefit eb " +
           "WHERE eb.tenantId = :tenantId " +
           "AND eb.employeeId = :employeeId " +
           "AND eb.benefitType.id = :benefitTypeId " +
           "AND eb.id != :excludeId " +
           "AND eb.status IN ('ACTIVE', 'SCHEDULED') " +
           "AND eb.startDate <= :endDate " +
           "AND (eb.endDate IS NULL OR eb.endDate >= :startDate)")
    boolean existsOverlappingBenefitExcluding(
            @Param("tenantId") UUID tenantId,
            @Param("employeeId") UUID employeeId,
            @Param("benefitTypeId") UUID benefitTypeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludeId") UUID excludeId);
}
