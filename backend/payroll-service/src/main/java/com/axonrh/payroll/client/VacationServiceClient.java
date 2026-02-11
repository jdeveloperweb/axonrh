package com.axonrh.payroll.client;

import com.axonrh.payroll.dto.VacationDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.UUID;

@FeignClient(name = "vacation-service", url = "${application.clients.vacation-service:http://localhost:8085}")
public interface VacationServiceClient {

    @GetMapping("/api/v1/vacations/employees/{employeeId}")
    List<VacationDTO> getVacationsForPeriod(
            @PathVariable("employeeId") UUID employeeId,
            @RequestParam("month") Integer month,
            @RequestParam("year") Integer year);
}
