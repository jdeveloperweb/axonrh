package com.axonrh.vacation.controller;

import com.axonrh.vacation.dto.VacationRequestResponse;
import com.axonrh.vacation.service.VacationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/vacations/calendar")
@RequiredArgsConstructor
public class VacationCalendarController {

    private final VacationService service;

    @GetMapping("/team")
    public ResponseEntity<List<VacationRequestResponse>> getTeamCalendar(
            @RequestParam int year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) String departmentId) {
        
        LocalDate start;
        LocalDate end;

        if (month != null) {
            YearMonth ym = YearMonth.of(year, month);
            start = ym.atDay(1);
            end = ym.atEndOfMonth();
        } else {
            start = LocalDate.of(year, 1, 1);
            end = LocalDate.of(year, 12, 31);
        }

        // Note: Filtering by departmentId would happen here or in service.
        // For now, returning all tenant requests for MVP.
        return ResponseEntity.ok(service.getCalendarRequests(start, end));
    }
}
