package com.axonrh.integration.cnab.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "cnab_files")
public class CnabFile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "file_type", nullable = false)
    private CnabFileType fileType;

    @Enumerated(EnumType.STRING)
    @Column(name = "cnab_layout", nullable = false)
    private CnabLayout cnabLayout;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "bank_code", nullable = false, length = 3)
    private String bankCode;

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "company_code")
    private String companyCode;

    @Column(name = "reference_date", nullable = false)
    private LocalDate referenceDate;

    @Column(name = "generation_date", nullable = false)
    private LocalDate generationDate;

    @Column(name = "sequence_number", nullable = false)
    private int sequenceNumber;

    @Column(name = "total_records")
    private int totalRecords;

    @Column(name = "total_amount", precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CnabFileStatus status = CnabFileStatus.GENERATED;

    @Column(name = "file_content")
    private byte[] fileContent;

    @Column(name = "return_file_name")
    private String returnFileName;

    @Column(name = "return_file_content")
    private byte[] returnFileContent;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @OneToMany(mappedBy = "cnabFile", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CnabRecord> records = new ArrayList<>();

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum CnabFileType {
        REMESSA,   // Outgoing - Payment instructions
        RETORNO    // Return - Payment confirmations
    }

    public enum CnabLayout {
        CNAB_240,  // Modern layout
        CNAB_400   // Legacy layout
    }

    public enum CnabFileStatus {
        GENERATED,      // File created
        TRANSMITTED,    // Sent to bank
        PROCESSING,     // Bank processing
        PROCESSED,      // Bank confirmed
        PARTIAL,        // Partially processed
        REJECTED,       // Bank rejected
        ERROR           // System error
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        generationDate = LocalDate.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }

    public CnabFileType getFileType() { return fileType; }
    public void setFileType(CnabFileType fileType) { this.fileType = fileType; }

    public CnabLayout getCnabLayout() { return cnabLayout; }
    public void setCnabLayout(CnabLayout cnabLayout) { this.cnabLayout = cnabLayout; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getBankCode() { return bankCode; }
    public void setBankCode(String bankCode) { this.bankCode = bankCode; }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public String getCompanyCode() { return companyCode; }
    public void setCompanyCode(String companyCode) { this.companyCode = companyCode; }

    public LocalDate getReferenceDate() { return referenceDate; }
    public void setReferenceDate(LocalDate referenceDate) { this.referenceDate = referenceDate; }

    public LocalDate getGenerationDate() { return generationDate; }
    public void setGenerationDate(LocalDate generationDate) { this.generationDate = generationDate; }

    public int getSequenceNumber() { return sequenceNumber; }
    public void setSequenceNumber(int sequenceNumber) { this.sequenceNumber = sequenceNumber; }

    public int getTotalRecords() { return totalRecords; }
    public void setTotalRecords(int totalRecords) { this.totalRecords = totalRecords; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public CnabFileStatus getStatus() { return status; }
    public void setStatus(CnabFileStatus status) { this.status = status; }

    public byte[] getFileContent() { return fileContent; }
    public void setFileContent(byte[] fileContent) { this.fileContent = fileContent; }

    public String getReturnFileName() { return returnFileName; }
    public void setReturnFileName(String returnFileName) { this.returnFileName = returnFileName; }

    public byte[] getReturnFileContent() { return returnFileContent; }
    public void setReturnFileContent(byte[] returnFileContent) { this.returnFileContent = returnFileContent; }

    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public List<CnabRecord> getRecords() { return records; }
    public void setRecords(List<CnabRecord> records) { this.records = records; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public void addRecord(CnabRecord record) {
        records.add(record);
        record.setCnabFile(this);
    }
}
