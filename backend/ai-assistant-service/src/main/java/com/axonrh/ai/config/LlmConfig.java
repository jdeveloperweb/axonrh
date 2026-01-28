package com.axonrh.ai.config;

import com.theokanning.openai.service.OpenAiService;
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

    @Value("${ai.openai.timeout-seconds:60}")
    private int timeoutSeconds;

    @Value("${ai.anthropic.api-key:}")
    private String anthropicApiKey;

    @Bean
    public OpenAiService openAiService() {
        if (openAiApiKey == null || openAiApiKey.isBlank()) {
            log.warn("OpenAI API key is missing. AI features relying on OpenAI will be unavailable.");
            return null;
        }
        return new OpenAiService(openAiApiKey, Duration.ofSeconds(timeoutSeconds));
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
        return WebClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader("Authorization", "Bearer " + openAiApiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }
}
