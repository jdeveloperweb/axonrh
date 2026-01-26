package com.axonrh.integration.cnab.service;

import com.axonrh.integration.cnab.entity.CnabFile;
import com.axonrh.integration.cnab.entity.CnabFile.CnabFileStatus;
import com.axonrh.integration.cnab.entity.CnabFile.CnabFileType;
import com.axonrh.integration.cnab.entity.CnabFile.CnabLayout;
import com.axonrh.integration.cnab.entity.CnabRecord;
import com.axonrh.integration.cnab.entity.CnabRecord.RecordStatus;
import com.axonrh.integration.cnab.entity.CnabRecord.RecordType;
import com.axonrh.integration.cnab.repository.CnabFileRepository;
import com.axonrh.integration.cnab.repository.CnabRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class CnabService {

    private static final Logger log = LoggerFactory.getLogger(CnabService.class);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("ddMMyyyy");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HHmmss");

    private final CnabFileRepository fileRepository;
    private final CnabRecordRepository recordRepository;

    public CnabService(CnabFileRepository fileRepository, CnabRecordRepository recordRepository) {
        this.fileRepository = fileRepository;
        this.recordRepository = recordRepository;
    }

    /**
     * Gera arquivo CNAB 240 para pagamento de salarios.
     */
    public CnabFile generatePayrollFile(UUID tenantId, List<PayrollPayment> payments,
                                        BankConfig bankConfig, LocalDate paymentDate) {
        CnabFile cnabFile = new CnabFile();
        cnabFile.setTenantId(tenantId);
        cnabFile.setFileType(CnabFileType.REMESSA);
        cnabFile.setCnabLayout(CnabLayout.CNAB_240);
        cnabFile.setBankCode(bankConfig.bankCode());
        cnabFile.setBankName(bankConfig.bankName());
        cnabFile.setCompanyCode(bankConfig.companyCode());
        cnabFile.setReferenceDate(paymentDate);

        // Get next sequence number
        int sequence = fileRepository.getNextSequenceNumber(tenantId, bankConfig.bankCode());
        cnabFile.setSequenceNumber(sequence);
        cnabFile.setFileName(generateFileName(bankConfig.bankCode(), sequence));

        StringBuilder content = new StringBuilder();
        int recordSequence = 0;
        BigDecimal totalAmount = BigDecimal.ZERO;

        // Header de Arquivo (registro 0)
        CnabRecord headerArquivo = createHeaderArquivo(tenantId, cnabFile, bankConfig, ++recordSequence);
        cnabFile.addRecord(headerArquivo);
        content.append(headerArquivo.getRawContent()).append("\r\n");

        // Header de Lote (registro 1)
        CnabRecord headerLote = createHeaderLote(tenantId, cnabFile, bankConfig, ++recordSequence, paymentDate);
        cnabFile.addRecord(headerLote);
        content.append(headerLote.getRawContent()).append("\r\n");

        // Detalhes (registros 3)
        int loteSequence = 0;
        for (PayrollPayment payment : payments) {
            // Segmento A
            CnabRecord detalheA = createDetalheSegmentoA(tenantId, cnabFile, payment,
                    ++recordSequence, ++loteSequence, paymentDate);
            cnabFile.addRecord(detalheA);
            content.append(detalheA.getRawContent()).append("\r\n");

            // Segmento B
            CnabRecord detalheB = createDetalheSegmentoB(tenantId, cnabFile, payment,
                    ++recordSequence, loteSequence);
            cnabFile.addRecord(detalheB);
            content.append(detalheB.getRawContent()).append("\r\n");

            totalAmount = totalAmount.add(payment.amount());
        }

        // Trailer de Lote (registro 5)
        CnabRecord trailerLote = createTrailerLote(tenantId, cnabFile, ++recordSequence,
                loteSequence, totalAmount);
        cnabFile.addRecord(trailerLote);
        content.append(trailerLote.getRawContent()).append("\r\n");

        // Trailer de Arquivo (registro 9)
        CnabRecord trailerArquivo = createTrailerArquivo(tenantId, cnabFile, ++recordSequence, 1);
        cnabFile.addRecord(trailerArquivo);
        content.append(trailerArquivo.getRawContent()).append("\r\n");

        cnabFile.setTotalRecords(recordSequence);
        cnabFile.setTotalAmount(totalAmount);
        cnabFile.setFileContent(content.toString().getBytes(StandardCharsets.ISO_8859_1));

        return fileRepository.save(cnabFile);
    }

    /**
     * Processa arquivo de retorno CNAB.
     */
    public CnabFile processReturnFile(UUID tenantId, String fileName, byte[] content) {
        String fileContent = new String(content, StandardCharsets.ISO_8859_1);
        String[] lines = fileContent.split("\r?\n");

        if (lines.length < 2) {
            throw new IllegalArgumentException("Arquivo de retorno inválido");
        }

        // Parse header to identify the original file
        String headerLine = lines[0];
        String bankCode = headerLine.substring(0, 3);
        int sequenceNumber = Integer.parseInt(headerLine.substring(157, 163).trim());

        // Find original remessa file
        CnabFile originalFile = fileRepository
                .findByTenantIdAndSequenceNumber(tenantId, sequenceNumber)
                .orElseThrow(() -> new IllegalArgumentException("Arquivo de remessa original não encontrado"));

        // Create return file record
        CnabFile returnFile = new CnabFile();
        returnFile.setTenantId(tenantId);
        returnFile.setFileType(CnabFileType.RETORNO);
        returnFile.setCnabLayout(originalFile.getCnabLayout());
        returnFile.setBankCode(bankCode);
        returnFile.setFileName(fileName);
        returnFile.setReferenceDate(LocalDate.now());
        returnFile.setSequenceNumber(sequenceNumber);
        returnFile.setFileContent(content);

        int processedCount = 0;
        int rejectedCount = 0;

        for (String line : lines) {
            if (line.length() < 240) continue;

            String recordType = line.substring(7, 8);

            if ("3".equals(recordType)) { // Detail record
                String segmento = line.substring(13, 14);
                if ("A".equals(segmento)) {
                    String returnCode = line.substring(230, 232);
                    String employeeCpf = line.substring(134, 145).trim();

                    // Find and update original record
                    recordRepository.findByFileAndCpf(originalFile.getId(), employeeCpf)
                            .ifPresent(record -> {
                                record.setReturnCode(returnCode);
                                record.setReturnMessage(getReturnCodeMessage(returnCode));
                                record.setStatus("00".equals(returnCode) ?
                                        RecordStatus.PROCESSED : RecordStatus.REJECTED);
                                record.setProcessedAt(LocalDateTime.now());
                                recordRepository.save(record);
                            });

                    if ("00".equals(returnCode)) {
                        processedCount++;
                    } else {
                        rejectedCount++;
                    }
                }
            }
        }

        // Update original file status
        if (rejectedCount == 0) {
            originalFile.setStatus(CnabFileStatus.PROCESSED);
        } else if (processedCount == 0) {
            originalFile.setStatus(CnabFileStatus.REJECTED);
        } else {
            originalFile.setStatus(CnabFileStatus.PARTIAL);
        }
        originalFile.setProcessedAt(LocalDateTime.now());
        originalFile.setReturnFileName(fileName);
        originalFile.setReturnFileContent(content);
        fileRepository.save(originalFile);

        returnFile.setTotalRecords(processedCount + rejectedCount);
        returnFile.setStatus(CnabFileStatus.PROCESSED);
        returnFile.setProcessedAt(LocalDateTime.now());

        return fileRepository.save(returnFile);
    }

    public Page<CnabFile> listFiles(UUID tenantId, Pageable pageable) {
        return fileRepository.findByTenantId(tenantId, pageable);
    }

    public Optional<CnabFile> getFile(UUID tenantId, UUID fileId) {
        return fileRepository.findByTenantIdAndId(tenantId, fileId);
    }

    public List<CnabRecord> getFileRecords(UUID tenantId, UUID fileId) {
        return recordRepository.findByTenantIdAndCnabFileId(tenantId, fileId);
    }

    public byte[] downloadFile(UUID tenantId, UUID fileId) {
        return fileRepository.findByTenantIdAndId(tenantId, fileId)
                .map(CnabFile::getFileContent)
                .orElseThrow(() -> new IllegalArgumentException("Arquivo não encontrado"));
    }

    // Private helper methods for CNAB 240 generation

    private CnabRecord createHeaderArquivo(UUID tenantId, CnabFile file, BankConfig config, int sequence) {
        CnabRecord record = new CnabRecord();
        record.setTenantId(tenantId);
        record.setRecordType(RecordType.HEADER_ARQUIVO);
        record.setSequenceNumber(sequence);

        StringBuilder line = new StringBuilder(240);
        line.append(padLeft(config.bankCode(), 3, '0'));           // 001-003 Código do banco
        line.append("0000");                                        // 004-007 Lote de serviço
        line.append("0");                                           // 008-008 Tipo de registro
        line.append(padRight("", 9, ' '));                         // 009-017 Uso FEBRABAN
        line.append("2");                                           // 018-018 Tipo de inscrição (2=CNPJ)
        line.append(padLeft(config.cnpj(), 14, '0'));              // 019-032 CNPJ
        line.append(padRight(config.convenio(), 20, ' '));         // 033-052 Código do convênio
        line.append(padLeft(config.agencia(), 5, '0'));            // 053-057 Agência
        line.append(padLeft(config.agenciaDigito(), 1, ' '));      // 058-058 Dígito agência
        line.append(padLeft(config.conta(), 12, '0'));             // 059-070 Conta
        line.append(padLeft(config.contaDigito(), 1, ' '));        // 071-071 Dígito conta
        line.append(" ");                                           // 072-072 Dígito verificador
        line.append(padRight(config.companyName(), 30, ' '));      // 073-102 Nome da empresa
        line.append(padRight(config.bankName(), 30, ' '));         // 103-132 Nome do banco
        line.append(padRight("", 10, ' '));                        // 133-142 Uso FEBRABAN
        line.append("1");                                           // 143-143 Código remessa
        line.append(LocalDate.now().format(DATE_FORMAT));          // 144-151 Data geração
        line.append(LocalDateTime.now().format(TIME_FORMAT));      // 152-157 Hora geração
        line.append(padLeft(String.valueOf(file.getSequenceNumber()), 6, '0')); // 158-163 NSA
        line.append("089");                                         // 164-166 Versão layout
        line.append(padLeft("", 5, '0'));                          // 167-171 Densidade
        line.append(padRight("", 20, ' '));                        // 172-191 Reservado banco
        line.append(padRight("", 20, ' '));                        // 192-211 Reservado empresa
        line.append(padRight("", 29, ' '));                        // 212-240 Uso FEBRABAN

        record.setRawContent(line.toString());
        return record;
    }

    private CnabRecord createHeaderLote(UUID tenantId, CnabFile file, BankConfig config,
                                        int sequence, LocalDate paymentDate) {
        CnabRecord record = new CnabRecord();
        record.setTenantId(tenantId);
        record.setRecordType(RecordType.HEADER_LOTE);
        record.setSequenceNumber(sequence);

        StringBuilder line = new StringBuilder(240);
        line.append(padLeft(config.bankCode(), 3, '0'));           // 001-003 Código do banco
        line.append("0001");                                        // 004-007 Lote de serviço
        line.append("1");                                           // 008-008 Tipo de registro
        line.append("C");                                           // 009-009 Tipo de operação (C=Crédito)
        line.append("30");                                          // 010-011 Tipo de serviço (30=Pagamento salários)
        line.append("01");                                          // 012-013 Forma de lançamento
        line.append("045");                                         // 014-016 Versão layout lote
        line.append(" ");                                           // 017-017 Uso FEBRABAN
        line.append("2");                                           // 018-018 Tipo de inscrição
        line.append(padLeft(config.cnpj(), 14, '0'));              // 019-032 CNPJ
        line.append(padRight(config.convenio(), 20, ' '));         // 033-052 Código do convênio
        line.append(padLeft(config.agencia(), 5, '0'));            // 053-057 Agência
        line.append(padLeft(config.agenciaDigito(), 1, ' '));      // 058-058 Dígito agência
        line.append(padLeft(config.conta(), 12, '0'));             // 059-070 Conta
        line.append(padLeft(config.contaDigito(), 1, ' '));        // 071-071 Dígito conta
        line.append(" ");                                           // 072-072 Dígito verificador
        line.append(padRight(config.companyName(), 30, ' '));      // 073-102 Nome da empresa
        line.append(padRight("PAGAMENTO SALARIOS", 40, ' '));      // 103-142 Finalidade
        line.append(padRight("", 30, ' '));                        // 143-172 Histórico
        line.append(padRight(config.address(), 30, ' '));          // 173-202 Endereço
        line.append(padLeft(config.addressNumber(), 5, '0'));      // 203-207 Número
        line.append(padRight("", 15, ' '));                        // 208-222 Complemento
        line.append(padRight(config.city(), 20, ' '));             // 223-242 Cidade
        line.append(padLeft(config.cep(), 5, '0'));                // 243-247 CEP
        line.append(padLeft(config.cepSuffix(), 3, '0'));          // 248-250 Sufixo CEP
        line.append(config.state());                               // 251-252 UF (realmente 240 caracteres, ajustar)

        // Pad to 240 characters
        while (line.length() < 240) {
            line.append(' ');
        }

        record.setRawContent(line.substring(0, 240));
        return record;
    }

    private CnabRecord createDetalheSegmentoA(UUID tenantId, CnabFile file, PayrollPayment payment,
                                              int sequence, int loteSequence, LocalDate paymentDate) {
        CnabRecord record = new CnabRecord();
        record.setTenantId(tenantId);
        record.setRecordType(RecordType.DETALHE);
        record.setSequenceNumber(sequence);
        record.setEmployeeId(payment.employeeId());
        record.setEmployeeName(payment.employeeName());
        record.setEmployeeCpf(payment.cpf());
        record.setBankCode(payment.bankCode());
        record.setBranchCode(payment.branchCode());
        record.setAccountNumber(payment.accountNumber());
        record.setAccountDigit(payment.accountDigit());
        record.setAmount(payment.amount());
        record.setPaymentDate(paymentDate);

        StringBuilder line = new StringBuilder(240);
        line.append(padLeft(file.getBankCode(), 3, '0'));          // 001-003 Código do banco
        line.append("0001");                                        // 004-007 Lote de serviço
        line.append("3");                                           // 008-008 Tipo de registro
        line.append(padLeft(String.valueOf(loteSequence), 5, '0')); // 009-013 Nº sequencial
        line.append("A");                                           // 014-014 Segmento
        line.append("0");                                           // 015-015 Tipo de movimento
        line.append("00");                                          // 016-017 Código de instrução
        line.append("000");                                         // 018-020 Câmara
        line.append(padLeft(payment.bankCode(), 3, '0'));          // 021-023 Banco favorecido
        line.append(padLeft(payment.branchCode(), 5, '0'));        // 024-028 Agência
        line.append(padLeft(payment.branchDigit(), 1, ' '));       // 029-029 Dígito agência
        line.append(padLeft(payment.accountNumber(), 12, '0'));    // 030-041 Conta
        line.append(padLeft(payment.accountDigit(), 1, ' '));      // 042-042 Dígito conta
        line.append(" ");                                           // 043-043 Dígito verificador
        line.append(padRight(payment.employeeName(), 30, ' '));    // 044-073 Nome favorecido
        line.append(padRight("", 20, ' '));                        // 074-093 Documento
        line.append(paymentDate.format(DATE_FORMAT));              // 094-101 Data pagamento
        line.append("BRL");                                         // 102-104 Moeda
        line.append(padLeft("", 15, '0'));                         // 105-119 Quantidade moeda
        line.append(formatAmount(payment.amount()));               // 120-134 Valor pagamento
        line.append(padRight("", 20, ' '));                        // 135-154 Documento banco
        line.append(padLeft("", 8, '0'));                          // 155-162 Data real
        line.append(padLeft("", 15, '0'));                         // 163-177 Valor real
        line.append(padRight("SALARIO", 40, ' '));                 // 178-217 Informação 2
        line.append("09");                                          // 218-219 Finalidade DOC
        line.append(padRight("", 10, ' '));                        // 220-229 Uso FEBRABAN
        line.append("  ");                                          // 230-231 Ocorrências
        line.append(padRight("", 9, ' '));                         // 232-240 Uso FEBRABAN

        record.setRawContent(line.toString());
        return record;
    }

    private CnabRecord createDetalheSegmentoB(UUID tenantId, CnabFile file, PayrollPayment payment,
                                              int sequence, int loteSequence) {
        CnabRecord record = new CnabRecord();
        record.setTenantId(tenantId);
        record.setRecordType(RecordType.DETALHE);
        record.setSequenceNumber(sequence);

        StringBuilder line = new StringBuilder(240);
        line.append(padLeft(file.getBankCode(), 3, '0'));          // 001-003 Código do banco
        line.append("0001");                                        // 004-007 Lote de serviço
        line.append("3");                                           // 008-008 Tipo de registro
        line.append(padLeft(String.valueOf(loteSequence), 5, '0')); // 009-013 Nº sequencial
        line.append("B");                                           // 014-014 Segmento
        line.append(padRight("", 3, ' '));                         // 015-017 Uso FEBRABAN
        line.append("1");                                           // 018-018 Tipo inscrição (1=CPF)
        line.append(padLeft(payment.cpf(), 14, '0'));              // 019-032 CPF
        line.append(padRight(payment.address(), 30, ' '));         // 033-062 Logradouro
        line.append(padLeft(payment.addressNumber(), 5, '0'));     // 063-067 Número
        line.append(padRight("", 15, ' '));                        // 068-082 Complemento
        line.append(padRight(payment.neighborhood(), 15, ' '));    // 083-097 Bairro
        line.append(padRight(payment.city(), 20, ' '));            // 098-117 Cidade
        line.append(padLeft(payment.cep(), 5, '0'));               // 118-122 CEP
        line.append(padLeft(payment.cepSuffix(), 3, '0'));         // 123-125 Sufixo CEP
        line.append(payment.state());                               // 126-127 UF
        line.append(padLeft("", 8, '0'));                          // 128-135 Data vencimento
        line.append(padLeft("", 15, '0'));                         // 136-150 Valor documento
        line.append(padLeft("", 15, '0'));                         // 151-165 Abatimento
        line.append(padLeft("", 15, '0'));                         // 166-180 Desconto
        line.append(padLeft("", 15, '0'));                         // 181-195 Mora
        line.append(padLeft("", 15, '0'));                         // 196-210 Multa
        line.append(padRight("", 15, ' '));                        // 211-225 Código favorecido
        line.append("0");                                           // 226-226 Aviso
        line.append(padLeft("", 6, '0'));                          // 227-232 Código UG
        line.append(padRight("", 8, ' '));                         // 233-240 Uso FEBRABAN

        record.setRawContent(line.toString());
        return record;
    }

    private CnabRecord createTrailerLote(UUID tenantId, CnabFile file, int sequence,
                                         int totalRecords, BigDecimal totalAmount) {
        CnabRecord record = new CnabRecord();
        record.setTenantId(tenantId);
        record.setRecordType(RecordType.TRAILER_LOTE);
        record.setSequenceNumber(sequence);

        StringBuilder line = new StringBuilder(240);
        line.append(padLeft(file.getBankCode(), 3, '0'));          // 001-003 Código do banco
        line.append("0001");                                        // 004-007 Lote de serviço
        line.append("5");                                           // 008-008 Tipo de registro
        line.append(padRight("", 9, ' '));                         // 009-017 Uso FEBRABAN
        line.append(padLeft(String.valueOf(totalRecords + 2), 6, '0')); // 018-023 Qtd registros lote
        line.append(formatAmount(totalAmount));                    // 024-041 Soma valores
        line.append(padLeft("", 18, '0'));                         // 042-059 Soma qtd moeda
        line.append(padLeft("", 6, '0'));                          // 060-065 Número aviso débito
        line.append(padRight("", 165, ' '));                       // 066-230 Uso FEBRABAN
        line.append(padRight("", 10, ' '));                        // 231-240 Ocorrências

        record.setRawContent(line.toString());
        return record;
    }

    private CnabRecord createTrailerArquivo(UUID tenantId, CnabFile file, int sequence, int totalLotes) {
        CnabRecord record = new CnabRecord();
        record.setTenantId(tenantId);
        record.setRecordType(RecordType.TRAILER_ARQUIVO);
        record.setSequenceNumber(sequence);

        StringBuilder line = new StringBuilder(240);
        line.append(padLeft(file.getBankCode(), 3, '0'));          // 001-003 Código do banco
        line.append("9999");                                        // 004-007 Lote de serviço
        line.append("9");                                           // 008-008 Tipo de registro
        line.append(padRight("", 9, ' '));                         // 009-017 Uso FEBRABAN
        line.append(padLeft(String.valueOf(totalLotes), 6, '0'));  // 018-023 Qtd lotes
        line.append(padLeft(String.valueOf(sequence), 6, '0'));    // 024-029 Qtd registros
        line.append(padLeft("", 6, '0'));                          // 030-035 Qtd contas
        line.append(padRight("", 205, ' '));                       // 036-240 Uso FEBRABAN

        record.setRawContent(line.toString());
        return record;
    }

    private String generateFileName(String bankCode, int sequence) {
        return String.format("CB%s%02d%06d.REM",
                LocalDate.now().format(DateTimeFormatter.ofPattern("ddMM")),
                Integer.parseInt(bankCode) % 100,
                sequence);
    }

    private String formatAmount(BigDecimal amount) {
        long cents = amount.multiply(BigDecimal.valueOf(100)).longValue();
        return padLeft(String.valueOf(cents), 15, '0');
    }

    private String padLeft(String str, int length, char padChar) {
        if (str == null) str = "";
        if (str.length() >= length) return str.substring(0, length);
        return String.valueOf(padChar).repeat(length - str.length()) + str;
    }

    private String padRight(String str, int length, char padChar) {
        if (str == null) str = "";
        if (str.length() >= length) return str.substring(0, length);
        return str + String.valueOf(padChar).repeat(length - str.length());
    }

    private String getReturnCodeMessage(String code) {
        return switch (code) {
            case "00" -> "Crédito ou Débito Efetivado";
            case "01" -> "Insuficiência de Fundos";
            case "02" -> "Crédito ou Débito Cancelado pelo Pagador/Credor";
            case "03" -> "Débito Autorizado pela Agência";
            case "AA" -> "Controle Inválido";
            case "AB" -> "Tipo de Operação Inválido";
            case "AC" -> "Tipo de Serviço Inválido";
            case "AD" -> "Forma de Lançamento Inválida";
            case "AE" -> "Tipo/Número de Inscrição Inválido";
            case "AF" -> "Código de Convênio Inválido";
            case "AG" -> "Agência/Conta Corrente/DV Inválido";
            case "AH" -> "Nº Sequencial do Registro no Lote Inválido";
            case "AI" -> "Código de Segmento de Detalhe Inválido";
            default -> "Código de retorno: " + code;
        };
    }

    // DTOs
    public record PayrollPayment(
            UUID employeeId,
            String employeeName,
            String cpf,
            String bankCode,
            String branchCode,
            String branchDigit,
            String accountNumber,
            String accountDigit,
            BigDecimal amount,
            String address,
            String addressNumber,
            String neighborhood,
            String city,
            String state,
            String cep,
            String cepSuffix
    ) {}

    public record BankConfig(
            String bankCode,
            String bankName,
            String companyCode,
            String convenio,
            String cnpj,
            String companyName,
            String agencia,
            String agenciaDigito,
            String conta,
            String contaDigito,
            String address,
            String addressNumber,
            String city,
            String state,
            String cep,
            String cepSuffix
    ) {}
}
