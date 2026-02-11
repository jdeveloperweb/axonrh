package com.axonrh.payroll.client;

import com.axonrh.payroll.dto.EmployeeDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.UUID;

@FeignClient(name = "employee-service", url = "${application.clients.employee-service:http://localhost:8083}")
public interface EmployeeServiceClient {

    @GetMapping("/api/v1/employees/{id}")
    EmployeeDTO getEmployee(@PathVariable("id") UUID id);

    @GetMapping("/api/v1/employees")
    List<EmployeeDTO> getActiveEmployees(@RequestParam(value = "status", defaultValue = "ACTIVE") String status);
}
