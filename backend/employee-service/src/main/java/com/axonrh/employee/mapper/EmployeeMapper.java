package com.axonrh.employee.mapper;

import com.axonrh.employee.dto.EmployeeDependentRequest;
import com.axonrh.employee.dto.EmployeeRequest;
import com.axonrh.employee.dto.EmployeeResponse;
import com.axonrh.employee.entity.*;
import org.mapstruct.*;

import java.time.LocalDate;
import java.time.Period;

/**
 * Mapper para conversao entre Employee e DTOs.
 */
@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface EmployeeMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "department", ignore = true)
    @Mapping(target = "position", ignore = true)
    @Mapping(target = "costCenter", ignore = true)
    @Mapping(target = "manager", ignore = true)
    @Mapping(target = "dependents", ignore = true)
    @Mapping(target = "documents", ignore = true)
    @Mapping(target = "status", constant = "ACTIVE")
    @Mapping(target = "isActive", constant = "true")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "terminationDate", ignore = true)
    @Mapping(target = "photoUrl", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "race", ignore = true)
    Employee toEntity(EmployeeRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "department", ignore = true)
    @Mapping(target = "position", ignore = true)
    @Mapping(target = "costCenter", ignore = true)
    @Mapping(target = "manager", ignore = true)
    @Mapping(target = "dependents", ignore = true)
    @Mapping(target = "documents", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "terminationDate", ignore = true)
    @Mapping(target = "photoUrl", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "race", ignore = true)
    void updateEntity(@MappingTarget Employee employee, EmployeeRequest request);

    @Mapping(target = "displayName", expression = "java(employee.getDisplayName())")
    @Mapping(target = "age", expression = "java(calculateAge(employee.getBirthDate()))")
    @Mapping(target = "yearsOfService", expression = "java(calculateYearsOfService(employee.getHireDate(), employee.getTerminationDate()))")
    @Mapping(target = "address", expression = "java(mapAddress(employee))")
    @Mapping(target = "department", source = "department")
    @Mapping(target = "position", source = "position")
    @Mapping(target = "costCenter", source = "costCenter")
    @Mapping(target = "manager", source = "manager")
    @Mapping(target = "dependents", source = "dependents")
    @Mapping(target = "documentCount", expression = "java(employee.getDocuments() != null ? employee.getDocuments().size() : 0)")
    EmployeeResponse toResponse(Employee employee);

    // ==================== Mapeamentos de Relacionamentos ====================

    @Mapping(target = "name", source = "fullName")
    EmployeeResponse.EmployeeSummary toEmployeeSummary(Employee employee);

    EmployeeResponse.DepartmentSummary toDepartmentSummary(Department department);

    @Mapping(target = "title", source = "title")
    EmployeeResponse.PositionSummary toPositionSummary(Position position);

    EmployeeResponse.CostCenterSummary toCostCenterSummary(CostCenter costCenter);

    @Mapping(target = "name", source = "fullName")
    @Mapping(target = "relationship", expression = "java(dependent.getRelationship().name())")
    @Mapping(target = "isIRDependent", source = "isIrDependent")
    EmployeeResponse.DependentSummary toDependentSummary(EmployeeDependent dependent);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "employee", ignore = true)
    @Mapping(target = "fullName", source = "name")
    @Mapping(target = "isIrDependent", source = "isIRDependent")
    @Mapping(target = "isActive", constant = "true")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    EmployeeDependent toEntity(EmployeeDependentRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "employee", ignore = true)
    @Mapping(target = "fullName", source = "name")
    @Mapping(target = "isIrDependent", source = "isIRDependent")
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    void updateEntity(@MappingTarget EmployeeDependent dependent, EmployeeDependentRequest request);

    // ==================== Metodos Auxiliares ====================

    default Integer calculateAge(LocalDate birthDate) {
        if (birthDate == null) return null;
        return Period.between(birthDate, LocalDate.now()).getYears();
    }

    default Integer calculateYearsOfService(LocalDate hireDate, LocalDate terminationDate) {
        if (hireDate == null) return null;
        LocalDate endDate = terminationDate != null ? terminationDate : LocalDate.now();
        return Period.between(hireDate, endDate).getYears();
    }

    default EmployeeResponse.AddressDto mapAddress(Employee employee) {
        if (employee.getAddressStreet() == null) return null;

        String fullAddress = String.format("%s, %s%s - %s, %s - %s, %s",
                employee.getAddressStreet(),
                employee.getAddressNumber() != null ? employee.getAddressNumber() : "S/N",
                employee.getAddressComplement() != null ? " - " + employee.getAddressComplement() : "",
                employee.getAddressNeighborhood() != null ? employee.getAddressNeighborhood() : "",
                employee.getAddressCity() != null ? employee.getAddressCity() : "",
                employee.getAddressState() != null ? employee.getAddressState() : "",
                employee.getAddressZipCode() != null ? employee.getAddressZipCode() : ""
        );

        return EmployeeResponse.AddressDto.builder()
                .street(employee.getAddressStreet())
                .number(employee.getAddressNumber())
                .complement(employee.getAddressComplement())
                .neighborhood(employee.getAddressNeighborhood())
                .city(employee.getAddressCity())
                .state(employee.getAddressState())
                .zipCode(employee.getAddressZipCode())
                .country(employee.getAddressCountry())
                .fullAddress(fullAddress)
                .build();
    }
}
