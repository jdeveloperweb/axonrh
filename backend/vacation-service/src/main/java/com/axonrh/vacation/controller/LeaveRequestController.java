package com.axonrh.vacation.controller;

import com.axonrh.vacation.entity.LeaveRequest;
import com.axonrh.vacation.entity.enums.VacationRequestStatus;
import com.axonrh.vacation.service.LeaveRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/leaves")
@RequiredArgsConstructor
public class LeaveRequestController {

    private final LeaveRequestService leaveRequestService;

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<LeaveRequest> createLeave(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader(value = "X-User-ID", required = false) UUID userId,
            @RequestParam("type") String type,
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate,
            @RequestParam("employeeId") UUID employeeId,
            @RequestParam(value = "reason", required = false) String reason,
            @RequestParam(value = "cid", required = false) String cid,
            @RequestParam(value = "certificateText", required = false) String certificateText,
            @RequestParam(value = "certificate", required = false) org.springframework.web.multipart.MultipartFile certificate) {
        
        LeaveRequest request = LeaveRequest.builder()
                .tenantId(tenantId)
                .employeeId(employeeId)
                .type(com.axonrh.vacation.entity.enums.LeaveType.valueOf(type))
                .startDate(java.time.LocalDate.parse(startDate))
                .endDate(java.time.LocalDate.parse(endDate))
                .reason(reason)
                .cid(cid)
                .createdBy(userId)
                .status(VacationRequestStatus.PENDING)
                .build();
        
        // Em um sistema real, salvaríamos o arquivo no S3/Storage e pegaríamos a URL
        if (certificate != null && !certificate.isEmpty()) {
            request.setCertificateUrl("uploads/" + certificate.getOriginalFilename());
            // Se o texto não veio do frontend, o service pode extrair do PDF/Imagem via OCR
        }

        return ResponseEntity.ok(leaveRequestService.createLeaveRequest(request, certificateText));
    }

    @PostMapping(consumes = {"application/json"})
    public ResponseEntity<LeaveRequest> createLeaveJson(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader(value = "X-User-ID", required = false) UUID userId,
            @RequestBody Map<String, Object> payload) {
        
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

    @GetMapping("/active")
    public ResponseEntity<List<LeaveRequest>> listActiveLeaves(@RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(leaveRequestService.getActiveLeaves(tenantId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeaveRequest> getLeaveById(@PathVariable UUID id) {
        return ResponseEntity.ok(leaveRequestService.getLeaveById(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<LeaveRequest> updateLeave(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(leaveRequestService.updateLeave(id, payload));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<LeaveRequest> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> payload) {
        VacationRequestStatus status = VacationRequestStatus.valueOf(payload.get("status"));
        String notes = payload.get("notes");
        String cid = payload.get("cid");
        return ResponseEntity.ok(leaveRequestService.updateStatus(id, status, notes, cid));
    }

    @PostMapping("/analyze-certificate")
    public ResponseEntity<?> analyzeCertificate(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam("certificate") org.springframework.web.multipart.MultipartFile certificate) {
        try {
            log.info(">>> [Vacation Service] Recebido certificado para análise: {} (Size: {})", 
                certificate.getOriginalFilename(), certificate.getSize());
            
            String base64 = Base64.getEncoder().encodeToString(certificate.getBytes());
            com.axonrh.vacation.dto.MedicalCertificateAnalysisRequest request = com.axonrh.vacation.dto.MedicalCertificateAnalysisRequest.builder()
                    .imageBase64(base64)
                    .fileName(certificate.getOriginalFilename())
                    .build();
            
            log.info(">>> [Vacation Service] Chamando AI Assistant Client...");
            var response = leaveRequestService.analyzeCertificate(tenantId, request);
            log.info(">>> [Vacation Service] Resposta da IA recebida com sucesso.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error(">>> [Vacation Service] ERRO ao processar certificado: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Erro ao processar certificado: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLeave(@PathVariable UUID id) {
        leaveRequestService.deleteLeave(id);
        return ResponseEntity.ok().build();
    }
}
