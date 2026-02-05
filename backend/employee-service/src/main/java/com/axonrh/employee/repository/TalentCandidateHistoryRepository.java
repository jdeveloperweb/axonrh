package com.axonrh.employee.repository;

import com.axonrh.employee.entity.TalentCandidateHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TalentCandidateHistoryRepository extends JpaRepository<TalentCandidateHistory, UUID> {

    // Buscar histórico por candidato
    List<TalentCandidateHistory> findByCandidateIdOrderByChangedAtDesc(UUID candidateId);

    // Buscar histórico por tenant
    List<TalentCandidateHistory> findByTenantIdOrderByChangedAtDesc(UUID tenantId);
}
