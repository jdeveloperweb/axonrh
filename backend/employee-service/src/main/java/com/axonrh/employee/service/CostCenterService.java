package com.axonrh.employee.service;

import com.axonrh.employee.config.TenantContext;
import com.axonrh.employee.dto.CostCenterDTO;
import com.axonrh.employee.entity.CostCenter;
import com.axonrh.employee.repository.CostCenterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CostCenterService {

    private final CostCenterRepository costCenterRepository;

    @Transactional(readOnly = true)
    public List<CostCenterDTO> findAllActive() {
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenant());
        List<CostCenter> costCenters = costCenterRepository.findByTenantIdAndIsActiveTrueOrderByName(tenantId);
        return costCenters.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private CostCenterDTO convertToDTO(CostCenter costCenter) {
        return CostCenterDTO.builder()
                .id(costCenter.getId())
                .code(costCenter.getCode())
                .name(costCenter.getName())
                .active(costCenter.getIsActive())
                .build();
    }
}
