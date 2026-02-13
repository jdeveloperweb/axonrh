package com.axonrh.integration.dynamic;

import com.axonrh.integration.dynamic.entity.IntegrationConfig;
import com.axonrh.integration.dynamic.entity.IntegrationLog;
import com.axonrh.integration.dynamic.repository.IntegrationConfigRepository;
import com.axonrh.integration.dynamic.repository.IntegrationLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DynamicIntegrationTest {

    @MockBean
    private IntegrationConfigRepository configRepository;
    @MockBean
    private IntegrationLogRepository logRepository;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @org.springframework.security.test.context.support.WithMockUser(roles = "ADMIN")
    void shouldExecuteIntegrationSuccessfully() throws Exception {
        // 1. Mock Configuração
        IntegrationConfig config = new IntegrationConfig();
        config.setName("HttpBinTest");
        config.setTargetUrl("https://httpbin.org/post");
        config.setHttpMethod("POST");
        config.setHeadersTemplate("{\"X-Test-Header\": \"${headerValue}\"}");
        config.setBodyTemplate("{\"message\": \"Hello ${name}!\"}");
        config.setActive(true);
        config.setTimeoutSeconds(10);

        org.mockito.Mockito.when(configRepository.findByName("HttpBinTest")).thenReturn(java.util.Optional.of(config));
        org.mockito.Mockito.when(logRepository.save(org.mockito.ArgumentMatchers.any(IntegrationLog.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // 2. Dados da execução
        Map<String, Object> data = Map.of(
                "name", "Integration World",
                "headerValue", "12345"
        );

        // 3. Executar via API
        mockMvc.perform(post("/api/v1/integrations/execute/HttpBinTest")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(data)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS")) // Sucesso porque httpbin retorna 200
                .andExpect(jsonPath("$.requestPayload").value("{\"message\": \"Hello Integration World!\"}"))
                .andExpect(jsonPath("$.requestHeaders").value("{\"X-Test-Header\": \"12345\"}"));
    }
}
