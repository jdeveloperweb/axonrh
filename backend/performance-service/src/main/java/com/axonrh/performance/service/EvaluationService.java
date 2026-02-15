package com.axonrh.performance.service;

import com.axonrh.performance.dto.NineBoxEmployee;
import com.axonrh.performance.dto.NineBoxMatrix;
import com.axonrh.performance.entity.*;
import com.axonrh.performance.entity.enums.EvaluationStatus;
import com.axonrh.performance.entity.enums.EvaluatorType;
import com.axonrh.performance.repository.EvaluationCycleRepository;
import com.axonrh.performance.repository.EvaluationFormRepository;
import com.axonrh.performance.repository.EvaluationRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class EvaluationService {

    private static final Logger log = LoggerFactory.getLogger(EvaluationService.class);

    private final EvaluationRepository evaluationRepository;
    private final EvaluationCycleRepository cycleRepository;
    private final com.axonrh.performance.publisher.PerformanceEventPublisher eventPublisher;
    private final com.axonrh.performance.client.EmployeeServiceClient employeeServiceClient;
    private final com.axonrh.performance.repository.EvaluationFormRepository formRepository;
    private final com.axonrh.performance.repository.GoalRepository goalRepository;

    public EvaluationService(EvaluationRepository evaluationRepository,
                            EvaluationCycleRepository cycleRepository,
                            com.axonrh.performance.publisher.PerformanceEventPublisher eventPublisher,
                            com.axonrh.performance.client.EmployeeServiceClient employeeServiceClient,
                            com.axonrh.performance.repository.EvaluationFormRepository formRepository,
                            com.axonrh.performance.repository.GoalRepository goalRepository) {
        this.evaluationRepository = evaluationRepository;
        this.cycleRepository = cycleRepository;
        this.eventPublisher = eventPublisher;
        this.employeeServiceClient = employeeServiceClient;
        this.formRepository = formRepository;
        this.goalRepository = goalRepository;
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
        EvaluationCycle saved = cycleRepository.save(cycle);
        
        // Gerar avaliacoes automaticamente para todos colaboradores ativos
        generateEvaluations(tenantId, saved);
        
        return saved;
    }

    private void generateEvaluations(UUID tenantId, EvaluationCycle cycle) {
        try {
            List<com.axonrh.performance.dto.EmployeeDTO> employees = employeeServiceClient.getActiveEmployees();
            log.info("Gerando avaliacoes para {} colaboradores no ciclo {}", employees.size(), cycle.getName());

            for (com.axonrh.performance.dto.EmployeeDTO employee : employees) {
                try {
                    // 1. Autoavaliacao (sempre inclusa por padrao se o colaborador tiver usuario)
                    if (Boolean.TRUE.equals(cycle.getIncludeSelfEvaluation()) && employee.getUserId() != null) {
                        Evaluation eval = createEvaluationIfNotExists(tenantId, cycle, employee, employee.getUserId(), employee.getFullName(), EvaluatorType.SELF);
                        if (eval != null) {
                            eventPublisher.publishEvaluationCreated(eval, cycle.getName());
                        }
                    }

                    // 2. Avaliacao do Gestor (se o colaborador tiver gestor com usuario)
                    if (Boolean.TRUE.equals(cycle.getIncludeManagerEvaluation()) && employee.getManager() != null && employee.getManager().getUserId() != null) {
                        Evaluation eval = createEvaluationIfNotExists(tenantId, cycle, employee, employee.getManager().getUserId(), employee.getManager().getName(), EvaluatorType.MANAGER);
                        if (eval != null) {
                            eventPublisher.publishEvaluationCreated(eval, cycle.getName());
                        }
                    }
                } catch (Exception e) {
                    log.error("Erro ao gerar avaliação para o colaborador {} (ID: {}) no ciclo {}: {}", 
                            employee.getFullName(), employee.getId(), cycle.getId(), e.getMessage());
                    // Continua para o proximo colaborador
                }
            }
        } catch (Exception e) {
            log.error("Erro fatal ao acessar servico de colaboradores para o ciclo {}: {}", cycle.getId(), e.getMessage(), e);
        }
    }

    private Evaluation createEvaluationIfNotExists(UUID tenantId, EvaluationCycle cycle, com.axonrh.performance.dto.EmployeeDTO employee, UUID evaluatorId, String evaluatorName, EvaluatorType type) {
        Optional<Evaluation> existingOpt = evaluationRepository.findOptByTenantIdAndCycle_IdAndEmployeeIdAndEvaluatorIdAndEvaluatorType(
                tenantId, cycle.getId(), employee.getId(), evaluatorId, type);

        Evaluation evaluation;
        boolean isNew = false;
        boolean needsSave = false;
        
        if (existingOpt.isPresent()) {
            evaluation = existingOpt.get();
        } else {
            evaluation = new Evaluation();
            evaluation.setTenantId(tenantId);
            evaluation.setCycle(cycle);
            evaluation.setEmployeeId(employee.getId());
            evaluation.setEvaluatorId(evaluatorId);
            evaluation.setEvaluatorType(type);
            evaluation.setStatus(EvaluationStatus.PENDING);
            isNew = true;
            needsSave = true;
        }

        // Atualizar/Corrigir dados do colaborador se necessário
        String empName = employee.getFullName();
        if (empName == null || empName.trim().isEmpty()) {
            empName = "Colaborador " + employee.getId().toString().substring(0, 8);
            log.warn("Nome do colaborador (ID: {}) veio nulo/vazio. Usando fallback: {}", employee.getId(), empName);
        }
        
        if (isNew || evaluation.getEmployeeName() == null || evaluation.getEmployeeName().trim().isEmpty() || "Colaborador não identificado".equals(evaluation.getEmployeeName())) {
            evaluation.setEmployeeName(empName);
            needsSave = true;
        }
        
        if (isNew || evaluation.getEvaluatorName() == null) {
            evaluation.setEvaluatorName(evaluatorName);
            needsSave = true;
        }

        // Se for novo ou se não tiver perguntas (repair), buscar form e preencher
        if (isNew || evaluation.getAnswers() == null || evaluation.getAnswers().isEmpty()) {
            EvaluationForm form = null;
            if (cycle.getDefaultFormId() != null) {
                form = formRepository.findById(cycle.getDefaultFormId()).orElse(null);
            }
            
            if (form == null) {
                form = getOrCreateDefaultForm(tenantId);
            }

            if (isNew) {
                evaluation.setFormId(form.getId());
            }

            // Se for existing mas sem answers, garante que o formId esteja setado se estava nulo
            if (!isNew && evaluation.getFormId() == null) {
                evaluation.setFormId(form.getId());
            }

            // Adicionar perguntas do formulario
            addQuestionsFromForm(evaluation, form);
            needsSave = true;
            log.info("{} avaliação (ID: {}) com {} perguntas para o colaborador {}", isNew ? "Criada" : "Reparada", evaluation.getId(), evaluation.getAnswers().size(), empName);
        }
        
        if (needsSave) {
            return evaluationRepository.save(evaluation);
        }

        return evaluation;
    }

    private EvaluationForm getOrCreateDefaultForm(UUID tenantId) {
        List<EvaluationForm> forms = formRepository.findByTenantIdAndActiveTrue(tenantId);
        if (!forms.isEmpty()) {
            EvaluationForm existing = forms.get(0);
            // Validar se o form tem seções e perguntas. Se não tiver, pode ser um form corrompido de testes anteriores.
            if (existing.getSections() == null || existing.getSections().isEmpty()) {
                log.warn("Formulário padrão encontrado (ID: {}) mas não possui seções. Recriando...", existing.getId());
                formRepository.delete(existing);
                formRepository.flush();
            } else {
                return existing;
            }
        }

        // Criar Formulario Padrao se nao existir
        EvaluationForm defaultForm = EvaluationForm.builder()
                .tenantId(tenantId)
                .name("Formulário Padrão de Performance")
                .description("Formulário padrão com competências técnicas, comportamentais e resultados.")
                .formType("MIXED")
                .active(true)
                .isTemplate(true)
                .sections(new java.util.ArrayList<>())
                .build();

        // Secao 1: Tecnicas
        FormSection technical = FormSection.builder()
                .form(defaultForm)
                .name("Competências Técnicas")
                .sectionOrder(1)
                .sectionType("COMPETENCIES")
                .weight(new BigDecimal("30"))
                .questions(new java.util.ArrayList<>())
                .build();
        addQuestionToSection(technical, "Demonstra conhecimento técnico adequado para suas funções?", 1);
        addQuestionToSection(technical, "Busca atualizar seus conhecimentos constantemente?", 2);
        defaultForm.getSections().add(technical);

        // Secao 2: Comportamentais
        FormSection behavioral = FormSection.builder()
                .form(defaultForm)
                .name("Competências Comportamentais")
                .sectionOrder(2)
                .sectionType("BEHAVIORS")
                .weight(new BigDecimal("30"))
                .questions(new java.util.ArrayList<>())
                .build();
        addQuestionToSection(behavioral, "Comunica-se de forma clara e objetiva?", 1);
        addQuestionToSection(behavioral, "Trabalha bem em equipe e colabora com colegas?", 2);
        addQuestionToSection(behavioral, "Demonstra inteligência emocional em situações de pressão?", 3);
        defaultForm.getSections().add(behavioral);

        // Secao 3: Resultados
        FormSection results = FormSection.builder()
                .form(defaultForm)
                .name("Entregas e Resultados")
                .sectionOrder(3)
                .sectionType("GOALS")
                .weight(new BigDecimal("40"))
                .questions(new java.util.ArrayList<>())
                .build();
        addQuestionToSection(results, "Entrega resultados dentro dos prazos estabelecidos?", 1);
        addQuestionToSection(results, "Demonstra proatividade e iniciativa?", 2);
        addQuestionToSection(results, "A qualidade das entregas atende às expectativas?", 3);
        defaultForm.getSections().add(results);

        // Secao 4: Qualitativo
        FormSection qualitative = FormSection.builder()
                .form(defaultForm)
                .name("Feedback Qualitativo")
                .sectionOrder(4)
                .sectionType("OPEN_QUESTIONS")
                .weight(BigDecimal.ZERO)
                .questions(new java.util.ArrayList<>())
                .build();
        addTextQuestionToSection(qualitative, "Quais foram as principais conquistas no período?", 1);
        addTextQuestionToSection(qualitative, "Quais áreas precisam de desenvolvimento?", 2);
        defaultForm.getSections().add(qualitative);

        return formRepository.save(defaultForm);
    }

    private void addQuestionToSection(FormSection section, String text, int order) {
        section.getQuestions().add(FormQuestion.builder()
                .section(section)
                .questionText(text)
                .questionType("RATING")
                .questionOrder(order)
                .weight(BigDecimal.ONE)
                .required(true)
                .build());
    }

    private void addTextQuestionToSection(FormSection section, String text, int order) {
        section.getQuestions().add(FormQuestion.builder()
                .section(section)
                .questionText(text)
                .questionType("TEXT")
                .questionOrder(order)
                .weight(BigDecimal.ZERO)
                .required(false)
                .build());
    }

    private void addQuestionsFromForm(Evaluation evaluation, EvaluationForm form) {
        List<EvaluationAnswer> answers = new java.util.ArrayList<>();
        for (FormSection section : form.getSections()) {
            for (FormQuestion question : section.getQuestions()) {
                EvaluationAnswer a = new EvaluationAnswer();
                a.setEvaluation(evaluation);
                a.setQuestionId(question.getId());
                a.setQuestionText(question.getQuestionText());
                a.setSectionName(section.getName());
                a.setWeight(question.getWeight());
                answers.add(a);
            }
        }
        evaluation.setAnswers(answers);
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
        
        // 1. Limpar referências em metas
        goalRepository.clearCycleId(tenantId, cycleId);
        
        // 2. Deletar avaliações vinculadas (isso também deleta as respostas via cascade)
        List<Evaluation> evaluations = evaluationRepository.findByTenantIdAndCycle_Id(tenantId, cycleId);
        if (!evaluations.isEmpty()) {
            evaluationRepository.deleteAll(evaluations);
            log.info("Deletadas {} avaliações do ciclo {}", evaluations.size(), cycleId);
        }
        
        // 3. Deletar o ciclo
        cycleRepository.delete(cycle);
    }

    // ==================== Evaluations ====================

    public Evaluation createEvaluation(UUID tenantId, Evaluation evaluation) {
        // Verificar se ja existe avaliacao
        boolean exists = evaluationRepository.existsByTenantIdAndCycle_IdAndEmployeeIdAndEvaluatorIdAndEvaluatorType(
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
        List<Evaluation> evaluations = evaluationRepository.findPendingByEvaluator(tenantId, evaluatorId);
        
        // Auto-heal: Se não houver avaliações mas houver ciclos ativos, tenta sincronizar para este usuário
        if (evaluations.isEmpty()) {
            try {
                syncEvaluationsForUser(tenantId, evaluatorId);
                evaluations = evaluationRepository.findPendingByEvaluator(tenantId, evaluatorId);
            } catch (Exception e) {
                log.error("Erro ao sincronizar avaliações para o usuário {}: {}", evaluatorId, e.getMessage());
            }
        }
        
        return evaluations;
    }

    private void syncEvaluationsForUser(UUID tenantId, UUID userId) {
        List<EvaluationCycle> activeCycles = getActiveCycles(tenantId);
        if (activeCycles.isEmpty()) return;

        try {
            // Busca dados do colaborador vinculado a este User ID
            com.axonrh.performance.dto.EmployeeDTO employee = employeeServiceClient.getEmployeeByUserId(userId);
            if (employee == null) {
                log.warn("Nenhum colaborador encontrado para o userId {} no tenant {}. Sincronização ignorada.", userId, tenantId);
                return;
            }

            log.info("Sincronizando avaliações para {} (UserID: {}) em {} ciclos ativos", employee.getFullName(), userId, activeCycles.size());

            for (EvaluationCycle cycle : activeCycles) {
                // 1. Autoavaliação
                if (Boolean.TRUE.equals(cycle.getIncludeSelfEvaluation())) {
                    createEvaluationIfNotExists(tenantId, cycle, employee, employee.getUserId(), employee.getFullName(), EvaluatorType.SELF);
                }

                // 2. Avaliação como Gestor (se este usuário for gestor de alguém)
                // Nota: A lógica de gerar avaliações para os liderados deste gestor é mais complexa, 
                // mas aqui garantimos que as avaliações que ELE deve preencher sejam geradas.
                // Como getActiveEmployees() já varre todos, se ele for gestor, a ativação do ciclo já deveria ter criado.
                // Mas se ele for um NOVO gestor ou novo colaborador, vamos garantir que a autoavaliação suba.
            }
        } catch (Exception e) {
            log.error("Falha ao sincronizar avaliações: {}", e.getMessage());
        }
    }

    public List<Evaluation> getMyEvaluationsAsEmployee(UUID tenantId, UUID employeeId) {
        return evaluationRepository.findByTenantIdAndEmployeeIdOrderByCreatedAtDesc(tenantId, employeeId);
    }

    public Page<Evaluation> getEvaluationsByCycle(UUID tenantId, UUID cycleId, Pageable pageable) {
        Page<Evaluation> page = evaluationRepository.findByTenantIdAndCycle_Id(tenantId, cycleId, pageable);
        // Limpar answers para evitar LazyInitializationException na serialização da lista, pois não são necessárias na listagem
        page.getContent().forEach(e -> e.setAnswers(null));
        return page;
    }

    public Evaluation startEvaluation(UUID tenantId, UUID evaluationId) {
        Evaluation evaluation = getEvaluation(tenantId, evaluationId);
        evaluation.start();
        return evaluationRepository.save(evaluation);
    }

    public Evaluation saveAnswers(UUID tenantId, UUID evaluationId, List<EvaluationAnswer> answers) {
        Evaluation evaluation = getEvaluation(tenantId, evaluationId);

        // Map existing answers by QuestionID for update
        java.util.Map<UUID, EvaluationAnswer> existingMap = evaluation.getAnswers().stream()
            .collect(java.util.stream.Collectors.toMap(EvaluationAnswer::getQuestionId, a -> a));

        for (EvaluationAnswer newAns : answers) {
            if (newAns.getQuestionId() != null && existingMap.containsKey(newAns.getQuestionId())) {
                EvaluationAnswer existing = existingMap.get(newAns.getQuestionId());
                existing.setScore(newAns.getScore());
                existing.setTextAnswer(newAns.getTextAnswer());
                existing.setComments(newAns.getComments());
            } else {
                newAns.setEvaluation(evaluation);
                evaluation.getAnswers().add(newAns);
            }
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
        Evaluation saved = evaluationRepository.save(evaluation);
        eventPublisher.publishEvaluationCompleted(saved);
        return saved;
    }

    public Evaluation acknowledgeEvaluation(UUID tenantId, UUID evaluationId, String comments) {
        Evaluation evaluation = getEvaluation(tenantId, evaluationId);
        evaluation.acknowledge(comments);
        Evaluation saved = evaluationRepository.save(evaluation);
        eventPublisher.publishEvaluationAcknowledged(saved);
        return saved;
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
