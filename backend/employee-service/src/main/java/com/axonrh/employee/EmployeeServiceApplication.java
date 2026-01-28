package com.axonrh.employee;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Aplicacao principal do Employee Service.
 * Responsavel por gestao de colaboradores, departamentos e cargos.
 */
@SpringBootApplication(scanBasePackages = "com.axonrh")
@EnableCaching
@EnableJpaAuditing
@EnableKafka
@EnableAsync
@EnableJpaRepositories(basePackages = {"com.axonrh.employee.repository", "com.axonrh.kafka.dlq"})
@EntityScan(basePackages = {"com.axonrh.employee.entity", "com.axonrh.kafka.dlq"})
public class EmployeeServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(EmployeeServiceApplication.class, args);
    }

    @org.springframework.context.annotation.Bean
    public org.springframework.boot.CommandLineRunner commandLineRunner(org.springframework.context.ApplicationContext ctx) {
        return args -> {
            System.out.println(">>> [DEBUG] EmployeeServiceApplication STARTUP COMPLETE");
            System.out.println(">>> [DEBUG] Listing Request Mappings:");
            var mapping = ctx.getBean(org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping.class);
            mapping.getHandlerMethods().forEach((key, value) -> {
                System.out.println(">>> [DEBUG] Mapped: " + key + " -> " + value);
            });
        };
    }
}
