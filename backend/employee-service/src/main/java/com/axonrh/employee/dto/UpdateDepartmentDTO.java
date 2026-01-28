package com.axonrh.employee.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO para atualização de departamento.
 * Todos os campos são opcionais.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDepartmentDTO {

    @Size(max = 20, message = "Código deve ter no máximo 20 caracteres")
    private String code;

    @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
    private String name;

    private String description;

    private UUID parentId;

    private UUID managerId;

    private UUID costCenterId;

    private Boolean isActive;
}
