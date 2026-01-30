package com.axonrh.integration.cnab.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "int_cnab_records")
public class CnabRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cnab_file_id", nullable = false)
    private CnabFile cnabFile;

    @Enumerated(EnumType.STRING)
    @Column(name = "record_type", nullable = false)
    private RecordType recordType;

    @Column(name = "sequence_number", nullable = false)
    private int sequenceNumber;

    @Column(name = "employee_id")
    private UUID employeeId;

    @Column(name = "employee_name")
    private String employeeName;

    @Column(name = "employee_cpf", length = 11)
    private String employeeCpf;

    // Bank account details
    @Column(name = "bank_code", length = 3)
    private String bankCode;

    @Column(name = "branch_code", length = 5)
    private String branchCode;

    @Column(name = "branch_digit", length = 1)
    private String branchDigit;

    @Column(name = "account_number", length = 12)
    private String accountNumber;

    @Column(name = "account_digit", length = 2)
    private String accountDigit;

    @Column(name = "account_type")
    private String accountType;

    // Payment details
    @Column(precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(name = "payment_type")
    private String paymentType;

    @Column(name = "reference_code")
    private String referenceCode;

    @Column(length = 40)
    private String description;

    // Return file data
    @Enumerated(EnumType.STRING)
    private RecordStatus status = RecordStatus.PENDING;

    @Column(name = "return_code", length = 2)
    private String returnCode;

    @Column(name = "return_message")
    private String returnMessage;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "raw_content", columnDefinition = "TEXT")
    private String rawContent;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public enum RecordType {
        HEADER_ARQUIVO,      // File header
        HEADER_LOTE,         // Batch header
        DETALHE,             // Detail record (payment)
        TRAILER_LOTE,        // Batch trailer
        TRAILER_ARQUIVO      // File trailer
    }

    public enum RecordStatus {
        PENDING,        // Awaiting processing
        PROCESSED,      // Successfully processed
        REJECTED,       // Bank rejected
        CANCELLED,      // Cancelled
        RETURNED        // Returned (insufficient funds, etc.)
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

    public CnabFile getCnabFile() { return cnabFile; }
    public void setCnabFile(CnabFile cnabFile) { this.cnabFile = cnabFile; }

    public RecordType getRecordType() { return recordType; }
    public void setRecordType(RecordType recordType) { this.recordType = recordType; }

    public int getSequenceNumber() { return sequenceNumber; }
    public void setSequenceNumber(int sequenceNumber) { this.sequenceNumber = sequenceNumber; }

    public UUID getEmployeeId() { return employeeId; }
    public void setEmployeeId(UUID employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getEmployeeCpf() { return employeeCpf; }
    public void setEmployeeCpf(String employeeCpf) { this.employeeCpf = employeeCpf; }

    public String getBankCode() { return bankCode; }
    public void setBankCode(String bankCode) { this.bankCode = bankCode; }

    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }

    public String getBranchDigit() { return branchDigit; }
    public void setBranchDigit(String branchDigit) { this.branchDigit = branchDigit; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public String getAccountDigit() { return accountDigit; }
    public void setAccountDigit(String accountDigit) { this.accountDigit = accountDigit; }

    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public LocalDate getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDate paymentDate) { this.paymentDate = paymentDate; }

    public String getPaymentType() { return paymentType; }
    public void setPaymentType(String paymentType) { this.paymentType = paymentType; }

    public String getReferenceCode() { return referenceCode; }
    public void setReferenceCode(String referenceCode) { this.referenceCode = referenceCode; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public RecordStatus getStatus() { return status; }
    public void setStatus(RecordStatus status) { this.status = status; }

    public String getReturnCode() { return returnCode; }
    public void setReturnCode(String returnCode) { this.returnCode = returnCode; }

    public String getReturnMessage() { return returnMessage; }
    public void setReturnMessage(String returnMessage) { this.returnMessage = returnMessage; }

    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }

    public String getRawContent() { return rawContent; }
    public void setRawContent(String rawContent) { this.rawContent = rawContent; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
