package com.axonrh.ai.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayRepairConfiguration {

    @Bean
    @ConditionalOnProperty(name = "axonrh.flyway.repair-on-startup", havingValue = "true")
    public FlywayMigrationStrategy flywayRepairStrategy() {
        return flyway -> {
            flyway.repair();
            flyway.migrate();
        };
    }
}
