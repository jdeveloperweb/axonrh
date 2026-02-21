package com.axonrh.employee.repository;

import com.axonrh.employee.entity.WellbeingCampaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WellbeingCampaignRepository extends JpaRepository<WellbeingCampaign, UUID> {
    List<WellbeingCampaign> findByTenantIdOrderByDateAsc(UUID tenantId);
}
