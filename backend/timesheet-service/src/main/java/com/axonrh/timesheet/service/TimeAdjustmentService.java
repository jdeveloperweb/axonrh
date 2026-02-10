package com.axonrh.timesheet.service;

import com.axonrh.timesheet.config.TenantContext;
import com.axonrh.timesheet.dto.TimeAdjustmentRequest;
import com.axonrh.timesheet.dto.TimeAdjustmentResponse;
import com.axonrh.timesheet.entity.TimeAdjustment;
import com.axonrh.timesheet.entity.TimeRecord;
import com.axonrh.timesheet.entity.enums.AdjustmentStatus;
import com.axonrh.timesheet.entity.enums.RecordSource;
import com.axonrh.timesheet.entity.enums.RecordStatus;
import com.axonrh.timesheet.entity.enums.RecordType;
import com.axonrh.timesheet.exception.DuplicateResourceException;
import com.axonrh.timesheet.exception.InvalidOperationException;
import com.axonrh.timesheet.exception.ResourceNotFoundException;
import com.axonrh.timesheet.repository.TimeAdjustmentRepository;
import com.axonrh.timesheet.repository.TimeRecordRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.beans.factory.annotation.Qualifier;
import com.axonrh.timesheet.client.EmployeeServiceClient;
import com.axonrh.timesheet.dto.EmployeeDTO;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * T143 - Servico de ajuste de ponto.
 */
@Slf4j
@Service
public class TimeAdjustmentService {

    private final TimeAdjustmentRepository adjustmentRepository;
    private final TimeRecordRepository timeRecordRepository;
    private final DailySummaryService dailySummaryService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final EmployeeServiceClient employeeClient;

    public TimeAdjustmentService(
            TimeAdjustmentRepository adjustmentRepository,
            TimeRecordRepository timeRecordRepository,
            DailySummaryService dailySummaryService,
            @Qualifier("timesheetKafkaTemplate") KafkaTemplate<String, Object> kafkaTemplate,
            ObjectMapper objectMapper,
            EmployeeServiceClient employeeClient) {
        this.adjustmentRepository = adjustmentRepository;
        this.timeRecordRepository = timeRecordRepository;
        this.dailySummaryService = dailySummaryService;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.employeeClient = employeeClient;
    }

    /**
     * Cria solicitacao de ajuste de ponto.
     */
    @Transactional
    public TimeAdjustmentResponse createAdjustment(TimeAdjustmentRequest request, UUID employeeId, String employeeName) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        // Validar tipo de ajuste
        validateAdjustmentType(request);

        // Para MODIFY ou DELETE, validar registro original
        if (("MODIFY".equals(request.getAdjustmentType()) || "DELETE".equals(request.getAdjustmentType()))
                && request.getOriginalRecordId() != null) {

            TimeRecord original = timeRecordRepository.findByTenantIdAndId(tenantId, request.getOriginalRecordId())
                    .orElseThrow(() -> new ResourceNotFoundException("Registro original nao encontrado"));

            // Verificar se ja existe ajuste pendente para este registro
            if (adjustmentRepository.existsByTenantIdAndOriginalRecordIdAndStatus(
                    tenantId, request.getOriginalRecordId(), AdjustmentStatus.PENDING)) {
                throw new DuplicateResourceException("Ja existe um ajuste pendente para este registro");
            }

            request.setRecordDate(original.getRecordDate());
        }

        TimeAdjustment adjustment = TimeAdjustment.builder()
                .tenantId(tenantId)
                .employeeId(employeeId)
                .employeeName(employeeName)
                .adjustmentType(request.getAdjustmentType())
                .originalRecordId(request.getOriginalRecordId())
                .recordDate(request.getRecordDate())
                .recordType(request.getRecordType())
                .requestedTime(request.getRequestedTime())
                .justification(request.getJustification())
                .attachmentUrls(toJson(request.getAttachmentUrls()))
                .status(AdjustmentStatus.PENDING)
                .build();

        // Buscar horario original se modificando
        if ("MODIFY".equals(request.getAdjustmentType()) && request.getOriginalRecordId() != null) {
            timeRecordRepository.findByTenantIdAndId(tenantId, request.getOriginalRecordId())
                    .ifPresent(r -> adjustment.setOriginalTime(r.getRecordTime()));
        }

        TimeAdjustment saved = adjustmentRepository.save(adjustment);

        publishEvent("ADJUSTMENT_REQUESTED", saved);

        log.info("Solicitacao de ajuste criada - id: {}, colaborador: {}, tipo: {}",
                saved.getId(), employeeId, request.getAdjustmentType());

        return toResponse(saved);
    }

    /**
     * Aprova solicitacao de ajuste.
     */
    @Transactional
    public TimeAdjustmentResponse approveAdjustment(UUID adjustmentId, String notes, UUID approverId, String approverName) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        TimeAdjustment adjustment = adjustmentRepository.findByTenantIdAndId(tenantId, adjustmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Ajuste nao encontrado"));

        if (adjustment.getStatus() != AdjustmentStatus.PENDING) {
            throw new InvalidOperationException("Ajuste nao esta pendente");
        }

        // Executar o ajuste
        UUID createdRecordId = executeAdjustment(tenantId, adjustment, approverId);

        // Atualizar status
        adjustment.setStatus(AdjustmentStatus.APPROVED);
        adjustment.setApproverId(approverId);
        adjustment.setApproverName(approverName);
        adjustment.setApprovedAt(LocalDateTime.now());
        adjustment.setApprovalNotes(notes);
        adjustment.setCreatedRecordId(createdRecordId);

        TimeAdjustment saved = adjustmentRepository.save(adjustment);

        // Atualizar resumo diario
        dailySummaryService.updateDailySummary(tenantId, adjustment.getEmployeeId(), adjustment.getRecordDate());

        publishEvent("ADJUSTMENT_APPROVED", saved);

        log.info("Ajuste aprovado - id: {}, por: {}", adjustmentId, approverId);

        return toResponse(saved);
    }

    /**
     * Rejeita solicitacao de ajuste.
     */
    @Transactional
    public TimeAdjustmentResponse rejectAdjustment(UUID adjustmentId, String reason, UUID approverId, String approverName) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        TimeAdjustment adjustment = adjustmentRepository.findByTenantIdAndId(tenantId, adjustmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Ajuste nao encontrado"));

        if (adjustment.getStatus() != AdjustmentStatus.PENDING) {
            throw new InvalidOperationException("Ajuste nao esta pendente");
        }

        adjustment.setStatus(AdjustmentStatus.REJECTED);
        adjustment.setApproverId(approverId);
        adjustment.setApproverName(approverName);
        adjustment.setApprovedAt(LocalDateTime.now());
        adjustment.setApprovalNotes(reason);

        TimeAdjustment saved = adjustmentRepository.save(adjustment);

        publishEvent("ADJUSTMENT_REJECTED", saved);

        log.info("Ajuste rejeitado - id: {}, motivo: {}", adjustmentId, reason);

        return toResponse(saved);
    }

    /**
     * Cancela solicitacao de ajuste (pelo solicitante).
     */
    @Transactional
    public TimeAdjustmentResponse cancelAdjustment(UUID adjustmentId, UUID employeeId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        TimeAdjustment adjustment = adjustmentRepository.findByTenantIdAndId(tenantId, adjustmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Ajuste nao encontrado"));

        if (!adjustment.getEmployeeId().equals(employeeId)) {
            throw new InvalidOperationException("Apenas o solicitante pode cancelar o ajuste");
        }

        if (adjustment.getStatus() != AdjustmentStatus.PENDING) {
            throw new InvalidOperationException("Ajuste nao pode ser cancelado");
        }

        adjustment.setStatus(AdjustmentStatus.CANCELLED);

        TimeAdjustment saved = adjustmentRepository.save(adjustment);

        log.info("Ajuste cancelado - id: {}", adjustmentId);

        return toResponse(saved);
    }

    /**
     * Busca ajustes pendentes com filtro por permissao.
     */
    @Transactional(readOnly = true)
    public Page<TimeAdjustmentResponse> getPendingAdjustments(Jwt jwt, Pageable pageable) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        UUID userId = UUID.fromString(jwt.getSubject());

        // Extrai permissões e roles do JWT
        List<String> roles = jwt.getClaimAsStringList("roles");
        if (roles == null) roles = Collections.emptyList();
        
        List<String> permissions = jwt.getClaimAsStringList("permissions");
        if (permissions == null) permissions = Collections.emptyList();

        log.debug("Buscando ajustes pendentes - Usuario: {}, Roles: {}, Permissions: {}", userId, roles, permissions);

        boolean hasBroadAccess = roles.stream()
                .anyMatch(role -> List.of("ROLE_ADMIN", "ROLE_RH", "ROLE_GESTOR_RH", "ROLE_ANALISTA_DP").contains(role))
                || permissions.contains("ADMIN");

        if (hasBroadAccess) {
            log.debug("Usuario possui acesso amplo. Retornando todas as pendencias do tenant {}", tenantId);
            return adjustmentRepository
                    .findByTenantIdAndStatusOrderByCreatedAtAsc(tenantId, AdjustmentStatus.PENDING, pageable)
                    .map(this::toResponse);
        }

        // Se tem permissão de aprovar ou é identificado como líder, filtra pelos subordinados
        boolean canApprove = permissions.contains("TIMESHEET:APPROVE") || permissions.contains("APPROVE");
        boolean isLider = roles.contains("ROLE_LIDER") || roles.contains("LIDER") || roles.contains("GESTOR") || roles.contains("ROLE_GESTOR");

        if (canApprove || isLider) {
            List<UUID> subordinateUserIds = getSubordinateUserIds(userId);
            log.debug("Usuario e LIDER/Aprovador. Subordinados encontrados: {}", subordinateUserIds.size());
            if (!subordinateUserIds.isEmpty()) {
                return adjustmentRepository
                        .findByEmployeesAndStatus(tenantId, subordinateUserIds, AdjustmentStatus.PENDING, pageable)
                        .map(this::toResponse);
            }
        }

        log.warn("Nenhum ajuste pendente encontrado ou usuario sem permissao de gestao. Roles: {}, Perms: {}", roles, permissions);
        return Page.empty(pageable);
    }

    private List<UUID> getSubordinateUserIds(UUID leaderUserId) {
        try {
            log.debug("Buscando subordinados para o UserID do lider: {}", leaderUserId);
            EmployeeDTO leader = employeeClient.getEmployeeByUserId(leaderUserId);
            if (leader != null) {
                log.debug("Lider encontrado no employee-service: {} (ID: {})", leader.getFullName(), leader.getId());
                List<EmployeeDTO> subordinates = employeeClient.getSubordinates(leader.getId());
                if (subordinates != null && !subordinates.isEmpty()) {
                    List<UUID> userIds = subordinates.stream()
                            .map(EmployeeDTO::getUserId)
                            .filter(java.util.Objects::nonNull)
                            .toList();
                    log.debug("Total de subordinados: {}. Subordinados com UserID: {}", subordinates.size(), userIds.size());
                    return userIds;
                } else {
                    log.warn("Lider {} nao possui subordinados diretos no sistema.", leader.getFullName());
                }
            } else {
                log.warn("Nenhum registro de colaborador encontrado para o UserID: {}", leaderUserId);
            }
        } catch (Exception e) {
            log.error("Erro ao buscar subordinados para o lider {}: {}", leaderUserId, e.getMessage());
        }
        return Collections.emptyList();
    }

    /**
     * Busca ajustes de um colaborador.
     */
    @Transactional(readOnly = true)
    public Page<TimeAdjustmentResponse> getEmployeeAdjustments(UUID employeeId, Pageable pageable) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        return adjustmentRepository
                .findByTenantIdAndEmployeeIdOrderByCreatedAtDesc(tenantId, employeeId, pageable)
                .map(this::toResponse);
    }

    /**
     * Contagem de ajustes pendentes com filtro.
     */
    @Transactional(readOnly = true)
    public long countPendingAdjustments(Jwt jwt) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        UUID userId = UUID.fromString(jwt.getSubject());

        List<String> permissions = jwt.getClaimAsStringList("permissions");
        if (permissions == null) permissions = Collections.emptyList();

        boolean hasBroadAccess = roles.stream()
                .anyMatch(role -> List.of("ROLE_ADMIN", "ROLE_RH", "ROLE_GESTOR_RH", "ROLE_ANALISTA_DP").contains(role))
                || permissions.contains("ADMIN");

        if (hasBroadAccess) {
            return adjustmentRepository.countByTenantIdAndStatus(tenantId, AdjustmentStatus.PENDING);
        }

        boolean canApprove = permissions.contains("TIMESHEET:APPROVE") || permissions.contains("APPROVE");
        boolean isLider = roles.contains("ROLE_LIDER") || roles.contains("LIDER") || roles.contains("GESTOR") || roles.contains("ROLE_GESTOR");

        if (canApprove || isLider) {
            List<UUID> subordinateUserIds = getSubordinateUserIds(userId);
            if (!subordinateUserIds.isEmpty()) {
                return adjustmentRepository.countByEmployeesAndStatus(tenantId, subordinateUserIds, AdjustmentStatus.PENDING);
            }
        }

        return 0L;
    }

    // ==================== Metodos Privados ====================

    private void validateAdjustmentType(TimeAdjustmentRequest request) {
        String type = request.getAdjustmentType();
        if (!"ADD".equals(type) && !"MODIFY".equals(type) && !"DELETE".equals(type)) {
            throw new InvalidOperationException("Tipo de ajuste invalido: " + type);
        }

        if (("MODIFY".equals(type) || "DELETE".equals(type)) && request.getOriginalRecordId() == null) {
            throw new InvalidOperationException("ID do registro original e obrigatorio para " + type);
        }
    }

    private UUID executeAdjustment(UUID tenantId, TimeAdjustment adjustment, UUID approverId) {
        return switch (adjustment.getAdjustmentType()) {
            case "ADD" -> createNewRecord(tenantId, adjustment, approverId);
            case "MODIFY" -> modifyExistingRecord(tenantId, adjustment, approverId);
            case "DELETE" -> deleteExistingRecord(tenantId, adjustment, approverId);
            default -> throw new InvalidOperationException("Tipo de ajuste desconhecido");
        };
    }

    private UUID createNewRecord(UUID tenantId, TimeAdjustment adjustment, UUID approverId) {
        TimeRecord newRecord = TimeRecord.builder()
                .tenantId(tenantId)
                .employeeId(adjustment.getEmployeeId())
                .recordDate(adjustment.getRecordDate())
                .recordTime(adjustment.getRequestedTime())
                .recordDatetime(LocalDateTime.of(adjustment.getRecordDate(), adjustment.getRequestedTime()))
                .recordType(adjustment.getRecordType())
                .source(RecordSource.MANUAL)
                .status(RecordStatus.ADJUSTED)
                .adjustmentId(adjustment.getId())
                .notes("Incluido via ajuste #" + adjustment.getId())
                .createdBy(approverId)
                .build();

        TimeRecord saved = timeRecordRepository.save(newRecord);
        return saved.getId();
    }

    private UUID modifyExistingRecord(UUID tenantId, TimeAdjustment adjustment, UUID approverId) {
        TimeRecord original = timeRecordRepository.findByTenantIdAndId(tenantId, adjustment.getOriginalRecordId())
                .orElseThrow(() -> new ResourceNotFoundException("Registro original nao encontrado"));

        original.setOriginalTime(original.getRecordTime());
        original.setRecordTime(adjustment.getRequestedTime());
        original.setRecordDatetime(LocalDateTime.of(original.getRecordDate(), adjustment.getRequestedTime()));
        original.setStatus(RecordStatus.ADJUSTED);
        original.setAdjustmentId(adjustment.getId());
        original.setNotes("Ajustado via solicitacao #" + adjustment.getId());
        original.setUpdatedBy(approverId);

        timeRecordRepository.save(original);
        return original.getId();
    }

    private UUID deleteExistingRecord(UUID tenantId, TimeAdjustment adjustment, UUID approverId) {
        TimeRecord original = timeRecordRepository.findByTenantIdAndId(tenantId, adjustment.getOriginalRecordId())
                .orElseThrow(() -> new ResourceNotFoundException("Registro original nao encontrado"));

        // Soft delete - marca como rejeitado
        original.setStatus(RecordStatus.REJECTED);
        original.setRejectionReason("Excluido via ajuste #" + adjustment.getId());
        original.setAdjustmentId(adjustment.getId());
        original.setUpdatedBy(approverId);

        timeRecordRepository.save(original);
        return original.getId();
    }

    private TimeAdjustmentResponse toResponse(TimeAdjustment adjustment) {
        return TimeAdjustmentResponse.builder()
                .id(adjustment.getId())
                .employeeId(adjustment.getEmployeeId())
                .employeeName(adjustment.getEmployeeName())
                .adjustmentType(adjustment.getAdjustmentType())
                .adjustmentTypeLabel(getAdjustmentTypeLabel(adjustment.getAdjustmentType()))
                .originalRecordId(adjustment.getOriginalRecordId())
                .recordDate(adjustment.getRecordDate())
                .recordType(adjustment.getRecordType())
                .recordTypeLabel(getRecordTypeLabel(adjustment.getRecordType()))
                .originalTime(adjustment.getOriginalTime())
                .requestedTime(adjustment.getRequestedTime())
                .justification(adjustment.getJustification())
                .attachmentUrls(fromJson(adjustment.getAttachmentUrls()))
                .status(adjustment.getStatus())
                .statusLabel(getStatusLabel(adjustment.getStatus()))
                .approverId(adjustment.getApproverId())
                .approverName(adjustment.getApproverName())
                .approvedAt(adjustment.getApprovedAt())
                .approvalNotes(adjustment.getApprovalNotes())
                .createdRecordId(adjustment.getCreatedRecordId())
                .createdAt(adjustment.getCreatedAt())
                .updatedAt(adjustment.getUpdatedAt())
                .build();
    }

    private String getAdjustmentTypeLabel(String type) {
        return switch (type) {
            case "ADD" -> "Inclusao";
            case "MODIFY" -> "Alteracao";
            case "DELETE" -> "Exclusao";
            default -> type;
        };
    }

    private String getRecordTypeLabel(RecordType type) {
        return switch (type) {
            case ENTRY -> "Entrada";
            case EXIT -> "Saida";
            case BREAK_START -> "Inicio Intervalo";
            case BREAK_END -> "Fim Intervalo";
        };
    }

    private String getStatusLabel(AdjustmentStatus status) {
        return switch (status) {
            case PENDING -> "Pendente";
            case APPROVED -> "Aprovado";
            case REJECTED -> "Rejeitado";
            case CANCELLED -> "Cancelado";
        };
    }

    private String toJson(List<String> list) {
        if (list == null || list.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private List<String> fromJson(String json) {
        if (json == null || json.isEmpty()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            return Collections.emptyList();
        }
    }

    private void publishEvent(String eventType, TimeAdjustment adjustment) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventType", eventType);
            event.put("tenantId", adjustment.getTenantId().toString());
            event.put("adjustmentId", adjustment.getId().toString());
            event.put("employeeId", adjustment.getEmployeeId().toString());
            event.put("employeeName", adjustment.getEmployeeName());
            event.put("recordDate", adjustment.getRecordDate().toString());
            event.put("status", adjustment.getStatus().name());
            event.put("timestamp", LocalDateTime.now().toString());

            // Fetch User IDs
            try {
                EmployeeDTO employee = employeeClient.getEmployee(adjustment.getEmployeeId());
                if (employee != null) {
                    if (employee.getUserId() != null) {
                        event.put("requesterUserId", employee.getUserId().toString());
                    }
                    
                    // Fetch manager
                    if (employee.getManager() != null && employee.getManager().getId() != null) {
                        try {
                            EmployeeDTO manager = employeeClient.getEmployee(employee.getManager().getId());
                            if (manager != null && manager.getUserId() != null) {
                                event.put("managerUserId", manager.getUserId().toString());
                            }
                        } catch (Exception ex) {
                            log.warn("Erro ao buscar gerente: {}", ex.getMessage());
                        }
                    }
                }
            } catch (Exception e) {
                 log.warn("Erro ao buscar dados do colaborador para evento: {}", e.getMessage());
            }

            kafkaTemplate.send("timesheet.domain.events", adjustment.getEmployeeId().toString(), event);
        } catch (Exception e) {
            log.error("Erro ao enviar evento para o Kafka: {}", e.getMessage());
        }
    }
}
