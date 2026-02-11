package com.axonrh.payroll.client;

import com.axonrh.payroll.dto.TimesheetDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@FeignClient(name = "timesheet-service", url = "${application.clients.timesheet-service:http://localhost:8084}")
public interface TimesheetServiceClient {

    @GetMapping("/api/v1/timesheet/employees/{employeeId}/summary")
    TimesheetDTO getMonthSummary(
            @PathVariable("employeeId") UUID employeeId,
            @RequestParam("month") Integer month,
            @RequestParam("year") Integer year);
}
