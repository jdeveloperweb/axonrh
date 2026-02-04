package com.axonrh.timesheet.service;

import com.axonrh.timesheet.config.TenantContext;
import com.axonrh.timesheet.dto.DailySummaryResponse;
import com.axonrh.timesheet.dto.TimeRecordResponse;
import com.axonrh.timesheet.entity.DailySummary;
import com.axonrh.timesheet.entity.TimeRecord;
import com.axonrh.timesheet.entity.enums.RecordStatus;
import com.axonrh.timesheet.entity.enums.RecordType;
import com.axonrh.timesheet.repository.DailySummaryRepository;
import com.axonrh.timesheet.repository.TimeRecordRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

/**
 * Servico de resumo diario (espelho de ponto).
 */
@Slf4j
@Service
public class DailySummaryService {

    private final DailySummaryRepository dailySummaryRepository;
    private final TimeRecordRepository timeRecordRepository;
    private final OvertimeBankService overtimeBankService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public DailySummaryService(
            DailySummaryRepository dailySummaryRepository,
            TimeRecordRepository timeRecordRepository,
            OvertimeBankService overtimeBankService,
            @Qualifier("timesheetKafkaTemplate") KafkaTemplate<String, Object> kafkaTemplate,
            ObjectMapper objectMapper) {
        this.dailySummaryRepository = dailySummaryRepository;
        this.timeRecordRepository = timeRecordRepository;
        this.overtimeBankService = overtimeBankService;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    @Value("${timesheet.night-shift.start-hour:22}")
    private int nightShiftStartHour;

    @Value("${timesheet.night-shift.end-hour:5}")
    private int nightShiftEndHour;

    /**
     * Atualiza o resumo diario de um colaborador.
     */
    @Transactional
    @CacheEvict(value = "timeRecords", key = "#employeeId + '-' + #date")
    public DailySummary updateDailySummary(UUID tenantId, UUID employeeId, LocalDate date) {
        // Buscar ou criar resumo
        DailySummary summary = dailySummaryRepository
                .findByTenantIdAndEmployeeIdAndSummaryDate(tenantId, employeeId, date)
                .orElseGet(() -> DailySummary.builder()
                        .tenantId(tenantId)
                        .employeeId(employeeId)
                        .summaryDate(date)
                        .build());

        // Buscar registros validos do dia
        List<TimeRecord> records = timeRecordRepository.findValidRecordsForDate(tenantId, employeeId, date);

        // Calcular totais
        calculateTotals(summary, records);

        DailySummary saved = dailySummaryRepository.save(summary);

        // Sincronizar com Banco de Horas (se houver horas extras ou deficit)
        syncWithOvertimeBank(tenantId, employeeId, date, saved);

        publishEvent("DAILY_SUMMARY_UPDATED", saved);

        return saved;
    }

    private void syncWithOvertimeBank(UUID tenantId, UUID employeeId, LocalDate date, DailySummary summary) {
        try {
            // TODO: Verificar se a escala do colaborador permite banco de horas
            // Por enquanto, sincroniza sempre que houver saldo
            int balance = 0;
            if (summary.getOvertimeMinutes() > 0) {
                balance = summary.getOvertimeMinutes();
            } else if (summary.getDeficitMinutes() > 0) {
                balance = -summary.getDeficitMinutes();
            }

            overtimeBankService.syncDailyBalance(tenantId, employeeId, date, balance);
        } catch (Exception e) {
            log.error("Erro ao sincronizar com banco de horas: {}", e.getMessage());
        }
    }

    /**
     * Busca espelho de ponto de um periodo.
     */
    @Transactional(readOnly = true)
    public List<DailySummaryResponse> getTimesheetByPeriod(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        log.info("Solicitação de espelho de ponto: colaborador={}, inicio={}, fim={}", employeeId, startDate, endDate);
        
        String currentTenant = TenantContext.getCurrentTenant();
        java.util.Map<LocalDate, DailySummary> summaryMap = new java.util.HashMap<>();

        if (currentTenant != null) {
            try {
                UUID tenantId = UUID.fromString(currentTenant);
                List<DailySummary> summaries = dailySummaryRepository
                        .findByTenantIdAndEmployeeIdAndSummaryDateBetweenOrderBySummaryDateAsc(
                                tenantId, employeeId, startDate, endDate);

                for (DailySummary s : summaries) {
                    if (s.getSummaryDate() != null) {
                        summaryMap.put(s.getSummaryDate(), s);
                    }
                }
                log.info("Encontrados {} registros de sumário no banco para o período", summaries.size());
            } catch (Exception e) {
                log.error("Erro ao buscar sumários no banco para colaborador {} no tenant {}: {}", 
                        employeeId, currentTenant, e.getMessage());
            }
        } else {
            log.warn("Solicitação de espelho de ponto sem Tenant ID no contexto (employeeId={})", employeeId);
        }

        try {
            return startDate.datesUntil(endDate.plusDays(1))
                    .map(date -> {
                        try {
                            DailySummary summary = summaryMap.get(date);
                            if (summary != null) {
                                return toResponse(summary);
                            } else {
                                return createVirtualSummary(employeeId, date);
                            }
                        } catch (Exception e) {
                            log.error("Erro ao converter resumo do dia {}: {}", date, e.getMessage());
                            return createVirtualSummary(employeeId, date);
                        }
                    })
                    .toList();
        } catch (Exception e) {
            log.error("Falha crítica ao gerar stream de datas para o espelho do colaborador {}: {}", employeeId, e.getMessage(), e);
            return java.util.Collections.emptyList();
        }
    }

    private DailySummaryResponse createVirtualSummary(UUID employeeId, LocalDate date) {
        return DailySummaryResponse.builder()
                .employeeId(employeeId)
                .summaryDate(date)
                .dayOfWeek(getDayOfWeekLabel(date.getDayOfWeek()))
                .expectedWorkMinutes(480) // Padrao
                .expectedWorkFormatted("08:00")
                .workedMinutes(0)
                .workedFormatted("00:00")
                .overtimeMinutes(0)
                .overtimeFormatted("00:00")
                .deficitMinutes(480)
                .deficitFormatted("08:00")
                .isAbsent(false) // Nao marcar como falta automaticamente (pode ser folga/fim de semana)
                .hasMissingRecords(false)
                .balanceMinutes(-480)
                .balanceFormatted("08:00")
                .isPositive(false)
                .build();
    }

    /**
     * Busca resumo de um dia especifico.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "timeRecords", key = "#employeeId + '-' + #date")
    public Optional<DailySummaryResponse> getDailySummary(UUID employeeId, LocalDate date) {
        String tenantStr = TenantContext.getCurrentTenant();
        if (tenantStr == null) return Optional.empty();
        
        UUID tenantId = UUID.fromString(tenantStr);

        return dailySummaryRepository
                .findByTenantIdAndEmployeeIdAndSummaryDate(tenantId, employeeId, date)
                .map(this::toResponse);
    }

    /**
     * Busca totais de um periodo.
     */
    @Transactional(readOnly = true)
    public PeriodTotals getPeriodTotals(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        String tenantStr = TenantContext.getCurrentTenant();
        if (tenantStr == null) {
            log.warn("getPeriodTotals chamado sem Tenant ID no contexto");
            return new PeriodTotals(0, 0, 0, 0, 0, 0);
        }
        
        UUID tenantId = UUID.fromString(tenantStr);

        Object[] totals = dailySummaryRepository.getTotalsInPeriod(tenantId, employeeId, startDate, endDate);

        if (totals == null || totals.length == 0) {
            return new PeriodTotals(0, 0, 0, 0, 0, 0);
        }

        return new PeriodTotals(
                safeInt(totals[0]), // workedMinutes
                safeInt(totals[1]), // overtimeMinutes
                safeInt(totals[2]), // deficitMinutes
                safeInt(totals[3]), // nightShiftMinutes
                safeInt(totals[4]), // lateArrivalMinutes
                safeInt(totals[5])  // absences
        );
    }

    private int safeInt(Object value) {
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return 0;
    }

    /**
     * Calcula os totais do dia.
     */
    private void calculateTotals(DailySummary summary, List<TimeRecord> records) {
        if (records.isEmpty()) {
            summary.setHasMissingRecords(true);
            return;
        }

        // Encontrar entrada, saida e intervalos
        LocalTime firstEntry = null;
        LocalTime lastExit = null;
        LocalTime breakStart = null;
        LocalTime breakEnd = null;

        boolean hasPending = false;

        for (TimeRecord record : records) {
            if (record.getStatus() == RecordStatus.PENDING_APPROVAL) {
                hasPending = true;
            }

            switch (record.getRecordType()) {
                case ENTRY:
                    if (firstEntry == null) firstEntry = record.getRecordTime();
                    break;
                case EXIT:
                    lastExit = record.getRecordTime();
                    break;
                case BREAK_START:
                    if (breakStart == null) breakStart = record.getRecordTime();
                    break;
                case BREAK_END:
                    breakEnd = record.getRecordTime();
                    break;
            }
        }

        summary.setFirstEntry(firstEntry);
        summary.setLastExit(lastExit);
        summary.setBreakStart(breakStart);
        summary.setBreakEnd(breakEnd);
        summary.setHasPendingRecords(hasPending);

        // Verificar registros faltando
        boolean hasMissing = firstEntry == null || lastExit == null;
        summary.setHasMissingRecords(hasMissing);

        if (hasMissing) {
            return;
        }

        // Calcular horas trabalhadas
        int totalMinutes = (int) ChronoUnit.MINUTES.between(firstEntry, lastExit);

        // Descontar intervalo
        int breakMinutes = 0;
        if (breakStart != null && breakEnd != null) {
            breakMinutes = (int) ChronoUnit.MINUTES.between(breakStart, breakEnd);
        }
        summary.setBreakMinutes(breakMinutes);

        int workedMinutes = totalMinutes - breakMinutes;
        summary.setWorkedMinutes(Math.max(0, workedMinutes));

        // Calcular adicional noturno
        int nightMinutes = calculateNightShiftMinutes(firstEntry, lastExit, breakStart, breakEnd);
        summary.setNightShiftMinutes(nightMinutes);

        // TODO: Calcular horas extras e deficit baseado na escala
        // Isso requer integracao com WorkScheduleService
        summary.setExpectedWorkMinutes(480); // 8 horas padrao
        int expected = summary.getExpectedWorkMinutes();

        if (workedMinutes > expected) {
            summary.setOvertimeMinutes(workedMinutes - expected);
            summary.setDeficitMinutes(0);
        } else if (workedMinutes < expected) {
            summary.setOvertimeMinutes(0);
            summary.setDeficitMinutes(expected - workedMinutes);
        } else {
            summary.setOvertimeMinutes(0);
            summary.setDeficitMinutes(0);
        }
    }

    /**
     * Calcula minutos de adicional noturno.
     */
    private int calculateNightShiftMinutes(LocalTime entry, LocalTime exit, LocalTime breakStart, LocalTime breakEnd) {
        LocalTime nightStart = LocalTime.of(nightShiftStartHour, 0);
        LocalTime nightEnd = LocalTime.of(nightShiftEndHour, 0);

        int nightMinutes = 0;

        // Verificar periodo da noite (22h-05h)
        if (entry.isBefore(nightStart) && exit.isAfter(nightStart)) {
            // Trabalhou apos 22h
            LocalTime effectiveExit = exit.isBefore(LocalTime.of(6, 0)) ? exit : LocalTime.of(23, 59);
            nightMinutes += (int) ChronoUnit.MINUTES.between(nightStart, effectiveExit);
        }

        if (entry.isBefore(nightEnd) || entry.isAfter(nightStart)) {
            // Entrada no periodo noturno
            LocalTime effectiveStart = entry.isAfter(nightStart) ? entry : LocalTime.MIDNIGHT;
            LocalTime effectiveEnd = exit.isBefore(nightEnd) ? exit : nightEnd;
            if (effectiveEnd.isAfter(effectiveStart)) {
                nightMinutes += (int) ChronoUnit.MINUTES.between(effectiveStart, effectiveEnd);
            }
        }

        return nightMinutes;
    }

    private DailySummaryResponse toResponse(DailySummary summary) {
        int overtime = summary.getOvertimeMinutes() != null ? summary.getOvertimeMinutes() : 0;
        int deficit = summary.getDeficitMinutes() != null ? summary.getDeficitMinutes() : 0;
        int balance = overtime - deficit;

        return DailySummaryResponse.builder()
                .id(summary.getId())
                .employeeId(summary.getEmployeeId())
                .summaryDate(summary.getSummaryDate())
                .dayOfWeek(getDayOfWeekLabel(summary.getSummaryDate().getDayOfWeek()))
                .workScheduleId(summary.getWorkScheduleId())
                .firstEntry(summary.getFirstEntry())
                .lastExit(summary.getLastExit())
                .breakStart(summary.getBreakStart())
                .breakEnd(summary.getBreakEnd())
                .expectedWorkMinutes(summary.getExpectedWorkMinutes())
                .expectedWorkFormatted(formatMinutes(summary.getExpectedWorkMinutes()))
                .workedMinutes(summary.getWorkedMinutes())
                .workedFormatted(formatMinutes(summary.getWorkedMinutes()))
                .breakMinutes(summary.getBreakMinutes())
                .breakFormatted(formatMinutes(summary.getBreakMinutes()))
                .overtimeMinutes(summary.getOvertimeMinutes())
                .overtimeFormatted(formatMinutes(summary.getOvertimeMinutes()))
                .deficitMinutes(summary.getDeficitMinutes())
                .deficitFormatted(formatMinutes(summary.getDeficitMinutes()))
                .nightShiftMinutes(summary.getNightShiftMinutes())
                .nightShiftFormatted(formatMinutes(summary.getNightShiftMinutes()))
                .lateArrivalMinutes(summary.getLateArrivalMinutes())
                .lateArrivalFormatted(formatMinutes(summary.getLateArrivalMinutes()))
                .earlyDepartureMinutes(summary.getEarlyDepartureMinutes())
                .earlyDepartureFormatted(formatMinutes(summary.getEarlyDepartureMinutes()))
                .isAbsent(summary.getIsAbsent())
                .absenceType(summary.getAbsenceType())
                .hasPendingRecords(summary.getHasPendingRecords())
                .hasMissingRecords(summary.getHasMissingRecords())
                .isHoliday(summary.getIsHoliday())
                .holidayName(summary.getHolidayName())
                .isClosed(summary.getIsClosed())
                .notes(summary.getNotes())
                .balanceMinutes(balance)
                .balanceFormatted(formatMinutes(Math.abs(balance)))
                .isPositive(balance >= 0)
                .build();
    }

    private String getDayOfWeekLabel(DayOfWeek day) {
        return day.getDisplayName(TextStyle.FULL, new Locale("pt", "BR"));
    }

    private String formatMinutes(Integer minutes) {
        if (minutes == null || minutes == 0) return "00:00";
        int hours = minutes / 60;
        int mins = minutes % 60;
        return String.format("%02d:%02d", hours, mins);
    }

    private void publishEvent(String type, DailySummary summary) {
        try {
            kafkaTemplate.send("timesheet-events", type, summary);
        } catch (Exception e) {
            log.error("Erro ao publicar evento {}: {}", type, e.getMessage());
        }
    }

    public record PeriodTotals(
            int workedMinutes,
            int overtimeMinutes,
            int deficitMinutes,
            int nightShiftMinutes,
            int lateArrivalMinutes,
            int absences
    ) {}
}
