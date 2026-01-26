package com.axonrh.integration.esocial.controller;

import com.axonrh.integration.esocial.entity.ESocialEvent;
import com.axonrh.integration.esocial.entity.enums.ESocialEventStatus;
import com.axonrh.integration.esocial.entity.enums.ESocialEventType;
import com.axonrh.integration.esocial.service.ESocialService;
import com.axonrh.integration.esocial.service.ESocialTransmitter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/esocial")
public class ESocialController {

    private final ESocialService esocialService;

    public ESocialController(ESocialService esocialService) {
        this.esocialService = esocialService;
    }

    @PostMapping("/events")
    public ResponseEntity<ESocialEvent> createEvent(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody CreateEventRequest request) {

        ESocialEvent event = esocialService.createEvent(
                tenantId,
                request.eventType(),
                request.employeeId(),
                request.eventData()
        );
        return ResponseEntity.ok(event);
    }

    @GetMapping("/events")
    public ResponseEntity<Page<ESocialEvent>> listEvents(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            Pageable pageable) {

        return ResponseEntity.ok(esocialService.listEvents(tenantId, pageable));
    }

    @GetMapping("/events/{eventId}")
    public ResponseEntity<ESocialEvent> getEvent(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID eventId) {

        return ResponseEntity.ok(esocialService.getEvent(tenantId, eventId));
    }

    @GetMapping("/events/pending")
    public ResponseEntity<List<ESocialEvent>> getPendingEvents(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {

        return ResponseEntity.ok(esocialService.getPendingEvents(tenantId));
    }

    @GetMapping("/events/employee/{employeeId}")
    public ResponseEntity<List<ESocialEvent>> getEventsByEmployee(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID employeeId) {

        return ResponseEntity.ok(esocialService.getEventsByEmployee(tenantId, employeeId));
    }

    @PostMapping("/events/{eventId}/transmit")
    public ResponseEntity<ESocialTransmitter.TransmissionResult> transmitEvent(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID eventId) {

        ESocialTransmitter.TransmissionResult result = esocialService.transmitEvent(tenantId, eventId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/events/batch/transmit")
    public ResponseEntity<BatchTransmitResponse> transmitBatch(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody BatchTransmitRequest request) {

        List<ESocialTransmitter.TransmissionResult> results =
            esocialService.transmitBatch(tenantId, request.eventIds());

        long successCount = results.stream().filter(ESocialTransmitter.TransmissionResult::isSuccess).count();

        return ResponseEntity.ok(new BatchTransmitResponse(
                request.eventIds().size(),
                (int) successCount,
                request.eventIds().size() - (int) successCount,
                results
        ));
    }

    @PostMapping("/events/{eventId}/consult")
    public ResponseEntity<ESocialTransmitter.TransmissionResult> consultEvent(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID eventId) {

        ESocialTransmitter.TransmissionResult result = esocialService.consultEvent(tenantId, eventId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/events/{eventId}/retry")
    public ResponseEntity<ESocialEvent> retryEvent(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID eventId) {

        ESocialEvent event = esocialService.retryEvent(tenantId, eventId);
        return ResponseEntity.ok(event);
    }

    @PostMapping("/events/{eventId}/cancel")
    public ResponseEntity<ESocialEvent> cancelEvent(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID eventId,
            @RequestBody CancelEventRequest request) {

        ESocialEvent event = esocialService.cancelEvent(tenantId, eventId, request.reason());
        return ResponseEntity.ok(event);
    }

    @GetMapping("/statistics")
    public ResponseEntity<ESocialService.ESocialStatistics> getStatistics(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {

        return ResponseEntity.ok(esocialService.getStatistics(tenantId));
    }

    // Request/Response DTOs
    public record CreateEventRequest(
            ESocialEventType eventType,
            UUID employeeId,
            Map<String, Object> eventData
    ) {}

    public record BatchTransmitRequest(List<UUID> eventIds) {}

    public record BatchTransmitResponse(
            int total,
            int success,
            int failed,
            List<ESocialTransmitter.TransmissionResult> results
    ) {}

    public record CancelEventRequest(String reason) {}

}
