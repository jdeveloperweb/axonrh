package com.axonrh.timesheet.service;

import com.axonrh.timesheet.config.TenantContext;
import com.axonrh.timesheet.dto.OvertimeBankResponse;
import com.axonrh.timesheet.dto.OvertimeBankSummary;
import com.axonrh.timesheet.entity.OvertimeBank;
import com.axonrh.timesheet.entity.enums.OvertimeBankType;
import com.axonrh.timesheet.exception.InvalidOperationException;
import com.axonrh.timesheet.repository.OvertimeBankRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * Servico de banco de horas.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OvertimeBankService {

    private final OvertimeBankRepository overtimeBankRepository;

    @Value("${timesheet.overtime.bank-expiration-months:6}")
    private int defaultExpirationMonths;

    /**
     * Adiciona credito ao banco de horas.
     */
    @Transactional
    @CacheEvict(value = "overtimeBank", key = "#employeeId")
    public OvertimeBankResponse addCredit(UUID employeeId, LocalDate referenceDate, int minutes,
                                          Double multiplier, String description, UUID timeRecordId, UUID userId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        // Calcular minutos com multiplicador
        double mult = multiplier != null ? multiplier : 1.0;
        int effectiveMinutes = (int) Math.round(minutes * mult);

        // Buscar saldo atual
        int currentBalance = overtimeBankRepository.calculateCurrentBalance(tenantId, employeeId);
        int newBalance = currentBalance + effectiveMinutes;

        // Calcular data de expiracao
        LocalDate expirationDate = referenceDate.plusMonths(defaultExpirationMonths);

        OvertimeBank entry = OvertimeBank.builder()
                .tenantId(tenantId)
                .employeeId(employeeId)
                .type(OvertimeBankType.CREDIT)
                .referenceDate(referenceDate)
                .minutes(effectiveMinutes)
                .balanceAfter(newBalance)
                .expirationDate(expirationDate)
                .timeRecordId(timeRecordId)
                .description(description)
                .multiplier(mult)
                .originalMinutes(minutes)
                .createdBy(userId)
                .build();

        OvertimeBank saved = overtimeBankRepository.save(entry);
        log.info("Credito adicionado ao banco de horas - colaborador: {}, minutos: {}, saldo: {}",
                employeeId, effectiveMinutes, newBalance);

        return toResponse(saved);
    }

    /**
     * Adiciona debito ao banco de horas (compensacao/folga).
     */
    @Transactional
    @CacheEvict(value = "overtimeBank", key = "#employeeId")
    public OvertimeBankResponse addDebit(UUID employeeId, LocalDate referenceDate, int minutes,
                                         String description, UUID userId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        // Buscar saldo atual
        int currentBalance = overtimeBankRepository.calculateCurrentBalance(tenantId, employeeId);
        int newBalance = currentBalance - minutes;

        // Permitir saldo negativo com alerta
        if (newBalance < 0) {
            log.warn("Banco de horas ficara negativo - colaborador: {}, saldo atual: {}, debito: {}",
                    employeeId, currentBalance, minutes);
        }

        OvertimeBank entry = OvertimeBank.builder()
                .tenantId(tenantId)
                .employeeId(employeeId)
                .type(OvertimeBankType.DEBIT)
                .referenceDate(referenceDate)
                .minutes(-minutes) // Negativo para debito
                .balanceAfter(newBalance)
                .description(description)
                .createdBy(userId)
                .build();

        OvertimeBank saved = overtimeBankRepository.save(entry);
        log.info("Debito adicionado ao banco de horas - colaborador: {}, minutos: {}, saldo: {}",
                employeeId, minutes, newBalance);

        return toResponse(saved);
    }

    /**
     * Adiciona ajuste manual ao banco de horas.
     */
    @Transactional
    @CacheEvict(value = "overtimeBank", key = "#employeeId")
    public OvertimeBankResponse addAdjustment(UUID employeeId, LocalDate referenceDate, int minutes,
                                              String description, UUID approverId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        int currentBalance = overtimeBankRepository.calculateCurrentBalance(tenantId, employeeId);
        int newBalance = currentBalance + minutes;

        OvertimeBank entry = OvertimeBank.builder()
                .tenantId(tenantId)
                .employeeId(employeeId)
                .type(OvertimeBankType.ADJUSTMENT)
                .referenceDate(referenceDate)
                .minutes(minutes)
                .balanceAfter(newBalance)
                .description(description)
                .approvedBy(approverId)
                .approvedAt(java.time.LocalDateTime.now())
                .createdBy(approverId)
                .build();

        OvertimeBank saved = overtimeBankRepository.save(entry);
        log.info("Ajuste adicionado ao banco de horas - colaborador: {}, minutos: {}, saldo: {}",
                employeeId, minutes, newBalance);

        return toResponse(saved);
    }

    /**
     * Registra pagamento de horas extras.
     */
    @Transactional
    @CacheEvict(value = "overtimeBank", key = "#employeeId")
    public OvertimeBankResponse addPayout(UUID employeeId, LocalDate referenceDate, int minutes,
                                          String description, UUID approverId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        int currentBalance = overtimeBankRepository.calculateCurrentBalance(tenantId, employeeId);

        if (minutes > currentBalance) {
            throw new InvalidOperationException("Saldo insuficiente para pagamento. Saldo: " +
                    formatMinutes(currentBalance) + ", Solicitado: " + formatMinutes(minutes));
        }

        int newBalance = currentBalance - minutes;

        OvertimeBank entry = OvertimeBank.builder()
                .tenantId(tenantId)
                .employeeId(employeeId)
                .type(OvertimeBankType.PAYOUT)
                .referenceDate(referenceDate)
                .minutes(-minutes)
                .balanceAfter(newBalance)
                .description(description)
                .approvedBy(approverId)
                .approvedAt(java.time.LocalDateTime.now())
                .createdBy(approverId)
                .build();

        OvertimeBank saved = overtimeBankRepository.save(entry);
        log.info("Pagamento de horas extras registrado - colaborador: {}, minutos: {}, saldo: {}",
                employeeId, minutes, newBalance);

        return toResponse(saved);
    }

    /**
     * Busca saldo atual do banco de horas.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "overtimeBank", key = "#employeeId")
    public int getCurrentBalance(UUID employeeId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        return overtimeBankRepository.calculateCurrentBalance(tenantId, employeeId);
    }

    /**
     * Busca resumo do banco de horas.
     */
    @Transactional(readOnly = true)
    public OvertimeBankSummary getSummary(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        int currentBalance = overtimeBankRepository.calculateCurrentBalance(tenantId, employeeId);

        Object[] totals = overtimeBankRepository.getTotalsInPeriod(tenantId, employeeId, startDate, endDate);

        int totalCredit = totals[0] != null ? ((Number) totals[0]).intValue() : 0;
        int totalDebit = totals[1] != null ? ((Number) totals[1]).intValue() : 0;
        int totalExpired = totals[2] != null ? ((Number) totals[2]).intValue() : 0;
        int totalPaid = totals[3] != null ? ((Number) totals[3]).intValue() : 0;

        // Horas proximas de expirar (proximo mes)
        List<OvertimeBank> expiringSoon = overtimeBankRepository.findCreditsExpiringSoon(
                tenantId, employeeId, LocalDate.now(), LocalDate.now().plusMonths(1));

        int expiringMinutes = expiringSoon.stream().mapToInt(OvertimeBank::getMinutes).sum();
        Integer daysUntilExpiration = expiringSoon.isEmpty() ? null :
                (int) ChronoUnit.DAYS.between(LocalDate.now(), expiringSoon.get(0).getExpirationDate());

        // Ultimas movimentacoes
        Page<OvertimeBank> recent = overtimeBankRepository.findByTenantIdAndEmployeeIdOrderByReferenceDateDesc(
                tenantId, employeeId, Pageable.ofSize(5));

        return OvertimeBankSummary.builder()
                .employeeId(employeeId)
                .currentBalanceMinutes(currentBalance)
                .currentBalanceFormatted(formatMinutes(currentBalance))
                .isPositive(currentBalance >= 0)
                .totalCreditMinutes(totalCredit)
                .totalCreditFormatted(formatMinutes(totalCredit))
                .totalDebitMinutes(totalDebit)
                .totalDebitFormatted(formatMinutes(totalDebit))
                .totalExpiredMinutes(totalExpired)
                .totalExpiredFormatted(formatMinutes(totalExpired))
                .totalPaidMinutes(totalPaid)
                .totalPaidFormatted(formatMinutes(totalPaid))
                .expiringMinutes(expiringMinutes)
                .expiringFormatted(formatMinutes(expiringMinutes))
                .daysUntilNextExpiration(daysUntilExpiration)
                .recentMovements(recent.getContent().stream().map(this::toResponse).toList())
                .build();
    }

    /**
     * Busca movimentacoes do banco de horas.
     */
    @Transactional(readOnly = true)
    public Page<OvertimeBankResponse> getMovements(UUID employeeId, Pageable pageable) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        return overtimeBankRepository
                .findByTenantIdAndEmployeeIdOrderByReferenceDateDesc(tenantId, employeeId, pageable)
                .map(this::toResponse);
    }

    /**
     * Processa expiracao de horas (executado diariamente).
     */
    @Scheduled(cron = "0 0 1 * * *") // 01:00 todos os dias
    @Transactional
    public void processExpirations() {
        log.info("Iniciando processamento de expiracao de banco de horas");

        // Buscar todos os tenants com horas expirando
        // Simplificado - em producao, iterar por tenant
        LocalDate today = LocalDate.now();

        // Marcar horas como expiradas
        // TODO: Implementar logica por tenant
        log.info("Processamento de expiracao concluido");
    }

    private OvertimeBankResponse toResponse(OvertimeBank entry) {
        Integer daysUntilExpiration = null;
        if (entry.getExpirationDate() != null && !entry.getExpired()) {
            daysUntilExpiration = (int) ChronoUnit.DAYS.between(LocalDate.now(), entry.getExpirationDate());
        }

        return OvertimeBankResponse.builder()
                .id(entry.getId())
                .employeeId(entry.getEmployeeId())
                .type(entry.getType())
                .typeLabel(getTypeLabel(entry.getType()))
                .referenceDate(entry.getReferenceDate())
                .minutes(entry.getMinutes())
                .minutesFormatted(formatMinutes(Math.abs(entry.getMinutes())))
                .isCredit(entry.getMinutes() > 0)
                .balanceAfter(entry.getBalanceAfter())
                .balanceAfterFormatted(formatMinutes(entry.getBalanceAfter()))
                .expirationDate(entry.getExpirationDate())
                .expired(entry.getExpired())
                .daysUntilExpiration(daysUntilExpiration)
                .multiplier(entry.getMultiplier())
                .originalMinutes(entry.getOriginalMinutes())
                .originalMinutesFormatted(entry.getOriginalMinutes() != null ?
                        formatMinutes(entry.getOriginalMinutes()) : null)
                .description(entry.getDescription())
                .approvedBy(entry.getApprovedBy())
                .approvedAt(entry.getApprovedAt())
                .createdAt(entry.getCreatedAt())
                .build();
    }

    private String getTypeLabel(OvertimeBankType type) {
        return switch (type) {
            case CREDIT -> "Credito";
            case DEBIT -> "Debito";
            case ADJUSTMENT -> "Ajuste";
            case EXPIRATION -> "Expiracao";
            case PAYOUT -> "Pagamento";
        };
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
