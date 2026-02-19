package com.axonrh.vacation.controller;

import com.axonrh.vacation.entity.LeaveRequest;
import com.axonrh.vacation.entity.enums.VacationRequestStatus;
import com.axonrh.vacation.service.LeaveRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/leaves")
@RequiredArgsConstructor
public class LeaveRequestController {

    private final LeaveRequestService leaveRequestService;

    @PostMapping
    public ResponseEntity<LeaveRequest> createLeave(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestBody Map<String, Object> payload) {
        
        // Mapeamento manual básico para suportar o texto do atestado no mesmo payload
        LeaveRequest request = LeaveRequest.builder()
                .tenantId(tenantId)
                .employeeId(UUID.fromString(payload.get("employeeId").toString()))
                .type(com.axonrh.vacation.entity.enums.LeaveType.valueOf(payload.get("type").toString()))
                .startDate(java.time.LocalDate.parse(payload.get("startDate").toString()))
                .endDate(java.time.LocalDate.parse(payload.get("endDate").toString()))
                .createdBy(userId)
                .status(VacationRequestStatus.PENDING)
                .build();
        
        if (payload.containsKey("cid")) request.setCid(payload.get("cid").toString());
        if (payload.containsKey("reason")) request.setReason(payload.get("reason").toString());
        
        String certificateText = payload.containsKey("certificateText") ? payload.get("certificateText").toString() : null;

        return ResponseEntity.ok(leaveRequestService.createLeaveRequest(request, certificateText));
    }

    @GetMapping
    public ResponseEntity<List<LeaveRequest>> listLeaves(@RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(leaveRequestService.getLeavesByTenant(tenantId));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<LeaveRequest>> listEmployeeLeaves(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID employeeId) {
        return ResponseEntity.ok(leaveRequestService.getLeavesByEmployee(tenantId, employeeId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<LeaveRequest> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> payload) {
        VacationRequestStatus status = VacationRequestStatus.valueOf(payload.get("status"));
        String notes = payload.get("notes");
        return ResponseEntity.ok(leaveRequestService.updateStatus(id, status, notes));
    }
}
