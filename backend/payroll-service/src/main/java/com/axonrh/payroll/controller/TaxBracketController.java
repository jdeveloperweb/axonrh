package com.axonrh.payroll.controller;

import com.axonrh.payroll.config.TenantContext;
import com.axonrh.payroll.entity.TaxBracket;
import com.axonrh.payroll.repository.TaxBracketRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payroll/tax-brackets")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Faixas Tributarias", description = "Configuracao de faixas de INSS e IRRF")
public class TaxBracketController {

    private final TaxBracketRepository taxBracketRepository;

    @GetMapping
    @Operation(summary = "Listar faixas por tipo de imposto")
    public ResponseEntity<List<TaxBracket>> findByType(@RequestParam(required = false) String taxType) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        List<TaxBracket> brackets;
        if (taxType != null && !taxType.isBlank()) {
            brackets = taxBracketRepository
                .findByTenantIdAndTaxTypeAndIsActiveTrueOrderByBracketOrderAsc(tenantId, taxType);
        } else {
            // Se nao informar o tipo, traz tudo ordenado pelo limite inferior
            brackets = taxBracketRepository.findByTenantIdAndIsActiveTrueOrderByMinValueAsc(tenantId);
        }
        return ResponseEntity.ok(brackets);
    }

    @PostMapping
    @Operation(summary = "Criar faixa tributaria")
    public ResponseEntity<TaxBracket> create(@RequestBody TaxBracket bracket) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        bracket.setTenantId(tenantId);
        TaxBracket saved = taxBracketRepository.save(bracket);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar faixa tributaria")
    public ResponseEntity<TaxBracket> update(@PathVariable UUID id, @RequestBody TaxBracket bracket) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        TaxBracket existing = taxBracketRepository.findById(id)
                .orElseThrow(() -> new com.axonrh.payroll.exception.ResourceNotFoundException("Faixa nao encontrada: " + id));
        existing.setMinValue(bracket.getMinValue());
        existing.setMaxValue(bracket.getMaxValue());
        existing.setRate(bracket.getRate());
        existing.setDeductionAmount(bracket.getDeductionAmount());
        existing.setEffectiveFrom(bracket.getEffectiveFrom());
        existing.setEffectiveUntil(bracket.getEffectiveUntil());
        existing.setIsActive(bracket.getIsActive());
        TaxBracket saved = taxBracketRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Desativar faixa tributaria")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        TaxBracket existing = taxBracketRepository.findById(id)
                .orElseThrow(() -> new com.axonrh.payroll.exception.ResourceNotFoundException("Faixa nao encontrada: " + id));
        existing.setIsActive(false);
        taxBracketRepository.save(existing);
        return ResponseEntity.noContent().build();
    }
}
