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

        process = repository.save(process);

        return mapToResponse(process);
    }

    @Transactional
    public TerminationResponse completeTermination(UUID processId, UUID completedBy) {
        TerminationProcess process = repository.findById(processId)
                .orElseThrow(() -> new ResourceNotFoundException("Processo de desligamento não encontrado"));

        process.setCompletedAt(LocalDateTime.now());
        process.setCompletedBy(completedBy);
        
        // Finalize employee status using EmployeeService to trigger events and history
        employeeService.terminate(
                process.getEmployee().getId(),
                process.getTerminationDate(),
                process.getReason(),
                completedBy
        );

        process = repository.save(process);
        return mapToResponse(process);
    }

    public TerminationResponse getByEmployeeId(UUID employeeId) {
        TerminationProcess process = repository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Processo de desligamento não encontrado para este colaborador"));
        return mapToResponse(process);
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
        return response;
    }
}
