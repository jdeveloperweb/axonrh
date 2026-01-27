package com.axonrh.core.setup.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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

    // Step data payloads (JSONB)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "step1_company_data", columnDefinition = "jsonb")
    private Map<String, Object> step1CompanyData = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "step2_org_structure", columnDefinition = "jsonb")
    private Map<String, Object> step2OrgStructure = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "step3_labor_rules", columnDefinition = "jsonb")
    private Map<String, Object> step3LaborRules = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "step4_branding", columnDefinition = "jsonb")
    private Map<String, Object> step4Branding = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "step5_modules", columnDefinition = "jsonb")
    private Map<String, Object> step5Modules = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "step6_users", columnDefinition = "jsonb")
    private Map<String, Object> step6Users = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "step7_integrations", columnDefinition = "jsonb")
    private Map<String, Object> step7Integrations = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "step8_data_import", columnDefinition = "jsonb")
    private Map<String, Object> step8DataImport = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "step9_review", columnDefinition = "jsonb")
    private Map<String, Object> step9Review = new HashMap<>();

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
        PAUSED,
        ACTIVATED
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        startedAt = LocalDateTime.now();
        lastActivityAt = LocalDateTime.now();
        step1CompanyData = ensureStepPayload(step1CompanyData);
        step2OrgStructure = ensureStepPayload(step2OrgStructure);
        step3LaborRules = ensureStepPayload(step3LaborRules);
        step4Branding = ensureStepPayload(step4Branding);
        step5Modules = ensureStepPayload(step5Modules);
        step6Users = ensureStepPayload(step6Users);
        step7Integrations = ensureStepPayload(step7Integrations);
        step8DataImport = ensureStepPayload(step8DataImport);
        step9Review = ensureStepPayload(step9Review);
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

    public boolean isStep1CompanyData() { return isStepCompleted(step1CompanyData); }
    public void setStep1CompanyData(boolean completed) { this.step1CompanyData = setCompletion(completed, this.step1CompanyData); }

    public boolean isStep2OrgStructure() { return isStepCompleted(step2OrgStructure); }
    public void setStep2OrgStructure(boolean completed) { this.step2OrgStructure = setCompletion(completed, this.step2OrgStructure); }

    public boolean isStep3LaborRules() { return isStepCompleted(step3LaborRules); }
    public void setStep3LaborRules(boolean completed) { this.step3LaborRules = setCompletion(completed, this.step3LaborRules); }

    public boolean isStep4Branding() { return isStepCompleted(step4Branding); }
    public void setStep4Branding(boolean completed) { this.step4Branding = setCompletion(completed, this.step4Branding); }

    public boolean isStep5Modules() { return isStepCompleted(step5Modules); }
    public void setStep5Modules(boolean completed) { this.step5Modules = setCompletion(completed, this.step5Modules); }

    public boolean isStep6Users() { return isStepCompleted(step6Users); }
    public void setStep6Users(boolean completed) { this.step6Users = setCompletion(completed, this.step6Users); }

    public boolean isStep7Integrations() { return isStepCompleted(step7Integrations); }
    public void setStep7Integrations(boolean completed) { this.step7Integrations = setCompletion(completed, this.step7Integrations); }

    public boolean isStep8DataImport() { return isStepCompleted(step8DataImport); }
    public void setStep8DataImport(boolean completed) { this.step8DataImport = setCompletion(completed, this.step8DataImport); }

    public boolean isStep9Review() { return isStepCompleted(step9Review); }
    public void setStep9Review(boolean completed) { this.step9Review = setCompletion(completed, this.step9Review); }

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
        return isStepCompleted(getStepPayload(step));
    }

    public void setStepCompleted(int step, boolean completed) {
        Map<String, Object> payload = ensureStepPayload(getStepPayload(step));
        payload.put("completed", completed);
        setStepPayload(step, payload);
    }

    @JsonIgnore
    public Map<String, Object> getStepData(int step) {
        Map<String, Object> payload = getStepPayload(step);
        if (payload == null) {
            return new HashMap<>();
        }
        Object data = payload.get("data");
        if (data instanceof Map<?, ?> mapData) {
            return new HashMap<>((Map<String, Object>) mapData);
        }
        return new HashMap<>();
    }

    public void setStepData(int step, Map<String, Object> data) {
        Map<String, Object> payload = ensureStepPayload(getStepPayload(step));
        if (data != null) {
            payload.put("data", new HashMap<>(data));
        }
        setStepPayload(step, payload);
    }

    public int getCompletedStepsCount() {
        int count = 0;
        if (isStepCompleted(step1CompanyData)) count++;
        if (isStepCompleted(step2OrgStructure)) count++;
        if (isStepCompleted(step3LaborRules)) count++;
        if (isStepCompleted(step4Branding)) count++;
        if (isStepCompleted(step5Modules)) count++;
        if (isStepCompleted(step6Users)) count++;
        if (isStepCompleted(step7Integrations)) count++;
        if (isStepCompleted(step8DataImport)) count++;
        if (isStepCompleted(step9Review)) count++;
        return count;
    }

    public double getProgressPercentage() {
        return (getCompletedStepsCount() * 100.0) / totalSteps;
    }

    private Map<String, Object> getStepPayload(int step) {
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
            default -> null;
        };
    }

    private void setStepPayload(int step, Map<String, Object> payload) {
        switch (step) {
            case 1 -> step1CompanyData = payload;
            case 2 -> step2OrgStructure = payload;
            case 3 -> step3LaborRules = payload;
            case 4 -> step4Branding = payload;
            case 5 -> step5Modules = payload;
            case 6 -> step6Users = payload;
            case 7 -> step7Integrations = payload;
            case 8 -> step8DataImport = payload;
            case 9 -> step9Review = payload;
        }
    }

    private boolean isStepCompleted(Map<String, Object> payload) {
        if (payload == null) {
            return false;
        }
        Object completed = payload.get("completed");
        if (completed instanceof Boolean booleanValue) {
            return booleanValue;
        }
        if (completed == null) {
            return false;
        }
        return Boolean.parseBoolean(completed.toString());
    }

    private Map<String, Object> ensureStepPayload(Map<String, Object> payload) {
        Map<String, Object> ensured = payload == null ? new HashMap<>() : payload;
        ensured.putIfAbsent("completed", false);
        return ensured;
    }

    private Map<String, Object> setCompletion(boolean completed, Map<String, Object> payload) {
        Map<String, Object> ensured = ensureStepPayload(payload);
        ensured.put("completed", completed);
        return ensured;
    }
}
