package com.axonrh.benefits.mapper;

import com.axonrh.benefits.dto.EmployeeBenefitResponse;
import com.axonrh.benefits.entity.EmployeeBenefit;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface EmployeeBenefitMapper {

    @Mapping(source = "benefitType.id", target = "benefitTypeId")
    @Mapping(source = "benefitType.name", target = "benefitTypeName")
    @Mapping(source = "benefitType.category", target = "benefitCategory")
    @Mapping(source = "benefitType.calculationType", target = "calculationType")
    EmployeeBenefitResponse toResponse(EmployeeBenefit entity);
}
