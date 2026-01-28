package com.axonrh.employee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTO para informações de gestor.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagerDTO {

    private UUID id;
    private String registrationNumber;
    private String fullName;
    private String email;
    private String positionName;
    private String departmentName;
    
    // Departamentos gerenciados
    private List<ManagedDepartmentDTO> managedDepartments;
    
    // Estatísticas
    private Long totalSubordinates;
    private Long totalManagedDepartments;
    
    /**
     * DTO simplificado para departamento gerenciado.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ManagedDepartmentDTO {
        private UUID id;
        private String code;
        private String name;
        private Long employeeCount;
    }
}
