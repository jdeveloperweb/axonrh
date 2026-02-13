package com.axonrh.payroll.client;

import com.axonrh.payroll.dto.EmployeeBenefitCalculationResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.math.BigDecimal;
import java.util.UUID;

@FeignClient(name = "benefits-service", url = "${application.clients.benefits-service:http://localhost:8091}")
public interface BenefitsServiceClient {

    @GetMapping("/api/v1/benefits/employees/employee/{employeeId}/calculate")
    EmployeeBenefitCalculationResponse calculateForPayroll(
            @PathVariable UUID employeeId,
            @RequestParam Integer month,
            @RequestParam Integer year,
            @RequestParam BigDecimal baseSalary);
}
