package com.axonrh.benefits.service;

import com.axonrh.benefits.config.TenantContext;
import com.axonrh.benefits.dto.BenefitTypeRequest;
import com.axonrh.benefits.dto.BenefitTypeResponse;
import com.axonrh.benefits.entity.BenefitType;
import com.axonrh.benefits.enums.BenefitCategory;
import com.axonrh.benefits.exception.BusinessException;
import com.axonrh.benefits.exception.ResourceNotFoundException;
import com.axonrh.benefits.mapper.BenefitTypeMapper;
import com.axonrh.benefits.repository.BenefitTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BenefitTypeService {

    private final BenefitTypeRepository benefitTypeRepository;
    private final BenefitTypeMapper benefitTypeMapper;

    private UUID getTenantId() {
        String tenant = TenantContext.getCurrentTenant();
        if (tenant == null || tenant.isBlank()) {
            throw new BusinessException("Tenant nao identificado na requisicao");
        }
        return UUID.fromString(tenant);
    }

    @Transactional
    public BenefitTypeResponse create(BenefitTypeRequest request) {
        UUID tenantId = getTenantId();
        log.info("Criando tipo de beneficio: {} para tenant: {}", request.getName(), tenantId);

        if (benefitTypeRepository.existsByTenantIdAndNameIgnoreCase(tenantId, request.getName())) {
            throw new BusinessException("Ja existe um tipo de beneficio com o nome: " + request.getName());
        }

        BenefitType entity = benefitTypeMapper.toEntity(request);
        entity.setTenantId(tenantId);
        entity.setIsActive(true);

        BenefitType saved = benefitTypeRepository.save(entity);
        log.info("Tipo de beneficio criado com ID: {}", saved.getId());

        return benefitTypeMapper.toResponse(saved);
    }

    @Transactional
    public BenefitTypeResponse update(UUID id, BenefitTypeRequest request) {
        UUID tenantId = getTenantId();
        log.info("Atualizando tipo de beneficio: {} para tenant: {}", id, tenantId);

        BenefitType entity = benefitTypeRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de beneficio nao encontrado: " + id));

        if (benefitTypeRepository.existsByTenantIdAndNameIgnoreCaseAndIdNot(tenantId, request.getName(), id)) {
            throw new BusinessException("Ja existe outro tipo de beneficio com o nome: " + request.getName());
        }

        benefitTypeMapper.updateEntity(entity, request);
        BenefitType saved = benefitTypeRepository.save(entity);

        return benefitTypeMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public BenefitTypeResponse findById(UUID id) {
        UUID tenantId = getTenantId();
        BenefitType entity = benefitTypeRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de beneficio nao encontrado: " + id));
        return benefitTypeMapper.toResponse(entity);
    }

    @Transactional(readOnly = true)
    public Page<BenefitTypeResponse> findAll(Pageable pageable) {
        UUID tenantId = getTenantId();
        return benefitTypeRepository.findByTenantId(tenantId, pageable)
                .map(benefitTypeMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<BenefitTypeResponse> findAllActive() {
        UUID tenantId = getTenantId();
        return benefitTypeRepository.findByTenantIdAndIsActiveTrue(tenantId)
                .stream()
                .map(benefitTypeMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BenefitTypeResponse> findByCategory(BenefitCategory category) {
        UUID tenantId = getTenantId();
        return benefitTypeRepository.findByTenantIdAndCategory(tenantId, category)
                .stream()
                .map(benefitTypeMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BenefitTypeResponse activate(UUID id) {
        UUID tenantId = getTenantId();
        BenefitType entity = benefitTypeRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de beneficio nao encontrado: " + id));

        entity.setIsActive(true);
        BenefitType saved = benefitTypeRepository.save(entity);
        log.info("Tipo de beneficio {} ativado", id);

        return benefitTypeMapper.toResponse(saved);
    }

    @Transactional
    public BenefitTypeResponse deactivate(UUID id) {
        UUID tenantId = getTenantId();
        BenefitType entity = benefitTypeRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de beneficio nao encontrado: " + id));

        entity.setIsActive(false);
        BenefitType saved = benefitTypeRepository.save(entity);
        log.info("Tipo de beneficio {} desativado", id);

        return benefitTypeMapper.toResponse(saved);
    }
}
