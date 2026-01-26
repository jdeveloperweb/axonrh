package com.axonrh.integration.esocial.service;

import com.axonrh.integration.esocial.entity.ESocialEvent;
import com.axonrh.integration.esocial.entity.enums.ESocialEventStatus;
import com.axonrh.integration.esocial.entity.enums.ESocialEventType;
import com.axonrh.integration.esocial.repository.ESocialEventRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class ESocialService {

    private final ESocialEventRepository eventRepository;
    private final ESocialXmlGenerator xmlGenerator;
    private final ESocialTransmitter transmitter;

    public ESocialService(ESocialEventRepository eventRepository,
                         ESocialXmlGenerator xmlGenerator,
                         ESocialTransmitter transmitter) {
        this.eventRepository = eventRepository;
        this.xmlGenerator = xmlGenerator;
        this.transmitter = transmitter;
    }

    // ==================== Event Creation ====================

    public ESocialEvent createEvent(UUID tenantId,
                                    ESocialEventType eventType,
                                    UUID employeeId,
                                    Map<String, Object> eventData) {
        String xml = switch (eventType) {
            case S_2200 -> xmlGenerator.generateS2200(eventData);
            case S_2206 -> xmlGenerator.generateS2206(eventData);
            case S_2299 -> xmlGenerator.generateS2299(eventData);
            default -> throw new IllegalArgumentException("Tipo de evento nao suportado: " + eventType);
        };

        ESocialEvent event = new ESocialEvent();
        event.setTenantId(tenantId);
        event.setEventType(eventType);
        event.setReferenceId(employeeId);
        event.setReferenceType(referenceTypeFor(eventType));
        event.setXmlContent(xml);

        return eventRepository.save(event);
    }

    public ESocialEvent createS2200(UUID tenantId, UUID employeeId, Object employeeData) {
        return createEvent(tenantId, ESocialEventType.S_2200, employeeId, Map.of("payload", employeeData));
    }

    public ESocialEvent createS2206(UUID tenantId, UUID employeeId, Object contractChange) {
        return createEvent(tenantId, ESocialEventType.S_2206, employeeId, Map.of("payload", contractChange));
    }

    public ESocialEvent createS2299(UUID tenantId, UUID employeeId, Object termination) {
        return createEvent(tenantId, ESocialEventType.S_2299, employeeId, Map.of("payload", termination));
    }

    // ==================== Transmission ====================

    public ESocialTransmitter.TransmissionResult transmitEvent(UUID tenantId, UUID eventId) {
        ESocialEvent event = getEventOrThrow(tenantId, eventId);

        if (event.getStatus() != ESocialEventStatus.PENDING) {
            throw new IllegalStateException("Evento ja foi enviado ou processado");
        }

        try {
            String signedXml = transmitter.signXml(event.getXmlContent(), tenantId);
            event.setXmlSigned(signedXml);

            ESocialTransmitter.TransmissionResult result = transmitter.sendBatch(signedXml, tenantId);

            if (result.isSuccess()) {
                event.markAsSent(result.getProtocolNumber());
            } else {
                event.markAsError(result.getErrorMessage());
            }

            eventRepository.save(event);
            return result;
        } catch (Exception e) {
            event.markAsError(e.getMessage());
            eventRepository.save(event);
            return failedTransmissionResult(e.getMessage());
        }
    }

    public List<ESocialTransmitter.TransmissionResult> transmitBatch(UUID tenantId, List<UUID> eventIds) {
        return eventIds.stream()
                .map(eventId -> transmitEvent(tenantId, eventId))
                .toList();
    }

    public ESocialTransmitter.TransmissionResult consultEvent(UUID tenantId, UUID eventId) {
        ESocialEvent event = getEventOrThrow(tenantId, eventId);

        if (event.getProtocolNumber() == null) {
            return failedTransmissionResult("Evento sem protocolo para consulta");
        }

        try {
            ESocialTransmitter.TransmissionResult result =
                    transmitter.consultBatch(event.getProtocolNumber(), tenantId);

            if (result.isSuccess() && result.getReceiptNumber() != null) {
                event.markAsAccepted(result.getReceiptNumber());
            } else if (!result.isSuccess() && "ERROR".equalsIgnoreCase(result.getStatus())) {
                event.markAsError(result.getErrorMessage());
            }

            eventRepository.save(event);
            return result;
        } catch (Exception e) {
            event.markAsError(e.getMessage());
            eventRepository.save(event);
            return failedTransmissionResult(e.getMessage());
        }
    }

    public ESocialEvent retryEvent(UUID tenantId, UUID eventId) {
        ESocialEvent event = getEventOrThrow(tenantId, eventId);

        if (!event.canRetry(3)) {
            throw new IllegalStateException("Evento nao pode ser reenviado");
        }

        event.setStatus(ESocialEventStatus.PENDING);
        event.setLastError(null);
        event.setProtocolNumber(null);
        event.setReceiptNumber(null);

        eventRepository.save(event);
        transmitEvent(tenantId, eventId);

        return getEventOrThrow(tenantId, eventId);
    }

    public ESocialEvent cancelEvent(UUID tenantId, UUID eventId, String reason) {
        ESocialEvent event = getEventOrThrow(tenantId, eventId);
        event.markAsRejected("CANCELLED", reason);
        return eventRepository.save(event);
    }

    // ==================== CRUD ====================

    public Optional<ESocialEvent> getEvent(UUID tenantId, UUID eventId) {
        return eventRepository.findByTenantIdAndId(tenantId, eventId);
    }

    public ESocialEvent getEventOrThrow(UUID tenantId, UUID eventId) {
        return getEvent(tenantId, eventId)
                .orElseThrow(() -> new EntityNotFoundException("Evento nao encontrado"));
    }

    public Page<ESocialEvent> listEvents(UUID tenantId, Pageable pageable) {
        return eventRepository.findByTenantId(tenantId, pageable);
    }

    public List<ESocialEvent> getPendingEvents(UUID tenantId) {
        return eventRepository.findPendingEvents(tenantId);
    }

    public List<ESocialEvent> getEventsByEmployee(UUID tenantId, UUID employeeId) {
        return eventRepository.findByTenantIdAndReferenceIdAndReferenceType(
                tenantId,
                employeeId,
                "EMPLOYEE"
        );
    }

    // ==================== Statistics ====================

    public ESocialStatistics getStatistics(UUID tenantId) {
        long total = eventRepository.countByTenantId(tenantId);
        long pending = eventRepository.countByTenantIdAndStatus(tenantId, ESocialEventStatus.PENDING);
        long transmitted = eventRepository.countByTenantIdAndStatus(tenantId, ESocialEventStatus.SENT);
        long processed = eventRepository.countByTenantIdAndStatus(tenantId, ESocialEventStatus.ACCEPTED)
                + eventRepository.countByTenantIdAndStatus(tenantId, ESocialEventStatus.REJECTED);
        long error = eventRepository.countByTenantIdAndStatus(tenantId, ESocialEventStatus.ERROR);

        Map<String, Long> byEventType = eventRepository.countByEventType(tenantId).stream()
                .collect(java.util.stream.Collectors.toMap(
                        entry -> ((ESocialEventType) entry[0]).name(),
                        entry -> (Long) entry[1]
                ));

        return new ESocialStatistics(total, pending, transmitted, processed, error, byEventType);
    }

    public record ESocialStatistics(
            long total,
            long pending,
            long transmitted,
            long processed,
            long error,
            Map<String, Long> byEventType
    ) {}

    private String referenceTypeFor(ESocialEventType eventType) {
        return switch (eventType) {
            case S_2200 -> "EMPLOYEE";
            case S_2206 -> "CONTRACT_CHANGE";
            case S_2299 -> "TERMINATION";
            default -> "UNKNOWN";
        };
    }

    private ESocialTransmitter.TransmissionResult failedTransmissionResult(String errorMessage) {
        ESocialTransmitter.TransmissionResult result = new ESocialTransmitter.TransmissionResult();
        result.setSuccess(false);
        result.setStatus("ERROR");
        result.setErrorMessage(errorMessage);
        return result;
    }
}
