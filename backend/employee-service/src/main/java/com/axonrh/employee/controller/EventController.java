package com.axonrh.employee.controller;

import com.axonrh.employee.dto.EventDTO;
import com.axonrh.employee.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/employees/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping
    @PreAuthorize("hasAuthority('EVENT:READ')")
    public ResponseEntity<List<EventDTO>> getAllEvents(
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @RequestHeader(value = "X-User-Email", required = false) String email) {
        return ResponseEntity.ok(eventService.getAllEvents(userId, email));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('EVENT:READ')")
    public ResponseEntity<EventDTO> getEventById(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @RequestHeader(value = "X-User-Email", required = false) String email) {
        return ResponseEntity.ok(eventService.getEventById(id, userId, email));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('EVENT:CREATE')")
    public ResponseEntity<Void> saveEvent(@RequestBody EventDTO dto) {
        eventService.saveEvent(dto);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('EVENT:CREATE')")
    public ResponseEntity<Void> deleteEvent(@PathVariable UUID id) {
        eventService.deleteEvent(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/register")
    @PreAuthorize("hasAuthority('EVENT:READ')")
    public ResponseEntity<Void> register(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @RequestHeader(value = "X-User-Email", required = false) String email) {
        eventService.registerToEvent(id, userId, email);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/unregister")
    @PreAuthorize("hasAuthority('EVENT:READ')")
    public ResponseEntity<Void> unregister(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @RequestHeader(value = "X-User-Email", required = false) String email) {
        eventService.unregisterFromEvent(id, userId, email);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/subscribers")
    @PreAuthorize("hasAuthority('EVENT:CREATE')")
    public ResponseEntity<List<com.axonrh.employee.dto.EmployeeResponse.EmployeeSummary>> getSubscribers(@PathVariable UUID id) {
        return ResponseEntity.ok(eventService.getEventSubscribers(id));
    }

    @PostMapping("/{id}/subscribers")
    @PreAuthorize("hasAuthority('EVENT:CREATE')")
    public ResponseEntity<Void> addSubscribers(@PathVariable UUID id, @RequestBody List<UUID> employeeIds) {
        eventService.addSubscribers(id, employeeIds);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/subscribers/{employeeId}")
    @PreAuthorize("hasAuthority('EVENT:CREATE')")
    public ResponseEntity<Void> removeSubscriber(@PathVariable UUID id, @PathVariable UUID employeeId) {
        eventService.removeSubscriber(id, employeeId);
        return ResponseEntity.ok().build();
    }
}
