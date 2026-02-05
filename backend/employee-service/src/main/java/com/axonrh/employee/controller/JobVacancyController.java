package com.axonrh.employee.controller;

import com.axonrh.employee.dto.JobVacancyRequest;
import com.axonrh.employee.dto.JobVacancyResponse;
import com.axonrh.employee.entity.enums.VacancyStatus;
import com.axonrh.employee.service.TalentPoolService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/talent-pool/vacancies")
@RequiredArgsConstructor
@Tag(name = "Vagas", description = "Gerenciamento de vagas do banco de talentos")
public class JobVacancyController {

    private final TalentPoolService talentPoolService;

    @GetMapping
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Listar todas as vagas")
    public ResponseEntity<List<JobVacancyResponse>> findAll() {
        return ResponseEntity.ok(talentPoolService.findAllVacancies());
    }

    @GetMapping("/paginated")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Listar vagas paginadas")
    public ResponseEntity<Page<JobVacancyResponse>> findAllPaginated(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(talentPoolService.findAllVacancies(pageable));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Listar vagas por status")
    public ResponseEntity<List<JobVacancyResponse>> findByStatus(@PathVariable VacancyStatus status) {
        return ResponseEntity.ok(talentPoolService.findVacanciesByStatus(status));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Buscar vaga por ID")
    public ResponseEntity<JobVacancyResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(talentPoolService.findVacancyById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('EMPLOYEE:CREATE')")
    @Operation(summary = "Criar nova vaga")
    public ResponseEntity<JobVacancyResponse> create(
            @Valid @RequestBody JobVacancyRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = getUserId(jwt);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(talentPoolService.createVacancy(request, userId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE:UPDATE')")
    @Operation(summary = "Atualizar vaga")
    public ResponseEntity<JobVacancyResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody JobVacancyRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = getUserId(jwt);
        return ResponseEntity.ok(talentPoolService.updateVacancy(id, request, userId));
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAuthority('EMPLOYEE:UPDATE')")
    @Operation(summary = "Publicar vaga")
    public ResponseEntity<JobVacancyResponse> publish(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = getUserId(jwt);
        return ResponseEntity.ok(talentPoolService.publishVacancy(id, userId));
    }

    @PostMapping("/{id}/pause")
    @PreAuthorize("hasAuthority('EMPLOYEE:UPDATE')")
    @Operation(summary = "Pausar vaga")
    public ResponseEntity<JobVacancyResponse> pause(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = getUserId(jwt);
        return ResponseEntity.ok(talentPoolService.pauseVacancy(id, userId));
    }

    @PostMapping("/{id}/reopen")
    @PreAuthorize("hasAuthority('EMPLOYEE:UPDATE')")
    @Operation(summary = "Reabrir vaga pausada")
    public ResponseEntity<JobVacancyResponse> reopen(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = getUserId(jwt);
        return ResponseEntity.ok(talentPoolService.reopenVacancy(id, userId));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAuthority('EMPLOYEE:UPDATE')")
    @Operation(summary = "Fechar vaga")
    public ResponseEntity<JobVacancyResponse> close(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = getUserId(jwt);
        return ResponseEntity.ok(talentPoolService.closeVacancy(id, userId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE:DELETE')")
    @Operation(summary = "Excluir vaga")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        talentPoolService.deleteVacancy(id);
        return ResponseEntity.noContent().build();
    }

    private UUID getUserId(Jwt jwt) {
        return jwt != null ? UUID.fromString(jwt.getSubject()) : UUID.fromString("00000000-0000-0000-0000-000000000000");
    }
}
