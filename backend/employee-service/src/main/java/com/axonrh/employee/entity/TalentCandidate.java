package com.axonrh.employee.entity;

import com.axonrh.employee.entity.enums.CandidateSource;
import com.axonrh.employee.entity.enums.CandidateStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Entidade de candidato do banco de talentos.
 */
@Entity
@Table(name = "talent_candidates", schema = "shared")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TalentCandidate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vacancy_id", nullable = false)
    private JobVacancy vacancy;

    // Dados Pessoais
    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(name = "email", nullable = false, length = 200)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "mobile", length = 20)
    private String mobile;

    // Localização
    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 2)
    private String state;

    // Links
    @Column(name = "linkedin_url", length = 500)
    private String linkedinUrl;

    @Column(name = "portfolio_url", length = 500)
    private String portfolioUrl;

    // Currículo
    @Column(name = "resume_file_name", length = 200)
    private String resumeFileName;

    @Column(name = "resume_file_path", length = 500)
    private String resumeFilePath;

    @Column(name = "resume_file_type", length = 50)
    private String resumeFileType;

    // Dados extraídos do currículo pela IA
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "resume_parsed_data", columnDefinition = "jsonb")
    private Map<String, Object> resumeParsedData;

    // Campos específicos extraídos para busca
    @Column(name = "skills", columnDefinition = "TEXT")
    private String skills;

    @Column(name = "education", columnDefinition = "TEXT")
    private String education;

    @Column(name = "experience_summary", columnDefinition = "TEXT")
    private String experienceSummary;

    @Column(name = "certifications", columnDefinition = "TEXT")
    private String certifications;

    @Column(name = "languages", columnDefinition = "TEXT")
    private String languages;

    // Insight gerado pela IA
    @Column(name = "ai_insight", columnDefinition = "TEXT")
    private String aiInsight;

    // Status
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30)
    @Builder.Default
    private CandidateStatus status = CandidateStatus.NEW;

    @Column(name = "status_notes", columnDefinition = "TEXT")
    private String statusNotes;

    // Avaliação
    @Column(name = "rating")
    private Integer rating;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // Metadados
    @Enumerated(EnumType.STRING)
    @Column(name = "source", length = 50)
    @Builder.Default
    private CandidateSource source = CandidateSource.WEBSITE;

    @Column(name = "referral_name", length = 200)
    private String referralName;

    // Controle
    @Column(name = "applied_at")
    @Builder.Default
    private LocalDateTime appliedAt = LocalDateTime.now();

    @Column(name = "last_status_change")
    private LocalDateTime lastStatusChange;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @OneToMany(mappedBy = "candidate", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TalentCandidateHistory> statusHistory = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Atualiza o status do candidato e registra no histórico
     */
    public void updateStatus(CandidateStatus newStatus, String notes, UUID changedBy) {
        CandidateStatus previousStatus = this.status;
        this.status = newStatus;
        this.statusNotes = notes;
        this.lastStatusChange = LocalDateTime.now();

        // Adiciona ao histórico
        TalentCandidateHistory history = TalentCandidateHistory.builder()
                .tenantId(this.tenantId)
                .candidate(this)
                .previousStatus(previousStatus)
                .newStatus(newStatus)
                .notes(notes)
                .changedAt(LocalDateTime.now())
                .changedBy(changedBy)
                .build();

        this.statusHistory.add(history);
    }
}
