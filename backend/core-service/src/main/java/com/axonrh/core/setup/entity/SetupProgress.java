package com.axonrh.core.setup.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "setup_progress")
public class SetupProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, unique = true)
    private UUID tenantId;

    @Column(name = "current_step")
    private int currentStep = 1;

    @Column(name = "total_steps")
    private int totalSteps = 9;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SetupStatus status = SetupStatus.IN_PROGRESS;

    // Step completion flags
    @Column(name = "step1_company_data")
    private boolean step1CompanyData = false;

    @Column(name = "step2_org_structure")
    private boolean step2OrgStructure = false;

    @Column(name = "step3_labor_rules")
    private boolean step3LaborRules = false;

    @Column(name = "step4_branding")
    private boolean step4Branding = false;

    @Column(name = "step5_modules")
    private boolean step5Modules = false;

    @Column(name = "step6_users")
    private boolean step6Users = false;

    @Column(name = "step7_integrations")
    private boolean step7Integrations = false;

    @Column(name = "step8_data_import")
    private boolean step8DataImport = false;

    @Column(name = "step9_review")
    private boolean step9Review = false;

    // Progress data (JSON stored as String)
    @Column(name = "step1_data", columnDefinition = "TEXT")
    private String step1Data;

    @Column(name = "step2_data", columnDefinition = "TEXT")
    private String step2Data;

    @Column(name = "step3_data", columnDefinition = "TEXT")
    private String step3Data;

    @Column(name = "step4_data", columnDefinition = "TEXT")
    private String step4Data;

    @Column(name = "step5_data", columnDefinition = "TEXT")
    private String step5Data;

    @Column(name = "step6_data", columnDefinition = "TEXT")
    private String step6Data;

    @Column(name = "step7_data", columnDefinition = "TEXT")
    private String step7Data;

    @Column(name = "step8_data", columnDefinition = "TEXT")
    private String step8Data;

    @Column(name = "step9_data", columnDefinition = "TEXT")
    private String step9Data;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum SetupStatus {
        IN_PROGRESS,
        COMPLETED,
        PAUSED
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        startedAt = LocalDateTime.now();
        lastActivityAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        lastActivityAt = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }

    public int getCurrentStep() { return currentStep; }
    public void setCurrentStep(int currentStep) { this.currentStep = currentStep; }

    public int getTotalSteps() { return totalSteps; }
    public void setTotalSteps(int totalSteps) { this.totalSteps = totalSteps; }

    public SetupStatus getStatus() { return status; }
    public void setStatus(SetupStatus status) { this.status = status; }

    public boolean isStep1CompanyData() { return step1CompanyData; }
    public void setStep1CompanyData(boolean step1CompanyData) { this.step1CompanyData = step1CompanyData; }

    public boolean isStep2OrgStructure() { return step2OrgStructure; }
    public void setStep2OrgStructure(boolean step2OrgStructure) { this.step2OrgStructure = step2OrgStructure; }

    public boolean isStep3LaborRules() { return step3LaborRules; }
    public void setStep3LaborRules(boolean step3LaborRules) { this.step3LaborRules = step3LaborRules; }

    public boolean isStep4Branding() { return step4Branding; }
    public void setStep4Branding(boolean step4Branding) { this.step4Branding = step4Branding; }

    public boolean isStep5Modules() { return step5Modules; }
    public void setStep5Modules(boolean step5Modules) { this.step5Modules = step5Modules; }

    public boolean isStep6Users() { return step6Users; }
    public void setStep6Users(boolean step6Users) { this.step6Users = step6Users; }

    public boolean isStep7Integrations() { return step7Integrations; }
    public void setStep7Integrations(boolean step7Integrations) { this.step7Integrations = step7Integrations; }

    public boolean isStep8DataImport() { return step8DataImport; }
    public void setStep8DataImport(boolean step8DataImport) { this.step8DataImport = step8DataImport; }

    public boolean isStep9Review() { return step9Review; }
    public void setStep9Review(boolean step9Review) { this.step9Review = step9Review; }

    public String getStep1Data() { return step1Data; }
    public void setStep1Data(String step1Data) { this.step1Data = step1Data; }

    public String getStep2Data() { return step2Data; }
    public void setStep2Data(String step2Data) { this.step2Data = step2Data; }

    public String getStep3Data() { return step3Data; }
    public void setStep3Data(String step3Data) { this.step3Data = step3Data; }

    public String getStep4Data() { return step4Data; }
    public void setStep4Data(String step4Data) { this.step4Data = step4Data; }

    public String getStep5Data() { return step5Data; }
    public void setStep5Data(String step5Data) { this.step5Data = step5Data; }

    public String getStep6Data() { return step6Data; }
    public void setStep6Data(String step6Data) { this.step6Data = step6Data; }

    public String getStep7Data() { return step7Data; }
    public void setStep7Data(String step7Data) { this.step7Data = step7Data; }

    public String getStep8Data() { return step8Data; }
    public void setStep8Data(String step8Data) { this.step8Data = step8Data; }

    public String getStep9Data() { return step9Data; }
    public void setStep9Data(String step9Data) { this.step9Data = step9Data; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public LocalDateTime getLastActivityAt() { return lastActivityAt; }
    public void setLastActivityAt(LocalDateTime lastActivityAt) { this.lastActivityAt = lastActivityAt; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public boolean isStepCompleted(int step) {
        return switch (step) {
            case 1 -> step1CompanyData;
            case 2 -> step2OrgStructure;
            case 3 -> step3LaborRules;
            case 4 -> step4Branding;
            case 5 -> step5Modules;
            case 6 -> step6Users;
            case 7 -> step7Integrations;
            case 8 -> step8DataImport;
            case 9 -> step9Review;
            default -> false;
        };
    }

    public void setStepCompleted(int step, boolean completed) {
        switch (step) {
            case 1 -> step1CompanyData = completed;
            case 2 -> step2OrgStructure = completed;
            case 3 -> step3LaborRules = completed;
            case 4 -> step4Branding = completed;
            case 5 -> step5Modules = completed;
            case 6 -> step6Users = completed;
            case 7 -> step7Integrations = completed;
            case 8 -> step8DataImport = completed;
            case 9 -> step9Review = completed;
        }
    }

    public String getStepData(int step) {
        return switch (step) {
            case 1 -> step1Data;
            case 2 -> step2Data;
            case 3 -> step3Data;
            case 4 -> step4Data;
            case 5 -> step5Data;
            case 6 -> step6Data;
            case 7 -> step7Data;
            case 8 -> step8Data;
            case 9 -> step9Data;
            default -> null;
        };
    }

    public void setStepData(int step, String data) {
        switch (step) {
            case 1 -> step1Data = data;
            case 2 -> step2Data = data;
            case 3 -> step3Data = data;
            case 4 -> step4Data = data;
            case 5 -> step5Data = data;
            case 6 -> step6Data = data;
            case 7 -> step7Data = data;
            case 8 -> step8Data = data;
            case 9 -> step9Data = data;
        }
    }

    public int getCompletedStepsCount() {
        int count = 0;
        if (step1CompanyData) count++;
        if (step2OrgStructure) count++;
        if (step3LaborRules) count++;
        if (step4Branding) count++;
        if (step5Modules) count++;
        if (step6Users) count++;
        if (step7Integrations) count++;
        if (step8DataImport) count++;
        if (step9Review) count++;
        return count;
    }

    public double getProgressPercentage() {
        return (getCompletedStepsCount() * 100.0) / totalSteps;
    }
}
