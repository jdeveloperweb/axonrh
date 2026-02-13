package com.axonrh.benefits.controller;

import com.axonrh.benefits.dto.BenefitTypeRequest;
import com.axonrh.benefits.dto.BenefitTypeResponse;
import com.axonrh.benefits.enums.BenefitCategory;
import com.axonrh.benefits.service.BenefitTypeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/benefits/types")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tipos de Beneficio", description = "Gestao de tipos de beneficios (CRUD)")
public class BenefitTypeController {

    private final BenefitTypeService benefitTypeService;

    @PostMapping
    @Operation(summary = "Criar tipo de beneficio")
    public ResponseEntity<BenefitTypeResponse> create(
            @Valid @RequestBody BenefitTypeRequest request) {
        log.info("POST /api/v1/benefits/types - Criando tipo de beneficio: {}", request.getName());
        log.info("Rules payload: {}", request.getRules());
        BenefitTypeResponse response = benefitTypeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar tipo de beneficio")
    public ResponseEntity<BenefitTypeResponse> update(
            @Parameter(description = "ID do tipo de beneficio") @PathVariable UUID id,
            @Valid @RequestBody BenefitTypeRequest request) {
        log.info("PUT /api/v1/benefits/types/{} - Atualizando tipo de beneficio - rules: {}", id, request.getRules());
        return ResponseEntity.ok(benefitTypeService.update(id, request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar tipo de beneficio por ID")
    public ResponseEntity<BenefitTypeResponse> findById(
            @Parameter(description = "ID do tipo de beneficio") @PathVariable UUID id) {
        return ResponseEntity.ok(benefitTypeService.findById(id));
    }

    @GetMapping
    @Operation(summary = "Listar tipos de beneficio (paginado)")
    public ResponseEntity<Page<BenefitTypeResponse>> findAll(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(benefitTypeService.findAll(pageable));
    }

    @GetMapping("/active")
    @Operation(summary = "Listar tipos de beneficio ativos")
    public ResponseEntity<List<BenefitTypeResponse>> findAllActive() {
        return ResponseEntity.ok(benefitTypeService.findAllActive());
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Listar tipos de beneficio por categoria")
    public ResponseEntity<List<BenefitTypeResponse>> findByCategory(
            @Parameter(description = "Categoria: EARNING ou DEDUCTION") @PathVariable BenefitCategory category) {
        return ResponseEntity.ok(benefitTypeService.findByCategory(category));
    }

    @PatchMapping("/{id}/activate")
    @Operation(summary = "Ativar tipo de beneficio")
    public ResponseEntity<BenefitTypeResponse> activate(
            @Parameter(description = "ID do tipo de beneficio") @PathVariable UUID id) {
        log.info("PATCH /api/v1/benefits/types/{}/activate", id);
        return ResponseEntity.ok(benefitTypeService.activate(id));
    }

    @PatchMapping("/{id}/deactivate")
    @Operation(summary = "Desativar tipo de beneficio")
    public ResponseEntity<BenefitTypeResponse> deactivate(
            @Parameter(description = "ID do tipo de beneficio") @PathVariable UUID id) {
        log.info("PATCH /api/v1/benefits/types/{}/deactivate", id);
        return ResponseEntity.ok(benefitTypeService.deactivate(id));
    }
}
