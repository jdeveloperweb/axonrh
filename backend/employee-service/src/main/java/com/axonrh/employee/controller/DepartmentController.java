package com.axonrh.employee.controller;

import com.axonrh.employee.entity.Department;
import com.axonrh.employee.service.DepartmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Departamentos", description = "Gestao de departamentos")
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Lista departamentos ativos")
    public ResponseEntity<List<Department>> findAll() {
        List<Department> departments = departmentService.findAll();
        return ResponseEntity.ok(departments);
    }
}
