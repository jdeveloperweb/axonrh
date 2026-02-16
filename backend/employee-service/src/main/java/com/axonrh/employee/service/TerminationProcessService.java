package com.axonrh.employee.service;

import com.axonrh.employee.dto.TerminationRequest;
import com.axonrh.employee.dto.TerminationResponse;
import com.axonrh.employee.entity.Employee;
import com.axonrh.employee.entity.TerminationProcess;
import com.axonrh.employee.entity.enums.EmployeeStatus;
import com.axonrh.employee.exception.ResourceNotFoundException;
import com.axonrh.employee.repository.EmployeeRepository;
import com.axonrh.employee.repository.TerminationProcessRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TerminationProcessService {

    private final TerminationProcessRepository repository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeService employeeService;

    @Transactional
    public TerminationResponse initiateTermination(TerminationRequest request, UUID tenantId) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Colaborador não encontrado"));

        TerminationProcess process = repository.findByEmployeeId(request.getEmployeeId())
                .orElse(new TerminationProcess());

        process.setTenantId(tenantId);
        process.setEmployee(employee);
        process.setTerminationType(request.getTerminationType());
        process.setNoticePeriod(request.getNoticePeriod());
        process.setLastWorkDay(request.getLastWorkDay());
        process.setTerminationDate(request.getTerminationDate());
        process.setReason(request.getReason());
        
        process.setReturnedLaptop(request.getReturnedLaptop() != null && request.getReturnedLaptop());
        process.setReturnedMouse(request.getReturnedMouse() != null && request.getReturnedMouse());
        process.setReturnedKeyboard(request.getReturnedKeyboard() != null && request.getReturnedKeyboard());
        process.setReturnedHeadset(request.getReturnedHeadset() != null && request.getReturnedHeadset());
        process.setReturnedBadge(request.getReturnedBadge() != null && request.getReturnedBadge());
        process.setReturnedToken(request.getReturnedToken() != null && request.getReturnedToken());
        process.setOtherEquipment(request.getOtherEquipment());
        process.setEquipmentNotes(request.getEquipmentNotes());
        
        process.setAccountDeactivated(request.getAccountDeactivated() != null && request.getAccountDeactivated());
        process.setEmailDeactivated(request.getEmailDeactivated() != null && request.getEmailDeactivated());
        process.setExitInterviewDone(request.getExitInterviewDone() != null && request.getExitInterviewDone());

        // Garantir que o processo esteja em andamento se estivermos (re)iniciando
        if (process.getCompletedAt() != null || process.getStatus() == com.axonrh.employee.entity.enums.TerminationStatus.COMPLETED) {
            process.setCompletedAt(null);
            process.setCompletedBy(null);
            process.setStatus(com.axonrh.employee.entity.enums.TerminationStatus.IN_PROGRESS);
        }

        // Novos campos
        if (request.getStatus() != null) {
            process.setStatus(com.axonrh.employee.entity.enums.TerminationStatus.valueOf(request.getStatus()));
        }
        process.setDismissalExamDone(request.getDismissalExamDone() != null && request.getDismissalExamDone());
        process.setDismissalExamDate(request.getDismissalExamDate());
        process.setSeverancePayAmount(request.getSeverancePayAmount());
        process.setSeverancePayDate(request.getSeverancePayDate());
        process.setSeverancePayMethod(request.getSeverancePayMethod());
        process.setFinancialNotes(request.getFinancialNotes());
        process.setGeneralNotes(request.getGeneralNotes());

        process = repository.save(process);

        return mapToResponse(process);
    }

    @Transactional
    public TerminationResponse completeTermination(UUID processId, UUID userId, UUID tenantId) {
        TerminationProcess process = repository.findById(processId)
                .orElseThrow(() -> new ResourceNotFoundException("Processo não encontrado"));

        if (!process.getTenantId().equals(tenantId)) {
             throw new ResourceNotFoundException("Processo não pertence ao tenant");
        }

        process.setCompletedAt(LocalDateTime.now());
        process.setCompletedBy(userId);
        process.setStatus(com.axonrh.employee.entity.enums.TerminationStatus.COMPLETED);
        
        // Finalizar status do colaborador, registrar no histórico e disparar eventos via EmployeeService
        employeeService.terminate(process.getEmployee().getId(), process.getTerminationDate(), process.getReason(), userId);

        process = repository.save(process);
        return mapToResponse(process);
    }

    @Transactional
    public TerminationResponse reopenTermination(UUID processId, UUID userId, UUID tenantId) {
        TerminationProcess process = repository.findById(processId)
                .orElseThrow(() -> new ResourceNotFoundException("Processo não encontrado"));

        if (!process.getTenantId().equals(tenantId)) {
             throw new ResourceNotFoundException("Processo não pertence ao tenant");
        }

        process.setCompletedAt(null);
        process.setCompletedBy(null);
        process.setStatus(com.axonrh.employee.entity.enums.TerminationStatus.IN_PROGRESS);

        // Reativar colaborador, registrar no histórico e disparar eventos via EmployeeService
        Employee employee = process.getEmployee();
        employeeService.reactivate(employee.getId(), userId);

        process = repository.save(process);
        return mapToResponse(process);
    }

    @Transactional(readOnly = true)
    public TerminationResponse getByEmployeeId(UUID employeeId) {
        TerminationProcess process = repository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Processo de desligamento não encontrado para este colaborador"));
        return mapToResponse(process);
    }

    @Transactional(readOnly = true)
    public java.util.List<TerminationResponse> listByTenant(UUID tenantId) {
        return repository.findAllByTenantId(tenantId).stream()
                .map(this::mapToResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    private TerminationResponse mapToResponse(TerminationProcess process) {
        TerminationResponse response = new TerminationResponse();
        response.setId(process.getId());
        response.setEmployeeId(process.getEmployee().getId());
        response.setEmployeeName(process.getEmployee().getFullName());
        response.setTerminationType(process.getTerminationType());
        response.setNoticePeriod(process.getNoticePeriod());
        response.setLastWorkDay(process.getLastWorkDay());
        response.setTerminationDate(process.getTerminationDate());
        response.setReason(process.getReason());
        
        if (process.getEmployee() != null) {
            response.setDepartmentName(process.getEmployee().getDepartment() != null ? process.getEmployee().getDepartment().getName() : null);
            response.setPositionTitle(process.getEmployee().getPosition() != null ? process.getEmployee().getPosition().getTitle() : null);
            response.setPhotoUrl(process.getEmployee().getPhotoUrl());
        }
        
        response.setReturnedLaptop(process.getReturnedLaptop());
        response.setReturnedMouse(process.getReturnedMouse());
        response.setReturnedKeyboard(process.getReturnedKeyboard());
        response.setReturnedHeadset(process.getReturnedHeadset());
        response.setReturnedBadge(process.getReturnedBadge());
        response.setReturnedToken(process.getReturnedToken());
        response.setOtherEquipment(process.getOtherEquipment());
        response.setEquipmentNotes(process.getEquipmentNotes());
        
        response.setAccountDeactivated(process.getAccountDeactivated());
        response.setEmailDeactivated(process.getEmailDeactivated());
        response.setExitInterviewDone(process.getExitInterviewDone());
        response.setEsocialSent(process.getEsocialSent());
        
        response.setCreatedAt(process.getCreatedAt());
        response.setCompletedAt(process.getCompletedAt());
        
        // Novos campos
        response.setStatus(process.getStatus() != null ? process.getStatus().name() : null);
        response.setDismissalExamDone(process.getDismissalExamDone());
        response.setDismissalExamDate(process.getDismissalExamDate());
        response.setSeverancePayAmount(process.getSeverancePayAmount());
        response.setSeverancePayDate(process.getSeverancePayDate());
        response.setSeverancePayMethod(process.getSeverancePayMethod());
        response.setFinancialNotes(process.getFinancialNotes());
        response.setGeneralNotes(process.getGeneralNotes());
        return response;
    }
}
