package com.axonrh.integration.accounting.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "accounting_entries")
public class AccountingEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accounting_export_id", nullable = false)
    private AccountingExport accountingExport;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Column(name = "sequence_number", nullable = false)
    private int sequenceNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false)
    private EntryType entryType;

    @Column(name = "debit_account", length = 20)
    private String debitAccount;

    @Column(name = "debit_account_name")
    private String debitAccountName;

    @Column(name = "credit_account", length = 20)
    private String creditAccount;

    @Column(name = "credit_account_name")
    private String creditAccountName;

    @Column(name = "cost_center", length = 20)
    private String costCenter;

    @Column(name = "cost_center_name")
    private String costCenterName;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(length = 200)
    private String description;

    @Column(name = "history_code", length = 10)
    private String historyCode;

    @Column(name = "document_number", length = 30)
    private String documentNumber;

    @Column(name = "employee_id")
    private UUID employeeId;

    @Column(name = "employee_name")
    private String employeeName;

    @Column(name = "rubric_code", length = 10)
    private String rubricCode;

    @Column(name = "rubric_name")
    private String rubricName;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public enum EntryType {
        SALARIO,              // Salary
        FGTS,                 // FGTS deposit
        INSS_EMPRESA,         // Company INSS
        INSS_FUNCIONARIO,     // Employee INSS deduction
        IRRF,                 // Income tax withholding
        FERIAS,               // Vacation
        DECIMO_TERCEIRO,      // 13th salary
        PROVISAO_FERIAS,      // Vacation provision
        PROVISAO_13,          // 13th provision
        RESCISAO,             // Termination
        BENEFICIO,            // Benefit
        DESCONTO,             // Deduction
        ADIANTAMENTO,         // Advance
        OUTROS                // Others
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

    public AccountingExport getAccountingExport() { return accountingExport; }
    public void setAccountingExport(AccountingExport accountingExport) { this.accountingExport = accountingExport; }

    public LocalDate getEntryDate() { return entryDate; }
    public void setEntryDate(LocalDate entryDate) { this.entryDate = entryDate; }

    public int getSequenceNumber() { return sequenceNumber; }
    public void setSequenceNumber(int sequenceNumber) { this.sequenceNumber = sequenceNumber; }

    public EntryType getEntryType() { return entryType; }
    public void setEntryType(EntryType entryType) { this.entryType = entryType; }

    public String getDebitAccount() { return debitAccount; }
    public void setDebitAccount(String debitAccount) { this.debitAccount = debitAccount; }

    public String getDebitAccountName() { return debitAccountName; }
    public void setDebitAccountName(String debitAccountName) { this.debitAccountName = debitAccountName; }

    public String getCreditAccount() { return creditAccount; }
    public void setCreditAccount(String creditAccount) { this.creditAccount = creditAccount; }

    public String getCreditAccountName() { return creditAccountName; }
    public void setCreditAccountName(String creditAccountName) { this.creditAccountName = creditAccountName; }

    public String getCostCenter() { return costCenter; }
    public void setCostCenter(String costCenter) { this.costCenter = costCenter; }

    public String getCostCenterName() { return costCenterName; }
    public void setCostCenterName(String costCenterName) { this.costCenterName = costCenterName; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getHistoryCode() { return historyCode; }
    public void setHistoryCode(String historyCode) { this.historyCode = historyCode; }

    public String getDocumentNumber() { return documentNumber; }
    public void setDocumentNumber(String documentNumber) { this.documentNumber = documentNumber; }

    public UUID getEmployeeId() { return employeeId; }
    public void setEmployeeId(UUID employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getRubricCode() { return rubricCode; }
    public void setRubricCode(String rubricCode) { this.rubricCode = rubricCode; }

    public String getRubricName() { return rubricName; }
    public void setRubricName(String rubricName) { this.rubricName = rubricName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
