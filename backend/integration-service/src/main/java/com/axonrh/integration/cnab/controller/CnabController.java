package com.axonrh.integration.cnab.controller;

import com.axonrh.integration.cnab.entity.CnabFile;
import com.axonrh.integration.cnab.entity.CnabRecord;
import com.axonrh.integration.cnab.service.CnabService;
import com.axonrh.integration.cnab.service.CnabService.BankConfig;
import com.axonrh.integration.cnab.service.CnabService.PayrollPayment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cnab")
public class CnabController {

    private final CnabService cnabService;

    public CnabController(CnabService cnabService) {
        this.cnabService = cnabService;
    }

    @PostMapping("/payroll")
    public ResponseEntity<CnabFile> generatePayrollFile(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody GeneratePayrollRequest request) {

        CnabFile file = cnabService.generatePayrollFile(
                tenantId,
                request.payments(),
                request.bankConfig(),
                request.paymentDate()
        );
        return ResponseEntity.ok(file);
    }

    @PostMapping("/return")
    public ResponseEntity<CnabFile> processReturnFile(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam("file") MultipartFile file) throws IOException {

        CnabFile returnFile = cnabService.processReturnFile(
                tenantId,
                file.getOriginalFilename(),
                file.getBytes()
        );
        return ResponseEntity.ok(returnFile);
    }

    @GetMapping("/files")
    public ResponseEntity<Page<CnabFile>> listFiles(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            Pageable pageable) {

        return ResponseEntity.ok(cnabService.listFiles(tenantId, pageable));
    }

    @GetMapping("/files/{fileId}")
    public ResponseEntity<CnabFile> getFile(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID fileId) {

        return cnabService.getFile(tenantId, fileId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/files/{fileId}/records")
    public ResponseEntity<List<CnabRecord>> getFileRecords(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID fileId) {

        return ResponseEntity.ok(cnabService.getFileRecords(tenantId, fileId));
    }

    @GetMapping("/files/{fileId}/download")
    public ResponseEntity<byte[]> downloadFile(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID fileId) {

        return cnabService.getFile(tenantId, fileId)
                .map(file -> {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
                    headers.setContentDispositionFormData("attachment", file.getFileName());
                    return ResponseEntity.ok()
                            .headers(headers)
                            .body(file.getFileContent());
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Request DTOs
    public record GeneratePayrollRequest(
            List<PayrollPayment> payments,
            BankConfig bankConfig,
            LocalDate paymentDate
    ) {}
}
