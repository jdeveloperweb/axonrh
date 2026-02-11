package com.axonrh.payroll.client;

import com.axonrh.payroll.dto.PerformanceBonusDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@FeignClient(name = "performance-service", url = "${application.clients.performance-service:http://localhost:8086}")
public interface PerformanceServiceClient {

    @GetMapping("/api/v1/performance/employees/{employeeId}/bonus")
    PerformanceBonusDTO getBonusForPeriod(
            @PathVariable("employeeId") UUID employeeId,
            @RequestParam("month") Integer month,
            @RequestParam("year") Integer year);
}
