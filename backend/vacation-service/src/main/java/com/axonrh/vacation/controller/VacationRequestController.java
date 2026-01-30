package com.axonrh.vacation.controller;

import com.axonrh.vacation.dto.VacationRequestCreateDTO;
import com.axonrh.vacation.dto.VacationRequestResponse;
import com.axonrh.vacation.dto.VacationReviewDTO;
import com.axonrh.vacation.service.VacationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/vacations/requests")
@RequiredArgsConstructor
public class VacationRequestController {

    private final VacationService service;

    // --- Employee Endpoints ---

    @PostMapping
    public ResponseEntity<VacationRequestResponse> create(
            @RequestBody VacationRequestCreateDTO dto,
            @AuthenticationPrincipal Jwt jwt) {
        
        UUID employeeId = getUserId(jwt);
        String employeeName = getUserName(jwt);

        return ResponseEntity.ok(service.createRequest(dto, employeeId, employeeName));
    }

    @GetMapping("/my-requests")
    public ResponseEntity<List<VacationRequestResponse>> getMyRequests(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(service.getEmployeeRequests(getUserId(jwt)));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<VacationRequestResponse> cancel(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(service.cancelRequest(id, getUserId(jwt)));
    }

    // --- Manager / Approver Endpoints ---

    @GetMapping("/pending")
    public ResponseEntity<Page<VacationRequestResponse>> getPendingRequests(
            Pageable pageable,
            @AuthenticationPrincipal Jwt jwt) {
        UUID managerId = getUserId(jwt);
        return ResponseEntity.ok(service.getPendingRequestsForManager(managerId, pageable));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<VacationRequestResponse> approve(
            @PathVariable UUID id,
            @RequestBody VacationReviewDTO review,
            @AuthenticationPrincipal Jwt jwt) {
        
        UUID approverId = getUserId(jwt);
        String approverName = getUserName(jwt);

        return ResponseEntity.ok(service.approveRequest(id, review.getNotes(), approverId, approverName));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<VacationRequestResponse> reject(
            @PathVariable UUID id,
            @RequestBody VacationReviewDTO review,
            @AuthenticationPrincipal Jwt jwt) {
        
        UUID approverId = getUserId(jwt);
        String approverName = getUserName(jwt);

        return ResponseEntity.ok(service.rejectRequest(id, review.getReason(), approverId, approverName));
    }

    // --- Common / Admin ---

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<VacationRequestResponse>> getEmployeeRequests(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(service.getEmployeeRequests(employeeId));
    }

    // --- Helpers ---

    private UUID getUserId(Jwt jwt) {
        if (jwt == null) return UUID.fromString("00000000-0000-0000-0000-000000000000"); // Fallback for dev
        return UUID.fromString(jwt.getSubject()); // Assuming 'sub' is the userId
    }

    private String getUserName(Jwt jwt) {
        if (jwt == null) return "Unknown User";
        if (jwt.hasClaim("name")) return jwt.getClaimAsString("name");
        if (jwt.hasClaim("fullName")) return jwt.getClaimAsString("fullName");
        return "User";
    }
}
