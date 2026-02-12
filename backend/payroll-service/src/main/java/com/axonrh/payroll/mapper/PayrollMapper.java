package com.axonrh.payroll.mapper;

import com.axonrh.payroll.dto.PayrollItemResponse;
import com.axonrh.payroll.dto.PayrollResponse;
import com.axonrh.payroll.dto.PayrollRunResponse;
import com.axonrh.payroll.entity.Payroll;
import com.axonrh.payroll.entity.PayrollItem;
import com.axonrh.payroll.entity.PayrollRun;
import org.mapstruct.Mapper;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface PayrollMapper {

    @org.mapstruct.Mapping(target = "netValue", source = "netSalary")
    @org.mapstruct.Mapping(target = "fgtsValue", source = "fgtsAmount")
    @org.mapstruct.Mapping(target = "month", source = "referenceMonth")
    @org.mapstruct.Mapping(target = "year", source = "referenceYear")
    @org.mapstruct.Mapping(target = "calculatedAt", source = "updatedAt")
    PayrollResponse toResponse(Payroll payroll);

    PayrollItemResponse toItemResponse(PayrollItem item);

    List<PayrollItemResponse> toItemResponseList(List<PayrollItem> items);

    @org.mapstruct.Mapping(target = "totalNetValue", source = "totalNetSalary")
    @org.mapstruct.Mapping(target = "totalFgtsValue", source = "totalFgts")
    @org.mapstruct.Mapping(target = "month", source = "referenceMonth")
    @org.mapstruct.Mapping(target = "year", source = "referenceYear")
    PayrollRunResponse toRunResponse(PayrollRun payrollRun);
}
