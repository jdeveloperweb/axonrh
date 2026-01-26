package com.axonrh.employee;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Aplicacao principal do Employee Service.
 * Responsavel por gestao de colaboradores, departamentos e cargos.
 */
@SpringBootApplication
@EnableCaching
@EnableJpaAuditing
@EnableKafka
@EnableAsync
public class EmployeeServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(EmployeeServiceApplication.class, args);
    }
}
