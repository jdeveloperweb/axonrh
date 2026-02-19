package com.axonrh.vacation.service;

import com.axonrh.vacation.client.AiAssistantClient;
import com.axonrh.vacation.client.EmployeeServiceClient;
import com.axonrh.vacation.dto.EmployeeDTO;
import com.axonrh.vacation.dto.MedicalCertificateAnalysisRequest;
import com.axonrh.vacation.dto.MedicalCertificateAnalysisResponse;
import com.axonrh.vacation.entity.LeaveRequest;
import com.axonrh.vacation.entity.enums.LeaveType;
import com.axonrh.vacation.entity.enums.VacationRequestStatus;
import com.axonrh.vacation.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final AiAssistantClient aiAssistantClient;
    private final EmployeeServiceClient employeeServiceClient;

    @Transactional
    public LeaveRequest createLeaveRequest(LeaveRequest request, String certificateText) {
        // Obter dados do colaborador
        EmployeeDTO employee = employeeServiceClient.getEmployee(request.getEmployeeId());
        if (employee != null) {
            request.setEmployeeName(employee.getFullName());
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

        return leaveRequestRepository.save(request);
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
        
        if (payload.containsKey("cid")) request.setCid((String) payload.get("cid"));
        if (payload.containsKey("startDate")) request.setStartDate(java.time.LocalDate.parse((String) payload.get("startDate")));
        if (payload.containsKey("endDate")) request.setEndDate(java.time.LocalDate.parse((String) payload.get("endDate")));
        // Recalcular dias
        if (request.getStartDate() != null && request.getEndDate() != null) {
            request.setDaysCount((int) ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1);
        }
        
        return leaveRequestRepository.save(request);
    }

    @Transactional
    public LeaveRequest updateStatus(UUID id, VacationRequestStatus status, String notes, String cid) {
        LeaveRequest request = getLeaveById(id);
        
        request.setStatus(status);
        if (notes != null) request.setReason(notes);
        if (cid != null) request.setCid(cid);
        
        return leaveRequestRepository.save(request);
    }

    @Transactional
    public void deleteLeave(UUID id) {
        leaveRequestRepository.deleteById(id);
    }
}
