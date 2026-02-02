package com.axonrh.timesheet.service;

import com.axonrh.timesheet.dto.WorkScheduleRequest;
import com.axonrh.timesheet.dto.WorkScheduleResponse;
import com.axonrh.timesheet.entity.ScheduleDay;
import com.axonrh.timesheet.entity.WorkSchedule;
import com.axonrh.timesheet.repository.WorkScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class WorkScheduleService {

    private final WorkScheduleRepository workScheduleRepository;

    public List<WorkScheduleResponse> findAll(UUID tenantId) {
        return workScheduleRepository.findByTenantIdAndActiveTrue(tenantId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public WorkScheduleResponse findById(UUID tenantId, UUID id) {
        return workScheduleRepository.findByTenantIdAndId(tenantId, id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("Escala não encontrada"));
    }

    @Transactional
    public WorkScheduleResponse create(UUID tenantId, WorkScheduleRequest request) {
        WorkSchedule schedule = mapToEntity(request);
        schedule.setTenantId(tenantId);
        
        WorkSchedule saved = workScheduleRepository.save(schedule);
        return mapToResponse(saved);
    }

    @Transactional
    public WorkScheduleResponse update(UUID tenantId, UUID id, WorkScheduleRequest request) {
        WorkSchedule existing = workScheduleRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new RuntimeException("Escala não encontrada"));

        updateEntity(existing, request);
        
        WorkSchedule saved = workScheduleRepository.save(existing);
        return mapToResponse(saved);
    }

    @Transactional
    public void delete(UUID tenantId, UUID id) {
        WorkSchedule existing = workScheduleRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new RuntimeException("Escala não encontrada"));
        
        existing.setActive(false);
        workScheduleRepository.save(existing);
    }

    private WorkSchedule mapToEntity(WorkScheduleRequest request) {
        WorkSchedule entity = WorkSchedule.builder()
                .name(request.getName())
                .description(request.getDescription())
                .scheduleType(request.getScheduleType())
                .workRegime(request.getWorkRegime())
                .weeklyHoursMinutes(request.getWeeklyHoursMinutes())
                .toleranceMinutes(request.getToleranceMinutes())
                .minBreakMinutes(request.getMinBreakMinutes())
                .maxDailyOvertimeMinutes(request.getMaxDailyOvertimeMinutes())
                .validFrom(request.getValidFrom())
                .validUntil(request.getValidUntil())
                .overtimeBankEnabled(request.getOvertimeBankEnabled())
                .overtimeBankExpirationMonths(request.getOvertimeBankExpirationMonths())
                .nightShiftStart(request.getNightShiftStart())
                .nightShiftEnd(request.getNightShiftEnd())
                .nightShiftAdditionalPercent(request.getNightShiftAdditionalPercent())
                .unionAgreementId(request.getUnionAgreementId())
                .unionAgreementName(request.getUnionAgreementName())
                .active(true)
                .build();

        if (request.getDays() != null) {
            request.getDays().forEach(dayReq -> {
                ScheduleDay day = ScheduleDay.builder()
                        .dayOfWeek(DayOfWeek.valueOf(dayReq.getDayOfWeek()))
                        .isWorkDay(dayReq.getIsWorkDay())
                        .entryTime(dayReq.getEntryTime())
                        .exitTime(dayReq.getExitTime())
                        .breakStartTime(dayReq.getBreakStartTime())
                        .breakEndTime(dayReq.getBreakEndTime())
                        .break2StartTime(dayReq.getBreak2StartTime())
                        .break2EndTime(dayReq.getBreak2EndTime())
                        .expectedWorkMinutes(dayReq.getExpectedWorkMinutes())
                        .toleranceMinutes(dayReq.getToleranceMinutes())
                        .notes(dayReq.getNotes())
                        .build();
                entity.addScheduleDay(day);
            });
        }

        return entity;
    }

    private void updateEntity(WorkSchedule entity, WorkScheduleRequest request) {
        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        entity.setScheduleType(request.getScheduleType());
        entity.setWorkRegime(request.getWorkRegime());
        entity.setWeeklyHoursMinutes(request.getWeeklyHoursMinutes());
        entity.setToleranceMinutes(request.getToleranceMinutes());
        entity.setMinBreakMinutes(request.getMinBreakMinutes());
        entity.setMaxDailyOvertimeMinutes(request.getMaxDailyOvertimeMinutes());
        entity.setValidFrom(request.getValidFrom());
        entity.setValidUntil(request.getValidUntil());
        entity.setOvertimeBankEnabled(request.getOvertimeBankEnabled());
        entity.setOvertimeBankExpirationMonths(request.getOvertimeBankExpirationMonths());
        entity.setNightShiftStart(request.getNightShiftStart());
        entity.setNightShiftEnd(request.getNightShiftEnd());
        entity.setNightShiftAdditionalPercent(request.getNightShiftAdditionalPercent());
        entity.setUnionAgreementId(request.getUnionAgreementId());
        entity.setUnionAgreementName(request.getUnionAgreementName());

        // Update schedule days robustly
        if (request.getDays() != null) {
            // Map existing days by dayOfWeek for easy lookup
            java.util.Map<DayOfWeek, ScheduleDay> existingDays = entity.getScheduleDays().stream()
                    .collect(java.util.stream.Collectors.toMap(ScheduleDay::getDayOfWeek, d -> d));

            // Clear the list while maintaining references if possible, or just rebuild it correctly
            entity.getScheduleDays().clear();

            request.getDays().forEach(dayReq -> {
                DayOfWeek dow = DayOfWeek.valueOf(dayReq.getDayOfWeek());
                ScheduleDay day = existingDays.getOrDefault(dow, new ScheduleDay());
                
                day.setDayOfWeek(dow);
                day.setIsWorkDay(dayReq.getIsWorkDay());
                day.setEntryTime(dayReq.getEntryTime());
                day.setExitTime(dayReq.getExitTime());
                day.setBreakStartTime(dayReq.getBreakStartTime());
                day.setBreakEndTime(dayReq.getBreakEndTime());
                day.setBreak2StartTime(dayReq.getBreak2StartTime());
                day.setBreak2EndTime(dayReq.getBreak2EndTime());
                day.setExpectedWorkMinutes(dayReq.getExpectedWorkMinutes());
                day.setToleranceMinutes(dayReq.getToleranceMinutes());
                day.setNotes(dayReq.getNotes());
                
                entity.addScheduleDay(day);
            });
        }
    }

    private WorkScheduleResponse mapToResponse(WorkSchedule entity) {
        List<WorkScheduleResponse.ScheduleDayResponse> days = entity.getScheduleDays().stream()
                .sorted(java.util.Comparator.comparing(d -> d.getDayOfWeek().getValue())) // Monday(1) to Sunday(7)
                .map(day -> WorkScheduleResponse.ScheduleDayResponse.builder()
                        .id(day.getId())
                        .dayOfWeek(day.getDayOfWeek())
                        .dayOfWeekLabel(day.getDayOfWeek().getDisplayName(java.time.format.TextStyle.FULL, new java.util.Locale("pt", "BR")))
                        .isWorkDay(day.getIsWorkDay())
                        .entryTime(day.getEntryTime())
                        .exitTime(day.getExitTime())
                        .breakStartTime(day.getBreakStartTime())
                        .breakEndTime(day.getBreakEndTime())
                        .break2StartTime(day.getBreak2StartTime())
                        .break2EndTime(day.getBreak2EndTime())
                        .expectedWorkMinutes(day.getExpectedWorkMinutes())
                        .expectedWorkFormatted(formatMinutes(day.getExpectedWorkMinutes()))
                        .toleranceMinutes(day.getToleranceMinutes())
                        .notes(day.getNotes())
                        .build())
                .collect(java.util.stream.Collectors.toList());

        return WorkScheduleResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .name(entity.getName())
                .description(entity.getDescription())
                .scheduleType(entity.getScheduleType())
                .workRegime(entity.getWorkRegime())
                .workRegimeLabel(entity.getWorkRegime() != null ? entity.getWorkRegime().name() : null)
                .weeklyHoursMinutes(entity.getWeeklyHoursMinutes())
                .weeklyHoursFormatted(formatMinutes(entity.getWeeklyHoursMinutes()))
                .toleranceMinutes(entity.getToleranceMinutes())
                .minBreakMinutes(entity.getMinBreakMinutes())
                .maxDailyOvertimeMinutes(entity.getMaxDailyOvertimeMinutes())
                .validFrom(entity.getValidFrom())
                .validUntil(entity.getValidUntil())
                .overtimeBankEnabled(entity.getOvertimeBankEnabled())
                .overtimeBankExpirationMonths(entity.getOvertimeBankExpirationMonths())
                .nightShiftStart(entity.getNightShiftStart())
                .nightShiftEnd(entity.getNightShiftEnd())
                .nightShiftAdditionalPercent(entity.getNightShiftAdditionalPercent())
                .unionAgreementId(entity.getUnionAgreementId())
                .unionAgreementName(entity.getUnionAgreementName())
                .active(entity.getActive())
                .days(days)
                .build();
    }

    private String formatMinutes(Integer minutes) {
        if (minutes == null) return "0h00";
        int h = minutes / 60;
        int m = minutes % 60;
        return String.format("%dh%02d", h, m);
    }
}
