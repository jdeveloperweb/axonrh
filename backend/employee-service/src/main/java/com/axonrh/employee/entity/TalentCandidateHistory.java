package com.axonrh.employee.entity;

import com.axonrh.employee.entity.enums.CandidateStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade de histórico de status do candidato.
 */
@Entity
@Table(name = "talent_candidate_history", schema = "shared")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TalentCandidateHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private TalentCandidate candidate;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", length = 30)
    private CandidateStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 30)
    private CandidateStatus newStatus;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "changed_at")
    @Builder.Default
    private LocalDateTime changedAt = LocalDateTime.now();

    @Column(name = "changed_by")
    private UUID changedBy;
}
