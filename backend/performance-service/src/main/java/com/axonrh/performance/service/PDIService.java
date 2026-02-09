package com.axonrh.performance.service;

import com.axonrh.performance.entity.PDI;
import com.axonrh.performance.entity.PDIAction;
import com.axonrh.performance.entity.enums.PDIStatus;
import com.axonrh.performance.repository.PDIRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class PDIService {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(PDIService.class);

    private final PDIRepository pdiRepository;
    private final com.axonrh.performance.publisher.PerformanceEventPublisher eventPublisher;

    public PDIService(PDIRepository pdiRepository, com.axonrh.performance.publisher.PerformanceEventPublisher eventPublisher) {
        this.pdiRepository = pdiRepository;
        this.eventPublisher = eventPublisher;
    }

    // ==================== CRUD ====================

    public PDI createPDI(UUID tenantId, PDI pdi) {
        pdi.setTenantId(tenantId);
        if (pdi.getStatus() == null) {
            pdi.setStatus(PDIStatus.DRAFT);
        }
        
        if (pdi.getActions() != null && !pdi.getActions().isEmpty()) {
            pdi.getActions().forEach(action -> action.setPdi(pdi));
            pdi.calculateProgress();
        }
        
        PDI saved = pdiRepository.save(pdi);
        if (saved.getStatus() == PDIStatus.ACTIVE) {
            eventPublisher.publishPDICreated(saved);
        }
        return saved;
    }

    public PDI getPDI(UUID tenantId, UUID pdiId) {
        return pdiRepository.findByTenantIdAndId(tenantId, pdiId)
                .orElseThrow(() -> new EntityNotFoundException("PDI nao encontrado"));
    }

    public PDI updatePDI(UUID tenantId, UUID pdiId, PDI updates) {
        PDI pdi = getPDI(tenantId, pdiId);

        if (pdi.getStatus() != PDIStatus.DRAFT && pdi.getStatus() != PDIStatus.ACTIVE) {
            throw new IllegalStateException("PDI nao pode ser alterado neste status");
        }

        if (updates.getTitle() != null) {
            pdi.setTitle(updates.getTitle());
        }
        if (updates.getDescription() != null) {
            pdi.setDescription(updates.getDescription());
        }
        if (updates.getObjectives() != null) {
            pdi.setObjectives(updates.getObjectives());
        }
        if (updates.getEndDate() != null) {
            pdi.setEndDate(updates.getEndDate());
        }
        if (updates.getFocusAreas() != null) {
            pdi.setFocusAreas(updates.getFocusAreas());
        }
        if (updates.getExpectedOutcomes() != null) {
            pdi.setExpectedOutcomes(updates.getExpectedOutcomes());
        }

        return pdiRepository.save(pdi);
    }

    public void deletePDI(UUID tenantId, UUID pdiId) {
        PDI pdi = getPDI(tenantId, pdiId);
        if (pdi.getStatus() != PDIStatus.DRAFT && pdi.getStatus() != PDIStatus.ACTIVE) {
            throw new IllegalStateException("Apenas PDIs em rascunho ou ativos podem ser excluidos");
        }
        pdiRepository.delete(pdi);
    }

    // ==================== Listing ====================

    public List<PDI> getEmployeePDIs(UUID tenantId, UUID employeeId) {
        logger.info("Fetching PDIs for tenantId: {} and employeeId: {}", tenantId, employeeId);
        List<PDI> pdis = pdiRepository.findByTenantIdAndEmployeeIdOrderByCreatedAtDesc(tenantId, employeeId);
        logger.info("Found {} PDIs", pdis.size());
        return pdis;
    }

    public List<PDI> getActivePDIs(UUID tenantId, UUID employeeId) {
        return pdiRepository.findByTenantIdAndEmployeeIdAndStatus(tenantId, employeeId, PDIStatus.ACTIVE);
    }

    public List<PDI> getTeamPDIs(UUID tenantId, UUID managerId) {
        return pdiRepository.findByTenantIdAndManagerIdOrderByEndDateAsc(tenantId, managerId);
    }

    public List<PDI> getPendingApprovalPDIs(UUID tenantId, UUID managerId) {
        return pdiRepository.findByTenantIdAndManagerIdAndStatus(tenantId, managerId, PDIStatus.PENDING_APPROVAL);
    }

    public List<PDI> getOverduePDIs(UUID tenantId) {
        return pdiRepository.findOverdue(tenantId, LocalDate.now());
    }

    public Page<PDI> getAllPDIs(UUID tenantId, Pageable pageable) {
        return pdiRepository.findByTenantId(tenantId, pageable);
    }

    // ==================== Workflow ====================

    public PDI submitForApproval(UUID tenantId, UUID pdiId) {
        PDI pdi = getPDI(tenantId, pdiId);
        if (pdi.getStatus() != PDIStatus.DRAFT) {
            throw new IllegalStateException("Apenas PDIs em rascunho podem ser submetidos");
        }
        pdi.setStatus(PDIStatus.PENDING_APPROVAL);
        return pdiRepository.save(pdi);
    }

    public PDI approvePDI(UUID tenantId, UUID pdiId, UUID approverId) {
        PDI pdi = getPDI(tenantId, pdiId);
        pdi.approve(approverId);
        PDI saved = pdiRepository.save(pdi);
        eventPublisher.publishPDICreated(saved);
        return saved;
    }

    public PDI activatePDI(UUID tenantId, UUID pdiId) {
        PDI pdi = getPDI(tenantId, pdiId);
        pdi.activate();
        PDI saved = pdiRepository.save(pdi);
        eventPublisher.publishPDICreated(saved);
        return saved;
    }

    public PDI completePDI(UUID tenantId, UUID pdiId) {
        PDI pdi = getPDI(tenantId, pdiId);
        pdi.complete();
        return pdiRepository.save(pdi);
    }

    public PDI cancelPDI(UUID tenantId, UUID pdiId) {
        PDI pdi = getPDI(tenantId, pdiId);
        pdi.cancel();
        return pdiRepository.save(pdi);
    }

    // ==================== Actions ====================

    public PDI addAction(UUID tenantId, UUID pdiId, PDIAction action) {
        PDI pdi = getPDI(tenantId, pdiId);
        pdi.addAction(action);
        return pdiRepository.save(pdi);
    }

    public PDI removeAction(UUID tenantId, UUID pdiId, UUID actionId) {
        PDI pdi = getPDI(tenantId, pdiId);
        pdi.getActions().removeIf(a -> a.getId().equals(actionId));
        pdi.calculateProgress();
        return pdiRepository.save(pdi);
    }

    public PDI startAction(UUID tenantId, UUID pdiId, UUID actionId) {
        PDI pdi = getPDI(tenantId, pdiId);
        PDIAction action = pdi.getActions().stream()
                .filter(a -> a.getId().equals(actionId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Acao nao encontrada"));

        action.start();
        return pdiRepository.save(pdi);
    }

    public PDI completeAction(UUID tenantId, UUID pdiId, UUID actionId,
                              String notes, Integer hoursSpent) {
        PDI pdi = getPDI(tenantId, pdiId);
        PDIAction action = pdi.getActions().stream()
                .filter(a -> a.getId().equals(actionId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Acao nao encontrada"));

        action.complete(notes, hoursSpent);
        pdi.calculateProgress();
        return pdiRepository.save(pdi);
    }

    public PDI updateActionProgress(UUID tenantId, UUID pdiId, UUID actionId, Integer progress) {
        PDI pdi = getPDI(tenantId, pdiId);
        PDIAction action = pdi.getActions().stream()
                .filter(a -> a.getId().equals(actionId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Acao nao encontrada"));

        action.setProgress(progress);
        pdi.calculateProgress();
        return pdiRepository.save(pdi);
    }

    // ==================== From Evaluation ====================

    public PDI createFromEvaluation(UUID tenantId, UUID evaluationId,
                                    UUID employeeId, String employeeName,
                                    UUID managerId, String managerName,
                                    String focusAreas) {
        PDI pdi = new PDI();
        pdi.setTenantId(tenantId);
        pdi.setEvaluationId(evaluationId);
        pdi.setEmployeeId(employeeId);
        pdi.setEmployeeName(employeeName);
        pdi.setManagerId(managerId);
        pdi.setManagerName(managerName);
        pdi.setTitle("PDI - " + employeeName);
        pdi.setFocusAreas(focusAreas);
        pdi.setStartDate(LocalDate.now());
        pdi.setEndDate(LocalDate.now().plusMonths(6));
        pdi.setStatus(PDIStatus.ACTIVE);

        PDI saved = pdiRepository.save(pdi);
        eventPublisher.publishPDICreated(saved);
        return saved;
    }

    // ==================== Statistics ====================

    public PDIStatistics getManagerStatistics(UUID tenantId, UUID managerId) {
        long pendingApproval = pdiRepository.countByManagerAndStatus(tenantId, managerId, PDIStatus.PENDING_APPROVAL);
        long active = pdiRepository.countByManagerAndStatus(tenantId, managerId, PDIStatus.ACTIVE);
        long completed = pdiRepository.countByManagerAndStatus(tenantId, managerId, PDIStatus.COMPLETED);

        List<PDI> overdue = getOverduePDIs(tenantId);
        long overdueCount = overdue.stream()
                .filter(p -> p.getManagerId() != null && p.getManagerId().equals(managerId))
                .count();

        Double avgProgress = pdiRepository.calculateAverageProgress(tenantId);
        if (avgProgress == null) avgProgress = 0.0;

        return new PDIStatistics(
                pendingApproval, active, completed, overdueCount, avgProgress
        );
    }

    public record PDIStatistics(
            long pendingApproval,
            long active,
            long completed,
            long overdue,
            double averageProgress
    ) {}
}
