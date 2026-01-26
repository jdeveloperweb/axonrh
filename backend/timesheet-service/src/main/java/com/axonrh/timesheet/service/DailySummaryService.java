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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
@RequiredArgsConstructor
public class DailySummaryService {

    private final DailySummaryRepository dailySummaryRepository;
    private final TimeRecordRepository timeRecordRepository;

    @Value("${timesheet.night-shift.start-hour:22}")
    private int nightShiftStartHour;

    @Value("${timesheet.night-shift.end-hour:5}")
    private int nightShiftEndHour;

    /**
     * Atualiza o resumo diario de um colaborador.
     */
    @Transactional
    @CacheEvict(value = "timeRecords", key = "#employeeId + '-' + #date")
    public void updateDailySummary(UUID tenantId, UUID employeeId, LocalDate date) {
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

        dailySummaryRepository.save(summary);
        log.debug("Resumo diario atualizado - colaborador: {}, data: {}", employeeId, date);
    }

    /**
     * Busca espelho de ponto de um periodo.
     */
    @Transactional(readOnly = true)
    public List<DailySummaryResponse> getTimesheetByPeriod(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        List<DailySummary> summaries = dailySummaryRepository
                .findByTenantIdAndEmployeeIdAndSummaryDateBetweenOrderBySummaryDateAsc(
                        tenantId, employeeId, startDate, endDate);

        return summaries.stream().map(this::toResponse).toList();
    }

    /**
     * Busca resumo de um dia especifico.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "timeRecords", key = "#employeeId + '-' + #date")
    public Optional<DailySummaryResponse> getDailySummary(UUID employeeId, LocalDate date) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        return dailySummaryRepository
                .findByTenantIdAndEmployeeIdAndSummaryDate(tenantId, employeeId, date)
                .map(this::toResponse);
    }

    /**
     * Busca totais de um periodo.
     */
    @Transactional(readOnly = true)
    public PeriodTotals getPeriodTotals(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        Object[] totals = dailySummaryRepository.getTotalsInPeriod(tenantId, employeeId, startDate, endDate);

        if (totals == null || totals[0] == null) {
            return new PeriodTotals(0, 0, 0, 0, 0, 0);
        }

        return new PeriodTotals(
                ((Number) totals[0]).intValue(), // workedMinutes
                ((Number) totals[1]).intValue(), // overtimeMinutes
                ((Number) totals[2]).intValue(), // deficitMinutes
                ((Number) totals[3]).intValue(), // nightShiftMinutes
                ((Number) totals[4]).intValue(), // lateArrivalMinutes
                ((Number) totals[5]).intValue()  // absences
        );
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
        int balance = summary.getOvertimeMinutes() - summary.getDeficitMinutes();

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

    public record PeriodTotals(
            int workedMinutes,
            int overtimeMinutes,
            int deficitMinutes,
            int nightShiftMinutes,
            int lateArrivalMinutes,
            int absences
    ) {}
}
