package com.axonrh.timesheet.service;

import com.axonrh.timesheet.config.TenantContext;
import com.axonrh.timesheet.entity.TimeRecord;
import com.axonrh.timesheet.entity.enums.RecordSource;
import com.axonrh.timesheet.entity.enums.RecordStatus;
import com.axonrh.timesheet.entity.enums.RecordType;
import com.axonrh.timesheet.repository.TimeRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * T135-T136 - Servico de integracao com REP (Portaria 671).
 * Processa arquivos AFD (Arquivo Fonte de Dados) do registrador eletronico de ponto.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RepIntegrationService {

    private final TimeRecordRepository timeRecordRepository;
    private final DailySummaryService dailySummaryService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("ddMMyyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HHmm");

    /**
     * Processa arquivo AFD (Arquivo Fonte de Dados - Portaria 671).
     * Formato AFD:
     * - Tipo 1: Cabecalho
     * - Tipo 2: Inclusao/alteracao de empresa
     * - Tipo 3: Marcacao de ponto
     * - Tipo 4: Ajuste de ponto
     * - Tipo 5: Inclusao/alteracao de colaborador
     * - Tipo 9: Trailer
     */
    @Transactional
    public AfdImportResult importAfdFile(MultipartFile file, String repId, UUID userId) {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());

        AfdImportResult result = new AfdImportResult();
        result.setFileName(file.getOriginalFilename());
        result.setRepId(repId);

        List<TimeRecord> recordsToSave = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.ISO_8859_1))) {

            String line;
            int lineNumber = 0;

            while ((line = reader.readLine()) != null) {
                lineNumber++;

                if (line.length() < 1) continue;

                int recordType = Integer.parseInt(line.substring(0, 1));

                switch (recordType) {
                    case 1 -> parseHeader(line, result);
                    case 3 -> {
                        try {
                            TimeRecord record = parseTimeRecord(line, tenantId, repId, userId);
                            if (record != null) {
                                // Verificar se NSR ja existe
                                if (!timeRecordRepository.findByTenantIdAndRepIdAndNsr(
                                        tenantId, repId, record.getNsr()).isPresent()) {
                                    recordsToSave.add(record);
                                } else {
                                    result.setDuplicateCount(result.getDuplicateCount() + 1);
                                }
                            }
                        } catch (Exception e) {
                            errors.add("Linha " + lineNumber + ": " + e.getMessage());
                        }
                    }
                    case 9 -> parseTrailer(line, result);
                }
            }

            // Salvar registros
            if (!recordsToSave.isEmpty()) {
                List<TimeRecord> saved = timeRecordRepository.saveAll(recordsToSave);
                result.setImportedCount(saved.size());

                // Atualizar resumos diarios
                saved.stream()
                        .map(r -> new DateEmployee(r.getRecordDate(), r.getEmployeeId()))
                        .distinct()
                        .forEach(de -> dailySummaryService.updateDailySummary(tenantId, de.employeeId, de.date));

                log.info("AFD importado - arquivo: {}, registros: {}, duplicados: {}",
                        file.getOriginalFilename(), saved.size(), result.getDuplicateCount());
            }

            result.setErrors(errors);
            result.setSuccess(errors.isEmpty());

        } catch (IOException e) {
            log.error("Erro ao processar arquivo AFD", e);
            result.setSuccess(false);
            result.getErrors().add("Erro ao ler arquivo: " + e.getMessage());
        }

        return result;
    }

    /**
     * Processa cabecalho do AFD (Tipo 1).
     */
    private void parseHeader(String line, AfdImportResult result) {
        // Posicoes conforme Portaria 671:
        // 1: Tipo (1)
        // 2-11: CNPJ
        // 12-27: CEI
        // 28-177: Razao Social
        // 178-195: Numero fabricacao REP
        // 196-211: Data inicial
        // 212-227: Data final
        // 228-235: Data geracao

        if (line.length() >= 235) {
            try {
                String cnpj = line.substring(1, 15).trim();
                String razaoSocial = line.substring(27, 177).trim();
                String numeroRep = line.substring(177, 195).trim();

                result.setCnpj(cnpj);
                result.setCompanyName(razaoSocial);

                log.debug("Cabecalho AFD - CNPJ: {}, Empresa: {}, REP: {}", cnpj, razaoSocial, numeroRep);
            } catch (Exception e) {
                log.warn("Erro ao parsear cabecalho AFD: {}", e.getMessage());
            }
        }
    }

    /**
     * Processa registro de marcacao (Tipo 3).
     */
    private TimeRecord parseTimeRecord(String line, UUID tenantId, String repId, UUID userId) {
        // Posicoes conforme Portaria 671:
        // 1: Tipo (3)
        // 2-10: NSR
        // 11-18: Data (ddMMyyyy)
        // 19-22: Hora (HHmm)
        // 23-34: PIS
        // 35+ : Opcional

        if (line.length() < 34) {
            throw new IllegalArgumentException("Linha muito curta para tipo 3");
        }

        long nsr = Long.parseLong(line.substring(1, 10).trim());
        String dateStr = line.substring(10, 18);
        String timeStr = line.substring(18, 22);
        String pis = line.substring(22, 34).trim();

        LocalDate recordDate = LocalDate.parse(dateStr, DATE_FORMATTER);
        LocalTime recordTime = LocalTime.parse(timeStr, TIME_FORMATTER);

        // TODO: Buscar colaborador pelo PIS
        // Por enquanto, usamos o PIS como identificador temporario
        UUID employeeId = getEmployeeIdByPis(tenantId, pis);
        if (employeeId == null) {
            log.warn("Colaborador nao encontrado para PIS: {}", pis);
            return null;
        }

        // Determinar tipo de registro baseado nos registros existentes do dia
        RecordType recordType = determineRecordType(tenantId, employeeId, recordDate, recordTime);

        return TimeRecord.builder()
                .tenantId(tenantId)
                .employeeId(employeeId)
                .recordDate(recordDate)
                .recordTime(recordTime)
                .recordDatetime(LocalDateTime.of(recordDate, recordTime))
                .recordType(recordType)
                .source(RecordSource.REP)
                .status(RecordStatus.VALID)
                .repId(repId)
                .nsr(nsr)
                .createdBy(userId)
                .build();
    }

    /**
     * Processa trailer do AFD (Tipo 9).
     */
    private void parseTrailer(String line, AfdImportResult result) {
        // Posicoes:
        // 1: Tipo (9)
        // 2-10: Quantidade de registros tipo 2
        // 11-19: Quantidade de registros tipo 3
        // 20-28: Quantidade de registros tipo 4
        // 29-37: Quantidade de registros tipo 5

        if (line.length() >= 37) {
            try {
                int tipo3Count = Integer.parseInt(line.substring(10, 19).trim());
                result.setExpectedCount(tipo3Count);
                log.debug("Trailer AFD - Registros tipo 3 esperados: {}", tipo3Count);
            } catch (Exception e) {
                log.warn("Erro ao parsear trailer AFD: {}", e.getMessage());
            }
        }
    }

    /**
     * Busca colaborador pelo PIS.
     * TODO: Implementar integracao com employee-service
     */
    private UUID getEmployeeIdByPis(UUID tenantId, String pis) {
        // Implementacao simplificada - em producao, buscar do employee-service
        // Por enquanto, retorna null para PIS nao cadastrado
        return null;
    }

    /**
     * Determina o tipo de registro baseado na sequencia do dia.
     */
    private RecordType determineRecordType(UUID tenantId, UUID employeeId, LocalDate date, LocalTime time) {
        List<TimeRecord> existingRecords = timeRecordRepository
                .findByTenantIdAndEmployeeIdAndRecordDateOrderByRecordTimeAsc(tenantId, employeeId, date);

        if (existingRecords.isEmpty()) {
            return RecordType.ENTRY;
        }

        // Alternar entre entrada/saida baseado na quantidade de registros
        int count = existingRecords.size();
        if (count % 2 == 0) {
            return RecordType.ENTRY;
        } else {
            return RecordType.EXIT;
        }
    }

    /**
     * Valida arquivo AFD.
     */
    public AfdValidationResult validateAfdFile(MultipartFile file) {
        AfdValidationResult result = new AfdValidationResult();
        result.setFileName(file.getOriginalFilename());

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.ISO_8859_1))) {

            String firstLine = reader.readLine();
            if (firstLine == null || firstLine.isEmpty()) {
                result.setValid(false);
                result.setError("Arquivo vazio");
                return result;
            }

            // Verificar se comeca com tipo 1 (cabecalho)
            if (!firstLine.startsWith("1")) {
                result.setValid(false);
                result.setError("Arquivo nao comeca com cabecalho (tipo 1)");
                return result;
            }

            int lineCount = 1;
            int type3Count = 0;
            String lastLine = firstLine;

            String line;
            while ((line = reader.readLine()) != null) {
                lineCount++;
                lastLine = line;
                if (line.startsWith("3")) {
                    type3Count++;
                }
            }

            // Verificar se termina com tipo 9 (trailer)
            if (!lastLine.startsWith("9")) {
                result.setValid(false);
                result.setError("Arquivo nao termina com trailer (tipo 9)");
                return result;
            }

            result.setValid(true);
            result.setTotalLines(lineCount);
            result.setTimeRecordCount(type3Count);

        } catch (IOException e) {
            result.setValid(false);
            result.setError("Erro ao ler arquivo: " + e.getMessage());
        }

        return result;
    }

    // ==================== Classes auxiliares ====================

    public record DateEmployee(LocalDate date, UUID employeeId) {}

    @lombok.Data
    public static class AfdImportResult {
        private String fileName;
        private String repId;
        private String cnpj;
        private String companyName;
        private int expectedCount;
        private int importedCount;
        private int duplicateCount;
        private boolean success;
        private List<String> errors = new ArrayList<>();
    }

    @lombok.Data
    public static class AfdValidationResult {
        private String fileName;
        private boolean valid;
        private String error;
        private int totalLines;
        private int timeRecordCount;
    }
}
