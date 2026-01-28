package com.axonrh.employee.service;

import com.axonrh.employee.config.TenantContext;
import com.axonrh.employee.entity.Department;
import com.axonrh.employee.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    @Transactional(readOnly = true)
    public List<Department> findAll() {
        UUID tenantId = TenantContext.getCurrentTenant();
        return departmentRepository.findByTenantIdAndIsActiveTrueOrderByName(tenantId);
    }
}
