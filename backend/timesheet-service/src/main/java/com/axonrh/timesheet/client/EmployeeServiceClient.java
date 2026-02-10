package com.axonrh.timesheet.client;

import com.axonrh.timesheet.dto.EmployeeDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@FeignClient(name = "employee-service", url = "${application.clients.employee-service:http://localhost:8083}")
public interface EmployeeServiceClient {

    @GetMapping("/api/v1/employees/{id}")
    EmployeeDTO getEmployee(@PathVariable("id") UUID id);

    @GetMapping("/api/v1/managers/{id}/subordinates")
    java.util.List<EmployeeDTO> getSubordinates(@PathVariable("id") UUID id);

    @GetMapping("/api/v1/employees/user/{userId}")
    EmployeeDTO getEmployeeByUserId(@PathVariable("userId") UUID userId, @RequestParam(value = "email", required = false) String email);
}
