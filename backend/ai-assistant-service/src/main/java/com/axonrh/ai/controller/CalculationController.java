package com.axonrh.ai.controller;

import com.axonrh.ai.service.CalculationService;
import com.axonrh.ai.service.CalculationService.CalculationResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai/calculations")
@RequiredArgsConstructor
public class CalculationController {

    private final CalculationService calculationService;

    @PostMapping("/vacation")
    public ResponseEntity<CalculationResult> calculateVacation(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody VacationCalculationRequest request) {

        CalculationResult result = calculationService.calculateVacation(
                request.getSalary(),
                request.getDays(),
                request.isWithAbono(),
                request.getDependents()
        );

        return ResponseEntity.ok(result);
    }

    @PostMapping("/termination")
    public ResponseEntity<CalculationResult> calculateTermination(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody TerminationCalculationRequest request) {

        CalculationResult result = calculationService.calculateTermination(
                request.getSalary(),
                request.getHireDate(),
                request.getTerminationDate(),
                request.getTerminationType(),
                request.getVacationDaysUsed(),
                request.isWorkedNotice(),
                request.getFgtsBalance()
        );

        return ResponseEntity.ok(result);
    }

    @PostMapping("/overtime")
    public ResponseEntity<CalculationResult> calculateOvertime(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody OvertimeCalculationRequest request) {

        CalculationResult result = calculationService.calculateOvertime(
                request.getHourlyRate(),
                request.getRegularHours(),
                request.getOvertime50Hours(),
                request.getOvertime100Hours(),
                request.getNightHours()
        );

        return ResponseEntity.ok(result);
    }

    @lombok.Data
    public static class VacationCalculationRequest {
        private BigDecimal salary;
        private int days = 30;
        private boolean withAbono = false;
        private int dependents = 0;
    }

    @lombok.Data
    public static class TerminationCalculationRequest {
        private BigDecimal salary;
        private LocalDate hireDate;
        private LocalDate terminationDate;
        private String terminationType; // SEM_JUSTA_CAUSA, JUSTA_CAUSA, PEDIDO_DEMISSAO, ACORDO
        private int vacationDaysUsed = 0;
        private boolean workedNotice = false;
        private BigDecimal fgtsBalance;
    }

    @lombok.Data
    public static class OvertimeCalculationRequest {
        private BigDecimal hourlyRate;
        private double regularHours;
        private double overtime50Hours;
        private double overtime100Hours;
        private double nightHours;
    }
}
