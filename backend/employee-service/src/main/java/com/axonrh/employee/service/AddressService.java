package com.axonrh.employee.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * T105 - Servico de integracao com API de CEP.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AddressService {

    @Value("${employee.address.cep-api-url:https://viacep.com.br/ws}")
    private String cepApiUrl;

    private final RestTemplate restTemplate;

    /**
     * Busca endereco pelo CEP usando API ViaCEP.
     * Resultado em cache por 24h.
     */
    @Cacheable(value = "cep-cache", key = "#cep", unless = "#result == null")
    public AddressResult findByCep(String cep) {
        if (cep == null || cep.length() != 8) {
            log.warn("CEP invalido: {}", cep);
            return null;
        }

        try {
            String url = String.format("%s/%s/json", cepApiUrl, cep);
            log.debug("Buscando CEP: {}", url);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response == null || response.containsKey("erro")) {
                log.warn("CEP nao encontrado: {}", cep);
                return null;
            }

            return AddressResult.builder()
                    .cep(cep)
                    .street((String) response.get("logradouro"))
                    .complement((String) response.get("complemento"))
                    .neighborhood((String) response.get("bairro"))
                    .city((String) response.get("localidade"))
                    .state((String) response.get("uf"))
                    .ibgeCode((String) response.get("ibge"))
                    .build();

        } catch (Exception e) {
            log.error("Erro ao buscar CEP {}: {}", cep, e.getMessage());
            return null;
        }
    }

    /**
     * Resultado da busca de endereco.
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    @lombok.Builder
    public static class AddressResult {
        private String cep;
        private String street;
        private String complement;
        private String neighborhood;
        private String city;
        private String state;
        private String ibgeCode;
    }
}
