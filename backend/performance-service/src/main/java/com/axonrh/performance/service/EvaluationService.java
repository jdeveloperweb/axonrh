package com.axonrh.performance.service;

import com.axonrh.performance.dto.NineBoxEmployee;
import com.axonrh.performance.dto.NineBoxMatrix;
import com.axonrh.performance.entity.Evaluation;
import com.axonrh.performance.entity.EvaluationAnswer;
import com.axonrh.performance.entity.EvaluationCycle;
import com.axonrh.performance.entity.enums.EvaluationStatus;
import com.axonrh.performance.entity.enums.EvaluatorType;
import com.axonrh.performance.repository.EvaluationCycleRepository;
import com.axonrh.performance.repository.EvaluationRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class EvaluationService {

    private final EvaluationRepository evaluationRepository;
    private final EvaluationCycleRepository cycleRepository;
    private final com.axonrh.performance.publisher.PerformanceEventPublisher eventPublisher;

    public EvaluationService(EvaluationRepository evaluationRepository,
                            EvaluationCycleRepository cycleRepository,
                            com.axonrh.performance.publisher.PerformanceEventPublisher eventPublisher) {
        this.evaluationRepository = evaluationRepository;
        this.cycleRepository = cycleRepository;
        this.eventPublisher = eventPublisher;
    }

    // ==================== Cycles ====================

    public EvaluationCycle createCycle(UUID tenantId, EvaluationCycle cycle) {
        // Validar se já existe um ciclo com o mesmo nome e data de início
        if (cycleRepository.existsByTenantIdAndNameAndStartDate(
                tenantId, cycle.getName(), cycle.getStartDate())) {
            throw new IllegalStateException(
                "Já existe um ciclo com o nome '" + cycle.getName() + 
                "' e data de início " + cycle.getStartDate() + 
                ". Por favor, escolha um nome diferente ou altere a data de início."
            );
        }
        
        cycle.setTenantId(tenantId);
        return cycleRepository.save(cycle);
    }

    public EvaluationCycle getCycle(UUID tenantId, UUID cycleId) {
        return cycleRepository.findByTenantIdAndId(tenantId, cycleId)
                .orElseThrow(() -> new EntityNotFoundException("Ciclo nao encontrado"));
    }

    public List<EvaluationCycle> listCycles(UUID tenantId) {
        return cycleRepository.findByTenantIdOrderByStartDateDesc(tenantId);
    }

    public List<EvaluationCycle> getActiveCycles(UUID tenantId) {
        return cycleRepository.findActiveCycles(tenantId, LocalDate.now());
    }

    public EvaluationCycle activateCycle(UUID tenantId, UUID cycleId) {
        EvaluationCycle cycle = getCycle(tenantId, cycleId);
        cycle.activate();
        return cycleRepository.save(cycle);
    }

    public EvaluationCycle completeCycle(UUID tenantId, UUID cycleId) {
        EvaluationCycle cycle = getCycle(tenantId, cycleId);
        cycle.complete();
        return cycleRepository.save(cycle);
    }

    public EvaluationCycle updateCycle(UUID tenantId, UUID cycleId, EvaluationCycle updatedCycle) {
        EvaluationCycle existingCycle = getCycle(tenantId, cycleId);
        
        // Atualizar apenas os campos permitidos
        if (updatedCycle.getName() != null) {
            existingCycle.setName(updatedCycle.getName());
        }
        if (updatedCycle.getDescription() != null) {
            existingCycle.setDescription(updatedCycle.getDescription());
        }
        if (updatedCycle.getCycleType() != null) {
            existingCycle.setCycleType(updatedCycle.getCycleType());
        }
        if (updatedCycle.getStartDate() != null) {
            existingCycle.setStartDate(updatedCycle.getStartDate());
        }
        if (updatedCycle.getEndDate() != null) {
            existingCycle.setEndDate(updatedCycle.getEndDate());
        }
        if (updatedCycle.getEvaluationType() != null) {
            existingCycle.setEvaluationType(updatedCycle.getEvaluationType());
        }
        
        if (updatedCycle.getIncludeSelfEvaluation() != null) {
            existingCycle.setIncludeSelfEvaluation(updatedCycle.getIncludeSelfEvaluation());
        }
        if (updatedCycle.getIncludeManagerEvaluation() != null) {
            existingCycle.setIncludeManagerEvaluation(updatedCycle.getIncludeManagerEvaluation());
        }
        if (updatedCycle.getIncludePeerEvaluation() != null) {
            existingCycle.setIncludePeerEvaluation(updatedCycle.getIncludePeerEvaluation());
        }
        if (updatedCycle.getIncludeSubordinateEvaluation() != null) {
            existingCycle.setIncludeSubordinateEvaluation(updatedCycle.getIncludeSubordinateEvaluation());
        }
        
        if (updatedCycle.getSelfEvaluationStart() != null) {
            existingCycle.setSelfEvaluationStart(updatedCycle.getSelfEvaluationStart());
        }
        if (updatedCycle.getSelfEvaluationEnd() != null) {
            existingCycle.setSelfEvaluationEnd(updatedCycle.getSelfEvaluationEnd());
        }
        if (updatedCycle.getManagerEvaluationStart() != null) {
            existingCycle.setManagerEvaluationStart(updatedCycle.getManagerEvaluationStart());
        }
        if (updatedCycle.getManagerEvaluationEnd() != null) {
            existingCycle.setManagerEvaluationEnd(updatedCycle.getManagerEvaluationEnd());
        }
        
        return cycleRepository.save(existingCycle);
    }

    public void deleteCycle(UUID tenantId, UUID cycleId) {
        EvaluationCycle cycle = getCycle(tenantId, cycleId);
        
        // Verificar se há avaliações vinculadas
        long evaluationCount = evaluationRepository.countByTenantIdAndCycleId(tenantId, cycleId);
        if (evaluationCount > 0) {
            throw new IllegalStateException(
                "Não é possível excluir o ciclo pois existem " + evaluationCount + 
                " avaliações vinculadas. Exclua as avaliações primeiro."
            );
        }
        
        cycleRepository.delete(cycle);
    }

    // ==================== Evaluations ====================

    public Evaluation createEvaluation(UUID tenantId, Evaluation evaluation) {
        // Verificar se ja existe avaliacao
        boolean exists = evaluationRepository.existsByTenantIdAndCycleIdAndEmployeeIdAndEvaluatorIdAndEvaluatorType(
                tenantId, evaluation.getCycle().getId(), evaluation.getEmployeeId(),
                evaluation.getEvaluatorId(), evaluation.getEvaluatorType());

        if (exists) {
            throw new IllegalStateException("Ja existe uma avaliacao para este colaborador neste ciclo");
        }

        evaluation.setTenantId(tenantId);
        Evaluation saved = evaluationRepository.save(evaluation);
        
        // Notify evaluator
        if (saved.getCycle() != null) {
            eventPublisher.publishEvaluationCreated(saved, saved.getCycle().getName());
        }
        
        return saved;
    }

    public Evaluation getEvaluation(UUID tenantId, UUID evaluationId) {
        return evaluationRepository.findByTenantIdAndId(tenantId, evaluationId)
                .orElseThrow(() -> new EntityNotFoundException("Avaliacao nao encontrada"));
    }

    public List<Evaluation> getMyPendingEvaluations(UUID tenantId, UUID evaluatorId) {
        return evaluationRepository.findPendingByEvaluator(tenantId, evaluatorId);
    }

    public List<Evaluation> getMyEvaluationsAsEmployee(UUID tenantId, UUID employeeId) {
        return evaluationRepository.findByTenantIdAndEmployeeIdOrderByCreatedAtDesc(tenantId, employeeId);
    }

    public Page<Evaluation> getEvaluationsByCycle(UUID tenantId, UUID cycleId, Pageable pageable) {
        return evaluationRepository.findByTenantIdAndCycleId(tenantId, cycleId, pageable);
    }

    public Evaluation startEvaluation(UUID tenantId, UUID evaluationId) {
        Evaluation evaluation = getEvaluation(tenantId, evaluationId);
        evaluation.start();
        return evaluationRepository.save(evaluation);
    }

    public Evaluation saveAnswers(UUID tenantId, UUID evaluationId, List<EvaluationAnswer> answers) {
        Evaluation evaluation = getEvaluation(tenantId, evaluationId);

        evaluation.getAnswers().clear();
        for (EvaluationAnswer answer : answers) {
            answer.setEvaluation(evaluation);
            evaluation.getAnswers().add(answer);
        }

        return evaluationRepository.save(evaluation);
    }

    public Evaluation submitEvaluation(UUID tenantId, UUID evaluationId, String feedback,
                                       String strengths, String improvements) {
        Evaluation evaluation = getEvaluation(tenantId, evaluationId);
        evaluation.setOverallFeedback(feedback);
        evaluation.setStrengths(strengths);
        evaluation.setAreasForImprovement(improvements);
        evaluation.submit();
        return evaluationRepository.save(evaluation);
    }

    public Evaluation calibrateEvaluation(UUID tenantId, UUID evaluationId,
                                          BigDecimal newScore, String notes) {
        Evaluation evaluation = getEvaluation(tenantId, evaluationId);
        evaluation.calibrate(newScore, notes);
        return evaluationRepository.save(evaluation);
    }

    public Evaluation completeEvaluation(UUID tenantId, UUID evaluationId) {
        Evaluation evaluation = getEvaluation(tenantId, evaluationId);
        evaluation.complete();
        return evaluationRepository.save(evaluation);
    }

    public Evaluation acknowledgeEvaluation(UUID tenantId, UUID evaluationId, String comments) {
        Evaluation evaluation = getEvaluation(tenantId, evaluationId);
        evaluation.acknowledge(comments);
        return evaluationRepository.save(evaluation);
    }

    // ==================== 9Box Matrix ====================

    public NineBoxMatrix generateNineBoxMatrix(UUID tenantId, UUID cycleId) {
        EvaluationCycle cycle = getCycle(tenantId, cycleId);

        List<Evaluation> evaluations = evaluationRepository.findCompletedForNineBox(
                tenantId, cycleId, EvaluatorType.MANAGER);

        List<NineBoxEmployee> employees = evaluations.stream()
                .map(this::mapToNineBoxEmployee)
                .toList();

        return new NineBoxMatrix(cycleId.toString(), cycle.getName(), employees);
    }

    private NineBoxEmployee mapToNineBoxEmployee(Evaluation evaluation) {
        NineBoxEmployee employee = new NineBoxEmployee(
                evaluation.getEmployeeId().toString(),
                evaluation.getEmployeeName(),
                evaluation.getPerformanceScore(),
                evaluation.getPotentialScore()
        );
        employee.setEvaluationId(evaluation.getId().toString());
        return employee;
    }

    // ==================== Statistics ====================

    public EvaluationStatistics getCycleStatistics(UUID tenantId, UUID cycleId) {
        long pending = evaluationRepository.countByCycleAndStatus(tenantId, cycleId, EvaluationStatus.PENDING);
        long inProgress = evaluationRepository.countByCycleAndStatus(tenantId, cycleId, EvaluationStatus.IN_PROGRESS);
        long submitted = evaluationRepository.countByCycleAndStatus(tenantId, cycleId, EvaluationStatus.SUBMITTED);
        long calibrated = evaluationRepository.countByCycleAndStatus(tenantId, cycleId, EvaluationStatus.CALIBRATED);
        long completed = evaluationRepository.countByCycleAndStatus(tenantId, cycleId, EvaluationStatus.COMPLETED);

        long total = pending + inProgress + submitted + calibrated + completed;
        double completionRate = total > 0 ? (completed * 100.0 / total) : 0;

        return new EvaluationStatistics(
                total, pending, inProgress, submitted, calibrated, completed, completionRate
        );
    }

    public List<Evaluation> getOverdueEvaluations(UUID tenantId) {
        return evaluationRepository.findOverdue(tenantId, LocalDate.now());
    }

    /**
     * Job agendado para enviar lembretes de avaliações atrasadas.
     * Toda manhã de dia útil às 9h.
     */
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 9 * * MON-FRI")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public void sendOverdueReminders() {
        log.info("Iniciando envio de lembretes para avaliações atrasadas...");
        List<Evaluation> overdue = evaluationRepository.findAllOverdue(LocalDate.now());
        
        for (Evaluation eval : overdue) {
            try {
                String cycleName = eval.getCycle() != null ? eval.getCycle().getName() : "Ciclo de Avaliação";
                eventPublisher.publishEvaluationReminder(eval, cycleName);
            } catch (Exception e) {
                log.error("Erro ao enviar lembrete para avaliação {}: {}", eval.getId(), e.getMessage());
            }
        }
        log.info("Finalizado envio de lembretes para {} avaliações atrasadas.", overdue.size());
    }

    public record EvaluationStatistics(
            long total,
            long pending,
            long inProgress,
            long submitted,
            long calibrated,
            long completed,
            double completionRate
    ) {}
}
