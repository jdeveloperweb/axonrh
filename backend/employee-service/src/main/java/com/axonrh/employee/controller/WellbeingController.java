package com.axonrh.employee.controller;

import com.axonrh.employee.dto.WellbeingCheckInRequest;
import com.axonrh.employee.entity.EmployeeWellbeing;
import com.axonrh.employee.service.WellbeingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/employees/wellbeing")
@RequiredArgsConstructor
public class WellbeingController {

    private final WellbeingService wellbeingService;

    @PostMapping("/check-in")
    public ResponseEntity<Void> checkIn(@RequestBody WellbeingCheckInRequest request) {
        wellbeingService.processCheckIn(request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/history/{employeeId}")
    public ResponseEntity<List<EmployeeWellbeing>> getHistory(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(wellbeingService.getHistory(employeeId));
    }
}
