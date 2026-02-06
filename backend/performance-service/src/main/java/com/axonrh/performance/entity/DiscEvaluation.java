package com.axonrh.performance.entity;

import com.axonrh.performance.entity.enums.DiscAssessmentStatus;
import com.axonrh.performance.entity.enums.DiscProfileType;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "disc_evaluations")
public class DiscEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_name")
    private String employeeName;

    @Column(name = "questionnaire_id")
    private UUID questionnaireId;

    // Scores (0-100)
    @Column(name = "d_score")
    private Integer dScore;

    @Column(name = "i_score")
    private Integer iScore;

    @Column(name = "s_score")
    private Integer sScore;

    @Column(name = "c_score")
    private Integer cScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "primary_profile", length = 50)
    private DiscProfileType primaryProfile;

    @Enumerated(EnumType.STRING)
    @Column(name = "secondary_profile", length = 50)
    private DiscProfileType secondaryProfile;

    @Column(name = "profile_description")
    private String profileDescription;

    @Column(columnDefinition = "TEXT")
    private String answers; // JSON array of answers

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private DiscAssessmentStatus status = DiscAssessmentStatus.PENDING;

    @Column(name = "requested_by")
    private UUID requestedBy;

    @Column(name = "requested_at")
    private LocalDateTime requestedAt;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Business methods
    public void start() {
        if (this.status != DiscAssessmentStatus.PENDING) {
            throw new IllegalStateException("Avaliacao DISC ja foi iniciada");
        }
        this.status = DiscAssessmentStatus.IN_PROGRESS;
    }

    public void complete(String answersJson, int d, int i, int s, int c) {
        this.answers = answersJson;
        this.dScore = d;
        this.iScore = i;
        this.sScore = s;
        this.cScore = c;
        calculateProfiles();
        this.status = DiscAssessmentStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
    }

    public void cancel() {
        this.status = DiscAssessmentStatus.CANCELLED;
    }

    public void expire() {
        if (this.status == DiscAssessmentStatus.PENDING || this.status == DiscAssessmentStatus.IN_PROGRESS) {
            this.status = DiscAssessmentStatus.EXPIRED;
        }
    }

    private void calculateProfiles() {
        int maxScore = Math.max(Math.max(dScore, iScore), Math.max(sScore, cScore));
        int secondMax = 0;

        // Find primary profile
        if (dScore == maxScore) {
            primaryProfile = DiscProfileType.DOMINANCE;
        } else if (iScore == maxScore) {
            primaryProfile = DiscProfileType.INFLUENCE;
        } else if (sScore == maxScore) {
            primaryProfile = DiscProfileType.STEADINESS;
        } else {
            primaryProfile = DiscProfileType.CONSCIENTIOUSNESS;
        }

        // Find secondary profile (second highest)
        int[] scores = {dScore, iScore, sScore, cScore};
        DiscProfileType[] types = {DiscProfileType.DOMINANCE, DiscProfileType.INFLUENCE,
                                   DiscProfileType.STEADINESS, DiscProfileType.CONSCIENTIOUSNESS};

        for (int idx = 0; idx < scores.length; idx++) {
            if (scores[idx] != maxScore && scores[idx] > secondMax) {
                secondMax = scores[idx];
                secondaryProfile = types[idx];
            }
        }

        generateProfileDescription();
    }

    private void generateProfileDescription() {
        if (primaryProfile == null) return;

        switch (primaryProfile) {
            case DOMINANCE:
                profileDescription = "Voce e focado em resultados, direto e assertivo. Gosta de desafios.";
                break;
            case INFLUENCE:
                profileDescription = "Voce e comunicativo, entusiasta e persuasivo. Gosta de interagir com pessoas.";
                break;
            case STEADINESS:
                profileDescription = "Voce e calmo, paciente e leal. Valoriza a cooperacao e a estabilidade.";
                break;
            case CONSCIENTIOUSNESS:
                profileDescription = "Voce e analitico, preciso e detalhista. Valoriza a qualidade e regras.";
                break;
        }
    }

    public boolean isOverdue() {
        return dueDate != null
            && LocalDate.now().isAfter(dueDate)
            && status != DiscAssessmentStatus.COMPLETED
            && status != DiscAssessmentStatus.CANCELLED;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public UUID getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(UUID employeeId) {
        this.employeeId = employeeId;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public UUID getQuestionnaireId() {
        return questionnaireId;
    }

    public void setQuestionnaireId(UUID questionnaireId) {
        this.questionnaireId = questionnaireId;
    }

    public Integer getDScore() {
        return dScore;
    }

    public void setDScore(Integer dScore) {
        this.dScore = dScore;
    }

    public Integer getIScore() {
        return iScore;
    }

    public void setIScore(Integer iScore) {
        this.iScore = iScore;
    }

    public Integer getSScore() {
        return sScore;
    }

    public void setSScore(Integer sScore) {
        this.sScore = sScore;
    }

    public Integer getCScore() {
        return cScore;
    }

    public void setCScore(Integer cScore) {
        this.cScore = cScore;
    }

    public DiscProfileType getPrimaryProfile() {
        return primaryProfile;
    }

    public void setPrimaryProfile(DiscProfileType primaryProfile) {
        this.primaryProfile = primaryProfile;
    }

    public DiscProfileType getSecondaryProfile() {
        return secondaryProfile;
    }

    public void setSecondaryProfile(DiscProfileType secondaryProfile) {
        this.secondaryProfile = secondaryProfile;
    }

    public String getProfileDescription() {
        return profileDescription;
    }

    public void setProfileDescription(String profileDescription) {
        this.profileDescription = profileDescription;
    }

    public String getAnswers() {
        return answers;
    }

    public void setAnswers(String answers) {
        this.answers = answers;
    }

    public DiscAssessmentStatus getStatus() {
        return status;
    }

    public void setStatus(DiscAssessmentStatus status) {
        this.status = status;
    }

    public UUID getRequestedBy() {
        return requestedBy;
    }

    public void setRequestedBy(UUID requestedBy) {
        this.requestedBy = requestedBy;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(LocalDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
