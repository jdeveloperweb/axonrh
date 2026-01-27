package com.axonrh.core.setup.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "import_jobs")
public class ImportJob {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "import_type", nullable = false, length = 50)
    private ImportType importType;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "file_size")
    private Integer fileSize;

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ImportStatus status = ImportStatus.PENDING;

    @Column(name = "total_rows")
    private int totalRows = 0;

    @Column(name = "processed_rows")
    private int processedRows = 0;

    @Column(name = "success_rows")
    private int successRows = 0;

    @Column(name = "error_rows")
    private int errorRows = 0;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "validation_errors", columnDefinition = "jsonb")
    private String validationErrors;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "processing_errors", columnDefinition = "jsonb")
    private String processingErrors;

    @Column(name = "rollback_available")
    private boolean rollbackAvailable = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "rollback_data", columnDefinition = "jsonb")
    private String rollbackData;

    @Column(name = "rolled_back_at")
    private LocalDateTime rolledBackAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public enum ImportType {
        EMPLOYEES,
        DEPARTMENTS,
        POSITIONS,
        WORK_SCHEDULES,
        PAYROLL_HISTORY,
        TIME_RECORDS,
        VACATION_BALANCE
    }

    public enum ImportStatus {
        PENDING,
        VALIDATING,
        PROCESSING,
        COMPLETED,
        FAILED,
        ROLLED_BACK
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

    public ImportType getImportType() { return importType; }
    public void setImportType(ImportType importType) { this.importType = importType; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public Integer getFileSize() { return fileSize; }
    public void setFileSize(Integer fileSize) { this.fileSize = fileSize; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public ImportStatus getStatus() { return status; }
    public void setStatus(ImportStatus status) { this.status = status; }

    public int getTotalRows() { return totalRows; }
    public void setTotalRows(int totalRows) { this.totalRows = totalRows; }

    public int getProcessedRows() { return processedRows; }
    public void setProcessedRows(int processedRows) { this.processedRows = processedRows; }

    public int getSuccessRows() { return successRows; }
    public void setSuccessRows(int successRows) { this.successRows = successRows; }

    public int getErrorRows() { return errorRows; }
    public void setErrorRows(int errorRows) { this.errorRows = errorRows; }

    public String getValidationErrors() { return validationErrors; }
    public void setValidationErrors(String validationErrors) { this.validationErrors = validationErrors; }

    public String getProcessingErrors() { return processingErrors; }
    public void setProcessingErrors(String processingErrors) { this.processingErrors = processingErrors; }

    public boolean isRollbackAvailable() { return rollbackAvailable; }
    public void setRollbackAvailable(boolean rollbackAvailable) { this.rollbackAvailable = rollbackAvailable; }

    public String getRollbackData() { return rollbackData; }
    public void setRollbackData(String rollbackData) { this.rollbackData = rollbackData; }

    public LocalDateTime getRolledBackAt() { return rolledBackAt; }
    public void setRolledBackAt(LocalDateTime rolledBackAt) { this.rolledBackAt = rolledBackAt; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public void start() {
        this.status = ImportStatus.PROCESSING;
        this.startedAt = LocalDateTime.now();
    }

    public void complete() {
        this.status = ImportStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
        this.rollbackAvailable = true;
    }

    public void fail() {
        this.status = ImportStatus.FAILED;
        this.completedAt = LocalDateTime.now();
    }

    public void rollback() {
        this.status = ImportStatus.ROLLED_BACK;
        this.rolledBackAt = LocalDateTime.now();
        this.rollbackAvailable = false;
    }

    public double getProgressPercentage() {
        if (totalRows == 0) return 0;
        return (processedRows * 100.0) / totalRows;
    }
}
