package com.axonrh.performance.service;

import com.axonrh.performance.config.TenantContext;
import com.axonrh.performance.dto.NineBoxEmployee;
import com.axonrh.performance.dto.NineBoxMatrix;
import com.axonrh.performance.dto.NineBoxPosition;
import com.axonrh.performance.entity.Evaluation;
import com.axonrh.performance.entity.EvaluationCycle;
import com.axonrh.performance.entity.enums.EvaluatorType;
import com.axonrh.performance.repository.EvaluationCycleRepository;
import com.axonrh.performance.repository.EvaluationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * T185-T187 - Servico de Matriz 9Box e identificacao de talentos.
 */
@Service
@RequiredArgsConstructor
public class NineBoxService {

    private static final Logger log = LoggerFactory.getLogger(NineBoxService.class);

    private final EvaluationRepository evaluationRepository;
    private final EvaluationCycleRepository cycleRepository;

    /**
     * Gera matriz 9Box para um ciclo de avaliacao.
     */
    @Transactional(readOnly = true)
    public NineBoxMatrix generateMatrix(UUID cycleId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        List<Evaluation> evaluations = evaluationRepository
                .findCompletedForNineBox(tenantId, cycleId, EvaluatorType.MANAGER);

        // Agrupar por colaborador (pode ter multiplas avaliacoes)
        Map<UUID, List<Evaluation>> byEmployee = evaluations.stream()
                .collect(Collectors.groupingBy(Evaluation::getEmployeeId));

        // Calcular posicao 9Box para cada colaborador
        List<NineBoxEmployee> employees = new ArrayList<>();
        for (Map.Entry<UUID, List<Evaluation>> entry : byEmployee.entrySet()) {
            UUID employeeId = entry.getKey();
            List<Evaluation> empEvaluations = entry.getValue();

            // Calcular media de performance (nota final)
            double avgPerformance = empEvaluations.stream()
                    .filter(e -> e.getFinalScore() != null)
                    .mapToDouble(e -> e.getFinalScore().doubleValue())
                    .average()
                    .orElse(0.0);

            // Calcular media de potencial (se disponivel)
            double avgPotential = empEvaluations.stream()
                    .filter(e -> e.getPotentialScore() != null)
                    .mapToDouble(e -> e.getPotentialScore().doubleValue())
                    .average()
                    .orElse(2.0); // Padrao: medio

            Evaluation firstEval = empEvaluations.get(0);
            NineBoxEmployee employee = new NineBoxEmployee();
            employee.setEmployeeId(employeeId.toString());
            employee.setEmployeeName(firstEval.getEmployeeName());
            employee.setPerformanceScore(BigDecimal.valueOf(avgPerformance).setScale(2, RoundingMode.HALF_UP));
            employee.setPotentialScore(BigDecimal.valueOf(avgPotential).setScale(2, RoundingMode.HALF_UP));

            employees.add(employee);
        }

        // Identificar HiPos (High Potentials)
        List<NineBoxEmployee> hiPos = employees.stream()
                .filter(e -> e.getPosition() == NineBoxPosition.STAR ||
                             e.getPosition() == NineBoxPosition.HIGH_POTENTIAL ||
                             e.getPosition() == NineBoxPosition.FUTURE_STAR)
                .toList();

        // Identificar colaboradores em risco
        List<NineBoxEmployee> atRisk = employees.stream()
                .filter(e -> e.getPosition() == NineBoxPosition.UNDERPERFORMER ||
                             e.getPosition() == NineBoxPosition.DILEMMA)
                .toList();

        EvaluationCycle cycle = cycleRepository.findByTenantIdAndId(tenantId, cycleId).orElse(null);
        String cycleName = cycle != null ? cycle.getName() : null;
        NineBoxMatrix matrix = new NineBoxMatrix(cycleId.toString(), cycleName, employees);
        log.debug("Matriz 9Box gerada: {} colaboradores, {} HiPos, {} em risco", employees.size(), hiPos.size(), atRisk.size());
        return matrix;
    }

    /**
     * Identifica candidatos a sucessao para uma posicao.
     */
    @Transactional(readOnly = true)
    public List<NineBoxEmployee> getSuccessionCandidates(UUID cycleId, UUID positionId) {
        NineBoxMatrix matrix = generateMatrix(cycleId);

        // Retornar Stars, High Potentials e Future Stars como candidatos
        return matrix.getEmployees().stream()
                .filter(e -> e.getPosition() == NineBoxPosition.STAR ||
                             e.getPosition() == NineBoxPosition.HIGH_POTENTIAL ||
                             e.getPosition() == NineBoxPosition.FUTURE_STAR)
                .sorted(Comparator.comparing(NineBoxEmployee::getPerformanceScore).reversed())
                .toList();
    }

    /**
     * Obtem recomendacoes de desenvolvimento por posicao 9Box.
     */
    public String getPositionRecommendations(NineBoxPosition position) {
        return switch (position) {
            case STAR -> """
                    - Preparar para promocao e lideranca
                    - Oferecer projetos estrategicos e de alta visibilidade
                    - Programa de mentoria como mentor
                    - Retencao prioritaria com plano de carreira claro
                    """;
            case HIGH_POTENTIAL -> """
                    - Acelerar desenvolvimento de habilidades
                    - Stretch assignments para desenvolver performance
                    - Coaching executivo
                    - Exposicao a diferentes areas do negocio
                    """;
            case FUTURE_STAR -> """
                    - Foco em melhorar performance atual
                    - Feedback continuo e coaching intensivo
                    - Metas claras de curto prazo
                    - Monitorar progresso de perto
                    """;
            case KEY_PLAYER -> """
                    - Reconhecer contribuicoes consistentes
                    - Desenvolver habilidades de lideranca
                    - Avaliar interesse em progressao de carreira
                    - Considerar para posicoes de especialista senior
                    """;
            case CORE -> """
                    - PDI focado em areas de melhoria
                    - Definir proximo nivel de desenvolvimento
                    - Feedback regular sobre expectativas
                    - Treinamentos especificos
                    """;
            case WORKHORSE -> """
                    - Reconhecer alta performance
                    - Avaliar satisfacao e engajamento
                    - Explorar interesses de desenvolvimento
                    - Considerar como mentor tecnico
                    """;
            case SOLID_PERFORMER -> """
                    - Estabelecer metas de melhoria
                    - Treinamentos para desenvolver competencias
                    - Acompanhamento mais frequente
                    - Identificar barreiras de performance
                    """;
            case DILEMMA -> """
                    - Avaliacao profunda da situacao
                    - Conversas de carreira
                    - Considerar realocacao
                    - Plano de acao com prazos definidos
                    """;
            case UNDERPERFORMER -> """
                    - Plano de Melhoria de Performance (PIP)
                    - Feedback claro sobre gaps
                    - Verificar adequacao ao cargo
                    - Considerar desligamento se nao houver melhora
                    """;
        };
    }
}
