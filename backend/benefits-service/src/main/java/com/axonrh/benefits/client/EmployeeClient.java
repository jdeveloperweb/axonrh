package com.axonrh.benefits.client;

import com.axonrh.benefits.dto.EmployeeDetailsDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "employee-service", path = "/api/v1/employees")
public interface EmployeeClient {

    @GetMapping("/{id}")
    EmployeeDetailsDto getEmployeeDetails(@PathVariable("id") UUID id);
}
