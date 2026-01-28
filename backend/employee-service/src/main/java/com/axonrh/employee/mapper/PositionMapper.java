package com.axonrh.employee.mapper;

import com.axonrh.employee.dto.PositionRequest;
import com.axonrh.employee.dto.PositionResponse;
import com.axonrh.employee.entity.Position;
import org.springframework.stereotype.Component;

@Component
public class PositionMapper {

    public Position toEntity(PositionRequest request) {
        return Position.builder()
                .code(request.getCode())
                .title(request.getTitle())
                .description(request.getDescription())
                .responsibilities(request.getResponsibilities())
                .cboCode(request.getCboCode())
                .salaryRangeMin(request.getSalaryRangeMin())
                .salaryRangeMax(request.getSalaryRangeMax())
                .level(request.getLevel())
                .build();
    }

    public PositionResponse toResponse(Position position) {
        return PositionResponse.builder()
                .id(position.getId())
                .code(position.getCode())
                .title(position.getTitle())
                .description(position.getDescription())
                .responsibilities(position.getResponsibilities())
                .cboCode(position.getCboCode())
                .salaryRangeMin(position.getSalaryRangeMin())
                .salaryRangeMax(position.getSalaryRangeMax())
                .level(position.getLevel())
                .departmentId(position.getDepartment() != null ? position.getDepartment().getId() : null)
                .departmentName(position.getDepartment() != null ? position.getDepartment().getName() : null)
                .isActive(position.getIsActive())
                .createdAt(position.getCreatedAt())
                .updatedAt(position.getUpdatedAt())
                .build();
    }

    public void updateEntity(Position position, PositionRequest request) {
        position.setCode(request.getCode());
        position.setTitle(request.getTitle());
        position.setDescription(request.getDescription());
        position.setResponsibilities(request.getResponsibilities());
        position.setCboCode(request.getCboCode());
        position.setSalaryRangeMin(request.getSalaryRangeMin());
        position.setSalaryRangeMax(request.getSalaryRangeMax());
        position.setLevel(request.getLevel());
    }
}
