package com.axonrh.performance.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Representacao completa da Matriz 9Box.
 */
public class NineBoxMatrix {

    private String cycleId;
    private String cycleName;
    private List<NineBoxEmployee> employees;
    private Map<NineBoxPosition, List<NineBoxEmployee>> positionGroups;
    private NineBoxStatistics statistics;

    public NineBoxMatrix() {
        this.employees = new ArrayList<>();
    }

    public NineBoxMatrix(String cycleId, String cycleName, List<NineBoxEmployee> employees) {
        this.cycleId = cycleId;
        this.cycleName = cycleName;
        this.employees = employees;
        this.positionGroups = groupByPosition();
        this.statistics = calculateStatistics();
    }

    private Map<NineBoxPosition, List<NineBoxEmployee>> groupByPosition() {
        return employees.stream()
                .collect(Collectors.groupingBy(NineBoxEmployee::getPosition));
    }

    private NineBoxStatistics calculateStatistics() {
        long total = employees.size();
        long hiPos = employees.stream().filter(e -> e.getPosition().isHiPo()).count();
        long atRisk = employees.stream().filter(e -> e.getPosition().isAtRisk()).count();
        long stars = employees.stream().filter(e -> e.getPosition() == NineBoxPosition.STAR).count();

        return new NineBoxStatistics(
                total,
                hiPos,
                atRisk,
                stars,
                total > 0 ? (hiPos * 100.0 / total) : 0,
                total > 0 ? (atRisk * 100.0 / total) : 0
        );
    }

    public List<NineBoxEmployee> getEmployeesInPosition(NineBoxPosition position) {
        return positionGroups.getOrDefault(position, List.of());
    }

    public int getCountInPosition(NineBoxPosition position) {
        return getEmployeesInPosition(position).size();
    }

    // Getters and Setters
    public String getCycleId() {
        return cycleId;
    }

    public void setCycleId(String cycleId) {
        this.cycleId = cycleId;
    }

    public String getCycleName() {
        return cycleName;
    }

    public void setCycleName(String cycleName) {
        this.cycleName = cycleName;
    }

    public List<NineBoxEmployee> getEmployees() {
        return employees;
    }

    public void setEmployees(List<NineBoxEmployee> employees) {
        this.employees = employees;
        this.positionGroups = groupByPosition();
        this.statistics = calculateStatistics();
    }

    public Map<NineBoxPosition, List<NineBoxEmployee>> getPositionGroups() {
        return positionGroups;
    }

    public NineBoxStatistics getStatistics() {
        return statistics;
    }

    /**
     * Estatisticas da matriz 9Box.
     */
    public record NineBoxStatistics(
            long totalEmployees,
            long hiPoCount,
            long atRiskCount,
            long starCount,
            double hiPoPercentage,
            double atRiskPercentage
    ) {}
}
