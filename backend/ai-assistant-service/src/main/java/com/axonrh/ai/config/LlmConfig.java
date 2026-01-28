package com.axonrh.ai.config;


import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

@Slf4j
@Configuration
public class LlmConfig {

    @Value("${ai.openai.api-key:}")
    private String openAiApiKey;



    @Value("${ai.anthropic.api-key:}")
    private String anthropicApiKey;



    @javax.annotation.PostConstruct
    public void init() {
        if (openAiApiKey == null || openAiApiKey.isBlank()) {
            log.warn("OpenAI API Key NÃO encontrada! As funcionalidades de IA falharão.");
        } else {
            String maskedKey = openAiApiKey.length() > 8
                    ? openAiApiKey.substring(0, 7) + "..." + openAiApiKey.substring(openAiApiKey.length() - 4)
                    : "***";
            log.info("OpenAI API Key carregada: {}", maskedKey);
        }
    }

    @Bean
    public WebClient anthropicWebClient() {
        return WebClient.builder()
                .baseUrl("https://api.anthropic.com/v1")
                .defaultHeader("x-api-key", anthropicApiKey)
                .defaultHeader("anthropic-version", "2023-06-01")
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    @Bean
    public WebClient openAiWebClient() {
        if (openAiApiKey == null || openAiApiKey.isBlank()) {
             log.error("Tentando criar OpenAI WebClient com chave vazia!");
        }
        return WebClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader("Authorization", "Bearer " + openAiApiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }
}
