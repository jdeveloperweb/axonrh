package com.axonrh.employee.controller;

import com.axonrh.employee.dto.CandidateStatusUpdateRequest;
import com.axonrh.employee.dto.TalentCandidateRequest;
import com.axonrh.employee.dto.TalentCandidateResponse;
import com.axonrh.employee.dto.TalentPoolStatsResponse;
import com.axonrh.employee.entity.enums.CandidateStatus;
import com.axonrh.employee.service.TalentPoolService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/talent-pool/candidates")
@RequiredArgsConstructor
@Tag(name = "Candidatos", description = "Gerenciamento de candidatos do banco de talentos")
public class TalentCandidateController {

    private final TalentPoolService talentPoolService;

    @GetMapping
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Listar todos os candidatos")
    public ResponseEntity<List<TalentCandidateResponse>> findAll() {
        return ResponseEntity.ok(talentPoolService.findAllCandidates());
    }

    @GetMapping("/paginated")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Listar candidatos paginados")
    public ResponseEntity<Page<TalentCandidateResponse>> findAllPaginated(
            @PageableDefault(size = 20, sort = "appliedAt") Pageable pageable) {
        return ResponseEntity.ok(talentPoolService.findAllCandidates(pageable));
    }

    @GetMapping("/vacancy/{vacancyId}")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Listar candidatos por vaga")
    public ResponseEntity<List<TalentCandidateResponse>> findByVacancy(@PathVariable UUID vacancyId) {
        return ResponseEntity.ok(talentPoolService.findCandidatesByVacancy(vacancyId));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Listar candidatos por status")
    public ResponseEntity<List<TalentCandidateResponse>> findByStatus(@PathVariable CandidateStatus status) {
        return ResponseEntity.ok(talentPoolService.findCandidatesByStatus(status));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Buscar candidato por ID")
    public ResponseEntity<TalentCandidateResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(talentPoolService.findCandidateById(id));
    }

    @PostMapping(value = "/vacancy/{vacancyId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Adicionar candidato manualmente")
    public ResponseEntity<TalentCandidateResponse> addCandidate(
            @PathVariable UUID vacancyId,
            @Valid @RequestPart("data") TalentCandidateRequest request,
            @RequestPart(value = "resume", required = false) MultipartFile resumeFile) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(talentPoolService.addCandidate(vacancyId, request, resumeFile));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Atualizar candidato")
    public ResponseEntity<TalentCandidateResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody TalentCandidateRequest request) {
        return ResponseEntity.ok(talentPoolService.updateCandidate(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Atualizar status do candidato")
    public ResponseEntity<TalentCandidateResponse> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody CandidateStatusUpdateRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = getUserId(jwt);
        return ResponseEntity.ok(talentPoolService.updateCandidateStatus(id, request, userId));
    }

    @PostMapping(value = "/{id}/resume", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Upload de currículo")
    public ResponseEntity<TalentCandidateResponse> uploadResume(
            @PathVariable UUID id,
            @RequestPart("file") MultipartFile resumeFile) {
        return ResponseEntity.ok(talentPoolService.uploadResume(id, resumeFile));
    }

    @GetMapping("/{id}/resume/download")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Download de currículo")
    public ResponseEntity<byte[]> downloadResume(@PathVariable UUID id) {
        java.util.Map<String, Object> resumeData = talentPoolService.getResumeFile(id);
        byte[] content = (byte[]) resumeData.get("content");
        String fileName = (String) resumeData.get("fileName");
        String contentType = (String) resumeData.get("contentType");

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(content);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Excluir candidato")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        talentPoolService.deleteCandidate(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Obter estatísticas do banco de talentos")
    public ResponseEntity<TalentPoolStatsResponse> getStats() {
        return ResponseEntity.ok(talentPoolService.getStats());
    }

    private UUID getUserId(Jwt jwt) {
        return jwt != null ? UUID.fromString(jwt.getSubject()) : UUID.fromString("00000000-0000-0000-0000-000000000000");
    }
}
