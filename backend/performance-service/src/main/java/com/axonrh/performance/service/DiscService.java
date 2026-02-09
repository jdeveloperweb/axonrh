package com.axonrh.performance.service;

import com.axonrh.performance.dto.DiscAssignmentDTO;
import com.axonrh.performance.dto.DiscEvaluationDTO;
import com.axonrh.performance.dto.DiscQuestionDTO;
import com.axonrh.performance.dto.DiscStatisticsDTO;
import com.axonrh.performance.entity.DiscAssignment;
import com.axonrh.performance.entity.DiscEvaluation;
import com.axonrh.performance.entity.DiscQuestion;
import com.axonrh.performance.entity.DiscQuestionnaire;
import com.axonrh.performance.entity.enums.DiscAssessmentStatus;
import com.axonrh.performance.entity.enums.DiscProfileType;
import com.axonrh.performance.repository.DiscAssignmentRepository;
import com.axonrh.performance.repository.DiscEvaluationRepository;
import com.axonrh.performance.repository.DiscQuestionRepository;
import com.axonrh.performance.repository.DiscQuestionnaireRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class DiscService {

    private static final Logger log = LoggerFactory.getLogger(DiscService.class);

    private final DiscQuestionnaireRepository questionnaireRepository;
    private final DiscQuestionRepository questionRepository;
    private final DiscEvaluationRepository evaluationRepository;
    private final DiscAssignmentRepository assignmentRepository;
    private final ObjectMapper objectMapper;
    private final com.axonrh.performance.publisher.PerformanceEventPublisher eventPublisher;

    public DiscService(DiscQuestionnaireRepository questionnaireRepository,
                      DiscQuestionRepository questionRepository,
                      DiscEvaluationRepository evaluationRepository,
                      DiscAssignmentRepository assignmentRepository,
                      ObjectMapper objectMapper,
                      com.axonrh.performance.publisher.PerformanceEventPublisher eventPublisher) {
        this.questionnaireRepository = questionnaireRepository;
        this.questionRepository = questionRepository;
        this.evaluationRepository = evaluationRepository;
        this.assignmentRepository = assignmentRepository;
        this.objectMapper = objectMapper;
        this.eventPublisher = eventPublisher;
    }

    // ==================== Questionnaire ====================

    public List<DiscQuestionDTO> getQuestions(UUID tenantId) {
        // Try to get tenant-specific questionnaire first, then default
        DiscQuestionnaire questionnaire = questionnaireRepository.findAvailableQuestionnaires(tenantId)
            .stream()
            .findFirst()
            .orElseGet(() -> questionnaireRepository.findDefaultQuestionnaire()
                .orElseThrow(() -> new EntityNotFoundException("Nenhum questionario DISC encontrado")));

        List<DiscQuestion> questions = questionRepository.findByQuestionnaireIdWithOptions(questionnaire.getId());

        return questions.stream()
            .map(DiscQuestionDTO::fromEntity)
            .collect(Collectors.toList());
    }

    public List<DiscQuestionDTO> getQuestionsByQuestionnaireId(UUID questionnaireId) {
        List<DiscQuestion> questions = questionRepository.findByQuestionnaireIdWithOptions(questionnaireId);
        return questions.stream()
            .map(DiscQuestionDTO::fromEntity)
            .collect(Collectors.toList());
    }

    // ==================== Evaluation ====================

    public DiscEvaluationDTO getLatestEvaluation(UUID tenantId, UUID employeeId) {
        DiscEvaluation evaluation = evaluationRepository
            .findFirstByTenantIdAndEmployeeIdAndStatusOrderByCompletedAtDesc(
                tenantId, employeeId, DiscAssessmentStatus.COMPLETED)
            .orElse(null);

        if (evaluation == null) {
            return null;
        }

        return DiscEvaluationDTO.fromEntity(evaluation);
    }

    public DiscEvaluationDTO getEvaluation(UUID tenantId, UUID evaluationId) {
        DiscEvaluation evaluation = evaluationRepository.findByTenantIdAndId(tenantId, evaluationId)
            .orElseThrow(() -> new EntityNotFoundException("Avaliacao DISC nao encontrada"));

        return DiscEvaluationDTO.fromEntity(evaluation);
    }

    public List<DiscEvaluationDTO> getEmployeeHistory(UUID tenantId, UUID employeeId) {
        List<DiscEvaluation> evaluations = evaluationRepository
            .findByTenantIdAndEmployeeIdAndStatusOrderByCompletedAtDesc(
                tenantId, employeeId, DiscAssessmentStatus.COMPLETED);

        return evaluations.stream()
            .map(DiscEvaluationDTO::fromEntity)
            .collect(Collectors.toList());
    }

    public Page<DiscEvaluationDTO> listEvaluations(UUID tenantId, Pageable pageable) {
        return evaluationRepository.findByTenantId(tenantId, pageable)
            .map(DiscEvaluationDTO::fromEntity);
    }

    public Page<DiscEvaluationDTO> listEvaluationsByStatus(UUID tenantId, DiscAssessmentStatus status, Pageable pageable) {
        return evaluationRepository.findByTenantIdAndStatus(tenantId, status, pageable)
            .map(DiscEvaluationDTO::fromEntity);
    }

    public DiscEvaluationDTO submitEvaluation(UUID tenantId, UUID employeeId, String employeeName,
                                              Map<String, String> answers) {
        // Check if there's an existing pending evaluation
        DiscEvaluation evaluation = evaluationRepository
            .findFirstByTenantIdAndEmployeeIdAndStatusIn(tenantId, employeeId,
                Arrays.asList(DiscAssessmentStatus.PENDING, DiscAssessmentStatus.IN_PROGRESS))
            .orElse(null);

        if (evaluation == null) {
            // Create new evaluation
            evaluation = new DiscEvaluation();
            evaluation.setTenantId(tenantId);
            evaluation.setEmployeeId(employeeId);
            evaluation.setEmployeeName(employeeName);
        }

        // Calculate scores
        int dCount = 0, iCount = 0, sCount = 0, cCount = 0;
        int totalQuestions = answers.size();

        for (String value : answers.values()) {
            switch (value.toUpperCase()) {
                case "D" -> dCount++;
                case "I" -> iCount++;
                case "S" -> sCount++;
                case "C" -> cCount++;
            }
        }

        // Convert to percentages (0-100)
        int dScore = totalQuestions > 0 ? (dCount * 100) / totalQuestions : 0;
        int iScore = totalQuestions > 0 ? (iCount * 100) / totalQuestions : 0;
        int sScore = totalQuestions > 0 ? (sCount * 100) / totalQuestions : 0;
        int cScore = totalQuestions > 0 ? (cCount * 100) / totalQuestions : 0;

        // Serialize answers to JSON
        String answersJson;
        try {
            answersJson = objectMapper.writeValueAsString(answers);
        } catch (JsonProcessingException e) {
            answersJson = "{}";
        }

        // Complete the evaluation
        evaluation.complete(answersJson, dScore, iScore, sScore, cScore);
        evaluation = evaluationRepository.save(evaluation);

        // If there was an assignment, complete it too
        List<DiscAssignment> pendingAssignments = assignmentRepository
            .findByTenantIdAndEmployeeIdAndStatus(tenantId, employeeId, DiscAssessmentStatus.PENDING);

        for (DiscAssignment assignment : pendingAssignments) {
            assignment.complete(evaluation.getId());
            assignmentRepository.save(assignment);
        }

        return DiscEvaluationDTO.fromEntity(evaluation);
    }

    public DiscEvaluationDTO startEvaluation(UUID tenantId, UUID evaluationId) {
        DiscEvaluation evaluation = evaluationRepository.findByTenantIdAndId(tenantId, evaluationId)
            .orElseThrow(() -> new EntityNotFoundException("Avaliacao DISC nao encontrada"));

        evaluation.start();
        evaluation = evaluationRepository.save(evaluation);

        return DiscEvaluationDTO.fromEntity(evaluation);
    }

    // ==================== Assignment ====================

    public DiscAssignmentDTO assignEvaluation(UUID tenantId, UUID employeeId, String employeeName,
                                              UUID assignedBy, String assignedByName, LocalDate dueDate) {
        if (assignedBy == null) {
            throw new IllegalArgumentException("O avaliador é obrigatório.");
        }
        // Check if employee already has pending assignment
        boolean hasPending = assignmentRepository.existsByTenantIdAndEmployeeIdAndStatusIn(
            tenantId, employeeId, Arrays.asList(DiscAssessmentStatus.PENDING, DiscAssessmentStatus.IN_PROGRESS));

        if (hasPending) {
            throw new IllegalStateException("O colaborador já possui uma avaliação DISC pendente ou em andamento.");
        }

        // Get default questionnaire
        UUID questionnaireId = questionnaireRepository.findDefaultQuestionnaire()
            .map(DiscQuestionnaire::getId)
            .orElseThrow(() -> new EntityNotFoundException("Questionário padrão DISC não encontrado. Configure um questionário padrão antes de atribuir avaliações."));

        // Create assignment
        DiscAssignment assignment = new DiscAssignment();
        assignment.setTenantId(tenantId);
        assignment.setQuestionnaireId(questionnaireId);
        assignment.setEmployeeId(employeeId);
        assignment.setEmployeeName(employeeName);
        assignment.setAssignedBy(assignedBy);
        assignment.setAssignedByName(assignedByName);
        assignment.setDueDate(dueDate);
        assignment.setStatus(DiscAssessmentStatus.PENDING);

        assignment = assignmentRepository.save(assignment);

    // Get questionnaire title for notification
    String qTitle = questionnaireRepository.findById(questionnaireId)
            .map(DiscQuestionnaire::getName)
            .orElse("Avaliação DISC");

    eventPublisher.publishDiscAssigned(assignment, qTitle);

        // Create corresponding evaluation in PENDING status
        DiscEvaluation evaluation = new DiscEvaluation();
        evaluation.setTenantId(tenantId);
        evaluation.setEmployeeId(employeeId);
        evaluation.setEmployeeName(employeeName);
        evaluation.setQuestionnaireId(questionnaireId);
        evaluation.setRequestedBy(assignedBy);
        evaluation.setRequestedAt(LocalDateTime.now());
        evaluation.setDueDate(dueDate);
        evaluation.setStatus(DiscAssessmentStatus.PENDING);

        evaluationRepository.save(evaluation);

        return DiscAssignmentDTO.fromEntity(assignment);
    }

    public List<DiscAssignmentDTO> assignBulk(UUID tenantId, List<UUID> employeeIds,
                                              Map<UUID, String> employeeNames,
                                              UUID assignedBy, String assignedByName, LocalDate dueDate) {
        return employeeIds.stream()
            .filter(empId -> !assignmentRepository.existsByTenantIdAndEmployeeIdAndStatusIn(
                tenantId, empId, Arrays.asList(DiscAssessmentStatus.PENDING, DiscAssessmentStatus.IN_PROGRESS)))
            .map(empId -> {
                String empName = employeeNames.getOrDefault(empId, "Colaborador");
                return assignEvaluation(tenantId, empId, empName, assignedBy, assignedByName, dueDate);
            })
            .collect(Collectors.toList());
    }

    public void cancelAssignment(UUID tenantId, UUID assignmentId) {
        DiscAssignment assignment = assignmentRepository.findByTenantIdAndId(tenantId, assignmentId)
            .orElseThrow(() -> new EntityNotFoundException("Atribuicao nao encontrada"));

        assignment.cancel();
        assignmentRepository.save(assignment);

        // Also cancel corresponding evaluation
        evaluationRepository.findFirstByTenantIdAndEmployeeIdAndStatusIn(
                tenantId, assignment.getEmployeeId(),
                Arrays.asList(DiscAssessmentStatus.PENDING, DiscAssessmentStatus.IN_PROGRESS))
            .ifPresent(eval -> {
                eval.cancel();
                evaluationRepository.save(eval);
            });
    }

    public Page<DiscAssignmentDTO> listAssignments(UUID tenantId, Pageable pageable) {
        return assignmentRepository.findByTenantId(tenantId, pageable)
            .map(DiscAssignmentDTO::fromEntity);
    }

    public Page<DiscAssignmentDTO> listPendingAssignments(UUID tenantId, Pageable pageable) {
        return assignmentRepository.findByTenantIdAndStatus(tenantId, DiscAssessmentStatus.PENDING, pageable)
            .map(DiscAssignmentDTO::fromEntity);
    }

    public List<DiscAssignmentDTO> getPendingForEmployee(UUID tenantId, UUID employeeId) {
        return assignmentRepository.findByTenantIdAndEmployeeIdAndStatusIn(
                tenantId, employeeId, Arrays.asList(DiscAssessmentStatus.PENDING, DiscAssessmentStatus.IN_PROGRESS))
            .stream()
            .map(DiscAssignmentDTO::fromEntity)
            .collect(Collectors.toList());
    }

    // ==================== Statistics ====================

    public DiscStatisticsDTO getStatistics(UUID tenantId) {
        long total = evaluationRepository.countByTenantIdAndStatus(tenantId, DiscAssessmentStatus.COMPLETED)
            + evaluationRepository.countByTenantIdAndStatus(tenantId, DiscAssessmentStatus.PENDING)
            + evaluationRepository.countByTenantIdAndStatus(tenantId, DiscAssessmentStatus.IN_PROGRESS);

        long completed = evaluationRepository.countByTenantIdAndStatus(tenantId, DiscAssessmentStatus.COMPLETED);
        long pending = evaluationRepository.countByTenantIdAndStatus(tenantId, DiscAssessmentStatus.PENDING)
            + evaluationRepository.countByTenantIdAndStatus(tenantId, DiscAssessmentStatus.IN_PROGRESS);
        long overdue = evaluationRepository.countOverdue(tenantId, LocalDate.now());

        int dCount = (int) evaluationRepository.countByPrimaryProfile(tenantId, DiscProfileType.DOMINANCE);
        int iCount = (int) evaluationRepository.countByPrimaryProfile(tenantId, DiscProfileType.INFLUENCE);
        int sCount = (int) evaluationRepository.countByPrimaryProfile(tenantId, DiscProfileType.STEADINESS);
        int cCount = (int) evaluationRepository.countByPrimaryProfile(tenantId, DiscProfileType.CONSCIENTIOUSNESS);

        return new DiscStatisticsDTO(total, completed, pending, overdue, dCount, iCount, sCount, cCount);
    }

    // ==================== Overdue Processing ====================

    public void processOverdueEvaluations(UUID tenantId) {
        List<DiscEvaluation> overdueEvals = evaluationRepository.findOverdue(tenantId, LocalDate.now());
        for (DiscEvaluation eval : overdueEvals) {
            eval.expire();
            evaluationRepository.save(eval);
        }
    }

    /**
     * Job agendado para enviar lembretes de testes DISC pendentes.
     * Terças e Quintas às 10h.
     */
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 10 * * TUE,THU")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public void sendPendingReminders() {
        log.info("Iniciando envio de lembretes para testes DISC pendentes...");
        List<DiscAssignment> pending = assignmentRepository.findAllPending();
        
        for (DiscAssignment assignment : pending) {
            try {
                eventPublisher.publishDiscReminder(assignment);
            } catch (Exception e) {
                log.error("Erro ao enviar lembrete DISC para atribuição {}: {}", assignment.getId(), e.getMessage());
            }
        }
        log.info("Finalizado envio de lembretes para {} testes DISC pendentes.", pending.size());
    }

    public void deleteEvaluation(UUID tenantId, UUID evaluationId) {
        DiscEvaluation evaluation = evaluationRepository.findByTenantIdAndId(tenantId, evaluationId)
            .orElseThrow(() -> new EntityNotFoundException("Avaliacao DISC nao encontrada"));
        evaluationRepository.delete(evaluation);
    }

    public void deleteAssignment(UUID tenantId, UUID assignmentId) {
        DiscAssignment assignment = assignmentRepository.findByTenantIdAndId(tenantId, assignmentId)
            .orElseThrow(() -> new EntityNotFoundException("Atribuicao DISC nao encontrada"));
        assignmentRepository.delete(assignment);
    }

    public void deleteCancelled(UUID tenantId) {
        assignmentRepository.deleteByTenantIdAndStatus(tenantId, DiscAssessmentStatus.CANCELLED);
        evaluationRepository.deleteByTenantIdAndStatus(tenantId, DiscAssessmentStatus.CANCELLED);
    }

    // ==================== Helpers ====================

    public boolean hasCompletedEvaluation(UUID tenantId, UUID employeeId) {
        return evaluationRepository
            .findFirstByTenantIdAndEmployeeIdAndStatusOrderByCompletedAtDesc(
                tenantId, employeeId, DiscAssessmentStatus.COMPLETED)
            .isPresent();
    }

    public boolean hasPendingEvaluation(UUID tenantId, UUID employeeId) {
        return evaluationRepository
            .findFirstByTenantIdAndEmployeeIdAndStatusIn(tenantId, employeeId,
                Arrays.asList(DiscAssessmentStatus.PENDING, DiscAssessmentStatus.IN_PROGRESS))
            .isPresent();
    }
}
