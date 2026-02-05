package com.axonrh.employee.entity;

import com.axonrh.employee.entity.enums.EmploymentType;
import com.axonrh.employee.entity.enums.VacancyStatus;
import com.axonrh.employee.entity.enums.VacancyType;
import com.axonrh.employee.entity.enums.WorkRegime;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Entidade de vaga de emprego.
 */
@Entity
@Table(name = "job_vacancies", schema = "shared")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobVacancy {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id", nullable = false)
    private Position position;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "responsibilities", columnDefinition = "TEXT")
    private String responsibilities;

    @Column(name = "requirements", columnDefinition = "TEXT")
    private String requirements;

    @Column(name = "benefits", columnDefinition = "TEXT")
    private String benefits;

    @Enumerated(EnumType.STRING)
    @Column(name = "vacancy_type", length = 30)
    @Builder.Default
    private VacancyType vacancyType = VacancyType.EXTERNAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type", length = 30)
    private EmploymentType employmentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_regime", length = 30)
    private WorkRegime workRegime;

    @Column(name = "location", length = 200)
    private String location;

    @Column(name = "salary_range_min", precision = 15, scale = 2)
    private BigDecimal salaryRangeMin;

    @Column(name = "salary_range_max", precision = 15, scale = 2)
    private BigDecimal salaryRangeMax;

    @Column(name = "hide_salary")
    @Builder.Default
    private Boolean hideSalary = false;

    @Column(name = "max_candidates")
    @Builder.Default
    private Integer maxCandidates = 0;

    @Column(name = "deadline")
    private LocalDate deadline;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    @Builder.Default
    private VacancyStatus status = VacancyStatus.DRAFT;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "public_code", length = 50, unique = true)
    private String publicCode;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @OneToMany(mappedBy = "vacancy", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TalentCandidate> candidates = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private UUID createdBy;

    @LastModifiedBy
    @Column(name = "updated_by")
    private UUID updatedBy;

    /**
     * Gera um código público único para a vaga
     */
    public void generatePublicCode() {
        if (this.publicCode == null) {
            // Formato: VAGA-XXXXXX (6 caracteres alfanuméricos)
            String code = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
            this.publicCode = "VAGA-" + code;
        }
    }

    /**
     * Publica a vaga
     */
    public void publish() {
        this.status = VacancyStatus.OPEN;
        this.publishedAt = LocalDateTime.now();
        generatePublicCode();
    }

    /**
     * Fecha a vaga
     */
    public void close() {
        this.status = VacancyStatus.CLOSED;
        this.closedAt = LocalDateTime.now();
    }
}
