package com.axonrh.employee.controller;

import com.axonrh.employee.dto.TerminationRequest;
import com.axonrh.employee.dto.TerminationResponse;
import com.axonrh.employee.service.TerminationProcessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/terminations")
@RequiredArgsConstructor
public class TerminationProcessController {

    private final TerminationProcessService service;

    @PostMapping
    public ResponseEntity<TerminationResponse> initiate(
            @RequestBody TerminationRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        UUID tenantId = UUID.fromString(jwt.getClaimAsString("tenant_id"));
        return ResponseEntity.ok(service.initiateTermination(request, tenantId));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<TerminationResponse> complete(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(service.completeTermination(id, userId));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<TerminationResponse> getByEmployee(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(service.getByEmployeeId(employeeId));
    }

    @GetMapping
    public ResponseEntity<java.util.List<TerminationResponse>> list(@AuthenticationPrincipal Jwt jwt) {
        UUID tenantId = UUID.fromString(jwt.getClaimAsString("tenant_id"));
        return ResponseEntity.ok(service.listByTenant(tenantId));
    }
}
