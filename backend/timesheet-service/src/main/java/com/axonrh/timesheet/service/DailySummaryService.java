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
import com.axonrh.timesheet.repository.HolidayRepository;
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
    private final HolidayRepository holidayRepository;
    private final OvertimeBankService overtimeBankService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final com.axonrh.timesheet.client.EmployeeServiceClient employeeClient;

    public DailySummaryService(
            DailySummaryRepository dailySummaryRepository,
            TimeRecordRepository timeRecordRepository,
            EmployeeScheduleRepository employeeScheduleRepository,
            HolidayRepository holidayRepository,
            OvertimeBankService overtimeBankService,
            @Qualifier("timesheetKafkaTemplate") KafkaTemplate<String, Object> kafkaTemplate,
            ObjectMapper objectMapper,
            com.axonrh.timesheet.client.EmployeeServiceClient employeeClient) {
        this.dailySummaryRepository = dailySummaryRepository;
        this.timeRecordRepository = timeRecordRepository;
        this.employeeScheduleRepository = employeeScheduleRepository;
        this.holidayRepository = holidayRepository;
        this.overtimeBankService = overtimeBankService;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.employeeClient = employeeClient;
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

        // Verificar feriado
        Optional<com.axonrh.timesheet.entity.Holiday> holiday = holidayRepository.findByTenantIdAndDate(tenantId, date);
        if (holiday.isPresent()) {
            summary.setIsHoliday(true);
            summary.setHolidayName(holiday.get().getName());
        } else {
            summary.setIsHoliday(false);
            summary.setHolidayName(null);
        }

        // Buscar registros validos do dia
        List<TimeRecord> records = timeRecordRepository.findValidRecordsForDate(tenantId, employeeId, date);

        // Buscar escala ativa para o dia (EmployeeID + UserID se houver legado)
        List<UUID> scheduleProfileIds = getProfileIds(employeeId);
        List<EmployeeSchedule> schedules = employeeScheduleRepository.findActiveSchedules(tenantId, scheduleProfileIds, date);
        EmployeeSchedule activeSchedule = schedules.isEmpty() ? null : schedules.get(0);



        // Calcular totais
        calculateTotals(summary, records, activeSchedule);

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
                
                // Buscar UserID para lidar com dados historicos
                List<UUID> idsToSearch = getProfileIds(employeeId);

                List<DailySummary> summaries = dailySummaryRepository
                        .findByTenantIdAndEmployeeIdInAndSummaryDateBetweenOrderBySummaryDateAsc(
                                tenantId, idsToSearch, startDate, endDate);

                for (DailySummary s : summaries) {
                    if (s.getSummaryDate() != null) {
                        // Se ja existe (preferencia pelo EmployeeID se houver duplicata no mesmo dia)
                        // A lista vem ordenada por data, mas a ordem entre empId e userId e indefinida.
                        // Mas como o map sobrescreve, o ultimo ganha.
                        // Idealmente deveriamos mesclar, mas assumimos que nao ha sobreposicao valida.
                        // Se houver registro com EmployeeId (valid) e UserId (invalido/antigo), queremos o EmployeeId?
                        // Ou se for inconsistencia, apenas mostramos um deles.
                        
                        if (!summaryMap.containsKey(s.getSummaryDate()) || s.getEmployeeId().equals(employeeId)) {
                            summaryMap.put(s.getSummaryDate(), s);
                        }
                    }
                }
                log.info("Encontrados {} registros de sumário no banco para o período (IDs: {})", summaries.size(), idsToSearch);
            } catch (Exception e) {
                log.error("Erro ao buscar sumários no banco para colaborador {} no tenant {}: {}", 
                        employeeId, currentTenant, e.getMessage());
            }
        }

        final List<UUID> idsToSearchFinal = idsToSearch;
        final String currentTenantFinal = currentTenant;

        try {
            return startDate.datesUntil(endDate.plusDays(1))
                    .map(date -> {
                        try {
                            UUID tenantId = currentTenantFinal != null ? UUID.fromString(currentTenantFinal) : null;
                            EmployeeSchedule schedule = null;
                            if (tenantId != null) {
                                List<EmployeeSchedule> schedules = employeeScheduleRepository.findActiveSchedules(tenantId, idsToSearchFinal, date);
                                if (!schedules.isEmpty()) {
                                    schedule = schedules.get(0);
                                }
                            }
                                
                            DailySummary summary = summaryMap.get(date);
                            if (summary != null) {
                                return toResponse(summary, schedule);
                            } else {
                                return createVirtualSummary(employeeId, date, schedule);
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
        }
        // Fallback removido: Se não tem escala, não assume horários padrão.
        // O sistema deve respeitar apenas a escala configurada.

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
                .scheduleType(schedule != null && schedule.getWorkSchedule() != null && schedule.getWorkSchedule().getScheduleType() != null 
                        ? schedule.getWorkSchedule().getScheduleType().name() : null)
                .workRegime(schedule != null && schedule.getWorkSchedule() != null && schedule.getWorkSchedule().getWorkRegime() != null 
                        ? schedule.getWorkSchedule().getWorkRegime().name() : null)
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
                    List<EmployeeSchedule> schedules = employeeScheduleRepository.findActiveSchedules(tenantId, getProfileIds(employeeId), date);
                    return toResponse(summary, schedules.isEmpty() ? null : schedules.get(0));
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
            return new PeriodTotals(0, "00:00", 0, "00:00", 0, "00:00", 0, "00:00", 0, "00:00", 0);
        }
        
        UUID tenantId = UUID.fromString(tenantStr);

        // Buscar UserID para lidar com dados historicos
        List<UUID> idsToSearch = getProfileIds(employeeId);

        List<Object[]> results = dailySummaryRepository.getTotalsInPeriodByList(tenantId, idsToSearch, startDate, endDate);

        if (results == null || results.isEmpty()) {
            return new PeriodTotals(0, "00:00", 0, "00:00", 0, "00:00", 0, "00:00", 0, "00:00", 0);
        }

        Object[] totals = results.get(0);

        return new PeriodTotals(
                safeInt(totals[0]), // workedMinutes
                formatMinutes(safeInt(totals[0])),
                safeInt(totals[1]), // overtimeMinutes
                formatMinutes(safeInt(totals[1])),
                safeInt(totals[2]), // deficitMinutes
                formatMinutes(safeInt(totals[2])),
                safeInt(totals[3]), // nightShiftMinutes
                formatMinutes(safeInt(totals[3])),
                safeInt(totals[4]), // lateArrivalMinutes
                formatMinutes(safeInt(totals[4])),
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
                    employeeSchedule.getWorkSchedule().getToleranceMinutes() : 10;
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
        // Se for feriado, não espera horas (a menos que seja escala 12x36 ou algo similar, 
        // mas por padrão feriado é folga)
        String currentTenant = TenantContext.getCurrentTenant();
        if (currentTenant != null) {
            UUID tenantId = UUID.fromString(currentTenant);
            if (holidayRepository.findByTenantIdAndDate(tenantId, date).isPresent()) {
                return 0;
            }
        }

        if (schedule == null || schedule.getWorkSchedule() == null) {
            // Fallback removido: Se não tem escala, espera 0 minutos
            return 0;
        }
        
        return schedule.getWorkSchedule().getScheduleDays().stream()
                .filter(d -> d.getDayOfWeek() == date.getDayOfWeek())
                .filter(d -> Boolean.TRUE.equals(d.getIsWorkDay()))
                .map(d -> d.getExpectedWorkMinutes() != null ? d.getExpectedWorkMinutes() : 0)
                .findFirst()
                .orElse(0);
    }

    /**
     * Calcula minutos de adicional noturno (CLT: 22h às 05h).
     */
    private int calculateNightShiftMinutes(LocalTime entry, LocalTime exit, LocalTime breakStart, LocalTime breakEnd) {
        LocalTime nightStart = LocalTime.of(22, 0);
        LocalTime nightEnd = LocalTime.of(5, 0);

        int nightMinutes = 0;

        // Intervalo 1: Entrada até Início do Intervalo
        nightMinutes += getMinutesInNightRange(entry, (breakStart != null ? breakStart : exit), nightStart, nightEnd);

        // Intervalo 2: Fim do Intervalo até Saída (se houver intervalo)
        if (breakEnd != null && exit.isAfter(breakEnd)) {
            nightMinutes += getMinutesInNightRange(breakEnd, exit, nightStart, nightEnd);
        }

        return nightMinutes;
    }

    private int getMinutesInNightRange(LocalTime start, LocalTime end, LocalTime nightStart, LocalTime nightEnd) {
        int minutes = 0;
        
        // Se o horário de saída for menor que o de entrada (virou o dia)
        if (end.isBefore(start)) {
            // Dividir em [start, 23:59:59] e [00:00, end]
            minutes += getIntersectionMinutes(start, LocalTime.MAX, nightStart, LocalTime.MAX);
            minutes += getIntersectionMinutes(LocalTime.MIDNIGHT, end, LocalTime.MIDNIGHT, nightEnd);
        } else {
            // Intersecção com 22:00 - 23:59
            minutes += getIntersectionMinutes(start, end, nightStart, LocalTime.MAX);
            // Intersecção com 00:00 - 05:00
            minutes += getIntersectionMinutes(start, end, LocalTime.MIDNIGHT, nightEnd);
        }
        
        return minutes;
    }

    private int getIntersectionMinutes(LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
        LocalTime latestStart = start1.isAfter(start2) ? start1 : start2;
        LocalTime earliestEnd = (end1.isBefore(end2) && !end1.equals(LocalTime.MIDNIGHT)) ? end1 : end2;

        if (latestStart.isBefore(earliestEnd)) {
            return (int) ChronoUnit.MINUTES.between(latestStart, earliestEnd);
        }
        return 0;
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
                .scheduleType(employeeSchedule != null && employeeSchedule.getWorkSchedule().getScheduleType() != null ? 
                        employeeSchedule.getWorkSchedule().getScheduleType().name() : null)
                .workRegime(employeeSchedule != null && employeeSchedule.getWorkSchedule().getWorkRegime() != null ? 
                        employeeSchedule.getWorkSchedule().getWorkRegime().name() : null)
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
            String workedFormatted,
            int overtimeMinutes,
            String overtimeFormatted,
            int deficitMinutes,
            String deficitFormatted,
            int nightShiftMinutes,
            String nightShiftFormatted,
            int lateArrivalMinutes,
            String lateArrivalFormatted,
            int absences
    ) {}
    private List<UUID> getProfileIds(UUID employeeId) {
        List<UUID> ids = new java.util.ArrayList<>();
        ids.add(employeeId);
        try {
            // Tenta buscar do cache primeiro se houver, ou direto do client
            com.axonrh.timesheet.dto.EmployeeDTO employee = employeeClient.getEmployee(employeeId);
            if (employee != null && employee.getUserId() != null && !employee.getUserId().equals(employeeId)) {
                ids.add(employee.getUserId());
            }
        } catch (Exception ex) {
            // Log apenas warn/debug para nao poluir se for erro transiente ou timeout
            log.debug("Erro ao buscar UserID auxiliar para employee {}: {}", employeeId, ex.getMessage());
        }
        return ids;
    }
}
