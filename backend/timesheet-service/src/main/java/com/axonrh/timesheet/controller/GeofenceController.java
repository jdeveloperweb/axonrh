package com.axonrh.timesheet.controller;

import com.axonrh.timesheet.dto.GeofenceRequest;
import com.axonrh.timesheet.dto.GeofenceResponse;
import com.axonrh.timesheet.service.GeofenceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * T134 - Controller de geofences.
 */
@RestController
@RequestMapping("/api/v1/timesheet/geofences")
@RequiredArgsConstructor
@Tag(name = "Geofences", description = "API de cercas geograficas")
public class GeofenceController {

    private final GeofenceService geofenceService;

    @PostMapping
    @Operation(summary = "Criar geofence", description = "Cria uma nova cerca geografica")
    @PreAuthorize("hasAnyAuthority('TIMESHEET_ADMIN', 'ADMIN')")
    public ResponseEntity<GeofenceResponse> createGeofence(
            @Valid @RequestBody GeofenceRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        GeofenceResponse response = geofenceService.createGeofence(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar geofence", description = "Atualiza uma cerca geografica")
    @PreAuthorize("hasAnyAuthority('TIMESHEET_ADMIN', 'ADMIN')")
    public ResponseEntity<GeofenceResponse> updateGeofence(
            @PathVariable UUID id,
            @Valid @RequestBody GeofenceRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        GeofenceResponse response = geofenceService.updateGeofence(id, request, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar geofence", description = "Busca uma cerca geografica por ID")
    @PreAuthorize("hasAnyAuthority('TIMESHEET_VIEW', 'TIMESHEET_ADMIN', 'ADMIN')")
    public ResponseEntity<GeofenceResponse> getGeofenceById(@PathVariable UUID id) {
        GeofenceResponse response = geofenceService.getGeofenceById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "Listar geofences", description = "Lista todas as cercas geograficas")
    @PreAuthorize("hasAnyAuthority('TIMESHEET_VIEW', 'TIMESHEET_ADMIN', 'ADMIN')")
    public ResponseEntity<Page<GeofenceResponse>> listGeofences(Pageable pageable) {
        Page<GeofenceResponse> geofences = geofenceService.listGeofences(pageable);
        return ResponseEntity.ok(geofences);
    }

    @GetMapping("/active")
    @Operation(summary = "Geofences ativas", description = "Lista apenas geofences ativas")
    @PreAuthorize("hasAnyAuthority('TIMESHEET_VIEW', 'TIMESHEET_RECORD', 'ADMIN')")
    public ResponseEntity<List<GeofenceResponse>> getActiveGeofences() {
        List<GeofenceResponse> geofences = geofenceService.getActiveGeofences();
        return ResponseEntity.ok(geofences);
    }

    @GetMapping("/my-allowed")
    @Operation(summary = "Minhas geofences", description = "Lista geofences permitidas para o usuario logado")
    @PreAuthorize("hasAnyAuthority('TIMESHEET_RECORD', 'ADMIN')")
    public ResponseEntity<List<GeofenceResponse>> getMyGeofences(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject()); // In this context, userId is the employeeId
        List<GeofenceResponse> geofences = geofenceService.getMyGeofences(userId);
        return ResponseEntity.ok(geofences);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Desativar geofence", description = "Desativa uma cerca geografica")
    @PreAuthorize("hasAnyAuthority('TIMESHEET_ADMIN', 'ADMIN')")
    public ResponseEntity<Void> deleteGeofence(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        geofenceService.deleteGeofence(id, userId);
        return ResponseEntity.noContent().build();
    }
}
