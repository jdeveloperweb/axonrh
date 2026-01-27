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

    public EvaluationService(EvaluationRepository evaluationRepository,
                            EvaluationCycleRepository cycleRepository) {
        this.evaluationRepository = evaluationRepository;
        this.cycleRepository = cycleRepository;
    }

    // ==================== Cycles ====================

    public EvaluationCycle createCycle(UUID tenantId, EvaluationCycle cycle) {
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
        return evaluationRepository.save(evaluation);
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
