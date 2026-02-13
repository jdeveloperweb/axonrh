package com.axonrh.benefits.mapper;

import com.axonrh.benefits.dto.BenefitHistoryResponse;
import com.axonrh.benefits.entity.BenefitHistory;
import org.mapstruct.Mapper;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface BenefitHistoryMapper {

    BenefitHistoryResponse toResponse(BenefitHistory entity);
}
