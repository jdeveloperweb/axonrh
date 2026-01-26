package com.axonrh.integration.accounting.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "accounting_exports")
public class AccountingExport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "export_type", nullable = false)
    private ExportType exportType;

    @Enumerated(EnumType.STRING)
    @Column(name = "accounting_system", nullable = false)
    private AccountingSystem accountingSystem;

    @Column(name = "reference_month", nullable = false)
    private LocalDate referenceMonth;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExportStatus status = ExportStatus.PENDING;

    @Column(name = "file_name")
    private String fileName;

    @Lob
    @Column(name = "file_content")
    private byte[] fileContent;

    @Column(name = "total_entries")
    private int totalEntries;

    @Column(name = "total_debit", precision = 15, scale = 2)
    private BigDecimal totalDebit;

    @Column(name = "total_credit", precision = 15, scale = 2)
    private BigDecimal totalCredit;

    @OneToMany(mappedBy = "accountingExport", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<AccountingEntry> entries = new ArrayList<>();

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "exported_at")
    private LocalDateTime exportedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public enum ExportType {
        FOLHA_PAGAMENTO,      // Payroll
        PROVISOES,            // Provisions (13th, vacation)
        ENCARGOS,             // Social charges
        BENEFICIOS,           // Benefits
        RESCISOES,            // Terminations
        COMPLETO              // Full export
    }

    public enum AccountingSystem {
        DOMINIO,              // Thomson Reuters Dominio
        CONTMATIC,            // Contmatic Phoenix
        SAGE,                 // Sage
        TOTVS,                // TOTVS Protheus
        SAP,                  // SAP
        ORACLE,               // Oracle
        FORTES,               // Fortes AC
        GENERIC_CSV,          // Generic CSV
        GENERIC_XML           // Generic XML
    }

    public enum ExportStatus {
        PENDING,
        GENERATING,
        GENERATED,
        EXPORTED,
        ERROR
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }

    public ExportType getExportType() { return exportType; }
    public void setExportType(ExportType exportType) { this.exportType = exportType; }

    public AccountingSystem getAccountingSystem() { return accountingSystem; }
    public void setAccountingSystem(AccountingSystem accountingSystem) { this.accountingSystem = accountingSystem; }

    public LocalDate getReferenceMonth() { return referenceMonth; }
    public void setReferenceMonth(LocalDate referenceMonth) { this.referenceMonth = referenceMonth; }

    public LocalDate getPeriodStart() { return periodStart; }
    public void setPeriodStart(LocalDate periodStart) { this.periodStart = periodStart; }

    public LocalDate getPeriodEnd() { return periodEnd; }
    public void setPeriodEnd(LocalDate periodEnd) { this.periodEnd = periodEnd; }

    public ExportStatus getStatus() { return status; }
    public void setStatus(ExportStatus status) { this.status = status; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public byte[] getFileContent() { return fileContent; }
    public void setFileContent(byte[] fileContent) { this.fileContent = fileContent; }

    public int getTotalEntries() { return totalEntries; }
    public void setTotalEntries(int totalEntries) { this.totalEntries = totalEntries; }

    public BigDecimal getTotalDebit() { return totalDebit; }
    public void setTotalDebit(BigDecimal totalDebit) { this.totalDebit = totalDebit; }

    public BigDecimal getTotalCredit() { return totalCredit; }
    public void setTotalCredit(BigDecimal totalCredit) { this.totalCredit = totalCredit; }

    public List<AccountingEntry> getEntries() { return entries; }
    public void setEntries(List<AccountingEntry> entries) { this.entries = entries; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public LocalDateTime getExportedAt() { return exportedAt; }
    public void setExportedAt(LocalDateTime exportedAt) { this.exportedAt = exportedAt; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public void addEntry(AccountingEntry entry) {
        entries.add(entry);
        entry.setAccountingExport(this);
    }
}
