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

    public ESocialEvent createEvent(UUID tenantId, ESocialEventType eventType, UUID employeeId, Object eventData) {
        return switch (eventType) {
            case S_2200 -> createS2200(tenantId, employeeId, eventData);
            case S_2206 -> createS2206(tenantId, employeeId, eventData);
            case S_2299 -> createS2299(tenantId, employeeId, eventData);
        };
    }

    public ESocialEvent createS2200(UUID tenantId, UUID employeeId, Object employeeData) {
        String xml = xmlGenerator.generateS2200(employeeData);

        ESocialEvent event = new ESocialEvent();
        event.setTenantId(tenantId);
        event.setEventType(ESocialEventType.S_2200);
        event.setReferenceId(employeeId);
        event.setReferenceType("EMPLOYEE");
        event.setXmlContent(xml);

        return eventRepository.save(event);
    }

    public ESocialEvent createS2206(UUID tenantId, UUID employeeId, Object contractChange) {
        String xml = xmlGenerator.generateS2206(contractChange);

        ESocialEvent event = new ESocialEvent();
        event.setTenantId(tenantId);
        event.setEventType(ESocialEventType.S_2206);
        event.setReferenceId(employeeId);
        event.setReferenceType("CONTRACT_CHANGE");
        event.setXmlContent(xml);

        return eventRepository.save(event);
    }

    public ESocialEvent createS2299(UUID tenantId, UUID employeeId, Object termination) {
        String xml = xmlGenerator.generateS2299(termination);

        ESocialEvent event = new ESocialEvent();
        event.setTenantId(tenantId);
        event.setEventType(ESocialEventType.S_2299);
        event.setReferenceId(employeeId);
        event.setReferenceType("TERMINATION");
        event.setXmlContent(xml);

        return eventRepository.save(event);
    }

    // ==================== Transmission ====================

    public ESocialEvent sendEvent(UUID tenantId, UUID eventId) {
        ESocialEvent event = getEvent(tenantId, eventId);

        if (event.getStatus() != ESocialEventStatus.PENDING) {
            throw new IllegalStateException("Evento ja foi enviado ou processado");
        }

        try {
            // Assinar XML
            String signedXml = transmitter.signXml(event.getXmlContent(), tenantId);
            event.setXmlSigned(signedXml);

            // Transmitir
            ESocialTransmitter.TransmissionResult result = transmitter.sendBatch(signedXml, tenantId);

            if (result.isSuccess()) {
                event.markAsSent(result.getProtocolNumber());
            } else {
                event.markAsError(result.getErrorMessage());
            }
        } catch (Exception e) {
            event.markAsError(e.getMessage());
        }

        return eventRepository.save(event);
    }

    public void sendPendingEvents(UUID tenantId) {
        List<ESocialEvent> pending = eventRepository.findByTenantIdAndStatus(tenantId, ESocialEventStatus.PENDING);
        for (ESocialEvent event : pending) {
            sendEvent(tenantId, event.getId());
        }
    }

    // ==================== Query ====================

    public ESocialEvent queryEventStatus(UUID tenantId, UUID eventId) {
        ESocialEvent event = getEvent(tenantId, eventId);

        if (event.getStatus() != ESocialEventStatus.SENT) {
            return event;
        }

        try {
            ESocialTransmitter.TransmissionResult result = transmitter.consultBatch(event.getProtocolNumber(), tenantId);

            if (result.isSuccess() && result.getReceiptNumber() != null) {
                event.markAsAccepted(result.getReceiptNumber());
            } else if (!result.isSuccess()) {
                event.markAsRejected("CONSULTA_FALHA", result.getErrorMessage());
            }
        } catch (Exception e) {
            // Nao altera status, apenas registra tentativa
        }

        return eventRepository.save(event);
    }

    // ==================== CRUD ====================

    public ESocialEvent getEvent(UUID tenantId, UUID eventId) {
        return eventRepository.findByTenantIdAndId(tenantId, eventId)
                .orElseThrow(() -> new EntityNotFoundException("Evento nao encontrado"));
    }

    public Page<ESocialEvent> listEvents(UUID tenantId, Pageable pageable) {
        return eventRepository.findByTenantId(tenantId, pageable);
    }

    public List<ESocialEvent> listEvents(UUID tenantId) {
        return eventRepository.findByTenantId(tenantId, Pageable.unpaged()).getContent();
    }

    public List<ESocialEvent> listByStatus(UUID tenantId, ESocialEventStatus status) {
        return eventRepository.findByTenantIdAndStatus(tenantId, status);
    }

    public List<ESocialEvent> listByReference(UUID tenantId, UUID referenceId, String referenceType) {
        return eventRepository.findByTenantIdAndReferenceIdAndReferenceType(tenantId, referenceId, referenceType);
    }

    public List<ESocialEvent> getPendingEvents(UUID tenantId) {
        return eventRepository.findPendingEvents(tenantId);
    }

    public List<ESocialEvent> getEventsByEmployee(UUID tenantId, UUID employeeId) {
        return eventRepository.findByTenantIdAndReferenceIdAndReferenceType(tenantId, employeeId, "EMPLOYEE");
    }

    public ESocialTransmitter.TransmissionResult transmitEvent(UUID tenantId, UUID eventId) {
        ESocialEvent event = getEvent(tenantId, eventId);

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
            return buildErrorResult(e.getMessage());
        }
    }

    public List<ESocialTransmitter.TransmissionResult> transmitBatch(UUID tenantId, List<UUID> eventIds) {
        return eventIds.stream()
                .map(eventId -> transmitEvent(tenantId, eventId))
                .toList();
    }

    public ESocialTransmitter.TransmissionResult consultEvent(UUID tenantId, UUID eventId) {
        ESocialEvent event = getEvent(tenantId, eventId);
        if (event.getProtocolNumber() == null) {
            return buildErrorResult("Evento sem protocolo para consulta");
        }

        try {
            ESocialTransmitter.TransmissionResult result = transmitter.consultBatch(event.getProtocolNumber(), tenantId);
            if (result.isSuccess() && result.getReceiptNumber() != null) {
                event.markAsAccepted(result.getReceiptNumber());
            } else if (!result.isSuccess()) {
                event.markAsRejected("CONSULTA_FALHA", result.getErrorMessage());
            }
            eventRepository.save(event);
            return result;
        } catch (Exception e) {
            event.markAsError(e.getMessage());
            eventRepository.save(event);
            return buildErrorResult(e.getMessage());
        }
    }

    public ESocialEvent retryEvent(UUID tenantId, UUID eventId) {
        ESocialEvent event = getEvent(tenantId, eventId);
        if (!event.canRetry(3)) {
            return event;
        }

        transmitEvent(tenantId, eventId);
        return getEvent(tenantId, eventId);
    }

    public ESocialEvent cancelEvent(UUID tenantId, UUID eventId, String reason) {
        ESocialEvent event = getEvent(tenantId, eventId);
        event.markAsRejected("CANCELLED", reason != null ? reason : "Cancelado");
        return eventRepository.save(event);
    }

    // ==================== Statistics ====================

    public ESocialStatistics getStatistics(UUID tenantId) {
        long pending = eventRepository.countByTenantIdAndStatus(tenantId, ESocialEventStatus.PENDING);
        long transmitted = eventRepository.countByTenantIdAndStatus(tenantId, ESocialEventStatus.SENT);
        long accepted = eventRepository.countByTenantIdAndStatus(tenantId, ESocialEventStatus.ACCEPTED);
        long rejected = eventRepository.countByTenantIdAndStatus(tenantId, ESocialEventStatus.REJECTED);
        long error = eventRepository.countByTenantIdAndStatus(tenantId, ESocialEventStatus.ERROR);

        long processed = accepted + rejected;
        long total = pending + transmitted + processed + error;

        Map<ESocialEventType, Long> byEventType = new HashMap<>();
        for (Object[] row : eventRepository.countByEventType(tenantId)) {
            byEventType.put((ESocialEventType) row[0], (Long) row[1]);
        }

        return new ESocialStatistics(total, pending, transmitted, processed, error, byEventType);
    }

    public record ESocialStatistics(
            long total,
            long pending,
            long transmitted,
            long processed,
            long error,
            Map<ESocialEventType, Long> byEventType
    ) {}

    private ESocialTransmitter.TransmissionResult buildErrorResult(String message) {
        ESocialTransmitter.TransmissionResult result = new ESocialTransmitter.TransmissionResult();
        result.setSuccess(false);
        result.setStatus("ERROR");
        result.setErrorMessage(message);
        return result;
    }
}
