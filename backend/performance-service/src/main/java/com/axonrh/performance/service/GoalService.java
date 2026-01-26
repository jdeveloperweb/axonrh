package com.axonrh.performance.service;

import com.axonrh.performance.entity.Goal;
import com.axonrh.performance.entity.enums.GoalStatus;
import com.axonrh.performance.entity.enums.GoalType;
import com.axonrh.performance.repository.GoalRepository;
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
public class GoalService {

    private final GoalRepository goalRepository;

    public GoalService(GoalRepository goalRepository) {
        this.goalRepository = goalRepository;
    }

    // ==================== CRUD ====================

    public Goal createGoal(UUID tenantId, Goal goal) {
        goal.setTenantId(tenantId);
        return goalRepository.save(goal);
    }

    public Goal getGoal(UUID tenantId, UUID goalId) {
        return goalRepository.findByTenantIdAndId(tenantId, goalId)
                .orElseThrow(() -> new EntityNotFoundException("Meta nao encontrada"));
    }

    public Goal updateGoal(UUID tenantId, UUID goalId, Goal updates) {
        Goal goal = getGoal(tenantId, goalId);

        if (updates.getTitle() != null) {
            goal.setTitle(updates.getTitle());
        }
        if (updates.getDescription() != null) {
            goal.setDescription(updates.getDescription());
        }
        if (updates.getTargetValue() != null) {
            goal.setTargetValue(updates.getTargetValue());
        }
        if (updates.getDueDate() != null) {
            goal.setDueDate(updates.getDueDate());
        }
        if (updates.getWeight() != null) {
            goal.setWeight(updates.getWeight());
        }

        return goalRepository.save(goal);
    }

    public void deleteGoal(UUID tenantId, UUID goalId) {
        Goal goal = getGoal(tenantId, goalId);
        goalRepository.delete(goal);
    }

    // ==================== Listing ====================

    public List<Goal> getEmployeeGoals(UUID tenantId, UUID employeeId) {
        return goalRepository.findByTenantIdAndEmployeeIdOrderByDueDateAsc(tenantId, employeeId);
    }

    public List<Goal> getDepartmentGoals(UUID tenantId, UUID departmentId) {
        return goalRepository.findByTenantIdAndDepartmentIdOrderByDueDateAsc(tenantId, departmentId);
    }

    public Page<Goal> getCycleGoals(UUID tenantId, UUID cycleId, Pageable pageable) {
        return goalRepository.findByTenantIdAndCycleId(tenantId, cycleId, pageable);
    }

    public List<Goal> getGoalsByStatus(UUID tenantId, UUID employeeId, GoalStatus status) {
        return goalRepository.findByTenantIdAndEmployeeIdAndStatus(tenantId, employeeId, status);
    }

    public List<Goal> getOverdueGoals(UUID tenantId) {
        return goalRepository.findOverdue(tenantId, LocalDate.now());
    }

    public List<Goal> getAtRiskGoals(UUID tenantId) {
        return goalRepository.findAtRisk(tenantId);
    }

    // ==================== Key Results (OKRs) ====================

    public List<Goal> getKeyResults(UUID tenantId, UUID parentGoalId) {
        return goalRepository.findByTenantIdAndParentGoalId(tenantId, parentGoalId);
    }

    public Goal createKeyResult(UUID tenantId, UUID parentGoalId, Goal keyResult) {
        Goal parent = getGoal(tenantId, parentGoalId);

        keyResult.setTenantId(tenantId);
        keyResult.setParentGoalId(parentGoalId);
        keyResult.setIsKeyResult(true);
        keyResult.setCycleId(parent.getCycleId());

        return goalRepository.save(keyResult);
    }

    public List<Goal> getCompanyOKRs(UUID tenantId, UUID cycleId) {
        return goalRepository.findByTypeAndCycle(tenantId, GoalType.COMPANY, cycleId);
    }

    // ==================== Progress ====================

    public Goal updateProgress(UUID tenantId, UUID goalId, BigDecimal newValue, String notes, UUID updatedBy) {
        Goal goal = getGoal(tenantId, goalId);
        goal.updateProgress(newValue, notes, updatedBy);

        // Update parent goal progress if this is a key result
        if (goal.getIsKeyResult() && goal.getParentGoalId() != null) {
            updateParentProgress(tenantId, goal.getParentGoalId());
        }

        return goalRepository.save(goal);
    }

    private void updateParentProgress(UUID tenantId, UUID parentGoalId) {
        Goal parent = getGoal(tenantId, parentGoalId);
        List<Goal> keyResults = getKeyResults(tenantId, parentGoalId);

        if (keyResults.isEmpty()) {
            return;
        }

        // Calculate average progress of key results
        BigDecimal totalProgress = keyResults.stream()
                .map(Goal::getProgressPercentage)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal avgProgress = totalProgress.divide(
                BigDecimal.valueOf(keyResults.size()),
                2,
                java.math.RoundingMode.HALF_UP
        );

        parent.setProgressPercentage(avgProgress);
        goalRepository.save(parent);
    }

    public Goal completeGoal(UUID tenantId, UUID goalId) {
        Goal goal = getGoal(tenantId, goalId);
        goal.complete();
        return goalRepository.save(goal);
    }

    public Goal cancelGoal(UUID tenantId, UUID goalId) {
        Goal goal = getGoal(tenantId, goalId);
        goal.cancel();
        return goalRepository.save(goal);
    }

    public Goal markAtRisk(UUID tenantId, UUID goalId) {
        Goal goal = getGoal(tenantId, goalId);
        goal.setStatus(GoalStatus.AT_RISK);
        return goalRepository.save(goal);
    }

    // ==================== Statistics ====================

    public GoalStatistics getEmployeeStatistics(UUID tenantId, UUID employeeId) {
        long completed = goalRepository.countByEmployeeAndStatus(tenantId, employeeId, GoalStatus.COMPLETED);
        long inProgress = goalRepository.countByEmployeeAndStatus(tenantId, employeeId, GoalStatus.IN_PROGRESS);
        long atRisk = goalRepository.countByEmployeeAndStatus(tenantId, employeeId, GoalStatus.AT_RISK);
        long notStarted = goalRepository.countByEmployeeAndStatus(tenantId, employeeId, GoalStatus.NOT_STARTED);

        Double avgProgress = goalRepository.calculateAverageProgress(tenantId, employeeId);
        if (avgProgress == null) avgProgress = 0.0;

        long total = completed + inProgress + atRisk + notStarted;
        double completionRate = total > 0 ? (completed * 100.0 / total) : 0;

        return new GoalStatistics(
                total, completed, inProgress, atRisk, notStarted, avgProgress, completionRate
        );
    }

    public record GoalStatistics(
            long total,
            long completed,
            long inProgress,
            long atRisk,
            long notStarted,
            double averageProgress,
            double completionRate
    ) {}
}
