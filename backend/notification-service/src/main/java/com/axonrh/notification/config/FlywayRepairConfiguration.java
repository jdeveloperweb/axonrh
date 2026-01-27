package com.axonrh.notification.config;

import org.flywaydb.core.Flyway;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(prefix = "axonrh.flyway", name = "repair-on-startup", havingValue = "true")
public class FlywayRepairConfiguration {

    @Bean
    public FlywayMigrationStrategy flywayRepairStrategy() {
        return (Flyway flyway) -> {
            flyway.repair();
            flyway.migrate();
        };
    }
}
