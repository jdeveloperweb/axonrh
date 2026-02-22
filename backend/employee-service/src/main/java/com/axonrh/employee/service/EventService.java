package com.axonrh.employee.service;

import com.axonrh.employee.config.TenantContext;
import com.axonrh.employee.dto.EmployeeResponse;
import com.axonrh.employee.dto.EventDTO;
import com.axonrh.employee.dto.EventResourceDTO;
import com.axonrh.employee.entity.Employee;
import com.axonrh.employee.entity.Event;
import com.axonrh.employee.entity.EventRegistration;
import com.axonrh.employee.entity.EventResource;
import com.axonrh.employee.repository.EmployeeRepository;
import com.axonrh.employee.repository.EventRegistrationRepository;
import com.axonrh.employee.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public List<EventDTO> getAllEvents(UUID userId, String email) {
        UUID tenantId = getTenantId();
        UUID employeeId = findEmployeeId(userId, email);
        
        return eventRepository.findByTenantIdOrderByDateAsc(tenantId).stream()
                .map(e -> mapToDTO(e, employeeId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EventDTO getEventById(UUID id, UUID userId, String email) {
        UUID employeeId = findEmployeeId(userId, email);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        return mapToDTO(event, employeeId);
    }

    @Transactional
    public void saveEvent(EventDTO dto) {
        UUID tenantId = getTenantId();
        Event event = Event.builder()
                .id(dto.getId() != null ? UUID.fromString(dto.getId()) : null)
                .tenantId(tenantId)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .date(dto.getDate())
                .location(dto.getLocation())
                .url(dto.getUrl())
                .category(dto.getCategory() != null ? dto.getCategory() : "GENERAL")
                .status(dto.getStatus() != null ? dto.getStatus() : "UPCOMING")
                .speakerName(dto.getSpeakerName())
                .speakerRole(dto.getSpeakerRole())
                .speakerBio(dto.getSpeakerBio())
                .speakerLinkedin(dto.getSpeakerLinkedin())
                .speakerAvatarUrl(dto.getSpeakerAvatarUrl())
                .build();

        if (dto.getResources() != null) {
            List<EventResource> resources = dto.getResources().stream()
                    .map(r -> EventResource.builder()
                            .id(r.getId() != null ? UUID.fromString(r.getId()) : null)
                            .event(event)
                            .title(r.getTitle())
                            .description(r.getDescription())
                            .url(r.getUrl())
                            .type(r.getType())
                            .build())
                    .collect(Collectors.toList());
            event.setResources(resources);
        }

        eventRepository.save(event);
    }

    @Transactional
    public void deleteEvent(UUID id) {
        UUID tenantId = getTenantId();
        eventRepository.findById(id)
                .filter(e -> e.getTenantId().equals(tenantId))
                .ifPresent(eventRepository::delete);
    }

    @Transactional
    public void registerToEvent(UUID eventId, UUID userId, String email) {
        UUID employeeId = findEmployeeId(userId, email);
        if (employeeId == null) throw new RuntimeException("Logged in employee not found");

        if (registrationRepository.existsByEventIdAndEmployeeId(eventId, employeeId)) {
            return; // Already registered
        }

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        EventRegistration registration = EventRegistration.builder()
                .event(event)
                .employeeId(employeeId)
                .build();

        registrationRepository.save(registration);
    }

    @Transactional
    public void unregisterFromEvent(UUID eventId, UUID userId, String email) {
        UUID employeeId = findEmployeeId(userId, email);
        if (employeeId != null) {
            registrationRepository.findByEventIdAndEmployeeId(eventId, employeeId)
                    .ifPresent(registrationRepository::delete);
        }
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponse.EmployeeSummary> getEventSubscribers(UUID eventId) {
        return registrationRepository.findByEventId(eventId).stream()
                .map(reg -> employeeRepository.findById(reg.getEmployeeId()))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(e -> EmployeeResponse.EmployeeSummary.builder()
                        .id(e.getId())
                        .name(e.getFullName())
                        .email(e.getEmail())
                        .photoUrl(e.getPhotoUrl())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void addSubscribers(UUID eventId, List<UUID> employeeIds) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        for (UUID employeeId : employeeIds) {
            if (!registrationRepository.existsByEventIdAndEmployeeId(eventId, employeeId)) {
                EventRegistration registration = EventRegistration.builder()
                        .event(event)
                        .employeeId(employeeId)
                        .build();
                registrationRepository.save(registration);
            }
        }
    }

    @Transactional
    public void removeSubscriber(UUID eventId, UUID employeeId) {
        registrationRepository.findByEventIdAndEmployeeId(eventId, employeeId)
                .ifPresent(registrationRepository::delete);
    }

    private EventDTO mapToDTO(Event e, UUID employeeId) {
        return EventDTO.builder()
                .id(e.getId().toString())
                .title(e.getTitle())
                .description(e.getDescription())
                .date(e.getDate())
                .location(e.getLocation())
                .url(e.getUrl())
                .category(e.getCategory())
                .status(e.getStatus())
                .speakerName(e.getSpeakerName())
                .speakerRole(e.getSpeakerRole())
                .speakerBio(e.getSpeakerBio())
                .speakerLinkedin(e.getSpeakerLinkedin())
                .speakerAvatarUrl(e.getSpeakerAvatarUrl())
                .registrationCount(registrationRepository.countByEventId(e.getId()))
                .isUserRegistered(employeeId != null && registrationRepository.existsByEventIdAndEmployeeId(e.getId(), employeeId))
                .resources(e.getResources().stream()
                        .map(r -> EventResourceDTO.builder()
                                .id(r.getId().toString())
                                .title(r.getTitle())
                                .description(r.getDescription())
                                .url(r.getUrl())
                                .type(r.getType())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    private UUID getTenantId() {
        return UUID.fromString(TenantContext.getCurrentTenant());
    }

    private UUID findEmployeeId(UUID userId, String email) {
        UUID tenantId = getTenantId();
        
        // 1. Tenta pelo UserID (forma mais garantida do Gateway)
        if (userId != null) {
            Optional<Employee> employee = employeeRepository.findByTenantIdAndUserId(tenantId, userId);
            if (employee.isPresent()) return employee.get().getId();
        }

        // 2. Tenta pelo E-mail (Auto-heal para usuários sincronizados mas não vinculados)
        if (email != null && !email.isBlank()) {
            Optional<Employee> employee = employeeRepository.findByTenantIdAndEmail(tenantId, email);
            if (employee.isPresent()) {
                Employee e = employee.get();
                if (e.getUserId() == null && userId != null) {
                    e.setUserId(userId);
                    employeeRepository.save(e);
                }
                return e.getId();
            }
        }

        // 3. Fallback: Tenta pelo SecurityContextHolder (Contexto do Spring Security)
        String authName = SecurityContextHolder.getContext().getAuthentication() != null ? 
                         SecurityContextHolder.getContext().getAuthentication().getName() : null;
        
        if (authName != null && !authName.equals("anonymousUser") && !authName.equals("debug-user")) {
            // Tenta como UUID (UserID)
            try {
                UUID authUserId = UUID.fromString(authName);
                Optional<Employee> employee = employeeRepository.findByTenantIdAndUserId(tenantId, authUserId);
                if (employee.isPresent()) return employee.get().getId();
            } catch (IllegalArgumentException ex) {
                // Tenta como Email
                Optional<Employee> employee = employeeRepository.findByTenantIdAndEmail(tenantId, authName);
                if (employee.isPresent()) return employee.get().getId();
            }
        }

        return null;
    }
}
