package com.axonrh.vacation.service;

import com.axonrh.vacation.client.AiAssistantClient;
import com.axonrh.vacation.client.EmployeeServiceClient;
import com.axonrh.vacation.dto.EmployeeDTO;
import com.axonrh.vacation.dto.MedicalCertificateAnalysisRequest;
import com.axonrh.vacation.dto.MedicalCertificateAnalysisResponse;
import com.axonrh.vacation.entity.LeaveRequest;
import com.axonrh.vacation.entity.enums.LeaveType;
import com.axonrh.vacation.entity.enums.VacationRequestStatus;
import com.axonrh.vacation.repository.CidCodeRepository;
import com.axonrh.vacation.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final AiAssistantClient aiAssistantClient;
    private final EmployeeServiceClient employeeServiceClient;
    private final CidCodeRepository cidCodeRepository;
    private final org.springframework.kafka.core.KafkaTemplate<String, Object> kafkaTemplate;

    public LeaveRequestService(
            LeaveRequestRepository leaveRequestRepository,
            AiAssistantClient aiAssistantClient,
            EmployeeServiceClient employeeServiceClient,
            CidCodeRepository cidCodeRepository,
            @org.springframework.beans.factory.annotation.Qualifier("vacationKafkaTemplate") org.springframework.kafka.core.KafkaTemplate<String, Object> kafkaTemplate) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.aiAssistantClient = aiAssistantClient;
        this.employeeServiceClient = employeeServiceClient;
        this.cidCodeRepository = cidCodeRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Transactional
    public LeaveRequest createLeaveRequest(LeaveRequest request, String certificateText) {
        // Obter dados do colaborador de forma resiliente
        try {
            EmployeeDTO employee = null;
            try {
                employee = employeeServiceClient.getEmployee(request.getEmployeeId());
            } catch (Exception e) {
                log.warn("Falha ao buscar colaborador por ID: {}. Tentando por UserID...", request.getEmployeeId());
                try {
                    employee = employeeServiceClient.getEmployeeByUserId(request.getEmployeeId(), null);
                } catch (Exception e2) {
                    log.error("Falha ao buscar colaborador por UserID: {}", e2.getMessage());
                }
            }

            if (employee != null) {
                request.setEmployeeName(employee.getFullName());
            }
        } catch (Exception e) {
            log.error("Erro geral ao tentar obter dados do colaborador para a licença", e);
        }

        // Se for licença médica e tiver texto do atestado, analisar com IA
        if (request.getType() == LeaveType.MEDICAL && certificateText != null && !certificateText.isBlank()) {
            try {
                MedicalCertificateAnalysisResponse analysis = aiAssistantClient.analyzeCertificate(
                        request.getTenantId(),
                        MedicalCertificateAnalysisRequest.builder()
                                .certificateText(certificateText)
                                .fileName("atestado.txt")
                                .build()
                );

                if (analysis != null) {
                    if (request.getCid() == null) request.setCid(analysis.getCid());
                    if (request.getCidDescription() == null) request.setCidDescription(analysis.getCidDescription());
                    if (request.getDoctorName() == null) request.setDoctorName(analysis.getDoctorName());
                    if (request.getCrm() == null) request.setCrm(analysis.getCrm());
                    
                    // Se a análise retornou dias e o período não foi preenchido, podemos sugerir ou preencher
                    if (analysis.getDays() != null && (request.getStartDate() != null && request.getEndDate() == null)) {
                        request.setEndDate(request.getStartDate().plusDays(analysis.getDays() - 1));
                    }
                }
            } catch (Exception e) {
                log.error("Erro ao analisar atestado com IA", e);
            }
        }

        // Calcular dias se as datas estiverem presentes
        if (request.getStartDate() != null && request.getEndDate() != null) {
            request.setDaysCount((int) ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1);
        }

        // Validate CID and populate description if missing
        // Validate CID and populate description if missing
        if (request.getCid() != null && (request.getCidDescription() == null || request.getCidDescription().isEmpty())) {
            cidCodeRepository.findById(request.getCid())
                    .ifPresent(c -> request.setCidDescription(c.getDescription()));
        }

        LeaveRequest saved = leaveRequestRepository.save(request);
        publishEvent("LEAVE_REQUESTED", saved);
        return saved;
    }

    public List<LeaveRequest> getLeavesByTenant(UUID tenantId) {
        return leaveRequestRepository.findByTenantId(tenantId);
    }

    public List<LeaveRequest> getLeavesByEmployee(UUID tenantId, UUID employeeId) {
        return leaveRequestRepository.findByTenantIdAndEmployeeId(tenantId, employeeId);
    }

    public List<LeaveRequest> getActiveLeaves(UUID tenantId) {
        return leaveRequestRepository.findActiveLeaves(tenantId, java.time.LocalDate.now());
    }

    public LeaveRequest getLeaveById(UUID id) {
        return leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solicitação de licença não encontrada"));
    }

    @Transactional
    public LeaveRequest updateLeave(UUID id, Map<String, Object> payload) {
        LeaveRequest request = getLeaveById(id);
        
        if (payload.containsKey("startDate")) request.setStartDate(java.time.LocalDate.parse((String) payload.get("startDate")));
        if (payload.containsKey("endDate")) request.setEndDate(java.time.LocalDate.parse((String) payload.get("endDate")));
        
        // Update CID Description if CID changed
        if (payload.containsKey("cid")) {
            String newCid = (String) payload.get("cid");
            request.setCid(newCid);
            if (newCid != null && !newCid.isEmpty()) {
                cidCodeRepository.findById(newCid)
                        .ifPresent(c -> request.setCidDescription(c.getDescription()));
            } else {
                request.setCidDescription(null);
            }
        }
        // Recalcular dias
        if (request.getStartDate() != null && request.getEndDate() != null) {
            request.setDaysCount((int) ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1);
        }
        
        return leaveRequestRepository.save(request);
    }

    @Transactional
    public LeaveRequest updateStatus(UUID id, VacationRequestStatus status, String notes, String cid, UUID userId) {
        LeaveRequest request = getLeaveById(id);
        
        request.setStatus(status);
        if (notes != null) request.setReason(notes); // TODO: idealmente ter um campo notes separado
        
        if (cid != null) {
            request.setCid(cid);
            if (!cid.isEmpty()) {
                cidCodeRepository.findById(cid)
                        .ifPresent(c -> request.setCidDescription(c.getDescription()));
            } else {
                request.setCidDescription(null);
            }
        }
        
        request.setUpdatedBy(userId);

        if (status == VacationRequestStatus.APPROVED) {
            request.setApprovedBy(userId);
            request.setApprovedAt(java.time.LocalDateTime.now());
        }
        
        LeaveRequest saved = leaveRequestRepository.save(request);
        
        if (status == VacationRequestStatus.APPROVED) {
            publishEvent("LEAVE_APPROVED", saved);
        } else if (status == VacationRequestStatus.REJECTED) {
            publishEvent("LEAVE_REJECTED", saved);
        }
        
        return saved;
    }

    public MedicalCertificateAnalysisResponse analyzeCertificate(UUID tenantId, MedicalCertificateAnalysisRequest request) {
        log.info("Iniciando analyzeCertificate para o tenant: {}", tenantId);
        try {
            MedicalCertificateAnalysisResponse response = aiAssistantClient.analyzeCertificate(tenantId, request);
            log.info("Chamada ao aiAssistantClient concluída com sucesso");
            return response;
        } catch (Exception e) {
            log.error("FALHA na chamada ao aiAssistantClient: {}", e.getMessage());
            throw e;
        }
    }

    @Transactional
    public void deleteLeave(UUID id, String roles) {
        LeaveRequest request = getLeaveById(id);

        if (request.getStatus() == VacationRequestStatus.APPROVED) {
            boolean isAdmin = false;
            if (roles != null && !roles.isBlank()) {
                isAdmin = java.util.Arrays.stream(roles.split(","))
                        .map(String::trim)
                        .anyMatch(r -> r.equalsIgnoreCase("ADMIN") || r.equalsIgnoreCase("ROLE_ADMIN"));
            }

            if (!isAdmin) {
                throw new RuntimeException("Solicitações aprovadas só podem ser excluídas por um Administrador.");
            }
        }

        leaveRequestRepository.deleteById(id);
    }

    private void publishEvent(String eventType, LeaveRequest request) {
        Map<String, Object> event = new java.util.HashMap<>();
        event.put("eventType", eventType);
        event.put("tenantId", request.getTenantId().toString());
        event.put("requestId", request.getId().toString());
        event.put("employeeId", request.getEmployeeId().toString());
        event.put("employeeName", request.getEmployeeName());
        event.put("status", request.getStatus().name());
        event.put("type", request.getType().name());
        event.put("startDate", request.getStartDate().toString());
        event.put("endDate", request.getEndDate().toString());
        event.put("timestamp", java.time.LocalDateTime.now().toString());
        
        if (request.getCreatedBy() != null) {
            event.put("requesterUserId", request.getCreatedBy().toString());
        }

        // Tentar obter o email do colaborador para a notificação
        try {
            EmployeeDTO employee = employeeServiceClient.getEmployee(request.getEmployeeId());
            if (employee != null) {
                event.put("employeeEmail", employee.getEmail());
                if (employee.getManager() != null) {
                    event.put("managerId", employee.getManager().getId().toString());
                    if (employee.getManager().getUserId() != null) {
                        event.put("managerUserId", employee.getManager().getUserId().toString());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Nao foi possivel obter detalhes do colaborador para o evento: {}", e.getMessage());
        }

        kafkaTemplate.send("vacation.domain.events", request.getEmployeeId().toString(), event);
        log.info("Evento {} enviado para o Kafka para a licença {}", eventType, request.getId());
    }
}
