package com.axonrh.benefits.mapper;

import com.axonrh.benefits.dto.BenefitTypeRequest;
import com.axonrh.benefits.dto.BenefitTypeResponse;
import com.axonrh.benefits.entity.BenefitType;
import org.mapstruct.*;

@Mapper(componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public abstract class BenefitTypeMapper {

    @org.springframework.beans.factory.annotation.Autowired
    protected com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "rules", source = "rules", qualifiedByName = "objectToString")
    public abstract BenefitType toEntity(BenefitTypeRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "rules", source = "rules", qualifiedByName = "objectToString")
    public abstract void updateEntity(@MappingTarget BenefitType entity, BenefitTypeRequest request);

    @Mapping(target = "rules", source = "rules", qualifiedByName = "stringToObject")
    public abstract BenefitTypeResponse toResponse(BenefitType entity);

    @Named("objectToString")
    public String objectToString(com.axonrh.benefits.dto.BenefitRule rule) {
        if (rule == null) return null;
        try {
            return objectMapper.writeValueAsString(rule);
        } catch (Exception e) {
            return null;
        }
    }

    @Named("stringToObject")
    public com.axonrh.benefits.dto.BenefitRule stringToObject(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, com.axonrh.benefits.dto.BenefitRule.class);
        } catch (Exception e) {
            return null;
        }
    }
}
