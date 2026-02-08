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

import com.axonrh.timesheet.entity.EmployeeSchedule;
import com.axonrh.timesheet.entity.ScheduleDay;
import com.axonrh.timesheet.entity.WorkSchedule;
import com.axonrh.timesheet.repository.EmployeeScheduleRepository;
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
    private final EmployeeScheduleRepository employeeScheduleRepository;
    private final OvertimeBankService overtimeBankService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public DailySummaryService(
            DailySummaryRepository dailySummaryRepository,
            TimeRecordRepository timeRecordRepository,
            EmployeeScheduleRepository employeeScheduleRepository,
            OvertimeBankService overtimeBankService,
            @Qualifier("timesheetKafkaTemplate") KafkaTemplate<String, Object> kafkaTemplate,
            ObjectMapper objectMapper) {
        this.dailySummaryRepository = dailySummaryRepository;
        this.timeRecordRepository = timeRecordRepository;
        this.employeeScheduleRepository = employeeScheduleRepository;
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

        // Buscar escala ativa para o dia
        Optional<EmployeeSchedule> activeSchedule = employeeScheduleRepository.findActiveSchedule(tenantId, employeeId, date);

        // Buscar registros validos do dia
        List<TimeRecord> records = timeRecordRepository.findValidRecordsForDate(tenantId, employeeId, date);

        // Calcular totais
        calculateTotals(summary, records, activeSchedule.orElse(null));

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
        }

        try {
            return startDate.datesUntil(endDate.plusDays(1))
                    .map(date -> {
                        try {
                            UUID tenantId = currentTenant != null ? UUID.fromString(currentTenant) : null;
                            Optional<EmployeeSchedule> schedule = tenantId != null ? 
                                employeeScheduleRepository.findActiveSchedule(tenantId, employeeId, date) : Optional.empty();
                                
                            DailySummary summary = summaryMap.get(date);
                            if (summary != null) {
                                return toResponse(summary, schedule.orElse(null));
                            } else {
                                return createVirtualSummary(employeeId, date, schedule.orElse(null));
                            }
                        } catch (Exception e) {
                            log.error("Erro ao converter resumo do dia {}: {}", date, e.getMessage());
                            return createVirtualSummary(employeeId, date, null);
                        }
                    })
                    .toList();
        } catch (Exception e) {
            log.error("Falha crítica ao gerar stream de datas para o espelho do colaborador {}: {}", employeeId, e.getMessage(), e);
            return java.util.Collections.emptyList();
        }
    }

    private DailySummaryResponse createVirtualSummary(UUID employeeId, LocalDate date, EmployeeSchedule schedule) {
        int expectedMinutes = 0;
        LocalTime scheduledEntry = null;
        LocalTime scheduledExit = null;
        LocalTime scheduledBreakStart = null;
        LocalTime scheduledBreakEnd = null;

        if (schedule != null && schedule.getWorkSchedule() != null) {
            ScheduleDay daySpec = schedule.getWorkSchedule().getScheduleDays().stream()
                    .filter(d -> d.getDayOfWeek() == date.getDayOfWeek())
                    .findFirst()
                    .orElse(null);
            
            if (daySpec != null && Boolean.TRUE.equals(daySpec.getIsWorkDay())) {
                expectedMinutes = daySpec.getExpectedWorkMinutes() != null ? daySpec.getExpectedWorkMinutes() : 0;
                scheduledEntry = daySpec.getEntryTime();
                scheduledExit = daySpec.getExitTime();
                scheduledBreakStart = daySpec.getBreakStartTime();
                scheduledBreakEnd = daySpec.getBreakEndTime();
            }
        } else if (date.getDayOfWeek() != DayOfWeek.SATURDAY && date.getDayOfWeek() != DayOfWeek.SUNDAY) {
            // Se não tem escala e é dia de semana, assume 8h como fallback
            expectedMinutes = 480; 
            scheduledEntry = LocalTime.of(8, 0);
            scheduledExit = LocalTime.of(17, 0);
            scheduledBreakStart = LocalTime.of(12, 0);
            scheduledBreakEnd = LocalTime.of(13, 0);
        }

        int balance = -expectedMinutes;

        return DailySummaryResponse.builder()
                .employeeId(employeeId)
                .summaryDate(date)
                .dayOfWeek(getDayOfWeekLabel(date.getDayOfWeek()))
                .expectedWorkMinutes(expectedMinutes)
                .expectedWorkFormatted(formatMinutes(expectedMinutes))
                .workedMinutes(0)
                .workedFormatted("00:00")
                .overtimeMinutes(0)
                .overtimeFormatted("00:00")
                .deficitMinutes(expectedMinutes)
                .deficitFormatted(formatMinutes(expectedMinutes))
                .isAbsent(false)
                .hasMissingRecords(false)
                .scheduledEntry(scheduledEntry)
                .scheduledExit(scheduledExit)
                .scheduledBreakStart(scheduledBreakStart)
                .scheduledBreakEnd(scheduledBreakEnd)
                .balanceMinutes(balance)
                .balanceFormatted(formatMinutes(Math.abs(balance)))
                .isPositive(balance >= 0)
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
                .map(summary -> {
                    Optional<EmployeeSchedule> schedule = employeeScheduleRepository.findActiveSchedule(tenantId, employeeId, date);
                    return toResponse(summary, schedule.orElse(null));
                });
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

        List<Object[]> results = dailySummaryRepository.getTotalsInPeriod(tenantId, employeeId, startDate, endDate);

        if (results == null || results.isEmpty()) {
            return new PeriodTotals(0, 0, 0, 0, 0, 0);
        }

        Object[] totals = results.get(0);

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
     * Calcula os totais do dia com base na escala de trabalho.
     */
    private void calculateTotals(DailySummary summary, List<TimeRecord> records, EmployeeSchedule employeeSchedule) {
        if (records.isEmpty()) {
            summary.setHasMissingRecords(true);
            
            // Buscar horas esperadas do dia
            int expected = getExpectedMinutes(summary.getSummaryDate(), employeeSchedule);
            summary.setExpectedWorkMinutes(expected);
            summary.setWorkedMinutes(0);
            summary.setOvertimeMinutes(0);
            summary.setDeficitMinutes(expected);
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

        // Horas esperadas da escala
        int expected = getExpectedMinutes(summary.getSummaryDate(), employeeSchedule);
        summary.setExpectedWorkMinutes(expected);
        if (employeeSchedule != null) {
            summary.setWorkScheduleId(employeeSchedule.getWorkSchedule().getId());
        }

        if (hasMissing) {
            summary.setWorkedMinutes(0);
            summary.setOvertimeMinutes(0);
            summary.setDeficitMinutes(expected);
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

        // Aplicar tolerância CLT (Art. 58 § 1º)
        // Se a diferença absoluta entre o trabalhado e o esperado for <= 10 e individual <= 5
        // Simplificação: se a diferença total do dia for <= 10 min, não gera extra nem déficit
        int diff = workedMinutes - expected;
        int tolerance = 10; // Limite diário da CLT
        
        if (employeeSchedule != null && employeeSchedule.getWorkSchedule() != null) {
            // Se a escala define tolerância diferente, respeita
            tolerance = employeeSchedule.getWorkSchedule().getToleranceMinutes() != null ? 
                    employeeSchedule.getWorkSchedule().getToleranceMinutes() * 2 : 10;
        }

        if (Math.abs(diff) <= tolerance) {
            summary.setOvertimeMinutes(0);
            summary.setDeficitMinutes(0);
        } else if (diff > 0) {
            summary.setOvertimeMinutes(diff);
            summary.setDeficitMinutes(0);
        } else {
            summary.setOvertimeMinutes(0);
            summary.setDeficitMinutes(Math.abs(diff));
        }
    }

    private int getExpectedMinutes(LocalDate date, EmployeeSchedule schedule) {
        if (schedule == null || schedule.getWorkSchedule() == null) {
            // Fallback: 8h em dias de semana
            return (date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY) ? 0 : 480;
        }
        
        return schedule.getWorkSchedule().getScheduleDays().stream()
                .filter(d -> d.getDayOfWeek() == date.getDayOfWeek())
                .filter(d -> Boolean.TRUE.equals(d.getIsWorkDay()))
                .map(d -> d.getExpectedWorkMinutes() != null ? d.getExpectedWorkMinutes() : 0)
                .findFirst()
                .orElse(0);
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

    private DailySummaryResponse toResponse(DailySummary summary, EmployeeSchedule employeeSchedule) {
        int overtime = summary.getOvertimeMinutes() != null ? summary.getOvertimeMinutes() : 0;
        int deficit = summary.getDeficitMinutes() != null ? summary.getDeficitMinutes() : 0;
        int balance = overtime - deficit;

        LocalTime scheduledEntry = null;
        LocalTime scheduledExit = null;
        LocalTime scheduledBreakStart = null;
        LocalTime scheduledBreakEnd = null;

        if (employeeSchedule != null && employeeSchedule.getWorkSchedule() != null) {
            ScheduleDay daySpec = employeeSchedule.getWorkSchedule().getScheduleDays().stream()
                    .filter(d -> d.getDayOfWeek() == summary.getSummaryDate().getDayOfWeek())
                    .findFirst()
                    .orElse(null);
            
            if (daySpec != null && Boolean.TRUE.equals(daySpec.getIsWorkDay())) {
                scheduledEntry = daySpec.getEntryTime();
                scheduledExit = daySpec.getExitTime();
                scheduledBreakStart = daySpec.getBreakStartTime();
                scheduledBreakEnd = daySpec.getBreakEndTime();
            }
        }

        return DailySummaryResponse.builder()
                .id(summary.getId())
                .employeeId(summary.getEmployeeId())
                .summaryDate(summary.getSummaryDate())
                .dayOfWeek(getDayOfWeekLabel(summary.getSummaryDate().getDayOfWeek()))
                .workScheduleId(summary.getWorkScheduleId())
                .workScheduleName(employeeSchedule != null ? employeeSchedule.getWorkSchedule().getName() : null)
                .firstEntry(summary.getFirstEntry())
                .lastExit(summary.getLastExit())
                .breakStart(summary.getBreakStart())
                .breakEnd(summary.getBreakEnd())
                .scheduledEntry(scheduledEntry)
                .scheduledExit(scheduledExit)
                .scheduledBreakStart(scheduledBreakStart)
                .scheduledBreakEnd(scheduledBreakEnd)
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
