package com.axonrh.employee.controller;

import com.axonrh.employee.dto.PublicCandidateApplicationRequest;
import com.axonrh.employee.dto.PublicVacancyResponse;
import com.axonrh.employee.dto.TalentCandidateResponse;
import com.axonrh.employee.service.TalentPoolService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Controller público para acesso às vagas e candidaturas.
 * Não requer autenticação.
 */
@RestController
@RequestMapping("/api/v1/public/careers")
@RequiredArgsConstructor
@Tag(name = "Carreiras (Público)", description = "Acesso público às vagas e formulário de candidatura")
public class PublicTalentPoolController {

    private final TalentPoolService talentPoolService;

    @GetMapping("/vacancies")
    @Operation(summary = "Listar vagas abertas")
    public ResponseEntity<List<PublicVacancyResponse>> listOpenVacancies() {
        return ResponseEntity.ok(talentPoolService.findOpenVacancies());
    }

    @GetMapping("/vacancies/{publicCode}")
    @Operation(summary = "Visualizar detalhes da vaga")
    public ResponseEntity<PublicVacancyResponse> getVacancy(@PathVariable String publicCode) {
        return ResponseEntity.ok(talentPoolService.findPublicVacancy(publicCode));
    }

    @PostMapping(value = "/vacancies/{publicCode}/apply", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Candidatar-se a uma vaga")
    public ResponseEntity<TalentCandidateResponse> apply(
            @PathVariable String publicCode,
            @Valid @RequestPart("data") PublicCandidateApplicationRequest request,
            @RequestPart(value = "resume", required = false) MultipartFile resumeFile) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(talentPoolService.applyToVacancy(publicCode, request, resumeFile));
    }

    @PostMapping(value = "/vacancies/{publicCode}/apply/json", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Candidatar-se a uma vaga (JSON apenas, sem currículo)")
    public ResponseEntity<TalentCandidateResponse> applyJson(
            @PathVariable String publicCode,
            @Valid @RequestBody PublicCandidateApplicationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(talentPoolService.applyToVacancy(publicCode, request, null));
    }
}
