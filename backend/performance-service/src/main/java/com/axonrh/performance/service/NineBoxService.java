package com.axonrh.performance.service;

import com.axonrh.performance.config.TenantContext;
import com.axonrh.performance.dto.NineBoxEmployee;
import com.axonrh.performance.dto.NineBoxMatrix;
import com.axonrh.performance.dto.NineBoxPosition;
import com.axonrh.performance.entity.Evaluation;
import com.axonrh.performance.repository.EvaluationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * T185-T187 - Servico de Matriz 9Box e identificacao de talentos.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NineBoxService {

    private final EvaluationRepository evaluationRepository;

    /**
     * Gera matriz 9Box para um ciclo de avaliacao.
     */
    @Transactional(readOnly = true)
    public NineBoxMatrix generateMatrix(UUID cycleId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        List<Evaluation> evaluations = evaluationRepository
                .findCompletedByCycleWithScores(tenantId, cycleId);

        // Agrupar por colaborador (pode ter multiplas avaliacoes)
        Map<UUID, List<Evaluation>> byEmployee = evaluations.stream()
                .collect(Collectors.groupingBy(Evaluation::getEvaluateeId));

        // Calcular posicao 9Box para cada colaborador
        List<NineBoxEmployee> employees = new ArrayList<>();
        Map<String, List<NineBoxEmployee>> positionMap = new HashMap<>();

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
                    .filter(e -> e.getPotentialRating() != null)
                    .mapToDouble(e -> e.getPotentialRating())
                    .average()
                    .orElse(2.0); // Padrao: medio

            // Converter para rating 1-3
            int performanceRating = convertToRating(avgPerformance, 1, 5, 1, 3);
            int potentialRating = (int) Math.round(avgPotential);

            // Determinar posicao 9Box
            NineBoxPosition position = determinePosition(performanceRating, potentialRating);

            Evaluation firstEval = empEvaluations.get(0);
            NineBoxEmployee employee = NineBoxEmployee.builder()
                    .employeeId(employeeId)
                    .employeeName(firstEval.getEvaluateeName())
                    .departmentName(firstEval.getEvaluateeDepartmentName())
                    .positionName(firstEval.getEvaluateePosition())
                    .performanceScore(BigDecimal.valueOf(avgPerformance).setScale(2, RoundingMode.HALF_UP))
                    .performanceRating(performanceRating)
                    .potentialRating(potentialRating)
                    .nineBoxPosition(position)
                    .build();

            employees.add(employee);
            positionMap.computeIfAbsent(position.name(), k -> new ArrayList<>()).add(employee);
        }

        // Calcular estatisticas
        Map<String, Integer> positionCounts = new HashMap<>();
        for (NineBoxPosition pos : NineBoxPosition.values()) {
            positionCounts.put(pos.name(), positionMap.getOrDefault(pos.name(), Collections.emptyList()).size());
        }

        // Identificar HiPos (High Potentials)
        List<NineBoxEmployee> hiPos = employees.stream()
                .filter(e -> e.getNineBoxPosition() == NineBoxPosition.STAR ||
                             e.getNineBoxPosition() == NineBoxPosition.HIGH_POTENTIAL ||
                             e.getNineBoxPosition() == NineBoxPosition.FUTURE_STAR)
                .toList();

        // Identificar colaboradores em risco
        List<NineBoxEmployee> atRisk = employees.stream()
                .filter(e -> e.getNineBoxPosition() == NineBoxPosition.UNDERPERFORMER ||
                             e.getNineBoxPosition() == NineBoxPosition.DILEMMA)
                .toList();

        return NineBoxMatrix.builder()
                .cycleId(cycleId)
                .totalEmployees(employees.size())
                .employees(employees)
                .positionCounts(positionCounts)
                .hiPoCount(hiPos.size())
                .atRiskCount(atRisk.size())
                .hiPoPercentage(employees.isEmpty() ? 0 : (hiPos.size() * 100.0 / employees.size()))
                .positions(positionMap)
                .build();
    }

    /**
     * Determina posicao 9Box baseado em performance e potencial.
     */
    public NineBoxPosition determinePosition(int performance, int potential) {
        // Matriz 9Box:
        //          | Baixo Pot (1) | Medio Pot (2) | Alto Pot (3)
        // ---------+---------------+---------------+--------------
        // Alto (3) | WORKHORSE     | KEY_PLAYER    | STAR
        // Medio(2) | SOLID         | CORE          | HIGH_POTENTIAL
        // Baixo(1) | UNDERPERFORMER| DILEMMA       | FUTURE_STAR

        return switch (performance) {
            case 3 -> switch (potential) {
                case 1 -> NineBoxPosition.WORKHORSE;
                case 2 -> NineBoxPosition.KEY_PLAYER;
                case 3 -> NineBoxPosition.STAR;
                default -> NineBoxPosition.CORE;
            };
            case 2 -> switch (potential) {
                case 1 -> NineBoxPosition.SOLID_PERFORMER;
                case 2 -> NineBoxPosition.CORE;
                case 3 -> NineBoxPosition.HIGH_POTENTIAL;
                default -> NineBoxPosition.CORE;
            };
            case 1 -> switch (potential) {
                case 1 -> NineBoxPosition.UNDERPERFORMER;
                case 2 -> NineBoxPosition.DILEMMA;
                case 3 -> NineBoxPosition.FUTURE_STAR;
                default -> NineBoxPosition.DILEMMA;
            };
            default -> NineBoxPosition.CORE;
        };
    }

    /**
     * Converte score de uma escala para outra.
     */
    private int convertToRating(double value, double fromMin, double fromMax, int toMin, int toMax) {
        if (value <= fromMin) return toMin;
        if (value >= fromMax) return toMax;

        double range = fromMax - fromMin;
        double normalized = (value - fromMin) / range;
        double toRange = toMax - toMin;

        return (int) Math.round(toMin + (normalized * toRange));
    }

    /**
     * Identifica candidatos a sucessao para uma posicao.
     */
    @Transactional(readOnly = true)
    public List<NineBoxEmployee> getSuccessionCandidates(UUID cycleId, UUID positionId) {
        NineBoxMatrix matrix = generateMatrix(cycleId);

        // Retornar Stars, High Potentials e Future Stars como candidatos
        return matrix.getEmployees().stream()
                .filter(e -> e.getNineBoxPosition() == NineBoxPosition.STAR ||
                             e.getNineBoxPosition() == NineBoxPosition.HIGH_POTENTIAL ||
                             e.getNineBoxPosition() == NineBoxPosition.FUTURE_STAR)
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
