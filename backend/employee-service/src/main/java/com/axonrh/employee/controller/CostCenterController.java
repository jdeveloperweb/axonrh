package com.axonrh.employee.controller;

import com.axonrh.employee.dto.CostCenterDTO;
import com.axonrh.employee.service.CostCenterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cost-centers")
@RequiredArgsConstructor
@Tag(name = "Centros de Custo", description = "Gestao de centros de custo")
public class CostCenterController {

    private final CostCenterService costCenterService;

    @GetMapping
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Lista todos os centros de custo ativos")
    public ResponseEntity<List<CostCenterDTO>> findAll() {
        return ResponseEntity.ok(costCenterService.findAllActive());
    }
}
