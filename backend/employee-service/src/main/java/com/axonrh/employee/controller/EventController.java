package com.axonrh.employee.controller;

import com.axonrh.employee.dto.EventDTO;
import com.axonrh.employee.service.EventService;
import lombok.RequiredArgsConstructor;
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
    public ResponseEntity<List<EventDTO>> getAllEvents() {
        return ResponseEntity.ok(eventService.getAllEvents());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventDTO> getEventById(@PathVariable UUID id) {
        return ResponseEntity.ok(eventService.getEventById(id));
    }

    @PostMapping
    public ResponseEntity<Void> saveEvent(@RequestBody EventDTO dto) {
        eventService.saveEvent(dto);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable UUID id) {
        eventService.deleteEvent(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/register")
    public ResponseEntity<Void> register(@PathVariable UUID id) {
        eventService.registerToEvent(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/unregister")
    public ResponseEntity<Void> unregister(@PathVariable UUID id) {
        eventService.unregisterFromEvent(id);
        return ResponseEntity.ok().build();
    }
}
