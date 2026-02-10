package com.axonrh.timesheet.service;

import com.axonrh.timesheet.entity.Holiday;
import com.axonrh.timesheet.repository.HolidayRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;

import org.springframework.jdbc.core.JdbcTemplate;
import jakarta.persistence.EntityManager;
import org.springframework.dao.EmptyResultDataAccessException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class HolidayService {

    private final HolidayRepository holidayRepository;
    private final JdbcTemplate jdbcTemplate;
    private final RestTemplate restTemplate;

    @Transactional
    public int importHolidays(UUID tenantId, int year) {
        log.info("Iniciando importação de feriados para o tenant {} e ano {}", tenantId, year);
        
        try {
            // 1. Obter endereço da empresa (para feriados estaduais/municipais se disponível)
            // Feito de forma segura usando JdbcTemplate para não quebrar a transação principal se falhar
            try {
                Map<String, String> companyLocation = getCompanyLocation(tenantId);
                log.info("Localização da empresa: {} - {}", companyLocation.get("city"), companyLocation.get("state"));
            } catch (Exception e) {
                log.warn("Não foi possível obter localização da empresa: {}", e.getMessage());
            }

            // 2. Tornar a importação idempotente deletando feriados nacionais já existentes para o ano
            LocalDate startOfYear = LocalDate.of(year, 1, 1);
            LocalDate endOfYear = LocalDate.of(year, 12, 31);
            int deleted = holidayRepository.deleteByTenantIdAndTypeAndDateBetween(tenantId, "NATIONAL", startOfYear, endOfYear);
            log.info("Removidos {} feriados nacionais antigos para o ano {}", deleted, year);

            int count = importNationalHolidays(tenantId, year);
            
            log.info("Importação concluída. Total de {} feriados importados", count);
            return count;
        } catch (Exception e) {
            log.error("Erro fatal na importação de feriados: {}", e.getMessage(), e);
            throw new RuntimeException("Falha ao importar feriados: " + e.getMessage(), e);
        }
    }

    private int importNationalHolidays(UUID tenantId, int year) {
        String url = "https://brasilapi.com.br/api/feriados/v1/" + year;
        int count = 0;
        
        try {
            log.info("Buscando feriados nacionais na BrasilAPI: {}", url);
            ResponseEntity<List<Map<String, Object>>> responseEntity = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            
            List<Map<String, Object>> holidaysList = responseEntity.getBody();
            
            if (holidaysList != null && !holidaysList.isEmpty()) {
                log.info("Recebidos {} feriados da API", holidaysList.size());
                for (Map<String, Object> h : holidaysList) {
                    try {
                        LocalDate date = LocalDate.parse((String) h.get("date"));
                        String name = (String) h.get("name");
                        
                        log.debug("Processando feriado: {} em {}", name, date);
                        
                        if (saveIfNotExist(tenantId, date, name, "NATIONAL", false)) {
                            count++;
                            log.debug("Feriado {} salvo com sucesso", name);
                        } else {
                            log.debug("Feriado {} já existe, ignorando", name);
                        }
                    } catch (Exception e) {
                        log.warn("Erro ao processar feriado individual: {}", e.getMessage());
                    }
                }
                log.info("Total de {} feriados nacionais importados com sucesso", count);
            } else {
                log.warn("Nenhum feriado retornado pela BrasilAPI para o ano {}", year);
            }
        } catch (Exception e) {
            log.error("Erro ao importar feriados da BrasilAPI: {}", e.getMessage(), e);
            throw new RuntimeException("Falha ao buscar feriados da BrasilAPI: " + e.getMessage(), e);
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
            // Usando JdbcTemplate para evitar problemas com o EntityManager e transações em consultas nativas
            String sql = "SELECT address_city, address_state FROM shared.company_profiles WHERE tenant_id = ?";
            return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> {
                Map<String, String> map = new HashMap<>();
                map.put("city", rs.getString("address_city"));
                map.put("state", rs.getString("address_state"));
                return map;
            }, tenantId);
        } catch (EmptyResultDataAccessException e) {
            log.debug("Nenhum perfil de empresa encontrado para o tenant {}", tenantId);
        } catch (Exception e) {
            log.warn("Erro ao buscar localização da empresa: {}", e.getMessage());
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
