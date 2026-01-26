package com.axonrh.integration.accounting.service;

import com.axonrh.integration.accounting.entity.AccountingEntry;
import com.axonrh.integration.accounting.entity.AccountingEntry.EntryType;
import com.axonrh.integration.accounting.entity.AccountingExport;
import com.axonrh.integration.accounting.entity.AccountingExport.AccountingSystem;
import com.axonrh.integration.accounting.entity.AccountingExport.ExportStatus;
import com.axonrh.integration.accounting.entity.AccountingExport.ExportType;
import com.axonrh.integration.accounting.repository.AccountingExportRepository;
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
public class AccountingService {

    private static final Logger log = LoggerFactory.getLogger(AccountingService.class);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final AccountingExportRepository exportRepository;

    public AccountingService(AccountingExportRepository exportRepository) {
        this.exportRepository = exportRepository;
    }

    /**
     * Gera exportacao contabil a partir dos lancamentos da folha.
     */
    public AccountingExport generateExport(UUID tenantId, ExportType exportType,
                                           AccountingSystem system, LocalDate referenceMonth,
                                           List<PayrollEntry> payrollEntries, UUID createdBy) {
        AccountingExport export = new AccountingExport();
        export.setTenantId(tenantId);
        export.setExportType(exportType);
        export.setAccountingSystem(system);
        export.setReferenceMonth(referenceMonth);
        export.setPeriodStart(referenceMonth.withDayOfMonth(1));
        export.setPeriodEnd(referenceMonth.withDayOfMonth(referenceMonth.lengthOfMonth()));
        export.setStatus(ExportStatus.GENERATING);
        export.setCreatedBy(createdBy);

        int sequence = 0;
        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;

        // Convert payroll entries to accounting entries
        for (PayrollEntry payroll : payrollEntries) {
            for (PayrollEntry.Item item : payroll.items()) {
                AccountingEntry entry = new AccountingEntry();
                entry.setTenantId(tenantId);
                entry.setEntryDate(referenceMonth.withDayOfMonth(referenceMonth.lengthOfMonth()));
                entry.setSequenceNumber(++sequence);
                entry.setEntryType(mapEntryType(item.rubricType()));
                entry.setDebitAccount(item.debitAccount());
                entry.setDebitAccountName(item.debitAccountName());
                entry.setCreditAccount(item.creditAccount());
                entry.setCreditAccountName(item.creditAccountName());
                entry.setCostCenter(payroll.costCenter());
                entry.setCostCenterName(payroll.costCenterName());
                entry.setAmount(item.amount());
                entry.setDescription(buildDescription(payroll.employeeName(), item.rubricName()));
                entry.setHistoryCode(item.historyCode());
                entry.setDocumentNumber(payroll.documentNumber());
                entry.setEmployeeId(payroll.employeeId());
                entry.setEmployeeName(payroll.employeeName());
                entry.setRubricCode(item.rubricCode());
                entry.setRubricName(item.rubricName());

                export.addEntry(entry);
                totalDebit = totalDebit.add(item.amount());
                totalCredit = totalCredit.add(item.amount());
            }
        }

        export.setTotalEntries(sequence);
        export.setTotalDebit(totalDebit);
        export.setTotalCredit(totalCredit);

        // Generate file content based on system
        byte[] fileContent = generateFileContent(export, system);
        export.setFileContent(fileContent);
        export.setFileName(generateFileName(system, referenceMonth));
        export.setStatus(ExportStatus.GENERATED);

        return exportRepository.save(export);
    }

    public Page<AccountingExport> listExports(UUID tenantId, Pageable pageable) {
        return exportRepository.findByTenantId(tenantId, pageable);
    }

    public Optional<AccountingExport> getExport(UUID tenantId, UUID exportId) {
        return exportRepository.findByTenantIdAndId(tenantId, exportId);
    }

    public byte[] downloadExport(UUID tenantId, UUID exportId) {
        return exportRepository.findByTenantIdAndId(tenantId, exportId)
                .map(AccountingExport::getFileContent)
                .orElseThrow(() -> new IllegalArgumentException("Exportação não encontrada"));
    }

    private EntryType mapEntryType(String rubricType) {
        return switch (rubricType.toUpperCase()) {
            case "SALARIO", "SALARY" -> EntryType.SALARIO;
            case "FGTS" -> EntryType.FGTS;
            case "INSS_EMPRESA" -> EntryType.INSS_EMPRESA;
            case "INSS_FUNCIONARIO", "INSS" -> EntryType.INSS_FUNCIONARIO;
            case "IRRF", "IR" -> EntryType.IRRF;
            case "FERIAS", "VACATION" -> EntryType.FERIAS;
            case "13_SALARIO", "DECIMO_TERCEIRO" -> EntryType.DECIMO_TERCEIRO;
            case "PROVISAO_FERIAS" -> EntryType.PROVISAO_FERIAS;
            case "PROVISAO_13" -> EntryType.PROVISAO_13;
            case "RESCISAO", "TERMINATION" -> EntryType.RESCISAO;
            case "BENEFICIO", "BENEFIT" -> EntryType.BENEFICIO;
            case "DESCONTO", "DEDUCTION" -> EntryType.DESCONTO;
            case "ADIANTAMENTO", "ADVANCE" -> EntryType.ADIANTAMENTO;
            default -> EntryType.OUTROS;
        };
    }

    private String buildDescription(String employeeName, String rubricName) {
        return String.format("%s - %s", rubricName, employeeName);
    }

    private String generateFileName(AccountingSystem system, LocalDate referenceMonth) {
        String monthStr = referenceMonth.format(DateTimeFormatter.ofPattern("yyyyMM"));
        return switch (system) {
            case DOMINIO -> "LANCAMENTOS_" + monthStr + ".txt";
            case CONTMATIC -> "CONTABIL_" + monthStr + ".txt";
            case TOTVS -> "LANC_CTBIL_" + monthStr + ".csv";
            case SAP -> "FI_DOCUMENT_" + monthStr + ".xml";
            case GENERIC_CSV -> "ACCOUNTING_" + monthStr + ".csv";
            case GENERIC_XML -> "ACCOUNTING_" + monthStr + ".xml";
            default -> "EXPORT_" + monthStr + ".txt";
        };
    }

    private byte[] generateFileContent(AccountingExport export, AccountingSystem system) {
        return switch (system) {
            case GENERIC_CSV -> generateCsv(export);
            case GENERIC_XML -> generateXml(export);
            case DOMINIO -> generateDominio(export);
            case CONTMATIC -> generateContmatic(export);
            case TOTVS -> generateTotvs(export);
            default -> generateCsv(export);
        };
    }

    private byte[] generateCsv(AccountingExport export) {
        StringBuilder csv = new StringBuilder();
        csv.append("Data;Sequencia;Conta Debito;Nome Debito;Conta Credito;Nome Credito;");
        csv.append("Centro Custo;Valor;Historico;Documento;Funcionario\n");

        for (AccountingEntry entry : export.getEntries()) {
            csv.append(entry.getEntryDate().format(DATE_FORMAT)).append(";");
            csv.append(entry.getSequenceNumber()).append(";");
            csv.append(entry.getDebitAccount()).append(";");
            csv.append(nullSafe(entry.getDebitAccountName())).append(";");
            csv.append(entry.getCreditAccount()).append(";");
            csv.append(nullSafe(entry.getCreditAccountName())).append(";");
            csv.append(nullSafe(entry.getCostCenter())).append(";");
            csv.append(entry.getAmount().toString().replace(".", ",")).append(";");
            csv.append(nullSafe(entry.getDescription())).append(";");
            csv.append(nullSafe(entry.getDocumentNumber())).append(";");
            csv.append(nullSafe(entry.getEmployeeName())).append("\n");
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] generateXml(AccountingExport export) {
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<AccountingExport>\n");
        xml.append("  <Header>\n");
        xml.append("    <ReferenceMonth>").append(export.getReferenceMonth()).append("</ReferenceMonth>\n");
        xml.append("    <PeriodStart>").append(export.getPeriodStart()).append("</PeriodStart>\n");
        xml.append("    <PeriodEnd>").append(export.getPeriodEnd()).append("</PeriodEnd>\n");
        xml.append("    <TotalEntries>").append(export.getTotalEntries()).append("</TotalEntries>\n");
        xml.append("    <TotalDebit>").append(export.getTotalDebit()).append("</TotalDebit>\n");
        xml.append("    <TotalCredit>").append(export.getTotalCredit()).append("</TotalCredit>\n");
        xml.append("  </Header>\n");
        xml.append("  <Entries>\n");

        for (AccountingEntry entry : export.getEntries()) {
            xml.append("    <Entry>\n");
            xml.append("      <Date>").append(entry.getEntryDate()).append("</Date>\n");
            xml.append("      <Sequence>").append(entry.getSequenceNumber()).append("</Sequence>\n");
            xml.append("      <Type>").append(entry.getEntryType()).append("</Type>\n");
            xml.append("      <DebitAccount>").append(entry.getDebitAccount()).append("</DebitAccount>\n");
            xml.append("      <CreditAccount>").append(entry.getCreditAccount()).append("</CreditAccount>\n");
            xml.append("      <CostCenter>").append(nullSafe(entry.getCostCenter())).append("</CostCenter>\n");
            xml.append("      <Amount>").append(entry.getAmount()).append("</Amount>\n");
            xml.append("      <Description>").append(escapeXml(entry.getDescription())).append("</Description>\n");
            xml.append("      <EmployeeId>").append(nullSafe(String.valueOf(entry.getEmployeeId()))).append("</EmployeeId>\n");
            xml.append("      <EmployeeName>").append(escapeXml(entry.getEmployeeName())).append("</EmployeeName>\n");
            xml.append("    </Entry>\n");
        }

        xml.append("  </Entries>\n");
        xml.append("</AccountingExport>");

        return xml.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] generateDominio(AccountingExport export) {
        // Dominio format: fixed-width text file
        StringBuilder content = new StringBuilder();
        for (AccountingEntry entry : export.getEntries()) {
            content.append(padRight(entry.getEntryDate().format(DateTimeFormatter.ofPattern("ddMMyyyy")), 8));
            content.append(padRight(entry.getDebitAccount(), 15));
            content.append(padRight(entry.getCreditAccount(), 15));
            content.append(padLeft(formatAmount(entry.getAmount()), 15));
            content.append(padRight(nullSafe(entry.getCostCenter()), 10));
            content.append(padRight(truncate(entry.getDescription(), 100), 100));
            content.append("\r\n");
        }
        return content.toString().getBytes(StandardCharsets.ISO_8859_1);
    }

    private byte[] generateContmatic(AccountingExport export) {
        // Contmatic Phoenix format
        StringBuilder content = new StringBuilder();
        for (AccountingEntry entry : export.getEntries()) {
            content.append("L"); // Lancamento
            content.append(entry.getEntryDate().format(DateTimeFormatter.ofPattern("ddMMyyyy")));
            content.append(padRight(entry.getDebitAccount(), 20));
            content.append(padRight(entry.getCreditAccount(), 20));
            content.append(padLeft(formatAmount(entry.getAmount()), 17));
            content.append(padRight(truncate(entry.getDescription(), 200), 200));
            content.append("\r\n");
        }
        return content.toString().getBytes(StandardCharsets.ISO_8859_1);
    }

    private byte[] generateTotvs(AccountingExport export) {
        // TOTVS Protheus format (CSV with specific columns)
        StringBuilder csv = new StringBuilder();
        csv.append("FILIAL;DATA;DEBITO;CREDITO;VALOR;HIST;CC;DOC\n");

        for (AccountingEntry entry : export.getEntries()) {
            csv.append("01;"); // Filial
            csv.append(entry.getEntryDate().format(DateTimeFormatter.ofPattern("yyyyMMdd"))).append(";");
            csv.append(entry.getDebitAccount()).append(";");
            csv.append(entry.getCreditAccount()).append(";");
            csv.append(formatAmount(entry.getAmount())).append(";");
            csv.append(truncate(entry.getDescription(), 40)).append(";");
            csv.append(nullSafe(entry.getCostCenter())).append(";");
            csv.append(nullSafe(entry.getDocumentNumber())).append("\n");
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String formatAmount(BigDecimal amount) {
        return String.format("%.2f", amount).replace(".", "").replace(",", "");
    }

    private String padRight(String str, int length) {
        if (str == null) str = "";
        if (str.length() >= length) return str.substring(0, length);
        return str + " ".repeat(length - str.length());
    }

    private String padLeft(String str, int length) {
        if (str == null) str = "";
        if (str.length() >= length) return str.substring(0, length);
        return "0".repeat(length - str.length()) + str;
    }

    private String truncate(String str, int length) {
        if (str == null) return "";
        return str.length() > length ? str.substring(0, length) : str;
    }

    private String nullSafe(String str) {
        return str == null ? "" : str;
    }

    private String escapeXml(String str) {
        if (str == null) return "";
        return str.replace("&", "&amp;")
                  .replace("<", "&lt;")
                  .replace(">", "&gt;")
                  .replace("\"", "&quot;")
                  .replace("'", "&apos;");
    }

    // DTOs
    public record PayrollEntry(
            UUID employeeId,
            String employeeName,
            String costCenter,
            String costCenterName,
            String documentNumber,
            List<Item> items
    ) {
        public record Item(
                String rubricCode,
                String rubricName,
                String rubricType,
                BigDecimal amount,
                String debitAccount,
                String debitAccountName,
                String creditAccount,
                String creditAccountName,
                String historyCode
        ) {}
    }
}
