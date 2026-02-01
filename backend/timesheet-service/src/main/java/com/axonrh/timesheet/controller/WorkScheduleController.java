package com.axonrh.timesheet.controller;

import com.axonrh.timesheet.dto.WorkScheduleRequest;
import com.axonrh.timesheet.dto.WorkScheduleResponse;
import com.axonrh.timesheet.service.WorkScheduleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/timesheet/schedules")
@Tag(name = "Work Schedules", description = "Endpoints para gestão de escalas de trabalho")
@RequiredArgsConstructor
public class WorkScheduleController {

    private final WorkScheduleService workScheduleService;

    @GetMapping
    @Operation(summary = "Lista todas as escalas ativas do tenant")
    public ResponseEntity<List<WorkScheduleResponse>> getAll(@RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(workScheduleService.findAll(tenantId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca uma escala por ID")
    public ResponseEntity<WorkScheduleResponse> getById(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(workScheduleService.findById(tenantId, id));
    }

    @PostMapping
    @Operation(summary = "Cria uma nova escala de trabalho")
    public ResponseEntity<WorkScheduleResponse> create(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @Valid @RequestBody WorkScheduleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workScheduleService.create(tenantId, request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza uma escala existente")
    public ResponseEntity<WorkScheduleResponse> update(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID id,
            @Valid @RequestBody WorkScheduleRequest request) {
        return ResponseEntity.ok(workScheduleService.update(tenantId, id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Desativa uma escala de trabalho")
    public ResponseEntity<Void> delete(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID id) {
        workScheduleService.delete(tenantId, id);
        return ResponseEntity.noContent().build();
    }
}
