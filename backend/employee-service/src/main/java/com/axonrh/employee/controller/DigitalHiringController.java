package com.axonrh.employee.controller;

import com.axonrh.employee.dto.*;
import com.axonrh.employee.entity.enums.DigitalHiringStatus;
import com.axonrh.employee.service.DigitalHiringService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller para o fluxo de Contratacao Digital.
 * Endpoints protegidos (HR/Admin) e endpoints publicos (portal do candidato).
 */
@RestController
@RequestMapping("/api/v1/digital-hiring")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Contratação Digital", description = "Endpoints para gestão do processo de contratação digital")
public class DigitalHiringController {

    private final DigitalHiringService digitalHiringService;

    // ==================== HR/Admin Endpoints ====================

    @PostMapping
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Criar contratação digital", description = "Cria um novo processo de contratação digital e gera link para o candidato")
    public ResponseEntity<DigitalHiringResponse> create(
            @Valid @RequestBody DigitalHiringRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        String tenantId = jwt.getClaimAsString("tenant_id");
        if (tenantId != null) {
            com.axonrh.employee.config.TenantContext.setCurrentTenant(tenantId);
        }
        
        UUID userId = UUID.fromString(jwt.getSubject());
        log.info("Criando contratacao digital para: {} por usuario: {}", request.getCandidateEmail(), userId);

        DigitalHiringResponse response = digitalHiringService.create(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/trigger")
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Disparar contratação via recrutamento", description = "Dispara contratação digital a partir de candidato aprovado no recrutamento")
    public ResponseEntity<DigitalHiringResponse> triggerFromRecruitment(
            @Valid @RequestBody DigitalHiringTriggerRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        String tenantId = jwt.getClaimAsString("tenant_id");
        if (tenantId != null) {
            com.axonrh.employee.config.TenantContext.setCurrentTenant(tenantId);
        }

        UUID userId = UUID.fromString(jwt.getSubject());
        log.info("Disparando contratacao digital via recrutamento - candidato: {}", request.getCandidateId());

        DigitalHiringResponse response = digitalHiringService.triggerFromRecruitment(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Listar contratações digitais", description = "Lista todos os processos de contratação digital com filtros")
    public ResponseEntity<Page<DigitalHiringResponse>> list(
            @RequestParam(required = false) DigitalHiringStatus status,
            @RequestParam(required = false) String search,
            Pageable pageable,
            @AuthenticationPrincipal Jwt jwt) {

        String tenantId = jwt.getClaimAsString("tenant_id");
        if (tenantId != null) {
            com.axonrh.employee.config.TenantContext.setCurrentTenant(tenantId);
        }

        log.info("Listando contratacoes digitais, status: {}, search: {}", status, search);
        Page<DigitalHiringResponse> processes = digitalHiringService.list(status, search, pageable);
        return ResponseEntity.ok(processes);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Obter contratação digital", description = "Obtém detalhes de um processo de contratação digital")
    public ResponseEntity<DigitalHiringResponse> getById(@PathVariable UUID id) {

        log.info("Buscando contratacao digital: {}", id);
        DigitalHiringResponse response = digitalHiringService.getById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Estatísticas de contratação", description = "Retorna estatísticas dos processos de contratação digital")
    public ResponseEntity<DigitalHiringStatsResponse> getStats(@AuthenticationPrincipal Jwt jwt) {

        String tenantId = jwt.getClaimAsString("tenant_id");
        if (tenantId != null) {
            com.axonrh.employee.config.TenantContext.setCurrentTenant(tenantId);
        }

        log.info("Buscando estatisticas de contratacao digital");
        DigitalHiringStatsResponse stats = digitalHiringService.getStats();
        return ResponseEntity.ok(stats);
    }

    @PostMapping("/{id}/resend-email")
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Reenviar email", description = "Reenvia o email de contratação digital para o candidato")
    public ResponseEntity<Map<String, String>> resendEmail(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        log.info("Reenviando email de contratacao digital: {} por usuario: {}", id, userId);

        Map<String, String> result = digitalHiringService.resendEmail(id, userId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/force-advance")
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Forçar avanço de etapa", description = "Força o avanço para a próxima etapa do processo")
    public ResponseEntity<DigitalHiringResponse> forceAdvance(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        log.info("Forcando avanco de etapa: {} por usuario: {}", id, userId);

        DigitalHiringResponse response = digitalHiringService.forceAdvance(id, userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/request-correction")
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Solicitar correção", description = "Solicita correção de dados ou documentos ao candidato")
    public ResponseEntity<Void> requestCorrection(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {

        String message = body.get("message");
        log.info("Solicitando correcao para contratacao digital: {}", id);

        digitalHiringService.requestCorrection(id, message);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Cancelar contratação", description = "Cancela um processo de contratação digital em andamento")
    public ResponseEntity<Void> cancel(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {

        String reason = body != null ? body.get("reason") : null;
        log.info("Cancelando contratacao digital: {}, motivo: {}", id, reason);

        digitalHiringService.cancel(id, reason);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/email")
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Atualizar e-mail do candidato", description = "Atualiza o e-mail do candidato e reenvia o convite")
    public ResponseEntity<Void> updateEmail(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {

        String email = body.get("email");
        log.info("Atualizando e-mail da contratacao digital: {} para: {}", id, email);

        digitalHiringService.updateEmail(id, email);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/ai-analysis")
    @PreAuthorize("hasAuthority('EMPLOYEE:READ')")
    @Operation(summary = "Análise IA", description = "Retorna análise de consistência da IA para o processo")
    public ResponseEntity<Map<String, Object>> getAiAnalysis(@PathVariable UUID id) {

        log.info("Buscando analise IA para contratacao digital: {}", id);
        Map<String, Object> analysis = digitalHiringService.getAiAnalysis(id);
        return ResponseEntity.ok(analysis);
    }

    @PostMapping("/{id}/generate-contract")
    @PreAuthorize("hasAuthority('EMPLOYEE:WRITE')")
    @Operation(summary = "Gerar contrato", description = "Gera ou regenera o contrato de trabalho via IA")
    public ResponseEntity<Map<String, String>> generateContract(@PathVariable UUID id) {

        log.info("Gerando contrato para contratacao digital: {}", id);
        Map<String, String> result = digitalHiringService.generateContract(id);
        return ResponseEntity.ok(result);
    }

    // ==================== Public Candidate Portal Endpoints ====================

    @GetMapping("/public/{token}")
    @Operation(summary = "Acessar processo por token", description = "Permite ao candidato acessar seu processo de contratação via token")
    public ResponseEntity<DigitalHiringResponse> accessByToken(@PathVariable String token) {

        log.info("Candidato acessando contratacao digital por token");
        DigitalHiringResponse response = digitalHiringService.accessByToken(token);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/public/{token}/create-password")
    @Operation(summary = "Criar senha", description = "Candidato cria senha para acesso ao portal (primeiro acesso)")
    public ResponseEntity<Map<String, String>> createPassword(
            @PathVariable String token,
            @RequestBody Map<String, String> body) {

        String cpf = body.get("cpf");
        String password = body.get("password");
        log.info("Candidato criando senha para token");

        Map<String, String> result = digitalHiringService.createPassword(token, cpf, password);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/public/{token}/login")
    @Operation(summary = "Login do candidato", description = "Candidato faz login com CPF e senha")
    public ResponseEntity<Map<String, String>> login(
            @PathVariable String token,
            @RequestBody Map<String, String> body) {

        String cpf = body.get("cpf");
        String password = body.get("password");
        log.info("Candidato fazendo login para token");

        Map<String, String> result = digitalHiringService.login(token, cpf, password);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/public/{token}/personal-data")
    @Operation(summary = "Salvar dados pessoais", description = "Candidato preenche dados pessoais (Etapa 1)")
    public ResponseEntity<Void> savePersonalData(
            @PathVariable String token,
            @RequestBody Map<String, Object> data) {

        log.info("Candidato salvando dados pessoais");
        digitalHiringService.savePersonalData(token, data);
        return ResponseEntity.ok().build();
    }

    @PostMapping(value = "/public/{token}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload de documento", description = "Candidato envia documento (Etapa 2)")
    public ResponseEntity<Map<String, Object>> uploadDocument(
            @PathVariable String token,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") String documentType) {

        log.info("Candidato enviando documento tipo: {}", documentType);
        Map<String, Object> result = digitalHiringService.uploadDocument(token, file, documentType);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/public/{token}/documents")
    @Operation(summary = "Listar documentos", description = "Lista documentos já enviados pelo candidato")
    public ResponseEntity<List<Map<String, Object>>> getDocuments(@PathVariable String token) {

        log.info("Listando documentos do candidato");
        List<Map<String, Object>> documents = digitalHiringService.getDocuments(token);
        return ResponseEntity.ok(documents);
    }

    @PostMapping("/public/{token}/validate-documents")
    @Operation(summary = "Validar documentos", description = "Solicita validação de todos os documentos enviados")
    public ResponseEntity<Map<String, Object>> validateDocuments(@PathVariable String token) {

        log.info("Validando documentos do candidato");
        Map<String, Object> result = digitalHiringService.validateDocuments(token);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/public/{token}/work-data")
    @Operation(summary = "Salvar dados trabalhistas", description = "Candidato preenche dados trabalhistas (Etapa 3)")
    public ResponseEntity<Void> saveWorkData(
            @PathVariable String token,
            @RequestBody Map<String, Object> data) {

        log.info("Candidato salvando dados trabalhistas");
        digitalHiringService.saveWorkData(token, data);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/public/{token}/contract")
    @Operation(summary = "Obter contrato", description = "Obtém o contrato de trabalho para visualização e assinatura")
    public ResponseEntity<Map<String, String>> getContract(@PathVariable String token) {

        log.info("Candidato obtendo contrato");
        Map<String, String> result = digitalHiringService.getContract(token);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/public/{token}/sign")
    @Operation(summary = "Assinar contrato", description = "Candidato assina contrato eletronicamente (Etapa 4)")
    public ResponseEntity<Void> signContract(
            @PathVariable String token,
            @Valid @RequestBody DigitalHiringSignatureRequest request) {

        log.info("Candidato assinando contrato");
        digitalHiringService.signContract(token, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/public/{token}/ai-chat")
    @Operation(summary = "Chat IA", description = "Candidato interage com assistente IA durante o processo")
    public ResponseEntity<Map<String, Object>> aiChat(
            @PathVariable String token,
            @RequestBody Map<String, String> body) {

        String message = body.get("message");
        log.info("Candidato interagindo com IA");

        Map<String, Object> result = digitalHiringService.aiChat(token, message);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/public/{token}/validate-data")
    @Operation(summary = "Validação IA dos dados", description = "Solicita validação de consistência dos dados via IA")
    public ResponseEntity<Map<String, Object>> validateData(@PathVariable String token) {

        log.info("Validando dados do candidato via IA");
        Map<String, Object> result = digitalHiringService.validateData(token);
        return ResponseEntity.ok(result);
    }
}
