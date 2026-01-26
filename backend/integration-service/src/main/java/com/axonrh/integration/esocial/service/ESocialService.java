package com.axonrh.integration.esocial.service;

import com.axonrh.integration.esocial.entity.ESocialEvent;
import com.axonrh.integration.esocial.entity.enums.ESocialEventStatus;
import com.axonrh.integration.esocial.entity.enums.ESocialEventType;
import com.axonrh.integration.esocial.repository.ESocialEventRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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
            String signedXml = transmitter.signXml(tenantId, event.getXmlContent());
            event.setXmlSigned(signedXml);

            // Transmitir
            TransmissionResult result = transmitter.transmit(tenantId, signedXml);

            if (result.isSuccess()) {
                event.markAsSent(result.getProtocol());
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
            QueryResult result = transmitter.queryEvent(tenantId, event.getProtocolNumber());

            if (result.isProcessed()) {
                if (result.isAccepted()) {
                    event.markAsAccepted(result.getReceiptNumber());
                } else {
                    event.markAsRejected(result.getReturnCode(), result.getReturnMessage());
                }
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

    public List<ESocialEvent> listEvents(UUID tenantId) {
        return eventRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    public List<ESocialEvent> listByStatus(UUID tenantId, ESocialEventStatus status) {
        return eventRepository.findByTenantIdAndStatus(tenantId, status);
    }

    public List<ESocialEvent> listByReference(UUID tenantId, UUID referenceId, String referenceType) {
        return eventRepository.findByTenantIdAndReferenceIdAndReferenceType(tenantId, referenceId, referenceType);
    }

    // ==================== Statistics ====================

    public ESocialStatistics getStatistics(UUID tenantId) {
        long pending = eventRepository.countByTenantIdAndStatus(tenantId, ESocialEventStatus.PENDING);
        long sent = eventRepository.countByTenantIdAndStatus(tenantId, ESocialEventStatus.SENT);
        long accepted = eventRepository.countByTenantIdAndStatus(tenantId, ESocialEventStatus.ACCEPTED);
        long rejected = eventRepository.countByTenantIdAndStatus(tenantId, ESocialEventStatus.REJECTED);
        long error = eventRepository.countByTenantIdAndStatus(tenantId, ESocialEventStatus.ERROR);

        return new ESocialStatistics(pending, sent, accepted, rejected, error);
    }

    public record ESocialStatistics(
            long pending,
            long sent,
            long accepted,
            long rejected,
            long error
    ) {}

    public record TransmissionResult(
            boolean success,
            String protocol,
            String errorMessage
    ) {
        public boolean isSuccess() {
            return success;
        }

        public String getProtocol() {
            return protocol;
        }

        public String getErrorMessage() {
            return errorMessage;
        }
    }

    public record QueryResult(
            boolean processed,
            boolean accepted,
            String receiptNumber,
            String returnCode,
            String returnMessage
    ) {
        public boolean isProcessed() {
            return processed;
        }

        public boolean isAccepted() {
            return accepted;
        }

        public String getReceiptNumber() {
            return receiptNumber;
        }

        public String getReturnCode() {
            return returnCode;
        }

        public String getReturnMessage() {
            return returnMessage;
        }
    }
}
