package com.axonrh.timesheet.service;

import com.axonrh.timesheet.config.TenantContext;
import com.axonrh.timesheet.dto.TimeRecordRequest;
import com.axonrh.timesheet.dto.TimeRecordResponse;
import com.axonrh.timesheet.entity.Geofence;
import com.axonrh.timesheet.entity.TimeRecord;
import com.axonrh.timesheet.entity.enums.RecordSource;
import com.axonrh.timesheet.entity.enums.RecordStatus;
import com.axonrh.timesheet.entity.enums.RecordType;
import com.axonrh.timesheet.exception.InvalidOperationException;
import com.axonrh.timesheet.exception.ResourceNotFoundException;
import com.axonrh.timesheet.repository.GeofenceRepository;
import com.axonrh.timesheet.repository.TimeRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

/**
 * T132 - Servico de registro de ponto.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TimeRecordService {

    private final TimeRecordRepository timeRecordRepository;
    private final GeofenceRepository geofenceRepository;
    private final GeofenceService geofenceService;
    private final DailySummaryService dailySummaryService;
    private final TimeAdjustmentService adjustmentService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${timesheet.tolerance.default-minutes:5}")
    private int defaultToleranceMinutes;

    @Value("${timesheet.geofencing.enabled:true}")
    private boolean geofencingEnabled;

    /**
     * Registra um ponto (entrada, saida, intervalo).
     */
    @Transactional
    @CacheEvict(value = "timeRecords", key = "#request.employeeId + '-' + T(java.time.LocalDate).now()")
    public TimeRecordResponse registerTimeRecord(TimeRecordRequest request, UUID userId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        LocalDate recordDate = request.getRecordDate() != null ? request.getRecordDate() : LocalDate.now();
        LocalTime recordTime = request.getRecordTime() != null ? request.getRecordTime() : LocalTime.now();
        LocalDateTime recordDatetime = LocalDateTime.of(recordDate, recordTime);

        // Validar se ja existe registro no mesmo minuto
        boolean exists = timeRecordRepository.existsByTenantIdAndEmployeeIdAndRecordDateAndRecordTypeAndRecordTime(
                tenantId, request.getEmployeeId(), recordDate, request.getRecordType(), recordTime);
        if (exists) {
            throw new InvalidOperationException("Ja existe um registro de " +
                    getRecordTypeLabel(request.getRecordType()) + " neste horario");
        }

        // Validar sequencia de registros
        validateRecordSequence(tenantId, request.getEmployeeId(), recordDate, request.getRecordType());

        // Criar registro
        TimeRecord record = TimeRecord.builder()
                .tenantId(tenantId)
                .employeeId(request.getEmployeeId())
                .recordDate(recordDate)
                .recordTime(recordTime)
                .recordDatetime(recordDatetime)
                .recordType(request.getRecordType())
                .source(request.getSource())
                .status(RecordStatus.VALID)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .locationAccuracy(request.getLocationAccuracy())
                .photoUrl(request.getPhotoUrl())
                .deviceId(request.getDeviceId())
                .deviceInfo(request.getDeviceInfo())
                .ipAddress(request.getIpAddress())
                .notes(request.getNotes())
                .createdBy(userId)
                .build();

        // Validar geofencing se habilitado
        if (geofencingEnabled && request.getLatitude() != null && request.getLongitude() != null) {
            GeofenceValidationResult validation = geofenceService.validateLocation(
                    tenantId, request.getEmployeeId(), request.getLatitude(), request.getLongitude());

            record.setGeofenceId(validation.geofenceId());
            record.setWithinGeofence(validation.isWithin());

            if (!validation.isWithin()) {
                record.setStatus(RecordStatus.PENDING_APPROVAL);
                log.info("Registro de ponto fora do geofence - colaborador: {}, status: PENDING_APPROVAL",
                        request.getEmployeeId());
            }
        }

        // Salvar registro
        TimeRecord saved = timeRecordRepository.save(record);

        // Atualizar resumo diario
        dailySummaryService.updateDailySummary(tenantId, request.getEmployeeId(), recordDate);

        // Publicar evento
        publishEvent("TIME_RECORD_CREATED", saved);

        log.info("Registro de ponto criado - id: {}, colaborador: {}, tipo: {}, status: {}",
                saved.getId(), saved.getEmployeeId(), saved.getRecordType(), saved.getStatus());

        return toResponse(saved);
    }

    /**
     * Busca registros de um colaborador em um periodo.
     */
    @Transactional(readOnly = true)
    public List<TimeRecordResponse> getRecordsByPeriod(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        List<TimeRecord> records = timeRecordRepository
                .findByTenantIdAndEmployeeIdAndRecordDateBetweenOrderByRecordDateAscRecordTimeAsc(
                        tenantId, employeeId, startDate, endDate);

        return records.stream().map(this::toResponse).toList();
    }

    /**
     * Busca registros de um colaborador em uma data.
     */
    @Transactional(readOnly = true)
    public List<TimeRecordResponse> getRecordsByDate(UUID employeeId, LocalDate date) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        List<TimeRecord> records = timeRecordRepository
                .findByTenantIdAndEmployeeIdAndRecordDateOrderByRecordTimeAsc(tenantId, employeeId, date);

        return records.stream().map(this::toResponse).toList();
    }

    /**
     * Busca registros pendentes de aprovacao.
     */
    @Transactional(readOnly = true)
    public Page<TimeRecordResponse> getPendingRecords(Pageable pageable) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        Page<TimeRecord> records = timeRecordRepository
                .findByTenantIdAndStatusOrderByRecordDatetimeDesc(tenantId, RecordStatus.PENDING_APPROVAL, pageable);

        return records.map(this::toResponse);
    }

    /**
     * Aprova um registro de ponto.
     */
    @Transactional
    public TimeRecordResponse approveRecord(UUID recordId, String notes, UUID approverId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        TimeRecord record = timeRecordRepository.findByTenantIdAndId(tenantId, recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Registro nao encontrado"));

        if (record.getStatus() != RecordStatus.PENDING_APPROVAL) {
            throw new InvalidOperationException("Registro nao esta pendente de aprovacao");
        }

        record.setStatus(RecordStatus.APPROVED);
        record.setApprovedBy(approverId);
        record.setApprovedAt(LocalDateTime.now());
        record.setNotes(notes);
        record.setUpdatedBy(approverId);

        TimeRecord saved = timeRecordRepository.save(record);

        // Atualizar resumo diario
        dailySummaryService.updateDailySummary(tenantId, record.getEmployeeId(), record.getRecordDate());

        publishEvent("TIME_RECORD_APPROVED", saved);

        log.info("Registro de ponto aprovado - id: {}, por: {}", recordId, approverId);

        return toResponse(saved);
    }

    /**
     * Rejeita um registro de ponto.
     */
    @Transactional
    public TimeRecordResponse rejectRecord(UUID recordId, String reason, UUID approverId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        TimeRecord record = timeRecordRepository.findByTenantIdAndId(tenantId, recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Registro nao encontrado"));

        if (record.getStatus() != RecordStatus.PENDING_APPROVAL) {
            throw new InvalidOperationException("Registro nao esta pendente de aprovacao");
        }

        record.setStatus(RecordStatus.REJECTED);
        record.setRejectionReason(reason);
        record.setApprovedBy(approverId);
        record.setApprovedAt(LocalDateTime.now());
        record.setUpdatedBy(approverId);

        TimeRecord saved = timeRecordRepository.save(record);

        // Atualizar resumo diario
        dailySummaryService.updateDailySummary(tenantId, record.getEmployeeId(), record.getRecordDate());

        publishEvent("TIME_RECORD_REJECTED", saved);

        log.info("Registro de ponto rejeitado - id: {}, motivo: {}", recordId, reason);

        return toResponse(saved);
    }

    /**
     * Ultimo registro do colaborador.
     */
    @Transactional(readOnly = true)
    public Optional<TimeRecordResponse> getLastRecord(UUID employeeId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        return timeRecordRepository.findFirstByTenantIdAndEmployeeIdOrderByRecordDatetimeDesc(tenantId, employeeId)
                .map(this::toResponse);
    }

    /**
     * Proximo tipo de registro esperado.
     */
    @Transactional(readOnly = true)
    public RecordType getExpectedNextRecordType(UUID employeeId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        LocalDate today = LocalDate.now();

        List<TimeRecord> todayRecords = timeRecordRepository
                .findByTenantIdAndEmployeeIdAndRecordDateOrderByRecordTimeAsc(tenantId, employeeId, today);

        if (todayRecords.isEmpty()) {
            return RecordType.ENTRY;
        }

        TimeRecord lastRecord = todayRecords.get(todayRecords.size() - 1);

        return switch (lastRecord.getRecordType()) {
            case ENTRY -> RecordType.BREAK_START;
            case BREAK_START -> RecordType.BREAK_END;
            case BREAK_END -> RecordType.EXIT;
            case EXIT -> RecordType.ENTRY; // Permite nova entrada
        };
    }

    /**
     * Contagem de registros pendentes.
     */
    @Transactional(readOnly = true)
    public long countPendingRecords() {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        return timeRecordRepository.countByTenantIdAndStatus(tenantId, RecordStatus.PENDING_APPROVAL);
    }

    /**
     * Estatisticas para o dashboard.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getStatistics() {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        LocalDate today = LocalDate.now();

        Map<String, Long> stats = new HashMap<>();
        stats.put("pendingRecords", countPendingRecords());
        stats.put("pendingAdjustments", adjustmentService.countPendingAdjustments());
        stats.put("todayRecords", timeRecordRepository.countByTenantIdAndRecordDate(tenantId, today));
        stats.put("employeesWithIssues", 0L); // TODO: Implementar logica de inconsistencias

        return stats;
    }

    // ==================== Metodos Privados ====================

    private void validateRecordSequence(UUID tenantId, UUID employeeId, LocalDate date, RecordType recordType) {
        List<TimeRecord> todayRecords = timeRecordRepository
                .findByTenantIdAndEmployeeIdAndRecordDateOrderByRecordTimeAsc(tenantId, employeeId, date);

        if (todayRecords.isEmpty()) {
            if (recordType != RecordType.ENTRY) {
                throw new InvalidOperationException("O primeiro registro do dia deve ser uma entrada");
            }
            return;
        }

        TimeRecord lastRecord = todayRecords.get(todayRecords.size() - 1);

        // Validar sequencia logica
        switch (recordType) {
            case ENTRY:
                if (lastRecord.getRecordType() != RecordType.EXIT) {
                    throw new InvalidOperationException("Nao e possivel registrar entrada sem saida anterior");
                }
                break;
            case EXIT:
                if (lastRecord.getRecordType() == RecordType.EXIT) {
                    throw new InvalidOperationException("Ja existe uma saida registrada");
                }
                if (lastRecord.getRecordType() == RecordType.BREAK_START) {
                    throw new InvalidOperationException("Finalize o intervalo antes de registrar a saida");
                }
                break;
            case BREAK_START:
                if (lastRecord.getRecordType() != RecordType.ENTRY &&
                    lastRecord.getRecordType() != RecordType.BREAK_END) {
                    throw new InvalidOperationException("Registro de intervalo requer entrada previa");
                }
                break;
            case BREAK_END:
                if (lastRecord.getRecordType() != RecordType.BREAK_START) {
                    throw new InvalidOperationException("Nao ha intervalo em aberto");
                }
                break;
        }
    }

    private TimeRecordResponse toResponse(TimeRecord record) {
        return TimeRecordResponse.builder()
                .id(record.getId())
                .employeeId(record.getEmployeeId())
                .recordDate(record.getRecordDate())
                .recordTime(record.getRecordTime())
                .recordDatetime(record.getRecordDatetime())
                .recordType(record.getRecordType())
                .recordTypeLabel(getRecordTypeLabel(record.getRecordType()))
                .source(record.getSource())
                .sourceLabel(getSourceLabel(record.getSource()))
                .status(record.getStatus())
                .statusLabel(getStatusLabel(record.getStatus()))
                .latitude(record.getLatitude())
                .longitude(record.getLongitude())
                .geofenceId(record.getGeofenceId())
                .withinGeofence(record.getWithinGeofence())
                .photoUrl(record.getPhotoUrl())
                .facialMatchConfidence(record.getFacialMatchConfidence())
                .deviceInfo(record.getDeviceInfo())
                .adjustmentId(record.getAdjustmentId())
                .originalTime(record.getOriginalTime())
                .rejectionReason(record.getRejectionReason())
                .approvedBy(record.getApprovedBy())
                .approvedAt(record.getApprovedAt())
                .notes(record.getNotes())
                .createdAt(record.getCreatedAt())
                .build();
    }

    private String getRecordTypeLabel(RecordType type) {
        return switch (type) {
            case ENTRY -> "Entrada";
            case EXIT -> "Saida";
            case BREAK_START -> "Inicio Intervalo";
            case BREAK_END -> "Fim Intervalo";
        };
    }

    private String getSourceLabel(RecordSource source) {
        return switch (source) {
            case WEB -> "Portal Web";
            case MOBILE -> "Aplicativo Mobile";
            case REP -> "REP";
            case BIOMETRIC -> "Biometrico";
            case FACIAL -> "Reconhecimento Facial";
            case MANUAL -> "Manual";
            case IMPORT -> "Importacao";
        };
    }

    private String getStatusLabel(RecordStatus status) {
        return switch (status) {
            case VALID -> "Valido";
            case PENDING_APPROVAL -> "Pendente";
            case APPROVED -> "Aprovado";
            case REJECTED -> "Rejeitado";
            case ADJUSTED -> "Ajustado";
        };
    }

    private void publishEvent(String eventType, TimeRecord record) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventType", eventType);
        event.put("tenantId", record.getTenantId().toString());
        event.put("recordId", record.getId().toString());
        event.put("employeeId", record.getEmployeeId().toString());
        event.put("recordType", record.getRecordType().name());
        event.put("timestamp", LocalDateTime.now().toString());

        kafkaTemplate.send("timesheet.domain.events", record.getEmployeeId().toString(), event);
    }

    public record GeofenceValidationResult(boolean isWithin, UUID geofenceId, String geofenceName) {}
}
