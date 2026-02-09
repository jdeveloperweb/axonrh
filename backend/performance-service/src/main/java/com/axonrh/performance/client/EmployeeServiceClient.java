package com.axonrh.performance.client;

import com.axonrh.performance.dto.EmployeeDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "employee-service", url = "${application.services.employee.url:http://localhost:8083}", path = "/api/v1/employees")
public interface EmployeeServiceClient {

    @GetMapping("/{id}")
    EmployeeDTO getEmployee(@PathVariable("id") UUID id);
}
