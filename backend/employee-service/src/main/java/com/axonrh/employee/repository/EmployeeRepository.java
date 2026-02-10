package com.axonrh.employee.repository;

import com.axonrh.employee.entity.Employee;
import com.axonrh.employee.entity.enums.EmployeeStatus;
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

/**
 * Repositorio de colaboradores.
 */
@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID>, JpaSpecificationExecutor<Employee> {

    // ==================== Busca por Tenant ====================
    List<Employee> findByTenantId(UUID tenantId);

    Page<Employee> findByTenantIdAndIsActiveTrue(UUID tenantId, Pageable pageable);

    Page<Employee> findByTenantIdAndStatus(UUID tenantId, EmployeeStatus status, Pageable pageable);

    List<Employee> findByTenantIdAndIsActiveTrue(UUID tenantId);

    // ==================== Busca por Identificadores ====================

    Optional<Employee> findByTenantIdAndId(UUID tenantId, UUID id);

    Optional<Employee> findByTenantIdAndCpf(UUID tenantId, String cpf);

    Optional<Employee> findByTenantIdAndEmail(UUID tenantId, String email);

    Optional<Employee> findByTenantIdAndRegistrationNumber(UUID tenantId, String registrationNumber);

    Optional<Employee> findByTenantIdAndUserId(UUID tenantId, UUID userId);

    // ==================== Verificacoes de Existencia ====================

    boolean existsByTenantIdAndCpf(UUID tenantId, String cpf);

    boolean existsByTenantIdAndEmail(UUID tenantId, String email);

    boolean existsByTenantIdAndRegistrationNumber(UUID tenantId, String registrationNumber);

    // ==================== Busca por Departamento/Cargo ====================

    Page<Employee> findByTenantIdAndDepartmentIdAndIsActiveTrue(
            UUID tenantId, UUID departmentId, Pageable pageable);

    Page<Employee> findByTenantIdAndPositionIdAndIsActiveTrue(
            UUID tenantId, UUID positionId, Pageable pageable);

    List<Employee> findByTenantIdAndManagerIdAndIsActiveTrue(UUID tenantId, UUID managerId);

    @Query("SELECT e FROM Employee e WHERE e.tenantId = :tenantId AND e.isActive = true " +
           "AND (e.manager.id = :managerId OR e.department.id IN (SELECT d.id FROM Department d WHERE d.tenantId = :tenantId AND d.managerId = :managerId))")
    List<Employee> findByManagementSpan(@Param("tenantId") UUID tenantId, @Param("managerId") UUID managerId);

    // ==================== Busca por Nome ====================

    @Query("SELECT e FROM Employee e WHERE e.tenantId = :tenantId AND e.isActive = true " +
            "AND (LOWER(e.fullName) LIKE LOWER(CONCAT('%', :name, '%')) " +
            "OR LOWER(e.socialName) LIKE LOWER(CONCAT('%', :name, '%')))")
    Page<Employee> searchByName(@Param("tenantId") UUID tenantId,
                                 @Param("name") String name,
                                 Pageable pageable);

    // ==================== Busca por Data ====================

    List<Employee> findByTenantIdAndHireDateBetween(UUID tenantId, LocalDate start, LocalDate end);

    @Query("SELECT e FROM Employee e WHERE e.tenantId = :tenantId " +
            "AND MONTH(e.birthDate) = :month AND DAY(e.birthDate) = :day AND e.isActive = true")
    List<Employee> findByBirthday(@Param("tenantId") UUID tenantId,
                                   @Param("month") int month,
                                   @Param("day") int day);

    // ==================== Contagens ====================

    long countByTenantIdAndIsActiveTrue(UUID tenantId);

    long countByTenantIdAndStatus(UUID tenantId, EmployeeStatus status);

    long countByTenantIdAndDepartmentIdAndIsActiveTrue(UUID tenantId, UUID departmentId);

    // ==================== Queries Especiais ====================

    @Query("SELECT e FROM Employee e WHERE e.tenantId = :tenantId " +
            "AND e.terminationDate IS NULL AND e.isActive = true " +
            "ORDER BY e.fullName")
    List<Employee> findAllActiveOrderByName(@Param("tenantId") UUID tenantId);

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.department LEFT JOIN FETCH e.position " +
            "WHERE e.tenantId = :tenantId AND e.id = :id")
    Optional<Employee> findByIdWithRelations(@Param("tenantId") UUID tenantId, @Param("id") UUID id);

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.department LEFT JOIN FETCH e.position " +
            "LEFT JOIN FETCH e.costCenter LEFT JOIN FETCH e.manager " +
            "WHERE e.tenantId = :tenantId AND e.userId = :userId")
    Optional<Employee> findByUserIdWithRelations(@Param("tenantId") UUID tenantId, @Param("userId") UUID userId);

    @Query("SELECT DISTINCT e.addressCity FROM Employee e WHERE e.tenantId = :tenantId AND e.addressCity IS NOT NULL")
    List<String> findDistinctCities(@Param("tenantId") UUID tenantId);

    @Query("SELECT e FROM Employee e WHERE e.tenantId = :tenantId AND e.manager IS NULL AND e.isActive = true")
    List<Employee> findTopLevelEmployees(@Param("tenantId") UUID tenantId);
}
