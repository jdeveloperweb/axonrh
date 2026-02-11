package com.axonrh.timesheet.controller;

import com.axonrh.timesheet.dto.OvertimeBankResponse;
import com.axonrh.timesheet.dto.OvertimeBankSummary;
import com.axonrh.timesheet.service.OvertimeBankService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/**
 * Controller de banco de horas.
 */
@RestController
@RequestMapping("/api/v1/timesheet/overtime-bank")
@RequiredArgsConstructor
@Tag(name = "Overtime Bank", description = "API de banco de horas")
public class OvertimeBankController {

    private final OvertimeBankService overtimeBankService;
    private final com.axonrh.timesheet.client.EmployeeServiceClient employeeClient;
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(OvertimeBankController.class);

    @GetMapping("/employee/{employeeId}/balance")
    @Operation(summary = "Saldo atual", description = "Retorna o saldo atual do banco de horas")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:READ', 'TIMESHEET:UPDATE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getCurrentBalance(
            @PathVariable String employeeId,
            @AuthenticationPrincipal Jwt jwt) {
        
        UUID resolvedId = resolveEmployeeId(employeeId, jwt);
        int balance = overtimeBankService.getCurrentBalance(resolvedId);
        return ResponseEntity.ok(Map.of(
                "employeeId", resolvedId,
                "balanceMinutes", balance,
                "balanceFormatted", formatMinutes(balance),
                "isPositive", balance >= 0
        ));
    }

    @GetMapping("/employee/{employeeId}/summary")
    @Operation(summary = "Resumo do banco de horas", description = "Retorna resumo completo do banco de horas")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:READ', 'TIMESHEET:UPDATE', 'ADMIN')")
    public ResponseEntity<OvertimeBankSummary> getSummary(
            @PathVariable String employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal Jwt jwt) {

        UUID resolvedId = resolveEmployeeId(employeeId, jwt);
        OvertimeBankSummary summary = overtimeBankService.getSummary(resolvedId, startDate, endDate);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/employee/{employeeId}/movements")
    @Operation(summary = "Movimentacoes", description = "Lista movimentacoes do banco de horas")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:READ', 'TIMESHEET:UPDATE', 'ADMIN')")
    public ResponseEntity<Page<OvertimeBankResponse>> getMovements(
            @PathVariable String employeeId,
            @AuthenticationPrincipal Jwt jwt,
            Pageable pageable) {

        UUID resolvedId = resolveEmployeeId(employeeId, jwt);
        Page<OvertimeBankResponse> movements = overtimeBankService.getMovements(resolvedId, pageable);
        return ResponseEntity.ok(movements);
    }

    @PostMapping("/employee/{employeeId}/debit")
    @Operation(summary = "Registrar compensacao", description = "Registra compensacao de horas (folga)")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:UPDATE', 'ADMIN')")
    public ResponseEntity<OvertimeBankResponse> addDebit(
            @PathVariable String employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam int minutes,
            @RequestParam(required = false) String description,
            @AuthenticationPrincipal Jwt jwt) {

        UUID resolvedId = resolveEmployeeId(employeeId, jwt);
        UUID userId = UUID.fromString(jwt.getSubject());
        OvertimeBankResponse response = overtimeBankService.addDebit(
                resolvedId, date, minutes, description, userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/employee/{employeeId}/adjustment")
    @Operation(summary = "Ajuste manual", description = "Registra ajuste manual no banco de horas")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:UPDATE', 'ADMIN')")
    public ResponseEntity<OvertimeBankResponse> addAdjustment(
            @PathVariable String employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam int minutes,
            @RequestParam String description,
            @AuthenticationPrincipal Jwt jwt) {

        UUID resolvedId = resolveEmployeeId(employeeId, jwt);
        UUID approverId = UUID.fromString(jwt.getSubject());
        OvertimeBankResponse response = overtimeBankService.addAdjustment(
                resolvedId, date, minutes, description, approverId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/employee/{employeeId}/payout")
    @Operation(summary = "Pagamento de horas", description = "Registra pagamento de horas extras em dinheiro")
    @PreAuthorize("hasAnyAuthority('TIMESHEET:UPDATE', 'ADMIN')")
    public ResponseEntity<OvertimeBankResponse> addPayout(
            @PathVariable String employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam int minutes,
            @RequestParam(required = false) String description,
            @AuthenticationPrincipal Jwt jwt) {

        UUID resolvedId = resolveEmployeeId(employeeId, jwt);
        UUID approverId = UUID.fromString(jwt.getSubject());
        OvertimeBankResponse response = overtimeBankService.addPayout(
                resolvedId, date, minutes, description, approverId);
        return ResponseEntity.ok(response);
    }

    private UUID resolveEmployeeId(String employeeId, Jwt jwt) {
        if ("me".equalsIgnoreCase(employeeId)) {
            UUID userId = UUID.fromString(jwt.getSubject());
            try {
                String email = jwt.getClaimAsString("email");
                com.axonrh.timesheet.dto.EmployeeDTO employee = employeeClient.getEmployeeByUserId(userId, email);
                if (employee != null) {
                    return employee.getId();
                }
            } catch (Exception e) {
                log.error("Erro ao resolver funcionario para usuario {} no banco de horas: {}", userId, e.getMessage());
            }
            return userId;
        }
        return UUID.fromString(employeeId);
    }

    private String formatMinutes(int minutes) {
        if (minutes == 0) return "00:00";
        String sign = minutes < 0 ? "-" : "";
        int abs = Math.abs(minutes);
        int hours = abs / 60;
        int mins = abs % 60;
        return sign + String.format("%02d:%02d", hours, mins);
    }
}
