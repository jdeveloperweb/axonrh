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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
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
        
        UUID userId = getUserId(jwt);
        UUID employeeId = service.resolveEmployeeId(userId);
        String employeeName = getUserName(jwt);

        return ResponseEntity.ok(service.createRequest(dto, employeeId, employeeName));
    }

    @GetMapping("/my-requests")
    public ResponseEntity<List<VacationRequestResponse>> getMyRequests(@AuthenticationPrincipal Jwt jwt) {
        UUID employeeId = service.resolveEmployeeId(getUserId(jwt));
        return ResponseEntity.ok(service.getEmployeeRequests(employeeId));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<VacationRequestResponse> cancel(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = getUserId(jwt);
        List<String> roles = getRoles(jwt);
        return ResponseEntity.ok(service.cancelRequest(id, userId, roles));
    }

    // --- Manager / Approver Endpoints ---

    @GetMapping("/pending")
    public ResponseEntity<Page<VacationRequestResponse>> getPendingRequests(
            Pageable pageable,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = getUserId(jwt);
        List<String> roles = getRoles(jwt);
        
        boolean isRHOrAdmin = roles.stream()
                .anyMatch(r -> r.equalsIgnoreCase("RH") || 
                               r.equalsIgnoreCase("ROLE_RH") || 
                               r.equalsIgnoreCase("ADMIN") || 
                               r.equalsIgnoreCase("ROLE_ADMIN") ||
                               r.equalsIgnoreCase("GESTOR_RH") ||
                               r.equalsIgnoreCase("ROLE_GESTOR_RH"));

        if (isRHOrAdmin) {
            return ResponseEntity.ok(service.getAllPendingRequests(pageable));
        }

        return ResponseEntity.ok(service.getPendingRequestsForManager(userId, pageable));
    }

    @GetMapping("/pending/rh")
    public ResponseEntity<Page<VacationRequestResponse>> getPendingRequestsRH(
            Pageable pageable) {
        return ResponseEntity.ok(service.getManagerApprovedRequests(pageable));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<VacationRequestResponse> approve(
            @PathVariable UUID id,
            @RequestBody VacationReviewDTO review,
            @AuthenticationPrincipal Jwt jwt) {
        
        UUID approverId = getUserId(jwt);
        String approverName = getUserName(jwt);
        List<String> roles = getRoles(jwt);

        log.info("Usuario {} tentando aprovar solicitacao {} com roles: {}", approverId, id, roles);

        return ResponseEntity.ok(service.approveRequest(id, review.getNotes(), approverId, approverName, roles));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<VacationRequestResponse> reject(
            @PathVariable UUID id,
            @RequestBody VacationReviewDTO review,
            @AuthenticationPrincipal Jwt jwt) {
        
        UUID approverId = getUserId(jwt);
        String approverName = getUserName(jwt);
        List<String> roles = getRoles(jwt);

        return ResponseEntity.ok(service.rejectRequest(id, review.getReason(), approverId, approverName, roles));
    }

    // --- Common / Admin ---

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<VacationRequestResponse>> getEmployeeRequests(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(service.getEmployeeRequests(employeeId));
    }

    @GetMapping("/statistics")
    public ResponseEntity<com.axonrh.vacation.dto.VacationStatisticsResponse> getStatistics() {
        return ResponseEntity.ok(service.getStatistics());
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

    @SuppressWarnings("unchecked")
    private List<String> getRoles(Jwt jwt) {
        List<String> allRoles = new ArrayList<>();
        if (jwt == null) return allRoles;
        
        try {
            // Realm Roles
            if (jwt.hasClaim("realm_access")) {
                Map<String, Object> realmAccess = jwt.getClaim("realm_access");
                if (realmAccess != null && realmAccess.containsKey("roles")) {
                    allRoles.addAll((List<String>) realmAccess.get("roles"));
                }
            }
            
            // Resource/Client Roles
            if (jwt.hasClaim("resource_access")) {
                Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
                if (resourceAccess != null) {
                    resourceAccess.values().forEach(obj -> {
                        if (obj instanceof Map) {
                            Map<String, Object> clientAccess = (Map<String, Object>) obj;
                            if (clientAccess.containsKey("roles")) {
                                allRoles.addAll((List<String>) clientAccess.get("roles"));
                            }
                        }
                    });
                }
            }

            // Flat roles claim
            if (jwt.hasClaim("roles")) {
                allRoles.addAll(jwt.getClaimAsStringList("roles"));
            }
        } catch (Exception e) {
            log.warn("Erro ao extrair roles do token", e);
        }
        return allRoles;
    }
}
