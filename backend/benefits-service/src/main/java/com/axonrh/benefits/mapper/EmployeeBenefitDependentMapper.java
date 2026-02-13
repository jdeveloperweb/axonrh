package com.axonrh.benefits.mapper;

import com.axonrh.benefits.dto.EmployeeBenefitDependentResponse;
import com.axonrh.benefits.entity.EmployeeBenefitDependent;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface EmployeeBenefitDependentMapper {
    EmployeeBenefitDependentResponse toResponse(EmployeeBenefitDependent entity);
}
