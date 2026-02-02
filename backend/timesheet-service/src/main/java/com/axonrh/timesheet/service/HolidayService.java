package com.axonrh.timesheet.service;

import com.axonrh.timesheet.entity.Holiday;
import com.axonrh.timesheet.repository.HolidayRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class HolidayService {

    private final HolidayRepository holidayRepository;
    private final EntityManager entityManager;
    private final RestTemplate restTemplate;

    @Transactional
    public int importHolidays(UUID tenantId, int year) {
        log.info("Iniciando importação de feriados para o tenant {} e ano {}", tenantId, year);
        
        // 1. Obter endereço da empresa (para feriados estaduais/municipais se disponível)
        Map<String, String> companyLocation = getCompanyLocation(tenantId);
        String state = companyLocation.get("state");
        String city = companyLocation.get("city");
        
        log.info("Localização da empresa: {} - {}", city, state);

        int count = 0;
        
        // 2. Importar Feriados Nacionais (BrasilAPI)
        count += importNationalHolidays(tenantId, year);
        
        // 3. TODO: Implementar feriados estaduais e municipais
        // Por enquanto, BrasilAPI só fornece nacionais de forma fácil.
        // Poderíamos adicionar aqui outros provedores ou uma lista estática de feriados estaduais comuns.
        
        return count;
    }

    private int importNationalHolidays(UUID tenantId, int year) {
        String url = "https://brasilapi.com.br/api/feriados/v1/" + year;
        int count = 0;
        
        try {
            log.info("Buscando feriados nacionais na BrasilAPI: {}", url);
            Map<String, Object>[] response = restTemplate.getForObject(url, Map[].class);
            
            if (response != null) {
                for (Map<String, Object> h : response) {
                    LocalDate date = LocalDate.parse((String) h.get("date"));
                    String name = (String) h.get("name");
                    
                    if (saveIfNotExist(tenantId, date, name, "NATIONAL", false)) {
                        count++;
                    }
                }
            }
        } catch (Exception e) {
            log.error("Erro ao importar feriados da BrasilAPI: {}", e.getMessage());
        }
        
        return count;
    }

    private boolean saveIfNotExist(UUID tenantId, LocalDate date, String name, String type, boolean isOptional) {
        Optional<Holiday> existing = holidayRepository.findByTenantIdAndDate(tenantId, date);
        if (existing.isEmpty()) {
            Holiday holiday = Holiday.builder()
                    .tenantId(tenantId)
                    .date(date)
                    .name(name)
                    .type(type)
                    .isOptional(isOptional)
                    .build();
            holidayRepository.save(holiday);
            return true;
        }
        return false;
    }

    private Map<String, String> getCompanyLocation(UUID tenantId) {
        Map<String, String> location = new HashMap<>();
        try {
            Query query = entityManager.createNativeQuery(
                "SELECT address_city, address_state FROM shared.company_profiles WHERE tenant_id = :tenantId"
            );
            query.setParameter("tenantId", tenantId);
            
            List<Object[]> results = query.getResultList();
            if (!results.isEmpty()) {
                Object[] row = results.get(0);
                location.put("city", (String) row[0]);
                location.put("state", (String) row[1]);
            }
        } catch (Exception e) {
            log.warn("Não foi possível obter localização da empresa: {}", e.getMessage());
        }
        return location;
    }

    public List<Holiday> listHolidays(UUID tenantId) {
        return holidayRepository.findAllByTenantId(tenantId);
    }
    
    @Transactional
    public void deleteHoliday(UUID tenantId, UUID id) {
        holidayRepository.findById(id).ifPresent(h -> {
            if (h.getTenantId().equals(tenantId)) {
                holidayRepository.delete(h);
            }
        });
    }
}
