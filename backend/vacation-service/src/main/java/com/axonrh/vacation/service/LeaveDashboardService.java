package com.axonrh.vacation.service;

import com.axonrh.vacation.client.EmployeeServiceClient;
import com.axonrh.vacation.dto.EmployeeDTO;
import com.axonrh.vacation.dto.LeaveDashboardDTO;
import com.axonrh.vacation.entity.LeaveRequest;
import com.axonrh.vacation.entity.enums.LeaveType;
import com.axonrh.vacation.repository.CidCodeRepository;
import com.axonrh.vacation.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaveDashboardService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeServiceClient employeeServiceClient;
    private final CidCodeRepository cidCodeRepository;

    public LeaveDashboardDTO getDashboardData(UUID tenantId) {
        List<EmployeeDTO> allEmployees = employeeServiceClient.getActiveEmployees();
        List<LeaveRequest> allLeaves = leaveRequestRepository.findByTenantId(tenantId);
        
        LocalDate today = LocalDate.now();
        List<LeaveRequest> activeLeaves = allLeaves.stream()
                .filter(l -> !l.getStartDate().isAfter(today) && !l.getEndDate().isBefore(today))
                .collect(Collectors.toList());

        Set<UUID> employeesOnLeaveIds = activeLeaves.stream()
                .map(LeaveRequest::getEmployeeId)
                .collect(Collectors.toSet());

        // Basic stats
        long totalEmployees = allEmployees.size();
        long employeesOnLeave = employeesOnLeaveIds.size();
        long maleCount = allEmployees.stream().filter(e -> "MALE".equalsIgnoreCase(e.getGender())).count();
        long femaleCount = allEmployees.stream().filter(e -> "FEMALE".equalsIgnoreCase(e.getGender())).count();

        // Ages
        double avgAge = allEmployees.stream()
                .filter(e -> e.getBirthDate() != null)
                .mapToInt(e -> Period.between(e.getBirthDate(), today).getYears())
                .average().orElse(0.0);

        double maleAvgAge = allEmployees.stream()
                .filter(e -> e.getBirthDate() != null && "MALE".equalsIgnoreCase(e.getGender()))
                .mapToInt(e -> Period.between(e.getBirthDate(), today).getYears())
                .average().orElse(0.0);

        double femaleAvgAge = allEmployees.stream()
                .filter(e -> e.getBirthDate() != null && "FEMALE".equalsIgnoreCase(e.getGender()))
                .mapToInt(e -> Period.between(e.getBirthDate(), today).getYears())
                .average().orElse(0.0);

        // Medical leaves
        long medicalLeavesCount = allLeaves.stream().filter(l -> l.getType() == LeaveType.MEDICAL).count();
        
        // Find genders for leaves (requires joining)
        Map<UUID, String> employeeGenderMap = allEmployees.stream()
                .collect(Collectors.toMap(EmployeeDTO::getId, e -> e.getGender() != null ? e.getGender() : "UNKNOWN", (a, b) -> a));

        long maleMedLeaves = allLeaves.stream()
                .filter(l -> l.getType() == LeaveType.MEDICAL && "MALE".equalsIgnoreCase(employeeGenderMap.get(l.getEmployeeId())))
                .count();

        long femaleMedLeaves = allLeaves.stream()
                .filter(l -> l.getType() == LeaveType.MEDICAL && "FEMALE".equalsIgnoreCase(employeeGenderMap.get(l.getEmployeeId())))
                .count();

        // Generations
        List<LeaveDashboardDTO.GenerationStat> generations = calculateGenerations(allEmployees);

        // Reasons
        List<LeaveDashboardDTO.ReasonStat> reasons = calculateReasons(allLeaves, employeesOnLeaveIds);

        // CID
        List<LeaveDashboardDTO.CidStat> cidStats = calculateCidStats(allLeaves);

        return LeaveDashboardDTO.builder()
                .totalEmployees(totalEmployees)
                .employeesOnLeave(employeesOnLeave)
                .maleEmployees(maleCount)
                .femaleEmployees(femaleCount)
                .averageAge(avgAge)
                .maleAverageAge(maleAvgAge)
                .femaleAverageAge(femaleAvgAge)
                .medicalLeavesCount(medicalLeavesCount)
                .maleMedicalLeavesCount(maleMedLeaves)
                .femaleMedicalLeavesCount(femaleMedLeaves)
                .medicalLeavePercentage(totalEmployees > 0 ? (double) medicalLeavesCount / totalEmployees * 100 : 0)
                .generations(generations)
                .reasonDistribution(reasons)
                .cidDistribution(cidStats)
                .genderDistribution(List.of(
                        new LeaveDashboardDTO.GenderStat("Male", maleCount, totalEmployees > 0 ? (double) maleCount / totalEmployees * 100 : 0),
                        new LeaveDashboardDTO.GenderStat("Female", femaleCount, totalEmployees > 0 ? (double) femaleCount / totalEmployees * 100 : 0)
                ))
                .build();
    }

    private List<LeaveDashboardDTO.GenerationStat> calculateGenerations(List<EmployeeDTO> employees) {
        Map<String, Long> genCounts = new HashMap<>();
        LocalDate today = LocalDate.now();
        
        for (EmployeeDTO e : employees) {
            if (e.getBirthDate() == null) continue;
            int year = e.getBirthDate().getYear();
            String gen;
            if (year <= 1964) gen = "Baby Boomers";
            else if (year <= 1980) gen = "Geração X";
            else if (year <= 1996) gen = "Geração Y";
            else gen = "Geração Z";
            
            genCounts.put(gen, genCounts.getOrDefault(gen, 0L) + 1);
        }
        
        return genCounts.entrySet().stream()
                .map(entry -> new LeaveDashboardDTO.GenerationStat(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());
    }

    private List<LeaveDashboardDTO.ReasonStat> calculateReasons(List<LeaveRequest> leaves, Set<UUID> activeEmpIds) {
        Map<LeaveType, Long> typeCounts = leaves.stream()
                .collect(Collectors.groupingBy(LeaveRequest::getType, Collectors.counting()));
        
        long total = leaves.size();
        
        return typeCounts.entrySet().stream()
                .map(entry -> {
                    long count = entry.getValue();
                    long currentOnLeave = leaves.stream()
                            .filter(l -> l.getType() == entry.getKey() && activeEmpIds.contains(l.getEmployeeId()))
                            .map(LeaveRequest::getEmployeeId).distinct().count();
                    
                    return LeaveDashboardDTO.ReasonStat.builder()
                            .reason(translateLeaveType(entry.getKey()))
                            .count(count)
                            .percentage(total > 0 ? (double) count / total * 100 : 0)
                            .currentOnLeave(currentOnLeave)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private List<LeaveDashboardDTO.CidStat> calculateCidStats(List<LeaveRequest> leaves) {
        return leaves.stream()
                .filter(l -> l.getCid() != null)
                .collect(Collectors.groupingBy(l -> l.getCid()))
                .entrySet().stream()
                .map(entry -> {
                    LeaveRequest first = entry.getValue().get(0);
                    String description = first.getCidDescription();
                    
                    // Fallback to repository if description is missing
                    if (description == null || description.isEmpty()) {
                        description = cidCodeRepository.findById(entry.getKey())
                                .map(com.axonrh.vacation.entity.CidCode::getDescription)
                                .orElse("Descrição não encontrada");
                    }

                    return LeaveDashboardDTO.CidStat.builder()
                            .cid(entry.getKey())
                            .chapter(getChapterDescription(entry.getKey()))
                            .description(description)
                            .count(entry.getValue().size())
                            .year(LocalDate.now().getYear())
                            .build();
                })
                .limit(10)
                .collect(Collectors.toList());
    }

    private String getChapterDescription(String cid) {
        if (cid == null || cid.isEmpty()) return "N/A";
        
        char firstChar = Character.toUpperCase(cid.charAt(0));
        
        try {
            if (firstChar >= 'A' && firstChar <= 'B') return "Algumas doenças infecciosas e parasitárias";
            if (firstChar == 'C') return "Neoplasias [tumores]";
            if (firstChar == 'D') {
                if (cid.length() < 3) return "Neoplasias [tumores]";
                try {
                    String numStr = cid.substring(1, 3);
                     // Check if numeric to avoid parse exception if data is weird like 'DAA'
                    if (!numStr.matches("\\d+")) return "Neoplasias [tumores]";
                    
                    int num = Integer.parseInt(cid.substring(1, 3));
                    if (num <= 48) return "Neoplasias [tumores]";
                    else return "Doenças do sangue e órgãos hematopoéticos";
                } catch (Exception e) {
                    return "Neoplasias [tumores]";
                }
            }
            if (firstChar == 'E') return "Doenças endócrinas, nutricionais e metabólicas";
            if (firstChar == 'F') return "Transtornos mentais e comportamentais";
            if (firstChar == 'G') return "Doenças do sistema nervoso";
            if (firstChar == 'H') {
                if (cid.length() < 3) return "Doenças do olho e anexos";
                try {
                    String numStr = cid.substring(1, 3);
                     // Check if numeric
                    if (!numStr.matches("\\d+")) return "Doenças do olho e anexos";
                    
                    int num = Integer.parseInt(cid.substring(1, 3));
                    if (num <= 59) return "Doenças do olho e anexos";
                    else return "Doenças do ouvido e da apófise mastoide";
                } catch (Exception e) {
                    return "Doenças do olho e anexos";
                }
            }
            if (firstChar == 'I') return "Doenças do aparelho circulatório";
            if (firstChar == 'J') return "Doenças do aparelho respiratório";
            if (firstChar == 'K') return "Doenças do aparelho digestivo";
            if (firstChar == 'L') return "Doenças da pele e do tecido subcutâneo";
            if (firstChar == 'M') return "Doenças do sistema osteomuscular e tecido conjuntivo";
            if (firstChar == 'N') return "Doenças do aparelho geniturinário";
            if (firstChar == 'O') return "Gravidez, parto e puerpério";
            if (firstChar == 'P') return "Algumas afecções originadas no período perinatal";
            if (firstChar == 'Q') return "Malformações congênitas, deformidades e anomalias";
            if (firstChar == 'R') return "Sintomas, sinais e achados anormais de exames";
            if (firstChar >= 'S' && firstChar <= 'T') return "Lesões, envenenamento e algumas outras consequências";
            if (firstChar >= 'V' && firstChar <= 'Y') return "Causas externas de morbidade e de mortalidade";
            if (firstChar == 'Z') return "Fatores que influenciam o estado de saúde";
            if (firstChar == 'U') return "Códigos para propósitos especiais";
        } catch (Exception e) {
            return "Desconhecido"; // Fallback for any unexpected error
        }
        
        return "Outros";
    }

    private String translateLeaveType(LeaveType type) {
        return switch (type) {
            case VACATION -> "Férias";
            case MEDICAL -> "Licença Médica";
            case MATERNITY -> "Licença Maternidade";
            case PATERNITY -> "Licença Paternidade";
            case BEREAVEMENT -> "Licença Nojo";
            case MARRIAGE -> "Licença Gala";
            default -> "Outros";
        };
    }
}
