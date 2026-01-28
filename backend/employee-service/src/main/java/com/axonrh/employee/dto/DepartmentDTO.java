package com.axonrh.employee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO para retorno de dados de departamento.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentDTO {

    private UUID id;
    private String code;
    private String name;
    private String description;
    private Boolean isActive;
    
    // Departamento pai
    private ParentDepartmentDTO parent;
    
    // Gestor
    private ManagerBasicDTO manager;
    
    // Centro de custo
    private CostCenterBasicDTO costCenter;
    
    // Contadores
    private Long employeeCount;
    private Long subdepartmentCount;
    
    // Auditoria
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
    private UUID updatedBy;
    
    /**
     * DTO simplificado para departamento pai.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParentDepartmentDTO {
        private UUID id;
        private String code;
        private String name;
    }
    
    /**
     * DTO simplificado para gestor.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ManagerBasicDTO {
        private UUID id;
        private String registrationNumber;
        private String fullName;
        private String email;
        private String positionName;
    }
    
    /**
     * DTO simplificado para centro de custo.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CostCenterBasicDTO {
        private UUID id;
        private String code;
        private String name;
    }
}
