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

    PayrollResponse toResponse(Payroll payroll);

    PayrollItemResponse toItemResponse(PayrollItem item);

    List<PayrollItemResponse> toItemResponseList(List<PayrollItem> items);

    PayrollRunResponse toRunResponse(PayrollRun payrollRun);
}
