package com.axonrh.employee.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO para atribuir ou remover gestor de departamento.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignManagerDTO {

    @NotNull(message = "ID do departamento é obrigatório")
    private UUID departmentId;

    /**
     * ID do gestor. Se null, remove o gestor atual.
     */
    private UUID managerId;
}
