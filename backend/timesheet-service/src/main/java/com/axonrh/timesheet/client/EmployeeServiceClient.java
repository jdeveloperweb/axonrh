package com.axonrh.timesheet.client;

import com.axonrh.timesheet.dto.EmployeeDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "employee-service", url = "${application.clients.employee-service:http://localhost:8083}")
public interface EmployeeServiceClient {

    @GetMapping("/api/v1/employees/{id}")
    EmployeeDTO getEmployee(@PathVariable("id") UUID id);
}
